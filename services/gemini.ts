import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CharacterProfile, UserTraits } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Updated to use the thinking model for complex creative tasks
const TEXT_MODEL = "gemini-3-pro-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

const profileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative title + name (e.g. 'The Strategist Young-soo')" },
    baseName: { type: Type.STRING, description: "Just the character name (e.g. 'Young-soo', 'Ok-soon')" },
    catchphrase: { type: Type.STRING, description: "A short, funny quote that represents them" },
    description: { type: Type.STRING, description: "A witty paragraph describing their dating style in the show" },
    famousLine: { type: Type.STRING, description: "A parody of a famous line from the show" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 key strengths" },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 key weaknesses" },
    visualDescription: { type: Type.STRING, description: "A short English description of their face/style for an image generator (e.g., 'A handsome Korean man in a suit, sharp glasses, serious expression')." },
    strategy: { type: Type.STRING, description: "Strategic advice on how this character can become a final couple (e.g. 'Focus on one person', 'Don't drink too much')." },
    idealPartner: { type: Type.STRING, description: "The specific type of partner that suits them best (e.g. 'A calm Young-chul', 'A rich Young-sook')." },
    successRate: { type: Type.INTEGER, description: "The probability (0-100) of successfully becoming a couple." },
    idealPartnerVisualDescription: { type: Type.STRING, description: "Visual description of the ideal partner in English." },
  },
  required: ["name", "baseName", "catchphrase", "description", "famousLine", "strengths", "weaknesses", "visualDescription", "strategy", "idealPartner", "successRate", "idealPartnerVisualDescription"],
};

export const analyzePersonality = async (traits: UserTraits, gender: 'male' | 'female'): Promise<CharacterProfile> => {
  const genderTerm = gender === 'male' ? "Male" : "Female";
  const partnerGenderTerm = gender === 'male' ? "Female" : "Male";
  const maleNames = "Young-soo, Young-ho, Young-sik, Young-chul, Kwang-soo, Sang-chul, Kyung-soo";
  const femaleNames = "Young-sook, Jung-sook, Sun-ja, Young-ja, Ok-soon, Hyun-sook, Jung-ja";
  const targetNames = gender === 'male' ? maleNames : femaleNames;

  const prompt = `
    You are a casting director and narrator for the Korean dating reality show "I Am Solo" (나는 솔로).
    
    User Profile:
    - Gender: ${genderTerm}
    - Aggressiveness: ${traits.aggressiveness}/50
    - Empathy: ${traits.empathy}/50
    - Realism: ${traits.realism}/50
    - Humor: ${traits.humor}/50
    - Style: ${traits.style}/50

    Task:
    Assign the user a specific "I Am Solo" character name from this list ONLY: [${targetNames}].
    
    Naming Logic Guide:
    - Kwang-soo / Ok-soon: Unique, professional, maybe quirky or stylish. High Aggressiveness or Style.
    - Young-soo / Jung-sook: Eldest vibe, serious, realistic, stable. High Realism.
    - Sang-chul / Sun-ja: Cheerful, friendly, sometimes oblivious. High Empathy or Humor.
    - Young-ho / Young-ja: Active, emotional, trendy.
    - Young-chul / Young-sook: Strong willed, direct, sometimes villainous or very popular.
    
    Create a detailed persona. The tone should be witty, slightly biting, but fun, like the show's commentators (Defconn, Yi-kyung).
    The language MUST be Korean (Hangul), except for the 'visualDescription' and 'idealPartnerVisualDescription' fields which must be in English.
    
    IMPORTANT: 
    - The 'visualDescription' must clearly specify a Korean ${genderTerm} in their 30s or 40s.
    - The 'idealPartnerVisualDescription' must clearly specify a Korean ${partnerGenderTerm} (the opposite gender).
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: profileSchema,
        thinkingConfig: { thinkingBudget: 32768 }, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text) as CharacterProfile;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback data
    const fallbackName = gender === 'male' ? "오류난 광수" : "오류난 옥순";
    const fallbackBase = gender === 'male' ? "광수" : "옥순";
    
    return {
      name: fallbackName,
      baseName: fallbackBase,
      catchphrase: "서버가... 터졌나요?",
      description: "AI 분석 중 오류가 발생했습니다. 하지만 당신은 분명 매력적인 사람일 겁니다.",
      famousLine: "지금 이 상황, 나만 불편해?",
      strengths: ["인내심", "관용", "재시도 능력"],
      weaknesses: ["운", "와이파이"],
      visualDescription: `A silhouette of a Korean ${genderTerm}`,
      strategy: "다시 시도해보는 것이 좋겠습니다.",
      idealPartner: "개발자",
      successRate: 0,
      idealPartnerVisualDescription: `A silhouette of a Korean ${partnerGenderTerm}`
    };
  }
};

export const generateCharacterPortrait = async (visualDescription: string, gender: 'male' | 'female'): Promise<string | undefined> => {
  try {
    // Enforce gender in the image prompt to prevent mismatches
    const genderPrompt = gender === 'male' ? "Korean man" : "Korean woman";
    const prompt = `A realistic high-quality portrait of a ${genderPrompt} dating show contestant. ${visualDescription}. Soft lighting, broadcast camera quality, 4k, looking at camera.`;
    
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return undefined;
  }
}

const matchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    matchScore: { type: Type.INTEGER, description: "Percentage 0-100" },
    scenario: { type: Type.STRING, description: "A short story of their first date" },
    verdict: { type: Type.STRING, description: "Final verdict (e.g., Marriage Material, Toxic Relationship)" },
  },
  required: ["matchScore", "scenario", "verdict"],
};

export const analyzeMatch = async (myProfile: CharacterProfile, partnerName: string): Promise<{ matchScore: number, scenario: string, verdict: string }> => {
  const prompt = `
    Analyze the compatibility between two "I Am Solo" characters.
    Character A (User): ${myProfile.name} (${myProfile.description})
    Character B (Partner): ${partnerName} (Assume the stereotypical traits of this name in the show).
    
    Write a funny compatibility report in Korean.
    How would their random date go?
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: matchSchema,
        thinkingConfig: { thinkingBudget: 32768 }, 
      },
    });
     const text = response.text;
     if(!text) throw new Error("No text");
     return JSON.parse(text);
  } catch (error) {
    return {
        matchScore: 50,
        scenario: "데이터 분석에 실패하여 랜덤 데이트가 취소되었습니다.",
        verdict: "알 수 없음"
    }
  }
};