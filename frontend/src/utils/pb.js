// src/utils/pb.js — PocketBase Client

const PB_URL = (window.location.port===''||window.location.port==='443'||window.location.port==='80')
  ? window.location.origin
  : 'http://127.0.0.1:8090';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// ── AUTH ──────────────────────────────────────────────────────────
async function pbRegister(email, password, name, balance, dailyBudget) {
  await pb.collection('users').create({ email, password, passwordConfirm:password, name, balance, daily_budget:dailyBudget });
  return await pb.collection('users').authWithPassword(email, password);
}
async function pbLogin(email, password) {
  const auth = await pb.collection('users').authWithPassword(email, password);
  return auth.record;
}
function pbLogout()      { pb.authStore.clear(); }
function pbCurrentUser() { return pb.authStore.record; }
function pbIsLoggedIn()  { return pb.authStore.isValid; }

// ── PROFIL ────────────────────────────────────────────────────────
async function pbUpdateProfile({ name, balance, daily_budget }) {
  const id = pb.authStore.record?.id;
  if (!id) throw new Error('Tidak terautentikasi');
  const rec = await pb.collection('users').update(id, { name, balance, daily_budget });
  await pb.collection('users').authRefresh();
  return rec;
}

// ── TRANSACTIONS ──────────────────────────────────────────────────
async function pbGetTransactions() {
  const records = await pb.collection('transactions').getFullList({ sort:'-tx_date' });
  return records.map(_pbToLocal);
}
async function pbCreateTransaction(tx) {
  const rec = await pb.collection('transactions').create(_localToPb(tx));
  return _pbToLocal(rec);
}
async function pbUpdateTransaction(pbId, tx) {
  const rec = await pb.collection('transactions').update(pbId, _localToPb(tx));
  return _pbToLocal(rec);
}
async function pbDeleteTransaction(pbId) {
  await pb.collection('transactions').delete(pbId);
}

// ── BUDGETS ───────────────────────────────────────────────────────
async function pbGetBudgets() {
  const records = await pb.collection('budgets').getFullList();
  const result  = {};
  records.forEach(r => { result[r.cat_id] = { amount:r.amount, pbId:r.id }; });
  return result;
}
async function pbUpsertBudget(catId, amount, existingPbId) {
  if (existingPbId) {
    await pb.collection('budgets').update(existingPbId, { amount });
    return existingPbId;
  } else {
    const rec = await pb.collection('budgets').create({ user:pb.authStore.record?.id, cat_id:catId, amount });
    return rec.id;
  }
}

// ── GOALS ─────────────────────────────────────────────────────────
async function pbGetGoals() {
  const records = await pb.collection('goals').getFullList({ sort:'created' });
  return records.map(r => ({
    id:r.id, name:r.name, emoji:r.emoji||'🎯',
    target:r.target, saved:r.saved, deadline:r.deadline||'',
    done:r.done||false, color:r.color||'#00e5a0',
  }));
}
async function pbCreateGoal(goal) {
  const rec = await pb.collection('goals').create({ user:pb.authStore.record?.id, ...goal });
  return { id:rec.id, name:rec.name, emoji:rec.emoji||'🎯', target:rec.target, saved:rec.saved, deadline:rec.deadline||'', done:rec.done||false, color:rec.color||'#00e5a0' };
}
async function pbUpdateGoal(pbId, data) {
  await pb.collection('goals').update(pbId, data);
}
async function pbDeleteGoal(pbId) {
  await pb.collection('goals').delete(pbId);
}

// ── RECURRING ─────────────────────────────────────────────────────
async function pbGetRecurring() {
  const records = await pb.collection('recurring').getFullList({ sort:'next_date' });
  return records.map(r => ({
    id:r.id, name:r.name, amt:r.amt, type:r.type, cat:r.cat||'', src:r.src||'',
    method:r.method||'', freq:r.freq, next_date:r.next_date, active:r.active!==false,
  }));
}
async function pbCreateRecurring(data) {
  const rec = await pb.collection('recurring').create({ user:pb.authStore.record?.id, ...data });
  return rec;
}
async function pbUpdateRecurring(pbId, data) {
  await pb.collection('recurring').update(pbId, data);
}
async function pbDeleteRecurring(pbId) {
  await pb.collection('recurring').delete(pbId);
}

// ── AI ────────────────────────────────────────────────────────────
async function pbAIChat(messages, systemPrompt) {
  const res = await pb.send('/api/ai/chat', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ messages, systemPrompt }),
  });
  if (!res.reply) throw new Error('Tidak ada respons dari AI');
  return res.reply;
}

// ── EXPORT CSV ────────────────────────────────────────────────────
function pbExportCSV(transactions) {
  const headers = ['Tanggal','Tipe','Nominal','Kategori','Catatan','Metode'];
  const rows    = transactions.map(t => [
    new Date(t.date).toLocaleDateString('id-ID'),
    t.type==='in'?'Pemasukan':'Pengeluaran',
    t.amt,
    t.cat?getCatById(t.cat).label:(t.src||'-'),
    t.note||'-', t.method||'-',
  ]);
  return [headers,...rows].map(r=>r.join(',')).join('\n');
}

// ── HELPERS ───────────────────────────────────────────────────────
function _pbToLocal(r) {
  return {
    id:r.id, type:r.type, amt:r.amt,
    note:r.note||'', cat:r.cat||null, src:r.src||null, method:r.method||null,
    date:r.tx_date,
  };
}
function _localToPb(tx) {
  return {
    user:pb.authStore.record?.id, type:tx.type, amt:tx.amt,
    note:tx.note||'', cat:tx.cat||'', src:tx.src||'', method:tx.method||'',
    tx_date:tx.date,
  };
}

// ── GOALS & RECURRING (tersimpan di field JSON di users) ──────────

function pbGetGoals(userRecord) {
  try {
    return JSON.parse(userRecord?.goals_json || '[]');
  } catch { return []; }
}

function pbGetRecurring(userRecord) {
  try {
    return JSON.parse(userRecord?.recurring_json || '[]');
  } catch { return []; }
}