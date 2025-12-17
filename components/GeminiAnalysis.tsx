
import React, { useState, useEffect } from 'react';
import { SimulationResultPoint, AxisConfig, SimulationParams, getParamLabels, UnitSystem, SimulationParams as SimParamsInterface } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { Sparkles, Loader2, FileText, Key, ExternalLink, AlertCircle } from 'lucide-react';

interface Props {
  data: SimulationResultPoint[];
  axisConfig: AxisConfig;
  params: SimulationParams;
  units: UnitSystem;
}

const GeminiAnalysis: React.FC<Props> = ({ data, axisConfig, params, units }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      // If process.env.API_KEY exists (e.g. from local environment), we count that too
      setHasKey(selected || !!process.env.API_KEY);
    } else {
      setHasKey(!!process.env.API_KEY);
    }
  };

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success and proceed per guidelines to avoid race condition
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
      setErrorMessage(result === "INVALID_KEY" ? "The selected key was invalid or expired." : null);
      setLoading(false);
      return;
    }

    setAnalysis(result);
    setLoading(false);
  };

  // State 1: Loading initial key status
  if (hasKey === null) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  // State 2: No Key (Needs Connection)
  if (!hasKey) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-800">AI Insights</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-lg p-6 border border-dashed border-slate-200 text-center">
          <Key className="w-10 h-10 text-slate-300 mb-3" />
          <h4 className="text-slate-800 font-bold mb-2">Connect Google Gemini</h4>
          <p className="text-xs text-slate-500 mb-6 max-w-[200px]">
            To generate expert analysis, connect your Google AI Studio API key. 
          </p>
          
          {errorMessage && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-[10px] rounded flex items-center gap-1.5 border border-red-100">
              <AlertCircle className="w-3 h-3" /> {errorMessage}
            </div>
          )}

          <button
            onClick={handleConnectKey}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Connect API Key
          </button>

          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-purple-600 flex items-center gap-1 transition-colors"
          >
            Learn about billing & keys <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    );
  }

  // State 3: Key Available (Analysis View)
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
            ${loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
            }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      <div className="flex-1 bg-slate-50 rounded-lg p-4 overflow-y-auto border border-slate-100">
        {analysis ? (
          <div className="prose prose-sm prose-slate max-w-none">
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="mb-2 leading-relaxed text-slate-700">{line}</p>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <FileText className="w-10 h-10 opacity-20" />
            <p className="text-center text-sm max-w-xs">
              Click the button to generate a professional grid impact analysis for this scenario.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex justify-end">
        <button 
          onClick={handleConnectKey}
          className="text-[10px] text-slate-400 hover:text-purple-600 underline"
        >
          Change API Key
        </button>
      </div>
    </div>
  );
};

export default GeminiAnalysis;
