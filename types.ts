
export type UnitSystem = 'metric' | 'imperial';

export interface SimulationParams {
  numEVs: number;
  avgRange: number; // km or miles
  regularDailyDist: number; // km or miles - The standard daily commute
  longTripDist: number; // km or miles - The occasional long journey
  longTripFrequency: number; // 0 to 100% - How often long trips occur
  dailyDistStdDev: number; // km or miles
  noHomeChargerPct: number; // 0 to 100
  efficiency: number; // kWh per 100 units (km or miles)
}

export type VariableParameter = keyof SimulationParams;

export interface SimulationResultPoint {
  xValue: number;
  xLabel: string; // Formatted label for the x-axis
  secondaryValue?: number; // Value of the coupled parameter if active
  totalGridLoadMWh: number;
  publicChargingLoadMWh: number;
  homeChargingLoadMWh: number;
  publicChargingSessions: number; // New metric for estimated sessions
}

export interface SecondaryAxisConfig {
  enabled: boolean;
  param: VariableParameter;
  start: number;
  end: number;
}

export interface AxisConfig {
  param: VariableParameter;
  min: number;
  max: number;
  steps: number;
  label: string;
  secondary: SecondaryAxisConfig;
}

export const getParamLabels = (units: UnitSystem): Record<VariableParameter, string> => ({
  numEVs: "Fleet Size (Number of EVs)",
  avgRange: `Average EV Range (${units === 'metric' ? 'km' : 'mi'})`,
  regularDailyDist: `Regular Daily Distance (${units === 'metric' ? 'km' : 'mi'})`,
  longTripDist: `Long Trip Distance (${units === 'metric' ? 'km' : 'mi'})`,
  longTripFrequency: "Long Trip Frequency (%)",
  dailyDistStdDev: `Distance Variance (${units === 'metric' ? 'km' : 'mi'})`,
  noHomeChargerPct: "No Home Charger (%)",
  efficiency: `Efficiency (kWh/100${units === 'metric' ? 'km' : 'mi'})`
});
