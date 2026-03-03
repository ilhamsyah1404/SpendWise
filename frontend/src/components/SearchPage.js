// src/components/SearchPage.js — dengan filter amount range

function renderSearchPage() {
  const page = document.getElementById('page-search');
  if (!page) return;
  page.innerHTML = `
    <div style="max-width:720px;margin:0 auto">
      <div class="card mb-16">
        <div class="search-bar-wrap">
          <svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" id="searchInput" class="search-input"
            placeholder="Cari transaksi... (catatan, kategori, metode)"
            oninput="runSearch()" autofocus>
          <button class="btn-clear-search" id="clearSearchBtn" onclick="clearSearch()" style="display:none">✕</button>
        </div>

        <div class="search-filters">
          <select class="form-input search-filter-select" id="searchType" onchange="runSearch()">
            <option value="all">Semua Tipe</option>
            <option value="out">Pengeluaran</option>
            <option value="in">Pemasukan</option>
          </select>
          <select class="form-input search-filter-select" id="searchCat" onchange="runSearch()">
            <option value="all">Semua Kategori</option>
            ${CATEGORIES.map(c=>`<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('')}
          </select>
          <select class="form-input search-filter-select" id="searchPeriod" onchange="runSearch()">
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
          </select>
        </div>

        <!-- Filter amount range -->
        <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">
          <span class="text-xs text-muted">Nominal:</span>
          <input type="number" id="searchMinAmt" class="form-input" placeholder="Min Rp"
            min="0" oninput="runSearch()" style="flex:1;min-width:100px;padding:7px 10px;font-size:12px;font-family:var(--mono)">
          <span class="text-xs text-muted">–</span>
          <input type="number" id="searchMaxAmt" class="form-input" placeholder="Max Rp"
            min="0" oninput="runSearch()" style="flex:1;min-width:100px;padding:7px 10px;font-size:12px;font-family:var(--mono)">
        </div>
      </div>

      <div id="searchResults">
        <div class="empty-state">
          <span class="icon">🔍</span>
          <h3>Cari Transaksi</h3>
          <p>Ketik kata kunci atau atur filter di atas.</p>
        </div>
      </div>
    </div>`;
}

function runSearch() {
  const keyword = (document.getElementById('searchInput')?.value||'').toLowerCase().trim();
  const type    = document.getElementById('searchType')?.value   || 'all';
  const cat     = document.getElementById('searchCat')?.value    || 'all';
  const period  = document.getElementById('searchPeriod')?.value || 'all';
  const minAmt  = parseFloat(document.getElementById('searchMinAmt')?.value) || 0;
  const maxAmt  = parseFloat(document.getElementById('searchMaxAmt')?.value) || Infinity;

  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = keyword ? '' : 'none';

  let results = [...appState.transactions];
  if (type !== 'all')   results = results.filter(t => t.type===type);
  if (cat  !== 'all')   results = results.filter(t => t.cat===cat);
  if (period !== 'all') results = filterByPeriod(results, period);
  if (minAmt > 0)       results = results.filter(t => t.amt >= minAmt);
  if (maxAmt < Infinity)results = results.filter(t => t.amt <= maxAmt);

  if (keyword) {
    results = results.filter(t => {
      const catLabel   = t.cat   ? getCatById(t.cat).label.toLowerCase():'';
      const noteText   = (t.note  ||'').toLowerCase();
      const srcText    = (t.src   ||'').toLowerCase();
      const methodText = (t.method||'').toLowerCase();
      return noteText.includes(keyword)||catLabel.includes(keyword)||srcText.includes(keyword)||methodText.includes(keyword);
    });
  }

  _renderSearchResults(results, keyword);
}

function _renderSearchResults(results, keyword) {
  const container = document.getElementById('searchResults');
  if (!container) return;
  if (!results.length) {
    container.innerHTML = `<div class="empty-state"><span class="icon">😕</span><h3>Tidak ditemukan</h3><p>Coba kata kunci lain atau ubah filter.</p></div>`;
    return;
  }
  const totalOut = results.filter(t=>t.type==='out').reduce((s,t)=>s+t.amt,0);
  const totalIn  = results.filter(t=>t.type==='in').reduce((s,t)=>s+t.amt,0);
  container.innerHTML = `
    <div class="search-summary">
      <span class="text-sm text-muted">${results.length} transaksi ditemukan</span>
      <div class="flex gap-12">
        ${totalOut?`<span class="text-sm" style="color:var(--danger)">-${fmtRp(totalOut)}</span>`:''}
        ${totalIn ?`<span class="text-sm" style="color:var(--accent)">+${fmtRp(totalIn)}</span>` :''}
      </div>
    </div>
    <div class="card"><div class="tx-list">${results.map(tx=>txItemHTMLHighlight(tx,keyword)).join('')}</div></div>`;
}

function txItemHTMLHighlight(tx, keyword) {
  const cat      = tx.cat ? getCatById(tx.cat) : null;
  const emoji    = tx.type==='in'?'💰':(cat?cat.emoji:'📦');
  const color    = tx.type==='in'?'#00e5a0':(cat?cat.color:'#b2bec3');
  const rawLabel = tx.note||(cat?cat.label:(tx.src||'Transaksi'));
  const label    = keyword ? _highlight(rawLabel,keyword) : rawLabel;
  const meta     = [formatDate(new Date(tx.date)),tx.method||tx.src].filter(Boolean).join(' · ');
  return `
    <div class="tx-item" id="tx-${tx.id}">
      <div class="tx-icon" style="background:${color}22">${emoji}</div>
      <div class="tx-info">
        <div class="tx-name">${label}</div>
        <div class="tx-meta">${meta}</div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type==='in'?'+':'-'}${fmtRp(tx.amt)}</div>
      <div class="tx-actions">
        <button class="btn-tx-action edit"   onclick="openModal('${tx.id}')"        title="Edit">✏️</button>
        <button class="btn-tx-action delete" onclick="deleteTransaction('${tx.id}')" title="Hapus">🗑️</button>
      </div>
    </div>`;
}

function _highlight(text, keyword) {
  if (!keyword) return text;
  const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(re,'<mark style="background:rgba(0,229,160,0.25);color:var(--accent);border-radius:2px;padding:0 1px">$1</mark>');
}
function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) { input.value=''; input.focus(); }
  runSearch();
}