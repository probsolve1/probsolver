import { useModeContext } from '@/contexts/ModeContext';

export const useGeminiAPI = () => {
  const { getSystemInstruction, conversationHistory } = useModeContext();
  // TEMPORARY: Using hardcoded API key for demo (like your HTML file)
  // WARNING: This exposes the API key to users - only use for demos!
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';

  const callGeminiAPI = async (
    prompt: string, 
    uploadedImage?: {data: string, mimeType: string} | null
  ): Promise<string> => {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please check your API key setup.');
    }
    
    // NOTE: Gemini model IDs may be deprecated/removed. Try a primary model then fallbacks.
    const primaryModel = 'gemini-2.0-flash';
    const fallbackModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    const buildUrl = (model: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    
    // Build conversation context from history - reduced for faster responses
    const contextPrompt = conversationHistory.length > 0 
      ? `CONVERSATION HISTORY:\n${conversationHistory
          .slice(-3) // Last 3 messages for context (reduced from 10)
          .map(msg => `${msg.sender.toUpperCase()}: ${msg.isImage ? '[Image]' : msg.content}`)
          .join('\n')}\n\nCURRENT QUESTION: ${prompt}`
      : prompt;

    const parts: any[] = [{ text: contextPrompt }];
    if (uploadedImage) {
      parts.push({
        inlineData: {
          mimeType: uploadedImage.mimeType,
          data: uploadedImage.data
        }
      });
    }
    
    const payload = {
      contents: [{ parts }],
      systemInstruction: {
        parts: [{
          text: getSystemInstruction()
        }]
      }
    };
    
    const modelsToTry = [primaryModel, ...fallbackModels];
    let lastErrorBody = '';

    for (const model of modelsToTry) {
      const response = await fetch(buildUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        return (
          result?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Sorry, I could not process your request.'
        );
      }

      if (response.status === 404) {
        lastErrorBody = await response.text().catch(() => '');
        continue;
      }

      const errorBody = await response.text().catch(() => '');
      throw new Error(`API Error: ${response.status}${errorBody ? ` - ${errorBody}` : ''}`);
    }

    throw new Error(
      `API Error: 404 - Model not found. ${lastErrorBody ? `Last response: ${lastErrorBody}` : ''}`
    );
  };

  return { callGeminiAPI };
};