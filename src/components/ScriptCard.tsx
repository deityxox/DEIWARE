import { Play, FileText, FileCode } from 'lucide-react';
import { Card, CardContent } from './ui/card';
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
  const Icon = script.type === 'powershell' ? FileCode : FileText;

  return (
    <Card className={cn(
      'group transition-all duration-200 hover:shadow-md hover:border-primary/50',
      selected && 'ring-2 ring-primary',
      isRunning && 'animate-shimmer'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-medium text-sm truncate">{script.name}</h3>
            </div>

            {script.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {script.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                script.type === 'powershell' 
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'bg-purple-500/10 text-purple-500'
              )}>
                {script.type === 'powershell' ? 'PowerShell' : 'Registry'}
              </span>
              <span className="text-xs text-muted-foreground">{script.category}</span>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onRun}
            disabled={isRunning}
            className="shrink-0 h-8 w-8"
          >
            <Play className={cn(
              'h-4 w-4',
              isRunning && 'animate-pulse'
            )} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
