// src/components/LaporanPage.js — fix bug + tren 6 bulan + custom date range

let _trendChart = null;

function renderLaporanPage() {
  const period    = document.getElementById('laporanPeriod')?.value    || 'month';
  const catFilt   = document.getElementById('laporanCatFilter')?.value  || 'all';
  const customStart = document.getElementById('laporanDateStart')?.value || '';
  const customEnd   = document.getElementById('laporanDateEnd')?.value   || '';

  // Tampilkan/sembunyikan custom date range
  const customRow = document.getElementById('laporanCustomRange');
  if (customRow) customRow.style.display = period === 'custom' ? 'flex' : 'none';

  let txs = filterByPeriod(appState.transactions, period, customStart, customEnd);
  if (catFilt !== 'all') txs = txs.filter(t => t.type==='in' || t.cat===catFilt);

  const totalOut   = calcTotal(txs,'out');
  const totalIn    = calcTotal(txs,'in');
  const net        = totalIn - totalOut;
  const txCount    = txs.length;
  const catTotals  = calcByCategory(txs);
  const topCats    = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  const savingRate = totalIn > 0 ? Math.round((Math.max(0,net)/totalIn)*100) : 0;

  // Stats
  const statsEl = document.getElementById('laporanStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card green">
        <div class="stat-label">Total Pemasukan</div>
        <div class="stat-value green mono">${fmtRp(totalIn)}</div>
        <div class="stat-sub">${txs.filter(t=>t.type==='in').length} transaksi</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Total Pengeluaran</div>
        <div class="stat-value red mono">${fmtRp(totalOut)}</div>
        <div class="stat-sub">${txs.filter(t=>t.type==='out').length} transaksi</div>
      </div>
      <div class="stat-card ${net>=0?'blue':'red'}">
        <div class="stat-label">Net Cashflow</div>
        <div class="stat-value ${net>=0?'blue':'red'} mono">${net<0?'-':''}${fmtRp(Math.abs(net))}</div>
        <div class="stat-sub ${net>=0?'up':'down'}">${net>=0?'✅ Surplus':'⚠️ Defisit'}</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">Saving Rate</div>
        <div class="stat-value purple mono">${savingRate}%</div>
        <div class="stat-sub">${savingRate>=20?'✅ Bagus!':savingRate>=10?'💡 Tingkatkan':'⚠️ Target: 20%'}</div>
      </div>`;
  }

  const reportEl = document.getElementById('reportGrid');
  if (!reportEl) return;

  const maxAmt     = topCats[0]?.[1] || 1;
  const avgTx      = txCount > 0 ? Math.round(totalOut/Math.max(1,txs.filter(t=>t.type==='out').length)) : 0;
  const biggestTx  = txs.filter(t=>t.type==='out').sort((a,b)=>b.amt-a.amt)[0];

  const catListHtml = topCats.length
    ? topCats.map(([id,amt]) => {
        const c      = getCatById(id);
        const p      = Math.round((amt/maxAmt)*100);
        // FIX: budgets sekarang format {amount, pbId}
        const budget = appState.budgets?.[id]?.amount ?? appState.budgets?.[id] ?? c.defaultBudget;
        const over   = amt > budget;
        const budgetAmt = typeof budget === 'object' ? budget.amount : budget;
        return `
          <div class="cat-row">
            <div class="cat-row-header">
              <span class="cat-row-name">${c.emoji} ${c.label}</span>
              <div class="flex gap-8" style="align-items:center">
                ${over?'<span class="badge badge-red" style="font-size:9px">OVER</span>':''}
                <span class="cat-row-amt">${fmtRp(amt)}</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${p}%;background:${c.color}"></div>
            </div>
            <div class="text-xs text-muted mt-4">
              Budget: ${fmtRp(budgetAmt)} · Sisa:
              <span style="color:${over?'var(--danger)':'var(--accent)'}">
                ${over?'–'+fmtRp(amt-budgetAmt):fmtRp(budgetAmt-amt)}
              </span>
            </div>
          </div>`;
      }).join('')
    : '<p class="text-sm text-muted text-center" style="padding:20px">Tidak ada data pengeluaran</p>';

  reportEl.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>Pengeluaran per Kategori</div>
      </div>
      <div class="cat-list">${catListHtml}</div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Ringkasan</div>
      </div>
      <div class="flex-col gap-12">
        <div class="flex-between"><span class="text-sm text-muted">Total Pengeluaran</span><span class="mono fw-bold text-danger">${fmtRp(totalOut)}</span></div>
        <div class="flex-between"><span class="text-sm text-muted">Total Pemasukan</span><span class="mono fw-bold text-accent">${fmtRp(totalIn)}</span></div>
        <div class="divider"></div>
        <div class="flex-between"><span class="text-sm text-muted">Net Cashflow</span><span class="mono fw-bold" style="color:${net>=0?'var(--accent)':'var(--danger)'}"> ${net<0?'-':''}${fmtRp(Math.abs(net))}</span></div>
        <div class="flex-between"><span class="text-sm text-muted">Saving Rate</span><span class="mono fw-bold" style="color:${savingRate>=20?'var(--accent)':'var(--warn)'}">${savingRate}%</span></div>
        <div class="flex-between"><span class="text-sm text-muted">Rata-rata/Transaksi</span><span class="mono fw-bold">${fmtRp(avgTx)}</span></div>
        <div class="flex-between"><span class="text-sm text-muted">Jumlah Transaksi</span><span class="mono fw-bold">${txCount}x</span></div>
        ${biggestTx?`<div class="flex-between"><span class="text-sm text-muted">Transaksi Terbesar</span><span class="text-sm fw-bold">${biggestTx.note||'-'} (${fmtRp(biggestTx.amt)})</span></div>`:''}
        ${topCats[0]?`<div class="flex-between"><span class="text-sm text-muted">Kategori Terboros</span><span class="text-sm fw-bold">${getCatById(topCats[0][0]).emoji} ${getCatById(topCats[0][0]).label}</span></div>`:''}
      </div>
      <div class="divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn btn-ghost text-xs" onclick="exportCSVData()" style="justify-content:center">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export CSV
        </button>
        <button class="btn btn-ghost text-xs" onclick="showPage('settings')" style="justify-content:center">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Backup JSON
        </button>
      </div>
    </div>

    <!-- Chart tren 6 bulan -->
    <div class="card" style="grid-column:1/-1">
      <div class="card-header">
        <div class="card-title"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Tren 6 Bulan Terakhir</div>
      </div>
      <div style="height:220px;position:relative"><canvas id="trendChart"></canvas></div>
    </div>`;

  _renderTrendChart();
}

function _renderTrendChart() {
  const ctx = document.getElementById('trendChart')?.getContext('2d');
  if (!ctx) return;
  if (_trendChart) _trendChart.destroy();

  const {labels, outData, inData} = getLast6MonthsData(appState.transactions);
  const th = getChartTheme();

  _trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pengeluaran',
          data: outData,
          borderColor: '#ff5f6d',
          backgroundColor: 'rgba(255,95,109,0.08)',
          fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: 'Pemasukan',
          data: inData,
          borderColor: '#00e5a0',
          backgroundColor: 'rgba(0,229,160,0.08)',
          fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { labels: { color: th.tick, font:{size:11}, boxWidth:12 } },
        tooltip: {
          callbacks: { label: c => `${c.dataset.label}: ${fmtRp(c.raw)}` },
          backgroundColor: th.tooltip, borderColor:th.border, borderWidth:1,
          titleColor:th.text, bodyColor:th.tick, padding:10,
        },
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:th.tick, font:{size:11}} },
        y: {
          grid: {color:th.grid, drawBorder:false},
          ticks: { color:th.tick, callback: v => v>=1000000?(v/1000000)+'jt': v>=1000?(v/1000)+'rb':v },
          beginAtZero: true,
        },
      },
    },
  });
}

// Transaksi dikelompokkan per tanggal
function renderTransaksiPage() {
  const typeFilter = document.getElementById('txTypeFilter')?.value || 'all';
  const catFilter  = document.getElementById('txCatFilter')?.value  || 'all';
  let txs = [...appState.transactions];
  if (typeFilter !== 'all') txs = txs.filter(t=>t.type===typeFilter);
  if (catFilter  !== 'all') txs = txs.filter(t=>t.cat===catFilter);

  const countEl = document.getElementById('txCount');
  if (countEl) {
    const outTotal = calcTotal(txs.filter(t=>t.type==='out'),'out');
    const inTotal  = calcTotal(txs.filter(t=>t.type==='in'),'in');
    countEl.textContent = `${txs.length} transaksi`+(txs.length?` · Keluar: ${fmtRp(outTotal)} · Masuk: ${fmtRp(inTotal)}`:'');
  }

  const container = document.getElementById('allTxList');
  if (!container) return;
  if (!txs.length) {
    container.innerHTML = `<div class="empty-state"><span class="icon">📋</span><h3>Tidak ada transaksi</h3><p>Coba ubah filter.</p></div>`;
    return;
  }

  const groups = {};
  txs.forEach(tx => {
    const key = new Date(tx.date).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  container.innerHTML = Object.entries(groups).map(([dateStr,items]) => {
    const d=new Date(dateStr);
    const dayOut=calcTotal(items,'out'), dayIn=calcTotal(items,'in');
    return `
      <div class="tx-date-group">
        <div class="tx-date-header">
          <span class="tx-date-label">${formatDate(d,'full')}</span>
          <span class="tx-date-total">
            ${dayIn ?`<span style="color:var(--accent)">+${fmtRp(dayIn)}</span>` :''}
            ${dayOut?`<span style="color:var(--danger)">-${fmtRp(dayOut)}</span>`:''}
          </span>
        </div>
        ${items.map(tx=>txItemHTML(tx)).join('')}
      </div>`;
  }).join('');
}

function exportCSVData() {
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