// src/utils/storage.js
// ─────────────────────────────────────────────
// StorageManager — LocalStorage abstraction layer
// ─────────────────────────────────────────────

const STORAGE_KEY = 'spendwise_v2';

const StorageManager = {
  // Simpan seluruh state aplikasi
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('[Storage] Gagal menyimpan:', e);
      return false;
    }
  },

  // Muat state dari localStorage
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('[Storage] Gagal memuat:', e);
      return null;
    }
  },

  // Hapus semua data (reset)
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Export data sebagai JSON string
  exportJSON(state) {
    return JSON.stringify(state, null, 2);
  },

  // Import data dari JSON string
  importJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.user || !Array.isArray(parsed.transactions)) {
        throw new Error('Format data tidak valid');
      }
      return parsed;
    } catch (e) {
      throw new Error('File JSON tidak valid: ' + e.message);
    }
  },

  // Export transactions sebagai CSV
  exportCSV(transactions) {
    const headers = ['Tanggal', 'Tipe', 'Nominal', 'Kategori', 'Catatan', 'Metode'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('id-ID'),
      t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
      t.amt,
      t.cat ? getCatById(t.cat).label : (t.src || '-'),
      t.note || '-',
      t.method || '-',
    ]);
    return [headers, ...rows].map(r => r.join(',')).join('\n');
  },

  // Hitung ukuran data tersimpan
  getStorageSize() {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    const bytes = new Blob([raw]).size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },
};