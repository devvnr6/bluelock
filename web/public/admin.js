/* ═══════════════════════════════════════════════════════════
   BlueLock Admin Dashboard — Logic
   ═══════════════════════════════════════════════════════════ */

const API = window.location.origin;
let adminToken = localStorage.getItem('bluelock_admin_token');
let currentTab = 'overview';
let keysPage = 1, logsPage = 1, hwidsPage = 1;
let extendingKey = null;
let lastGeneratedKeys = [];

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
async function adminLogin() {
  const pw = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!pw) { showLoginError('Please enter a password'); return; }

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();

    if (!data.success) {
      showLoginError(data.error || 'Invalid password');
      btn.disabled = false;
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Login';
      return;
    }

    adminToken = data.token;
    localStorage.setItem('bluelock_admin_token', adminToken);
    showDashboard();
  } catch (e) {
    showLoginError('Connection failed');
    btn.disabled = false;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Login';
  }
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.classList.remove('hidden');
  document.querySelector('.login-card').style.animation = 'none';
  document.querySelector('.login-card').offsetHeight;
  document.querySelector('.login-card').style.animation = 'shake 0.4s ease';
}

async function adminLogout() {
  try {
    await apiFetch('/api/admin/logout', { method: 'POST' });
  } catch (e) { /* ignore */ }
  adminToken = null;
  localStorage.removeItem('bluelock_admin_token');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  refreshDashboard();
}

// ═══════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════
async function apiFetch(path, options = {}) {
  options.headers = options.headers || {};
  options.headers['x-admin-token'] = adminToken;
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API}${path}`, options);
  if (res.status === 401) {
    adminLogout();
    throw new Error('Session expired');
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-tab]').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'overview') refreshDashboard();
  else if (tab === 'keys') loadKeys();
  else if (tab === 'logs') loadLogs();
  else if (tab === 'hwids') loadHwids();
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════
async function refreshDashboard() {
  try {
    const data = await apiFetch('/api/admin/dashboard');
    if (!data.success) return;
    const s = data.stats;

    document.getElementById('stat-totalKeys').textContent = s.totalKeys;
    document.getElementById('stat-activeKeys').textContent = s.activeKeys;
    document.getElementById('stat-totalHwids').textContent = s.totalHwids;
    document.getElementById('stat-verificationsToday').textContent = s.verificationsToday;

    // Draw hourly chart
    drawHourlyChart(s.hourlyData);

    // Type bars
    const maxType = Math.max(s.typeCounts.daily, s.typeCounts.weekly, s.typeCounts.monthly, s.typeCounts.lifetime, 1);
    document.getElementById('typeBars').innerHTML = ['daily', 'weekly', 'monthly', 'lifetime'].map(t => `
      <div class="type-bar-item">
        <span class="type-bar-label">${t.charAt(0).toUpperCase() + t.slice(1)}</span>
        <div class="type-bar-track"><div class="type-bar-fill ${t}" style="width: ${(s.typeCounts[t] / maxType) * 100}%"></div></div>
        <span class="type-bar-count">${s.typeCounts[t]}</span>
      </div>
    `).join('');

    // Mini stats
    document.getElementById('miniStats').innerHTML = `
      <div class="mini-stat"><span class="mini-stat-value" style="color:var(--accent-emerald)">${s.successfulToday}</span><span class="mini-stat-label">Success</span></div>
      <div class="mini-stat"><span class="mini-stat-value" style="color:var(--accent-red)">${s.failedToday}</span><span class="mini-stat-label">Failed</span></div>
      <div class="mini-stat"><span class="mini-stat-value" style="color:var(--accent-purple)">${s.keysGeneratedToday}</span><span class="mini-stat-label">Keys Today</span></div>
      <div class="mini-stat"><span class="mini-stat-value" style="color:var(--accent-blue)">${s.uniqueHwidsToday}</span><span class="mini-stat-label">Users Today</span></div>
    `;

    // Recent logs
    const logsData = await apiFetch('/api/admin/logs?limit=10');
    renderRecentLogs(logsData.logs || []);

  } catch (e) {
    console.error('Dashboard refresh error:', e);
  }
}

function drawHourlyChart(data) {
  const canvas = document.getElementById('verifyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 180 * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = 180;
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...data, 1);
  const barW = (W - 40) / 24;
  const chartH = H - 40;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 20 + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 10, y); ctx.stroke();
  }

  // Bars
  const currentHour = new Date().getHours();
  for (let i = 0; i < 24; i++) {
    const x = 30 + i * barW + barW * 0.15;
    const bw = barW * 0.7;
    const bh = (data[i] / max) * chartH;
    const y = 20 + chartH - bh;

    const grad = ctx.createLinearGradient(x, y, x, 20 + chartH);
    if (i === currentHour) {
      grad.addColorStop(0, 'rgba(168,85,247,0.8)');
      grad.addColorStop(1, 'rgba(99,102,241,0.3)');
    } else {
      grad.addColorStop(0, 'rgba(168,85,247,0.4)');
      grad.addColorStop(1, 'rgba(99,102,241,0.1)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    const r = 3;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + bw - r, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
    ctx.lineTo(x + bw, 20 + chartH);
    ctx.lineTo(x, 20 + chartH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();

    // Hour label
    if (i % 3 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}:00`, x + bw / 2, H - 4);
    }
  }

  // Y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((max / 4) * (4 - i));
    ctx.fillText(val, 26, 24 + (chartH / 4) * i);
  }
}

function renderRecentLogs(logs) {
  const tbody = document.getElementById('recentLogsBody');
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No verification logs yet</td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${timeAgo(l.timestamp)}</td>
      <td class="key-cell" onclick="copyText('${l.key}')">${l.key}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${truncate(l.hwid, 12)}</td>
      <td>${l.username || '—'}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${l.ip || '—'}</td>
      <td><span class="status-badge ${l.success ? 'success' : 'failed'}">${l.success ? '✓ OK' : '✕ Fail'}</span></td>
    </tr>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
// KEYS TAB
// ═══════════════════════════════════════════════════════════
async function loadKeys() {
  const search = document.getElementById('keySearch').value;
  const status = document.getElementById('keyStatusFilter').value;
  const type = document.getElementById('keyTypeFilter').value;

  try {
    const params = new URLSearchParams({ page: keysPage, limit: 50, status, type });
    if (search) params.set('search', search);

    const data = await apiFetch(`/api/admin/keys?${params}`);
    renderKeysTable(data.keys || []);
    renderPagination('keysPagination', data.page, data.totalPages, data.total, (p) => { keysPage = p; loadKeys(); });
  } catch (e) {
    console.error('Load keys error:', e);
  }
}

function renderKeysTable(keys) {
  const tbody = document.getElementById('keysBody');
  if (!keys.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">No keys found</td></tr>';
    return;
  }
  tbody.innerHTML = keys.map(k => `
    <tr>
      <td class="key-cell" onclick="copyText('${k.key}')" title="Click to copy">${k.key}</td>
      <td><span class="type-badge ${k.type}">${k.typeLabel}</span></td>
      <td><span class="status-badge ${k.status}">${k.status}</span></td>
      <td>${k.currentUses}/${k.maxUses}</td>
      <td>${k.remainingTime}</td>
      <td>${timeAgo(k.createdAt)}</td>
      <td title="${k.boundHwids.join(', ')}" style="font-size:11px">${k.boundHwids.length > 0 ? truncate(k.boundHwids[0], 10) + (k.boundHwids.length > 1 ? ' +' + (k.boundHwids.length - 1) : '') : '—'}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn extend" onclick="showExtendModal('${k.key}')" title="Extend">⏱</button>
          ${k.status === 'revoked'
            ? `<button class="action-btn" onclick="reactivateKey('${k.key}')" title="Reactivate">↩</button>`
            : `<button class="action-btn danger" onclick="revokeKey('${k.key}')" title="Revoke">⊘</button>`
          }
          <button class="action-btn danger" onclick="deleteKey('${k.key}')" title="Delete">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function revokeKey(key) {
  if (!confirm(`Revoke key ${key}?`)) return;
  await apiFetch(`/api/admin/keys/${key}/revoke`, { method: 'POST' });
  showToast('Key revoked');
  loadKeys();
}

async function reactivateKey(key) {
  await apiFetch(`/api/admin/keys/${key}/reactivate`, { method: 'POST' });
  showToast('Key reactivated');
  loadKeys();
}

async function deleteKey(key) {
  if (!confirm(`Permanently delete key ${key}?`)) return;
  await apiFetch(`/api/admin/keys/${key}`, { method: 'DELETE' });
  showToast('Key deleted');
  loadKeys();
}

async function deleteExpiredKeys() {
  if (!confirm('Delete ALL expired keys?')) return;
  const data = await apiFetch('/api/admin/keys/bulk/expired', { method: 'DELETE' });
  showToast(`Deleted ${data.deleted} expired keys`);
  loadKeys();
}

function showExtendModal(key) {
  extendingKey = key;
  document.getElementById('extendKeyDisplay').textContent = key;
  document.getElementById('extendDays').value = 1;
  document.getElementById('extendHours').value = 0;
  document.getElementById('extendModal').classList.remove('hidden');
}

async function extendKey() {
  if (!extendingKey) return;
  const days = parseInt(document.getElementById('extendDays').value) || 0;
  const hours = parseInt(document.getElementById('extendHours').value) || 0;
  await apiFetch(`/api/admin/keys/${extendingKey}/extend`, {
    method: 'POST',
    body: { days, hours },
  });
  closeModal('extendModal');
  showToast('Key extended');
  loadKeys();
}

// ─── Generate Keys ───────────────────────────────────────
function showGenerateModal() {
  document.getElementById('generatedKeysOutput').classList.add('hidden');
  document.getElementById('generateModal').classList.remove('hidden');
}

function setQty(n) {
  document.getElementById('genCount').value = n;
}

async function generateKeys() {
  const type = document.getElementById('genType').value;
  const maxUses = parseInt(document.getElementById('genMaxUses').value) || 1;
  const count = parseInt(document.getElementById('genCount').value) || 1;
  const notes = document.getElementById('genNotes').value;

  try {
    const data = await apiFetch('/api/admin/keys/generate', {
      method: 'POST',
      body: { type, maxUses, count, notes },
    });

    if (!data.success) {
      showToast(data.error || 'Generation failed');
      return;
    }

    lastGeneratedKeys = data.generated;
    const listEl = document.getElementById('generatedList');
    listEl.innerHTML = data.generated.map(k => `
      <div class="gen-key" onclick="copyText('${k.key}')">
        ${k.key}
        <span>${k.type} • ${k.expiresIn} • ${k.maxUses} use${k.maxUses > 1 ? 's' : ''}</span>
      </div>
    `).join('');
    document.getElementById('generatedKeysOutput').classList.remove('hidden');
    showToast(`Generated ${data.count} key(s)`);
    if (currentTab === 'keys') loadKeys();

  } catch (e) {
    showToast('Generation failed');
  }
}

function copyGeneratedKeys() {
  const text = lastGeneratedKeys.map(k => k.key).join('\n');
  navigator.clipboard.writeText(text).then(() => showToast('All keys copied!'));
}

// ═══════════════════════════════════════════════════════════
// LOGS TAB
// ═══════════════════════════════════════════════════════════
async function loadLogs() {
  const search = document.getElementById('logSearch').value;
  const success = document.getElementById('logSuccessFilter').value;

  try {
    const params = new URLSearchParams({ page: logsPage, limit: 50, success });
    if (search) params.set('search', search);

    const data = await apiFetch(`/api/admin/logs?${params}`);
    renderLogsTable(data.logs || []);
    renderPagination('logsPagination', data.page, data.totalPages, data.total, (p) => { logsPage = p; loadLogs(); });
  } catch (e) {
    console.error('Load logs error:', e);
  }
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logsBody');
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted)">No logs found</td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${formatDate(l.timestamp)}</td>
      <td class="key-cell" onclick="copyText('${l.key}')">${l.key}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px" title="${l.hwid}">${truncate(l.hwid, 14)}</td>
      <td>${l.username || '—'}</td>
      <td>${l.executor || '—'}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${l.ip || '—'}</td>
      <td><span class="status-badge ${l.success ? 'success' : 'failed'}">${l.success ? '✓ OK' : '✕ Fail'}</span></td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis" title="${l.reason}">${l.reason}</td>
    </tr>
  `).join('');
}

async function clearLogs() {
  if (!confirm('Clear ALL verification logs? This cannot be undone.')) return;
  const data = await apiFetch('/api/admin/logs', { method: 'DELETE' });
  showToast(`Cleared ${data.cleared} logs`);
  loadLogs();
}

// ═══════════════════════════════════════════════════════════
// HWIDS TAB
// ═══════════════════════════════════════════════════════════
async function loadHwids() {
  const search = document.getElementById('hwidSearch').value;
  const blacklisted = document.getElementById('hwidBlacklistFilter').value;

  try {
    const params = new URLSearchParams({ page: hwidsPage, limit: 50, blacklisted });
    if (search) params.set('search', search);

    const data = await apiFetch(`/api/admin/hwids?${params}`);
    renderHwidsTable(data.hwids || []);
    renderPagination('hwidsPagination', data.page, data.totalPages, data.total, (p) => { hwidsPage = p; loadHwids(); });
  } catch (e) {
    console.error('Load HWIDs error:', e);
  }
}

function renderHwidsTable(hwids) {
  const tbody = document.getElementById('hwidsBody');
  if (!hwids.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">No HWIDs tracked yet</td></tr>';
    return;
  }
  tbody.innerHTML = hwids.map(h => `
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer" onclick="copyText('${h.hwid}')" title="${h.hwid}">${truncate(h.hwid, 16)}</td>
      <td>${h.username || '—'}</td>
      <td>${h.executor || '—'}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px" title="${h.ips.join(', ')}">${h.ips.length > 0 ? truncate(h.ips[h.ips.length - 1], 14) + (h.ips.length > 1 ? ' +' + (h.ips.length - 1) : '') : '—'}</td>
      <td>${h.keys.length}</td>
      <td>${h.totalVerifications}</td>
      <td>${timeAgo(h.lastSeen)}</td>
      <td><span class="status-badge ${h.blacklisted ? 'blacklisted' : 'active'}">${h.blacklisted ? '🚫 Banned' : '✓ Active'}</span></td>
      <td>
        <div class="action-btns">
          ${h.blacklisted
            ? `<button class="action-btn extend" onclick="unblacklistHwid('${h.hwid}')" title="Unblacklist">✓</button>`
            : `<button class="action-btn danger" onclick="blacklistHwidDirect('${h.hwid}')" title="Blacklist">🚫</button>`
          }
        </div>
      </td>
    </tr>
  `).join('');
}

function showBlacklistModal() {
  document.getElementById('blacklistHwid').value = '';
  document.getElementById('blacklistModal').classList.remove('hidden');
}

async function blacklistHwid() {
  const hwid = document.getElementById('blacklistHwid').value.trim();
  if (!hwid) { showToast('Enter a HWID'); return; }
  await apiFetch('/api/admin/hwids/blacklist', { method: 'POST', body: { hwid } });
  closeModal('blacklistModal');
  showToast('HWID blacklisted');
  loadHwids();
}

async function blacklistHwidDirect(hwid) {
  if (!confirm(`Blacklist HWID ${truncate(hwid, 20)}?`)) return;
  await apiFetch('/api/admin/hwids/blacklist', { method: 'POST', body: { hwid } });
  showToast('HWID blacklisted');
  loadHwids();
}

async function unblacklistHwid(hwid) {
  await apiFetch(`/api/admin/hwids/blacklist/${hwid}`, { method: 'DELETE' });
  showToast('HWID unblacklisted');
  loadHwids();
}

// ═══════════════════════════════════════════════════════════
// MODALS & UTILS
// ═══════════════════════════════════════════════════════════
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Login on Enter
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !document.getElementById('loginOverlay').classList.contains('hidden')) {
    adminLogin();
  }
});

function renderPagination(containerId, currentPage, totalPages, total, onPage) {
  const container = document.getElementById(containerId);
  if (totalPages <= 1) { container.innerHTML = `<span class="page-info">${total} total</span>`; return; }

  let html = `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="void(0)">‹</button>`;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) html += `<button class="page-btn" onclick="void(0)">1</button>`;
  if (start > 2) html += `<span class="page-info">...</span>`;

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="void(0)">${i}</button>`;
  }

  if (end < totalPages - 1) html += `<span class="page-info">...</span>`;
  if (end < totalPages) html += `<button class="page-btn" onclick="void(0)">${totalPages}</button>`;

  html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="void(0)">›</button>`;
  html += `<span class="page-info">${total} total</span>`;
  container.innerHTML = html;

  // Attach click handlers
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.trim();
      if (text === '‹') onPage(currentPage - 1);
      else if (text === '›') onPage(currentPage + 1);
      else {
        const p = parseInt(text);
        if (!isNaN(p)) onPage(p);
      }
    });
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
}

function truncate(str, len) {
  if (!str) return '—';
  return str.length > len ? str.substr(0, len) + '…' : str;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// @keyframes shake for login
const style = document.createElement('style');
style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-4px)} 20%,40%,60%,80%{transform:translateX(4px)} }`;
document.head.appendChild(style);

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    // Verify token is still valid
    apiFetch('/api/admin/dashboard').then(data => {
      if (data.success) showDashboard();
      else adminLogout();
    }).catch(() => adminLogout());
  }
});
