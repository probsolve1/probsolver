import { Monitor } from 'lucide-react';

interface PreviewPanelProps {
  code: string;
}

export const PreviewPanel = ({ code }: PreviewPanelProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-2">
        <Monitor className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Preview</span>
      </div>
      <div className="flex-1 bg-white">
        {code ? (
          <iframe
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            srcDoc={code}
            title="Preview"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p className="text-sm">Preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
