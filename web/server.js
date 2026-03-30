const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rate Limiter ────────────────────────────────────────
const rateLimiter = new RateLimiterMemory({
  points: 5,       // 5 requests
  duration: 60,    // per 60 seconds
});

const keyGenLimiter = new RateLimiterMemory({
  points: 3,       // 3 key generations
  duration: 300,   // per 5 minutes
});

// ─── In-Memory Key Store ─────────────────────────────────
// In production, replace with Redis/DB
const keyStore = new Map();

// Key configuration
const KEY_CONFIG = {
  expirationMs: 24 * 60 * 60 * 1000, // 24 hours
  maxUses: 1,                          // single-use by default
  prefix: 'BLUE',
};

// ─── Helper Functions ────────────────────────────────────
function generateKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(3).toString('hex').toUpperCase());
  }
  return `${KEY_CONFIG.prefix}-${segments.join('-')}`;
}

function createKeyEntry(key) {
  return {
    key,
    createdAt: Date.now(),
    expiresAt: Date.now() + KEY_CONFIG.expirationMs,
    maxUses: KEY_CONFIG.maxUses,
    currentUses: 0,
    hwid: null, // optional hardware ID binding
    valid: true,
  };
}

function isKeyValid(entry) {
  if (!entry) return { valid: false, reason: 'Key not found' };
  if (!entry.valid) return { valid: false, reason: 'Key has been revoked' };
  if (Date.now() > entry.expiresAt) return { valid: false, reason: 'Key has expired' };
  if (entry.currentUses >= entry.maxUses) return { valid: false, reason: 'Key usage limit reached' };
  return { valid: true };
}

// ─── HMAC Signature for responses ────────────────────────
const API_SECRET = crypto.randomBytes(32).toString('hex');

function signResponse(data) {
  const hmac = crypto.createHmac('sha256', API_SECRET);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

// ─── Cleanup expired keys every hour ─────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of keyStore) {
    if (now > entry.expiresAt + 3600000) { // 1hr grace period
      keyStore.delete(key);
    }
  }
}, 3600000);

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════

// ─── Generate Key ────────────────────────────────────────
app.post('/api/key/generate', async (req, res) => {
  const ip = req.ip;

  try {
    await keyGenLimiter.consume(ip);
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Too many key generation requests. Wait 5 minutes.',
    });
  }

  const key = generateKey();
  const entry = createKeyEntry(key);
  keyStore.set(key, entry);

  console.log(`[KEY GEN] ${key} | Expires: ${new Date(entry.expiresAt).toISOString()}`);

  res.json({
    success: true,
    key,
    expiresAt: entry.expiresAt,
    expiresIn: '24 hours',
  });
});

// ─── Verify Key ──────────────────────────────────────────
app.post('/api/key/verify', async (req, res) => {
  const ip = req.ip;

  try {
    await rateLimiter.consume(ip);
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Rate limited. Try again later.',
      signature: null,
    });
  }

  const { key, hwid } = req.body;

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

  if (!validation.valid) {
    console.log(`[VERIFY FAIL] ${trimmedKey} | Reason: ${validation.reason}`);
    return res.json({
      success: false,
      error: validation.reason,
      signature: null,
    });
  }

  // Consume a use
  entry.currentUses++;

  // Bind HWID if provided
  if (hwid && !entry.hwid) {
    entry.hwid = hwid;
  }

  const responseData = {
    success: true,
    message: 'Key verified successfully',
    expiresAt: entry.expiresAt,
    remainingUses: entry.maxUses - entry.currentUses,
    timestamp: Date.now(),
  };

  // Sign the response so the client can verify authenticity
  responseData.signature = signResponse({
    success: true,
    timestamp: responseData.timestamp,
  });

  console.log(`[VERIFY OK] ${trimmedKey} | Uses: ${entry.currentUses}/${entry.maxUses}`);

  res.json(responseData);
});

// ─── Key Info (admin) ────────────────────────────────────
app.get('/api/key/info/:key', (req, res) => {
  const key = req.params.key.trim().toUpperCase();
  const entry = keyStore.get(key);

  if (!entry) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }

  res.json({
    success: true,
    key: entry.key,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    currentUses: entry.currentUses,
    maxUses: entry.maxUses,
    valid: isKeyValid(entry).valid,
  });
});

// ─── Stats ───────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const total = keyStore.size;
  let active = 0;
  let expired = 0;
  let used = 0;

  for (const [, entry] of keyStore) {
    const v = isKeyValid(entry);
    if (v.valid) active++;
    else if (Date.now() > entry.expiresAt) expired++;
    else used++;
  }

  res.json({ total, active, expired, used });
});

// ─── Health ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Serve frontend ──────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Key System API running on :${PORT}      ║`);
  console.log(`║   http://localhost:${PORT}               ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
