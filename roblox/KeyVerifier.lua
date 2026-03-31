--[[
    BlueLock Key System — Key Verifier Module
    Remote verification with anti-tamper protection
]]

local KeyVerifier = {}
KeyVerifier.__index = KeyVerifier

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local Player = Players.LocalPlayer

-- Anti-Tamper
local function _EnvCheck()
    return game ~= nil and typeof(game) == "Instance" and game.ClassName == "DataModel"
end

function KeyVerifier.new(config)
    if not _EnvCheck() then error("Environment check failed") end
    local self = setmetatable({}, KeyVerifier)
    self.Config = config
    self.Attempts = 0
    self.LastAttempt = 0
    self.SessionKey = nil
    self.Verified = false
    self._SessionId = HttpService:GenerateGUID(false)
    return self
end

function KeyVerifier:_GetHWID()
    local hwid = "UNKNOWN"
    for _, fn in ipairs({
        function() return gethwid and gethwid() end,
        function() return identifyexecutor and identifyexecutor() end,
    }) do
        local ok, r = pcall(fn)
        if ok and r and r ~= "" then hwid = tostring(r); break end
    end
    local combined = hwid .. "_" .. tostring(Player.UserId)
    local hash = 0
    for i = 1, #combined do
        hash = (hash * 31 + string.byte(combined, i)) % 2147483647
    end
    return tostring(hash)
end

function KeyVerifier:Verify(key)
    local now = tick()
    if now - self.LastAttempt < 3 then
        return false, "Please wait before trying again"
    end
    self.Attempts = self.Attempts + 1
    self.LastAttempt = now
    if self.Attempts > self.Config.MAX_VERIFY_ATTEMPTS then
        return false, "Too many attempts. Wait " .. self.Config.ATTEMPT_COOLDOWN .. "s"
    end
    if typeof(key) ~= "string" or #key < 10 then
        return false, "Invalid key format"
    end

    local url = self.Config.API_URL .. "/api/key/verify"
    local execName = "unknown"
    pcall(function() if identifyexecutor then execName = identifyexecutor() end end)

    local body = HttpService:JSONEncode({
        key = key:match("^%s*(.-)%s*$"),
        hwid = self:_GetHWID(),
        sessionId = self._SessionId,
        timestamp = os.time(),
        executor = execName,
        username = Player.Name,
        userId = tostring(Player.UserId)
    })

    local ok, result = pcall(function()
        local reqFn = request or http_request or (syn and syn.request)
        if reqFn then
            return reqFn({
                Url = url, Method = "POST",
                Headers = {["Content-Type"] = "application/json", ["User-Agent"] = "BlueLock/2.0"},
                Body = body,
            })
        end
        error("No HTTP function available")
    end)

    if not ok then return false, "Connection failed" end

    local pOk, data = pcall(function()
        return HttpService:JSONDecode(result.Body)
    end)
    if not pOk then return false, "Invalid server response" end

    if data.success and data.signature and #data.signature >= 10 then
        self.Verified = true
        self.SessionKey = key
        return true, data
    end
    return false, data.error or "Verification failed"
end

function KeyVerifier:QuickValidate(key)
    if not key or key == "" then return false end
    local ok, _ = self:Verify(key)
    return ok
end

function KeyVerifier:GetSessionKey() return self.SessionKey end

function KeyVerifier:SaveSessionKey(key)
    self.SessionKey = key
    pcall(function()
        if writefile then
            writefile("bluelock_session.dat", HttpService:JSONEncode({
                key = key, timestamp = os.time(), userId = Player.UserId,
            }))
        end
    end)
end

function KeyVerifier:IsVerified() return self.Verified == true end

return KeyVerifier
