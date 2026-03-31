const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════
// Rate Limiters
// ═══════════════════════════════════════════════════════════
const rateLimiter = new RateLimiterMemory({ points: 10, duration: 60 });
const keyGenLimiter = new RateLimiterMemory({ points: 3, duration: 300 });
const adminLoginLimiter = new RateLimiterMemory({ points: 5, duration: 300 });

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bluelock_admin_2026';
const API_SECRET = process.env.API_SECRET || crypto.randomBytes(32).toString('hex');

const KEY_TYPES = {
  daily:    { label: 'Daily',    durationMs: 24 * 60 * 60 * 1000 },
  weekly:   { label: 'Weekly',   durationMs: 7 * 24 * 60 * 60 * 1000 },
  monthly:  { label: 'Monthly',  durationMs: 30 * 24 * 60 * 60 * 1000 },
  lifetime: { label: 'Lifetime', durationMs: null },
};

const KEY_PREFIX = 'BLUE';

// ═══════════════════════════════════════════════════════════
// Data Stores (In-Memory + File Backup)
// ═══════════════════════════════════════════════════════════
let keyStore = new Map();         // key -> keyEntry
let verifyLogs = [];              // array of log entries
let hwidStore = new Map();        // hwid -> { firstSeen, lastSeen, keys, ips, username, executor, blacklisted }
let adminSessions = new Map();    // token -> { createdAt, expiresAt }
let analytics = {
  verificationsToday: 0,
  keysGeneratedToday: 0,
  lastResetDate: new Date().toDateString(),
};

const DATA_FILE = path.join(__dirname, 'bluelock_data.json');

// ─── Persistence ─────────────────────────────────────────
function saveData() {
  try {
    const data = {
      keys: Array.from(keyStore.entries()),
      logs: verifyLogs.slice(-2000), // keep last 2000 logs
      hwids: Array.from(hwidStore.entries()),
      analytics,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[SAVE] Failed to save data:', e.message);
  }
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.keys) keyStore = new Map(data.keys);
      if (data.logs) verifyLogs = data.logs;
      if (data.hwids) hwidStore = new Map(data.hwids);
      if (data.analytics) analytics = data.analytics;
      console.log(`[LOAD] Restored ${keyStore.size} keys, ${verifyLogs.length} logs, ${hwidStore.size} HWIDs`);
    }
  } catch (e) {
    console.error('[LOAD] Failed to load data:', e.message);
  }
}

loadData();

// Auto-save every 5 minutes
setInterval(saveData, 5 * 60 * 1000);

// ─── Analytics daily reset ───────────────────────────────
function checkAnalyticsReset() {
  const today = new Date().toDateString();
  if (analytics.lastResetDate !== today) {
    analytics.verificationsToday = 0;
    analytics.keysGeneratedToday = 0;
    analytics.lastResetDate = today;
  }
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════
function generateKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(3).toString('hex').toUpperCase());
  }
  return `${KEY_PREFIX}-${segments.join('-')}`;
}

function createKeyEntry(options = {}) {
  const type = options.type || 'daily';
  const typeInfo = KEY_TYPES[type] || KEY_TYPES.daily;
  const key = generateKey();
  const now = Date.now();

  return {
    key,
    type,
    typeLabel: typeInfo.label,
    createdAt: now,
    expiresAt: typeInfo.durationMs ? now + typeInfo.durationMs : null,
    maxUses: options.maxUses || 1,
    currentUses: 0,
    hwid: null,
    boundHwids: [],
    ips: [],
    valid: true,
    notes: options.notes || '',
    createdBy: options.createdBy || 'user',
  };
}

function isKeyValid(entry) {
  if (!entry) return { valid: false, reason: 'Key not found' };
  if (!entry.valid) return { valid: false, reason: 'Key has been revoked' };
  if (entry.expiresAt && Date.now() > entry.expiresAt) return { valid: false, reason: 'Key has expired' };
  if (entry.currentUses >= entry.maxUses) return { valid: false, reason: 'Key usage limit reached' };
  return { valid: true };
}

function getKeyStatus(entry) {
  if (!entry.valid) return 'revoked';
  if (entry.expiresAt && Date.now() > entry.expiresAt) return 'expired';
  if (entry.currentUses >= entry.maxUses) return 'used';
  return 'active';
}

function signResponse(data) {
  const hmac = crypto.createHmac('sha256', API_SECRET);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

function generateAdminToken() {
  return crypto.randomBytes(48).toString('hex');
}

function isAdminAuthenticated(req) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

function adminAuth(req, res, next) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

function getTimeRemaining(expiresAt) {
  if (!expiresAt) return 'Lifetime';
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Cleanup expired keys (keep them but mark) ───────────
setInterval(() => {
  const now = Date.now();
  for (const [, entry] of keyStore) {
    // Auto-cleanup keys expired more than 7 days ago
    if (entry.expiresAt && now > entry.expiresAt + 7 * 24 * 60 * 60 * 1000) {
      // Don't delete, just keep for logs
    }
  }
  // Clean up expired admin sessions
  for (const [token, session] of adminSessions) {
    if (now > session.expiresAt) adminSessions.delete(token);
  }
}, 3600000);


// ═══════════════════════════════════════════════════════════
// PUBLIC API ROUTES
// ═══════════════════════════════════════════════════════════

// ─── Generate Key (public) ───────────────────────────────
app.post('/api/key/generate', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;

  try {
    await keyGenLimiter.consume(ip);
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Too many key generation requests. Wait 5 minutes.',
    });
  }

  checkAnalyticsReset();

  const type = req.body.type || 'daily';
  if (!KEY_TYPES[type]) {
    return res.status(400).json({ success: false, error: 'Invalid key type' });
  }

  const entry = createKeyEntry({ type, maxUses: 1, createdBy: 'website' });
  keyStore.set(entry.key, entry);
  analytics.keysGeneratedToday++;

  console.log(`[KEY GEN] ${entry.key} | Type: ${entry.typeLabel} | Expires: ${entry.expiresAt ? new Date(entry.expiresAt).toISOString() : 'Never'}`);

  res.json({
    success: true,
    key: entry.key,
    type: entry.type,
    typeLabel: entry.typeLabel,
    expiresAt: entry.expiresAt,
    expiresIn: getTimeRemaining(entry.expiresAt),
    maxUses: entry.maxUses,
  });
});

// ─── Verify Key ──────────────────────────────────────────
app.post('/api/key/verify', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;

  try {
    await rateLimiter.consume(ip);
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Rate limited. Try again later.',
      signature: null,
    });
  }

  checkAnalyticsReset();

  const { key, hwid, sessionId, timestamp, executor, username, userId } = req.body;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request format',
      signature: null,
    });
  }

  const trimmedKey = key.trim().toUpperCase();
  const entry = keyStore.get(trimmedKey);
  const validation = isKeyValid(entry);

  // Check if HWID is blacklisted
  if (hwid) {
    const hwidEntry = hwidStore.get(hwid);
    if (hwidEntry && hwidEntry.blacklisted) {
      const logEntry = {
        timestamp: Date.now(),
        key: trimmedKey,
        hwid: hwid || 'unknown',
        ip,
        executor: executor || 'unknown',
        username: username || 'unknown',
        userId: userId || 'unknown',
        success: false,
        reason: 'HWID blacklisted',
      };
      verifyLogs.push(logEntry);
      analytics.verificationsToday++;

      console.log(`[VERIFY BLOCKED] ${trimmedKey} | HWID ${hwid} is blacklisted`);
      return res.json({
        success: false,
        error: 'Access denied',
        signature: null,
      });
    }
  }

  // Log the verification attempt
  const logEntry = {
    timestamp: Date.now(),
    key: trimmedKey,
    hwid: hwid || 'unknown',
    ip,
    executor: executor || 'unknown',
    username: username || 'unknown',
    userId: userId || 'unknown',
    success: validation.valid,
    reason: validation.valid ? 'OK' : validation.reason,
  };
  verifyLogs.push(logEntry);
  analytics.verificationsToday++;

  // Keep logs manageable
  if (verifyLogs.length > 5000) {
    verifyLogs = verifyLogs.slice(-3000);
  }

  if (!validation.valid) {
    console.log(`[VERIFY FAIL] ${trimmedKey} | Reason: ${validation.reason} | HWID: ${hwid || 'none'} | IP: ${ip}`);
    return res.json({
      success: false,
      error: validation.reason,
      signature: null,
    });
  }

  // Check HWID binding
  if (hwid && entry.boundHwids.length > 0 && !entry.boundHwids.includes(hwid)) {
    console.log(`[VERIFY FAIL] ${trimmedKey} | HWID mismatch | Expected: ${entry.boundHwids.join(',')} | Got: ${hwid}`);
    return res.json({
      success: false,
      error: 'Key is bound to a different device',
      signature: null,
    });
  }

  // Consume a use
  entry.currentUses++;

  // Bind HWID
  if (hwid && !entry.boundHwids.includes(hwid)) {
    entry.boundHwids.push(hwid);
  }

  // Track IP
  if (ip && !entry.ips.includes(ip)) {
    entry.ips.push(ip);
  }

  // Update HWID store
  if (hwid) {
    let hwidData = hwidStore.get(hwid);
    if (!hwidData) {
      hwidData = {
        hwid,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        keys: [],
        ips: [],
        username: username || 'unknown',
        executor: executor || 'unknown',
        userId: userId || 'unknown',
        totalVerifications: 0,
        blacklisted: false,
      };
      hwidStore.set(hwid, hwidData);
    }
    hwidData.lastSeen = Date.now();
    hwidData.totalVerifications++;
    if (username) hwidData.username = username;
    if (executor) hwidData.executor = executor;
    if (userId) hwidData.userId = userId;
    if (!hwidData.keys.includes(trimmedKey)) hwidData.keys.push(trimmedKey);
    if (ip && !hwidData.ips.includes(ip)) hwidData.ips.push(ip);
  }

  const responseData = {
    success: true,
    message: 'Key verified successfully',
    keyType: entry.type,
    keyTypeLabel: entry.typeLabel,
    expiresAt: entry.expiresAt,
    remainingTime: getTimeRemaining(entry.expiresAt),
    remainingUses: entry.maxUses - entry.currentUses,
    timestamp: Date.now(),
  };

  responseData.signature = signResponse({
    success: true,
    timestamp: responseData.timestamp,
  });

  console.log(`[VERIFY OK] ${trimmedKey} | Type: ${entry.typeLabel} | Uses: ${entry.currentUses}/${entry.maxUses} | HWID: ${hwid || 'none'} | User: ${username || 'unknown'}`);

  res.json(responseData);
});

// ─── Health ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Public Stats ────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  checkAnalyticsReset();
  let active = 0, expired = 0, used = 0, revoked = 0;
  for (const [, entry] of keyStore) {
    const status = getKeyStatus(entry);
    if (status === 'active') active++;
    else if (status === 'expired') expired++;
    else if (status === 'used') used++;
    else if (status === 'revoked') revoked++;
  }
  res.json({ total: keyStore.size, active, expired, used, revoked });
});


// ═══════════════════════════════════════════════════════════
// ADMIN API ROUTES
// ═══════════════════════════════════════════════════════════

// ─── Admin Login ─────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;

  try {
    await adminLoginLimiter.consume(ip);
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Too many login attempts. Wait 5 minutes.',
    });
  }

  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    console.log(`[ADMIN] Failed login from ${ip}`);
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  const token = generateAdminToken();
  adminSessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
    ip,
  });

  console.log(`[ADMIN] Login from ${ip}`);
  res.json({ success: true, token, expiresIn: '12 hours' });
});

// ─── Admin Logout ────────────────────────────────────────
app.post('/api/admin/logout', adminAuth, (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  adminSessions.delete(token);
  res.json({ success: true });
});

// ─── Admin Dashboard Stats ──────────────────────────────
app.get('/api/admin/dashboard', adminAuth, (req, res) => {
  checkAnalyticsReset();

  let active = 0, expired = 0, used = 0, revoked = 0, lifetime = 0;
  const typeCounts = { daily: 0, weekly: 0, monthly: 0, lifetime: 0 };

  for (const [, entry] of keyStore) {
    const status = getKeyStatus(entry);
    if (status === 'active') active++;
    else if (status === 'expired') expired++;
    else if (status === 'used') used++;
    else if (status === 'revoked') revoked++;
    if (entry.type === 'lifetime') lifetime++;
    if (typeCounts[entry.type] !== undefined) typeCounts[entry.type]++;
  }

  // Recent verifications (last 24h)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentLogs = verifyLogs.filter(l => l.timestamp > oneDayAgo);
  const successfulRecent = recentLogs.filter(l => l.success).length;
  const failedRecent = recentLogs.filter(l => !l.success).length;

  // Unique HWIDs today
  const uniqueHwidsToday = new Set(recentLogs.map(l => l.hwid).filter(h => h !== 'unknown')).size;

  // Verification hourly data (last 24h)
  const hourlyData = Array(24).fill(0);
  for (const log of recentLogs) {
    const hour = new Date(log.timestamp).getHours();
    hourlyData[hour]++;
  }

  res.json({
    success: true,
    stats: {
      totalKeys: keyStore.size,
      activeKeys: active,
      expiredKeys: expired,
      usedKeys: used,
      revokedKeys: revoked,
      lifetimeKeys: lifetime,
      typeCounts,
      totalHwids: hwidStore.size,
      blacklistedHwids: Array.from(hwidStore.values()).filter(h => h.blacklisted).length,
      totalLogs: verifyLogs.length,
      verificationsToday: analytics.verificationsToday,
      keysGeneratedToday: analytics.keysGeneratedToday,
      successfulToday: successfulRecent,
      failedToday: failedRecent,
      uniqueHwidsToday,
      uptime: process.uptime(),
      hourlyData,
    },
  });
});

// ─── List All Keys ──────────────────────────────────────
app.get('/api/admin/keys', adminAuth, (req, res) => {
  const { status, type, search, sort, order, page, limit } = req.query;

  let keys = Array.from(keyStore.values()).map(entry => ({
    ...entry,
    status: getKeyStatus(entry),
    remainingTime: getTimeRemaining(entry.expiresAt),
    remainingUses: entry.maxUses - entry.currentUses,
  }));

  // Filter by status
  if (status && status !== 'all') {
    keys = keys.filter(k => k.status === status);
  }

  // Filter by type
  if (type && type !== 'all') {
    keys = keys.filter(k => k.type === type);
  }

  // Search
  if (search) {
    const s = search.toLowerCase();
    keys = keys.filter(k =>
      k.key.toLowerCase().includes(s) ||
      (k.notes && k.notes.toLowerCase().includes(s)) ||
      k.boundHwids.some(h => h.includes(s))
    );
  }

  // Sort
  const sortField = sort || 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;
  keys.sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1 * sortOrder;
    if (a[sortField] > b[sortField]) return 1 * sortOrder;
    return 0;
  });

  // Pagination
  const p = parseInt(page) || 1;
  const l = Math.min(parseInt(limit) || 50, 200);
  const total = keys.length;
  const totalPages = Math.ceil(total / l);
  keys = keys.slice((p - 1) * l, p * l);

  res.json({ success: true, keys, total, page: p, totalPages, limit: l });
});

// ─── Generate Keys (admin — supports bulk) ──────────────
app.post('/api/admin/keys/generate', adminAuth, (req, res) => {
  checkAnalyticsReset();

  const { type, maxUses, count, notes } = req.body;
  const keyType = type || 'daily';
  const keyMaxUses = parseInt(maxUses) || 1;
  const keyCount = Math.min(parseInt(count) || 1, 100);

  if (!KEY_TYPES[keyType]) {
    return res.status(400).json({ success: false, error: 'Invalid key type' });
  }

  const generated = [];
  for (let i = 0; i < keyCount; i++) {
    const entry = createKeyEntry({
      type: keyType,
      maxUses: keyMaxUses,
      notes: notes || '',
      createdBy: 'admin',
    });
    keyStore.set(entry.key, entry);
    generated.push({
      key: entry.key,
      type: entry.typeLabel,
      expiresIn: getTimeRemaining(entry.expiresAt),
      maxUses: entry.maxUses,
    });
    analytics.keysGeneratedToday++;
  }

  console.log(`[ADMIN] Generated ${keyCount} ${keyType} key(s)`);
  saveData();

  res.json({ success: true, generated, count: generated.length });
});

// ─── Delete Key ──────────────────────────────────────────
app.delete('/api/admin/keys/:key', adminAuth, (req, res) => {
  const key = req.params.key.trim().toUpperCase();
  if (!keyStore.has(key)) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  keyStore.delete(key);
  saveData();
  console.log(`[ADMIN] Deleted key ${key}`);
  res.json({ success: true });
});

// ─── Revoke Key ──────────────────────────────────────────
app.post('/api/admin/keys/:key/revoke', adminAuth, (req, res) => {
  const key = req.params.key.trim().toUpperCase();
  const entry = keyStore.get(key);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  entry.valid = false;
  saveData();
  console.log(`[ADMIN] Revoked key ${key}`);
  res.json({ success: true });
});

// ─── Reactivate Key ─────────────────────────────────────
app.post('/api/admin/keys/:key/reactivate', adminAuth, (req, res) => {
  const key = req.params.key.trim().toUpperCase();
  const entry = keyStore.get(key);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  entry.valid = true;
  entry.currentUses = 0;
  saveData();
  console.log(`[ADMIN] Reactivated key ${key}`);
  res.json({ success: true });
});

// ─── Extend Key ──────────────────────────────────────────
app.post('/api/admin/keys/:key/extend', adminAuth, (req, res) => {
  const key = req.params.key.trim().toUpperCase();
  const entry = keyStore.get(key);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }

  const { hours, days } = req.body;
  const addMs = ((parseInt(hours) || 0) * 60 * 60 * 1000) + ((parseInt(days) || 0) * 24 * 60 * 60 * 1000);

  if (addMs <= 0) {
    return res.status(400).json({ success: false, error: 'Specify hours or days to extend' });
  }

  // If key was expired, extend from now
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    entry.expiresAt = Date.now() + addMs;
  } else if (entry.expiresAt) {
    entry.expiresAt += addMs;
  } else {
    // Lifetime key, nothing to extend
    return res.json({ success: true, message: 'Lifetime key, no extension needed' });
  }

  entry.valid = true;
  saveData();
  console.log(`[ADMIN] Extended key ${key} by ${hours || 0}h ${days || 0}d`);
  res.json({ success: true, newExpiresAt: entry.expiresAt, remainingTime: getTimeRemaining(entry.expiresAt) });
});

// ─── Update Key Notes ────────────────────────────────────
app.post('/api/admin/keys/:key/notes', adminAuth, (req, res) => {
  const key = req.params.key.trim().toUpperCase();
  const entry = keyStore.get(key);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }
  entry.notes = req.body.notes || '';
  saveData();
  res.json({ success: true });
});

// ─── Verification Logs ──────────────────────────────────
app.get('/api/admin/logs', adminAuth, (req, res) => {
  const { search, success: successFilter, page, limit } = req.query;

  let logs = [...verifyLogs].reverse(); // newest first

  if (successFilter !== undefined && successFilter !== 'all') {
    const filterBool = successFilter === 'true';
    logs = logs.filter(l => l.success === filterBool);
  }

  if (search) {
    const s = search.toLowerCase();
    logs = logs.filter(l =>
      l.key.toLowerCase().includes(s) ||
      l.hwid.toLowerCase().includes(s) ||
      l.ip.toLowerCase().includes(s) ||
      l.username.toLowerCase().includes(s) ||
      l.executor.toLowerCase().includes(s)
    );
  }

  const p = parseInt(page) || 1;
  const l = Math.min(parseInt(limit) || 50, 200);
  const total = logs.length;
  const totalPages = Math.ceil(total / l);
  logs = logs.slice((p - 1) * l, p * l);

  res.json({ success: true, logs, total, page: p, totalPages, limit: l });
});

// ─── HWID Management ─────────────────────────────────────
app.get('/api/admin/hwids', adminAuth, (req, res) => {
  const { search, blacklisted, page, limit } = req.query;

  let hwids = Array.from(hwidStore.values());

  if (blacklisted !== undefined && blacklisted !== 'all') {
    const filterBool = blacklisted === 'true';
    hwids = hwids.filter(h => h.blacklisted === filterBool);
  }

  if (search) {
    const s = search.toLowerCase();
    hwids = hwids.filter(h =>
      h.hwid.toLowerCase().includes(s) ||
      h.username.toLowerCase().includes(s) ||
      h.executor.toLowerCase().includes(s) ||
      h.ips.some(ip => ip.includes(s))
    );
  }

  // Sort by lastSeen desc
  hwids.sort((a, b) => b.lastSeen - a.lastSeen);

  const p = parseInt(page) || 1;
  const l = Math.min(parseInt(limit) || 50, 200);
  const total = hwids.length;
  const totalPages = Math.ceil(total / l);
  hwids = hwids.slice((p - 1) * l, p * l);

  res.json({ success: true, hwids, total, page: p, totalPages, limit: l });
});

// ─── Blacklist HWID ──────────────────────────────────────
app.post('/api/admin/hwids/blacklist', adminAuth, (req, res) => {
  const { hwid } = req.body;
  if (!hwid) return res.status(400).json({ success: false, error: 'HWID required' });

  let hwidData = hwidStore.get(hwid);
  if (!hwidData) {
    hwidData = {
      hwid,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      keys: [],
      ips: [],
      username: 'unknown',
      executor: 'unknown',
      userId: 'unknown',
      totalVerifications: 0,
      blacklisted: true,
    };
    hwidStore.set(hwid, hwidData);
  } else {
    hwidData.blacklisted = true;
  }

  saveData();
  console.log(`[ADMIN] Blacklisted HWID: ${hwid}`);
  res.json({ success: true });
});

// ─── Unblacklist HWID ────────────────────────────────────
app.delete('/api/admin/hwids/blacklist/:hwid', adminAuth, (req, res) => {
  const hwid = req.params.hwid;
  const hwidData = hwidStore.get(hwid);
  if (hwidData) {
    hwidData.blacklisted = false;
    saveData();
  }
  console.log(`[ADMIN] Unblacklisted HWID: ${hwid}`);
  res.json({ success: true });
});

// ─── Export Data ─────────────────────────────────────────
app.get('/api/admin/export', adminAuth, (req, res) => {
  const data = {
    exportedAt: new Date().toISOString(),
    keys: Array.from(keyStore.values()),
    logs: verifyLogs,
    hwids: Array.from(hwidStore.values()),
    analytics,
  };
  res.setHeader('Content-Disposition', 'attachment; filename=bluelock_export.json');
  res.json(data);
});

// ─── Clear Logs ──────────────────────────────────────────
app.delete('/api/admin/logs', adminAuth, (req, res) => {
  const count = verifyLogs.length;
  verifyLogs = [];
  saveData();
  console.log(`[ADMIN] Cleared ${count} logs`);
  res.json({ success: true, cleared: count });
});

// ─── Delete All Expired Keys ─────────────────────────────
app.delete('/api/admin/keys/bulk/expired', adminAuth, (req, res) => {
  let count = 0;
  for (const [key, entry] of keyStore) {
    if (getKeyStatus(entry) === 'expired') {
      keyStore.delete(key);
      count++;
    }
  }
  saveData();
  console.log(`[ADMIN] Deleted ${count} expired keys`);
  res.json({ success: true, deleted: count });
});


// ═══════════════════════════════════════════════════════════
// Serve Pages
// ═══════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ═══════════════════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║   BlueLock Key System API v2.0              ║`);
  console.log(`║   Running on port ${PORT}                      ║`);
  console.log(`║   Admin: /admin                             ║`);
  console.log(`║   Keys: ${keyStore.size} loaded                        ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
});

// Save data on shutdown
process.on('SIGTERM', () => { saveData(); process.exit(0); });
process.on('SIGINT', () => { saveData(); process.exit(0); });
