import { AlertCircle, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import versionData from '../../version.json';

interface RateLimit {
  remaining: number | null;
  limit: number | null;
  reset: number | null;
}

interface StatusBarProps {
  selectedCount: number;
  totalScripts: number;
  initStatus: 'pending' | 'success' | 'error';
  lastRunTime?: Date;
  rateLimit?: RateLimit | null;
}

export function StatusBar({ selectedCount, totalScripts, initStatus, lastRunTime, rateLimit }: StatusBarProps) {
  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);

  const rateLimitPercent = rateLimit?.remaining != null && rateLimit?.limit
    ? Math.round((rateLimit.remaining / rateLimit.limit) * 100)
    : null;

  const rateLimitColor = rateLimitPercent != null
    ? rateLimitPercent > 50
      ? 'text-emerald-500'
      : rateLimitPercent > 20
        ? 'text-yellow-500'
        : 'text-red-500'
    : '';

  return (
    <div className="h-7 flex items-center justify-between px-4 border-t border-border/30 bg-background/60 backdrop-blur-sm text-[11px] text-muted-foreground select-none">
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-1.5">
          {initStatus === 'success' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" />
              <span>Sistem Hazır</span>
            </>
          )}
          {initStatus === 'error' && (
            <>
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-500">Hata</span>
            </>
          )}
          {initStatus === 'pending' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-dot-pulse" />
              <span>Başlatılıyor...</span>
            </>
          )}
        </div>

        {/* Selected count */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 text-primary">
            <Zap className="h-3 w-3" />
            <span className="font-medium">{selectedCount} seçili</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Rate limit */}
        {rateLimit && rateLimit.remaining != null && (
          <div className={cn('flex items-center gap-1.5 tabular-nums', rateLimitColor)}>
            <Globe className="h-3 w-3" />
            <span>
              API: {rateLimit.remaining.toLocaleString('tr-TR')}/{rateLimit.limit?.toLocaleString('tr-TR') || '?'}
            </span>
            {rateLimit.reset && (
              <span className="text-muted-foreground/50 ml-0.5">
                · {formatTime(new Date(rateLimit.reset))}
              </span>
            )}
          </div>
        )}

        {/* Total scripts & Version */}
        <span className="tabular-nums flex items-center gap-1.5">
          {totalScripts > 0 && <span>{totalScripts} script</span>}
          {totalScripts > 0 && <span className="text-muted-foreground/30">•</span>}
          <span className="text-muted-foreground/80">
            DEIWARE {versionData.version}
          </span>
          <span className="text-muted-foreground/40">
            ({versionData.commit === 'dev' ? 'Geliştirme' : `${versionData.commit} • ${versionData.date}`})
          </span>
        </span>

        {/* Last run */}
        {lastRunTime && (
          <span className="tabular-nums">
            Son: {formatTime(lastRunTime)}
          </span>
        )}
      </div>
    </div>
  );
}
