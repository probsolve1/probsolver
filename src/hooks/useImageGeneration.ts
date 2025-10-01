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
      // Simulate image editing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return modified image (placeholder)
      return `https://picsum.photos/512/512?random=${Date.now()}`;
      
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToAI = async (imageFile: File): Promise<string> => {
    setIsGenerating(true);
    
    try {
      // Simulate AI conversion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return AI-converted image (placeholder)
      return `https://picsum.photos/512/512?random=${Date.now()}`;
      
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