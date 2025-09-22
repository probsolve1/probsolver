import { useEffect, useRef, useState } from 'react';

const Index = () => {
  const [messages, setMessages] = useState<Array<{id: string, content: string, sender: 'user' | 'ai', isImage?: boolean, showActions?: boolean}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentProblem = useRef<string>('');
  
  const API_KEY = 'AIzaSyDEeJkrym65-ZGNzTpY6_wHEMhoDETFX4w';

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Add paste event listener for images
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (const item of Array.from(items)) {
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result as string;
                setUploadedImage({
                  data: result.split(',')[1],
                  mimeType: blob.type
                });
              };
              reader.readAsDataURL(blob);
              break;
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (content: string, sender: 'user' | 'ai', isImage = false, showActions = false) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      sender,
      isImage,
      showActions
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const typewriterEffect = async (messageId: string, text: string) => {
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: currentText + '<span class="typewriter-cursor">|</span>' }
          : msg
      ));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Remove cursor
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: currentText }
        : msg
    ));
  };

  const parseMarkdown = (text: string) => {
    return text
      .replace(/^## (.+)$/gm, '<h2 class="text-blue-300 text-lg font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^\* (.+)$/gm, '<p class="ml-6 mb-2">• $1</p>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<h2|<p class)(.+)$/gm, '<p class="mb-3">$1</p>')
      .replace(/<p class="mb-3"><\/p>/g, '');
  };

  const callGeminiAPI = async (prompt: string): Promise<string> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    
    const parts: any[] = [{ text: prompt }];
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
          text: "You are an expert math tutor. Provide clear, step-by-step solutions using markdown formatting. Use LaTeX for mathematical expressions (wrap in $ for inline math, $$ for display math). Be concise but thorough."
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

  const solveProblem = async () => {
    const problemText = inputValue.trim();
    currentProblem.current = problemText;
    
    if (!problemText && !uploadedImage) {
      alert('Please enter a problem or upload an image!');
      return;
    }
    
    setIsMinimized(true);
    
    // Add user message
    if (problemText) {
      addMessage(problemText, 'user');
    }
    if (uploadedImage) {
      addMessage(`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`, 'user', true);
    }
    
    setIsLoading(true);
    setInputValue('');
    setUploadedImage(null);
    
    try {
      const response = await callGeminiAPI(problemText);
      setIsLoading(false);
      
      const messageId = addMessage('', 'ai', false, true);
      const parsedContent = parseMarkdown(response);
      await typewriterEffect(messageId, parsedContent);
      
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error. Please try again.', 'ai');
      console.error('API Error:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage({
        data: result.split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      solveProblem();
    }
  };

  const explainConcept = async (problemText: string) => {
    const prompt = `Explain the core mathematical concept behind this problem in simple terms: "${problemText}"`;
    setIsLoading(true);
    
    try {
      const response = await callGeminiAPI(prompt);
      setIsLoading(false);
      
      const messageId = addMessage('', 'ai', false, true);
      const parsedContent = parseMarkdown(response);
      await typewriterEffect(messageId, parsedContent);
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error generating the explanation.', 'ai');
    }
  };

  const generatePractice = async (problemText: string) => {
    const prompt = `Generate 3 similar practice problems based on: "${problemText}". Include solutions.`;
    setIsLoading(true);
    
    try {
      const response = await callGeminiAPI(prompt);
      setIsLoading(false);
      
      const messageId = addMessage('', 'ai', false, true);
      const parsedContent = parseMarkdown(response);
      await typewriterEffect(messageId, parsedContent);
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error generating practice problems.', 'ai');
    }
  };

  const generateSummary = async (problemText: string) => {
    const prompt = `Create a concise summary of the key steps to solve: "${problemText}"`;
    setIsLoading(true);
    
    try {
      const response = await callGeminiAPI(prompt);
      setIsLoading(false);
      
      const messageId = addMessage('', 'ai', false, true);
      const parsedContent = parseMarkdown(response);
      await typewriterEffect(messageId, parsedContent);
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error generating the summary.', 'ai');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-slate-800/40 to-slate-900"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col h-screen">
        {/* Header - Only show when no messages */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
              ProbSolver
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 mb-8"></div>
          </div>
        )}

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto py-8 space-y-6" ref={chatContainerRef}>
            {/* Minimized Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">ProbSolver</h1>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mt-2"></div>
            </div>

            {messages.map((message) => (
              <div key={message.id} className="message animate-slide-up">
                {message.sender === 'user' ? (
                  <div className="flex justify-end mb-4">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-lg max-w-xs shadow-lg">
                      {message.isImage ? (
                        <img src={message.content} alt="User uploaded" className="max-w-full rounded-lg" />
                      ) : (
                        <span className="text-sm">{message.content}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-full">
                      {/* Solution Header */}
                      <h2 className="text-2xl font-semibold text-white mb-4 border-b border-slate-600 pb-2">
                        Solution
                      </h2>
                      
                      {/* Solution Content */}
                      <div 
                        className="text-slate-200 mb-6 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                      
                      {/* Action Buttons - Only show for solutions with showActions */}
                      {message.showActions && (
                        <div className="flex flex-wrap gap-3 mt-6">
                          <button
                            onClick={() => explainConcept(currentProblem.current)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            ✨ Explain Concept
                          </button>
                          <button
                            onClick={() => generatePractice(currentProblem.current)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            ✨ Practice Problems
                          </button>
                          <button
                            onClick={() => generateSummary(currentProblem.current)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            📝 Shorten it
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4 text-slate-400">
            <div className="flex gap-1 mr-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full loading-dot"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full loading-dot"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full loading-dot"></div>
            </div>
            <span>ProbSolver is thinking...</span>
          </div>
        )}

        {/* Input Area - Fixed at bottom */}
        <div className="py-6">
          {/* Image Preview */}
          {uploadedImage && (
            <div className="mb-4">
              <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-4 max-w-md">
                <img 
                  src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`}
                  alt="Preview" 
                  className="max-w-full max-h-48 rounded-lg object-contain"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 bg-slate-600 hover:bg-slate-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={uploadedImage ? "Image ready to analyze..." : "Ask ProbSolver"}
              className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-sm"
            />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Image Upload */}
              <label className="cursor-pointer p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              
              {/* Camera Upload */}
              <label className="cursor-pointer p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm1.5-9H17v10.5c0 1.1-.9 2-2 2h-1V13c0-2.76-2.24-5-5-5H7.5V6.5c0-1.1.9-2 2-2h4z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
              </label>
              
              {/* Voice Button */}
              {recognitionRef.current && (
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-green-600 text-white' 
                      : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.77 0 3-1.23 3-3V5c0-1.77-1.23-3-3-3S9 3.23 9 5v6c0 1.77 1.23 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                  </svg>
                </button>
              )}
              
              {/* Send Button */}
              <button
                onClick={solveProblem}
                className="p-2 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .typewriter-cursor {
          animation: blink 1s infinite;
        }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        .loading-dot { animation: bounce 1.4s ease-in-out infinite both; }
        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        .loading-dot:nth-child(3) { animation-delay: 0s; }
      `}</style>
    </div>
  );
};

export default Index;