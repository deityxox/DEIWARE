import { useEffect, useState } from 'react';
import { Monitor, RefreshCw } from 'lucide-react';
import { SystemInfo } from '@/types';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export function HomePanel() {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSysInfo = async () => {
    setLoading(true);
    try {
      const info = await window.electronAPI.getSystemInfo();
      setSysInfo(info);
    } catch (e) {
      console.error('Sistem bilgileri alınamadı :', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSysInfo();
  }, []);

  const formatGiB = (bytes: number) => {
    return (bytes / (1024 ** 3)).toFixed(2);
  };

  const formatDiskGiB = (bytes: number) => {
    return (bytes / (1024 ** 3)).toFixed(0);
  };

  // Windows 11 ASCII Logo
  const asciiWindowsLogo = `
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████

  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
  ██████████████  ██████████████
`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/20">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <Monitor className="h-5 w-5 text-primary" />
            Sistem Özeti
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cihazınızın donanım ve işletim sistemi bilgileri
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSysInfo} disabled={loading} className="h-9">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground/50 font-mono text-sm">
              <div className="w-1.5 h-4 bg-primary animate-pulse mr-1 inline-block" />
              <span>Sistem özellikleri taranıyor...</span>
            </div>
          ) : sysInfo ? (
            <div className="glass-card rounded-2xl p-8 max-w-3xl w-full border border-border/40 shadow-xl flex flex-col md:flex-row items-center gap-12 font-mono">
              {/* ASCII Art Column */}
              <div className="text-sky-500 dark:text-sky-400 font-bold whitespace-pre select-none text-[8px] sm:text-[10px] leading-none shrink-0">
                {asciiWindowsLogo}
              </div>

              {/* Info Column */}
              <div className="flex-1 text-sm space-y-2 select-text text-foreground/90 w-full">
                {/* Header line: Admin@DESKTOP-ALG45QS */}
                <div>
                  <span className="text-sky-600 dark:text-sky-400 font-bold text-base">
                    {sysInfo.username}@{sysInfo.hostname}
                  </span>
                  <div className="border-b border-border/50 w-full mt-1.5 mb-2.5" />
                </div>

                <div className="space-y-1.5">
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">OS:</span> {sysInfo.osName}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Host:</span> {sysInfo.host}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Kernel:</span> {sysInfo.kernel}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Motherboard:</span> {sysInfo.motherboard}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Uptime:</span> {sysInfo.uptime}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Resolution:</span> {sysInfo.resolution}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">CPU:</span> {sysInfo.cpu}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">GPU:</span> {sysInfo.gpu}
                  </p>
                  <p>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Memory:</span> {formatGiB(sysInfo.memory.used)} GiB / {formatGiB(sysInfo.memory.total)} GiB ({Math.round((sysInfo.memory.used / sysInfo.memory.total) * 100)}%)
                  </p>
                  {sysInfo.disks && sysInfo.disks.map((disk) => (
                    <p key={disk.deviceId}>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">Disk ({disk.deviceId}):</span> {formatDiskGiB(disk.total - disk.free)} GiB / {formatDiskGiB(disk.total)} GiB ({disk.total > 0 ? Math.round(((disk.total - disk.free) / disk.total) * 100) : 0}%)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-red-500 font-medium font-mono">
              Sistem bilgileri yüklenemedi.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
export default HomePanel;
