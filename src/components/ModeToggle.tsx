import { useModeContext } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';

export const ModeToggle = () => {
  const { mode, setMode, clearHistory } = useModeContext();

  const handleModeChange = (newMode: 'study' | 'normal') => {
    if (newMode !== mode) {
      setMode(newMode);
      // Optionally clear history when switching modes
      // clearHistory();
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-card rounded-xl border border-border">
      <Button
        variant={mode === 'study' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('study')}
        className={`text-xs font-medium transition-smooth ${
          mode === 'study' 
            ? 'bg-primary text-primary-foreground shadow-glow' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        📚 Study Mode
      </Button>
      <Button
        variant={mode === 'normal' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('normal')}
        className={`text-xs font-medium transition-smooth ${
          mode === 'normal' 
            ? 'bg-primary text-primary-foreground shadow-glow' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        💬 Chat Mode
      </Button>
    </div>
  );
};