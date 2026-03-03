# 📁 SpendWise v2.2 — Struktur Proyek (PocketBase)

**31 file total** · PocketBase + Fly.io · Vanilla JS · No build step

```
spendwise/
│
├── 📄 Dockerfile                        ✅ Build container image (Alpine + PocketBase)
├── 📄 fly.toml                          ✅ Deploy config Fly.io (region: sin / Singapore)
├── 📄 .gitignore                        ✅
├── 📄 LICENSE                           ✅ MIT License
├── 📄 README.md                         ✅ Dokumentasi proyek
├── 📄 STRUCTURE.md                      ✅ File ini
├── 📄 BUILD_INSTRUCTIONS.md             ✅ Panduan menjalankan lokal & deploy
├── 📄 DEPLOY_POCKETBASE.md              ✅ Panduan deploy lengkap PocketBase + Fly.io
│
├── 📁 pb_hooks/                         ✅ Server-side JS (berjalan di dalam PocketBase)
│   └── ai_chat.pb.js                    ✅ Custom route POST /api/ai/chat → OpenRouter AI
│
├── 📁 pb_migrations/                    ✅ Migrasi database — berjalan otomatis saat startup
│   └── 1700000000_init_spendwise.js     ✅ Extend users + buat collections:
│                                            transactions, budgets
│                                            field tambahan: goals_json, recurring_json
│
└── 📁 frontend/                         ✅ Static files — dilayani PocketBase (pb_public)
    ├── index.html                       ✅ Entry point: SDK CDN, semua pages, boot logic
    ├── manifest.json                    ✅ PWA manifest (installable)
    ├── assets/
    │   └── logo.png                     ✅ Logo SpendWise
    └── src/
        │
        ├── 📁 components/               ✅ 11 Komponen UI
        │   ├── Onboarding.js            ✅ Login + Register via PocketBase Auth (JWT)
        │   ├── Sidebar.js               ✅ Nav sidebar + mobile nav + tema toggle
        │   ├── Dashboard.js             ✅ Stats, chart mingguan, pie chart, recent tx,
        │   │                                goals summary, recurring due alert
        │   ├── TransactionModal.js      ✅ CRUD transaksi async PocketBase + date picker
        │   ├── BudgetPage.js            ✅ Budget per kategori, progress bar, upsert PB
        │   ├── LaporanPage.js           ✅ Laporan + filter kategori + filter periode
        │   │                                (hari/minggu/bulan/3bln/tahun/custom range)
        │   │                                + chart tren 6 bulan + transaksi grouped tanggal
        │   ├── GoalsPage.js             ✅ Goals & Tabungan:
        │   │                                buat/edit/hapus goal, setoran manual,
        │   │                                progress bar, estimasi waktu tercapai,
        │   │                                riwayat setoran, tandai selesai, emoji picker
        │   ├── RecurringPage.js         ✅ Agenda Rutin:
        │   │                                pengeluaran/pemasukan berulang,
        │   │                                frekuensi harian/mingguan/bulanan/tahunan,
        │   │                                catat sekarang, catat semua jatuh tempo,
        │   │                                pause/aktifkan, estimasi biaya/bulan
        │   ├── AIAdvisor.js             ✅ Chat AI: multi-turn, suggestion chips, offline fallback
        │   ├── SettingsPage.js          ✅ Edit profil, export CSV/JSON, logout, hapus akun
        │   └── SearchPage.js            ✅ Cari transaksi: keyword, filter tipe/kategori/
        │                                    periode/nominal range, highlight hasil
        │
        ├── 📁 data/
        │   └── categories.js            ✅ Data 12 kategori pengeluaran (emoji, warna, tips)
        │
        ├── 📁 utils/
        │   ├── pb.js                    ✅ PocketBase client:
        │   │                                auth (register/login/logout),
        │   │                                CRUD transaksi & budget,
        │   │                                update profil, AI chat proxy,
        │   │                                parse goals_json & recurring_json,
        │   │                                export CSV lokal
        │   ├── helpers.js               ✅ Format angka/tanggal, filter periode,
        │   │                                calcTotal, calcByCategory, chart data helpers,
        │   │                                showToast, showConfirm
        │   └── aiEngine.js              ✅ AI: kirim via PB /api/ai/chat,
        │                                    build context keuangan user,
        │                                    offline fallback rule-based,
        │                                    multi-turn history
        │
        └── 📁 styles/
            ├── main.css                 ✅ Design system, layout shell, sidebar,
            │                                dark mode (default) + light mode toggle
            ├── components.css           ✅ Semua komponen: cards, buttons, modals,
            │                                charts, AI chat, goals, recurring,
            │                                timeline, badge, toast, confirm dialog
            └── responsive.css           ✅ Mobile (<768px), tablet, desktop
```

---

## ✅ Changelog

### v2.2 — Fitur Lengkap
- **GoalsPage.js** — Goals & Tabungan dengan setoran, progress, estimasi, emoji picker
- **RecurringPage.js** — Agenda Rutin dengan catat otomatis, jatuh tempo alert
- **Dashboard** — ditambah goals summary & recurring due today banner
- **LaporanPage** — filter custom date range + opsi periode 3 bulan & tahun ini
- **components.css** — CSS goals cards, recurring cards, emoji picker, alert banner
- **pb_migrations** — field `goals_json` & `recurring_json` di tabel users
- **pb.js** — fungsi `pbGetGoals()` & `pbGetRecurring()`

### v2.1 — Migrasi PocketBase
| Sebelum (v2.0 localStorage + Vercel) | Sesudah (PocketBase) |
|--------------------------------------|----------------------|
| Data di browser (hilang saat clear)  | SQLite server (permanen) |
| Tidak ada auth                        | Login/Register JWT |
| API key di Vercel env var             | API key di PocketBase env var |
| `storage.js` → localStorage          | `pb.js` → PocketBase SDK |
| `api/chat.js` (Vercel Function)       | `pb_hooks/ai_chat.pb.js` |
| `Onboarding.js` = form profil         | Login/Register screen |
| `vercel.json`                         | `Dockerfile` + `fly.toml` |
| Data 1 device saja                    | Multi-device, multi-user |

---

## 🔄 Flow Aplikasi

```
Boot
  ↓ pbIsLoggedIn()?
  ├── YES → loadAppData()
  │           ├── pbGetTransactions()   ─┐
  │           ├── pbGetBudgets()         ├── Promise.all (paralel)
  │           ├── pbGetGoals(userRecord) │
  │           └── pbGetRecurring(...)   ─┘
  │         → initApp()
  │             ├── renderSidebar()
  │             ├── renderDashboard()
  │             ├── _checkDailyBudgetAlert()
  │             └── _checkRecurringDue()
  │
  └── NO → renderOnboarding()
              ├── handleAuth()     → pbLogin()
              └── handleRegister() → pbRegister() → set default budgets
                    ↓ success
                  loadAppData()
```

## 🤖 AI Flow

```
User kirim pesan
  ↓
aiEngine.sendMessage(msg, appState)
  ↓ [try sendToAPI]
pbAIChat(messages, systemPrompt)
  ↓
pb.send('/api/ai/chat')  →  PocketBase (validasi JWT token)
  ↓
pb_hooks/ai_chat.pb.js
  ↓
$http.send → OpenRouter (OPENROUTER_API_KEY — tersimpan di server)
  ↓
model: deepseek/deepseek-chat:free
  ↓ [catch — jika gagal]
aiEngine.offlineReply()  ← fallback rule-based lokal
```

## 🗄️ Database Schema

```
users  (built-in PocketBase auth, di-extend)
  + balance          : number   — saldo saat ini
  + daily_budget     : number   — budget harian
  + goals_json       : text     — JSON array goals & tabungan
  + recurring_json   : text     — JSON array agenda rutin

transactions
  - user             : relation → users (cascade delete)
  - type             : select ["in", "out"]
  - amt              : number
  - note             : text (max 200)
  - cat              : text     — category id (pengeluaran)
  - src              : text     — sumber (pemasukan)
  - method           : text     — metode pembayaran
  - tx_date          : date
  [Rule: hanya bisa diakses oleh user pemilik]

budgets
  - user             : relation → users (cascade delete)
  - cat_id           : text     — category id (UNIQUE per user)
  - amount           : number   — budget bulanan
  [Index: UNIQUE (user, cat_id)]
```

## 📊 Fitur Lengkap (25 Fitur)

| # | Fitur | Halaman | Status |
|---|-------|---------|--------|
| 1 | Login & Register (JWT) | Onboarding | ✅ |
| 2 | Dashboard stats real-time | Dashboard | ✅ |
| 3 | Chart pengeluaran 7 hari | Dashboard | ✅ |
| 4 | Pie chart kategori bulan ini | Dashboard | ✅ |
| 5 | Catat transaksi + date picker | Modal | ✅ |
| 6 | Edit transaksi | Modal | ✅ |
| 7 | Hapus transaksi | Modal | ✅ |
| 8 | Budget per kategori | Budget | ✅ |
| 9 | Alert budget 80% & 100% | Budget | ✅ |
| 10 | Laporan dengan filter periode | Laporan | ✅ |
| 11 | Filter custom date range | Laporan | ✅ |
| 12 | Chart tren 6 bulan | Laporan | ✅ |
| 13 | Transaksi grouped per tanggal | Laporan | ✅ |
| 14 | Goals & Tabungan + setoran | Goals | ✅ |
| 15 | Progress & estimasi goals | Goals | ✅ |
| 16 | Agenda Rutin (recurring) | Recurring | ✅ |
| 17 | Catat agenda jatuh tempo | Recurring | ✅ |
| 18 | AI Advisor (online + offline) | AI | ✅ |
| 19 | Cari transaksi + filter nominal | Search | ✅ |
| 20 | Edit profil & budget harian | Settings | ✅ |
| 21 | Export CSV & JSON backup | Settings | ✅ |
| 22 | Logout & hapus akun | Settings | ✅ |
| 23 | Dark / Light mode toggle | Global | ✅ |
| 24 | Notifikasi budget harian | Global | ✅ |
| 25 | PWA installable | Global | ✅ |