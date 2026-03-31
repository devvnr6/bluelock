--[[
    ╔═══════════════════════════════════════════════════════════╗
    ║                BlueLock Key System                        ║
    ║              Roblox Script Hub - Entry Point               ║
    ╚═══════════════════════════════════════════════════════════╝
    
    Usage:
      loadstring(game:HttpGet("YOUR_RAW_URL"))()
    
    This script initializes the key verification system.
    Users must obtain a valid key from the website before
    the script hub unlocks.
]]

-- ═══════════════════════════════════════════════════════════
-- Configuration
-- ═══════════════════════════════════════════════════════════
local Config = {
    -- API endpoint for key verification
    API_URL = "https://bluelock-f9m3.onrender.com",
    
    -- Website URL where users obtain keys
    KEY_WEBSITE = "https://bluelock-f9m3.onrender.com",
    
    -- Hub info
    HUB_NAME = "BlueLock",
    HUB_VERSION = "1.0.0",
    
    -- UI Settings
    ACCENT_COLOR = Color3.fromRGB(168, 85, 247),
    ACCENT_SECONDARY = Color3.fromRGB(99, 102, 241),
    BG_COLOR = Color3.fromRGB(10, 10, 15),
    CARD_COLOR = Color3.fromRGB(18, 18, 26),
    TEXT_COLOR = Color3.fromRGB(240, 240, 245),
    TEXT_SECONDARY = Color3.fromRGB(139, 139, 160),
    ERROR_COLOR = Color3.fromRGB(239, 68, 68),
    SUCCESS_COLOR = Color3.fromRGB(16, 185, 129),
    
    -- Security
    MAX_VERIFY_ATTEMPTS = 5,
    ATTEMPT_COOLDOWN = 30, -- seconds
}

-- ═══════════════════════════════════════════════════════════
-- Load Modules
-- ═══════════════════════════════════════════════════════════
local KeyUI = loadstring(game:HttpGet("https://raw.githubusercontent.com/devvnr6/bluelock/main/roblox/KeyUI.lua"))()
local KeyVerifier = loadstring(game:HttpGet("https://raw.githubusercontent.com/devvnr6/bluelock/main/roblox/KeyVerifier.lua"))()
local ScriptHub = loadstring(game:HttpGet("https://raw.githubusercontent.com/devvnr6/bluelock/main/roblox/ScriptHub.lua"))()

-- Or if running locally / from file:
-- local KeyUI = require(script.KeyUI)
-- local KeyVerifier = require(script.KeyVerifier)
-- local ScriptHub = require(script.ScriptHub)

-- ═══════════════════════════════════════════════════════════
-- Initialize
-- ═══════════════════════════════════════════════════════════
local function Initialize()
    -- Anti-tamper: Check environment
    if not game or not game.GetService then
        return
    end
    
    -- Initialize the key verification module
    local verifier = KeyVerifier.new(Config)
    
    -- Check if we have a saved key for this session
    local savedKey = verifier:GetSessionKey()
    
    if savedKey and verifier:QuickValidate(savedKey) then
        -- Key still valid, skip verification
        ScriptHub.Launch(Config)
        return
    end
    
    -- Show key UI
    local ui = KeyUI.new(Config)
    
    -- Connect UI events
    ui.OnVerify = function(key)
        local success, result = verifier:Verify(key)
        
        if success then
            ui:ShowSuccess()
            verifier:SaveSessionKey(key)
            
            task.wait(1.5)
            ui:Destroy()
            ScriptHub.Launch(Config)
        else
            ui:ShowError(result)
        end
    end
    
    ui.OnGetKey = function()
        -- Open key website
        if setclipboard then
            -- Some executors support opening URLs
        end
        ui:ShowNotification("Visit the key website to get your key!")
    end
    
    ui:Show()
end

-- Run with protection
local success, err = pcall(Initialize)
if not success then
    warn("[BlueLock] Initialization error: " .. tostring(err))
end
