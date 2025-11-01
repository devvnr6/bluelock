# ?? Quick Start Guide

Get your Balkan Government Bot running in 5 minutes!

## ?? Step-by-Step Setup

### 1. Install Python Dependencies (2 minutes)

```bash
cd bot
pip install -r requirements.txt
```

### 2. Create Discord Bot (2 minutes)

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" ? "Add Bot"
4. Enable these under "Privileged Gateway Intents":
   - ? Server Members Intent
   - ? Message Content Intent
5. Copy the bot token (click "Reset Token" if needed)

### 3. Invite Bot to Server (1 minute)

1. In Discord Developer Portal, go to OAuth2 ? URL Generator
2. Select: `bot` and `applications.commands`
3. Select permissions: `Administrator` (or specific permissions from README)
4. Copy and open the generated URL
5. Select your server and authorize

### 4. Configure Bot (3 minutes)

```bash
cp .env.example .env
nano .env  # or use any text editor
```

Fill in at minimum:
```env
DISCORD_TOKEN=your_token_here
GUILD_ID=your_server_id
```

**How to get IDs:**
1. Enable Developer Mode in Discord (Settings ? Advanced ? Developer Mode)
2. Right-click server name ? Copy ID (for GUILD_ID)
3. Right-click roles ? Copy ID (for role IDs)
4. Right-click channels ? Copy ID (for channel IDs)

### 5. Run Bot (1 minute)

```bash
python bot.py
```

You should see:
```
? Database connected
? Roblox integration initialized
???? Balkan Government Bot Online ????
```

### 6. Test Commands

In Discord, type: `/` and you should see bot commands appear!

Try:
- `/budget` - View economy
- `/wars` - View wars (should be empty)
- `/alliances` - View alliances

## ?? Optional: Roblox Integration

If you want real-time Roblox integration:

1. Get your Roblox Universe ID:
   - Open your game in Roblox Studio
   - Game Settings ? Basic Info
   - Copy "Universe ID"

2. Get API Key:
   - Go to https://create.roblox.com/
   - Select your game ? Settings ? API Keys
   - Create key with MessagingService permissions

3. Add to `.env`:
   ```env
   ROBLOX_GAME_ID=your_universe_id
   ROBLOX_API_KEY=your_api_key
   ```

4. Add the script from README.md to ServerScriptService in Roblox Studio

5. Enable HTTP Requests:
   - Home ? Game Settings ? Security
   - ? Allow HTTP Requests

6. Publish your game!

## ? Verification Checklist

- [ ] Python 3.8+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with Discord token
- [ ] Bot invited to server
- [ ] Bot appears online in Discord
- [ ] Slash commands appear when typing `/`
- [ ] (Optional) Roblox integration configured

## ?? First Steps

1. **Setup Roles** in Discord:
   - Create: President, Minister, Council Member, Military
   - Assign to members
   - Add role IDs to `.env`

2. **Setup Channels**:
   - Create: #government, #voting, #announcements
   - Set permissions (government = private, others = public)
   - Add channel IDs to `.env`

3. **Restart bot** to apply role/channel settings:
   ```bash
   # Press Ctrl+C to stop
   python bot.py
   ```

4. **Try your first law proposal**:
   ```
   /propose title:"Test Law" description:"This is a test law"
   ```

## ?? Common Issues

### "Commands not showing up"
- Wait 1-2 minutes after bot starts
- Make sure bot has Administrator permission
- Try kicking and re-inviting the bot

### "Bot doesn't respond"
- Check bot is online in server member list
- Verify bot has Send Messages permission
- Check you're using `/` slash commands, not `!` prefix

### "Permission denied errors"
- Make sure you have the required role (President/Minister/etc.)
- Add your role ID to `.env`
- Restart the bot

### "Module not found"
- Run: `pip install -r requirements.txt`
- Make sure you're in the `bot` directory

## ?? You're Ready!

Your Balkan Government Bot is now operational!

Check out the full command list in README.md or type `/` in Discord to explore.

---

**Need Help?** Read the full README.md for detailed documentation!
