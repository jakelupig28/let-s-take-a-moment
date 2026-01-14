import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCoverArt = async (userPrompt: string): Promise<string> => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini");
    return ""; // Handle gracefully in UI
  }

  try {
    const prompt = `A minimalist, aesthetic line-art or abstract illustration for a small book cover. 
    Subject: ${userPrompt}. 
    Style: Bauhaus, line art, abstract shapes, neutral colors with one accent color, lots of whitespace, high design.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating cover art:", error);
    throw error;
  }
};
