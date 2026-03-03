// src/components/Sidebar.js

const NAV_ITEMS = [
  {
    section: 'Utama',
    items: [
      { id:'dashboard', label:'Dashboard',   icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
      { id:'transaksi', label:'Transaksi',   icon:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>' },
      { id:'search',    label:'Cari',        icon:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' },
    ],
  },
  {
    section: 'Kelola',
    items: [
      { id:'budget',    label:'Budget',      icon:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' },
      { id:'goals',     label:'Goals & Tabungan', icon:'<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>', badge:'🎯' },
      { id:'recurring', label:'Agenda Rutin', icon:'<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' },
    ],
  },
  {
    section: 'Analisis',
    items: [
      { id:'laporan',   label:'Laporan',     icon:'<path d="M18 20V10M12 20V4M6 20v-6"/>' },
      { id:'ai',        label:'AI Advisor',  icon:'<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 9h6M9 12h6M9 15h4"/>', badge:'AI' },
    ],
  },
  {
    section: 'Lainnya',
    items: [
      { id:'settings',  label:'Pengaturan',  icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
      { id:'timeline',  label:'Roadmap',     icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    ],
  },
];

const MOBILE_NAV_ITEMS = [
  { id:'dashboard', label:'Home',     icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { id:'transaksi', label:'Transaksi',icon:'<path d="M8 6h13M8 12h13M8 18h13"/>' },
  { id:'goals',     label:'Goals',    icon:'<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>' },
  { id:'ai',        label:'AI',       icon:'<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 9h6M9 12h6M9 15h4"/>' },
  { id:'settings',  label:'Settings', icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
];

function renderSidebar() {
  const navHtml = NAV_ITEMS.map(section => `
    <div class="nav-label">${section.section}</div>
    ${section.items.map(item => {
      // Badge count untuk goals
      let badge = '';
      if (item.badge === '🎯' && appState.goals) {
        const active = appState.goals.filter(g=>!g.done).length;
        if (active > 0) badge = `<span class="badge badge-green nav-badge" style="margin-left:auto">${active}</span>`;
      } else if (item.badge === 'AI') {
        badge = `<span class="badge badge-green nav-badge">AI</span>`;
      }
      return `
        <div class="nav-item ${item.id===appState.currentPage?'active':''}"
             onclick="showPage('${item.id}',this)" data-page="${item.id}">
          <svg viewBox="0 0 24 24">${item.icon}</svg>
          ${item.label}
          ${badge}
        </div>`;
    }).join('')}
  `).join('');

  document.getElementById('sidebarMount').innerHTML = `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="assets/logo.png" class="logo-img" alt="SpendWise" style="object-fit:contain;border-radius:8px">
        <span class="logo-text">SpendWise</span>
      </div>
      <div class="sidebar-nav">${navHtml}</div>
      <div class="sidebar-footer">
        <div class="user-card" onclick="showPage('settings')">
          <div class="user-avatar" id="sidebarAvatar">${(appState.user.name[0]||'U').toUpperCase()}</div>
          <div style="flex:1;min-width:0">
            <div class="user-name">${appState.user.name}</div>
            <div class="user-role text-xs text-muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${appState.user.email}</div>
          </div>
        </div>
      </div>
    </nav>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>`;

  document.getElementById('mobileNavMount').innerHTML = MOBILE_NAV_ITEMS.map(item => `
    <div class="mobile-nav-item ${item.id===appState.currentPage?'active':''}"
         onclick="showPage('${item.id}')" data-page="${item.id}">
      <svg viewBox="0 0 24 24">${item.icon}</svg>
      ${item.label}
    </div>`).join('');
}

const PAGE_TITLES = {
  dashboard:'Dashboard', transaksi:'Riwayat Transaksi', search:'Cari Transaksi',
  budget:'Budget Planning', goals:'Goals & Tabungan', recurring:'Agenda Rutin',
  laporan:'Laporan & Analisis', ai:'AI Advisor', settings:'Pengaturan', timeline:'Roadmap',
};

function showPage(id) {
  appState.currentPage = id;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const page = document.getElementById('page-'+id);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item,.mobile-nav-item').forEach(n=>{
    n.classList.toggle('active', n.dataset.page===id);
  });
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[id] || id;
  if (id==='dashboard')  renderDashboard();
  if (id==='transaksi')  renderTransaksiPage();
  if (id==='search')     renderSearchPage();
  if (id==='budget')     renderBudgetPage();
  if (id==='goals')      renderGoalsPage();
  if (id==='recurring')  renderRecurringPage();
  if (id==='laporan')    renderLaporanPage();
  if (id==='settings')   renderSettingsPage();
  if (id==='ai')         _reinitAIChips();
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
}
function _reinitAIChips() {
  const el = document.getElementById('aiChips');
  if (!el || el.children.length>0) return;
  if (typeof AI_SUGGESTION_CHIPS==='undefined') return;
  el.innerHTML = AI_SUGGESTION_CHIPS.map(c=>`<div class="ai-chip" onclick="sendAIMessage('${c.msg}')">${c.label}</div>`).join('');
}