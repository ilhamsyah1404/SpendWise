// src/components/Onboarding.js
// ─────────────────────────────────────────────────────────────────
// Auth Screen — Login & Register via PocketBase
// Menggantikan onboarding localStorage lama
// ─────────────────────────────────────────────────────────────────

function renderOnboarding() {
  document.getElementById('root').innerHTML = `
    <div class="onboarding">
      <div class="onboard-card" style="max-width:420px">

        <div class="onboard-logo-wrap">
          <img src="assets/logo.png" width="52" height="52" alt="SpendWise"
            style="object-fit:contain;border-radius:10px">
          <span class="logo-text" style="font-size:24px">SpendWise</span>
        </div>

        <div class="tab-row" style="margin-bottom:24px">
          <button class="tab-btn active" id="authTabLogin"
            onclick="switchAuthMode('login')">🔑 Masuk</button>
          <button class="tab-btn" id="authTabRegister"
            onclick="switchAuthMode('register')">✨ Daftar</button>
        </div>

        <!-- LOGIN -->
        <div id="authFormLogin">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="auth-email"
              placeholder="email@kamu.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="auth-pass"
              placeholder="••••••••" autocomplete="current-password"
              onkeydown="if(event.key==='Enter') handleAuth()">
          </div>
          <button class="btn btn-primary w-full" id="authBtn"
            style="padding:13px;font-size:15px;justify-content:center"
            onclick="handleAuth()">
            <svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3"/></svg>
            Masuk
          </button>
        </div>

        <!-- REGISTER -->
        <div id="authFormRegister" style="display:none">
          <div class="form-group">
            <label class="form-label">Nama</label>
            <input type="text" class="form-input" id="reg-name"
              placeholder="Nama kamu" maxlength="30">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="reg-email"
              placeholder="email@kamu.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="reg-pass"
              placeholder="Min. 8 karakter" autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label">Saldo Awal (Rp)</label>
            <input type="number" class="form-input" id="reg-balance"
              value="2500000" min="0" style="font-family:var(--mono)">
          </div>
          <div class="form-group">
            <label class="form-label">Budget Harian (Rp)</label>
            <input type="number" class="form-input" id="reg-budget"
              value="150000" min="0" style="font-family:var(--mono)">
          </div>
          <button class="btn btn-primary w-full" id="regBtn"
            style="padding:13px;font-size:15px;justify-content:center"
            onclick="handleRegister()">
            <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6"/></svg>
            Buat Akun
          </button>
        </div>

        <div id="authLoading" style="display:none;text-align:center;padding:16px">
          <div style="display:inline-flex;gap:5px">
            <span style="animation:typingAnim .6s infinite alternate">●</span>
            <span style="animation:typingAnim .6s .15s infinite alternate">●</span>
            <span style="animation:typingAnim .6s .3s infinite alternate">●</span>
          </div>
        </div>

        <div id="authError" style="display:none;margin-top:12px;padding:10px 14px;
          background:rgba(255,95,109,0.1);border:1px solid rgba(255,95,109,0.3);
          border-radius:8px;font-size:13px;color:var(--danger)"></div>

        <p class="text-xs text-muted text-center mt-16">
          ☁️ Data tersimpan aman di PocketBase &nbsp;·&nbsp; 🔒 Auth JWT
        </p>
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('auth-email')?.focus(), 100);
}

function switchAuthMode(mode) {
  document.getElementById('authTabLogin').classList.toggle('active',    mode === 'login');
  document.getElementById('authTabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('authFormLogin').style.display    = mode === 'login'    ? '' : 'none';
  document.getElementById('authFormRegister').style.display = mode === 'register' ? '' : 'none';
  _clearAuthError();
}

function _setAuthLoading(on) {
  document.getElementById('authLoading').style.display = on ? '' : 'none';
  document.querySelectorAll('#authFormLogin .btn-primary, #authFormRegister .btn-primary')
    .forEach(b => b.disabled = on);
}
function _showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.style.display = ''; }
}
function _clearAuthError() {
  const el = document.getElementById('authError');
  if (el) el.style.display = 'none';
}

async function handleAuth() {
  const email = document.getElementById('auth-email')?.value.trim();
  const pass  = document.getElementById('auth-pass')?.value;
  _clearAuthError();
  if (!email || !pass) { _showAuthError('Email dan password wajib diisi.'); return; }
  _setAuthLoading(true);
  try {
    await pbLogin(email, pass);
    await loadAppData();
  } catch (err) {
    _showAuthError(_friendlyPBError(err));
  } finally {
    _setAuthLoading(false);
  }
}

async function handleRegister() {
  const name    = document.getElementById('reg-name')?.value.trim();
  const email   = document.getElementById('reg-email')?.value.trim();
  const pass    = document.getElementById('reg-pass')?.value;
  const balance = parseFloat(document.getElementById('reg-balance')?.value) || 0;
  const budget  = parseFloat(document.getElementById('reg-budget')?.value)  || 150000;
  _clearAuthError();
  if (!name)           { _showAuthError('Nama wajib diisi.'); return; }
  if (!email)          { _showAuthError('Email wajib diisi.'); return; }
  if (pass.length < 8) { _showAuthError('Password min. 8 karakter.'); return; }
  _setAuthLoading(true);
  try {
    await pbRegister(email, pass, name, balance, budget);
    // set default budget untuk user baru
    for (const c of CATEGORIES) {
      try { await pbUpsertBudget(c.id, c.defaultBudget, null); } catch(e) {}
    }
    await loadAppData();
  } catch (err) {
    _showAuthError(_friendlyPBError(err));
  } finally {
    _setAuthLoading(false);
  }
}

function _friendlyPBError(err) {
  const msg = err?.message || err?.data?.message || String(err);
  if (msg.includes('Failed to authenticate'))   return 'Email atau password salah.';
  if (msg.includes('already exists'))           return 'Email sudah terdaftar. Coba login.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return 'Tidak dapat terhubung ke server. Pastikan PocketBase berjalan.';
  if (msg.includes('password'))                 return 'Password min. 8 karakter.';
  return 'Error: ' + msg;
}