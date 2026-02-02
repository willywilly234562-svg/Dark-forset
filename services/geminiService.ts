import { GoogleGenAI, Type } from "@google/genai";
import { Item, ItemRarity, ItemType } from "../types";

// Helper to get AI instance safely with provided key
const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

const uuid = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const SYSTEM_INSTRUCTION_RIDDLE = `
You are the Guardian of the Ancient Vault in a fantasy RPG. 
Your task is to challenge the player with a riddle to prove their worthiness.
The answer should be a single common noun (e.g., "Shadow", "Mirror", "Time", "Fire").
Do not reveal the answer in the riddle.
`;

const SYSTEM_INSTRUCTION_VERIFIER = `
You are the Arbiter of Truth. You check if a user's answer to a riddle is correct.
Be lenient with synonyms.
`;

const SYSTEM_INSTRUCTION_SMITH = `
You are the Celestial Blacksmith. You forge legendary equipment for heroes.
Generate balanced but powerful RPG items.
`;

export const generateRiddle = async (difficulty: 'EASY' | 'MEDIUM' | 'HARD', apiKey: string): Promise<string> => {
  if (!apiKey) return "API Key is missing. Please configure it in settings.";
  
  try {
    const ai = getAI(apiKey);
    const prompt = `Generate a ${difficulty.toLowerCase()} fantasy riddle. The answer must be a single word. Output ONLY the riddle text.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_RIDDLE,
        temperature: 0.8,
      }
    });

    return response.text?.trim() || "The spirits are silent... (Error generating riddle)";
  } catch (error) {
    console.error("Gemini Riddle Error:", error);
    return "The ancient texts are unreadable. (Check API Key)";
  }
};

export const verifyRiddleAnswer = async (riddle: string, userAnswer: string, apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;

  try {
    const ai = getAI(apiKey);
    const prompt = `
      Riddle: "${riddle}"
      User Answer: "${userAnswer}"
      
      Is the user's answer correct? Consider synonyms and thematic fit.
      Respond with strictly JSON: { "correct": boolean }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_VERIFIER,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correct: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return !!json.correct;
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return false;
  }
};

export const generateLegendaryItem = async (level: number, apiKey: string): Promise<Item> => {
  if (!apiKey) {
      return {
          id: uuid(),
          name: "Keyless Blade",
          type: ItemType.WEAPON,
          rarity: ItemRarity.COMMON,
          description: "A dull blade. You need an API Key to forge legends.",
          stats: { attack: 1 },
          value: 0
      };
  }

  try {
    const ai = getAI(apiKey);
    // Scaling logic for prompt
    const powerScale = level * 5 + 10; 
    
    const prompt = `Forge a legendary item suitable for a level ${level} hero.
    It should have high stats (roughly sum of stats = ${powerScale}).
    It can be a Weapon, Armor, or Accessory.
    Make the name epic and the description flavorful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_SMITH,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['WEAPON', 'ARMOR', 'ACCESSORY'] },
            description: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                attack: { type: Type.INTEGER },
                defense: { type: Type.INTEGER },
                hpBonus: { type: Type.INTEGER },
              }
            },
            value: { type: Type.INTEGER }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      id: uuid(),
      name: data.name || "Unknown Artifact",
      type: data.type as ItemType,
      rarity: ItemRarity.LEGENDARY,
      description: data.description || "An item of unknown origin.",
      stats: data.stats || { attack: 5 },
      value: data.value || 100
    };

  } catch (error) {
    console.error("Gemini Smithing Error:", error);
    // Fallback item
    return {
      id: uuid(),
      name: "Glitch Blade",
      type: ItemType.WEAPON,
      rarity: ItemRarity.EPIC,
      description: "Forged from the fragments of a failed API call.",
      stats: { attack: 10, hpBonus: -5 },
      value: 0
    };
  }
};
