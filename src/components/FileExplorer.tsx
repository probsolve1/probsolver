import { useState } from 'react';
import { File, Folder, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface FileExplorerProps {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelectFile: (filename: string) => void;
  onAddFile: (filename: string) => void;
}

export const FileExplorer = ({ files, selectedFile, onSelectFile, onAddFile }: FileExplorerProps) => {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleAddFile = () => {
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setIsAddingFile(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Files
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingFile(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isAddingFile && (
        <div className="mb-2 flex gap-1">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename.js"
            className="h-8 text-xs"
            onKeyPress={(e) => e.key === 'Enter' && handleAddFile()}
            autoFocus
          />
          <Button size="sm" onClick={handleAddFile} className="h-8 text-xs">
            Add
          </Button>
        </div>
      )}

      <div className="space-y-1">
        {Object.keys(files).map((filename) => (
          <button
            key={filename}
            onClick={() => onSelectFile(filename)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
              selectedFile === filename
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <File className="w-4 h-4" />
            {filename}
          </button>
        ))}
      </div>
    </div>
  );
};
