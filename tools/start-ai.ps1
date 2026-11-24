[CmdletBinding()]
param([switch]$Configure)
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$privateDirectory = Join-Path $projectDirectory 'user-data'
$configurationPath = Join-Path $privateDirectory 'ai-connection.json'
function Unprotect-LocalSecret([string]$value) {
    $secure = ConvertTo-SecureString $value
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
if ($Configure -or -not (Test-Path -LiteralPath $configurationPath)) {
    Write-Host '梦乡 · DeepSeek 连接助手'
    Write-Host '密钥只保存在这台电脑，使用当前 Windows 账户加密。不要把密钥发到聊天或 GitHub。'
    $modelName = Read-Host '模型名称（直接回车使用 deepseek-flash）'
    if ([string]::IsNullOrWhiteSpace($modelName)) { $modelName = 'deepseek-flash' }
    $secureKey = Read-Host '输入 DeepSeek API Key（输入时不显示）' -AsSecureString
    if ($secureKey.Length -eq 0) { throw '没有输入密钥，未保存配置。' }
    $tokenBytes = New-Object byte[] 32
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($tokenBytes) } finally { $random.Dispose() }
    $accessToken = [Convert]::ToBase64String($tokenBytes)
    $settings = @{ apiBase='https://api.deepseek.com'; model=$modelName; key=($secureKey | ConvertFrom-SecureString); token=((ConvertTo-SecureString $accessToken -AsPlainText -Force) | ConvertFrom-SecureString) }
    New-Item -ItemType Directory -Path $privateDirectory -Force | Out-Null
    [IO.File]::WriteAllText($configurationPath,($settings | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
}
$settings = Get-Content -LiteralPath $configurationPath -Raw -Encoding UTF8 | ConvertFrom-Json
$env:DEEPSEEK_API_KEY = Unprotect-LocalSecret $settings.key
$env:DREAMW_ACCESS_TOKEN = Unprotect-LocalSecret $settings.token
$env:DREAMW_AI_BASE = $settings.apiBase
$env:DREAMW_AI_MODEL = $settings.model
$env:DREAMW_HOST = '127.0.0.1'
$env:PORT = '18768'
$env:DREAMW_PET_OUTBOX = Join-Path $privateDirectory 'dangdang-outbox.json'
Write-Host ''
Write-Host '游戏 → 存档与设置 → AI 连接：'
Write-Host 'AI 服务地址：http://127.0.0.1:18768'
Write-Host ('访问口令：' + $env:DREAMW_ACCESS_TOKEN)
Write-Host '这不是模型密钥。只在你自己的游戏中填写；关闭此窗口会停止 AI 服务。'
try { & node (Join-Path $projectDirectory 'server/ai-server.js') }
finally { Remove-Item Env:DEEPSEEK_API_KEY,Env:DREAMW_ACCESS_TOKEN,Env:DREAMW_PET_OUTBOX -ErrorAction SilentlyContinue }
