
import React from 'react';
import { AxisConfig, getParamLabels, SimulationParams, UnitSystem, VariableParameter } from '../types';
import { Settings, Play, Info, GitMerge, Ruler, Eye, Car } from 'lucide-react';

interface Props {
  params: SimulationParams;
  onParamChange: (newParams: SimulationParams) => void;
  axisConfig: AxisConfig;
  onAxisConfigChange: (newConfig: AxisConfig) => void;
  units: UnitSystem;
  onToggleUnits: () => void;
  showChargingEvents: boolean;
  onToggleChargingEvents: () => void;
}

const ControlPanel: React.FC<Props> = ({ 
  params, 
  onParamChange, 
  axisConfig, 
  onAxisConfigChange,
  units,
  onToggleUnits,
  showChargingEvents,
  onToggleChargingEvents
}) => {
  const labels = getParamLabels(units);
  const isMetric = units === 'metric';

  // Define ranges based on unit system
  const ranges: Record<VariableParameter, { min: number; max: number; step: number }> = {
    numEVs: { min: 1000, max: 1000000, step: 1000 },
    avgRange: { min: isMetric ? 50 : 30, max: isMetric ? 1200 : 800, step: 10 },
    regularDailyDist: { min: isMetric ? 5 : 3, max: isMetric ? 150 : 100, step: 1 },
    longTripDist: { min: isMetric ? 100 : 60, max: isMetric ? 1000 : 600, step: 10 },
    longTripFrequency: { min: 0, max: 25, step: 0.1 },
    dailyDistStdDev: { min: 1, max: isMetric ? 150 : 100, step: 1 },
    noHomeChargerPct: { min: 0, max: 100, step: 1 },
    efficiency: { min: isMetric ? 10 : 15, max: isMetric ? 40 : 65, step: 0.1 }
  };

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    onParamChange({ ...params, [key]: value });
  };

  const handleAxisParamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParam = e.target.value as VariableParameter;
    const range = ranges[newParam];

    onAxisConfigChange({
      ...axisConfig,
      param: newParam,
      min: range.min,
      max: range.max,
      label: labels[newParam],
      secondary: {
        ...axisConfig.secondary,
        enabled: axisConfig.secondary.param === newParam ? false : axisConfig.secondary.enabled
      }
    });
  };

  const handleSecondaryParamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParam = e.target.value as VariableParameter;
    const range = ranges[newParam];
    onAxisConfigChange({
      ...axisConfig,
      secondary: {
        ...axisConfig.secondary,
        param: newParam,
        start: range.min,
        end: range.max
      }
    });
  };

  const drivingParams: VariableParameter[] = ['regularDailyDist', 'longTripDist', 'longTripFrequency', 'dailyDistStdDev'];
  const fleetParams: VariableParameter[] = ['numEVs', 'avgRange', 'noHomeChargerPct', 'efficiency'];

  const renderSlider = (paramKey: VariableParameter) => {
    // Skip if it is the primary axis
    if (paramKey === axisConfig.param) return null;
    // Skip if it is the secondary axis AND secondary is enabled
    if (axisConfig.secondary.enabled && paramKey === axisConfig.secondary.param) return null;

    const range = ranges[paramKey];
    const label = labels[paramKey];

    return (
      <div key={paramKey}>
        <div className="flex justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-600 truncate pr-2" title={label}>{label}</label>
          <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
            {params[paramKey].toFixed(paramKey === 'longTripFrequency' || paramKey === 'efficiency' ? 1 : 0)}
            {paramKey === 'longTripFrequency' ? '%' : ''}
          </span>
        </div>
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={params[paramKey]}
          onChange={(e) => handleParamChange(paramKey, Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600 hover:accent-slate-700 transition-all"
        />
      </div>
    );
  };

  return (
    <div className="w-full lg:w-96 bg-white border-r border-slate-200 h-full overflow-y-auto flex flex-col shadow-xl z-20">
      
      {/* Header & Unit Switch */}
      <div className="p-6 bg-primary text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-secondary" />
            <h2 className="font-bold text-lg">Model Controls</h2>
          </div>
          <button 
            onClick={onToggleUnits}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Ruler className="w-3.5 h-3.5 text-secondary" />
            {units === 'metric' ? 'Metric (km)' : 'Imp (mi)'}
          </button>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          Configure driving patterns and fleet specs. Use the X-Axis to define variables.
        </p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* Primary Axis Configuration */}
        <section className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Primary X-Axis Variable
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-800 mb-1">Parameter</label>
              <select 
                value={axisConfig.param}
                onChange={handleAxisParamSelect}
                className="w-full p-2 text-sm border border-blue-200 rounded-md bg-white focus:ring-2 focus:ring-secondary outline-none"
              >
                {Object.entries(labels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-blue-800 mb-1">Start Value</label>
                <input 
                  type="number" 
                  value={axisConfig.min}
                  onChange={(e) => onAxisConfigChange({...axisConfig, min: Number(e.target.value)})}
                  className="w-full p-2 text-sm border border-blue-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-800 mb-1">End Value</label>
                <input 
                  type="number" 
                  value={axisConfig.max}
                  onChange={(e) => onAxisConfigChange({...axisConfig, max: Number(e.target.value)})}
                  className="w-full p-2 text-sm border border-blue-200 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs text-blue-800">Simulation Resolution</label>
                <span className="text-xs font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{axisConfig.steps} points</span>
              </div>
              <input 
                  type="range" 
                  min="5" max="100" 
                  value={axisConfig.steps}
                  onChange={(e) => onAxisConfigChange({...axisConfig, steps: Number(e.target.value)})}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
          </div>
        </section>

        {/* Secondary Axis Configuration */}
        <section className={`p-4 rounded-xl border transition-all duration-300 ${axisConfig.secondary.enabled ? 'bg-purple-50 border-purple-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${axisConfig.secondary.enabled ? 'text-purple-900' : 'text-slate-500'}`}>
              <GitMerge className="w-4 h-4" />
              Coupled Secondary Variable
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={axisConfig.secondary.enabled}
                onChange={(e) => onAxisConfigChange({
                  ...axisConfig, 
                  secondary: { ...axisConfig.secondary, enabled: e.target.checked }
                })} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          
          {axisConfig.secondary.enabled && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-purple-700 italic">
                Changes linearly from start to end with the X-Axis.
              </p>
              <div>
                <label className="block text-xs font-semibold text-purple-800 mb-1">Secondary Parameter</label>
                <select 
                  value={axisConfig.secondary.param}
                  onChange={handleSecondaryParamSelect}
                  className="w-full p-2 text-sm border border-purple-200 rounded-md bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {Object.entries(labels).map(([key, label]) => (
                    key !== axisConfig.param && <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-purple-800 mb-1">Start Value</label>
                  <input 
                    type="number" 
                    value={axisConfig.secondary.start}
                    onChange={(e) => onAxisConfigChange({
                      ...axisConfig, 
                      secondary: { ...axisConfig.secondary, start: Number(e.target.value) }
                    })}
                    className="w-full p-2 text-sm border border-purple-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-purple-800 mb-1">End Value</label>
                  <input 
                    type="number" 
                    value={axisConfig.secondary.end}
                    onChange={(e) => onAxisConfigChange({
                      ...axisConfig, 
                      secondary: { ...axisConfig.secondary, end: Number(e.target.value) }
                    })}
                    className="w-full p-2 text-sm border border-purple-200 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Fixed Parameters Section: Driving Behavior */}
        <section>
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-500"/> 
            Driving Behavior
          </h3>
          <div className="space-y-6">
            {drivingParams.map(renderSlider)}
          </div>
        </section>

        {/* Fixed Parameters Section: Fleet & Tech */}
        <section>
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500"/>
            Fleet & Technology
          </h3>
          <div className="space-y-6">
            {fleetParams.map(renderSlider)}
          </div>
        </section>

        {/* Display Options Section */}
        <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
           <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            Chart Display
          </h3>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">Show Charging Events</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showChargingEvents}
                onChange={onToggleChargingEvents}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        </section>

        <div className="bg-slate-100 p-3 rounded text-xs text-slate-500 flex items-start gap-2 border border-slate-200">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
          <p>
            The model now simulates two distinct behaviors: standard daily driving and occasional long trips. Public charging demand is weighted based on the frequency of these long trips.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;
