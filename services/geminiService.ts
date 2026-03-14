
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGemdoriAdvice = async (gameState: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 20년차 전설적인 게임 개발자 '겜돌이'입니다. 말투는 거칠지만 정이 넘치는 아저씨 개발자 톤입니다. 
      현재 탱크 게임 상황: ${gameState}. 
      플레이어에게 짧고 강렬한 팁이나 응원, 혹은 독설을 한 마디 해주세요. (한국어로, 최대 2문장)`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    return response.text || "그냥 쏴! 생각하지 말고!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "서버가 좀 아프네... 그냥 내 감각으로 싸워!";
  }
};
