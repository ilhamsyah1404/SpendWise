// src/utils/aiEngine.js
// ─────────────────────────────────────────────────────────────────
// AIEngine — SpendWise AI via PocketBase Custom Route
//
// Arsitektur (baru):
//   Frontend → PocketBase /api/ai/chat → OpenRouter → AI Model Gratis
//
// ✅ API key tersimpan sebagai env var di PocketBase server (aman)
// ✅ Hanya user yang terautentikasi bisa pakai AI
// ✅ Multi-turn conversation history
// ✅ Context-aware: data keuangan user real-time
// ✅ Offline fallback cerdas
// ─────────────────────────────────────────────────────────────────

class AIEngine {
  constructor() {
    this.conversationHistory = [];
    this.maxHistory = 10;
  }

  buildContext(appState) {
    const now = new Date();
    const monthTxs = appState.transactions.filter(t => sameMonth(new Date(t.date), now));
    const weekTxs  = appState.transactions.filter(t => {
      const d = new Date(t.date), weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
    const todayTxs = appState.transactions.filter(t => sameDay(new Date(t.date), now));

    const monthOut = calcTotal(monthTxs, 'out');
    const monthIn  = calcTotal(monthTxs, 'in');
    const weekOut  = calcTotal(weekTxs,  'out');
    const todayOut = calcTotal(todayTxs, 'out');
    const net      = monthIn - monthOut;
    const savRate  = monthIn > 0 ? Math.round((net / monthIn) * 100) : 0;
    const dailyAvg = Math.round(monthOut / Math.max(1, now.getDate()));

    const catTotals  = calcByCategory(monthTxs);
    const catSummary = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, amt]) => {
        const c = getCatById(id);
        const b = appState.budgets?.[id]?.amount || c.defaultBudget;
        return `  • ${c.label}: Rp ${fmt(amt)} (${pct(amt, b)}% dari budget Rp ${fmt(b)})`;
      }).join('\n');

    const budgetOver = Object.entries(appState.budgets || {})
      .filter(([id, v]) => {
        const spent = calcTotal(monthTxs.filter(t => t.cat === id), 'out');
        return spent > (v?.amount ?? getCatById(id).defaultBudget);
      })
      .map(([id]) => getCatById(id).label).join(', ');

    return `Kamu adalah asisten keuangan AI untuk aplikasi SpendWise.
Jawab dalam Bahasa Indonesia, singkat, dan gunakan format yang mudah dibaca.

=== DATA KEUANGAN ${appState.user.name.toUpperCase()} ===
Saldo saat ini    : Rp ${fmt(appState.user.balance)}
Budget harian     : Rp ${fmt(appState.user.dailyBudget)}

Hari ini          : Rp ${fmt(todayOut)} pengeluaran
7 hari terakhir   : Rp ${fmt(weekOut)}
Bulan ini keluar  : Rp ${fmt(monthOut)}
Bulan ini masuk   : Rp ${fmt(monthIn)}
Net cashflow      : Rp ${fmt(net)} (${net >= 0 ? 'SURPLUS' : 'DEFISIT'})
Saving rate       : ${savRate}%
Rata-rata/hari    : Rp ${fmt(dailyAvg)}

Top pengeluaran (bulan ini):
${catSummary || '  Belum ada'}
${budgetOver ? `\n⚠️  Kategori over budget: ${budgetOver}` : ''}
================================`;
  }

  async sendToAPI(userMessage, appState) {
    // Trim history
    if (this.conversationHistory.length > this.maxHistory * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistory * 2);
    }
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const systemPrompt = this.buildContext(appState);
    // Panggil PocketBase custom route (pb.js → pbAIChat)
    const reply = await pbAIChat(this.conversationHistory, systemPrompt);
    this.conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
  }

  // ── OFFLINE FALLBACK ───────────────────────────────────────────
  offlineReply(userMessage, appState) {
    const msg  = userMessage.toLowerCase();
    const now  = new Date();
    const name = appState.user.name;

    const monthTxs = appState.transactions.filter(t => sameMonth(new Date(t.date), now));
    const todayTxs = appState.transactions.filter(t => sameDay(new Date(t.date), now));
    const monthOut = calcTotal(monthTxs, 'out');
    const monthIn  = calcTotal(monthTxs, 'in');
    const todayOut = calcTotal(todayTxs, 'out');
    const net      = monthIn - monthOut;
    const dailyAvg = Math.round(monthOut / Math.max(1, now.getDate()));
    const catTotals = calcByCategory(monthTxs);
    const topCats   = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    const _m = (keys) => keys.some(k => msg.includes(k));

    if (_m(['analisa', 'analisis', 'ringkasan', 'summary', 'rekap', 'bulan ini'])) {
      return `📊 **Ringkasan Bulan Ini, ${name}:**\n\n` +
        `💸 Pengeluaran: **Rp ${fmt(monthOut)}**\n` +
        `💰 Pemasukan: **Rp ${fmt(monthIn)}**\n` +
        `${net >= 0 ? '✅ Surplus' : '⚠️ Defisit'}: **Rp ${fmt(Math.abs(net))}**\n` +
        `📈 Rata-rata: **Rp ${fmt(dailyAvg)}/hari**\n\n` +
        (topCats[0] ? `🔥 Terboros: **${getCatById(topCats[0][0]).label}** (Rp ${fmt(topCats[0][1])})` : '');
    }

    if (_m(['tips', 'hemat', 'saran', 'cara'])) {
      return `💡 **Tips Hemat untuk ${name}:**\n\n` +
        `1. 🍱 Masak sendiri — hemat 40-60%\n2. 🚌 Transportasi umum\n3. ☕ Kurangi kopi kekinian\n4. 📱 Audit langganan digital\n5. 💰 Aturan 50/30/20: kebutuhan/keinginan/tabungan`;
    }

    if (_m(['kategori', 'boros', 'terbesar'])) {
      if (!topCats.length) return `Belum ada pengeluaran bulan ini, ${name}!`;
      const list = topCats.slice(0, 5).map((c, i) => {
        const cat = getCatById(c[0]);
        return `${i + 1}. ${cat.emoji} **${cat.label}**: Rp ${fmt(c[1])}`;
      }).join('\n');
      return `🔍 **Ranking Pengeluaran:**\n\n${list}`;
    }

    if (_m(['saldo', 'uang', 'balance'])) {
      const daysLeft = Math.round(appState.user.balance / Math.max(1, dailyAvg));
      return `💰 **Saldo ${name}:** Rp ${fmt(appState.user.balance)}\nEstimasi cukup: **${daysLeft} hari**`;
    }

    if (_m(['investasi', 'nabung', 'tabungan', 'reksadana'])) {
      return `📈 **Saran Investasi:**\n\n` +
        `1. 🏦 Dana darurat 3-6 bulan dulu\n2. 💰 Reksa Dana Pasar Uang (~6%/thn)\n3. 💎 Emas digital (mulai Rp 5.000)\n4. 📊 Obligasi (~7-9%/thn)`;
    }

    if (_m(['bulan lalu', 'bandingkan', 'dibanding'])) {
      const prev = new Date(now); prev.setMonth(prev.getMonth() - 1);
      const prevOut = calcTotal(appState.transactions.filter(t => sameMonth(new Date(t.date), prev)), 'out');
      if (!prevOut) return `Belum ada data bulan lalu, ${name}.`;
      const diff = monthOut - prevOut;
      return `📊 **Perbandingan:** Bulan lalu Rp ${fmt(prevOut)} → Bulan ini Rp ${fmt(monthOut)}\n${diff <= 0 ? `✅ Hemat ${fmt(Math.abs(diff))}!` : `⚠️ Lebih boros Rp ${fmt(diff)}`}`;
    }

    return `🤖 Halo **${name}**! Coba tanya:\n• "Analisa bulan ini"\n• "Tips hemat"\n• "Kategori terboros"\n• "Status saldo"\n• "Saran investasi"`;
  }

  async sendMessage(userMessage, appState) {
    try {
      const reply = await this.sendToAPI(userMessage, appState);
      return { reply, source: 'api' };
    } catch (err) {
      console.warn('[AIEngine] API fallback:', err.message);
      const reply = this.offlineReply(userMessage, appState);
      return { reply, source: 'offline', error: err.message };
    }
  }

  resetHistory() { this.conversationHistory = []; }
}

const aiEngine = new AIEngine();