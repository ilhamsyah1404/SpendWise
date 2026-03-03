// src/components/Dashboard.js

let _weekChart = null;
let _pieChart  = null;

function renderDashboard() {
  const now        = new Date();
  const todayTxs   = appState.transactions.filter(t => sameDay(new Date(t.date), now));
  const monthTxs   = appState.transactions.filter(t => sameMonth(new Date(t.date), now));
  const lastMonth  = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonthTxs = appState.transactions.filter(t => sameMonth(new Date(t.date), lastMonth));

  const todayOut   = calcTotal(todayTxs, 'out');
  const monthIn    = calcTotal(monthTxs, 'in');
  const monthOut   = calcTotal(monthTxs, 'out');
  const lastMonthOut = calcTotal(lastMonthTxs, 'out');
  const budgetLeft = Math.max(0, appState.user.dailyBudget - todayOut);
  const budgetPct  = clamp(Math.round((todayOut / Math.max(1, appState.user.dailyBudget)) * 100), 0, 999);

  // Trend vs bulan lalu
  const trendPct   = lastMonthOut > 0 ? Math.round(((monthOut - lastMonthOut) / lastMonthOut) * 100) : 0;
  const trendUp    = trendPct > 0;

  document.getElementById('statBalance').textContent    = fmtRp(appState.user.balance);
  document.getElementById('statTodayOut').textContent   = fmtRp(todayOut);
  document.getElementById('statMonthIn').textContent    = fmtRp(monthIn);
  document.getElementById('statBudgetLeft').textContent = fmtRp(budgetLeft);

  const todaySubEl = document.getElementById('statTodaySub');
  if (todaySubEl) {
    todaySubEl.textContent = `Budget: ${fmtRp(appState.user.dailyBudget)}/hari`;
    todaySubEl.className   = 'stat-sub ' + (todayOut <= appState.user.dailyBudget ? '' : 'down');
  }
  const budgetSubEl = document.getElementById('statBudgetSub');
  if (budgetSubEl) {
    budgetSubEl.textContent = budgetLeft > 0
      ? `✅ Sisa ${100 - Math.min(100, budgetPct)}% budget`
      : '🔴 Budget habis!';
    budgetSubEl.className = 'stat-sub ' + (budgetLeft > 0 ? 'up' : 'down');
  }

  // Trend indicator di stat pengeluaran bulan ini
  const trendEl = document.getElementById('statTrend');
  if (trendEl && lastMonthOut > 0) {
    trendEl.innerHTML = `<span style="color:${trendUp?'var(--danger)':'var(--accent)'}">
      ${trendUp?'▲':'▼'} ${Math.abs(trendPct)}% vs bulan lalu
    </span>`;
  }

  _renderWeekChart();
  _renderPieChart();
  _renderRecentTx();
  _renderGoalsSummary();
}

function _renderWeekChart() {
  const {labels,data} = getLast7DaysData(appState.transactions);
  const weekTotal     = data.reduce((a,b)=>a+b,0);
  document.getElementById('weekChartTotal').textContent = 'Total: ' + fmtRp(weekTotal);

  const ctx = document.getElementById('weekChart')?.getContext('2d');
  if (!ctx) return;
  if (_weekChart) _weekChart.destroy();

  const th = getChartTheme();

  _weekChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_,i) => i===data.length-1 ? '#00e5a0' : 'rgba(0,229,160,0.22)'),
        borderRadius: 7,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: c => fmtRp(c.raw) },
          backgroundColor: th.tooltip, borderColor: th.border, borderWidth:1,
          titleColor: th.text, bodyColor:'#00e5a0', padding:10,
        },
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:th.tick, font:{family:'Space Mono',size:10}} },
        y: {
          grid: {color:th.grid, drawBorder:false},
          ticks: { color:th.tick, font:{size:10}, callback: v => v>=1000?(v/1000)+'rb':v },
          beginAtZero: true,
        },
      },
    },
  });
}

function _renderPieChart() {
  const now       = new Date();
  const monthTxs  = appState.transactions.filter(t => sameMonth(new Date(t.date), now));
  const catTotals = calcByCategory(monthTxs);
  const cats      = CATEGORIES.filter(c => catTotals[c.id] > 0);
  const total     = Object.values(catTotals).reduce((a,b)=>a+b,0);
  const ctx2      = document.getElementById('pieChart')?.getContext('2d');
  if (!ctx2) return;
  if (_pieChart) _pieChart.destroy();

  if (!cats.length) {
    document.getElementById('catBreakdown').innerHTML =
      '<p class="text-xs text-muted text-center" style="padding:20px">Belum ada pengeluaran bulan ini</p>';
    return;
  }

  const th = getChartTheme();

  _pieChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: cats.map(c=>c.label),
      datasets: [{ data:cats.map(c=>catTotals[c.id]), backgroundColor:cats.map(c=>c.color), borderWidth:0, hoverOffset:10 }],
    },
    options: {
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: { label: c => `${c.label}: ${fmtRp(c.raw)} (${pct(c.raw,total)}%)` },
          backgroundColor:th.tooltip, borderColor:th.border, borderWidth:1, padding:10,
        },
      },
      cutout: '68%',
    },
  });

  document.getElementById('catBreakdown').innerHTML = cats
    .sort((a,b) => catTotals[b.id]-catTotals[a.id])
    .map(c => {
      const p = pct(catTotals[c.id], total);
      return `
        <div class="cat-row">
          <div class="cat-row-header">
            <span class="cat-row-name">${c.emoji} ${c.label}</span>
            <span class="cat-row-amt">${p}% · ${fmtRp(catTotals[c.id])}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${p}%;background:${c.color}"></div>
          </div>
        </div>`;
    }).join('');
}

function _renderRecentTx() {
  const recent    = appState.transactions.slice(0,8);
  const container = document.getElementById('recentTxList');
  if (!container) return;
  if (!recent.length) {
    container.innerHTML = `<div class="empty-state"><span class="icon">💸</span><h3>Belum ada transaksi</h3><p>Klik tombol "Catat" untuk mulai mencatat!</p></div>`;
    return;
  }
  container.innerHTML = recent.map(txItemHTML).join('');
}

function _renderGoalsSummary() {
  const el = document.getElementById('dashGoals');
  if (!el || !appState.goals || !appState.goals.length) {
    if (el) el.style.display = 'none';
    return;
  }
  el.style.display = '';
  const active = appState.goals.filter(g => !g.done).slice(0, 3);
  if (!active.length) { el.style.display='none'; return; }
  el.querySelector('.goals-list').innerHTML = active.map(g => {
    const p = clamp(Math.round((g.saved / g.target) * 100), 0, 100);
    const left = g.target - g.saved;
    return `
      <div class="goal-mini-item">
        <div class="flex-between">
          <span class="text-sm fw-bold">${g.emoji || '🎯'} ${g.name}</span>
          <span class="text-xs mono text-muted">${p}%</span>
        </div>
        <div class="progress-bar" style="margin-top:5px">
          <div class="progress-fill" style="width:${p}%;background:var(--accent)"></div>
        </div>
        <div class="text-xs text-muted mt-4">Terkumpul ${fmtRp(g.saved)} · Kurang ${fmtRp(left)}</div>
      </div>`;
  }).join('');
}