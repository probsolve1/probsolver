import { useModeContext } from '@/contexts/ModeContext';
import { supabase } from '@/integrations/supabase/client';

export const useGeminiAPI = () => {
  const { mode, conversationHistory } = useModeContext();

  const callGeminiAPI = async (
    prompt: string, 
    uploadedImage?: {data: string, mimeType: string} | null
  ): Promise<string> => {
    
    // Build messages for the API
    const messages: Array<{role: string, content: string | Array<{type: string, text?: string, image_url?: {url: string}}>}> = [];
    
    if (uploadedImage) {
      // Multimodal message with image
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { 
            type: "image_url", 
            image_url: { 
              url: `data:${uploadedImage.mimeType};base64,${uploadedImage.data}` 
            } 
          }
        ]
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { 
        messages,
        mode,
        conversationHistory: conversationHistory.slice(-5).map(h => ({
          content: h.content,
          sender: h.sender
        }))
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.content || 'Sorry, I could not process your request.';
  };

  return { callGeminiAPI };
};
