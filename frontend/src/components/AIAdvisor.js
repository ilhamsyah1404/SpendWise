// src/components/AIAdvisor.js
// ─────────────────────────────────────────────
// AI Advisor: Chat UI + Claude API integration
// Fitur: multi-turn, context-aware, offline fallback
// ─────────────────────────────────────────────

let _aiLoading = false;

const AI_SUGGESTION_CHIPS = [
  { label: '📊 Analisa bulan ini',       msg: 'Analisa pengeluaran bulan ini' },
  { label: '💡 Tips hemat',              msg: 'Berikan tips hemat untuk saya' },
  { label: '🔍 Kategori terboros',       msg: 'Kategori mana yang paling boros?' },
  { label: '📈 Rata-rata harian',        msg: 'Berapa rata-rata pengeluaran harian saya?' },
  { label: '💰 Status saldo',            msg: 'Bagaimana status saldo saya?' },
  { label: '📅 vs Bulan lalu',           msg: 'Bandingkan dengan bulan lalu' },
  { label: '🎯 Status budget',           msg: 'Bagaimana status budget saya?' },
  { label: '📈 Saran investasi',         msg: 'Berikan saran investasi untuk saya' },
];

function initAIAdvisor() {
  // Reset conversation on page init (optional)
  // aiEngine.resetHistory();
}

async function sendAIMessage(presetMsg) {
  if (_aiLoading) return;

  const input = document.getElementById('aiInput');
  const msg   = presetMsg || input?.value?.trim();
  if (!msg) return;
  if (input) input.value = '';

  // Append user message
  _appendMessage('user', msg);

  // Show typing
  _appendTyping();
  _aiLoading = true;

  try {
    const { reply, source, error } = await aiEngine.sendMessage(msg, appState);

    _removeTyping();

    if (error) {
      // Show small notice that it's offline
      _appendMessage('ai', reply, 'offline');
    } else {
      _appendMessage('ai', reply, source);
    }
  } catch (err) {
    _removeTyping();
    _appendMessage('ai',
      `⚠️ Terjadi error: ${err.message}\n\nCoba lagi atau restart percakapan.`,
      'error'
    );
  }

  _aiLoading = false;
}

function _appendMessage(role, text, source) {
  const container = document.getElementById('aiMessages');
  if (!container) return;

  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div  = document.createElement('div');
  div.className = `msg ${role}`;

  // Convert **bold** markdown and newlines
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const sourceNote = source === 'offline'
    ? '<div class="msg-source">📵 Offline mode (API tidak tersedia)</div>'
    : source === 'api'
    ? '<div class="msg-source" style="color:var(--accent)">⚡ Claude AI</div>'
    : '';

  div.innerHTML = `
    <div class="msg-ava">${role === 'ai' ? '🤖' : appState.user.name[0].toUpperCase()}</div>
    <div class="msg-inner">
      <div class="msg-bubble">${formatted}</div>
      <div class="msg-time">${role === 'ai' ? 'SpendWise AI' : appState.user.name} · ${time}</div>
      ${role === 'ai' ? sourceNote : ''}
    </div>`;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function _appendTyping() {
  const container = document.getElementById('aiMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'aiTypingIndicator';
  div.innerHTML = `
    <div class="msg-ava">🤖</div>
    <div class="msg-inner">
      <div class="msg-bubble">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    </div>`;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function _removeTyping() {
  document.getElementById('aiTypingIndicator')?.remove();
}

function clearAIChat() {
  aiEngine.resetHistory();
  const container = document.getElementById('aiMessages');
  if (!container) return;
  container.innerHTML = '';
  _appendMessage('ai',
    `Chat direset! 🔄 Halo lagi **${appState.user.name}**! Saya siap membantu analisis keuanganmu. Ada yang bisa saya bantu?`
  );
}