import { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { ScriptCard } from './components/ScriptCard';
import { LogPanel } from './components/LogPanel';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { ExecutionLog, ScriptFile, Category } from './types';
import {
  Play,
  Download,
  Moon,
  Sun,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal,
  Settings as SettingsIcon,
  Star,
  User,
} from 'lucide-react';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [defaultCategories, setDefaultCategories] = useState<Category[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const [initStatus, setInitStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [defaultRepoUrl] = useState('https://github.com/deityxox/DEIWARE/tree/main/scripts');
  const [userRepoUrl, setUserRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState(() => {
    // localStorage'dan token'ı yükle
    return localStorage.getItem('githubToken') || '';
  });
  const [activeTab, setActiveTab] = useState('scripts');
  const [scriptTab, setScriptTab] = useState<'default' | 'user'>('default');

  // GitHub token değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (githubToken) {
      localStorage.setItem('githubToken', githubToken);
    } else {
      localStorage.removeItem('githubToken');
    }
  }, [githubToken]);

  // Sistem temasını al
  useEffect(() => {
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

  // ExecutionPolicy ayarla
  useEffect(() => {
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
        setInitStatus('success');
        addLog({
          scriptName: 'Sistem Başlatma',
          success: true,
          output: 'Sistem hazır. Scriptler -ExecutionPolicy Bypass ile çalıştırılacak.',
        });
      }
    };
    initPolicy();
  }, []);

  // Default scriptleri otomatik yükle
  useEffect(() => {
    loadDefaultScripts();
  }, []);

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

  // Akıllı kategorize fonksiyonu
  const smartCategorize = (scriptName: string, folderPath: string): string => {
    // Önce klasör isminden kategori bulmaya çalış
    const pathParts = folderPath.split('/').filter(p => p);
    
    // Eğer klasör varsa ve anlamlı bir isimse kullan
    if (pathParts.length > 0) {
      const folderName = pathParts[pathParts.length - 1];
      
      // Numaralı klasör isimleri (01-Security gibi) temizle
      const cleanFolderName = folderName.replace(/^\d+[-_\s]*/, '');
      
      // Tire ve alt çizgileri boşluğa çevir, her kelimenin ilk harfini büyük yap
      if (cleanFolderName.length > 2) {
        return cleanFolderName
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
    
    // Klasörden kategori bulunamazsa, script isminden analiz et
    const name = scriptName.toLowerCase();
    
    // Güvenlik
    if (name.includes('defender') || name.includes('firewall') || name.includes('security') || 
        name.includes('uac') || name.includes('hvci') || name.includes('integrity')) {
      return 'Security';
    }
    
    // Performans
    if (name.includes('performance') || name.includes('p0') || name.includes('msi') || 
        name.includes('parking') || name.includes('timer') || name.includes('boost') ||
        name.includes('optimization') || name.includes('optimize')) {
      return 'Performance';
    }
    
    // Kullanıcı Arayüzü
    if (name.includes('startmenu') || name.includes('taskbar') || name.includes('menu') ||
        name.includes('copilot') || name.includes('widget') || name.includes('context') ||
        name.includes('theme') || name.includes('ui') || name.includes('interface')) {
      return 'User Interface';
    }
    
    // Ağ ve Güç
    if (name.includes('network') || name.includes('power') || name.includes('adapter') ||
        name.includes('ipv4') || name.includes('wake') || name.includes('device manager')) {
      return 'Network & Power';
    }
    
    // Bloatware
    if (name.includes('bloatware') || name.includes('uwp') || name.includes('background') ||
        name.includes('remove') || name.includes('uninstall') || name.includes('clean')) {
      return 'Bloatware Management';
    }
    
    // Uygulamalar
    if (name.includes('edge') || name.includes('gamebar') || name.includes('xbox') ||
        name.includes('browser') || name.includes('chrome') || name.includes('brave')) {
      return 'Applications';
    }
    
    // Sistem Bileşenleri
    if (name.includes('directx') || name.includes('cpp') || name.includes('dotnet') ||
        name.includes('framework') || name.includes('update') || name.includes('activation') ||
        name.includes('windows')) {
      return 'System Components';
    }
    
    // GPU/Ekran
    if (name.includes('nvidia') || name.includes('gpu') || name.includes('display') ||
        name.includes('resolution') || name.includes('hdcp') || name.includes('hags')) {
      return 'Graphics & Display';
    }
    
    // Mouse/Input
    if (name.includes('mouse') || name.includes('scaling') || name.includes('accel')) {
      return 'Input Devices';
    }
    
    // Varsayılan
    return 'Miscellaneous';
  };

  const loadScriptsFromGithub = async (repoUrl: string, isDefault: boolean = false) => {
    const setLoading = isDefault ? setIsLoadingDefault : setIsLoadingUser;
    const setCategories = isDefault ? setDefaultCategories : setUserCategories;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.fetchScriptsRecursive(repoUrl, githubToken);

      console.log('GitHub Response:', response);

      if (response.error) {
        addLog({
          scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
          success: false,
          output: '',
          error: `${response.error}: ${response.details}`,
        });
        return;
      }

      if (Array.isArray(response)) {
        const scripts: ScriptFile[] = response.map((file) => {
          // Klasör yolunu al (dosya adı olmadan)
          const pathParts = file.path.split('/');
          const folderPath = pathParts.slice(0, -1).join('/');
          const category = smartCategorize(file.name, folderPath);
          
          // Debug log
          console.log('Script:', file.name, '| Folder:', folderPath, '| Category:', category);
          
          return {
            name: file.name,
            path: file.path,
            type: file.name.endsWith('.ps1') ? 'powershell' : 'registry',
            category: category,
            downloadUrl: file.download_url,
          };
        });

        if (scripts.length === 0) {
          addLog({
            scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
            success: false,
            output: '',
            error: 'Repo içinde hiç .ps1 veya .reg dosyası bulunamadı',
          });
          return;
        }

        // Kategorilere göre grupla
        const categoriesMap = new Map<string, ScriptFile[]>();
        scripts.forEach((script) => {
          if (!categoriesMap.has(script.category)) {
            categoriesMap.set(script.category, []);
          }
          categoriesMap.get(script.category)!.push(script);
        });

        // Kategorileri alfabetik sırala (Miscellaneous en sona)
        const sortedCategories = Array.from(categoriesMap.entries()).sort((a, b) => {
          if (a[0] === 'Miscellaneous') return 1;
          if (b[0] === 'Miscellaneous') return -1;
          return a[0].localeCompare(b[0]);
        });

        const newCategories: Category[] = sortedCategories.map(([name, scripts]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          icon: getCategoryIcon(name),
          scripts: scripts.sort((a, b) => a.name.localeCompare(b.name)), // Scriptleri alfabetik sırala
        }));

        setCategories(newCategories);
        addLog({
          scriptName: isDefault ? 'Default Scriptler' : 'Kullanıcı Scriptleri',
          success: true,
          output: `${scripts.length} script yüklendi • ${newCategories.length} kategori oluşturuldu`,
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
        error: 'Lütfen önce ayarlar sekmesinden repo URL\'i girin',
      });
      return;
    }
    loadScriptsFromGithub(userRepoUrl, false);
  };

  const getCategoryIcon = (category: string): string => {
    const lower = category.toLowerCase();
    
    // Güvenlik
    if (lower.includes('security')) return '🔒';
    
    // Performans
    if (lower.includes('performance')) return '⚡';
    
    // Kullanıcı Arayüzü
    if (lower.includes('interface') || lower.includes('ui')) return '🎨';
    
    // Ağ ve Güç
    if (lower.includes('network') || lower.includes('power')) return '🌐';
    
    // Bloatware
    if (lower.includes('bloatware') || lower.includes('management')) return '🧹';
    
    // Uygulamalar
    if (lower.includes('application')) return '📱';
    
    // Sistem Bileşenleri
    if (lower.includes('system') || lower.includes('component')) return '⚙️';
    
    // GPU/Ekran
    if (lower.includes('graphic') || lower.includes('display')) return '🖥️';
    
    // Input Devices
    if (lower.includes('input') || lower.includes('device')) return '🖱️';
    
    // Diğer
    if (lower.includes('miscellaneous')) return '📦';
    
    return '�';
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
      } else {
        result = await window.electronAPI.runRegistry(script.content);
      }

      addLog({
        scriptName: script.name,
        success: result.success,
        output: result.output,
        error: result.error,
      });
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

  const selectedCount = selectedScripts.size;
  const currentCategories = scriptTab === 'default' ? defaultCategories : userCategories;
  const isLoadingScripts = scriptTab === 'default' ? isLoadingDefault : isLoadingUser;

  const handleSaveSettings = () => {
    addLog({
      scriptName: 'Ayarlar',
      success: true,
      output: 'Ayarlar kaydedildi',
    });
    setActiveTab('scripts');
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <TitleBar />

      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              DEIWARE
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Windows Script Management Tool
            </p>
          </div>

          <div className="flex items-center gap-2">
            {initStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Sistem Hazır</span>
              </div>
            )}
            {initStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Başlatma Hatası</span>
              </div>
            )}

            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {activeTab === 'scripts' && (
              <>
                <Button
                  variant="outline"
                  onClick={scriptTab === 'default' ? loadDefaultScripts : loadUserScripts}
                  disabled={isLoadingScripts}
                >
                  {isLoadingScripts ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {scriptTab === 'default' ? 'Default Yenile' : 'Scriptleri Yükle'}
                </Button>

                {selectedCount > 0 && (
                  <Button onClick={runSelectedScripts}>
                    <Play className="h-4 w-4 mr-2" />
                    Seçilenleri Çalıştır ({selectedCount})
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="scripts" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Scriptler
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Loglar
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Ayarlar
            </TabsTrigger>
          </TabsList>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="flex-1 overflow-hidden mt-6">
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0 pb-3">
                <Tabs value={scriptTab} onValueChange={(v) => setScriptTab(v as 'default' | 'user')}>
                  <TabsList className="grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="default" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Default Scriptler
                    </TabsTrigger>
                    <TabsTrigger value="user" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Benim Scriptlerim
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="flex-1 pt-0 overflow-hidden">
                {currentCategories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Download className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm mb-2">
                      {scriptTab === 'default' 
                        ? 'Default scriptler yükleniyor...' 
                        : 'Henüz kendi scriptleriniz yüklenmedi'}
                    </p>
                    <p className="text-xs">
                      {scriptTab === 'default'
                        ? 'Lütfen bekleyin'
                        : 'Ayarlar sekmesinden repo URL\'i girin ve "Scriptleri Yükle" butonuna tıklayın'}
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue={currentCategories[0]?.id} className="h-full flex flex-col">
                    <TabsList className="flex-shrink-0">
                      {currentCategories.map((cat) => (
                        <TabsTrigger key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {currentCategories.map((cat) => (
                      <TabsContent
                        key={cat.id}
                        value={cat.id}
                        className="flex-1 overflow-hidden mt-4"
                      >
                        <ScrollArea className="h-full">
                          <div className="space-y-2 pr-4">
                            {cat.scripts.map((script) => (
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
                        </ScrollArea>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="flex-1 overflow-hidden mt-6">
            <LogPanel logs={logs} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-hidden mt-6">
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>Ayarlar</CardTitle>
                <CardDescription>
                  Uygulama ayarlarınızı yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-6">
                {/* Default Repository */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Default Repository (Otomatik Yüklenir)</h3>
                    <div className="space-y-2">
                      <Input
                        value={defaultRepoUrl}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Bu repo otomatik olarak yüklenir ve önerilen scriptleri içerir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* User GitHub Repository */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Kendi GitHub Repository'niz</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Repository URL</label>
                      <Input
                        placeholder="https://github.com/kullanici/repo/tree/main/scripts"
                        value={userRepoUrl}
                        onChange={(e) => setUserRepoUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Kendi scriptlerinizi buradan yükleyebilirsiniz.
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                        <li>• https://github.com/kullanici/repo</li>
                        <li>• https://github.com/kullanici/repo/tree/main</li>
                        <li>• https://github.com/kullanici/repo/tree/branch/folder</li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <p className="text-sm font-medium">💡 Nasıl Kullanılır?</p>
                    <ol className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>1. GitHub'da bir repo oluşturun</li>
                      <li>2. .ps1 ve .reg dosyalarınızı istediğiniz klasörlerde organize edin</li>
                      <li>3. Repo URL'ini yukarıya girin ve kaydedin</li>
                      <li>4. Scriptler sekmesinden "Benim Scriptlerim" seçin</li>
                      <li>5. "Scriptleri Yükle" butonuna tıklayın</li>
                    </ol>
                  </div>
                </div>

                {/* GitHub Token */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">GitHub Personal Access Token (Opsiyonel)</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token</label>
                      <Input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                      />
                      {githubToken && (
                        <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Token kaydedildi ve scriptler yüklenirken kullanılacak
                        </p>
                      )}
                      {!githubToken && (
                        <p className="text-xs text-muted-foreground">
                          GitHub API rate limit'ini artırmak için token ekleyebilirsiniz.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-2">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                      ⚠️ Rate Limit Hatası mı Aldınız?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      GitHub API saatlik 60 istek limiti vardır. Bu limiti aşarsanız:
                    </p>
                    <ol className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>1. <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Settings → Developer settings → Personal access tokens</a></li>
                      <li>2. "Generate new token (classic)" tıklayın</li>
                      <li>3. Sadece "public_repo" yetkisini seçin</li>
                      <li>4. Token'ı kopyalayıp yukarıya yapıştırın</li>
                      <li>5. Token ile saatlik limit 5000 isteğe çıkar</li>
                    </ol>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Not:</strong> Token sadece public repolar için kullanılacak ve bilgisayarınızda saklanacaktır.
                    </p>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Görünüm</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Tema</p>
                        <p className="text-sm text-muted-foreground">
                          {theme === 'dark' ? 'Koyu tema aktif' : 'Açık tema aktif'}
                        </p>
                      </div>
                      <Button variant="outline" size="icon" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Hakkında</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>DEIWARE</strong></p>
                      <p>Versiyon: 1.0.0</p>
                      <p>Windows Script Management Tool</p>
                      <p className="pt-2">
                        PowerShell scriptlerinizi ve Registry dosyalarınızı GitHub üzerinden 
                        yönetip çalıştırmanızı sağlar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveSettings}>
                    Ayarları Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
