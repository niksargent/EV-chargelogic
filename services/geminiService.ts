
import { GoogleGenAI } from "@google/genai";
import { SimulationResultPoint, VariableParameter, getParamLabels, UnitSystem } from "../types";

const processDataForPrompt = (
  data: SimulationResultPoint[],
  variableParam: VariableParameter,
  units: UnitSystem
): string => {
  const labels = getParamLabels(units);
  const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 10)) === 0);
  
  let dataStr = `Variable Parameter: ${labels[variableParam]}\n`;
  dataStr += `X, Total Load (MWh), Public Load (MWh)\n`;
  sampled.forEach(p => {
    dataStr += `${p.xValue.toFixed(1)}, ${p.totalGridLoadMWh.toFixed(1)}, ${p.publicChargingLoadMWh.toFixed(1)}\n`;
  });
  return dataStr;
};

export const getAIAnalysis = async (
  data: SimulationResultPoint[],
  variableParam: VariableParameter,
  fixedParams: string,
  units: UnitSystem
): Promise<string> => {
  try {
    // We create a fresh instance here to ensure we pick up the latest selected key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    const ai = new GoogleGenAI({ apiKey });
    const labels = getParamLabels(units);
    
    const dataSummary = processDataForPrompt(data, variableParam, units);
    
    const prompt = `
      You are an expert energy grid analyst specializing in EV infrastructure. 
      Analyze the following simulation data for Electric Vehicle electricity demand.
      
      Units: ${units === 'metric' ? 'Metric (km)' : 'Imperial (miles)'}.
      Simulated Variable: ${labels[variableParam]}.
      Contextual Parameters: ${fixedParams}.

      Data Points (X-Axis, Total Demand MWh, Public Demand MWh):
      ${dataSummary}

      Please provide a concise analysis:
      1. Trend: How does demand scale with ${labels[variableParam]}?
      2. Public vs Total: Analyze the divergence or correlation between home and public load.
      3. Strategy: What should grid operators prioritize based on this specific data?
      
      Keep it professional, data-driven, and technical.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis generated.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "API_KEY_MISSING") {
      return "MISSING_KEY";
    }
    if (error.message?.includes("Requested entity was not found")) {
      return "INVALID_KEY";
    }
    return "Unable to generate AI analysis. Please ensure you have a valid Gemini API key with billing enabled.";
  }
};
