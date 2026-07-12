import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Terminal, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ExecutionLog } from '@/types';
import { cn } from '@/lib/utils';

interface LogPanelProps {
  logs: ExecutionLog[];
  onClearLogs?: () => void;
}

export function LogPanel({ logs, onClearLogs }: LogPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Çalıştırma Logları</h2>
          {logs.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && onClearLogs && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLogs}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Temizle
          </Button>
        )}
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2 stagger-children">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40">
              <Terminal className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Henüz log kaydı yok</p>
              <p className="text-xs mt-1">Script çalıştırıldığında loglar burada görünecek</p>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedIds.has(log.id);
              const hasDetails = !!(log.output || log.error);

              return (
                <div
                  key={log.id}
                  className={cn(
                    'rounded-lg overflow-hidden transition-all duration-200',
                    'border',
                    log.success
                      ? 'bg-emerald-500/[0.03] border-emerald-500/15'
                      : 'bg-red-500/[0.03] border-red-500/15'
                  )}
                >
                  {/* Log header */}
                  <button
                    onClick={() => hasDetails && toggleExpand(log.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
                      hasDetails && 'hover:bg-accent/30 cursor-pointer'
                    )}
                  >
                    {log.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}

                    <span className="flex-1 text-sm font-medium truncate">
                      {log.scriptName}
                    </span>

                    <span className="text-[10px] text-muted-foreground/60 tabular-nums flex items-center gap-1 shrink-0">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(log.timestamp)}
                    </span>

                    {hasDetails && (
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 text-muted-foreground/40 transition-transform duration-200 shrink-0',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {/* Expandable details */}
                  {isExpanded && hasDetails && (
                    <div className="px-3.5 pb-3 pt-0 border-t border-border/20">
                      <div className="terminal-panel rounded-md p-3 mt-2">
                        {log.output && (
                          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                            {log.output}
                          </pre>
                        )}
                        {log.error && (
                          <pre className="text-[11px] text-red-400 whitespace-pre-wrap break-words leading-relaxed mt-1">
                            {log.error}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
