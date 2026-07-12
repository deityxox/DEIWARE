import { Play, FileText, FileCode, Terminal, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ScriptFile } from '@/types';
import { cn } from '@/lib/utils';

interface ScriptCardProps {
  script: ScriptFile;
  selected: boolean;
  onToggleSelect: () => void;
  onRun: () => void;
  isRunning?: boolean;
}

export function ScriptCard({ script, selected, onToggleSelect, onRun, isRunning }: ScriptCardProps) {
  const Icon = script.type === 'powershell' ? FileCode : script.type === 'batch' ? Terminal : FileText;

  return (
    <div
      className={cn(
        'group relative rounded-xl transition-all duration-300 cursor-pointer',
        'glass-card hover:shadow-lg',
        selected && 'glow-border-active',
        isRunning && 'animate-border-gradient border-primary/50'
      )}
      onClick={onToggleSelect}
    >
      {/* Running shimmer overlay */}
      {isRunning && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      )}

      <div className="relative p-4 flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          className="mt-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors duration-200',
                script.type === 'powershell' ? 'text-blue-400' : script.type === 'batch' ? 'text-amber-400' : 'text-violet-400'
              )}
            />
            <h3 className="font-medium text-sm truncate leading-tight">
              {script.name.replace(/\.(ps1|reg)$/i, '')}
            </h3>
          </div>

          {script.description && (
            <p className="text-[11px] text-muted-foreground/70 line-clamp-2 mb-2 leading-relaxed">
              {script.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wide uppercase',
                script.type === 'powershell'
                  ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
                  : script.type === 'batch'
                    ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                    : 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20'
              )}
            >
              {script.type === 'powershell' ? 'PS1' : script.type === 'batch' ? 'BAT' : 'REG'}
            </span>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          disabled={isRunning}
          className={cn(
            'shrink-0 h-8 w-8 rounded-lg transition-all duration-200',
            'text-muted-foreground hover:text-primary hover:bg-primary/10',
            isRunning && 'text-primary'
          )}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
          )}
        </Button>
      </div>
    </div>
  );
}
