import { Monitor } from 'lucide-react';

interface PreviewPanelProps {
  code: string;
}

export const PreviewPanel = ({ code }: PreviewPanelProps) => {
  // Only render if we have actual HTML code (not AI response text)
  const hasValidHtml = code && (code.includes('<!DOCTYPE') || code.includes('<html'));
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-2">
        <Monitor className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Preview</span>
      </div>
      <div className="flex-1 bg-white">
        {hasValidHtml ? (
          <iframe
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            srcDoc={code}
            title="Preview"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center max-w-md px-4">
              <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No preview yet</p>
              <p className="text-xs text-muted-foreground">
                Chat with ProbSolver AI to generate HTML code and see it here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
