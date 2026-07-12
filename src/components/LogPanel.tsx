import { CheckCircle2, XCircle, Clock, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { ExecutionLog } from '@/types';
import { cn } from '@/lib/utils';

interface LogPanelProps {
  logs: ExecutionLog[];
}

export function LogPanel({ logs }: LogPanelProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Çalıştırma Logları
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Terminal className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Henüz log kaydı yok</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    log.success 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-red-500/5 border-red-500/20'
                  )}
                >
                  <div className="flex items-start gap-2 mb-1">
                    {log.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{log.scriptName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                      {log.output && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words font-mono">
                          {log.output}
                        </pre>
                      )}
                      {log.error && (
                        <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap break-words font-mono">
                          {log.error}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
