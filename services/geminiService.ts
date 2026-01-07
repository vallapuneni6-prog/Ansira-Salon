
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Staff } from "../types";

export const getAIInsights = async (invoices: Invoice[], staff: Staff[]) => {
  // Always use process.env.API_KEY directly for initialization.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const salesSummary = invoices.map(i => ({
    total: i.total,
    items: i.items.map(it => it.serviceName),
    paymentMode: i.paymentMode
  }));

  const staffList = staff.map(s => s.name);

  const prompt = `
    As a Salon Business Consultant, analyze this data and provide a concise JSON report.
    Data:
    - Recent Invoices: ${JSON.stringify(salesSummary)}
    - Staff Members: ${staffList.join(', ')}

    Return a JSON object with:
    1. performanceSummary: A short string summarizing current sales.
    2. growthTips: An array of 3 specific tips for this salon.
    3. staffSpotlight: Recommendation on which staff type might need more training or focus based on sales (if data allows, otherwise general).
  `;

  try {
    // Generate content using a response schema to ensure structured JSON output.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            performanceSummary: {
              type: Type.STRING,
              description: 'A short summary of current sales performance.',
            },
            growthTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific growth tips.',
            },
            staffSpotlight: {
              type: Type.STRING,
              description: 'Recommendation or observation about staff performance.',
            },
          },
          required: ['performanceSummary', 'growthTips', 'staffSpotlight'],
          propertyOrdering: ["performanceSummary", "growthTips", "staffSpotlight"],
        },
      }
    });

    // Access the .text property directly (do not call as a method).
    const jsonStr = response.text || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return {
      performanceSummary: "Data unavailable. Connect to API for full insights.",
      growthTips: ["Monitor busy hours", "Promote upsells", "Gather client feedback"],
      staffSpotlight: "Check individual performance logs."
    };
  }
};
