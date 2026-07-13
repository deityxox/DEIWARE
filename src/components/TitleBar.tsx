import { Minus, Square, X } from 'lucide-react';
import { Button } from './ui/button';

export function TitleBar() {
  return (
    <div className="flex items-center justify-between h-9 bg-background/80 backdrop-blur-md border-b border-border/30 select-none drag-region">
      <div className="flex items-center gap-2.5 px-4">
        <div className="relative w-2.5 h-2.5">
          <div className="absolute inset-0 rounded-full bg-primary animate-pulse-glow" />
          <div className="absolute inset-0 rounded-full bg-primary" />
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-foreground/70">
          deiwareOS
        </span>
      </div>

      <div className="flex items-center no-drag">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
          onClick={() => window.electronAPI.windowMinimize()}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
          onClick={() => window.electronAPI.windowMaximize()}
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-muted-foreground hover:bg-red-500/90 hover:text-white transition-colors"
          onClick={() => window.electronAPI.windowClose()}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
