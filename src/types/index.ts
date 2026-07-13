export interface ScriptFile {
  name: string;
  path: string;
  type: 'powershell' | 'registry' | 'batch';
  category: string;
  description?: string;
  downloadUrl?: string;
  content?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  scripts: ScriptFile[];
}

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  scriptName: string;
  success: boolean;
  output: string;
  error?: string;
}

export interface AppSettings {
  githubRepoUrl: string;
  theme: 'light' | 'dark' | 'system';
  autoCheckUpdates: boolean;
}

export interface DiskInfo {
  deviceId: string;
  total: number;
  free: number;
}

export interface SystemInfo {
  username: string;
  hostname: string;
  osName: string;
  host: string;
  kernel: string;
  motherboard: string;
  uptime: string;
  resolution: string;
  cpu: string;
  gpu: string;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disks: DiskInfo[];
}

declare global {
  interface Window {
    electronAPI: {
      initExecutionPolicy: () => Promise<{ success: boolean; output?: string; error?: string }>;
      fetchScripts: (repoUrl: string) => Promise<any>;
      fetchScriptsRecursive: (repoUrl: string, githubToken?: string) => Promise<any>;
      fetchFileContent: (downloadUrl: string) => Promise<string>;
      runPowerShell: (scriptContent: string) => Promise<{ success: boolean; output: string; error: string }>;
      runRegistry: (regContent: string) => Promise<{ success: boolean; output: string; error: string }>;
      runBatch: (scriptContent: string, fileName: string) => Promise<{ success: boolean; output: string; error: string }>;
      getSystemTheme: () => Promise<'light' | 'dark'>;
      getSystemInfo: () => Promise<SystemInfo>;
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
    };
  }
}
