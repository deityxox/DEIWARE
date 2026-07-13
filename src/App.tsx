import { useEffect, useState, useMemo, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ScriptCard } from './components/ScriptCard';
import { LogPanel } from './components/LogPanel';
import { StatusBar } from './components/StatusBar';
import { TerminalSplashScreen } from './components/TerminalSplashScreen';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { ExecutionLog, ScriptFile, Category } from './types';
import {
  Play,
  Download,
  Moon,
  Sun,
  Loader2,
  CheckCircle2,
  Search,
} from 'lucide-react';

function App() {
  // ─── State ───
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeView, setActiveView] = useState<'scripts' | 'logs' | 'settings'>('scripts');
  const [defaultCategories, setDefaultCategories] = useState<Category[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const [initStatus, setInitStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [defaultRepoUrl] = useState('https://github.com/deityxox/DEIWARE/tree/main/scripts');
  const [userRepoUrl, setUserRepoUrl] = useState(() => {
    return localStorage.getItem('userRepoUrl') || '';
  });
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('githubToken') || '';
  });
  const [scriptTab, setScriptTab] = useState<'default' | 'user'>('default');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [scriptSearch, setScriptSearch] = useState('');
  const [lastRunTime, setLastRunTime] = useState<Date | undefined>();
  const [rateLimit, setRateLimit] = useState<{ remaining: number | null; limit: number | null; reset: number | null } | null>(null);

  // ─── Derived ───
  const currentCategories = scriptTab === 'default' ? defaultCategories : userCategories;
  const isLoadingScripts = scriptTab === 'default' ? isLoadingDefault : isLoadingUser;

  const activeCategoryData = useMemo(
    () => currentCategories.find((c) => c.id === activeCategory),
    [currentCategories, activeCategory]
  );

  const filteredScripts = useMemo(() => {
    if (!activeCategoryData) return [];
    if (!scriptSearch.trim()) return activeCategoryData.scripts;
    const q = scriptSearch.toLowerCase();
    return activeCategoryData.scripts.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [activeCategoryData, scriptSearch]);

  const totalScripts = useMemo(
    () => currentCategories.reduce((sum, c) => sum + c.scripts.length, 0),
    [currentCategories]
  );

  // ─── Effects ───

  // Persist userRepoUrl
  useEffect(() => {
    if (userRepoUrl) {
      localStorage.setItem('userRepoUrl', userRepoUrl);
    } else {
      localStorage.removeItem('userRepoUrl');
    }
  }, [userRepoUrl]);

  // Persist githubToken
  useEffect(() => {
    if (githubToken) {
      localStorage.setItem('githubToken', githubToken);
    } else {
      localStorage.removeItem('githubToken');
    }
  }, [githubToken]);

  // Guard against StrictMode double-fire
  const hasInitialized = useRef(false);

  // System theme
  useEffect(() => {
    if (hasInitialized.current) return;
    const initTheme = async () => {
      try {
        const systemTheme = await window.electronAPI.getSystemTheme();
        setTheme(systemTheme);
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      } catch (error) {
        console.error('Tema alınamadı:', error);
      }
    };
    initTheme();
  }, []);

  // ExecutionPolicy init
  useEffect(() => {
    if (hasInitialized.current) return;
    const initPolicy = async () => {
      try {
        const result = await window.electronAPI.initExecutionPolicy();
        if (result.success) {
          setInitStatus('success');
          addLog({
            scriptName: 'Sistem Başlatma',
            success: true,
            output: 'ExecutionPolicy Unrestricted olarak ayarlandı.',
          });
        } else {
          setInitStatus('success');
          addLog({
            scriptName: 'Sistem Başlatma',
            success: true,
            output: 'Sistem hazır. Scriptler -ExecutionPolicy Bypass ile çalıştırılacak.',
            error: result.error,
          });
        }
      } catch (error) {
        setInitStatus('error');
        addLog({
          scriptName: 'Sistem Başlatma',
          success: false,
          output: '',
          error: 'ExecutionPolicy başlatılamadı: ' + String(error),
        });
      }
    };
    initPolicy();
  }, []);

  // Auto-load default scripts
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    loadDefaultScripts();
  }, []);

  // Auto-select first category when categories load
  useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.find((c) => c.id === activeCategory)) {
      setActiveCategory(currentCategories[0].id);
    }
  }, [currentCategories, activeCategory]);

  // ─── Handlers ───

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const addLog = (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
    const newLog: ExecutionLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  const smartCategorize = (scriptName: string, folderPath: string): string => {
    const pathParts = folderPath.split('/').filter((p) => p);

    if (pathParts.length > 0) {
      const folderName = pathParts[pathParts.length - 1];
      const cleanFolderName = folderName.replace(/^\d+[-_\s]*/, '');

      if (cleanFolderName.length > 2) {
        return cleanFolderName
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }

    const name = scriptName.toLowerCase();

    if (name.includes('defender') || name.includes('firewall') || name.includes('security') ||
        name.includes('uac') || name.includes('hvci') || name.includes('integrity')) {
      return 'Security';
    }
    if (name.includes('performance') || name.includes('p0') || name.includes('msi') ||
        name.includes('parking') || name.includes('timer') || name.includes('boost') ||
        name.includes('optimization') || name.includes('optimize')) {
      return 'Performance';
    }
    if (name.includes('startmenu') || name.includes('taskbar') || name.includes('menu') ||
        name.includes('copilot') || name.includes('widget') || name.includes('context') ||
        name.includes('theme') || name.includes('ui') || name.includes('interface')) {
      return 'User Interface';
    }
    if (name.includes('network') || name.includes('power') || name.includes('adapter') ||
        name.includes('ipv4') || name.includes('wake') || name.includes('device manager')) {
      return 'Network & Power';
    }
    if (name.includes('bloatware') || name.includes('uwp') || name.includes('background') ||
        name.includes('remove') || name.includes('uninstall') || name.includes('clean')) {
      return 'Bloatware Management';
    }
    if (name.includes('edge') || name.includes('gamebar') || name.includes('xbox') ||
        name.includes('browser') || name.includes('chrome') || name.includes('brave')) {
      return 'Applications';
    }
    if (name.includes('directx') || name.includes('cpp') || name.includes('dotnet') ||
        name.includes('framework') || name.includes('update') || name.includes('activation') ||
        name.includes('windows')) {
      return 'System Components';
    }
    if (name.includes('nvidia') || name.includes('gpu') || name.includes('display') ||
        name.includes('resolution') || name.includes('hdcp') || name.includes('hags')) {
      return 'Graphics & Display';
    }
    if (name.includes('mouse') || name.includes('scaling') || name.includes('accel')) {
      return 'Input Devices';
    }

    return 'Miscellaneous';
  };

  const getCategoryIcon = (category: string): string => {
    const lower = category.toLowerCase();
    if (lower.includes('security')) return '🔒';
    if (lower.includes('performance')) return '⚡';
    if (lower.includes('interface') || lower.includes('ui')) return '🎨';
    if (lower.includes('network') || lower.includes('power')) return '🌐';
    if (lower.includes('bloatware') || lower.includes('management')) return '🧹';
    if (lower.includes('application')) return '📱';
    if (lower.includes('system') || lower.includes('component')) return '⚙️';
    if (lower.includes('graphic') || lower.includes('display')) return '🖥️';
    if (lower.includes('input') || lower.includes('device')) return '🖱️';
    if (lower.includes('miscellaneous')) return '📦';
    return '📄';
  };

  const loadScriptsFromGithub = async (repoUrl: string, isDefault: boolean = false) => {
    const setLoading = isDefault ? setIsLoadingDefault : setIsLoadingUser;
    const setCategories = isDefault ? setDefaultCategories : setUserCategories;

    setLoading(true);
    try {
      const response = await window.electronAPI.fetchScriptsRecursive(repoUrl, githubToken);

      if (response.error) {
        addLog({
          scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
          success: false,
          output: '',
          error: `${response.error}: ${response.details}`,
        });
        return;
      }

      if (response.scripts && Array.isArray(response.scripts)) {
        // Rate limit bilgisini kaydet
        if (response.rateLimit) {
          setRateLimit(response.rateLimit);
        }

        const scripts: ScriptFile[] = response.scripts.map((file: any) => {
          const pathParts = file.path.split('/');
          const folderPath = pathParts.slice(0, -1).join('/');
          const category = smartCategorize(file.name, folderPath);

          return {
            name: file.name,
            path: file.path,
            type: file.name.endsWith('.ps1')
              ? 'powershell'
              : (file.name.endsWith('.bat') || file.name.endsWith('.cmd'))
                ? 'batch'
                : 'registry',
            category,
            downloadUrl: file.download_url,
          };
        });

        if (scripts.length === 0) {
          addLog({
            scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
            success: false,
            output: '',
            error: 'Repo içinde hiç .ps1, .reg, .bat veya .cmd dosyası bulunamadı',
          });
          return;
        }

        const categoriesMap = new Map<string, ScriptFile[]>();
        scripts.forEach((script) => {
          if (!categoriesMap.has(script.category)) {
            categoriesMap.set(script.category, []);
          }
          categoriesMap.get(script.category)!.push(script);
        });

        const sortedCategories = Array.from(categoriesMap.entries()).sort((a, b) => {
          if (a[0] === 'Miscellaneous') return 1;
          if (b[0] === 'Miscellaneous') return -1;
          return a[0].localeCompare(b[0]);
        });

        const newCategories: Category[] = sortedCategories.map(([name, scripts]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          icon: getCategoryIcon(name),
          scripts: scripts.sort((a, b) => a.name.localeCompare(b.name)),
        }));

        setCategories(newCategories);

        const rl = response.rateLimit;
        const rlText = rl && rl.remaining != null
          ? ` • API: ${rl.remaining}/${rl.limit || '?'} kalan`
          : '';

        addLog({
          scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
          success: true,
          output: `${scripts.length} script yüklendi • ${newCategories.length} kategori${rlText}`,
        });
      } else {
        addLog({
          scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
          success: false,
          output: JSON.stringify(response),
          error: 'GitHub API yanıtı beklenmeyen formatta',
        });
      }
    } catch (error: any) {
      addLog({
        scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
        success: false,
        output: '',
        error: error?.error ? `${error.error}: ${error.details}` : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultScripts = () => {
    loadScriptsFromGithub(defaultRepoUrl, true);
  };

  const loadUserScripts = () => {
    if (!userRepoUrl.trim()) {
      addLog({
        scriptName: 'Kullanıcı Scriptleri',
        success: false,
        output: '',
        error: "Lütfen önce ayarlar sekmesinden repo URL'i girin",
      });
      return;
    }
    loadScriptsFromGithub(userRepoUrl, false);
  };

  const toggleScriptSelection = (scriptPath: string) => {
    setSelectedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(scriptPath)) {
        next.delete(scriptPath);
      } else {
        next.add(scriptPath);
      }
      return next;
    });
  };

  const runScript = async (script: ScriptFile) => {
    setRunningScripts((prev) => new Set(prev).add(script.path));

    try {
      if (!script.content && script.downloadUrl) {
        script.content = await window.electronAPI.fetchFileContent(script.downloadUrl);
      }

      if (!script.content) {
        throw new Error('Script içeriği yüklenemedi');
      }

      let result;
      if (script.type === 'powershell') {
        result = await window.electronAPI.runPowerShell(script.content);
      } else if (script.type === 'batch') {
        result = await window.electronAPI.runBatch(script.content, script.name);
      } else {
        result = await window.electronAPI.runRegistry(script.content);
      }

      addLog({
        scriptName: script.name,
        success: result.success,
        output: result.output,
        error: result.error,
      });

      setLastRunTime(new Date());
    } catch (error) {
      addLog({
        scriptName: script.name,
        success: false,
        output: '',
        error: String(error),
      });
    } finally {
      setRunningScripts((prev) => {
        const next = new Set(prev);
        next.delete(script.path);
        return next;
      });
    }
  };

  const runSelectedScripts = async () => {
    const allScripts = [...defaultCategories, ...userCategories]
      .flatMap((cat) => cat.scripts)
      .filter((s) => selectedScripts.has(s.path));

    for (const script of allScripts) {
      await runScript(script);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('userRepoUrl', userRepoUrl);
    if (githubToken) {
      localStorage.setItem('githubToken', githubToken);
    }
    addLog({
      scriptName: 'Ayarlar',
      success: true,
      output: 'Ayarlar kaydedildi',
    });
  };

  const selectedCount = selectedScripts.size;

  // ─── Render ───
  if (showSplash) {
    return <TerminalSplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          categories={currentCategories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          scriptTab={scriptTab}
          onScriptTabChange={(tab) => {
            setScriptTab(tab);
            setActiveCategory(null);
            setSidebarSearch('');
          }}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* ═══ Scripts View ═══ */}
          {activeView === 'scripts' && (
            <>
              {/* Header */}
              <header className="flex items-center justify-between px-6 py-4 border-b border-border/20">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    {activeCategoryData ? (
                      <span className="flex items-center gap-2.5">
                        <span className="text-lg">{activeCategoryData.icon}</span>
                        {activeCategoryData.name}
                      </span>
                    ) : (
                      'Scriptler'
                    )}
                  </h1>
                  {activeCategoryData && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeCategoryData.scripts.length} script
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Script search */}
                  {activeCategoryData && activeCategoryData.scripts.length > 3 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <input
                        type="text"
                        placeholder="Script ara..."
                        value={scriptSearch}
                        onChange={(e) => setScriptSearch(e.target.value)}
                        className="h-9 w-48 pl-8 pr-3 text-sm rounded-lg bg-background border border-border/50 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scriptTab === 'default' ? loadDefaultScripts : loadUserScripts}
                    disabled={isLoadingScripts}
                    className="h-9"
                  >
                    {isLoadingScripts ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-2" />
                    )}
                    Yenile
                  </Button>

                  {selectedCount > 0 && (
                    <Button onClick={runSelectedScripts} size="sm" className="h-9 gap-2">
                      <Play className="h-3.5 w-3.5" />
                      Çalıştır
                      <span className="bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-md font-mono">
                        {selectedCount}
                      </span>
                    </Button>
                  )}

                  <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9">
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
              </header>

              {/* Script Grid */}
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {!activeCategoryData ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/40">
                      <Download className="h-12 w-12 mb-4" />
                      <p className="text-sm font-medium">
                        {scriptTab === 'default'
                          ? 'Default scriptler yükleniyor...'
                          : 'Henüz kendi scriptleriniz yüklenmedi'}
                      </p>
                      <p className="text-xs mt-1.5">
                        {scriptTab === 'default'
                          ? 'Lütfen bekleyin'
                          : "Ayarlar sekmesinden repo URL'i girin"}
                      </p>
                    </div>
                  ) : filteredScripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40">
                      <Search className="h-8 w-8 mb-3" />
                      <p className="text-sm">Eşleşen script bulunamadı</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 stagger-children">
                      {filteredScripts.map((script) => (
                        <ScriptCard
                          key={script.path}
                          script={script}
                          selected={selectedScripts.has(script.path)}
                          onToggleSelect={() => toggleScriptSelection(script.path)}
                          onRun={() => runScript(script)}
                          isRunning={runningScripts.has(script.path)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {/* ═══ Logs View ═══ */}
          {activeView === 'logs' && (
            <LogPanel logs={logs} onClearLogs={clearLogs} />
          )}

          {/* ═══ Settings View ═══ */}
          {activeView === 'settings' && (
            <ScrollArea className="flex-1">
              <div className="max-w-2xl mx-auto p-8 space-y-8">
                {/* Page title */}
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Ayarlar</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uygulama ayarlarınızı yapılandırın
                  </p>
                </div>

                {/* Default Repository */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Default Repository
                  </h3>
                  <div className="glass-card rounded-xl p-5 space-y-3">
                    <Input value={defaultRepoUrl} disabled className="bg-muted/50 text-sm" />
                    <p className="text-xs text-muted-foreground/70">
                      Bu repo otomatik olarak yüklenir ve önerilen scriptleri içerir.
                    </p>
                  </div>
                </section>

                {/* User Repository */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Kendi Repository'niz
                  </h3>
                  <div className="glass-card rounded-xl p-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Repository URL</label>
                      <Input
                        placeholder="https://github.com/kullanici/repo/tree/main/scripts"
                        value={userRepoUrl}
                        onChange={(e) => setUserRepoUrl(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                      <p className="text-xs font-medium text-foreground/80">💡 Nasıl Kullanılır?</p>
                      <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                        <li>GitHub'da bir repo oluşturun</li>
                        <li>.ps1 ve .reg dosyalarınızı organize edin</li>
                        <li>Repo URL'ini yukarıya girin</li>
                        <li>Scriptler → Benim sekmesinden yükleyin</li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* GitHub Token */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    GitHub Token
                  </h3>
                  <div className="glass-card rounded-xl p-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Personal Access Token</label>
                      <Input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        className="text-sm font-mono"
                      />
                      {githubToken && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Token kaydedildi
                        </p>
                      )}
                      {!githubToken && (
                        <p className="text-xs text-muted-foreground/60">
                          Rate limit'i artırmak için opsiyonel token.
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/15 p-4 space-y-2">
                      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                        ⚠️ Rate Limit Hatası mı Aldınız?
                      </p>
                      <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                        <li>
                          <a
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            GitHub Settings → Tokens
                          </a>
                        </li>
                        <li>"Generate new token (classic)" tıklayın</li>
                        <li>"public_repo" yetkisini seçin</li>
                        <li>Token'ı kopyalayıp yukarıya yapıştırın</li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* Appearance */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Görünüm
                  </h3>
                  <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Tema</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {theme === 'dark' ? 'Koyu tema aktif' : 'Açık tema aktif'}
                        </p>
                      </div>
                      <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9">
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* About */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Hakkında
                  </h3>
                  <div className="glass-card rounded-xl p-5 space-y-1.5 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">DEIWARE</p>
                    <p className="text-xs">Versiyon 1.0.0</p>
                    <p className="text-xs mt-2">
                      PowerShell scriptlerinizi ve Registry dosyalarınızı GitHub üzerinden
                      yönetip çalıştırmanızı sağlar.
                    </p>
                  </div>
                </section>

                {/* Save */}
                <div className="flex justify-end pb-4">
                  <Button onClick={handleSaveSettings} className="h-10 px-6">
                    Ayarları Kaydet
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar
        selectedCount={selectedCount}
        totalScripts={totalScripts}
        initStatus={initStatus}
        lastRunTime={lastRunTime}
        rateLimit={rateLimit}
      />
    </div>
  );
}

export default App;
