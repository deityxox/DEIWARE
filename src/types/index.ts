export interface ScriptFile {
  name: string;
  path: string;
  type: 'powershell' | 'registry';
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

declare global {
  interface Window {
    electronAPI: {
      initExecutionPolicy: () => Promise<{ success: boolean; output?: string; error?: string }>;
      fetchScripts: (repoUrl: string) => Promise<any>;
      fetchScriptsRecursive: (repoUrl: string) => Promise<any>;
      fetchFileContent: (downloadUrl: string) => Promise<string>;
      runPowerShell: (scriptContent: string) => Promise<{ success: boolean; output: string; error: string }>;
      runRegistry: (regContent: string) => Promise<{ success: boolean; output: string; error: string }>;
      getSystemTheme: () => Promise<'light' | 'dark'>;
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
    };
  }
}
