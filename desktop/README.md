# Windows desktop launcher

This is a small .NET Framework Windows GUI executable, compiled with the Windows C# compiler. It runs the same static web game used by the web release. No Python, Node.js, installer, startup registration, or Windows service is required at runtime.

## Build and verify

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\WitchLife\desktop\build.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\WitchLife\desktop\smoke.ps1
```

The script execution policy above applies to that PowerShell process only. The build writes `../启动那边的小日子.exe`. The smoke script creates a temporary isolated fixture under this directory, tests it on port 18765, stops its processes, and removes the fixture. It never changes production `user-data`. Do not run smoke tests while the actual game server is using port 18765. Results are recorded in `smoke-results.json`.

## Runtime and lifecycle

- All paths derive from the executable's directory, so the complete folder can be moved together.
- Static files come exclusively from `../game/`; only a web asset extension allowlist is served.
- Only IPv4 loopback `127.0.0.1:18765` is bound. Unknown Host headers, cross-site requests, traversal paths, dotfiles and reparse points are rejected.
- Normal launch uses an Edge/Chrome app window with profile and cache under `../user-data/`. Fallback default-browser use is disclosed to the user.
- Closing the app window does not kill the server. A tray icon offers reopen and exit. `--headless` omits the browser and tray and runs until its process is stopped.
- A second launcher verifies app ID, protocol version and installation-root fingerprint before reusing a healthy server. Occupied unrelated ports are never terminated.

## Frontend API

All API responses use JSON and `Cache-Control: no-store`.

| Route | Contract |
| --- | --- |
| `GET /__health` | `200 {"app":"witchlife","version":2,"rootId":"…"}` |
| `GET /api/state` | `200` with saved JSON bytes, or `404 {"error":"no_save"}` |
| `PUT /api/state` | JSON object, max 2 MiB UTF-8; requires `Content-Type: application/json` and `Origin: http://127.0.0.1:18765`; success `200 {"ok":true}` |

Browser same-origin `fetch` sets the correct Origin for PUT. No CORS permissions are granted. `Content-Length` is required; ordinary browser fetch supplies it. Errors are JSON with appropriate 4xx status. Invalid input does not replace an existing save.

Save writes flush a pending file, then atomically replace `state.json`, retaining the previous contents as `state.previous.json`. The launcher validates only that the save is a bounded JSON object; game schema/version validation belongs to the frontend. It does not send or synchronize data remotely.

## Verified

29 isolated checks cover startup, health, index/JS/HEAD serving, MIME, absent saves, UTF-8 round trip, atomic backup, invalid JSON, object restriction, missing/foreign Origin, Content-Type, size limit, Host, cross-site fetch, raw/encoded/double-encoded/backslash traversal, log/dotfile protection, method restriction, save preservation, duplicate reuse, and loopback-only binding.

Browser app window appearance and tray click behavior require interactive validation separately. The executable is unsigned; it does not claim a trusted publisher or bypass Windows protections.
