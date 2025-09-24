import { useModeContext } from '@/contexts/ModeContext';

export const useGeminiAPI = () => {
  const { getSystemInstruction, conversationHistory } = useModeContext();
  const API_KEY = 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';

  const callGeminiAPI = async (
    prompt: string, 
    uploadedImage?: {data: string, mimeType: string} | null
  ): Promise<string> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    
    // Build conversation context from history
    const contextPrompt = conversationHistory.length > 0 
      ? `CONVERSATION HISTORY:\n${conversationHistory
          .slice(-10) // Last 10 messages for context
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
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';
  };

  return { callGeminiAPI };
};