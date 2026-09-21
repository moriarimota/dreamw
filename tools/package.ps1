[CmdletBinding()]
param(
    [string]$ProjectRoot = '',
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$')]
    [string]$Version = ('demo-' + (Get-Date -Format 'yyyyMMdd-HHmmss')),
    [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $scriptDirectory = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
    $ProjectRoot = Split-Path -Parent $scriptDirectory
}
$projectDirectory = (Resolve-Path -LiteralPath $ProjectRoot).ProviderPath.TrimEnd([char[]]'\/')
if (-not (Test-Path -LiteralPath $projectDirectory -PathType Container)) {
    throw 'ProjectRoot must be an existing project directory.'
}
$projectPrefix = $projectDirectory + [IO.Path]::DirectorySeparatorChar
$archivePrefix = 'WitchLife/'
$entries = [System.Collections.Generic.List[object]]::new()
$entryNames = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$excludedSegments = @('user-data', 'logs', 'fixtures', 'fixture', 'tests', '.git', '.codex', 'node_modules')

function Get-SafeFile {
    param([Parameter(Mandatory)][string]$RelativePath)
    $candidate = [IO.Path]::GetFullPath((Join-Path $projectDirectory $RelativePath))
    if (-not $candidate.StartsWith($projectPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Package input escapes the project: $RelativePath"
    }
    $relative = $candidate.Substring($projectPrefix.Length)
    foreach ($segment in ($relative -split '[\\/]')) {
        if ($excludedSegments -contains $segment) { throw "Private or test path cannot be packaged: $relative" }
    }
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "Required runtime file is missing: $RelativePath" }
    $item = Get-Item -LiteralPath $candidate -Force
    $cursor = $item
    while ($null -ne $cursor -and $cursor.FullName.TrimEnd([char[]]'\/') -ne $projectDirectory) {
        if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Links and junctions are not permitted in a release: $RelativePath"
        }
        $cursor = if ($cursor -is [IO.DirectoryInfo]) { $cursor.Parent } else { $cursor.Directory }
    }
    return $item
}

function Add-PackageFile {
    param([Parameter(Mandatory)][string]$RelativePath)
    $item = Get-SafeFile -RelativePath $RelativePath
    $archiveName = $archivePrefix + ($RelativePath -replace '\\', '/')
    if (-not $entryNames.Add($archiveName)) { return }
    $entries.Add([pscustomobject]@{ Source = $item.FullName; Entry = $archiveName; Bytes = $item.Length })
}

# This list is deliberately explicit. Do not replace it with a zip of the project
# or game folder: both can contain personal saves, logs, and development fixtures.
$requiredRuntimeFiles = @(
    '启动那边的小日子.exe',
    'game/index.html',
    'game/style.css',
    'game/app.js',
    'game/navigation.js',
    'game/life.js',
    'game/storage.js',
    'game/gomoku.js',
    'game/sw.js',
    'game/manifest.webmanifest',
    'game/icon.svg',
    'game/assets/cottage-empty-v1.png',
    'game/assets/witch-walk-v1.png',
    'game/assets/dream-props-v1.png'
)
foreach ($relative in $requiredRuntimeFiles) { Add-PackageFile -RelativePath $relative }

# GitHub Pages runtime marker. It is safe to synthesize this empty file when the
# source checkout does not yet contain it; it must not pull in hosting credentials.
$sourceNoJekyll = Join-Path $projectDirectory 'game/.nojekyll'
if (Test-Path -LiteralPath $sourceNoJekyll -PathType Leaf) {
    Add-PackageFile -RelativePath 'game/.nojekyll'
} else {
    $entries.Add([pscustomobject]@{ Source = $null; Entry = $archivePrefix + 'game/.nojekyll'; Bytes = 0 })
    [void]$entryNames.Add($archivePrefix + 'game/.nojekyll')
}

foreach ($relative in @('README.md', 'AGENTS.md', '启动说明.md', 'game/README.md', 'game/验证记录.md')) {
    if (Test-Path -LiteralPath (Join-Path $projectDirectory $relative) -PathType Leaf) {
        Add-PackageFile -RelativePath $relative
    }
}

# Only Markdown documents inside docs/ are allowed. Traverse deliberately rather
# than using -Recurse, so a junction cannot include files from outside the project.
$docsDirectory = Join-Path $projectDirectory 'docs'
if (Test-Path -LiteralPath $docsDirectory -PathType Container) {
    $folders = [System.Collections.Generic.Queue[string]]::new()
    $folders.Enqueue($docsDirectory)
    while ($folders.Count -gt 0) {
        $folder = $folders.Dequeue()
        $folderItem = Get-Item -LiteralPath $folder -Force
        if (($folderItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "A documentation directory is a link or junction: $folder"
        }
        foreach ($item in (Get-ChildItem -LiteralPath $folder -Force)) {
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "A documentation input is a link or junction: $($item.FullName)"
            }
            if ($excludedSegments -contains $item.Name) { continue }
            if ($item.PSIsContainer) { $folders.Enqueue($item.FullName); continue }
            if ($item.Extension -ieq '.md') {
                Add-PackageFile -RelativePath $item.FullName.Substring($projectPrefix.Length)
            }
        }
    }
}

$ordered = @($entries | Sort-Object Entry)
Write-Output "Release allowlist: $($ordered.Count) files. Personal saves, logs, and fixtures are excluded."
foreach ($entry in $ordered) { Write-Output $entry.Entry }
if ($ValidateOnly) { return }

$releaseDirectory = Join-Path $projectDirectory 'releases'
if (-not (Test-Path -LiteralPath $releaseDirectory)) {
    [void](New-Item -ItemType Directory -Path $releaseDirectory)
}
$releaseItem = Get-Item -LiteralPath $releaseDirectory -Force
if (-not $releaseItem.PSIsContainer -or ($releaseItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw 'The releases destination must be a regular project directory, not a link.'
}
$archivePath = Join-Path $releaseDirectory ('WitchLife-' + $Version + '.zip')
if (Test-Path -LiteralPath $archivePath) { throw "Release already exists; choose a new -Version: $archivePath" }
$partialPath = $archivePath + '.partial'
if (Test-Path -LiteralPath $partialPath) { throw "An unfinished package exists; choose a new -Version: $partialPath" }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [IO.File]::Open($partialPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
$zip = $null
try {
    $zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
    foreach ($entry in $ordered) {
        if ($null -eq $entry.Source) {
            [void]$zip.CreateEntry($entry.Entry)
        } else {
            [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $entry.Source, $entry.Entry, [IO.Compression.CompressionLevel]::Optimal)
        }
    }
    $manifestEntry = $zip.CreateEntry($archivePrefix + 'PACKAGE-CONTENTS.txt')
    $writer = [IO.StreamWriter]::new($manifestEntry.Open(), [Text.UTF8Encoding]::new($false))
    try {
        $writer.WriteLine('WitchLife release ' + $Version)
        $writer.WriteLine('Created UTC: ' + [DateTime]::UtcNow.ToString('o'))
        $writer.WriteLine('No personal save data, runtime logs, test fixtures, or credentials are included.')
        $writer.WriteLine('Extract the entire WitchLife directory. The launcher and game/ must stay together.')
        $writer.WriteLine('The user-data/ directory is created locally when the desktop game first saves.')
        $writer.WriteLine('')
        foreach ($entry in $ordered) { $writer.WriteLine($entry.Entry) }
    } finally { $writer.Dispose() }
} finally {
    if ($null -ne $zip) { $zip.Dispose() }
    $stream.Dispose()
}

# Only this one fully resolved file is moved; no recursive delete or move occurs.
Move-Item -LiteralPath $partialPath -Destination $archivePath
$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
Write-Output "Created: $archivePath"
Write-Output "SHA256: $hash"
