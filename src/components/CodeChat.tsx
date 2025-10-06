import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useGeminiAPI } from '@/hooks/useGeminiAPI';
import { useModeContext } from '@/contexts/ModeContext';

interface CodeChatProps {
  onCodeGenerated: (code: string) => void;
}

export const CodeChat = ({ onCodeGenerated }: CodeChatProps) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { callGeminiAPI } = useGeminiAPI();
  const { addToHistory } = useModeContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    
    // Add to conversation history for context
    addToHistory(userMessage, 'user');
    
    setIsLoading(true);

    try {
      const response = await callGeminiAPI(userMessage, null);
      setMessages((prev) => [...prev, { role: 'ai', content: response }]);
      
      // Add AI response to history
      addToHistory(response, 'ai');

      // MORE ROBUST code extraction - try multiple patterns
      console.log('Full AI Response length:', response.length);
      console.log('Response preview:', response.substring(0, 500));
      
      // Try different extraction patterns
      const htmlRegex = /```html\n([\s\S]*?)```/gi;
      const cssRegex = /```css\n([\s\S]*?)```/gi;
      const jsRegex = /```(?:javascript|js)\n([\s\S]*?)```/gi;
      
      // Reset regex indices
      htmlRegex.lastIndex = 0;
      cssRegex.lastIndex = 0;
      jsRegex.lastIndex = 0;
      
      // Extract all matches
      const htmlMatch = htmlRegex.exec(response);
      const cssMatch = cssRegex.exec(response);
      const jsMatch = jsRegex.exec(response);
      
      let htmlCode = htmlMatch ? htmlMatch[1].trim() : '';
      const cssCode = cssMatch ? cssMatch[1].trim() : '';
      const jsCode = jsMatch ? jsMatch[1].trim() : '';
      
      console.log('Extraction results:', { 
        htmlLength: htmlCode.length, 
        cssLength: cssCode.length, 
        jsLength: jsCode.length,
        htmlPreview: htmlCode.substring(0, 100),
        cssPreview: cssCode.substring(0, 100)
      });
      
      // Check if HTML is a complete document
      const isCompleteHTML = htmlCode.includes('<!DOCTYPE') || htmlCode.includes('<html');
      
      if (isCompleteHTML) {
        // Inject CSS into complete HTML
        if (cssCode && htmlCode.includes('</head>')) {
          htmlCode = htmlCode.replace('</head>', `  <style>\n${cssCode}\n  </style>\n</head>`);
        }
        // Inject JS into complete HTML
        if (jsCode && htmlCode.includes('</body>')) {
          htmlCode = htmlCode.replace('</body>', `  <script>\n${jsCode}\n  </script>\n</body>`);
        }
        console.log('Using complete HTML with injected CSS/JS');
        onCodeGenerated(htmlCode);
      } else if (htmlCode || cssCode || jsCode) {
        // Build complete HTML from fragments
        const combinedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
${cssCode}
  </style>
</head>
<body>
${htmlCode}
${jsCode ? `  <script>\n${jsCode}\n  </script>` : ''}
</body>
</html>`;
        console.log('Built combined HTML from fragments');
        onCodeGenerated(combinedHTML);
      } else {
        console.log('⚠️ NO CODE BLOCKS FOUND - Response might not contain code');
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', content: '❌ Sorry, I encountered an error. Please try again.' }]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center max-w-md">
              <p className="text-sm mb-2">💬 Chat with ProbSolver AI</p>
              <p className="text-xs">
                Describe what you want to build and I'll generate the code for you!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe what you want to build..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
