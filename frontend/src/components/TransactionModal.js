// src/components/TransactionModal.js
// Modal catat + edit + hapus transaksi — PocketBase async

let _currentTab  = 'out';
let _selectedCat = 'makanan';
let _editingTxId = null;

function openModal(txId = null) {
  _editingTxId = txId;
  const modal   = document.getElementById('addModal');
  const titleEl = modal.querySelector('.modal-title');
  const dateInput = document.getElementById('txDate');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 16);

  if (txId) {
    const tx = appState.transactions.find(t => t.id === txId);
    if (!tx) return;
    titleEl.textContent = '✏️ Edit Transaksi';
    switchTransactionTab(tx.type);
    document.getElementById('txAmount').value = tx.amt;
    document.getElementById('txNote').value   = tx.note || '';
    if (dateInput) dateInput.value = new Date(tx.date).toISOString().slice(0, 16);
    if (tx.type === 'out') {
      _selectedCat = tx.cat || 'makanan';
      buildCategoryGrid();
      if (tx.method) document.getElementById('txMethod').value = tx.method;
    } else {
      if (tx.src) document.getElementById('txSource').value = tx.src;
    }
    document.getElementById('saveTxBtn').innerHTML =
      `<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Update Transaksi`;
  } else {
    titleEl.textContent = 'Catat Transaksi';
    document.getElementById('txAmount').value = '';
    document.getElementById('txNote').value   = '';
    switchTransactionTab('out');
    document.getElementById('saveTxBtn').innerHTML =
      `<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan Transaksi`;
  }
  modal.classList.add('show');
  setTimeout(() => document.getElementById('txAmount').focus(), 150);
}

function closeModal() {
  document.getElementById('addModal').classList.remove('show');
  _editingTxId = null;
}

function switchTransactionTab(tab) {
  _currentTab = tab;
  document.getElementById('tabOut').classList.toggle('active', tab === 'out');
  document.getElementById('tabIn').classList.toggle('active',  tab === 'in');
  document.getElementById('sectionCategory').style.display = tab === 'out' ? '' : 'none';
  document.getElementById('sectionSource').style.display   = tab === 'in'  ? '' : 'none';
  document.getElementById('sectionMethod').style.display   = tab === 'out' ? '' : 'none';
}

function buildCategoryGrid() {
  const grid = document.getElementById('catGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(c => `
    <button class="cat-btn ${c.id === _selectedCat ? 'active' : ''}"
            onclick="selectCategory('${c.id}', this)">
      <span class="emoji">${c.emoji}</span>${c.label}
    </button>`).join('');
}

function selectCategory(id, el) {
  _selectedCat = id;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

async function saveTransaction() {
  const amtRaw = document.getElementById('txAmount').value;
  const amt    = parseFloat(amtRaw);
  if (!amtRaw || isNaN(amt) || amt <= 0) {
    showToast('Masukkan nominal yang valid!', 'error');
    return;
  }

  const note      = document.getElementById('txNote').value.trim();
  const method    = document.getElementById('txMethod')?.value  || null;
  const src       = document.getElementById('txSource')?.value   || null;
  const dateVal   = document.getElementById('txDate')?.value;
  const txDate    = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();

  const btn = document.getElementById('saveTxBtn');
  btn.disabled = true;

  try {
    if (_editingTxId) {
      // ── EDIT ──
      const old = appState.transactions.find(t => t.id === _editingTxId);
      if (!old) return;

      // Koreksi saldo
      appState.user.balance += old.type === 'out' ? old.amt : -old.amt;

      const updated = {
        id:     _editingTxId,
        type:   _currentTab,
        amt, date: txDate,
        note:   note || (_currentTab === 'out' ? getCatById(_selectedCat).label : src),
        cat:    _currentTab === 'out' ? _selectedCat : null,
        src:    _currentTab === 'in'  ? src    : null,
        method: _currentTab === 'out' ? method : null,
      };

      // Simpan ke PocketBase
      const saved = await pbUpdateTransaction(_editingTxId, updated);
      appState.user.balance += saved.type === 'out' ? -saved.amt : saved.amt;

      const idx = appState.transactions.findIndex(t => t.id === _editingTxId);
      if (idx !== -1) appState.transactions[idx] = saved;

      // Update saldo user di PB
      await pbUpdateProfile({ name: appState.user.name, balance: appState.user.balance, daily_budget: appState.user.dailyBudget });

      closeModal();
      showPage(appState.currentPage);
      showToast('✏️ Transaksi diupdate!', 'success');

    } else {
      // ── TAMBAH ──
      const tx = {
        type: _currentTab, amt, date: txDate,
        note: note || (_currentTab === 'out' ? getCatById(_selectedCat).label : src),
        cat:    _currentTab === 'out' ? _selectedCat : null,
        src:    _currentTab === 'in'  ? src    : null,
        method: _currentTab === 'out' ? method : null,
      };

      const saved = await pbCreateTransaction(tx);

      if (saved.type === 'out') {
        appState.user.balance -= saved.amt;
        _checkBudgetAlert(saved.cat, saved.amt);
      } else {
        appState.user.balance += saved.amt;
      }

      // Sisipkan di posisi tanggal yang benar
      const insertIdx = appState.transactions.findIndex(t => new Date(t.date) < new Date(saved.date));
      if (insertIdx === -1) appState.transactions.push(saved);
      else appState.transactions.splice(insertIdx, 0, saved);

      await pbUpdateProfile({ name: appState.user.name, balance: appState.user.balance, daily_budget: appState.user.dailyBudget });

      closeModal();
      showPage(appState.currentPage);
      showToast(`${tx.type === 'out' ? '💸' : '💰'} ${fmtRp(saved.amt)} dicatat!`, 'success');
    }
  } catch (err) {
    showToast('Gagal menyimpan: ' + (err.message || err), 'error');
  } finally {
    btn.disabled = false;
  }
}

function deleteTransaction(txId) {
  const tx = appState.transactions.find(t => t.id === txId);
  if (!tx) return;
  showConfirm(
    '🗑️ Hapus Transaksi',
    `Yakin hapus "<strong>${tx.note || getCatById(tx.cat)?.label || 'transaksi'}</strong>"?<br>
     <span style="color:var(--danger);font-family:var(--mono)">${tx.type==='out'?'-':'+'}${fmtRp(tx.amt)}</span>`,
    async () => {
      try {
        await pbDeleteTransaction(txId);
        appState.user.balance += tx.type === 'out' ? tx.amt : -tx.amt;
        appState.transactions = appState.transactions.filter(t => t.id !== txId);
        await pbUpdateProfile({ name: appState.user.name, balance: appState.user.balance, daily_budget: appState.user.dailyBudget });
        showPage(appState.currentPage);
        showToast('🗑️ Transaksi dihapus', 'info');
      } catch (err) {
        showToast('Gagal hapus: ' + (err.message || err), 'error');
      }
    }
  );
}

function _checkBudgetAlert(catId, amt) {
  if (!catId) return;
  const now    = new Date();
  const budget = appState.budgets?.[catId]?.amount || getCatById(catId).defaultBudget;
  const spent  = appState.transactions
    .filter(t => t.type === 'out' && t.cat === catId && sameMonth(new Date(t.date), now))
    .reduce((s, t) => s + t.amt, 0) + amt;
  const p = Math.round((spent / budget) * 100);
  const cat = getCatById(catId);
  if      (p >= 100) showToast(`🚨 Budget ${cat.emoji} ${cat.label} penuh! (${p}%)`, 'error');
  else if (p >= 80)  showToast(`⚠️ Budget ${cat.emoji} ${cat.label} ${p}%`, 'info');
}

function txItemHTML(tx) {
  const cat   = tx.cat ? getCatById(tx.cat) : null;
  const emoji = tx.type === 'in' ? '💰' : (cat ? cat.emoji : '📦');
  const color = tx.type === 'in' ? '#00e5a0' : (cat ? cat.color : '#b2bec3');
  const label = tx.note || (cat ? cat.label : (tx.src || 'Transaksi'));
  const meta  = [formatDate(new Date(tx.date)), tx.method || tx.src].filter(Boolean).join(' · ');
  return `
    <div class="tx-item" id="tx-${tx.id}">
      <div class="tx-icon" style="background:${color}22">${emoji}</div>
      <div class="tx-info">
        <div class="tx-name">${label}</div>
        <div class="tx-meta">${meta}</div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type==='in'?'+':'-'}${fmtRp(tx.amt)}</div>
      <div class="tx-actions">
        <button class="btn-tx-action edit"   onclick="openModal('${tx.id}')"         title="Edit">✏️</button>
        <button class="btn-tx-action delete" onclick="deleteTransaction('${tx.id}')" title="Hapus">🗑️</button>
      </div>
    </div>`;
}