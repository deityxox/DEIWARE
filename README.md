# DEIWARE

Windows 11 tarzında modern bir masaüstü uygulaması. PowerShell scriptlerinizi ve Registry dosyalarınızı GitHub üzerinden yönetip çalıştırmanızı sağlar.

## Özellikler

- ✨ Modern Windows 11 arayüzü (Fluent Design)
- 🌓 Otomatik sistem teması algılama (Açık/Koyu mod)
- 📦 GitHub üzerinden script yönetimi
- ⭐ Default scriptler (otomatik yüklenir)
- 👤 Kullanıcı scriptleri (kendi repo'nuzdan)
- ⚡ Tek tıkla veya toplu script çalıştırma
- 📊 Detaylı çalıştırma logları
- 🔒 Otomatik ExecutionPolicy ayarı
- 🎯 Akıllı kategori sistemi (recursive tarama)

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Production build
npm run build
```

## Kullanım

1. Uygulama ilk açıldığında:
   - Otomatik olarak `Set-ExecutionPolicy Unrestricted -Force` komutu çalıştırılır
   - Default scriptler otomatik yüklenir
2. Kendi scriptlerinizi eklemek için:
   - Ayarlar sekmesinden GitHub repo URL'inizi girin
   - Scriptler → "Benim Scriptlerim" → "Scriptleri Yükle"
3. İstediğiniz scriptleri seçip çalıştırın
4. Loglar sekmesinden sonuçları takip edin

## Teknolojiler

- **Electron** - Masaüstü uygulama framework
- **React** - UI kütüphanesi
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern styling
- **Shadcn UI** - UI komponentleri
- **Vite** - Build tool

## Proje Yapısı

```
deiware/
├── electron/          # Electron main process
│   ├── main.js       # Ana süreç
│   └── preload.js    # Preload script
├── src/              # React uygulaması
│   ├── components/   # UI komponentleri
│   ├── lib/          # Yardımcı fonksiyonlar
│   ├── types/        # TypeScript tipleri
│   ├── App.tsx       # Ana uygulama
│   └── main.tsx      # Entry point
└── package.json
```

## Lisans

MIT
