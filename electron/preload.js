const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  initExecutionPolicy: () => ipcRenderer.invoke('init-execution-policy'),
  fetchScripts: (repoUrl) => ipcRenderer.invoke('fetch-scripts', repoUrl),
  fetchScriptsRecursive: (repoUrl, token) => ipcRenderer.invoke('fetch-scripts-recursive', repoUrl, token),
  fetchFileContent: (downloadUrl) => ipcRenderer.invoke('fetch-file-content', downloadUrl),
  runPowerShell: (scriptContent) => ipcRenderer.invoke('run-powershell', scriptContent),
  runRegistry: (regContent) => ipcRenderer.invoke('run-registry', regContent),
  runBatch: (scriptContent, fileName) => ipcRenderer.invoke('run-batch', scriptContent, fileName),
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
});
