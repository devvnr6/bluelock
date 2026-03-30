# 🔒 BlueLock — Roblox Script Hub Key System

A secure, modern key verification system for Roblox script hubs. Users must obtain a valid key from the website before accessing any script features.

![BlueLock](https://img.shields.io/badge/BlueLock-v1.0.0-7C3AED?style=for-the-badge&labelColor=1a1a2e)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge&labelColor=1a1a2e)
![Roblox](https://img.shields.io/badge/Roblox-Lua-00a2ff?style=for-the-badge&labelColor=1a1a2e)

---

## ✨ Features

### Key System
- 🔑 **24-hour key expiration** with automatic cleanup
- 🔐 **Single-use keys** (configurable)
- 🌐 **Remote verification** — no local-only bypass
- 🛡️ **HMAC-signed responses** for tamper detection
- ⏱️ **Rate limiting** on both API and client side
- 🖥️ **HWID binding** — keys locked to first user

### UI / UX
- 🎨 Modern dark glassmorphic design
- ✨ Smooth animations (fade, scale, blur)
- 🔴 Shake animation on error
- 🟢 Success glow on verification
- 🖱️ Draggable windows
- 📋 Clipboard auto-copy support

### Security
- ✅ Server-side verification only
- ✅ Anti-tamper environment checks
- ✅ Module integrity validation
- ✅ Rate limited attempts (5/min)
- ✅ HMAC response signatures

---

## 📁 Project Structure

```
BlueLock/
├── .gitignore
├── README.md
│
├── web/                          # Backend API + Key Website
│   ├── server.js                 # Express.js API server
│   ├── package.json
│   └── public/
│       ├── index.html            # Key generation website
│       ├── style.css             # Dark theme stylesheet
│       └── script.js             # Frontend logic
│
└── roblox/                       # Roblox Lua Scripts
    ├── init.lua                  # Entry point / loader
    ├── KeyUI.lua                 # Animated key input UI
    ├── KeyVerifier.lua           # Remote verification module
    └── ScriptHub.lua             # Script hub (unlocked after key)
```

---

## 🚀 Setup

### 1. Start the API Server

```bash
cd web
npm install
node server.js
```

Server runs at `http://localhost:3000`

### 2. Deploy to Production

Deploy the `web/` folder to any Node.js hosting:
- [Railway](https://railway.app)
- [Render](https://render.com)
- [Vercel](https://vercel.com)

### 3. Configure Roblox Script

Update the URLs in `roblox/init.lua`:

```lua
local Config = {
    API_URL = "https://your-api-url.com",
    KEY_WEBSITE = "https://your-api-url.com",
}
```

---

## 🔄 How It Works

```
User runs script
       │
       ▼
┌──────────────┐
│  Key UI      │  ← Modern animated interface
│  appears     │
└──────┬───────┘
       │
  ┌────┴────┐
  │ Has key? │
  └────┬────┘
       │ No
       ▼
┌──────────────┐       ┌──────────────┐
│ "Get Key"    │──────▶│ Key Website  │
│  button      │       │ generates    │
└──────────────┘       │ BLUE-XXXX... │
       │               └──────────────┘
       │ Yes
       ▼
┌──────────────┐
│ POST /verify │──────▶ API validates
└──────┬───────┘
       │
  ┌────┴────┐
  │ Valid?  │
  └────┬────┘
   │       │
  Yes     No
   │       │
   ▼       ▼
 Hub    Shake +
Opens   Error
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/key/generate` | `POST` | Generate a new key |
| `/api/key/verify` | `POST` | Verify a key |
| `/api/key/info/:key` | `GET` | Get key metadata |
| `/api/stats` | `GET` | Key store statistics |
| `/api/health` | `GET` | Health check |

---

## ⚙️ Configuration

Edit `KEY_CONFIG` in `server.js`:

```javascript
const KEY_CONFIG = {
  expirationMs: 24 * 60 * 60 * 1000, // 24 hours
  maxUses: 1,                          // single-use
  prefix: 'BLUE',                      // key prefix
};
```

---

## 📜 License

MIT License — feel free to use and modify.
