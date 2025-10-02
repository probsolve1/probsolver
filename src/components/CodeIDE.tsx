import { useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import { CodeChat } from './CodeChat';
import { Button } from './ui/button';
import { PanelLeftClose, PanelLeft, Code2 } from 'lucide-react';

export const CodeIDE = () => {
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Lovable AI</h1>
    <p>Start building your app by chatting below!</p>
  </div>
</body>
</html>`,
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center px-4 bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExplorerOpen(!isExplorerOpen)}
          className="mr-2"
        >
          {isExplorerOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </Button>
        <Code2 className="w-5 h-5 text-primary mr-2" />
        <span className="font-semibold text-foreground">Lovable AI</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {isExplorerOpen && (
          <div className="w-64 border-r border-border bg-card overflow-y-auto">
            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onAddFile={(filename) => setFiles({ ...files, [filename]: '' })}
            />
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CodeEditor
            file={selectedFile}
            code={selectedFile ? files[selectedFile] : ''}
            onCodeChange={(code) => {
              if (selectedFile) {
                setFiles({ ...files, [selectedFile]: code });
              }
            }}
          />
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 border-l border-border bg-card overflow-hidden">
          <PreviewPanel code={selectedFile?.endsWith('.html') ? files[selectedFile] : ''} />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="h-80 border-t border-border bg-card">
        <CodeChat onCodeGenerated={(filename, code) => {
          setFiles({ ...files, [filename]: code });
          setSelectedFile(filename);
        }} />
      </div>
    </div>
  );
};
