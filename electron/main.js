const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

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
    mainWindow.webContents.openDevTools();
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
          
          // Rate limit bilgilerini logla
          console.log('Rate Limit Remaining:', res.headers['x-ratelimit-remaining']);
          console.log('Rate Limit Reset:', new Date(res.headers['x-ratelimit-reset'] * 1000));
          
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
      if (item.type === 'file' && (item.name.endsWith('.ps1') || item.name.endsWith('.reg'))) {
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
        details: 'Klasörde .ps1 veya .reg dosyası bulunamadı' 
      };
    }
    
    console.log(`Toplam ${allScripts.length} script bulundu`);
    return allScripts;
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

// Pencere kontrolleri
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());
