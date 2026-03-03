# 🔨 Build & Run Instructions — SpendWise v2.1 (PocketBase)

---

## 📋 Prerequisites

| Tool | Kegunaan | Download |
|------|----------|----------|
| PocketBase | Backend + database + serve frontend | https://pocketbase.io/docs/ |
| Fly CLI *(untuk deploy)* | Deploy ke cloud | https://fly.io/docs/flyctl/install/ |
| Git | Version control | https://git-scm.com |
| VS Code *(opsional)* | Text editor | https://code.visualstudio.com |

Tidak perlu Node.js, npm, atau build step apapun.

---

## 🚀 Jalankan Lokal (Dev)

### Langkah 1 — Download PocketBase

Buka https://pocketbase.io/docs/ → download binary sesuai OS kamu:
- **Windows:** `pocketbase_x.x.x_windows_amd64.zip`
- **Mac:** `pocketbase_x.x.x_darwin_amd64.zip`
- **Linux:** `pocketbase_x.x.x_linux_amd64.zip`

Extract ke folder proyek:

```
spendwise/
├── pocketbase          ← executable (Mac/Linux)
├── pocketbase.exe      ← executable (Windows)
├── pb_hooks/
├── pb_migrations/
└── frontend/
```

### Langkah 2 — Pindahkan Frontend ke pb_public

PocketBase serve static files dari folder `pb_public/`.
Buat symlink atau salin isi folder `frontend/` ke `pb_public/`:

```bash
# Mac/Linux — symlink (lebih praktis untuk dev)
ln -s frontend pb_public

# Atau salin manual
cp -r frontend pb_public
```

### Langkah 3 — Set API Key (opsional, untuk fitur AI)

**Mac/Linux:**
```bash
export OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

**Windows (Command Prompt):**
```cmd
set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

**Windows (PowerShell):**
```powershell
$env:OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxx"
```

> Tanpa API key, fitur AI tetap bisa dipakai dalam mode **offline** (rule-based, tidak perlu internet).

### Langkah 4 — Jalankan PocketBase

```bash
# Mac/Linux
./pocketbase serve --http=127.0.0.1:8090

# Windows
pocketbase.exe serve --http=127.0.0.1:8090
```

### Langkah 5 — Buka di Browser

| URL | Keterangan |
|-----|-----------|
| http://127.0.0.1:8090 | Aplikasi SpendWise |
| http://127.0.0.1:8090/_/ | Admin panel PocketBase |

**Pertama kali buka admin panel** → buat akun admin (email + password bebas).

Migrasi database berjalan otomatis — collections `users`, `transactions`, `budgets` langsung terbuat.

---

## 🌐 Deploy ke Fly.io (Production, Gratis)

Baca panduan lengkap di **`DEPLOY_POCKETBASE.md`**.

Ringkasan 6 langkah:

```bash
# 1. Install Fly CLI & login
fly auth login

# 2. Buat app (ganti nama sesuai keinginan)
fly apps create spendwise-namaKamu

# 3. Edit fly.toml — ganti: app = "spendwise-namaKamu"

# 4. Buat volume permanen
fly volumes create pb_data --region sin --size 1

# 5. Set API key AI (aman, terenkripsi)
fly secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx

# 6. Deploy!
fly deploy
```

Buka: `https://spendwise-namaKamu.fly.dev`

---

## 🔧 Kustomisasi

### Ubah Kategori & Budget Default
Edit `frontend/src/data/categories.js`:
```javascript
{ id: 'makanan', emoji: '🍜', label: 'Makanan', defaultBudget: 800000, ... }
```

### Ubah Model AI
Edit `pb_hooks/ai_chat.pb.js`, baris:
```javascript
model: "deepseek/deepseek-chat:free",
```
Model gratis lain di OpenRouter: `meta-llama/llama-3.1-8b-instruct:free`, `google/gemma-2-9b-it:free`

### Ubah Tema Default
Edit `index.html`, di bagian `appState`:
```javascript
theme: localStorage.getItem('sw_theme') || 'dark',  // ganti 'dark' ke 'light'
```

---

## 📦 Dependensi Eksternal (CDN, tidak perlu install)

| Library | Versi | Sumber | Kegunaan |
|---------|-------|--------|----------|
| PocketBase JS SDK | 0.21.3 | jsdelivr.net | Auth + database client |
| Chart.js | 4.4.1 | cdnjs | Grafik bar & donut |
| Google Fonts | — | fonts.google.com | Sora + Space Mono |

Semua load via CDN — **tidak perlu `npm install` apapun**.

---

## 🐛 Troubleshooting

**Aplikasi tidak terbuka di localhost?**
→ Pastikan PocketBase sedang berjalan (`./pocketbase serve`)
→ Pastikan `pb_public/` sudah berisi file frontend

**"Tidak dapat terhubung ke server" saat login?**
→ PocketBase belum jalan, atau salah port
→ Cek apakah port 8090 sudah dipakai aplikasi lain: `lsof -i :8090`

**Collections tidak terbuat otomatis?**
→ Pastikan folder `pb_migrations/` ada dan berisi file migrasi
→ Restart PocketBase, migrasi berjalan saat startup

**AI tidak merespons (di production)?**
→ Cek API key: `fly secrets list`
→ Cek logs: `fly logs` — cari error dari OpenRouter
→ AI akan otomatis fallback ke mode offline jika API gagal

**AI tidak merespons (di lokal)?**
→ Pastikan env variable sudah di-set sebelum menjalankan PocketBase
→ Tanpa key, mode offline tetap berfungsi normal

**Data tidak tersimpan setelah deploy?**
→ Pastikan volume `pb_data` sudah dibuat: `fly volumes list`
→ Pastikan `fly.toml` punya bagian `[mounts]`

**Grafik tidak muncul?**
→ Perlu koneksi internet untuk load Chart.js dari CDN
→ Coba refresh browser (Ctrl+Shift+R)

**Error "Unauthorized" di AI?**
→ Token login expired — coba logout dan login ulang

---

## 📁 Struktur File Penting

```
spendwise/
├── Dockerfile              Build container (untuk Fly.io)
├── fly.toml                Konfigurasi deploy
├── pb_hooks/
│   └── ai_chat.pb.js       Logika server: AI proxy
├── pb_migrations/
│   └── 1700000000_*.js     Skema database otomatis
└── frontend/               Semua file yang dibuka browser
    ├── index.html
    ├── manifest.json
    ├── assets/logo.png
    └── src/
        ├── components/     9 komponen UI
        ├── utils/
        │   ├── pb.js       PocketBase client
        │   ├── helpers.js
        │   └── aiEngine.js
        ├── data/
        │   └── categories.js
        └── styles/
```