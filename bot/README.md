# ???? Balkan Government Discord Bot

A comprehensive Discord.py bot for managing a Balkan-themed Roblox roleplay government. This bot allows government officials to control every aspect of their nation through Discord commands that directly affect the Roblox game world in real-time.

## ?? Features

### ??? Government & Law System
- **Law Proposals**: Propose new laws that affect the entire nation
- **Voting System**: Democratic voting on proposed laws
- **Law Enactment**: Automatically apply laws to the Roblox game
- **Border Control**: Open/close borders for trade, military, and immigration

### ?? Military Control
- **War Declaration**: Declare wars on rival nations
- **Troop Mobilization**: Mobilize military units
- **Troop Deployment**: Deploy forces to strategic locations
- **Defense Status**: Set national defense posture (Passive to DEFCON 1)
- **War Management**: Track and end active conflicts

### ?? Diplomacy & Trade
- **Alliance Formation**: Create or break alliances with other nations
- **Trade Agreements**: Establish trade routes for resources
- **Economic Sanctions**: Impose or lift sanctions on nations
- **Espionage Operations**: Conduct covert intelligence missions

### ?? Economy & Resources
- **Tax Control**: Set national tax rates (0-50%)
- **Resource Management**: Control production/allocation of resources
  - Oil ???
  - Food ??
  - Minerals ??
  - Steel ??
  - Coal ??
  - Gold ??
- **Budget Tracking**: Monitor national economy
- **Economic Reports**: Comprehensive financial analysis

## ?? Prerequisites

- Python 3.8 or higher
- Discord Bot Token
- Roblox Game with MessagingService enabled
- Roblox API Key

## ?? Installation

### 1. Clone or Download

```bash
cd bot
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your details:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
GUILD_ID=your_guild_id_here

# Roblox Integration
ROBLOX_GAME_ID=your_roblox_game_id
ROBLOX_API_KEY=your_roblox_api_key

# Role IDs
PRESIDENT_ROLE_ID=123456789
MINISTER_ROLE_ID=123456789
COUNCIL_MEMBER_ROLE_ID=123456789
MILITARY_ROLE_ID=123456789

# Channel IDs
GOVERNMENT_CHANNEL_ID=123456789
VOTING_CHANNEL_ID=123456789
ANNOUNCEMENTS_CHANNEL_ID=123456789
```

### 4. Setup Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to "Bot" section and create a bot
4. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token to `.env`
6. Go to OAuth2 ? URL Generator
7. Select scopes: `bot`, `applications.commands`
8. Select permissions:
   - Send Messages
   - Embed Links
   - Read Message History
   - Add Reactions
   - Use Slash Commands
9. Use the generated URL to invite the bot to your server

### 5. Setup Discord Roles & Channels

Create these roles in your Discord server:
- **President** - Full government control
- **Minister** - Department-specific control
- **Council Member** - Voting rights
- **Military** - Military command access

Create these channels:
- **#government** - Private government discussions
- **#voting** - Public law voting
- **#announcements** - Public announcements

Get the role and channel IDs (Enable Developer Mode in Discord ? Right-click ? Copy ID) and add them to `.env`.

## ?? Roblox Integration Setup

### 1. Enable HttpService

In Roblox Studio:
1. Go to Home ? Game Settings ? Security
2. Enable "Allow HTTP Requests"

### 2. Get Roblox API Key

1. Go to [Roblox Creator Hub](https://create.roblox.com/)
2. Navigate to your game
3. Go to Settings ? API Keys
4. Create a new API key with MessagingService permissions
5. Copy the key to `.env`

### 3. Create Server Script

In Roblox Studio, create a Script in `ServerScriptService`:

```lua
local MessagingService = game:GetService("MessagingService")
local HttpService = game:GetService("HttpService")

-- Topics to subscribe to
local topics = {"government", "military", "economy", "diplomacy", "espionage"}

-- Subscribe to each topic
for _, topic in ipairs(topics) do
    MessagingService:SubscribeAsync(topic, function(message)
        local data = HttpService:JSONDecode(message.Data)
        
        -- Route commands to appropriate handlers
        if topic == "military" then
            handleMilitaryCommand(data)
        elseif topic == "economy" then
            handleEconomyCommand(data)
        elseif topic == "diplomacy" then
            handleDiplomacyCommand(data)
        elseif topic == "government" then
            handleGovernmentCommand(data)
        elseif topic == "espionage" then
            handleEspionageCommand(data)
        end
    end)
end

function handleMilitaryCommand(data)
    local action = data.action
    
    if action == "declare_war" then
        -- Implement war declaration logic
        print("War declared on " .. data.target)
        
    elseif action == "mobilize" then
        -- Spawn/mobilize units
        print("Mobilizing " .. data.amount .. " " .. data.unit_type)
        
    elseif action == "deploy" then
        -- Deploy troops to location
        print("Deploying " .. data.unit_type .. " to " .. data.location)
        
    elseif action == "defense_status" then
        -- Set defense posture
        print("Defense status: " .. data.status)
    end
end

function handleEconomyCommand(data)
    local action = data.action
    
    if action == "tax_rate" then
        -- Update tax rate in game
        print("Tax rate set to " .. data.rate .. "%")
        
    elseif action == "resource_control" then
        -- Update resource production
        print("Resource " .. data.resource .. " set to " .. data.amount)
        
    elseif action == "trade" then
        -- Establish trade route
        print("Trade established with " .. data.nation)
    end
end

function handleDiplomacyCommand(data)
    local action = data.action
    
    if action == "alliance" then
        -- Create alliance
        print("Alliance formed with " .. data.nation)
        
    elseif action == "break_alliance" then
        -- Break alliance
        print("Alliance broken with " .. data.nation)
        
    elseif action == "sanction" then
        -- Apply sanctions
        print("Sanctions imposed on " .. data.nation)
    end
end

function handleGovernmentCommand(data)
    local action = data.action
    
    if action == "enact_law" then
        -- Apply law effects
        print("Law enacted: " .. data.title)
        
    elseif action == "border_control" then
        -- Control borders
        print("Borders " .. data.border_action .. " for " .. data.type)
    end
end

function handleEspionageCommand(data)
    -- Handle espionage missions
    print("Espionage mission against " .. data.target)
end

print("? Balkan Government Bot Integration Active")
```

### 4. Get Universe ID

1. In Roblox Studio, go to Game Settings ? Basic Info
2. Copy your Universe ID (not Place ID!)
3. Add it to `.env` as `ROBLOX_GAME_ID`

## ?? Running the Bot

```bash
python bot.py
```

You should see:
```
? Database connected
? Roblox integration initialized
? Loaded cogs.government
? Loaded cogs.military
? Loaded cogs.diplomacy
? Loaded cogs.economy
? Commands synced to guild
????????????????????????????????????????
???? Balkan Government Bot Online ????
????????????????????????????????????????
```

## ?? Commands Reference

### Government Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/propose <title> <description>` | Propose a new law | Government |
| `/vote <law_id> <for/against>` | Vote on a law | Government |
| `/enact <law_id>` | Enact a passed law | President/Minister |
| `/laws [status]` | View pending or enacted laws | All |
| `/borders <open/close> [type]` | Control borders | President/Minister |

### Military Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/declarewar <nation>` | Declare war | President/Minister |
| `/mobilize <unit> <amount> <location>` | Mobilize troops | Military/Government |
| `/deploy <unit> <location>` | Deploy troops | Military/Government |
| `/defense <status>` | Set defense status | President/Minister |
| `/endwar <war_id>` | End a war | President |
| `/wars` | View active wars | All |

### Diplomacy Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/alliance <nation> <form/break>` | Manage alliances | President/Minister |
| `/trade <nation> <resource> <amount>` | Create trade agreement | President/Minister |
| `/sanction <nation> <impose/lift>` | Manage sanctions | President/Minister |
| `/espionage <nation>` | Start espionage mission | President/Minister |
| `/alliances` | View active alliances | All |
| `/trades` | View trade agreements | All |

### Economy Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/tax <rate>` | Set tax rate (0-50%) | President/Minister |
| `/control <resource> <amount>` | Control resource allocation | President/Minister |
| `/budget` | View economy status | All |
| `/resources` | View all resources | All |
| `/economyreport` | Generate full report | Government |

## ?? Valid Nations

- Serbia
- Croatia
- Bosnia
- Slovenia
- Montenegro
- Macedonia
- Albania
- Bulgaria
- Romania
- Greece

## ?? Valid Resources

- Oil ???
- Food ??
- Minerals ??
- Steel ??
- Coal ??
- Gold ??

## ??? Database

The bot uses SQLite (via aiosqlite) to store:
- Laws and votes
- Alliances and wars
- Trade agreements and sanctions
- Economy and resources
- Military actions
- Espionage missions

Database file: `balkan_gov.db` (created automatically)

## ?? Configuration

Edit `config.py` to customize:
- Vote duration and threshold
- Tax rate limits
- Resources list
- Nations list
- Role requirements

## ??? Security Notes

1. **Keep `.env` private** - Never commit it to version control
2. **Use role permissions** - Properly configure Discord roles
3. **API Key Security** - Protect your Roblox API key
4. **Rate Limiting** - Be aware of Discord and Roblox API rate limits

## ?? Troubleshooting

### Commands not showing up
- Make sure bot has `applications.commands` scope
- Wait 1 hour for global commands or use guild-specific sync
- Check bot permissions in server

### Roblox integration not working
- Verify HttpService is enabled
- Check API key permissions
- Ensure Universe ID (not Place ID) is correct
- Check MessagingService is subscribed

### Database errors
- Delete `balkan_gov.db` and restart (data will be lost)
- Check file permissions

### Bot can't send messages
- Verify bot has Send Messages permission
- Check channel permissions

## ?? Example Gameplay Flow

1. **Council Meeting**
   ```
   President: /propose "Military Expansion Act" "Increase military budget by 20%"
   Ministers vote: /vote 1 for
   President: /enact 1
   ```

2. **War Declaration**
   ```
   President: /declarewar Serbia
   Minister: /mobilize infantry 500 border
   General: /deploy tanks Belgrade
   ```

3. **Diplomacy**
   ```
   Foreign Minister: /alliance Croatia form
   Economy Minister: /trade Croatia oil 1000
   ```

4. **Economy Management**
   ```
   President: /tax 15
   Economy Minister: /control food 5000
   Anyone: /budget
   ```

## ?? Support

For issues or questions:
1. Check this README thoroughly
2. Verify all configuration settings
3. Check bot and Roblox logs for errors

## ?? License

This bot is provided as-is for roleplay purposes. Customize as needed for your server.

## ?? Customization

Feel free to:
- Add more nations in `config.py`
- Add more resources
- Modify vote thresholds
- Add custom commands
- Extend Roblox integration

## ? Performance Tips

1. Use guild-specific command sync for faster updates
2. Limit database queries with caching if needed
3. Use appropriate Discord permissions to reduce spam
4. Monitor Roblox MessagingService limits

---

**Made with ?? for Balkan Roleplay Communities**

???? ???? ???? ???? ???? ???? ???? ???? ???? ????
