import { useEffect, useRef } from 'react';

interface CodeEditorProps {
  file: string | null;
  code: string;
  onCodeChange: (code: string) => void;
}

export const CodeEditor = ({ file, code, onCodeChange }: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = code;
    }
  }, [file, code]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-card">
        <span className="text-sm text-foreground font-medium">{file}</span>
      </div>
      <textarea
        ref={textareaRef}
        className="flex-1 w-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
        spellCheck={false}
        onChange={(e) => onCodeChange(e.target.value)}
        style={{
          tabSize: 2,
          lineHeight: '1.5',
        }}
      />
    </div>
  );
};
