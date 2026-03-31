--[[
    ╔═══════════════════════════════════════════════════════════╗
    ║            BlueLock Key System — UI Module                ║
    ║         Modern, animated key verification interface        ║
    ╚═══════════════════════════════════════════════════════════╝
]]

local KeyUI = {}
KeyUI.__index = KeyUI

-- ═══════════════════════════════════════════════════════════
-- Services
-- ═══════════════════════════════════════════════════════════
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

-- ═══════════════════════════════════════════════════════════
-- Utility Functions
-- ═══════════════════════════════════════════════════════════
local function CreateInstance(className, properties, parent)
    local instance = Instance.new(className)
    for prop, value in pairs(properties) do
        instance[prop] = value
    end
    if parent then
        instance.Parent = parent
    end
    return instance
end

local function Tween(object, duration, properties, style, direction)
    style = style or Enum.EasingStyle.Quart
    direction = direction or Enum.EasingDirection.Out
    local tween = TweenService:Create(
        object,
        TweenInfo.new(duration, style, direction),
        properties
    )
    tween:Play()
    return tween
end

local function CreateCorner(parent, radius)
    return CreateInstance("UICorner", {
        CornerRadius = UDim.new(0, radius or 8)
    }, parent)
end

local function CreateStroke(parent, color, thickness, transparency)
    return CreateInstance("UIStroke", {
        Color = color or Color3.fromRGB(255, 255, 255),
        Thickness = thickness or 1,
        Transparency = transparency or 0.9,
    }, parent)
end

local function CreateGradient(parent, color1, color2, rotation)
    return CreateInstance("UIGradient", {
        Color = ColorSequence.new(color1, color2),
        Rotation = rotation or 135,
    }, parent)
end

local function CreatePadding(parent, top, right, bottom, left)
    return CreateInstance("UIPadding", {
        PaddingTop = UDim.new(0, top or 0),
        PaddingRight = UDim.new(0, right or 0),
        PaddingBottom = UDim.new(0, bottom or 0),
        PaddingLeft = UDim.new(0, left or 0),
    }, parent)
end

-- ═══════════════════════════════════════════════════════════
-- Constructor
-- ═══════════════════════════════════════════════════════════
function KeyUI.new(config)
    local self = setmetatable({}, KeyUI)
    
    self.Config = config
    self.OnVerify = nil  -- callback(key: string)
    self.OnGetKey = nil  -- callback()
    self.Destroyed = false
    self.Connections = {}
    
    self:_Build()
    
    return self
end

-- ═══════════════════════════════════════════════════════════
-- Build UI
-- ═══════════════════════════════════════════════════════════
function KeyUI:_Build()
    local cfg = self.Config
    
    -- ─── ScreenGui ────────────────────────────────────────
    self.ScreenGui = CreateInstance("ScreenGui", {
        Name = "BlueLockKeySystem",
        ResetOnSpawn = false,
        ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
        IgnoreGuiInset = true,
    }, PlayerGui)
    
    -- ─── Background Blur ──────────────────────────────────
    self.BlurOverlay = CreateInstance("Frame", {
        Name = "BlurOverlay",
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundColor3 = Color3.fromRGB(0, 0, 0),
        BackgroundTransparency = 1,
        ZIndex = 1,
    }, self.ScreenGui)
    
    -- ─── Animated Background Gradient ─────────────────────
    self.BgGradient = CreateInstance("Frame", {
        Name = "BgGradient",
        Size = UDim2.new(1.5, 0, 1.5, 0),
        Position = UDim2.new(-0.25, 0, -0.25, 0),
        BackgroundColor3 = cfg.ACCENT_COLOR,
        BackgroundTransparency = 0.92,
        ZIndex = 2,
    }, self.ScreenGui)
    CreateInstance("UIGradient", {
        Color = ColorSequence.new({
            ColorSequenceKeypoint.new(0, cfg.ACCENT_COLOR),
            ColorSequenceKeypoint.new(0.5, cfg.ACCENT_SECONDARY),
            ColorSequenceKeypoint.new(1, cfg.ACCENT_COLOR),
        }),
        Rotation = 0,
    }, self.BgGradient)
    
    -- Animate gradient rotation
    local gradRotation = 0
    table.insert(self.Connections, RunService.Heartbeat:Connect(function(dt)
        if self.Destroyed then return end
        gradRotation = (gradRotation + dt * 15) % 360
        if self.BgGradient and self.BgGradient:FindFirstChild("UIGradient") then
            self.BgGradient.UIGradient.Rotation = gradRotation
        end
    end))
    
    -- ─── Main Card ────────────────────────────────────────
    self.Card = CreateInstance("Frame", {
        Name = "KeyCard",
        Size = UDim2.new(0, 420, 0, 380),
        Position = UDim2.new(0.5, 0, 0.5, 0),
        AnchorPoint = Vector2.new(0.5, 0.5),
        BackgroundColor3 = cfg.CARD_COLOR,
        BackgroundTransparency = 0.05,
        ZIndex = 10,
    }, self.ScreenGui)
    CreateCorner(self.Card, 16)
    CreateStroke(self.Card, Color3.fromRGB(255, 255, 255), 1, 0.92)
    
    -- Card shadow
    local shadow = CreateInstance("ImageLabel", {
        Name = "Shadow",
        Size = UDim2.new(1, 60, 1, 60),
        Position = UDim2.new(0.5, 0, 0.5, 8),
        AnchorPoint = Vector2.new(0.5, 0.5),
        BackgroundTransparency = 1,
        Image = "rbxassetid://5554236805", -- shadow asset
        ImageColor3 = Color3.fromRGB(0, 0, 0),
        ImageTransparency = 0.4,
        ScaleType = Enum.ScaleType.Slice,
        SliceCenter = Rect.new(23, 23, 277, 277),
        ZIndex = 9,
    }, self.Card)
    
    -- ─── Card Content Container ───────────────────────────
    local content = CreateInstance("Frame", {
        Name = "Content",
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundTransparency = 1,
        ZIndex = 11,
    }, self.Card)
    CreatePadding(content, 28, 28, 28, 28)
    
    -- ─── Logo/Title Area ──────────────────────────────────
    local titleFrame = CreateInstance("Frame", {
        Name = "TitleFrame",
        Size = UDim2.new(1, 0, 0, 60),
        BackgroundTransparency = 1,
        ZIndex = 12,
    }, content)
    
    -- Logo hexagon
    local logoFrame = CreateInstance("Frame", {
        Name = "LogoFrame",
        Size = UDim2.new(0, 44, 0, 44),
        Position = UDim2.new(0.5, 0, 0, 0),
        AnchorPoint = Vector2.new(0.5, 0),
        BackgroundColor3 = cfg.ACCENT_COLOR,
        BackgroundTransparency = 0.85,
        ZIndex = 13,
    }, titleFrame)
    CreateCorner(logoFrame, 10)
    CreateStroke(logoFrame, cfg.ACCENT_COLOR, 1, 0.7)
    
    local logoText = CreateInstance("TextLabel", {
        Name = "LogoText",
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundTransparency = 1,
        Text = "⬡",
        TextColor3 = cfg.ACCENT_COLOR,
        TextSize = 24,
        Font = Enum.Font.GothamBold,
        ZIndex = 14,
    }, logoFrame)
    
    -- Pulse animation for logo
    local pulseLoop
    pulseLoop = function()
        if self.Destroyed then return end
        Tween(logoFrame, 1.5, {BackgroundTransparency = 0.75}, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
        task.wait(1.5)
        if self.Destroyed then return end
        Tween(logoFrame, 1.5, {BackgroundTransparency = 0.9}, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
        task.wait(1.5)
        pulseLoop()
    end
    task.spawn(pulseLoop)
    
    -- Title
    self.Title = CreateInstance("TextLabel", {
        Name = "Title",
        Size = UDim2.new(1, 0, 0, 24),
        Position = UDim2.new(0, 0, 0, 52),
        BackgroundTransparency = 1,
        Text = cfg.HUB_NAME,
        TextColor3 = cfg.TEXT_COLOR,
        TextSize = 22,
        Font = Enum.Font.GothamBold,
        ZIndex = 12,
    }, titleFrame)
    
    -- Subtitle
    self.Subtitle = CreateInstance("TextLabel", {
        Name = "Subtitle",
        Size = UDim2.new(1, 0, 0, 18),
        Position = UDim2.new(0, 0, 0, 80),
        BackgroundTransparency = 1,
        Text = "Enter your key to unlock the script hub",
        TextColor3 = cfg.TEXT_SECONDARY,
        TextSize = 13,
        Font = Enum.Font.Gotham,
        ZIndex = 12,
    }, titleFrame)
    
    -- ─── Divider ──────────────────────────────────────────
    local divider = CreateInstance("Frame", {
        Name = "Divider",
        Size = UDim2.new(1, 0, 0, 1),
        Position = UDim2.new(0, 0, 0, 110),
        BackgroundColor3 = Color3.fromRGB(255, 255, 255),
        BackgroundTransparency = 0.92,
        ZIndex = 12,
    }, content)
    
    -- ─── Key Input ────────────────────────────────────────
    local inputContainer = CreateInstance("Frame", {
        Name = "InputContainer",
        Size = UDim2.new(1, 0, 0, 46),
        Position = UDim2.new(0, 0, 0, 130),
        BackgroundColor3 = Color3.fromRGB(8, 8, 14),
        BackgroundTransparency = 0.3,
        ZIndex = 12,
    }, content)
    CreateCorner(inputContainer, 10)
    CreateStroke(inputContainer, Color3.fromRGB(255, 255, 255), 1, 0.9)
    self.InputStroke = inputContainer:FindFirstChildOfClass("UIStroke")
    
    self.KeyInput = CreateInstance("TextBox", {
        Name = "KeyInput",
        Size = UDim2.new(1, -20, 1, 0),
        Position = UDim2.new(0, 10, 0, 0),
        BackgroundTransparency = 1,
        Text = "",
        PlaceholderText = "HUBX-XXXX-XXXX-XXXX-XXXX",
        PlaceholderColor3 = Color3.fromRGB(80, 80, 100),
        TextColor3 = cfg.TEXT_COLOR,
        TextSize = 14,
        Font = Enum.Font.Code,
        TextXAlignment = Enum.TextXAlignment.Left,
        ClearTextOnFocus = false,
        ZIndex = 13,
    }, inputContainer)
    
    -- Input focus effects
    table.insert(self.Connections, self.KeyInput.Focused:Connect(function()
        if self.InputStroke then
            Tween(self.InputStroke, 0.2, {
                Color = cfg.ACCENT_COLOR,
                Transparency = 0.5,
            })
        end
    end))
    
    table.insert(self.Connections, self.KeyInput.FocusLost:Connect(function()
        if self.InputStroke then
            Tween(self.InputStroke, 0.2, {
                Color = Color3.fromRGB(255, 255, 255),
                Transparency = 0.9,
            })
        end
    end))
    
    -- ─── Status Message ───────────────────────────────────
    self.StatusLabel = CreateInstance("TextLabel", {
        Name = "Status",
        Size = UDim2.new(1, 0, 0, 16),
        Position = UDim2.new(0, 0, 0, 182),
        BackgroundTransparency = 1,
        Text = "",
        TextColor3 = cfg.ERROR_COLOR,
        TextSize = 12,
        Font = Enum.Font.Gotham,
        TextXAlignment = Enum.TextXAlignment.Left,
        ZIndex = 12,
    }, content)
    
    -- ─── Verify Button ───────────────────────────────────
    self.VerifyBtn = CreateInstance("TextButton", {
        Name = "VerifyButton",
        Size = UDim2.new(1, 0, 0, 44),
        Position = UDim2.new(0, 0, 0, 208),
        BackgroundColor3 = cfg.ACCENT_COLOR,
        Text = "",
        AutoButtonColor = false,
        ZIndex = 12,
    }, content)
    CreateCorner(self.VerifyBtn, 10)
    CreateGradient(self.VerifyBtn, cfg.ACCENT_COLOR, cfg.ACCENT_SECONDARY, 135)
    
    local verifyLabel = CreateInstance("TextLabel", {
        Name = "Label",
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundTransparency = 1,
        Text = "🔓  Verify Key",
        TextColor3 = Color3.fromRGB(255, 255, 255),
        TextSize = 14,
        Font = Enum.Font.GothamBold,
        ZIndex = 13,
    }, self.VerifyBtn)
    
    -- Button hover effects
    table.insert(self.Connections, self.VerifyBtn.MouseEnter:Connect(function()
        Tween(self.VerifyBtn, 0.2, {Size = UDim2.new(1, 0, 0, 46)})
    end))
    
    table.insert(self.Connections, self.VerifyBtn.MouseLeave:Connect(function()
        Tween(self.VerifyBtn, 0.2, {Size = UDim2.new(1, 0, 0, 44)})
    end))
    
    -- Verify click handler
    table.insert(self.Connections, self.VerifyBtn.MouseButton1Click:Connect(function()
        if self.OnVerify then
            local key = self.KeyInput.Text
            if key == "" or #key < 10 then
                self:ShowError("Please enter a valid key")
                return
            end
            
            self:SetLoading(true)
            self.OnVerify(key)
        end
    end))
    
    -- ─── Get Key Button ──────────────────────────────────
    self.GetKeyBtn = CreateInstance("TextButton", {
        Name = "GetKeyButton",
        Size = UDim2.new(1, 0, 0, 40),
        Position = UDim2.new(0, 0, 0, 262),
        BackgroundColor3 = Color3.fromRGB(255, 255, 255),
        BackgroundTransparency = 0.92,
        Text = "",
        AutoButtonColor = false,
        ZIndex = 12,
    }, content)
    CreateCorner(self.GetKeyBtn, 10)
    CreateStroke(self.GetKeyBtn, Color3.fromRGB(255, 255, 255), 1, 0.9)
    
    local getKeyLabel = CreateInstance("TextLabel", {
        Name = "Label",
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundTransparency = 1,
        Text = "🔗  Get Key",
        TextColor3 = cfg.TEXT_SECONDARY,
        TextSize = 13,
        Font = Enum.Font.GothamSemibold,
        ZIndex = 13,
    }, self.GetKeyBtn)
    
    -- Get Key hover effects
    table.insert(self.Connections, self.GetKeyBtn.MouseEnter:Connect(function()
        Tween(self.GetKeyBtn, 0.2, {BackgroundTransparency = 0.85})
        Tween(getKeyLabel, 0.2, {TextColor3 = cfg.TEXT_COLOR})
    end))
    
    table.insert(self.Connections, self.GetKeyBtn.MouseLeave:Connect(function()
        Tween(self.GetKeyBtn, 0.2, {BackgroundTransparency = 0.92})
        Tween(getKeyLabel, 0.2, {TextColor3 = cfg.TEXT_SECONDARY})
    end))
    
    -- Get Key click handler
    table.insert(self.Connections, self.GetKeyBtn.MouseButton1Click:Connect(function()
        if self.OnGetKey then
            self.OnGetKey()
        end
        -- Copy website URL to clipboard if available
        if setclipboard then
            setclipboard(self.Config.KEY_WEBSITE)
            self:ShowNotification("Website URL copied to clipboard!")
        end
    end))
    
    -- ─── Footer Info ──────────────────────────────────────
    local footer = CreateInstance("TextLabel", {
        Name = "Footer",
        Size = UDim2.new(1, 0, 0, 14),
        Position = UDim2.new(0, 0, 0, 314),
        BackgroundTransparency = 1,
        Text = "v" .. cfg.HUB_VERSION .. " • Keys expire after 24 hours",
        TextColor3 = Color3.fromRGB(60, 60, 80),
        TextSize = 11,
        Font = Enum.Font.Gotham,
        ZIndex = 12,
    }, content)
    
    -- ─── Notification Label ───────────────────────────────
    self.NotifLabel = CreateInstance("TextLabel", {
        Name = "Notification",
        Size = UDim2.new(0, 300, 0, 36),
        Position = UDim2.new(0.5, 0, 0, -50),
        AnchorPoint = Vector2.new(0.5, 0),
        BackgroundColor3 = cfg.CARD_COLOR,
        BackgroundTransparency = 0.1,
        Text = "",
        TextColor3 = cfg.SUCCESS_COLOR,
        TextSize = 12,
        Font = Enum.Font.GothamSemibold,
        ZIndex = 20,
    }, self.ScreenGui)
    CreateCorner(self.NotifLabel, 18)
    CreateStroke(self.NotifLabel, cfg.SUCCESS_COLOR, 1, 0.7)
    
    -- ─── Make Card Draggable ──────────────────────────────
    self:_MakeDraggable(self.Card)
end

-- ═══════════════════════════════════════════════════════════
-- Dragging
-- ═══════════════════════════════════════════════════════════
function KeyUI:_MakeDraggable(frame)
    local dragging, dragInput, dragStart, startPos
    
    local function update(input)
        local delta = input.Position - dragStart
        Tween(frame, 0.08, {
            Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + delta.X,
                startPos.Y.Scale, startPos.Y.Offset + delta.Y
            )
        }, Enum.EasingStyle.Linear)
    end
    
    table.insert(self.Connections, frame.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or
           input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = frame.Position
            
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end))
    
    table.insert(self.Connections, frame.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or
           input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end))
    
    table.insert(self.Connections, UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            update(input)
        end
    end))
end

-- ═══════════════════════════════════════════════════════════
-- Public Methods
-- ═══════════════════════════════════════════════════════════

-- Show the UI with entrance animation
function KeyUI:Show()
    if self.Destroyed then return end
    
    -- Start hidden
    self.BlurOverlay.BackgroundTransparency = 1
    self.Card.Size = UDim2.new(0, 420, 0, 380)
    self.Card.BackgroundTransparency = 1
    
    -- Animate in
    Tween(self.BlurOverlay, 0.5, {BackgroundTransparency = 0.5})
    task.wait(0.1)
    Tween(self.Card, 0.5, {
        BackgroundTransparency = 0.05,
    }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
    
    -- Fade in children
    for _, child in ipairs(self.Card:GetDescendants()) do
        if child:IsA("TextLabel") or child:IsA("TextBox") or child:IsA("TextButton") then
            local orig = child.TextTransparency
            child.TextTransparency = 1
            task.delay(0.2, function()
                Tween(child, 0.4, {TextTransparency = orig})
            end)
        end
    end
end

-- Set loading state
function KeyUI:SetLoading(loading)
    if self.Destroyed then return end
    
    local label = self.VerifyBtn:FindFirstChild("Label")
    if loading then
        if label then label.Text = "⏳  Verifying..." end
        self.VerifyBtn.AutoButtonColor = false
    else
        if label then label.Text = "🔓  Verify Key" end
        self.VerifyBtn.AutoButtonColor = false
    end
end

-- Show error with shake animation
function KeyUI:ShowError(message)
    if self.Destroyed then return end
    
    self:SetLoading(false)
    self.StatusLabel.Text = "✕ " .. message
    self.StatusLabel.TextColor3 = self.Config.ERROR_COLOR
    
    -- Shake animation
    local origPos = self.Card.Position
    for i = 1, 6 do
        local offset = (i % 2 == 0) and 6 or -6
        Tween(self.Card, 0.05, {
            Position = UDim2.new(
                origPos.X.Scale, origPos.X.Offset + offset,
                origPos.Y.Scale, origPos.Y.Offset
            )
        }, Enum.EasingStyle.Linear)
        task.wait(0.05)
    end
    Tween(self.Card, 0.1, {Position = origPos})
    
    -- Flash input border red
    if self.InputStroke then
        Tween(self.InputStroke, 0.15, {
            Color = self.Config.ERROR_COLOR,
            Transparency = 0.4,
        })
        task.wait(1.5)
        if not self.Destroyed and self.InputStroke then
            Tween(self.InputStroke, 0.3, {
                Color = Color3.fromRGB(255, 255, 255),
                Transparency = 0.9,
            })
        end
    end
end

-- Show success state
function KeyUI:ShowSuccess(data)
    if self.Destroyed then return end
    
    self:SetLoading(false)
    if data and data.keyTypeLabel and data.remainingTime then
        self.StatusLabel.Text = "✓ " .. data.keyTypeLabel .. " Key | " .. data.remainingTime
    else
        self.StatusLabel.Text = "✓ Key verified successfully!"
    end
    self.StatusLabel.TextColor3 = self.Config.SUCCESS_COLOR
    
    local label = self.VerifyBtn:FindFirstChild("Label")
    if label then label.Text = "✓  Verified!" end
    
    -- Green glow animation
    if self.InputStroke then
        Tween(self.InputStroke, 0.3, {
            Color = self.Config.SUCCESS_COLOR,
            Transparency = 0.3,
        })
    end
    
    -- Scale up the card slightly
    Tween(self.Card, 0.3, {
        Size = UDim2.new(0, 430, 0, 390)
    }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
end

-- Show notification toast
function KeyUI:ShowNotification(message)
    if self.Destroyed then return end
    
    self.NotifLabel.Text = "  " .. message .. "  "
    
    -- Slide in from top
    Tween(self.NotifLabel, 0.4, {
        Position = UDim2.new(0.5, 0, 0, 20),
    }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
    
    -- Slide out after delay
    task.delay(3, function()
        if self.Destroyed then return end
        Tween(self.NotifLabel, 0.3, {
            Position = UDim2.new(0.5, 0, 0, -50),
        })
    end)
end

-- Destroy the UI with exit animation
function KeyUI:Destroy()
    if self.Destroyed then return end
    self.Destroyed = true
    
    -- Animate out
    Tween(self.Card, 0.4, {
        BackgroundTransparency = 1,
        Size = UDim2.new(0, 400, 0, 360),
    })
    Tween(self.BlurOverlay, 0.4, {BackgroundTransparency = 1})
    
    -- Fade out all text
    for _, child in ipairs(self.Card:GetDescendants()) do
        if child:IsA("TextLabel") or child:IsA("TextBox") or child:IsA("TextButton") then
            Tween(child, 0.3, {TextTransparency = 1})
        end
    end
    
    task.wait(0.5)
    
    -- Disconnect all events
    for _, conn in ipairs(self.Connections) do
        if conn and conn.Connected then
            conn:Disconnect()
        end
    end
    
    -- Remove GUI
    if self.ScreenGui then
        self.ScreenGui:Destroy()
    end
end

return KeyUI
