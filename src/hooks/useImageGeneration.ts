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
      const API_KEY = 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `Create a detailed artistic description for an AI image generator based on this prompt: "${params.prompt}". Make it vivid, detailed, and suitable for creating a high-quality ${params.style || 'realistic'} image. Include colors, lighting, composition, and mood.`
          }]
        }]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image description');
      }
      
      const result = await response.json();
      const description = result?.candidates?.[0]?.content?.parts?.[0]?.text || params.prompt;
      
      // Create a canvas-based generated image with the enhanced description
      const width = params.width || 512;
      const height = params.height || 512;
      const seed = Math.floor(Math.random() * 1000000);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      // Create artistic gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsl(${seed % 360}, 70%, 60%)`);
      gradient.addColorStop(0.5, `hsl(${(seed + 120) % 360}, 60%, 50%)`);
      gradient.addColorStop(1, `hsl(${(seed + 240) % 360}, 70%, 40%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add artistic overlay patterns
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 30 + 5;
        const hue = (seed + i * 30) % 360;
        
        ctx.fillStyle = `hsl(${hue}, 60%, 70%)`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add text overlay with generated description
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      
      // Wrap text
      const words = description.slice(0, 150).split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width < width - 40 && currentLine.length < 50) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine.trim());
          currentLine = word + ' ';
        }
      }
      if (currentLine) lines.push(currentLine.trim());
      
      const maxLines = Math.min(lines.length, 8);
      const startY = height/2 - (maxLines * 18) / 2;
      
      for (let i = 0; i < maxLines; i++) {
        const y = startY + i * 18;
        ctx.strokeText(lines[i], width/2, y);
        ctx.fillText(lines[i], width/2, y);
      }
      
      return canvas.toDataURL('image/png');
      
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