
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getFashionAdvice = async (prompt: string, history: {role: 'user' | 'model', text: string}[]) => {
  const ai = getAI();
  const systemInstruction = `
    You are 'ClothyAI', a world-class modest fashion consultant for the Clothy app.
    Your goal is to help users find perfect outfits for renting (primary service) or buying pre-loved items.
    You specialize in Islamic fashion (Hijabs, Abayas, Thobes, etc.) but are knowledgeable in all modest styles.
    Provide styling tips, fabric advice, and occasion-specific suggestions.
    Emphasize the sustainability of renting high-end garments for special occasions.
    Keep your tone elegant, respectful, and helpful.
    If asked about non-modest clothing, gently steer the conversation back to how to style them modestly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't generate advice right now. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to connect to the fashion consultant. Please check your network.";
  }
};
