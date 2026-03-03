// src/components/BudgetPage.js — fix budget format + tips

function renderBudgetPage() {
  renderBudgetProgress();
  renderBudgetForm();
}

function renderBudgetProgress() {
  const now      = new Date();
  const monthTxs = appState.transactions.filter(t => sameMonth(new Date(t.date), now));
  const container = document.getElementById('budgetGrid');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(c => {
    // FIX: support both {amount, pbId} dan number langsung
    const budgetVal = appState.budgets?.[c.id];
    const budget    = (typeof budgetVal === 'object' ? budgetVal?.amount : budgetVal) ?? c.defaultBudget;
    const spent     = calcTotal(monthTxs.filter(t=>t.cat===c.id),'out');
    const p         = clamp(budget>0?Math.round((spent/budget)*100):0, 0, 999);
    const color     = p>=100?'var(--danger)':p>=80?'var(--warn)':'var(--accent)';
    const remaining = Math.max(0, budget - spent);
    const daysLeft  = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() - now.getDate();
    const dailyLeft = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;

    return `
      <div class="budget-card ${p>=100?'over':''}">
        <div class="budget-card-top">
          <div class="budget-card-name">${c.emoji} ${c.label}</div>
          <div class="budget-pct" style="color:${color}">${p}%</div>
        </div>
        <div class="progress-bar" style="height:7px;border-radius:4px">
          <div class="progress-fill" style="width:${Math.min(p,100)}%;background:${color};border-radius:4px"></div>
        </div>
        <div class="budget-meta">
          ${fmtRp(spent)} dari ${fmtRp(budget)}
          · Sisa <strong style="color:${color}">${fmtRp(remaining)}</strong>
        </div>
        ${p < 100 && daysLeft > 0 ? `<div class="text-xs text-muted mt-4">💡 ~${fmtRp(dailyLeft)}/hari sisa ${daysLeft} hari</div>` : ''}
        ${p >= 100 ? `<div class="text-xs mt-4" style="color:var(--danger)">🚨 Budget bulan ini habis!</div>` : ''}
      </div>`;
  }).join('');
}

function renderBudgetForm() {
  const container = document.getElementById('budgetFormItems');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(c => {
    const budgetVal = appState.budgets?.[c.id];
    const budget    = (typeof budgetVal === 'object' ? budgetVal?.amount : budgetVal) ?? c.defaultBudget;
    return `
      <div class="flex-between gap-12" style="margin-bottom:14px;align-items:center">
        <div class="flex gap-8" style="align-items:center;min-width:140px">
          <span style="font-size:20px">${c.emoji}</span>
          <div>
            <div style="font-size:13px;font-weight:600">${c.label}</div>
            <div class="text-xs text-muted" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.tips.substring(0,36)}...</div>
          </div>
        </div>
        <div class="flex gap-8" style="align-items:center;flex:1">
          <span class="text-xs text-muted">Rp</span>
          <input type="number" class="form-input"
            style="flex:1;padding:8px 11px;font-size:13px;font-family:var(--mono)"
            value="${budget}" min="0"
            onchange="updateBudget('${c.id}', this.value)">
        </div>
      </div>`;
  }).join('');
}

async function updateBudget(catId, val) {
  const amount    = Math.max(0, parseFloat(val)||0);
  const existing  = appState.budgets?.[catId];
  const existingId = typeof existing === 'object' ? existing?.pbId : null;
  try {
    const newId = await pbUpsertBudget(catId, amount, existingId);
    if (!appState.budgets) appState.budgets = {};
    appState.budgets[catId] = { amount, pbId: newId || existingId };
    renderBudgetProgress();
    showToast(`Budget ${getCatById(catId).label} diperbarui!`, 'success');
  } catch(err) {
    showToast('Gagal update budget: '+(err.message||err), 'error');
  }
}