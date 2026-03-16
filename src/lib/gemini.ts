import { GoogleGenAI, Type } from "@google/genai";
import { Asset } from "../types";
import { v4 as uuidv4 } from 'uuid';

export async function analyzeScript(scriptText: string): Promise<Asset[]> {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('请在设置中配置 Gemini API Key');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `请分析以下剧本或文本，提取出所有的人物（角色）、场景和道具。
    
剧本内容:
${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "资产类型，必须是 'character', 'scene', 或 'prop'",
              enum: ['character', 'scene', 'prop']
            },
            name: {
              type: Type.STRING,
              description: "资产名称（例如：张三、咖啡厅、手枪）"
            },
            episodes: {
              type: Type.STRING,
              description: "出现的集数或场次（例如：第一集、第3场）"
            },
            description: {
              type: Type.STRING,
              description: "资产描述（例如：性格特征、场景氛围、道具外观）"
            },
            originalText: {
              type: Type.STRING,
              description: "剧本中关于该资产的原文摘录"
            }
          },
          required: ["type", "name", "description"]
        }
      }
    }
  });

  const jsonStr = response.text?.trim() || '[]';
  try {
    const rawAssets = JSON.parse(jsonStr);
    return rawAssets.map((a: any) => ({
      id: uuidv4(),
      type: a.type,
      name: a.name,
      episodes: a.episodes || '',
      description: a.description || '',
      originalText: a.originalText || '',
      candidates: [],
      actorCandidates: []
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error('解析 AI 响应失败');
  }
}
