import { useState } from 'react';
import { CodeChat } from './CodeChat';
import { PreviewPanel } from './PreviewPanel';
import { ModeToggle } from './ModeToggle';
import { PublishDialog } from './PublishDialog';
import { Button } from './ui/button';
import { Code2, Code, X, Maximize2, Upload, LogIn, LogOut, User } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export const CodeIDE = () => {
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
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
    <h1>Welcome to ProbSolver AI</h1>
    <p>Start building your app by chatting on the left!</p>
  </div>
</body>
</html>`);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">ProbSolver AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsPublishDialogOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Publish
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreenPreview(true)}
            className="gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Full Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCodeVisible(!isCodeVisible)}
            className="gap-2"
          >
            <Code className="w-4 h-4" />
            {isCodeVisible ? 'Hide Code' : 'View Code'}
          </Button>
          <ModeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  {user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Left Side */}
        <div className="w-[450px] border-r border-border bg-card flex flex-col">
          <CodeChat onCodeGenerated={(code) => setHtmlCode(code)} />
        </div>

        {/* Preview Panel - Right Side */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <PreviewPanel code={htmlCode} />
          
          {/* Code View Overlay */}
          {isCodeVisible && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col">
              <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-card">
                <span className="text-sm font-medium text-foreground">Generated Code</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCodeVisible(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-4 text-sm font-mono text-foreground">
                  <code>{htmlCode}</code>
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Preview Dialog */}
      <Dialog open={isFullScreenPreview} onOpenChange={setIsFullScreenPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <div className="w-full h-full">
            <PreviewPanel code={htmlCode} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <PublishDialog 
        open={isPublishDialogOpen} 
        onOpenChange={setIsPublishDialogOpen}
        htmlCode={htmlCode}
      />
    </div>
  );
};
