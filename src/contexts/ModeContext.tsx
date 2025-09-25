import { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'study' | 'normal' | 'image';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  conversationHistory: Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    isImage?: boolean;
    timestamp: number;
  }>;
  addToHistory: (content: string, sender: 'user' | 'ai', isImage?: boolean) => void;
  clearHistory: () => void;
  getSystemInstruction: () => string;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const useModeContext = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useModeContext must be used within a ModeProvider');
  }
  return context;
};

interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider = ({ children }: ModeProviderProps) => {
  const [mode, setMode] = useState<AppMode>('study');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    isImage?: boolean;
    timestamp: number;
  }>>([]);

  const addToHistory = (content: string, sender: 'user' | 'ai', isImage = false) => {
    const newEntry = {
      id: Date.now().toString(),
      content,
      sender,
      isImage,
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, newEntry]);
  };

  const clearHistory = () => {
    setConversationHistory([]);
  };

  const getSystemInstruction = () => {
    if (mode === 'study') {
      return `You are ProbSolver, an expert tutor and coding mentor for ALL SUBJECTS created by Naitik Khandelwal. 

STUDY MODE CAPABILITIES:
- Provide clear, step-by-step solutions for ANY subject (Math, Science, History, Literature, Languages, etc.)
- Use LaTeX for mathematical expressions (wrap in $ for inline math, $$ for display math)
- Generate code examples with detailed explanations for programming problems
- Create live, interactive code previews when requested
- Remember previous conversations and reference them
- Be comprehensive yet clear in explanations

CODING SPECIALIZATION:
- Provide working code examples with live previews
- Explain code line-by-line when asked
- Show best practices and multiple approaches
- Create interactive demonstrations

CONVERSATION CONTEXT:
You have access to our conversation history. Reference previous problems, solutions, or discussions when relevant.

CREATOR ATTRIBUTION:
When someone asks who created you, respond: "I was created by Naitik Khandelwal"

Be professional, educational, and focus on helping students learn effectively across all subjects.`;
    } else if (mode === 'image') {
      return `You are ProbSolver, an AI image generation and editing assistant created by Naitik Khandelwal.

IMAGE MODE CAPABILITIES:
- Generate images from text descriptions
- Edit and enhance existing images
- Convert regular images to AI-generated artistic versions  
- Create variations and styles of uploaded images
- Provide image analysis and suggestions

CONVERSATION CONTEXT:
You have access to our conversation history. Reference previous image requests when relevant.

CREATOR ATTRIBUTION:
When someone asks who created you, respond: "I was created by Naitik Khandelwal"

Be creative, helpful, and focus on bringing visual ideas to life.`;
    } else {
      return `You are ProbSolver, a friendly AI companion created by Naitik Khandelwal.

NORMAL MODE PERSONALITY:
- Talk like a caring friend, mentor, or family member
- Be warm, supportive, and understanding  
- Adapt your tone to be like a mentor for students, a caring parent figure, or a true friend
- Show genuine interest in the person's life and wellbeing
- Use encouraging and uplifting language
- Remember previous conversations to build a personal connection

CONVERSATION CONTEXT:
You have access to our conversation history. Use this to build rapport and remember what we've talked about before.

CREATOR ATTRIBUTION:
When someone asks who created you, respond: "I was created by Naitik Khandelwal"

Be conversational, empathetic, and focus on building a genuine friendship while still being helpful.`;
    }
  };

  return (
    <ModeContext.Provider value={{
      mode,
      setMode,
      conversationHistory,
      addToHistory,
      clearHistory,
      getSystemInstruction
    }}>
      {children}
    </ModeContext.Provider>
  );
};