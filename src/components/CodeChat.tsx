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

      // Extract code blocks (HTML, CSS, JS) from response
      const htmlRegex = /```(?:html)?\s*([\s\S]*?)```/g;
      const cssRegex = /```css\s*([\s\S]*?)```/g;
      const jsRegex = /```(?:javascript|js)\s*([\s\S]*?)```/g;
      
      let htmlMatch;
      let foundCompleteHTML = false;
      
      // First, try to find a complete HTML document
      while ((htmlMatch = htmlRegex.exec(response)) !== null) {
        const code = htmlMatch[1].trim();
        if (code.includes('<!DOCTYPE') || code.includes('<html')) {
          onCodeGenerated(code);
          foundCompleteHTML = true;
          break;
        }
      }
      
      // If no complete HTML found, build one from separate blocks
      if (!foundCompleteHTML) {
        htmlRegex.lastIndex = 0; // Reset regex
        const htmlSnippet = htmlRegex.exec(response)?.[1]?.trim() || '';
        const cssSnippet = cssRegex.exec(response)?.[1]?.trim() || '';
        const jsSnippet = jsRegex.exec(response)?.[1]?.trim() || '';
        
        if (htmlSnippet || cssSnippet || jsSnippet) {
          const wrappedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      margin: 0;
    }
    ${cssSnippet}
  </style>
</head>
<body>
  ${htmlSnippet}
  ${jsSnippet ? `<script>\n${jsSnippet}\n</script>` : ''}
</body>
</html>`;
          onCodeGenerated(wrappedCode);
        }
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
