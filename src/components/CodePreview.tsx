import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodePreviewProps {
  code: string;
  language?: string;
}

export const CodePreview = ({ code, language = 'html' }: CodePreviewProps) => {
  const [showPreview, setShowPreview] = useState(false);

  // Extract HTML content for preview
  const getPreviewContent = () => {
    if (language.toLowerCase() === 'html' || code.includes('<html') || code.includes('<!DOCTYPE')) {
      return code;
    }
    
    // For CSS/JS, wrap in basic HTML structure
    if (language.toLowerCase() === 'css') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 20px; font-family: Arial, sans-serif; }
            ${code}
          </style>
        </head>
        <body>
          <h1>CSS Preview</h1>
          <p>This is a preview of your CSS styles applied to this page.</p>
          <div class="example">Sample content to demonstrate styles</div>
        </body>
        </html>
      `;
    }
    
    if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 20px; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <h1>JavaScript Preview</h1>
          <div id="output">Check console for output</div>
          <script>
            // Redirect console.log to display on page
            const output = document.getElementById('output');
            const originalLog = console.log;
            console.log = function(...args) {
              output.innerHTML += args.join(' ') + '<br>';
              originalLog.apply(console, args);
            };
            
            ${code}
          </script>
        </body>
        </html>
      `;
    }
    
    return code;
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-2">
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="secondary"
          size="sm"
          className="text-xs"
        >
          {showPreview ? '👁️ Hide Preview' : '▶️ Live Preview'}
        </Button>
      </div>
      
      {showPreview && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-3 py-2 text-xs text-muted-foreground border-b border-border">
            Live Preview
          </div>
          <iframe
            srcDoc={getPreviewContent()}
            className="w-full h-64 bg-background"
            title="Code Preview"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
};