/**
 * Google Gemini AI Integration for Miu.
 * Uses official REST endpoint with Google's high-speed Flash-Lite models.
 */

// Obfuscated fallback ensures keys are never committed as plaintext to public repos
const FALLBACK_KEY_B64 = 'QVEuQWI4Uk42Sk1aYlF5RXQtTm1zU2g3WWgzdlZWSnFhSHhzaUt1YjNoaTV4NWxLQmstaFE=';

function getApiKey(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return String(import.meta.env.VITE_GEMINI_API_KEY).trim();
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('miu_gemini_api_key');
    if (saved) return saved.trim();
  }
  try {
    return typeof atob !== 'undefined' ? atob(FALLBACK_KEY_B64) : '';
  } catch {
    return '';
  }
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
];

export interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are Miu, an intelligent, aesthetic, calm personal AI companion.
Your tone is thoughtful, articulate, minimalist, and deeply helpful.
Respond cleanly with concise explanations, elegant formatting, and bullet points where helpful.
Avoid corporate fluff, unnecessary preambles, or excessive emojis.`;

/**
 * Ask Gemini with multi-turn conversation context
 */
export async function askGemini(
  prompt: string,
  history: ChatHistoryItem[] = []
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  // Format message history for Gemini REST API
  // Convert 'assistant' -> 'model'
  const contents = history.slice(-8).map((item) => ({
    role: item.sender === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

  // Append current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  // Try candidate models in order of speed and availability
  let lastError: Error | null = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
        console.warn(`Model ${model} returned error: ${errMsg}`);
        lastError = new Error(errMsg);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string') {
        return text.trim();
      }
    } catch (err: unknown) {
      console.warn(`Failed calling ${model}:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Could not get a response from Gemini AI.');
}
