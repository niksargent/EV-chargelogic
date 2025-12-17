
/**
 * Standard Normal Probability Density Function
 */
function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Standard Normal Cumulative Distribution Function
 */
function cdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error Function Approximation (Abramowitz and Stegun)
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/**
 * Calculates the expected value of max(0, X - limit) where X is normally distributed N(mu, sigma).
 * This represents the "overflow" distance (e.g., miles driven beyond battery range).
 */
export function calculateExpectedOverflow(mu: number, sigma: number, limit: number): number {
  if (sigma === 0) {
    return Math.max(0, mu - limit);
  }
  
  const alpha = (limit - mu) / sigma;
  // Expected loss E[(X - L)+] = sigma * (pdf(alpha) - alpha * (1 - cdf(alpha)))
  
  const val = sigma * (pdf(alpha) - alpha * (1 - cdf(alpha)));
  return Math.max(0, val);
}

/**
 * Run a single point simulation based on bi-modal driving patterns
 */
export function runSingleSimulationStep(
  numEVs: number,
  avgRange: number,
  regularDist: number,
  longTripDist: number,
  longTripFreq: number, // Percent 0-100
  distStdDev: number,
  noHomeChargerPct: number,
  efficiencyParam: number
): { totalMWh: number; publicMWh: number; homeMWh: number; publicSessions: number } {
  
  const efficiency = efficiencyParam / 100.0; // kWh per unit distance
  const freq = longTripFreq / 100.0;
  const regularProb = 1 - freq;

  const homeChargerCount = numEVs * (1 - noHomeChargerPct / 100);
  const noChargerCount = numEVs * (noHomeChargerPct / 100);

  // --- 1. Group A: Have Home Chargers ---
  // Behavior: Charge at home unless range exceeded.
  
  // Scenario 1: Regular Day
  const regDistA = homeChargerCount * regularDist;
  const regOverflowPerCar = calculateExpectedOverflow(regularDist, distStdDev, avgRange);
  const regPublicDistA = homeChargerCount * regOverflowPerCar;

  // Scenario 2: Long Trip Day
  const longDistA = homeChargerCount * longTripDist;
  const longOverflowPerCar = calculateExpectedOverflow(longTripDist, distStdDev, avgRange);
  const longPublicDistA = homeChargerCount * longOverflowPerCar;

  // Weighted Average for Group A
  // Total Distance (Energy) = (Regular * Prob) + (Long * Prob)
  const totalEnergyA = ((regDistA * regularProb) + (longDistA * freq)) * efficiency;
  
  // Public Portion = (RegOverflow * Prob + LongOverflow * Prob)
  const publicEnergyA = ((regPublicDistA * regularProb) + (longPublicDistA * freq)) * efficiency;
  
  const homeEnergyA = Math.max(0, totalEnergyA - publicEnergyA);


  // --- 2. Group B: No Home Chargers ---
  // Behavior: All energy is public.
  
  const regDistB = noChargerCount * regularDist;
  const longDistB = noChargerCount * longTripDist;
  
  // Weighted Average for Group B
  const totalEnergyB = ((regDistB * regularProb) + (longDistB * freq)) * efficiency;
  
  // Aggregation
  const totalGridDemandkWh = totalEnergyA + totalEnergyB;
  const publicChargingDemandkWh = publicEnergyA + totalEnergyB; // All of B is public
  const homeChargingDemandkWh = homeEnergyA;


  // --- 3. Session Count Estimation ---

  // Group A Sessions (Only when range exceeded)
  // P(X > range) for Regular days
  let probExceedReg = 0;
  if (distStdDev > 0) {
    probExceedReg = 1 - cdf((avgRange - regularDist) / distStdDev);
  } else {
    probExceedReg = regularDist > avgRange ? 1 : 0;
  }

  // P(X > range) for Long Trip days
  let probExceedLong = 0;
  if (distStdDev > 0) {
    probExceedLong = 1 - cdf((avgRange - longTripDist) / distStdDev);
  } else {
    probExceedLong = longTripDist > avgRange ? 1 : 0;
  }

  const sessionsA = homeChargerCount * ((probExceedReg * regularProb) + (probExceedLong * freq));

  // Group B Sessions (Routine charging)
  // Estimated by Total Distance / Effective Session Size
  const effectiveSessionDist = avgRange * 0.6; // Assuming 60% charge
  
  let sessionsB = 0;
  if (effectiveSessionDist > 0) {
    // Weighted average of distance driven by group B
    const totalDistB = (regDistB * regularProb) + (longDistB * freq);
    sessionsB = totalDistB / effectiveSessionDist;
  }
  
  const totalPublicSessions = sessionsA + sessionsB;

  return {
    totalMWh: totalGridDemandkWh / 1000,
    publicMWh: publicChargingDemandkWh / 1000,
    homeMWh: homeChargingDemandkWh / 1000,
    publicSessions: totalPublicSessions
  };
}
