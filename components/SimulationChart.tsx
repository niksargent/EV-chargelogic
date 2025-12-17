
import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps
} from 'recharts';
import { SimulationResultPoint, AxisConfig } from '../types';

interface Props {
  data: SimulationResultPoint[];
  axisConfig: AxisConfig;
  showChargingEvents: boolean;
}

// Custom Tooltip Component
const CustomTooltip: React.FC<TooltipProps<number, string> & { axisConfig: AxisConfig }> = ({ active, payload, label, axisConfig }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SimulationResultPoint;
    return (
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs font-sans">
        <div className="font-bold border-b border-slate-600 pb-2 mb-2">
          {axisConfig.label}: {data.xLabel}
          {axisConfig.secondary.enabled && data.secondaryValue !== undefined && (
            <div className="text-purple-300 font-normal mt-1">
              Coupled Var: {data.secondaryValue.toFixed(0)}
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Total Grid Demand
            </span>
            <span className="font-mono font-bold">{data.totalGridLoadMWh.toFixed(1)} MWh</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Public Charging
            </span>
            <span className="font-mono font-bold text-red-400">{data.publicChargingLoadMWh.toFixed(1)} MWh</span>
          </div>

           <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-slate-700">
            <span className="flex items-center gap-2 text-yellow-400">
               {/* Use a simple dash icon for the line representation */}
              <span className="w-3 h-0.5 border-t-2 border-dashed border-yellow-400"></span>
              Est. Charging Events
            </span>
            <span className="font-mono font-bold text-yellow-400">
              {Math.round(data.publicChargingSessions).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const SimulationChart: React.FC<Props> = ({ data, axisConfig, showChargingEvents }) => {
  return (
    <div className="w-full h-[450px] lg:h-[550px] bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Demand Simulation</h3>
          <p className="text-sm text-slate-500 mt-1">
            Varying <span className="font-semibold text-blue-600">{axisConfig.label}</span>
            {axisConfig.secondary.enabled && (
              <> & <span className="font-semibold text-purple-600">Coupled Variable</span></>
            )}
          </p>
        </div>
        {axisConfig.secondary.enabled && (
          <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium border border-purple-100">
            Coupled Mode Active
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPublic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="xValue" 
              label={{ value: axisConfig.label, position: 'insideBottom', offset: -10, fill: '#64748b' }} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val.toFixed(1)}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Daily Energy (MWh)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b' }} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            {showChargingEvents && (
               <YAxis
                 yAxisId="right"
                 orientation="right"
                 label={{ value: 'Est. Daily Sessions', angle: 90, position: 'insideRight', offset: 10, fill: '#eab308' }}
                 tick={{ fontSize: 11, fill: '#eab308' }}
                 axisLine={false}
                 tickLine={false}
                 tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toString()}
               />
            )}
            <Tooltip 
              content={<CustomTooltip axisConfig={axisConfig} />}
            />
            <Legend verticalAlign="top" height={36} iconType="circle"/>
            
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="totalGridLoadMWh" 
              name="Total Grid Demand" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              strokeWidth={2}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="publicChargingLoadMWh" 
              name="Public Charging Demand" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorPublic)" 
              strokeWidth={2}
            />
            
            {showChargingEvents && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="publicChargingSessions"
                name="Est. Charging Events"
                stroke="#eab308"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#eab308' }}
                activeDot={{ r: 5 }}
              />
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimulationChart;
