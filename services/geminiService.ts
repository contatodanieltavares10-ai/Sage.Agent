
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { KeywordMetric, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSEOChatResponse = async (messages: ChatMessage[]) => {
  const model = "gemini-3-flash-preview";
  
  const contents = messages.map(m => {
    const parts: any[] = [{ text: m.content }];
    
    if (m.attachments) {
      m.attachments.forEach(att => {
        parts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }

    return {
      role: m.role,
      parts
    };
  });

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: "Você é o Sage. Sua especialidade principal é SEO e Engenharia Frontend, mas você é um assistente versátil e deve responder de acordo com o que o usuário perguntar, sobre QUALQUER assunto ou tópico, sem restrições de tema. Você agora é capaz de analisar imagens e arquivos (como PDFs). Se o usuário enviar um arquivo ou imagem, analise-o no contexto da pergunta. REGRAS DE FORMATAÇÃO CRÍTICAS: 1. Responda DIRETAMENTE, sem saudações desnecessárias. 2. JAMAIS use listas com pontos, tópicos ou barras. 3. Organize sua resposta exclusivamente em parágrafos. Agrupe as informações de dois em dois parágrafos, inserindo uma separação clara entre esses grupos. 4. Para CÓDIGO, gere blocos completos e separados do texto explicativo. Se houver mais de um arquivo ou tecnologia (ex: HTML e CSS), gere blocos de código distintos para cada um. 5. Use parágrafos de texto corrido para explicar a lógica ou estratégias entre os blocos de código. 6. JAMAIS envie objetos JSON do Schema.org (como @context ou @type) de forma espontânea, a menos que o usuário peça especificamente por 'Código de Schema Markup'.",
      temperature: 0.7,
    }
  });

  return response.text;
};

export const analyzeKeywords = async (query: string): Promise<{ keywords: KeywordMetric[], sources: any[] }> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analise profundamente a palavra-chave ou tópico: "${query}". 
  Gere uma lista massiva de 50 palavras-chave relacionadas. 
  Para cada uma, forneça: volume de busca mensal estimado, dificuldade de SEO (0-100), intenção de busca (Informacional, Navegacional, Transacional ou Comercial) e uma breve explicação técnica do porquê dessa intenção.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                volume: { type: Type.NUMBER },
                difficulty: { type: Type.NUMBER },
                intent: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["keyword", "volume", "difficulty", "intent", "explanation"]
            }
          }
        },
        required: ["keywords"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      keywords: data.keywords || [],
      sources
    };
  } catch (e) {
    console.error("Failed to parse keyword response", e);
    return { keywords: [], sources: [] };
  }
};
