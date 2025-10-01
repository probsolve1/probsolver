import { useState } from 'react';

export interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'sketch';
}

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async (params: ImageGenerationParams): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
      
      // Create enhanced prompt based on style
      let enhancedPrompt = params.prompt;
      if (params.style === 'artistic') {
        enhancedPrompt = `Artistic style image: ${params.prompt}, with vibrant colors and creative composition`;
      } else if (params.style === 'cartoon') {
        enhancedPrompt = `Cartoon style illustration: ${params.prompt}, with bold outlines and bright colors`;
      } else if (params.style === 'sketch') {
        enhancedPrompt = `Pencil sketch drawing: ${params.prompt}, with detailed line work`;
      } else {
        enhancedPrompt = `Photorealistic image: ${params.prompt}, high quality, detailed`;
      }
      
      const payload = {
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image generation error:', errorText);
        throw new Error(`Failed to generate image: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Extract base64 image from response
      const imageData = result?.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
      
      if (imageData?.inlineData?.data) {
        return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
      }
      
      throw new Error('No image data in response');
      
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const editImage = async (imageUrl: string, editPrompt: string): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
      
      // Convert image URL to base64 if it's not already
      let imageBase64 = imageUrl;
      let mimeType = 'image/png';
      
      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageBase64 = matches[2];
        }
      } else {
        // Fetch the image and convert to base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        mimeType = blob.type;
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      }
      
      const payload = {
        contents: [{
          parts: [
            { text: editPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image editing error:', errorText);
        throw new Error(`Failed to edit image: ${response.status}`);
      }
      
      const result = await response.json();
      const imageData = result?.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
      
      if (imageData?.inlineData?.data) {
        return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
      }
      
      throw new Error('No image data in response');
      
    } catch (error) {
      console.error('Image editing error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToAI = async (imageFile: File): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(imageFile);
      });
      
      const payload = {
        contents: [{
          parts: [
            { text: "Transform this image into a viral, eye-catching AI-enhanced version with stunning effects, vibrant colors, and professional editing" },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI conversion error:', errorText);
        throw new Error(`Failed to convert image: ${response.status}`);
      }
      
      const result = await response.json();
      const imageData = result?.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
      
      if (imageData?.inlineData?.data) {
        return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
      }
      
      throw new Error('No image data in response');
      
    } catch (error) {
      console.error('AI conversion error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateImage,
    editImage,
    convertToAI,
    isGenerating
  };
};