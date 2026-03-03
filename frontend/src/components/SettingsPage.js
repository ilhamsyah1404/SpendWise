// src/components/SettingsPage.js — lengkap dengan ganti password & import JSON

function renderSettingsPage() {
  const txCount = appState.transactions.length;
  const user    = appState.user;
  const firstTx = txCount>0 ? formatDate(new Date(appState.transactions[txCount-1].date)) : '—';

  document.getElementById('page-settings').innerHTML = `
    <div style="max-width:600px;margin:0 auto">

      <!-- PROFIL -->
      <div class="card mb-16">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profil & Preferensi
          </div>
          <span class="badge badge-blue" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.email||''}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Nama</label>
          <input type="text" class="form-input" id="set-name" value="${user.name}" maxlength="30">
        </div>
        <div class="form-group">
          <label class="form-label">Saldo Saat Ini (Rp)</label>
          <input type="number" class="form-input" id="set-balance" value="${user.balance}" min="0" style="font-family:var(--mono)">
          <div class="text-xs text-muted mt-4">⚠️ Mengubah saldo manual tidak mempengaruhi riwayat transaksi</div>
        </div>
        <div class="form-group">
          <label class="form-label">Budget Harian (Rp)</label>
          <input type="number" class="form-input" id="set-budget" value="${user.dailyBudget}" min="0" style="font-family:var(--mono)">
        </div>
        <button class="btn btn-primary w-full" id="saveSettingsBtn"
          onclick="saveSettings()" style="justify-content:center;padding:12px">
          <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
          Simpan Profil
        </button>
      </div>

      <!-- GANTI PASSWORD -->
      <div class="card mb-16">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Ganti Password
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password Lama</label>
          <input type="password" class="form-input" id="set-old-pass" placeholder="••••••••" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru</label>
          <input type="password" class="form-input" id="set-new-pass" placeholder="Min. 8 karakter" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">Konfirmasi Password Baru</label>
          <input type="password" class="form-input" id="set-confirm-pass" placeholder="Ulangi password baru" autocomplete="new-password">
        </div>
        <button class="btn btn-ghost w-full" id="changePassBtn"
          onclick="changePassword()" style="justify-content:center;padding:11px">
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Ganti Password
        </button>
      </div>

      <!-- DATA & BACKUP -->
      <div class="card mb-16">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Data & Backup
          </div>
          <span class="badge badge-green">☁️ PocketBase</span>
        </div>
        <div class="settings-stats">
          <div class="settings-stat">
            <div class="settings-stat-val">${txCount}</div>
            <div class="settings-stat-label">Transaksi</div>
          </div>
          <div class="settings-stat">
            <div class="settings-stat-val">${(appState.goals||[]).length}</div>
            <div class="settings-stat-label">Goals</div>
          </div>
          <div class="settings-stat">
            <div class="settings-stat-val">${(appState.recurring||[]).length}</div>
            <div class="settings-stat-label">Agenda Rutin</div>
          </div>
          <div class="settings-stat">
            <div class="settings-stat-val">${firstTx}</div>
            <div class="settings-stat-label">Mulai Dari</div>
          </div>
        </div>
        <div class="divider"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button class="btn btn-ghost" onclick="exportCSVSettings()" style="justify-content:center">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
          <button class="btn btn-ghost" onclick="exportJSONSettings()" style="justify-content:center">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Backup JSON
          </button>
        </div>
        <!-- Import JSON -->
        <div class="divider"></div>
        <div style="background:var(--bg3);border-radius:10px;padding:14px">
          <div class="text-sm fw-bold mb-8">📥 Import Backup JSON</div>
          <div class="text-xs text-muted mb-10">Hanya mengimpor transaksi dari file backup. Data yang sudah ada tetap tersimpan.</div>
          <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="handleImportJSON(event)">
          <button class="btn btn-ghost w-full" onclick="document.getElementById('importFileInput').click()" style="justify-content:center">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Pilih File JSON
          </button>
        </div>
        <div class="text-xs text-muted mt-10" style="background:var(--bg3);padding:10px 12px;border-radius:8px;line-height:1.6">
          💡 <strong>Data tersimpan di PocketBase</strong> — aman, multi-device, tidak hilang saat clear browser.
        </div>
      </div>

      <!-- DANGER ZONE -->
      <div class="card" style="border-color:rgba(255,95,109,0.3)">
        <div class="card-header">
          <div class="card-title" style="color:var(--danger)">
            <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Danger Zone
          </div>
        </div>
        <p class="text-sm text-muted mb-16">Tindakan di bawah tidak dapat dibatalkan.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button class="btn btn-ghost" onclick="handleLogout()" style="justify-content:center">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Logout
          </button>
          <button class="btn btn-danger" onclick="confirmDeleteAccount()" style="justify-content:center">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Hapus Akun
          </button>
        </div>
      </div>
    </div>
  `;
}

async function saveSettings() {
  const name    = document.getElementById('set-name')?.value.trim();
  const balance = parseFloat(document.getElementById('set-balance')?.value)||0;
  const budget  = parseFloat(document.getElementById('set-budget')?.value)||100000;
  if (!name) { showToast('Nama tidak boleh kosong!','error'); return; }
  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  try {
    await pbUpdateProfile({ name, balance, daily_budget:budget });
    appState.user.name=name; appState.user.balance=balance; appState.user.dailyBudget=budget;
    renderSidebar();
    showToast('✅ Profil tersimpan!','success');
  } catch(err) {
    showToast('Gagal menyimpan: '+(err.message||err),'error');
  } finally { btn.disabled=false; }
}

async function changePassword() {
  const oldPass  = document.getElementById('set-old-pass').value;
  const newPass  = document.getElementById('set-new-pass').value;
  const confPass = document.getElementById('set-confirm-pass').value;
  if (!oldPass || !newPass || !confPass) { showToast('Semua field password wajib diisi!','error'); return; }
  if (newPass.length < 8)  { showToast('Password baru min. 8 karakter!','error'); return; }
  if (newPass !== confPass){ showToast('Konfirmasi password tidak cocok!','error'); return; }

  const btn = document.getElementById('changePassBtn');
  btn.disabled = true;
  try {
    await pb.collection('users').update(pb.authStore.record?.id, {
      oldPassword: oldPass, password: newPass, passwordConfirm: confPass,
    });
    document.getElementById('set-old-pass').value  = '';
    document.getElementById('set-new-pass').value  = '';
    document.getElementById('set-confirm-pass').value = '';
    showToast('🔒 Password berhasil diganti!','success');
  } catch(err) {
    const msg = err?.data?.data?.oldPassword?.message || err?.message || String(err);
    showToast('Gagal ganti password: '+msg,'error');
  } finally { btn.disabled=false; }
}

function exportCSVSettings() {
  try {
    const csv  = pbExportCSV(appState.transactions);
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`spendwise_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('📊 Export CSV berhasil!','success');
  } catch(e) { showToast('Gagal export: '+e.message,'error'); }
}

function exportJSONSettings() {
  const data = {
    exportedAt:   new Date().toISOString(),
    user:         appState.user,
    transactions: appState.transactions,
    budgets:      appState.budgets,
    goals:        appState.goals||[],
    recurring:    appState.recurring||[],
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`spendwise_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('📦 Backup JSON berhasil!','success');
}

async function handleImportJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text   = await file.text();
    const data   = JSON.parse(text);
    const txs    = data.transactions;
    if (!Array.isArray(txs)) throw new Error('Format tidak valid: transactions bukan array');

    showConfirm('📥 Import Transaksi',
      `Akan mengimpor <strong>${txs.length} transaksi</strong> dari backup.<br>Duplikat mungkin terjadi jika data sudah ada.`,
      async () => {
        let success=0, fail=0;
        showToast('Mengimpor transaksi...','info',10000);
        for (const tx of txs) {
          try {
            const saved = await pbCreateTransaction(tx);
            appState.transactions.unshift(saved);
            success++;
          } catch { fail++; }
        }
        showToast(`✅ Import selesai: ${success} berhasil${fail?`, ${fail} gagal`:''}`, success>0?'success':'error', 5000);
        event.target.value = '';
      }
    );
  } catch(e) {
    showToast('File tidak valid: '+e.message,'error');
    event.target.value = '';
  }
}

function handleLogout() {
  showConfirm('👋 Logout','Kamu akan keluar dari SpendWise.<br>Data tetap aman di server.',()=>{
    pbLogout(); location.reload();
  });
}

async function confirmDeleteAccount() {
  showConfirm('🚨 Hapus Akun',
    `Semua data akan <strong style="color:var(--danger)">dihapus permanen</strong>.<br>Yakin?`,
    async () => {
      try {
        await pb.collection('users').delete(pb.authStore.record?.id);
        pbLogout(); location.reload();
      } catch(err) { showToast('Gagal hapus akun: '+(err.message||err),'error'); }
    },
    { confirmLabel:'Ya, Hapus Akun', danger:true }
  );
}