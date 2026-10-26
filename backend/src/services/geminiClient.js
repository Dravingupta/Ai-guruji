import { GoogleGenAI } from '@google/genai';

let client;
let clientKey;
export const geminiModel = () => process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

// Lazy initialization keeps public health/auth routes available before a key is set.
// This boundary is also used by tests to avoid real provider calls.
export const geminiTransport = {
    async create(request, options) {
        const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
        if (!apiKey || /^(your_|YOUR_API_KEY)/i.test(apiKey)) {
            throw Object.assign(new Error('Gemini API key is missing'), { code: 'AI_CONFIGURATION' });
        }
        if (!client || clientKey !== apiKey) {
            client = new GoogleGenAI({ apiKey });
            clientKey = apiKey;
        }
        return client.interactions.create(request, options);
    }
};
