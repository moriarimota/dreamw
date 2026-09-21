$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fixture = Join-Path $PSScriptRoot ('smoke-fixture-' + [Guid]::NewGuid().ToString('N'))
$fixture = [System.IO.Path]::GetFullPath($fixture)
$fixtureExe = Join-Path $fixture 'launcher.exe'
$checks = New-Object System.Collections.Generic.List[object]
$utf8 = New-Object System.Text.UTF8Encoding($false)
$process = $null
$second = $null

function Request-Raw([string] $method, [string] $path, [string] $body = '', [hashtable] $headers = @{}) {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.ReceiveTimeout = 5000
    $client.SendTimeout = 5000
    $client.Connect('127.0.0.1', 18765)
    try {
        $stream = $client.GetStream()
        $payload = $utf8.GetBytes($body)
        $head = "$method $path HTTP/1.1`r`n"
        if (-not $headers.ContainsKey('Host')) { $head += "Host: 127.0.0.1:18765`r`n" }
        foreach ($name in $headers.Keys) { $head += "$($name): $($headers[$name])`r`n" }
        if ($method -eq 'PUT' -and -not $headers.ContainsKey('Content-Length')) { $head += "Content-Length: $($payload.Length)`r`n" }
        $head += "Connection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        if ($payload.Length -gt 0) { $stream.Write($payload, 0, $payload.Length) }
        $memory = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 8192
        while ($true) {
            try { $read = $stream.Read($buffer, 0, $buffer.Length) }
            catch {
                if ($memory.Length -eq 0) { throw }
                break
            }
            if ($read -le 0) { break }
            $memory.Write($buffer, 0, $read)
            $partial = [System.Text.Encoding]::ASCII.GetString($memory.ToArray())
            $headerEnd = $partial.IndexOf("`r`n`r`n")
            if ($headerEnd -ge 0) {
                $headerText = $partial.Substring(0, $headerEnd)
                if ($headerText -match '(?im)^Content-Length:\s*(\d+)') {
                    $expected = if ($method -eq 'HEAD') { 0 } else { [int]$Matches[1] }
                    if ($memory.Length -ge $headerEnd + 4 + $expected) { break }
                }
            }
        }
        $response = $utf8.GetString($memory.ToArray())
        $split = $response.IndexOf("`r`n`r`n")
        if ($split -lt 0) { throw 'Malformed response' }
        return [pscustomobject]@{
            Status = [int]($response.Split(' ')[1])
            Headers = $response.Substring(0, $split)
            Body = $response.Substring($split + 4)
        }
    } finally { $client.Dispose() }
}
function Check([string] $name, [bool] $passed) {
    $checks.Add([pscustomobject]@{ name = $name; passed = $passed })
    if (-not $passed) { throw "Failed: $name" }
}

try {
    [void][System.IO.Directory]::CreateDirectory((Join-Path $fixture 'game'))
    Copy-Item -LiteralPath (Join-Path $projectRoot '启动那边的小日子.exe') -Destination $fixtureExe
    [System.IO.File]::WriteAllText((Join-Path $fixture 'game/index.html'), '<!doctype html><title>Launcher test</title>', $utf8)
    [System.IO.File]::WriteAllText((Join-Path $fixture 'game/asset.js'), 'window.launcherTest=true;', $utf8)
    [System.IO.File]::WriteAllText((Join-Path $fixture 'game/private.log'), 'not served', $utf8)
    [System.IO.File]::WriteAllText((Join-Path $fixture 'game/.hidden.json'), '{}', $utf8)
    $process = Start-Process -FilePath $fixtureExe -ArgumentList '--headless' -WindowStyle Hidden -PassThru
    $ready = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Milliseconds 150
        try {
            $health = Request-Raw 'GET' '/__health'
            if ($health.Status -eq 200) { $ready = $true; break }
        } catch { }
        if ($process.HasExited) { throw 'Fixture server exited unexpectedly; port may be occupied.' }
    }
    Check 'server starts without a browser' ($ready -and -not $process.HasExited)
    $meta = $health.Body | ConvertFrom-Json
    Check 'health identifies app and version' ($meta.app -eq 'witchlife' -and $meta.version -eq 2)
    $index = Request-Raw 'GET' '/'
    Check 'root serves index' ($index.Status -eq 200 -and $index.Body.Contains('Launcher test'))
    $asset = Request-Raw 'GET' '/asset.js'
    Check 'JavaScript MIME and contents' ($asset.Status -eq 200 -and $asset.Headers.Contains('text/javascript') -and $asset.Body.Contains('launcherTest'))
    $head = Request-Raw 'HEAD' '/asset.js'
    Check 'HEAD has no response body' ($head.Status -eq 200 -and $head.Body.Length -eq 0)
    Check 'missing file is 404' ((Request-Raw 'GET' '/missing.png').Status -eq 404)
    Check 'missing save is 404' ((Request-Raw 'GET' '/api/state').Status -eq 404)
    $safeHeaders = @{ Origin = 'http://127.0.0.1:18765'; 'Content-Type' = 'application/json' }
    $json1 = '{"version":2,"name":"月亮魔女","steps":1}'
    $json2 = '{"version":2,"name":"月亮魔女","steps":2}'
    Check 'JSON save accepts UTF-8' ((Request-Raw 'PUT' '/api/state' $json1 $safeHeaders).Status -eq 200)
    $loaded = Request-Raw 'GET' '/api/state'
    Check 'GET returns the saved JSON exactly' ($loaded.Status -eq 200 -and $loaded.Body -eq $json1)
    Check 'second save succeeds' ((Request-Raw 'PUT' '/api/state' $json2 $safeHeaders).Status -eq 200)
    Check 'atomic replace retains previous save' ([System.IO.File]::ReadAllText((Join-Path $fixture 'user-data/state.previous.json')) -eq $json1)
    Check 'invalid JSON is rejected' ((Request-Raw 'PUT' '/api/state' '{bad}' $safeHeaders).Status -eq 400)
    Check 'JSON array cannot replace game state' ((Request-Raw 'PUT' '/api/state' '[]' $safeHeaders).Status -eq 400)
    Check 'missing Origin is rejected' ((Request-Raw 'PUT' '/api/state' '{}' @{ 'Content-Type' = 'application/json' }).Status -eq 403)
    Check 'foreign Origin is rejected' ((Request-Raw 'PUT' '/api/state' '{}' @{ Origin = 'https://example.org'; 'Content-Type' = 'application/json' }).Status -eq 403)
    Check 'wrong Content-Type is rejected' ((Request-Raw 'PUT' '/api/state' '{}' @{ Origin = 'http://127.0.0.1:18765'; 'Content-Type' = 'text/plain' }).Status -eq 415)
    Check 'oversized save rejected before body read' ((Request-Raw 'PUT' '/api/state' '' @{ Origin = 'http://127.0.0.1:18765'; 'Content-Type' = 'application/json'; 'Content-Length' = '2097153' }).Status -eq 413)
    Check 'host rebinding rejected' ((Request-Raw 'GET' '/' '' @{ Host = 'example.org:18765' }).Status -eq 403)
    Check 'cross-site fetch rejected' ((Request-Raw 'GET' '/' '' @{ 'Sec-Fetch-Site' = 'cross-site' }).Status -eq 403)
    Check 'plain traversal rejected' ((Request-Raw 'GET' '/../user-data/state.json').Status -eq 403)
    Check 'encoded traversal rejected' ((Request-Raw 'GET' '/%2e%2e/user-data/state.json').Status -eq 403)
    Check 'double encoded traversal rejected' ((Request-Raw 'GET' '/%252e%252e/user-data/state.json').Status -eq 403)
    Check 'backslash traversal rejected' ((Request-Raw 'GET' '/..%5cuser-data/state.json').Status -eq 403)
    Check 'logs are not served' ((Request-Raw 'GET' '/private.log').Status -eq 404)
    Check 'dotfiles are not served' ((Request-Raw 'GET' '/.hidden.json').Status -eq 403)
    Check 'unsupported method rejected' ((Request-Raw 'POST' '/api/state').Status -eq 405)
    Check 'rejected requests preserve state' ((Request-Raw 'GET' '/api/state').Body -eq $json2)
    $second = Start-Process -FilePath $fixtureExe -ArgumentList '--headless' -WindowStyle Hidden -PassThru
    Check 'second launcher reuses healthy server' ($second.WaitForExit(45000) -and $second.ExitCode -eq 0 -and -not $process.HasExited)
    $listener = @([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object Port -eq 18765)
    Check 'server listener is loopback only' ($listener.Count -eq 1 -and $listener[0].Address.ToString() -eq '127.0.0.1')
    $result = [pscustomobject]@{ testedAt = [DateTime]::UtcNow.ToString('o'); allPassed = $true; count = $checks.Count; checks = $checks }
    [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot 'smoke-results.json'), ($result | ConvertTo-Json -Depth 5), $utf8)
    Write-Output "Passed $($checks.Count) launcher checks. Production user-data was not touched."
} finally {
    if ($checks.Count -gt 0) {
        Write-Output "Completed checks: $($checks.Count); last check: $($checks[$checks.Count - 1].name)"
    }
    if ($null -ne $process -and -not $process.HasExited) { Stop-Process -Id $process.Id; $process.WaitForExit() }
    if ($null -ne $second -and -not $second.HasExited) { Stop-Process -Id $second.Id; $second.WaitForExit() }
    $allowedPrefix = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\smoke-fixture-'
    if ($fixture.StartsWith($allowedPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and [System.IO.Directory]::Exists($fixture)) {
        Remove-Item -LiteralPath $fixture -Recurse -Force
    }
}
