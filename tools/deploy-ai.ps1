[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$cloudDirectory = Join-Path $projectDirectory 'server\cloudflare'
$privateDirectory = Join-Path $projectDirectory 'user-data'
$wrangler = Join-Path $cloudDirectory 'node_modules\.bin\wrangler.cmd'
Write-Host '梦乡 · 手机 AI 部署助手'
Write-Host '使用你自己的 Cloudflare 账号（保持 Free 免费方案），把接口部署为 HTTPS 服务。'
Write-Host 'DeepSeek 密钥将保存到该账号的加密 Secret 中；模型调用仍按 DeepSeek API 计费。'
Write-Host '默认每日最多80次；不会上传游戏存档或电脑文件。'
Push-Location $cloudDirectory
try {
    if (-not (Test-Path -LiteralPath $wrangler)) {
        & npm.cmd ci --no-fund --no-audit
        if ($LASTEXITCODE -ne 0) { throw '部署工具安装未完成。' }
    }
    & $wrangler login
    if ($LASTEXITCODE -ne 0) { throw 'Cloudflare 登录未完成。' }
    $secureKey = Read-Host '输入要保存到 Cloudflare 的 DeepSeek API Key（输入不显示）' -AsSecureString
    if ($secureKey.Length -eq 0) { throw '没有输入密钥，未部署。' }
    $tokenBytes = New-Object byte[] 32
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($tokenBytes) } finally { $random.Dispose() }
    $accessToken = [Convert]::ToBase64String($tokenBytes)
    $deployOutput = & $wrangler deploy 2>&1
    $deployCode = $LASTEXITCODE
    $deployOutput | ForEach-Object { Write-Host $_ }
    if ($deployCode -ne 0) { throw '接口部署未完成，没有上传密钥。' }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    try {
        $secretInput = @{ DEEPSEEK_API_KEY=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr); DREAMW_ACCESS_TOKEN=$accessToken } | ConvertTo-Json -Compress
        $secretInput | & $wrangler secret bulk
        if ($LASTEXITCODE -ne 0) { throw 'Secret 设置未完成，请重新运行部署助手。' }
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $secretInput = $null
    }
    $address = [regex]::Match(($deployOutput -join "`n"),'https://[a-zA-Z0-9.-]+\.workers\.dev').Value
    New-Item -ItemType Directory -Path $privateDirectory -Force | Out-Null
    $settings = @{ url=$address; token=((ConvertTo-SecureString $accessToken -AsPlainText -Force) | ConvertFrom-SecureString) }
    [IO.File]::WriteAllText((Join-Path $privateDirectory 'ai-online.json'),($settings | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
    Write-Host ''
    Write-Host '部署完成。手机游戏 → 存档与设置 → AI 连接：'
    Write-Host ('AI 服务地址：' + $address)
    Write-Host ('访问口令：' + $accessToken)
    Write-Host '口令只填写到你自己的游戏，不发到聊天或 GitHub。每次重新部署助手会更换口令。'
    Write-Host '先点检查连接，再试一句聊天。电脑关机后手机仍可连接；桌宠便笺暂时使用本机助手。'
} finally { Pop-Location }
