const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// İlk çalıştırmada ExecutionPolicy ayarla (Registry üzerinden)
ipcMain.handle('init-execution-policy', async () => {
  return new Promise((resolve) => {
    // Registry üzerinden ExecutionPolicy'yi Unrestricted yap
    const regCommand = 'reg add "HKCU\\Software\\Microsoft\\PowerShell\\1\\ShellIds\\Microsoft.PowerShell" /v ExecutionPolicy /t REG_SZ /d Unrestricted /f';
    
    exec(regCommand, (error, stdout, stderr) => {
      if (error) {
        // Hata olsa bile devam et
        resolve({ 
          success: false, 
          error: 'ExecutionPolicy ayarlanamadı (ancak scriptler -ExecutionPolicy Bypass ile çalışacak)',
          output: stderr || error.message 
        });
      } else {
        resolve({ 
          success: true, 
          output: 'ExecutionPolicy başarıyla Unrestricted olarak ayarlandı' 
        });
      }
    });
  });
});

// Sistem bilgilerini al (Neofetch formatı için)
ipcMain.handle('get-system-info', async () => {
  return new Promise((resolve) => {
    // 1. Gather Node OS info
    const username = process.env.USERNAME || os.userInfo().username || 'User';
    const hostname = os.hostname();
    const kernel = os.release();
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown CPU';
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptimeSec = os.uptime();

    // Uptime formatter
    const days = Math.floor(uptimeSec / (3600 * 24));
    const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days} gün, `;
    if (hours > 0) uptimeStr += `${hours} saat, `;
    uptimeStr += `${minutes} dakika`;

    // 2. Run PowerShell command for GPU, Host, Board, Resolution, Disks
    const psCommand = `PowerShell -NoProfile -Command "$cs = Get-CimInstance Win32_ComputerSystem; $board = Get-CimInstance Win32_BaseBoard; $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1; $disksList = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3'); $disks = $disksList | ForEach-Object { @{ deviceId = $_.DeviceID; size = $_.Size; freeSpace = $_.FreeSpace } }; $os = Get-CimInstance Win32_OperatingSystem; $resStr = 'Unknown'; if ($gpu -and $gpu.CurrentHorizontalResolution) { $resStr = '{0}x{1}' -f $gpu.CurrentHorizontalResolution, $gpu.CurrentVerticalResolution }; @{ osName = $os.Caption; host = '{0} {1}' -f $cs.Manufacturer, $cs.Model; motherboard = '{0} {1}' -f $board.Manufacturer, $board.Product; gpuName = if ($gpu) { $gpu.Name } else { 'Unknown' }; resolution = $resStr; disks = $disks } | ConvertTo-Json"`;

    exec(psCommand, (error, stdout) => {
      let psInfo = {};
      if (!error && stdout) {
        try {
          psInfo = JSON.parse(stdout.trim());
        } catch (e) {
          console.error('Failed to parse PowerShell system info JSON:', e);
        }
      }

      let disks = [];
      if (psInfo.disks) {
        const rawDisks = Array.isArray(psInfo.disks) ? psInfo.disks : [psInfo.disks];
        disks = rawDisks.map(d => ({
          deviceId: d.deviceId || 'Unknown',
          total: d.size || 0,
          free: d.freeSpace || 0
        }));
      }

      // 3. Merge and return
      resolve({
        username,
        hostname,
        osName: psInfo.osName || 'Microsoft Windows 11 Pro',
        host: psInfo.host || 'Unknown Host',
        kernel,
        motherboard: psInfo.motherboard || 'Unknown Motherboard',
        uptime: uptimeStr,
        resolution: psInfo.resolution || '1920x1080',
        cpu: cpuModel,
        gpu: psInfo.gpuName || 'Unknown GPU',
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
        },
        disks: disks
      });
    });
  });
});

// GitHub'dan script listesi çek (recursive)
ipcMain.handle('fetch-scripts', async (event, repoUrl) => {
  return new Promise((resolve, reject) => {
    // URL'i düzelt - api.api.github.com sorununu çöz
    let apiUrl = repoUrl;
    if (!repoUrl.includes('api.github.com')) {
      // Normal GitHub URL'ini API URL'ine çevir
      // https://github.com/user/repo/tree/branch/path -> https://api.github.com/repos/user/repo/contents/path?ref=branch
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.*))?)?/);
      if (match) {
        const [, owner, repo, branch, path] = match;
        apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path || ''}`;
        if (branch) {
          apiUrl += `?ref=${branch}`;
        }
      }
    }

    https.get(
      apiUrl,
      {
        headers: {
          'User-Agent': 'DEIWARE',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject({ error: 'JSON parse hatası', details: e.message });
          }
        });
      }
    ).on('error', (err) => {
      reject({ error: 'GitHub bağlantı hatası', details: err.message });
    });
  });
});

// GitHub'dan klasör içeriğini recursive oku
ipcMain.handle('fetch-scripts-recursive', async (event, repoUrl, githubToken = '') => {
  const allScripts = [];
  let lastRateLimit = { remaining: null, limit: null, reset: null };
  
  const fetchFolder = async (url) => {
    return new Promise((resolve, reject) => {
      console.log('Fetching:', url);
      
      const headers = {
        'User-Agent': 'DEIWARE',
      };
      
      // Token varsa ekle
      if (githubToken && githubToken.trim()) {
        headers['Authorization'] = `Bearer ${githubToken.trim()}`;
        console.log('Using GitHub token for authenticated request');
      } else {
        console.log('No GitHub token provided - using unauthenticated request');
      }
      
      https.get(
        url,
        { headers },
        (res) => {
          let data = '';
          
          // Rate limit bilgilerini yakala
          const remaining = res.headers['x-ratelimit-remaining'];
          const limit = res.headers['x-ratelimit-limit'];
          const reset = res.headers['x-ratelimit-reset'];
          if (remaining != null) {
            lastRateLimit = {
              remaining: parseInt(remaining, 10),
              limit: parseInt(limit, 10) || null,
              reset: reset ? parseInt(reset, 10) * 1000 : null,
            };
          }
          
          // HTTP hata kodlarını kontrol et
          if (res.statusCode === 403) {
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              const remaining = res.headers['x-ratelimit-remaining'];
              const resetTime = new Date(res.headers['x-ratelimit-reset'] * 1000).toLocaleString('tr-TR');
              const isAuthenticated = githubToken && githubToken.trim() ? 'Evet' : 'Hayır';
              
              reject({ 
                error: 'GitHub Rate Limit', 
                details: `API limiti aşıldı.\n\nKalan istek: ${remaining}\nSıfırlanma zamanı: ${resetTime}\nToken kullanılıyor: ${isAuthenticated}\n\n${isAuthenticated === 'Hayır' ? 'Ayarlardan GitHub Personal Access Token ekleyin.' : 'Token geçersiz olabilir veya limiti dolmuş. Yeni token oluşturun.'}` 
              });
            });
            return;
          }
          
          if (res.statusCode === 401) {
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              reject({ 
                error: 'GitHub Yetkilendirme Hatası', 
                details: 'GitHub token geçersiz veya süresi dolmuş. Lütfen yeni bir Personal Access Token oluşturun:\n1. github.com/settings/tokens\n2. Generate new token (classic)\n3. "public_repo" yetkisini seçin\n4. Token\'ı kopyalayıp ayarlara yapıştırın' 
              });
            });
            return;
          }
          
          if (res.statusCode !== 200) {
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                reject({ 
                  error: `HTTP ${res.statusCode}`, 
                  details: parsed.message || 'GitHub API hatası' 
                });
              } catch (e) {
                reject({ 
                  error: `HTTP ${res.statusCode}`, 
                  details: 'GitHub API yanıt vermedi' 
                });
              }
            });
            return;
          }
          
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              
              // API hatası kontrolü
              if (parsed.message) {
                reject({ 
                  error: 'GitHub API Hatası', 
                  details: parsed.message 
                });
                return;
              }
              
              resolve(parsed);
            } catch (e) {
              reject({ error: 'JSON parse hatası', details: e.message });
            }
          });
        }
      ).on('error', (err) => {
        reject({ error: 'GitHub bağlantı hatası', details: err.message });
      });
    });
  };

  const processItems = async (items, basePath = '') => {
    for (const item of items) {
      if (item.type === 'file' && (item.name.endsWith('.ps1') || item.name.endsWith('.reg') || item.name.endsWith('.bat') || item.name.endsWith('.cmd'))) {
        // Dosya path'ine base path ekle
        allScripts.push({
          ...item,
          path: basePath ? `${basePath}/${item.name}` : item.name
        });
      } else if (item.type === 'dir') {
        // Alt klasörleri de tara
        try {
          const subItems = await fetchFolder(item.url);
          if (Array.isArray(subItems)) {
            await processItems(subItems, basePath ? `${basePath}/${item.name}` : item.name);
          }
        } catch (e) {
          console.log('Alt klasör tarama hatası:', item.name, e);
        }
      }
    }
  };

  try {
    // URL'i düzelt
    let apiUrl = repoUrl;
    if (!repoUrl.includes('api.github.com')) {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.*))?)?/);
      if (match) {
        const [, owner, repo, branch = 'main', pathStr = ''] = match;
        
        // Path'i temizle
        const cleanPath = pathStr.replace(/^\/+|\/+$/g, '');
        
        apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;
        apiUrl += `?ref=${branch}`;
        
        console.log('Parsed URL:', { owner, repo, branch, path: cleanPath, apiUrl });
      } else {
        return { 
          error: 'Geçersiz GitHub URL', 
          details: 'URL formatı: https://github.com/kullanici/repo/tree/branch/klasor' 
        };
      }
    }

    const items = await fetchFolder(apiUrl);
    
    if (!Array.isArray(items)) {
      console.log('API Response:', items);
      return { 
        error: 'Geçersiz yanıt', 
        details: 'API yanıtı bir dizi değil. Repo URL\'ini kontrol edin.' 
      };
    }
    
    if (items.length === 0) {
      return { 
        error: 'Boş klasör', 
        details: 'Belirtilen klasörde dosya bulunamadı' 
      };
    }
    
    await processItems(items);
    
    if (allScripts.length === 0) {
      return { 
        error: 'Script bulunamadı', 
        details: 'Klasörde .ps1, .reg, .bat veya .cmd dosyası bulunamadı' 
      };
    }
    
    console.log(`Toplam ${allScripts.length} script bulundu`);
    return { scripts: allScripts, rateLimit: lastRateLimit };
  } catch (error) {
    console.error('fetch-scripts-recursive error:', error);
    return { error: error.error || 'Hata', details: error.details || String(error) };
  }
});

// GitHub'dan dosya içeriği çek
ipcMain.handle('fetch-file-content', async (event, downloadUrl) => {
  return new Promise((resolve, reject) => {
    https.get(
      downloadUrl,
      {
        headers: {
          'User-Agent': 'DEIWARE',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    ).on('error', (err) => {
      reject({ error: 'Dosya indirme hatası', details: err.message });
    });
  });
});

// PowerShell script çalıştır
ipcMain.handle('run-powershell', async (event, scriptContent) => {
  return new Promise((resolve) => {
    const tempFile = path.join(app.getPath('temp'), `deity-script-${Date.now()}.ps1`);
    fs.writeFileSync(tempFile, scriptContent, 'utf8');

    exec(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -File "${tempFile}"`,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Dosya silme hatası önemli değil
        }

        if (error) {
          resolve({
            success: false,
            output: stdout || '',
            error: stderr || error.message,
          });
        } else {
          resolve({
            success: true,
            output: stdout || 'Script başarıyla çalıştırıldı.',
            error: stderr || '',
          });
        }
      }
    );
  });
});

// Registry dosyası çalıştır
ipcMain.handle('run-registry', async (event, regContent) => {
  return new Promise((resolve) => {
    const tempFile = path.join(app.getPath('temp'), `deity-reg-${Date.now()}.reg`);
    fs.writeFileSync(tempFile, regContent, 'utf8');

    exec(
      `reg import "${tempFile}"`,
      (error, stdout, stderr) => {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Dosya silme hatası önemli değil
        }

        if (error) {
          resolve({
            success: false,
            output: stdout || '',
            error: stderr || error.message,
          });
        } else {
          resolve({
            success: true,
            output: 'Registry başarıyla uygulandı.',
            error: '',
          });
        }
      }
    );
  });
});

// Batch/CMD dosyası çalıştır
ipcMain.handle('run-batch', async (event, scriptContent, fileName) => {
  return new Promise((resolve) => {
    const ext = fileName && fileName.endsWith('.cmd') ? '.cmd' : '.bat';
    const tempFile = path.join(app.getPath('temp'), `deity-batch-${Date.now()}${ext}`);
    fs.writeFileSync(tempFile, scriptContent, 'utf8');

    exec(
      `cmd.exe /c "${tempFile}"`,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Dosya silme hatası önemli değil
        }

        if (error) {
          resolve({
            success: false,
            output: stdout || '',
            error: stderr || error.message,
          });
        } else {
          resolve({
            success: true,
            output: stdout || 'Batch dosyası başarıyla çalıştırıldı.',
            error: stderr || '',
          });
        }
      }
    );
  });
});

// Sistem teması al
ipcMain.handle('get-system-theme', () => {
  return new Promise((resolve) => {
    exec(
      'powershell -Command "Get-ItemPropertyValue -Path HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize -Name AppsUseLightTheme"',
      (error, stdout) => {
        if (error) {
          resolve('dark');
        } else {
          const usesLightTheme = stdout.trim() === '1';
          resolve(usesLightTheme ? 'light' : 'dark');
        }
      }
    );
  });
});

// Gelişmiş Güncelleme Kontrolü
ipcMain.handle('check-for-update', async (event, repoUrl, githubToken = '') => {
  return new Promise((resolve) => {
    let owner = 'deityxox';
    let repo = 'DEIWARE';

    if (repoUrl && repoUrl.trim()) {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const headers = {
      'User-Agent': 'DEIWARE',
    };

    if (githubToken && githubToken.trim()) {
      headers['Authorization'] = `Bearer ${githubToken.trim()}`;
    }

    https.get(apiUrl, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            resolve({ error: 'Herhangi bir sürüm (release) bulunamadı.' });
            return;
          }
          if (res.statusCode !== 200) {
            resolve({ error: `GitHub API hatası (Status: ${res.statusCode})` });
            return;
          }

          const release = JSON.parse(data);
          const latestVersion = release.tag_name;
          const exeAsset = release.assets.find(asset => asset.name.endsWith('.exe'));
          
          resolve({
            latestVersion,
            releaseNotes: release.body,
            publishDate: release.published_at,
            downloadUrl: exeAsset ? exeAsset.browser_download_url : null,
            fileName: exeAsset ? exeAsset.name : null,
            htmlUrl: release.html_url
          });
        } catch (e) {
          resolve({ error: `JSON parse hatası: ${e.message}` });
        }
      });
    }).on('error', (err) => {
      resolve({ error: `Bağlantı hatası: ${err.message}` });
    });
  });
});

// Güncelleme indir ve kur
ipcMain.handle('download-and-install-update', async (event, downloadUrl, fileName) => {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const savePath = path.join(tempDir, fileName || 'DEIWARE-Setup.exe');
    const fileStream = fs.createWriteStream(savePath);

    const downloadFile = (url) => {
      https.get(url, {
        headers: { 'User-Agent': 'DEIWARE' }
      }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          downloadFile(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          reject({ error: `İndirme hatası (Status: ${res.statusCode})` });
          return;
        }

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          
          try {
            const { spawn } = require('child_process');
            const child = spawn(savePath, [], {
              detached: true,
              stdio: 'ignore'
            });
            child.unref();
            
            setTimeout(() => {
              app.quit();
            }, 800);

            resolve({ success: true });
          } catch (e) {
            reject({ error: 'Kurulum başlatılamadı', details: e.message });
          }
        });
      }).on('error', (err) => {
        fs.unlink(savePath, () => {});
        reject({ error: `Bağlantı hatası: ${err.message}` });
      });
    };

    downloadFile(downloadUrl);
  });
});

// Pencere kontrolleri
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());
