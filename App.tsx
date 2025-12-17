
import React, { useState, useMemo } from 'react';
import { SimulationParams, AxisConfig, SimulationResultPoint, getParamLabels, UnitSystem } from './types';
import ControlPanel from './components/ControlPanel';
import SimulationChart from './components/SimulationChart';
import GeminiAnalysis from './components/GeminiAnalysis';
import { runSingleSimulationStep } from './services/mathUtils';
import { Zap } from 'lucide-react';

const App: React.FC = () => {
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [showChargingEvents, setShowChargingEvents] = useState(false);

  // 1. Fixed Parameters State - Updated for Bi-Modal
  const [params, setParams] = useState<SimulationParams>({
    numEVs: 50000,
    avgRange: 400, // km
    regularDailyDist: 45, // km - Standard commute
    longTripDist: 400, // km - Occasional long trip
    longTripFrequency: 5, // % of days are long trips
    dailyDistStdDev: 20, // km
    noHomeChargerPct: 30,
    efficiency: 18, // kWh per 100 km
  });

  // 2. Axis Configuration State
  const [axisConfig, setAxisConfig] = useState<AxisConfig>({
    param: 'longTripFrequency',
    min: 0,
    max: 20,
    steps: 25,
    label: getParamLabels('metric')['longTripFrequency'],
    secondary: {
      enabled: false,
      param: 'numEVs',
      start: 50000,
      end: 100000
    }
  });

  // Conversion constants
  const KM_TO_MI = 0.621371;
  const MI_TO_KM = 1.60934;

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    const isNowImperial = newUnits === 'imperial';
    
    // Determine conversion factor
    const distFactor = isNowImperial ? KM_TO_MI : MI_TO_KM;
    const effFactor = isNowImperial ? MI_TO_KM : KM_TO_MI;

    // Helper to check if a param is distance-based
    const isDist = (p: string) => ['avgRange', 'regularDailyDist', 'longTripDist', 'dailyDistStdDev'].includes(p);
    // Helper to check if a param is efficiency
    const isEff = (p: string) => p === 'efficiency';

    const convertValue = (param: string, val: number) => {
      if (isDist(param)) return val * distFactor;
      if (isEff(param)) return val * effFactor;
      return val;
    };

    // 1. Update Fixed Params
    const newParams: SimulationParams = {
      ...params,
      avgRange: convertValue('avgRange', params.avgRange),
      regularDailyDist: convertValue('regularDailyDist', params.regularDailyDist),
      longTripDist: convertValue('longTripDist', params.longTripDist),
      dailyDistStdDev: convertValue('dailyDistStdDev', params.dailyDistStdDev),
      efficiency: convertValue('efficiency', params.efficiency)
    };

    // 2. Update Axis Range
    let newAxisMin = axisConfig.min;
    let newAxisMax = axisConfig.max;
    
    if (isDist(axisConfig.param) || isEff(axisConfig.param)) {
      newAxisMin = convertValue(axisConfig.param, axisConfig.min);
      newAxisMax = convertValue(axisConfig.param, axisConfig.max);
    }

    // 3. Update Secondary Axis Range
    let newSecStart = axisConfig.secondary.start;
    let newSecEnd = axisConfig.secondary.end;
    
    if (axisConfig.secondary.enabled && (isDist(axisConfig.secondary.param) || isEff(axisConfig.secondary.param))) {
      newSecStart = convertValue(axisConfig.secondary.param, axisConfig.secondary.start);
      newSecEnd = convertValue(axisConfig.secondary.param, axisConfig.secondary.end);
    }

    setParams(newParams);
    setUnits(newUnits);
    setAxisConfig({
      ...axisConfig,
      min: newAxisMin,
      max: newAxisMax,
      label: getParamLabels(newUnits)[axisConfig.param],
      secondary: {
        ...axisConfig.secondary,
        start: newSecStart,
        end: newSecEnd
      }
    });
  };

  // 3. Simulation Calculation
  const simulationData = useMemo(() => {
    const data: SimulationResultPoint[] = [];
    const { param, min, max, steps, secondary } = axisConfig;
    const stepSize = steps > 1 ? (max - min) / (steps - 1) : 0;
    const secStepSize = steps > 1 ? (secondary.end - secondary.start) / (steps - 1) : 0;

    for (let i = 0; i < steps; i++) {
      const currentX = min + (i * stepSize);
      
      // Start with base fixed params
      const currentParams = { ...params };

      // Apply primary variable
      // @ts-ignore - Dynamic key assignment
      currentParams[param] = currentX;

      // Apply secondary variable if enabled
      let secVal: number | undefined = undefined;
      if (secondary.enabled) {
        secVal = secondary.start + (i * secStepSize);
        // @ts-ignore - Dynamic key assignment
        currentParams[secondary.param] = secVal;
      }
      
      const result = runSingleSimulationStep(
        currentParams.numEVs,
        currentParams.avgRange,
        currentParams.regularDailyDist,
        currentParams.longTripDist,
        currentParams.longTripFrequency,
        currentParams.dailyDistStdDev,
        currentParams.noHomeChargerPct,
        currentParams.efficiency
      );

      data.push({
        xValue: currentX,
        xLabel: currentX.toFixed(param === 'numEVs' ? 0 : 1),
        secondaryValue: secVal,
        totalGridLoadMWh: result.totalMWh,
        publicChargingLoadMWh: result.publicMWh,
        homeChargingLoadMWh: result.homeMWh,
        publicChargingSessions: result.publicSessions
      });
    }
    return data;
  }, [params, axisConfig]);

  return (
    // Changed: min-h-screen instead of h-screen, removed overflow-hidden to allow scrolling in iframe
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Controls */}
      {/* Changed: h-auto on mobile, sticky on desktop to keep controls visible while scrolling */}
      <div className="lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto">
        <ControlPanel 
          params={params} 
          onParamChange={setParams}
          axisConfig={axisConfig}
          onAxisConfigChange={setAxisConfig}
          units={units}
          onToggleUnits={toggleUnits}
          showChargingEvents={showChargingEvents}
          onToggleChargingEvents={() => setShowChargingEvents(!showChargingEvents)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10 lg:static">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-secondary to-blue-600 rounded-xl shadow-lg shadow-blue-200">
               <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">EV Fleet Demand Simulator</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Strategic Grid Planning Tool</p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm text-slate-600">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fleet Size</span>
                <span className="font-bold text-slate-800 text-lg leading-none">{params.numEVs.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end border-l pl-8 border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Range</span>
                <span className="font-bold text-slate-800 text-lg leading-none">
                  {params.avgRange.toFixed(0)} <span className="text-sm font-normal text-slate-500">{units === 'metric' ? 'km' : 'mi'}</span>
                </span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {/* Changed: Removed overflow-y-auto so the window handles scrolling */}
        <div className="p-4 lg:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart takes up 2/3 width on large screens */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              <SimulationChart 
                data={simulationData} 
                axisConfig={axisConfig} 
                showChargingEvents={showChargingEvents}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Summary Stats Cards */}
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Peak Total Load</div>
                    <div className="text-3xl font-bold text-slate-800">
                      {Math.max(...simulationData.map(d => d.totalGridLoadMWh)).toFixed(1)} <span className="text-sm font-medium text-slate-400">MWh</span>
                    </div>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Peak Public Demand</div>
                    <div className="text-3xl font-bold text-red-500">
                      {Math.max(...simulationData.map(d => d.publicChargingLoadMWh)).toFixed(1)} <span className="text-sm font-medium text-red-300">MWh</span>
                    </div>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Max Public Share</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {(Math.max(...simulationData.map(d => d.publicChargingLoadMWh / d.totalGridLoadMWh)) * 100).toFixed(1)} <span className="text-sm font-medium text-blue-300">%</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="xl:col-span-1">
              <GeminiAnalysis 
                data={simulationData} 
                axisConfig={axisConfig}
                params={params}
                units={units}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
