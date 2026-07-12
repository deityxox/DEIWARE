import { Minus, Square, X } from 'lucide-react';
import { Button } from './ui/button';

export function TitleBar() {
  return (
    <div className="flex items-center justify-between h-8 bg-background/95 backdrop-blur-sm border-b border-border/50 select-none drag-region">
      <div className="flex items-center gap-2 px-3">
        <div className="w-3 h-3 rounded-full bg-primary/80" />
        <span className="text-xs font-medium text-foreground/90">DEIWARE</span>
      </div>

      <div className="flex items-center no-drag">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-12 rounded-none hover:bg-accent"
          onClick={() => window.electronAPI.windowMinimize()}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-12 rounded-none hover:bg-accent"
          onClick={() => window.electronAPI.windowMaximize()}
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => window.electronAPI.windowClose()}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
