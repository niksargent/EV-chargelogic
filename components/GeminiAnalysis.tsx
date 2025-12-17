
import React, { useState, useEffect } from 'react';
import { SimulationResultPoint, AxisConfig, SimulationParams, getParamLabels, UnitSystem, SimulationParams as SimParamsInterface } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { Sparkles, Loader2, FileText, Key, ExternalLink, AlertCircle, Info, BarChart3 } from 'lucide-react';

interface Props {
  data: SimulationResultPoint[];
  axisConfig: AxisConfig;
  params: SimulationParams;
  units: UnitSystem;
}

const SAMPLE_ANALYSIS = `
[DEMO ANALYSIS]
1. Trend Analysis: Based on typical fleet scaling, we observe a linear growth in total grid load. However, the 'Public Charging' component scales exponentially as home-charging capacity reaches saturation.

2. Public vs Total: In scenarios where home-charging availability is below 40%, the grid experiences high-intensity spikes during early evening hours. Public infrastructure requirements are currently the primary bottleneck for 50k+ EV fleet sizes.

3. Strategy Recommendation: Grid operators should prioritize 'Smart Charging' incentives for residential users and focus high-speed public DC charging hubs near major transit corridors to alleviate local transformer stress.
`;

const GeminiAnalysis: React.FC<Props> = ({ data, axisConfig, params, units }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiStudioEnv, setIsAiStudioEnv] = useState(false);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    // Check if we are inside the Google AI Studio preview environment
    const isAiStudio = !!(window as any).aistudio;
    setIsAiStudioEnv(isAiStudio);

    if (isAiStudio) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected || !!process.env.API_KEY);
    } else {
      // In a live environment (like GitHub Pages), we check if a key was somehow provided
      // via process.env (rare for static sites) otherwise we assume no key.
      setHasKey(!!process.env.API_KEY);
    }
  };

  const handleConnectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // Assume success per guidelines to avoid race condition delays
      setHasKey(true);
      setErrorMessage(null);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMessage(null);
    const labels = getParamLabels(units);
    
    const fixedParamsStr = Object.entries(params)
      .filter(([key]) => key !== axisConfig.param)
      .map(([key, val]) => `${labels[key as keyof SimParamsInterface]}: ${val}`)
      .join(', ');

    const result = await getAIAnalysis(data, axisConfig.param, fixedParamsStr, units);

    if (result === "MISSING_KEY" || result === "INVALID_KEY") {
      setHasKey(false);
      setErrorMessage(result === "INVALID_KEY" ? "The selected key was invalid or expired." : "Please select an API key to continue.");
      setLoading(false);
      return;
    }

    setAnalysis(result);
    setLoading(false);
  };

  // State 1: Environment checking
  if (hasKey === null && isAiStudioEnv) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  // State 2: Live Environment (e.g. GitHub Pages) - Show High-Quality Demo Mode
  if (!isAiStudioEnv && !hasKey) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-800">AI Grid Insights</h3>
          </div>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded uppercase tracking-wider border border-purple-100">
            Demo Mode
          </span>
        </div>
        
        <div className="flex-1 bg-slate-50/50 rounded-lg p-5 border border-slate-100 overflow-y-auto">
          <div className="prose prose-sm prose-slate max-w-none opacity-70">
            {SAMPLE_ANALYSIS.trim().split('\n').map((line, i) => (
              <p key={i} className="mb-3 leading-relaxed text-slate-700 italic">{line}</p>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
          <div className="p-2 bg-blue-100 rounded-lg h-fit">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 mb-1">Live AI is Preview-Only</h4>
            <p className="text-[10px] text-blue-700 leading-normal">
              To protect billing security, interactive Gemini analysis is exclusively enabled within the Google AI Studio developer environment. This static view demonstrates the type of expert grid strategy recommendations the model provides.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Developer Environment (AI Studio) - Show Connection Trigger
  if (isAiStudioEnv && !hasKey) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-800">AI Insights</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-lg p-8 border border-dashed border-slate-200 text-center">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
            <Key className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="text-slate-800 font-bold mb-2">Connect Google Gemini</h4>
          <p className="text-xs text-slate-500 mb-8 max-w-[220px] leading-relaxed">
            To generate live expert analysis in this developer preview, please connect a Gemini API key.
          </p>
          
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> 
              <span className="text-left font-medium">{errorMessage}</span>
            </div>
          )}

          <button
            onClick={handleConnectKey}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-100 transition-all active:scale-95 flex items-center justify-center gap-2 mb-5"
          >
            <Sparkles className="w-4 h-4" />
            Connect API Key
          </button>

          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-purple-600 flex items-center gap-1.5 transition-colors font-medium"
          >
            Review Google Billing Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // State 4: Connected (Active Analysis View)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Insights
        </h3>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
            ${loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg active:scale-95'
            }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      <div className="flex-1 bg-slate-50 rounded-xl p-5 overflow-y-auto border border-slate-100">
        {analysis ? (
          <div className="prose prose-sm prose-slate max-w-none animate-in fade-in duration-700 slide-in-from-bottom-2">
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="mb-3 leading-relaxed text-slate-700">{line}</p>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-10">
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
               <FileText className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-center text-xs font-medium max-w-[200px] leading-relaxed">
              Click the button above to generate a professional grid impact analysis for this specific simulation.
            </p>
          </div>
        )}
      </div>
      
      {isAiStudioEnv && (
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleConnectKey}
            className="text-[10px] text-slate-400 hover:text-purple-600 underline font-medium"
          >
            Manage API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalysis;
