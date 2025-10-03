import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { ModeToggle } from '@/components/ModeToggle';
import { CodePreview } from '@/components/CodePreview';
import { CodeIDE } from '@/components/CodeIDE';
import { useModeContext } from '@/contexts/ModeContext';
import { useGeminiAPI } from '@/hooks/useGeminiAPI';
import { useImageGeneration } from '@/hooks/useImageGeneration';

const Index = () => {
  const [messages, setMessages] = useState<Array<{id: string, content: string, sender: 'user' | 'ai', isImage?: boolean, showActions?: boolean, hasCode?: boolean, imageUrl?: string, combinedHTML?: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [fullscreenHTML, setFullscreenHTML] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentProblem = useRef<string>('');
  const currentProblemImage = useRef<{data: string, mimeType: string} | null>(null);
  const autoScrollRef = useRef(true); // Track auto-scroll in real-time for typewriter
  
  const { mode, addToHistory } = useModeContext();
  const { callGeminiAPI } = useGeminiAPI();
  const { generateImage, editImage, convertToAI, isGenerating } = useImageGeneration();

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

    // Add drag and drop event listeners
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedImage({
              data: result.split(',')[1],
              mimeType: file.type
            });
          };
          reader.readAsDataURL(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current && autoScroll) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // Update both state and ref for real-time tracking
    if (isNearBottom && !autoScroll) {
      setAutoScroll(true);
      autoScrollRef.current = true;
    } else if (!isNearBottom && autoScroll) {
      setAutoScroll(false);
      autoScrollRef.current = false;
    }
  };

  const addMessage = (content: string, sender: 'user' | 'ai', isImage = false, showActions = false, hasCode = false) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      sender,
      isImage,
      showActions,
      hasCode
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Add to conversation history for context
    if (!isImage) {
      addToHistory(content, sender, isImage);
    }
    
    return newMessage.id;
  };

  const typewriterEffect = async (messageId: string, text: string) => {
    setIsGeneratingText(true);
    const chars = text.split('');
    let currentText = '';
    
    for (let i = 0; i < chars.length; i++) {
      if (abortControllerRef.current?.signal.aborted) {
        setIsGeneratingText(false);
        return;
      }
      
      currentText += chars[i];
      
      let displayText = parseMarkdown(currentText);
      displayText += '<span class="typewriter-cursor">|</span>';
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: displayText }
          : msg
      ));
      
      if (autoScrollRef.current && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      
      await new Promise(resolve => setTimeout(resolve, 8));
    }
    
    const finalContent = parseMarkdown(text);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: finalContent }
        : msg
    ));
    
    if (autoScrollRef.current && chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current && autoScrollRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    
    setIsGeneratingText(false);
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsGeneratingText(false);
  };

  const parseMarkdown = (text: string) => {
    let html = text
      .replace(/^## (.+)$/gm, '<h2 class="text-blue-300 text-lg font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^\* (.+)$/gm, '<p class="ml-6 mb-2">• $1</p>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<h2|<p class)(.+)$/gm, '<p class="mb-3">$1</p>')
      .replace(/<p class="mb-3"><\/p>/g, '');
    
    // Render LaTeX math expressions
    html = html.replace(/\$\$(.*?)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true });
      } catch (e) {
        return match;
      }
    });
    
    html = html.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false });
      } catch (e) {
        return match;
      }
    });
    
    return html;
  };

  const detectCode = (text: string) => {
    // Detect if the text contains code blocks
    return /```[\s\S]*?```/.test(text);
  };

  const extractCodeBlocks = (text: string) => {
    const codeBlocks: Array<{code: string, language: string}> = [];
    const regex = /```(\w+)?\s*([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    
    return codeBlocks;
  };

  const extractCombinedHTML = (text: string): string | null => {
    const completeHtmlRegex = /```html\s*(<!DOCTYPE[\s\S]*?)<\/html>\s*```/gi;
    const htmlOnlyRegex = /```html\s*(?!<!DOCTYPE)([\s\S]*?)```/gi;
    const cssRegex = /```css\s*([\s\S]*?)```/gi;
    const jsRegex = /```(?:javascript|js)\s*([\s\S]*?)```/gi;
    
    const completeMatch = completeHtmlRegex.exec(text);
    if (completeMatch) {
      return completeMatch[1].trim();
    }
    
    const htmlMatches = [...text.matchAll(htmlOnlyRegex)];
    const cssMatches = [...text.matchAll(cssRegex)];
    const jsMatches = [...text.matchAll(jsRegex)];
    
    const htmlSnippet = htmlMatches.length > 0 ? htmlMatches[0][1].trim() : '';
    const cssSnippet = cssMatches.length > 0 ? cssMatches[0][1].trim() : '';
    const jsSnippet = jsMatches.length > 0 ? jsMatches[0][1].trim() : '';
    
    if (htmlSnippet || cssSnippet || jsSnippet) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
    ${cssSnippet}
  </style>
</head>
<body>
  ${htmlSnippet}
  ${jsSnippet ? `<script>\n${jsSnippet}\n</script>` : ''}
</body>
</html>`;
    }
    
    return null;
  };

  // Removed callGeminiAPI - now using the hook

  const solveProblem = async () => {
    const problemText = inputValue.trim();
    currentProblem.current = problemText;
    currentProblemImage.current = uploadedImage; // Store the image for action buttons
    
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
    setAutoScroll(true);
    autoScrollRef.current = true; // Enable auto-scroll when starting generation
    setInputValue('');
    const currentUploadedImage = uploadedImage;
    setUploadedImage(null);
    
    // Create abort controller for stopping generation
    abortControllerRef.current = new AbortController();
    
    try {
      if (mode === 'image' && !currentUploadedImage) {
        // Generate new image
        const imageUrl = await generateImage({ 
          prompt: problemText,
          width: 512,
          height: 512 
        });
        setIsLoading(false);
        
        const newMessage = {
          id: Date.now().toString(),
          content: `Here's your generated image for: "${problemText}"`,
          sender: 'ai' as const,
          isImage: true,
          imageUrl: imageUrl
        };
        setMessages(prev => [...prev, newMessage]);
        
      } else if (mode === 'image' && currentUploadedImage) {
        // Convert/edit existing image
        const blob = await fetch(`data:${currentUploadedImage.mimeType};base64,${currentUploadedImage.data}`).then(r => r.blob());
        const file = new File([blob], 'image.jpg', { type: currentUploadedImage.mimeType });
        
        const convertedUrl = await convertToAI(file);
        setIsLoading(false);
        
        const newMessage = {
          id: Date.now().toString(),
          content: `Here's your AI-converted image: "${problemText || 'AI artistic conversion'}"`,
          sender: 'ai' as const,
          isImage: true,
          imageUrl: convertedUrl
        };
        setMessages(prev => [...prev, newMessage]);
        
      } else {
        // Regular chat/study mode
        const response = await callGeminiAPI(problemText, currentUploadedImage);
        setIsLoading(false);
        
        const hasCode = detectCode(response);
        const combinedHTML = extractCombinedHTML(response);
        const showActions = mode === 'study';
        const messageId = addMessage('', 'ai', false, showActions, hasCode);
        
        if (combinedHTML) {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, combinedHTML } : msg
          ));
        }
        
        await typewriterEffect(messageId, response);
      }
      
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
          setAutoScroll(true);
          autoScrollRef.current = true;
          
          try {
      const response = await callGeminiAPI(prompt, currentProblemImage.current);
      setIsLoading(false);
      
      const hasCode = detectCode(response);
      const messageId = addMessage('', 'ai', false, true, hasCode);
      await typewriterEffect(messageId, response);
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error generating the explanation.', 'ai');
    }
  };

  const generatePractice = async (problemText: string) => {
    const prompt = `Generate 3 similar practice problems based on: "${problemText}". Include solutions.`;
    setIsLoading(true);
    
    try {
      const response = await callGeminiAPI(prompt, currentProblemImage.current);
      setIsLoading(false);
      
      const hasCode = detectCode(response);
      const messageId = addMessage('', 'ai', false, true, hasCode);
      await typewriterEffect(messageId, response);
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error generating practice problems.', 'ai');
    }
  };

  const generateSummary = async (problemText: string) => {
    const prompt = `Create a concise summary of the key steps to solve: "${problemText}"`;
    setIsLoading(true);
    
    try {
      const response = await callGeminiAPI(prompt, currentProblemImage.current);
      setIsLoading(false);
      
      const hasCode = detectCode(response);
      const messageId = addMessage('', 'ai', false, true, hasCode);
      await typewriterEffect(messageId, response);
    } catch (error) {
      setIsLoading(false);
      addMessage('⚠️ Sorry, I encountered an error generating the summary.', 'ai');
    }
  };

  // Render IDE for code mode
  if (mode === 'code') {
    return <CodeIDE />;
  }

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-accent/5 to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header - Only show when no messages */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-7xl font-bold text-foreground mb-6 tracking-tight gradient-text">
              ProbSolver
            </h1>
            <div className="w-24 h-0.5 bg-gradient-primary mb-8"></div>
            <div className="mb-8">
              <ModeToggle />
            </div>
            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
              {mode === 'study' 
                ? 'Your AI tutor for ALL subjects and coding mentor. Upload problems, ask questions, and get step-by-step solutions with live previews.'
                : mode === 'image'
                ? 'Generate, edit, and transform images with AI. Upload images to convert or describe what you want to create.'
                : 'Your friendly AI companion. Let\'s chat about anything on your mind!'
              }
            </p>
          </div>
        )}

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto py-8 space-y-6 px-4 max-w-4xl mx-auto w-full" ref={chatContainerRef} onScroll={handleScroll}>
            {/* Minimized Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground tracking-tight gradient-text">ProbSolver</h1>
                <ModeToggle />
              </div>
              <div className="w-16 h-0.5 bg-gradient-primary mx-auto mt-2"></div>
            </div>

            {messages.map((message) => (
              <div key={message.id} className="message animate-slide-up">
                {message.sender === 'user' ? (
                  <div className="flex justify-end mb-6">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-lg max-w-sm shadow-card">
                      {message.isImage ? (
                        <img src={message.imageUrl || message.content} alt="User uploaded" className="max-w-full rounded-lg" />
                      ) : (
                        <span className="text-sm font-medium">{message.content}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-full">
                      {/* Response Header */}
                      <h2 className="text-2xl font-semibold text-foreground mb-4 border-b border-border pb-2">
                        {mode === 'study' ? 'Solution' : mode === 'image' ? 'Image Result' : 'Response'}
                      </h2>
                      
                      {/* Response Content */}
                      {message.isImage ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{message.content}</p>
                           <div className="space-y-3">
                            <img 
                              src={message.imageUrl} 
                              alt="Generated image" 
                              className="max-w-md rounded-lg border shadow-lg"
                            />
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = message.imageUrl!;
                                link.download = `probsolver-image-${Date.now()}.png`;
                                link.click();
                              }}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="text-foreground mb-6 leading-relaxed min-h-[2rem] whitespace-pre-wrap break-words"
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      )}

                      {/* Code Preview - Show if message has code */}
                      {message.hasCode && (
                        <div className="space-y-4">
                          {extractCodeBlocks(message.content).map((codeBlock, index) => (
                            <CodePreview 
                              key={index} 
                              code={codeBlock.code} 
                              language={codeBlock.language} 
                            />
                          ))}
                          {message.combinedHTML && (
                            <button
                              onClick={() => setFullscreenHTML(message.combinedHTML || null)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              View Fullscreen Preview
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons - Only show for study mode solutions with showActions */}
                      {message.showActions && mode === 'study' && (
                        <div className="flex flex-wrap gap-3 mt-6">
                          <button
                            onClick={() => explainConcept(currentProblem.current)}
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2"
                          >
                            ✨ Explain Concept
                          </button>
                          <button
                            onClick={() => generatePractice(currentProblem.current)}
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2"
                          >
                            ✨ Practice Problems
                          </button>
                          <button
                            onClick={() => generateSummary(currentProblem.current)}
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2"
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
        {(isLoading || isGenerating || isGeneratingText) && (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dots"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dots" style={{animationDelay: '-0.32s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dots" style={{animationDelay: '-0.16s'}}></div>
              </div>
              <span>
                {isGenerating ? 'Generating image...' : 'ProbSolver is thinking...'}
              </span>
            </div>
            {(isGeneratingText || (isLoading && mode !== 'image')) && (
              <button
                onClick={stopGenerating}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="1"/>
                </svg>
                Stop Generating
              </button>
            )}
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
          <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={uploadedImage ? "Image ready to analyze..." : mode === 'study' ? "Ask any subject question or coding problem..." : mode === 'image' ? "Describe the image you want to generate or edit..." : "What's on your mind?"}
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
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
              <label className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-smooth">
                <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
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

      {/* Fullscreen Preview Modal */}
      {fullscreenHTML && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-card border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Fullscreen Preview</h3>
            <button
              onClick={() => setFullscreenHTML(null)}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
            >
              Close
            </button>
          </div>
          <div className="flex-1 bg-white">
            <iframe
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              srcDoc={fullscreenHTML}
              title="Fullscreen Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;