# 🚀 Panduan Deploy SpendWise — PocketBase + Fly.io

Panduan lengkap dari laptop ke production. Estimasi waktu: **15-20 menit**.

---

## Arsitektur

```
Browser  ──→  Fly.io (Docker)
               ├── PocketBase server (port 8090)
               │     ├── /api/*          ← REST API + auth
               │     ├── /api/ai/chat    ← AI proxy (pb_hooks)
               │     └── /_/             ← Admin UI
               ├── SQLite database       (volume permanen)
               └── frontend/             ← Static files (pb_public)
```

**Gratis:** Fly.io free tier (256MB RAM, shared CPU) + volume 3GB

---

## Bagian 1 — Dapatkan OpenRouter API Key (AI gratis)

1. Buka **https://openrouter.ai** → Sign up gratis
2. Masuk → **Keys** → Create New Key
3. Copy key (format: `sk-or-v1-xxxx...`)
4. Model gratis yang dipakai: `deepseek/deepseek-chat:free`

---

## Bagian 2 — Siapkan Struktur Folder

SpendWise perlu folder ini sebelum deploy:

```
spendwise/
├── Dockerfile
├── fly.toml
├── pb_hooks/
│   └── ai_chat.pb.js
├── pb_migrations/
│   └── 1700000000_init_spendwise.js
└── frontend/               ← SEMUA file HTML/CSS/JS masuk sini
    ├── index.html
    ├── manifest.json
    ├── assets/
    └── src/
```

**Penting:** Salin semua file `index.html`, `manifest.json`, `assets/`, `src/`
ke dalam folder `frontend/`. PocketBase akan melayani folder ini sebagai static files.

---

## Bagian 3 — Install Fly CLI

```bash
# macOS / Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

Setelah install, login:
```bash
fly auth signup    # daftar akun baru
# atau
fly auth login     # kalau sudah punya akun
```

---

## Bagian 4 — Buat App & Volume

```bash
cd spendwise/

# Buat aplikasi (ganti nama unik)
fly apps create spendwise-app

# Buat volume permanen untuk database PocketBase (1GB gratis)
fly volumes create pb_data --region sin --size 1
```

> **Region `sin`** = Singapore, paling dekat dari Indonesia (latensi rendah)

---

## Bagian 5 — Set API Key (aman, tidak masuk kode)

```bash
fly secrets set OPENROUTER_API_KEY=sk-or-v1-xxxx-kunci-kamu-disini
```

Key tersimpan terenkripsi di Fly.io. Tidak pernah muncul di kode atau log.

---

## Bagian 6 — Deploy!

```bash
fly deploy
```

Fly.io akan:
1. Build Docker image
2. Push ke registry
3. Deploy ke Singapore
4. Jalankan migrasi database otomatis

Tunggu ~2-3 menit. Setelah selesai:

```bash
fly open    # buka di browser
```

URL format: `https://spendwise-app.fly.dev`

---

## Bagian 7 — Setup Admin PocketBase

1. Buka `https://spendwise-app.fly.dev/_/` (admin panel)
2. Buat akun admin pertama kali
3. Cek collections: `users`, `transactions`, `budgets` sudah terbuat otomatis
4. Selesai! User bisa daftar via aplikasi

---

## Update Aplikasi (setelah perubahan kode)

```bash
fly deploy
```
Otomatis update tanpa downtime.

---

## Monitoring & Logs

```bash
fly logs              # log real-time
fly status            # status mesin
fly ssh console       # masuk ke container
```

---

## Dev Lokal (tanpa Docker)

1. Download PocketBase dari https://pocketbase.io/docs/
2. Extract dan jalankan:
   ```bash
   ./pocketbase serve --http=127.0.0.1:8090
   ```
3. Copy semua file frontend ke folder `pb_public/` di samping executable PocketBase
4. Buka http://127.0.0.1:8090
5. Set env variable untuk AI:
   ```bash
   export OPENROUTER_API_KEY=sk-or-v1-xxxx
   ./pocketbase serve --http=127.0.0.1:8090
   ```

---

## Biaya

| Komponen | Biaya |
|----------|-------|
| Fly.io Hobby VM (256MB) | **Gratis** (3 VM gratis/akun) |
| Fly.io Volume 1GB | **Gratis** (3GB total gratis) |
| OpenRouter deepseek:free | **Gratis** (rate limited) |
| **Total** | **Rp 0** |