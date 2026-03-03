// src/components/RecurringPage.js
// ─────────────────────────────────────────────────────────────────
// Agenda Rutin — pengeluaran & pemasukan yang berulang
//
// Fitur:
//   ✅ Buat transaksi rutin (nama, nominal, frekuensi, tanggal)
//   ✅ Frekuensi: harian, mingguan, bulanan, tahunan
//   ✅ Status aktif/nonaktif
//   ✅ Eksekusi manual: "Catat sekarang"
//   ✅ Auto-reminder: tampilkan yang jatuh tempo hari ini
//   ✅ Estimasi pengeluaran rutin per bulan
//   ✅ Simpan ke PocketBase (field recurring_json di users)
// ─────────────────────────────────────────────────────────────────

const FREQ_LABELS = {
  daily:   '🔁 Setiap Hari',
  weekly:  '📅 Setiap Minggu',
  monthly: '🗓️ Setiap Bulan',
  yearly:  '📆 Setiap Tahun',
};
const FREQ_DAYS = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

function renderRecurringPage() {
  const page = document.getElementById('page-recurring');
  if (!page) return;

  const items   = appState.recurring || [];
  const active  = items.filter(r => r.active !== false);
  const today   = new Date();
  const dueTodayList = active.filter(r => _isDueToday(r, today));

  // Estimasi bulanan
  const monthlyEst = active
    .filter(r => r.type === 'out')
    .reduce((s, r) => {
      const days = FREQ_DAYS[r.freq] || 30;
      return s + Math.round((r.amt / days) * 30);
    }, 0);

  page.innerHTML = `
    <div style="max-width:780px;margin:0 auto">

      <!-- Stats -->
      <div class="stats-grid mb-16" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card blue">
          <div class="stat-label">Agenda Aktif</div>
          <div class="stat-value blue">${active.length}</div>
          <div class="stat-sub">${items.filter(r=>r.active===false).length} dinonaktifkan</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">Est. Pengeluaran/Bulan</div>
          <div class="stat-value red mono">${fmtRp(monthlyEst)}</div>
          <div class="stat-sub">dari semua agenda rutin</div>
        </div>
        <div class="stat-card ${dueTodayList.length > 0 ? 'warn' : 'green'}">
          <div class="stat-label">Jatuh Tempo Hari Ini</div>
          <div class="stat-value ${dueTodayList.length > 0 ? '' : 'green'}">${dueTodayList.length}</div>
          <div class="stat-sub">${dueTodayList.length > 0 ? '⚠️ Perlu dicatat' : '✅ Semua beres'}</div>
        </div>
      </div>

      <!-- Due Today Alert -->
      ${dueTodayList.length ? `
        <div class="alert-banner mb-16">
          <span>⚠️ <strong>${dueTodayList.length} agenda</strong> jatuh tempo hari ini</span>
          <button class="btn btn-primary text-xs" onclick="recordAllDueToday()" style="padding:6px 14px">
            Catat Semua
          </button>
        </div>` : ''}

      <!-- Header -->
      <div class="flex-between mb-16">
        <div class="text-sm text-muted">${items.length} agenda terdaftar</div>
        <button class="btn btn-primary" onclick="openRecurringModal()">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Tambah Agenda
        </button>
      </div>

      <!-- List -->
      <div id="recurringList">
        ${items.length
          ? items.map(r => _recurringCardHTML(r)).join('')
          : `<div class="empty-state">
               <span class="icon">🔁</span>
               <h3>Belum Ada Agenda Rutin</h3>
               <p>Tambahkan pengeluaran atau pemasukan yang berulang.<br>Contoh: Gaji, Listrik, Netflix, Cicilan, dll.</p>
               <button class="btn btn-primary mt-16" onclick="openRecurringModal()">
                 <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Tambah Agenda Pertama
               </button>
             </div>`
        }
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" id="recurringModal" style="display:none">
      <div class="modal" style="max-width:460px">
        <div class="modal-header">
          <div class="modal-title" id="recurModalTitle">🔁 Tambah Agenda Rutin</div>
          <button class="modal-close" onclick="closeRecurringModal()">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal-body" id="recurModalBody"></div>
      </div>
    </div>
  `;
}

function _recurringCardHTML(r) {
  const isDue   = _isDueToday(r, new Date());
  const isOut   = r.type === 'out';
  const cat     = r.cat ? getCatById(r.cat) : null;
  const emoji   = isOut ? (cat ? cat.emoji : '💸') : '💰';
  const color   = isOut ? 'var(--danger)' : 'var(--accent)';
  const nextDate= r.nextDate ? formatDate(new Date(r.nextDate)) : '—';
  const lastDate= r.lastRecorded ? formatDate(new Date(r.lastRecorded)) : 'Belum pernah';

  return `
    <div class="recurring-card ${isDue ? 'due' : ''} ${r.active === false ? 'inactive' : ''}">
      <div class="recurring-icon" style="background:${color}22">${emoji}</div>
      <div class="recurring-info">
        <div class="recurring-name">${r.name}</div>
        <div class="recurring-meta">
          ${FREQ_LABELS[r.freq] || r.freq}
          ${r.cat ? ` · ${cat?.label}` : ''}
          ${r.method ? ` · ${r.method}` : ''}
        </div>
        <div class="recurring-dates text-xs text-muted">
          Berikutnya: <strong>${nextDate}</strong>
          ${isDue ? '<span class="badge badge-warn" style="margin-left:6px;font-size:9px">HARI INI</span>' : ''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="recurring-amt" style="color:${color}">${isOut ? '-' : '+'}${fmtRp(r.amt)}</div>
        <div class="text-xs text-muted">per ${r.freq === 'daily' ? 'hari' : r.freq === 'weekly' ? 'minggu' : r.freq === 'yearly' ? 'tahun' : 'bulan'}</div>
      </div>
      <div class="recurring-actions">
        ${isDue ? `<button class="btn btn-primary text-xs" onclick="recordNow('${r.id}')" style="padding:6px 12px">Catat</button>` : ''}
        <button class="btn btn-ghost" onclick="toggleRecurring('${r.id}')" title="${r.active===false?'Aktifkan':'Nonaktifkan'}"
          style="padding:7px 10px;font-size:12px">${r.active === false ? '▶️' : '⏸️'}</button>
        <button class="btn btn-ghost" onclick="openEditRecurringModal('${r.id}')" style="padding:7px 10px">✏️</button>
        <button class="btn btn-ghost" onclick="deleteRecurring('${r.id}')" style="padding:7px 10px;color:var(--danger)">🗑️</button>
      </div>
    </div>`;
}

// ── MODAL ─────────────────────────────────────────────────────────

function openRecurringModal(editId = null) {
  const modal   = document.getElementById('recurringModal');
  const bodyEl  = document.getElementById('recurModalBody');
  const titleEl = document.getElementById('recurModalTitle');
  if (!modal || !bodyEl) return;

  const r = editId ? (appState.recurring || []).find(x => x.id === editId) : null;
  titleEl.textContent = r ? '✏️ Edit Agenda' : '🔁 Tambah Agenda Rutin';

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  bodyEl.innerHTML = `
    <div class="tab-row" style="margin-bottom:16px">
      <button class="tab-btn ${!r || r.type==='out' ? 'active':''}" id="rtabOut" onclick="switchRecurTab('out')">💸 Pengeluaran</button>
      <button class="tab-btn ${r?.type==='in' ? 'active':''}"  id="rtabIn"  onclick="switchRecurTab('in')">💰 Pemasukan</button>
    </div>
    <input type="hidden" id="recurType" value="${r?.type || 'out'}">

    <div class="form-group">
      <label class="form-label">Nama Agenda</label>
      <input type="text" class="form-input" id="recurName"
        placeholder="Contoh: Gaji, Listrik PLN, Netflix, Cicilan..."
        value="${r?.name || ''}" maxlength="50">
    </div>
    <div class="form-group">
      <label class="form-label">Nominal (Rp)</label>
      <input type="number" class="form-input" id="recurAmt"
        placeholder="Nominal" min="0" value="${r?.amt || ''}"
        style="font-family:var(--mono)">
    </div>
    <div class="form-group">
      <label class="form-label">Frekuensi</label>
      <select class="form-input" id="recurFreq">
        ${Object.entries(FREQ_LABELS).map(([v,l]) =>
          `<option value="${v}" ${r?.freq===v?'selected':''}>${l}</option>`
        ).join('')}
      </select>
    </div>
    <div id="recurCatSection" class="form-group" style="${!r||r.type==='out'?'':'display:none'}">
      <label class="form-label">Kategori</label>
      <select class="form-input" id="recurCat">
        <option value="">— Pilih Kategori —</option>
        ${CATEGORIES.map(c => `<option value="${c.id}" ${r?.cat===c.id?'selected':''}>${c.emoji} ${c.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Metode Pembayaran (opsional)</label>
      <select class="form-input" id="recurMethod">
        <option value="">— Pilih —</option>
        ${['Tunai','Transfer Bank','GoPay','OVO','Dana','QRIS','Kartu Kredit'].map(m =>
          `<option value="${m}" ${r?.method===m?'selected':''}>${m}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Mulai / Tanggal Berikutnya</label>
      <input type="date" class="form-input" id="recurNextDate"
        value="${r?.nextDate?.slice(0,10) || tomorrow.toISOString().slice(0,10)}">
    </div>
    <button class="btn btn-primary w-full" style="justify-content:center;padding:13px;margin-top:4px"
      onclick="saveRecurring('${editId || ''}')">
      <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
      ${r ? 'Update Agenda' : 'Simpan Agenda'}
    </button>`;

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('recurName')?.focus(), 100);
}

function openEditRecurringModal(id) { openRecurringModal(id); }

function closeRecurringModal() {
  const m = document.getElementById('recurringModal');
  if (m) m.style.display = 'none';
}

function switchRecurTab(type) {
  document.getElementById('rtabOut').classList.toggle('active', type === 'out');
  document.getElementById('rtabIn').classList.toggle('active',  type === 'in');
  document.getElementById('recurType').value = type;
  const catSection = document.getElementById('recurCatSection');
  if (catSection) catSection.style.display = type === 'out' ? '' : 'none';
}

async function saveRecurring(editId) {
  const name     = document.getElementById('recurName')?.value.trim();
  const amt      = parseFloat(document.getElementById('recurAmt')?.value) || 0;
  const freq     = document.getElementById('recurFreq')?.value || 'monthly';
  const type     = document.getElementById('recurType')?.value || 'out';
  const cat      = document.getElementById('recurCat')?.value  || null;
  const method   = document.getElementById('recurMethod')?.value || null;
  const nextDate = document.getElementById('recurNextDate')?.value || new Date().toISOString().slice(0,10);

  if (!name)   { showToast('Nama agenda wajib diisi!', 'error'); return; }
  if (amt <= 0){ showToast('Nominal harus lebih dari 0!', 'error'); return; }

  if (!appState.recurring) appState.recurring = [];

  if (editId) {
    const idx = appState.recurring.findIndex(r => r.id === editId);
    if (idx !== -1) {
      appState.recurring[idx] = { ...appState.recurring[idx], name, amt, freq, type, cat: cat || null, method: method || null, nextDate };
    }
    showToast('✏️ Agenda diperbarui!', 'success');
  } else {
    appState.recurring.push({
      id: genId(), name, amt, freq, type,
      cat: cat || null, method: method || null,
      nextDate, active: true,
      createdAt: new Date().toISOString(),
      lastRecorded: null,
    });
    showToast(`🔁 Agenda "${name}" ditambahkan!`, 'success');
  }

  await _saveRecurringToPB();
  closeRecurringModal();
  renderRecurringPage();
}

// ── AKSI ─────────────────────────────────────────────────────────

async function recordNow(recurId) {
  const r = (appState.recurring || []).find(x => x.id === recurId);
  if (!r) return;

  try {
    const tx = {
      type:   r.type,
      amt:    r.amt,
      note:   r.name,
      cat:    r.type === 'out' ? (r.cat || null) : null,
      src:    r.type === 'in'  ? r.name : null,
      method: r.method || null,
      date:   new Date().toISOString(),
    };
    const saved = await pbCreateTransaction(tx);

    if (saved.type === 'out') appState.user.balance -= saved.amt;
    else                      appState.user.balance += saved.amt;

    const insertIdx = appState.transactions.findIndex(t => new Date(t.date) < new Date(saved.date));
    if (insertIdx === -1) appState.transactions.push(saved);
    else appState.transactions.splice(insertIdx, 0, saved);

    await pbUpdateProfile({ name: appState.user.name, balance: appState.user.balance, daily_budget: appState.user.dailyBudget });

    // Update nextDate
    const idx = appState.recurring.findIndex(x => x.id === recurId);
    if (idx !== -1) {
      const next = new Date(r.nextDate || new Date());
      const days = FREQ_DAYS[r.freq] || 30;
      next.setDate(next.getDate() + days);
      appState.recurring[idx].nextDate     = next.toISOString().slice(0,10);
      appState.recurring[idx].lastRecorded = new Date().toISOString();
    }

    await _saveRecurringToPB();
    showToast(`✅ "${r.name}" ${fmtRp(r.amt)} berhasil dicatat!`, 'success');
    renderRecurringPage();
  } catch (err) {
    showToast('Gagal mencatat: ' + (err.message || err), 'error');
  }
}

async function recordAllDueToday() {
  const today = new Date();
  const due   = (appState.recurring || []).filter(r => r.active !== false && _isDueToday(r, today));
  if (!due.length) return;

  for (const r of due) {
    await recordNow(r.id);
  }
  showToast(`✅ ${due.length} agenda dicatat!`, 'success');
}

async function toggleRecurring(id) {
  const idx = (appState.recurring || []).findIndex(r => r.id === id);
  if (idx === -1) return;
  appState.recurring[idx].active = appState.recurring[idx].active === false ? true : false;
  await _saveRecurringToPB();
  renderRecurringPage();
  showToast(appState.recurring[idx].active ? '▶️ Agenda diaktifkan' : '⏸️ Agenda dinonaktifkan', 'info');
}

async function deleteRecurring(id) {
  const r = (appState.recurring || []).find(x => x.id === id);
  if (!r) return;
  showConfirm('🗑️ Hapus Agenda', `Yakin hapus agenda <strong>"${r.name}"</strong>?`, async () => {
    appState.recurring = appState.recurring.filter(x => x.id !== id);
    await _saveRecurringToPB();
    showToast('🗑️ Agenda dihapus', 'info');
    renderRecurringPage();
  }, { confirmLabel: 'Ya, Hapus', danger: true });
}

// ── HELPERS ───────────────────────────────────────────────────────

function _isDueToday(r, today) {
  if (!r.nextDate || r.active === false) return false;
  const next = new Date(r.nextDate);
  return next <= today;
}

async function _saveRecurringToPB() {
  try {
    await pb.collection('users').update(pb.authStore.record?.id, {
      recurring_json: JSON.stringify(appState.recurring || []),
    });
  } catch (err) {
    console.warn('[Recurring] Gagal sync ke PB:', err.message);
  }
}