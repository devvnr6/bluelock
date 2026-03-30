--[[
    BlueLock — Script Hub Module
    Launched after successful key verification
]]

local ScriptHub = {}

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local function Tween(obj, dur, props)
    local t = TweenService:Create(obj, TweenInfo.new(dur, Enum.EasingStyle.Quart, Enum.EasingDirection.Out), props)
    t:Play()
    return t
end

local function CreateCorner(parent, r)
    local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, r or 8); c.Parent = parent; return c
end

function ScriptHub.Launch(config)
    local gui = Instance.new("ScreenGui")
    gui.Name = "BlueLockScriptHub"
    gui.ResetOnSpawn = false
    gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    gui.IgnoreGuiInset = true
    gui.Parent = PlayerGui

    -- Main Frame
    local main = Instance.new("Frame")
    main.Name = "Main"
    main.Size = UDim2.new(0, 580, 0, 400)
    main.Position = UDim2.new(0.5, 0, 0.5, 0)
    main.AnchorPoint = Vector2.new(0.5, 0.5)
    main.BackgroundColor3 = config.CARD_COLOR
    main.BackgroundTransparency = 0.02
    main.ClipsDescendants = true
    main.Parent = gui
    CreateCorner(main, 14)

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(255,255,255)
    stroke.Thickness = 1
    stroke.Transparency = 0.92
    stroke.Parent = main

    -- Title Bar
    local titleBar = Instance.new("Frame")
    titleBar.Size = UDim2.new(1, 0, 0, 44)
    titleBar.BackgroundColor3 = Color3.fromRGB(14, 14, 20)
    titleBar.BackgroundTransparency = 0.3
    titleBar.Parent = main

    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, -16, 1, 0)
    title.Position = UDim2.new(0, 16, 0, 0)
    title.BackgroundTransparency = 1
    title.Text = "⬡ " .. config.HUB_NAME .. " — Script Hub"
    title.TextColor3 = config.TEXT_COLOR
    title.TextSize = 14
    title.Font = Enum.Font.GothamBold
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = titleBar

    -- Close Button
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 36, 0, 36)
    closeBtn.Position = UDim2.new(1, -40, 0, 4)
    closeBtn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    closeBtn.BackgroundTransparency = 0.95
    closeBtn.Text = "✕"
    closeBtn.TextColor3 = config.TEXT_SECONDARY
    closeBtn.TextSize = 14
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.Parent = titleBar
    CreateCorner(closeBtn, 8)

    closeBtn.MouseButton1Click:Connect(function()
        Tween(main, 0.3, {BackgroundTransparency = 1, Size = UDim2.new(0, 560, 0, 380)})
        task.wait(0.35)
        gui:Destroy()
    end)

    -- Sidebar
    local sidebar = Instance.new("Frame")
    sidebar.Size = UDim2.new(0, 150, 1, -44)
    sidebar.Position = UDim2.new(0, 0, 0, 44)
    sidebar.BackgroundColor3 = Color3.fromRGB(12, 12, 18)
    sidebar.BackgroundTransparency = 0.3
    sidebar.Parent = main

    local sideLayout = Instance.new("UIListLayout")
    sideLayout.Padding = UDim.new(0, 4)
    sideLayout.SortOrder = Enum.SortOrder.LayoutOrder
    sideLayout.Parent = sidebar

    local sidePad = Instance.new("UIPadding")
    sidePad.PaddingTop = UDim.new(0, 8)
    sidePad.PaddingLeft = UDim.new(0, 8)
    sidePad.PaddingRight = UDim.new(0, 8)
    sidePad.Parent = sidebar

    -- Script content area
    local contentArea = Instance.new("ScrollingFrame")
    contentArea.Name = "Content"
    contentArea.Size = UDim2.new(1, -158, 1, -52)
    contentArea.Position = UDim2.new(0, 154, 0, 48)
    contentArea.BackgroundTransparency = 1
    contentArea.ScrollBarThickness = 3
    contentArea.ScrollBarImageColor3 = config.ACCENT_COLOR
    contentArea.CanvasSize = UDim2.new(0, 0, 0, 600)
    contentArea.Parent = main

    local contentLayout = Instance.new("UIListLayout")
    contentLayout.Padding = UDim.new(0, 8)
    contentLayout.SortOrder = Enum.SortOrder.LayoutOrder
    contentLayout.Parent = contentArea

    local contentPad = Instance.new("UIPadding")
    contentPad.PaddingTop = UDim.new(0, 8)
    contentPad.PaddingLeft = UDim.new(0, 12)
    contentPad.PaddingRight = UDim.new(0, 12)
    contentPad.Parent = contentArea

    -- Script categories
    local categories = {
        {name = "🎯 Combat", scripts = {"Aimbot", "Silent Aim", "Kill Aura"}},
        {name = "👁️ Visuals", scripts = {"ESP", "Chams", "Tracers"}},
        {name = "🏃 Movement", scripts = {"Speed", "Fly", "Noclip"}},
        {name = "🛠️ Utility", scripts = {"Infinite Jump", "Anti-AFK", "Chat Spy"}},
        {name = "⚙️ Settings", scripts = {}},
    }

    local function createScriptButton(name, parent)
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(1, 0, 0, 38)
        btn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        btn.BackgroundTransparency = 0.94
        btn.Text = ""
        btn.AutoButtonColor = false
        btn.Parent = parent
        CreateCorner(btn, 8)

        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, -16, 1, 0)
        label.Position = UDim2.new(0, 16, 0, 0)
        label.BackgroundTransparency = 1
        label.Text = name
        label.TextColor3 = config.TEXT_COLOR
        label.TextSize = 13
        label.Font = Enum.Font.GothamSemibold
        label.TextXAlignment = Enum.TextXAlignment.Left
        label.Parent = btn

        local toggle = Instance.new("Frame")
        toggle.Size = UDim2.new(0, 36, 0, 20)
        toggle.Position = UDim2.new(1, -44, 0.5, 0)
        toggle.AnchorPoint = Vector2.new(0, 0.5)
        toggle.BackgroundColor3 = Color3.fromRGB(60, 60, 80)
        toggle.Parent = btn
        CreateCorner(toggle, 10)

        local dot = Instance.new("Frame")
        dot.Size = UDim2.new(0, 14, 0, 14)
        dot.Position = UDim2.new(0, 3, 0.5, 0)
        dot.AnchorPoint = Vector2.new(0, 0.5)
        dot.BackgroundColor3 = Color3.fromRGB(150, 150, 170)
        dot.Parent = toggle
        CreateCorner(dot, 7)

        local enabled = false
        btn.MouseButton1Click:Connect(function()
            enabled = not enabled
            if enabled then
                Tween(toggle, 0.25, {BackgroundColor3 = config.ACCENT_COLOR})
                Tween(dot, 0.25, {Position = UDim2.new(0, 19, 0.5, 0), BackgroundColor3 = Color3.new(1,1,1)})
            else
                Tween(toggle, 0.25, {BackgroundColor3 = Color3.fromRGB(60, 60, 80)})
                Tween(dot, 0.25, {Position = UDim2.new(0, 3, 0.5, 0), BackgroundColor3 = Color3.fromRGB(150,150,170)})
            end
        end)

        btn.MouseEnter:Connect(function()
            Tween(btn, 0.15, {BackgroundTransparency = 0.88})
        end)
        btn.MouseLeave:Connect(function()
            Tween(btn, 0.15, {BackgroundTransparency = 0.94})
        end)

        return btn
    end

    local function showCategory(cat)
        for _, child in ipairs(contentArea:GetChildren()) do
            if child:IsA("TextButton") or child:IsA("TextLabel") and child.Name == "CatTitle" then
                child:Destroy()
            end
        end

        local catTitle = Instance.new("TextLabel")
        catTitle.Name = "CatTitle"
        catTitle.Size = UDim2.new(1, 0, 0, 30)
        catTitle.BackgroundTransparency = 1
        catTitle.Text = cat.name
        catTitle.TextColor3 = config.TEXT_COLOR
        catTitle.TextSize = 16
        catTitle.Font = Enum.Font.GothamBold
        catTitle.TextXAlignment = Enum.TextXAlignment.Left
        catTitle.Parent = contentArea

        for _, scriptName in ipairs(cat.scripts) do
            createScriptButton(scriptName, contentArea)
        end
    end

    -- Create sidebar buttons
    for i, cat in ipairs(categories) do
        local sideBtn = Instance.new("TextButton")
        sideBtn.Size = UDim2.new(1, 0, 0, 34)
        sideBtn.BackgroundColor3 = i == 1 and config.ACCENT_COLOR or Color3.fromRGB(255,255,255)
        sideBtn.BackgroundTransparency = i == 1 and 0.85 or 0.96
        sideBtn.Text = cat.name
        sideBtn.TextColor3 = i == 1 and config.ACCENT_COLOR or config.TEXT_SECONDARY
        sideBtn.TextSize = 12
        sideBtn.Font = Enum.Font.GothamSemibold
        sideBtn.AutoButtonColor = false
        sideBtn.LayoutOrder = i
        sideBtn.Parent = sidebar
        CreateCorner(sideBtn, 8)

        sideBtn.MouseButton1Click:Connect(function()
            for _, c in ipairs(sidebar:GetChildren()) do
                if c:IsA("TextButton") then
                    Tween(c, 0.2, {BackgroundTransparency = 0.96, TextColor3 = config.TEXT_SECONDARY})
                    c.BackgroundColor3 = Color3.fromRGB(255,255,255)
                end
            end
            sideBtn.BackgroundColor3 = config.ACCENT_COLOR
            Tween(sideBtn, 0.2, {BackgroundTransparency = 0.85, TextColor3 = config.ACCENT_COLOR})
            showCategory(cat)
        end)
    end

    -- Show first category by default
    showCategory(categories[1])

    -- Entrance animation
    main.BackgroundTransparency = 1
    main.Size = UDim2.new(0, 560, 0, 380)
    Tween(main, 0.5, {BackgroundTransparency = 0.02, Size = UDim2.new(0, 580, 0, 400)}, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

    for _, desc in ipairs(main:GetDescendants()) do
        if desc:IsA("TextLabel") or desc:IsA("TextButton") then
            local orig = desc.TextTransparency
            desc.TextTransparency = 1
            task.delay(0.15, function()
                Tween(desc, 0.4, {TextTransparency = orig})
            end)
        end
    end

    -- Dragging
    local dragging, dragInput, dragStart, startPos
    titleBar.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging = true; dragStart = input.Position; startPos = main.Position
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then dragging = false end
            end)
        end
    end)
    titleBar.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement then dragInput = input end
    end)
    game:GetService("UserInputService").InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            local d = input.Position - dragStart
            main.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
        end
    end)
end

return ScriptHub
