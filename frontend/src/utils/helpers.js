// src/utils/helpers.js

function fmt(n) {
  if (isNaN(n) || n === null || n === undefined) return '0';
  return Math.abs(Math.round(n)).toLocaleString('id-ID');
}
function fmtRp(n) { return 'Rp ' + fmt(n); }

function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function sameMonth(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth();
}
function sameWeek(a, b) {
  const startOfWeek = d => { const c=new Date(d); c.setDate(d.getDate()-d.getDay()); c.setHours(0,0,0,0); return c; };
  return startOfWeek(a).getTime()===startOfWeek(b).getTime();
}

function formatDate(d, mode='short') {
  const days       = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months     = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const monthsFull = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  if (mode==='full')       return `${days[d.getDay()]}, ${d.getDate()} ${monthsFull[d.getMonth()]} ${d.getFullYear()}`;
  if (mode==='time')       return d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  if (mode==='month-year') return `${monthsFull[d.getMonth()]} ${d.getFullYear()}`;
  if (mode==='iso')        return d.toISOString().slice(0,10);
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  if (sameDay(d,today))     return 'Hari ini, '  + formatDate(d,'time');
  if (sameDay(d,yesterday)) return 'Kemarin, '   + formatDate(d,'time');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function filterByPeriod(transactions, period, customStart, customEnd) {
  const now = new Date();
  return transactions.filter(t => {
    const d = new Date(t.date);
    if (period==='today')  return sameDay(d,now);
    if (period==='week')   return sameWeek(d,now);
    if (period==='month')  return sameMonth(d,now);
    if (period==='last3')  { const s=new Date(now); s.setMonth(s.getMonth()-3); return d>=s; }
    if (period==='year')   return d.getFullYear()===now.getFullYear();
    if (period==='custom' && customStart && customEnd) return d>=new Date(customStart) && d<=new Date(customEnd+'T23:59:59');
    return true;
  });
}

function calcTotal(transactions, type='out') {
  return transactions.filter(t=>t.type===type).reduce((s,t)=>s+t.amt,0);
}
function calcByCategory(transactions) {
  const result={};
  transactions.filter(t=>t.type==='out').forEach(t=>{ result[t.cat]=(result[t.cat]||0)+t.amt; });
  return result;
}
function calcDailyAvg(transactions, period='month') {
  const now=new Date(); let days=1;
  if (period==='month') days=now.getDate();
  if (period==='week')  days=7;
  const total=calcTotal(transactions.filter(t=>{ const d=new Date(t.date); if(period==='month') return sameMonth(d,now); if(period==='week') return sameWeek(d,now); return true; }));
  return Math.round(total/days);
}

function getLast7DaysData(transactions) {
  const now=new Date(); const labels=[]; const data=[];
  for (let i=6;i>=0;i--) {
    const d=new Date(now); d.setDate(d.getDate()-i);
    const dayNames=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    labels.push(i===0?'Hari ini':dayNames[d.getDay()]);
    data.push(transactions.filter(t=>t.type==='out'&&sameDay(new Date(t.date),d)).reduce((s,t)=>s+t.amt,0));
  }
  return {labels,data};
}

// Data 6 bulan terakhir untuk chart tren
function getLast6MonthsData(transactions) {
  const now=new Date(); const labels=[]; const outData=[]; const inData=[];
  const monthsFull=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  for (let i=5;i>=0;i--) {
    const d=new Date(now.getFullYear(), now.getMonth()-i, 1);
    labels.push(monthsFull[d.getMonth()]);
    const monthTxs=transactions.filter(t=>sameMonth(new Date(t.date),d));
    outData.push(calcTotal(monthTxs,'out'));
    inData.push(calcTotal(monthTxs,'in'));
  }
  return {labels,outData,inData};
}

function pct(part,total) { if(!total||total===0) return 0; return Math.round((part/total)*100); }
function clamp(val,min,max) { return Math.max(min,Math.min(max,val)); }
function genId() { return Date.now()+'_'+Math.random().toString(36).substr(2,9); }

// Chart colors yang responsif terhadap tema
function getChartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    grid:    isDark ? 'rgba(48,54,61,0.5)' : 'rgba(0,0,0,0.07)',
    tick:    isDark ? '#8b949e' : '#57606a',
    tooltip: isDark ? '#1c2128' : '#ffffff',
    border:  isDark ? '#30363d' : '#d0d7de',
    text:    isDark ? '#e6edf3' : '#1f2328',
  };
}

function showToast(message, type='info', duration=3500) {
  const container=document.getElementById('toastContainer'); if(!container) return;
  const toast=document.createElement('div');
  toast.className=`toast toast--${type}`;
  const icon=type==='success'?'✅':type==='error'?'❌':type==='warn'?'⚠️':'ℹ️';
  toast.innerHTML=`<span class="toast__icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(()=>{ toast.style.opacity='0'; toast.style.transform='translateX(20px)'; setTimeout(()=>toast.remove(),300); },duration);
}

function showConfirm(title,bodyHtml,onConfirm,options={}) {
  document.getElementById('confirmDialog')?.remove();
  const {confirmLabel='Ya, Lanjutkan',danger=false}=options;
  const overlay=document.createElement('div');
  overlay.id='confirmDialog'; overlay.className='confirm-overlay';
  overlay.innerHTML=`
    <div class="confirm-box">
      <div class="confirm-title">${title}</div>
      <div class="confirm-body">${bodyHtml}</div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="document.getElementById('confirmDialog').remove()">Batal</button>
        <button class="btn ${danger?'btn-danger':'btn-primary'}" id="confirmOkBtn">${confirmLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('confirmOkBtn').onclick=()=>{ overlay.remove(); onConfirm(); };
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
}