# Menjalankan project dengan PM2

Ini panduan cepat untuk menjalankan project ini (Next.js + optional Python service) menggunakan PM2.
Instruksi menggunakan PowerShell (Windows). Jika environment produksi Anda adalah Linux, gunakan perintah yang sama di shell Linux.

**Syarat**
- Node.js (versi yang kompatibel dengan Next 15)
- npm atau pnpm/yarn
- Python pada PATH bila Anda ingin menjalankan servis Python di `python-script`

**Langkah singkat**
- Install dependencies
```powershell
npm ci
```
- Build Next.js (produksi)
```powershell
npm run build
```
- Install PM2 (global) — opsional jika ingin memakai global
```powershell
npm install -g pm2
# atau: npx pm2 --version  # jalankan pm2 via npx tanpa instal global
```
- Jalankan dengan konfigurasi ecosystem
```powershell
pm2 start ecosystem.config.js --env production
```
- Simpan daftar proses agar dimulai ulang setelah reboot (Linux)
```powershell
pm2 save
pm2 startup
# ikuti instruksi yang diberikan oleh `pm2 startup` (Linux).
```

**Perintah berguna**
```powershell
pm2 status
pm2 logs wisma-web       # logs aplikasi Next.js
pm2 logs wisma-python    # logs servis Python (jika dipakai)
pm2 restart wisma-web
pm2 stop wisma-web
pm2 delete wisma-web
```

**Catatan Windows**
- `pm2 startup` biasanya mengeluarkan instruksi untuk sistem Linux. Di Windows, Anda punya beberapa opsi:
  - Gunakan WSL (direkomendasikan untuk lingkungan yang mirip Linux), lalu jalankan PM2 di dalam WSL.
  - Gunakan paket `pm2-windows-startup` untuk membuat service Windows. Contoh:
    ```powershell
    npm i -g pm2-windows-startup
    pm2-startup install
    # lalu jalankan `pm2 save`
    ```
  - Atau buat Scheduled Task atau Windows Service manual yang menjalankan `pm2 resurrect` atau `pm2 start ecosystem.config.js` saat boot.

**Environment Variables**
- `ecosystem.config.js` sudah menyediakan `env_production` (PORT & NODE_ENV). Jika butuh variabel lain, tambahkan ke `env_production` atau gunakan `.env` dan load sebelum start.

**Menjalankan hanya aplikasi Next.js tanpa ecosystem**
```powershell
# build
npm run build
# jalankan langsung
pm2 start --name wisma-web -- npm -- run start --silent
```

**Menjalankan hanya servis Python tanpa ecosystem**
```powershell
pm2 start --name wisma-python -- python -- python-script/app/main.py
```

Jika Anda ingin, saya bisa:
- Menyesuaikan `ecosystem.config.js` (mis. menambahkan `env_file`, jumlah `instances`, atau cluster mode)
- Menambahkan skrip npm khusus untuk start/pm2
- Membuat contoh service Windows yang otomatis menjalankan PM2 pada startup

***
File `ecosystem.config.js` telah dibuat di root proyek. Jalankan perintah di atas (build -> start) untuk mencoba.
