// src/components/GoalsPage.js
// ─────────────────────────────────────────────────────────────────
// Goals & Tabungan — target menabung per tujuan keuangan
//
// Fitur:
//   ✅ Buat goal (nama, target, emoji, deadline)
//   ✅ Tambah setoran ke goal
//   ✅ Progress bar visual
//   ✅ Tandai goal selesai
//   ✅ Hapus goal
//   ✅ Simpan ke PocketBase (collection: goals)
//   ✅ Estimasi kapan tercapai berdasarkan rata-rata setoran
// ─────────────────────────────────────────────────────────────────

function renderGoalsPage() {
  const page = document.getElementById('page-goals');
  if (!page) return;

  const goals  = appState.goals || [];
  const active = goals.filter(g => !g.done);
  const done   = goals.filter(g =>  g.done);

  const totalTarget = active.reduce((s, g) => s + g.target, 0);
  const totalSaved  = active.reduce((s, g) => s + g.saved,  0);

  page.innerHTML = `
    <div style="max-width:780px;margin:0 auto">

      <!-- Summary Stats -->
      <div class="stats-grid mb-16" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card blue">
          <div class="stat-label">Goals Aktif</div>
          <div class="stat-value blue">${active.length}</div>
          <div class="stat-sub">${done.length} sudah tercapai</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Total Terkumpul</div>
          <div class="stat-value green mono">${fmtRp(totalSaved)}</div>
          <div class="stat-sub">dari ${fmtRp(totalTarget)}</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">Progress Total</div>
          <div class="stat-value purple">${totalTarget > 0 ? Math.round((totalSaved/totalTarget)*100) : 0}%</div>
          <div class="stat-sub">semua goal aktif</div>
        </div>
      </div>

      <!-- Tombol Tambah Goal -->
      <div class="flex-between mb-16">
        <div class="text-sm text-muted">${active.length} goal aktif</div>
        <button class="btn btn-primary" onclick="openGoalModal()">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Tambah Goal
        </button>
      </div>

      <!-- Active Goals -->
      <div id="goalsList">
        ${active.length
          ? active.map(g => _goalCardHTML(g)).join('')
          : `<div class="empty-state">
               <span class="icon">🎯</span>
               <h3>Belum Ada Goal</h3>
               <p>Mulai tetapkan target keuanganmu!<br>Beli rumah, liburan, dana darurat, atau apapun.</p>
               <button class="btn btn-primary mt-16" onclick="openGoalModal()">
                 <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Buat Goal Pertama
               </button>
             </div>`
        }
      </div>

      <!-- Completed Goals -->
      ${done.length ? `
        <div class="card mt-16">
          <div class="card-header">
            <div class="card-title">🏆 Goals Tercapai</div>
            <span class="badge badge-green">${done.length}</span>
          </div>
          ${done.map(g => `
            <div class="goal-done-item">
              <span style="font-size:20px">${g.emoji || '🎯'}</span>
              <div style="flex:1">
                <div class="text-sm fw-bold">${g.name}</div>
                <div class="text-xs text-muted">${fmtRp(g.target)} · Tercapai ${g.completedAt ? formatDate(new Date(g.completedAt)) : ''}</div>
              </div>
              <button class="btn btn-ghost text-xs" onclick="deleteGoal('${g.id}')" style="color:var(--muted)">🗑️</button>
            </div>`).join('')}
        </div>` : ''}
    </div>

    <!-- Modal Goal -->
    <div class="modal-overlay" id="goalModal" style="display:none">
      <div class="modal" style="max-width:460px">
        <div class="modal-header">
          <div class="modal-title" id="goalModalTitle">🎯 Buat Goal Baru</div>
          <button class="modal-close" onclick="closeGoalModal()">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal-body" id="goalModalBody"></div>
      </div>
    </div>
  `;
}

function _goalCardHTML(g) {
  const p        = clamp(g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0, 0, 100);
  const left     = g.target - g.saved;
  const color    = p >= 100 ? 'var(--accent)' : p >= 70 ? '#00b8d4' : p >= 40 ? 'var(--warn)' : 'var(--purple)';
  const deadline = g.deadline ? new Date(g.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
  const avgDeposit = g.deposits?.length
    ? Math.round(g.deposits.reduce((s, d) => s + d.amt, 0) / g.deposits.length)
    : 0;
  const estMonths = avgDeposit > 0 ? Math.ceil(left / avgDeposit) : null;

  return `
    <div class="goal-card" id="goal-${g.id}">
      <div class="goal-card-header">
        <div class="goal-emoji-wrap">${g.emoji || '🎯'}</div>
        <div style="flex:1;min-width:0">
          <div class="goal-name">${g.name}</div>
          <div class="goal-meta-row">
            ${deadline ? `<span class="goal-badge ${daysLeft < 30 ? 'danger' : 'blue'}">
              📅 ${daysLeft > 0 ? daysLeft + ' hari lagi' : 'Jatuh tempo!'}
            </span>` : ''}
            ${estMonths ? `<span class="goal-badge muted">⏱ Est. ${estMonths} setoran lagi</span>` : ''}
          </div>
        </div>
        <div class="goal-pct" style="color:${color}">${p}%</div>
      </div>

      <div class="goal-amounts">
        <span class="mono" style="color:${color}">${fmtRp(g.saved)}</span>
        <span class="text-muted text-xs">terkumpul</span>
        <span class="mono fw-bold">${fmtRp(g.target)}</span>
      </div>

      <div class="progress-bar" style="height:10px;border-radius:5px;margin:10px 0">
        <div class="progress-fill" style="width:${p}%;background:${color};border-radius:5px;transition:width 0.6s ease"></div>
      </div>

      <div class="text-xs text-muted mb-12">
        Kurang <strong style="color:var(--text)">${fmtRp(left)}</strong> lagi
        ${g.deposits?.length ? ` · ${g.deposits.length}x setoran` : ''}
      </div>

      <!-- Riwayat setoran mini -->
      ${g.deposits?.length ? `
        <div class="goal-deposits-mini">
          ${g.deposits.slice(-3).reverse().map(d => `
            <div class="goal-deposit-row">
              <span class="text-xs text-muted">${formatDate(new Date(d.date))}</span>
              <span class="text-xs mono" style="color:var(--accent)">+${fmtRp(d.amt)}</span>
              ${d.note ? `<span class="text-xs text-muted">· ${d.note}</span>` : ''}
            </div>`).join('')}
        </div>` : ''}

      <div class="goal-actions">
        <button class="btn btn-primary" style="flex:1;justify-content:center;padding:9px"
          onclick="openDepositModal('${g.id}')">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Tambah Setoran
        </button>
        <button class="btn btn-ghost" onclick="openEditGoalModal('${g.id}')" style="padding:9px 14px" title="Edit">✏️</button>
        <button class="btn btn-ghost" onclick="markGoalDone('${g.id}')" style="padding:9px 14px" title="Tandai selesai">🏆</button>
        <button class="btn btn-ghost" onclick="deleteGoal('${g.id}')" style="padding:9px 14px;color:var(--danger)" title="Hapus">🗑️</button>
      </div>
    </div>`;
}

// ── MODAL BUAT/EDIT GOAL ──────────────────────────────────────────

const GOAL_EMOJIS = ['🎯','🏠','🚗','✈️','💻','📱','🎓','💍','🏋️','🏖️','💰','🏦','🛡️','🎮','📷'];

function openGoalModal(editId = null) {
  const modal   = document.getElementById('goalModal');
  const bodyEl  = document.getElementById('goalModalBody');
  const titleEl = document.getElementById('goalModalTitle');
  if (!modal || !bodyEl) return;

  const g = editId ? (appState.goals || []).find(x => x.id === editId) : null;
  titleEl.textContent = g ? '✏️ Edit Goal' : '🎯 Buat Goal Baru';

  bodyEl.innerHTML = `
    <div class="form-group">
      <label class="form-label">Nama Goal</label>
      <input type="text" class="form-input" id="goalName"
        placeholder="Contoh: DP Rumah, Liburan Bali, Dana Darurat"
        value="${g?.name || ''}" maxlength="50">
    </div>
    <div class="form-group">
      <label class="form-label">Target (Rp)</label>
      <input type="number" class="form-input" id="goalTarget"
        placeholder="Contoh: 50000000" min="1000"
        value="${g?.target || ''}" style="font-family:var(--mono)">
    </div>
    <div class="form-group">
      <label class="form-label">Saldo Awal / Sudah Terkumpul (Rp)</label>
      <input type="number" class="form-input" id="goalInitial"
        placeholder="0 jika mulai dari nol" min="0"
        value="${g?.saved || 0}" style="font-family:var(--mono)">
    </div>
    <div class="form-group">
      <label class="form-label">Deadline (opsional)</label>
      <input type="date" class="form-input" id="goalDeadline"
        value="${g?.deadline?.slice(0,10) || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Emoji</label>
      <div class="emoji-picker" id="goalEmojiPicker">
        ${GOAL_EMOJIS.map(e => `
          <button class="emoji-btn ${(g?.emoji || '🎯') === e ? 'active' : ''}"
            onclick="selectGoalEmoji('${e}', this)">${e}</button>`).join('')}
      </div>
      <input type="hidden" id="goalEmoji" value="${g?.emoji || '🎯'}">
    </div>
    <button class="btn btn-primary w-full" style="justify-content:center;padding:13px;margin-top:4px"
      onclick="saveGoal('${editId || ''}')">
      <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
      ${g ? 'Update Goal' : 'Simpan Goal'}
    </button>`;

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('goalName')?.focus(), 100);
}

function openEditGoalModal(id) { openGoalModal(id); }

function closeGoalModal() {
  const modal = document.getElementById('goalModal');
  if (modal) modal.style.display = 'none';
}

function selectGoalEmoji(emoji, el) {
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('goalEmoji').value = emoji;
}

async function saveGoal(editId) {
  const name     = document.getElementById('goalName')?.value.trim();
  const target   = parseFloat(document.getElementById('goalTarget')?.value) || 0;
  const initial  = parseFloat(document.getElementById('goalInitial')?.value) || 0;
  const deadline = document.getElementById('goalDeadline')?.value || null;
  const emoji    = document.getElementById('goalEmoji')?.value || '🎯';

  if (!name)         { showToast('Nama goal wajib diisi!', 'error');  return; }
  if (target < 1000) { showToast('Target minimal Rp 1.000!', 'error'); return; }

  if (!appState.goals) appState.goals = [];

  if (editId) {
    const idx = appState.goals.findIndex(g => g.id === editId);
    if (idx !== -1) {
      appState.goals[idx] = { ...appState.goals[idx], name, target, deadline, emoji };
      await _saveGoalsToPB();
      showToast('✏️ Goal diperbarui!', 'success');
    }
  } else {
    const newGoal = {
      id:        genId(),
      name, target, emoji, deadline,
      saved:     initial,
      done:      false,
      createdAt: new Date().toISOString(),
      deposits:  initial > 0 ? [{ id: genId(), amt: initial, note: 'Saldo awal', date: new Date().toISOString() }] : [],
    };
    appState.goals.push(newGoal);
    await _saveGoalsToPB();
    showToast(`🎯 Goal "${name}" dibuat!`, 'success');
  }

  closeGoalModal();
  renderGoalsPage();
  renderSidebar(); // update badge
}

// ── DEPOSIT ───────────────────────────────────────────────────────

function openDepositModal(goalId) {
  const goal  = (appState.goals || []).find(g => g.id === goalId);
  if (!goal) return;
  const modal  = document.getElementById('goalModal');
  const bodyEl = document.getElementById('goalModalBody');
  const titleEl= document.getElementById('goalModalTitle');
  if (!modal || !bodyEl) return;

  const left = goal.target - goal.saved;
  titleEl.textContent = `${goal.emoji} Tambah Setoran — ${goal.name}`;

  bodyEl.innerHTML = `
    <div class="goal-deposit-info">
      <div class="flex-between mb-8">
        <span class="text-sm text-muted">Sudah terkumpul</span>
        <span class="mono fw-bold" style="color:var(--accent)">${fmtRp(goal.saved)}</span>
      </div>
      <div class="flex-between mb-8">
        <span class="text-sm text-muted">Target</span>
        <span class="mono fw-bold">${fmtRp(goal.target)}</span>
      </div>
      <div class="flex-between">
        <span class="text-sm text-muted">Kurang</span>
        <span class="mono fw-bold" style="color:var(--warn)">${fmtRp(left)}</span>
      </div>
      <div class="progress-bar mt-12" style="height:8px">
        <div class="progress-fill" style="width:${Math.min(100, Math.round(goal.saved/goal.target*100))}%;background:var(--accent)"></div>
      </div>
    </div>

    <div class="form-group mt-16">
      <label class="form-label">Jumlah Setoran (Rp)</label>
      <input type="number" class="form-input amount-input" id="depositAmt"
        placeholder="Masukkan jumlah setoran" min="0"
        style="font-family:var(--mono)" oninput="_previewDeposit('${goalId}')">
      <div id="depositPreview" class="text-xs text-muted mt-6"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Catatan (opsional)</label>
      <input type="text" class="form-input" id="depositNote"
        placeholder="Contoh: Transfer BCA, Bonus bulanan..."
        maxlength="80">
    </div>

    <!-- Quick amount buttons -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      ${[50000,100000,200000,500000].map(v =>
        `<button class="btn btn-ghost text-xs" onclick="document.getElementById('depositAmt').value=${v};_previewDeposit('${goalId}')" style="flex:1;justify-content:center">${fmt(v)}</button>`
      ).join('')}
    </div>

    <button class="btn btn-primary w-full" style="justify-content:center;padding:13px"
      onclick="addDeposit('${goalId}')">
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
      Tambah Setoran
    </button>`;

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('depositAmt')?.focus(), 100);
}

function _previewDeposit(goalId) {
  const goal = (appState.goals || []).find(g => g.id === goalId);
  if (!goal) return;
  const amt  = parseFloat(document.getElementById('depositAmt')?.value) || 0;
  const el   = document.getElementById('depositPreview');
  if (!el) return;
  const newTotal = goal.saved + amt;
  const newPct   = Math.round((newTotal / goal.target) * 100);
  if (amt > 0) {
    el.innerHTML = `Setelah setoran: <strong style="color:var(--accent)">${fmtRp(newTotal)}</strong> (${newPct}%)${newPct >= 100 ? ' 🎉 Goal tercapai!' : ''}`;
  } else {
    el.textContent = '';
  }
}

async function addDeposit(goalId) {
  const amt  = parseFloat(document.getElementById('depositAmt')?.value) || 0;
  const note = document.getElementById('depositNote')?.value.trim() || '';
  if (amt <= 0) { showToast('Masukkan jumlah setoran!', 'error'); return; }

  const idx = (appState.goals || []).findIndex(g => g.id === goalId);
  if (idx === -1) return;

  const goal    = appState.goals[idx];
  const deposit = { id: genId(), amt, note, date: new Date().toISOString() };
  if (!goal.deposits) goal.deposits = [];
  goal.deposits.push(deposit);
  goal.saved += amt;

  const wasNotDone = !goal.done;
  if (goal.saved >= goal.target) {
    goal.done        = true;
    goal.completedAt = new Date().toISOString();
  }

  await _saveGoalsToPB();
  closeGoalModal();

  if (goal.done && wasNotDone) {
    showToast(`🎉 Selamat! Goal "${goal.name}" TERCAPAI!`, 'success', 5000);
  } else {
    showToast(`💰 +${fmtRp(amt)} ditambahkan ke "${goal.name}"!`, 'success');
  }

  renderGoalsPage();
  renderSidebar();
}

// ── AKSI GOAL ─────────────────────────────────────────────────────

async function markGoalDone(goalId) {
  showConfirm('🏆 Tandai Selesai', 'Tandai goal ini sebagai <strong>tercapai</strong>?', async () => {
    const idx = (appState.goals || []).findIndex(g => g.id === goalId);
    if (idx === -1) return;
    appState.goals[idx].done        = true;
    appState.goals[idx].completedAt = new Date().toISOString();
    await _saveGoalsToPB();
    showToast('🏆 Goal ditandai selesai!', 'success');
    renderGoalsPage();
    renderSidebar();
  });
}

async function deleteGoal(goalId) {
  const goal = (appState.goals || []).find(g => g.id === goalId);
  if (!goal) return;
  showConfirm('🗑️ Hapus Goal', `Yakin hapus goal <strong>"${goal.name}"</strong>?`, async () => {
    appState.goals = appState.goals.filter(g => g.id !== goalId);
    await _saveGoalsToPB();
    showToast('🗑️ Goal dihapus', 'info');
    renderGoalsPage();
    renderSidebar();
  }, { confirmLabel: 'Ya, Hapus', danger: true });
}

// ── POCKETBASE SYNC ───────────────────────────────────────────────
// Goals disimpan sebagai JSON di field khusus di users record
// (lebih simpel dari bikin collection baru)
async function _saveGoalsToPB() {
  try {
    await pb.collection('users').update(pb.authStore.record?.id, {
      goals_json: JSON.stringify(appState.goals || []),
    });
  } catch (err) {
    // Jika field belum ada, buat dulu via migration atau abaikan
    console.warn('[Goals] Gagal sync ke PB:', err.message);
  }
}