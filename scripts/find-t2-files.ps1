# Read-only search of every accessible local fixed/removable drive.
# By default finds relevant file and folder names. -Deep additionally checks
# small source/document files for project-specific text (never uploads contents).
[CmdletBinding()]
param(
    [switch]$Deep,
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $outputDir = [Environment]::GetFolderPath('Desktop')
    if (-not (Test-Path -LiteralPath $outputDir)) { $outputDir = $env:USERPROFILE }
    $OutputPath = Join-Path $outputDir ("T2_Dosya_Tarama_{0}.csv" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))
}

# Match names of folders or files, not every child of a matching repository.
$namePattern = '(?i)(?:t2[-_ .]*(?:software|yaz[iı]l[iı]m)|leave[-_ .]*(?:approval|form|table|request|rules)|izin[-_ .]*(?:form|talep|y[oö]netim|tablo)|(?:personel|employee)[-_ .]*(?:izin|leave)|authcontroller|apiintegrationtest|staj|furkanaygar|tanapaydin)'
$contentPattern = '(?i)(?:t2[-_ ]*(?:software|yaz[iı]l[iı]m)|leave[-_ ]*approval|personel[-_ ]*izin|izin[-_ ]*(?:talep|y[oö]netim)|/api/admin/approve-leaves|class\s+LeaveRequest|com\.kaankaya\.leave)'
$sourceExts = @('.java', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.xml', '.sql', '.py', '.ps1', '.html', '.css', '.yml', '.yaml', '.properties', '.vue', '.cs')
$counts = @{ Folders = 0; Files = 0; Matches = 0; Skipped = 0 }

$roots = @()
foreach ($drive in [System.IO.DriveInfo]::GetDrives()) {
    try {
        if ($drive.IsReady -and ($drive.DriveType -eq [System.IO.DriveType]::Fixed -or
                $drive.DriveType -eq [System.IO.DriveType]::Removable)) {
            $roots += $drive.RootDirectory.FullName
        }
    } catch { $counts.Skipped++ }
}
if ($roots.Count -eq 0) { throw 'No readable local drives were detected.' }

$writer = New-Object System.IO.StreamWriter($OutputPath, $false, (New-Object System.Text.UTF8Encoding($true)))
try {
    $writer.WriteLine('MatchType,Path')
    $pending = New-Object 'System.Collections.Generic.Stack[string]'
    foreach ($root in $roots) { $pending.Push($root) }
    Write-Host ('Scanning: ' + ($roots -join ', '))
    while ($pending.Count -gt 0) {
        $directory = $pending.Pop()
        $counts.Folders++
        try {
            $entries = @(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop)
        } catch {
            $counts.Skipped++
            continue
        }
        foreach ($entry in $entries) {
            try {
                if (($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
                if ($entry.PSIsContainer) { $pending.Push($entry.FullName) }
                else { $counts.Files++ }
                $matchType = $null
                if ($entry.Name -match $namePattern) {
                    $matchType = if ($entry.PSIsContainer) { 'FolderName' } else { 'FileName' }
                } elseif ($Deep -and -not $entry.PSIsContainer -and $entry.Length -le 1048576 -and
                          $sourceExts -contains $entry.Extension.ToLowerInvariant()) {
                    $content = [System.IO.File]::ReadAllText($entry.FullName)
                    if ($content -match $contentPattern) { $matchType = 'SourceContent' }
                }
                if ($null -ne $matchType) {
                    $escaped = $entry.FullName.Replace('"', '""')
                    $writer.WriteLine(('"{0}","{1}"' -f $matchType, $escaped))
                    $counts.Matches++
                }
            } catch { $counts.Skipped++ }
        }
        if ($counts.Folders % 500 -eq 0) {
            Write-Progress -Activity 'T2 project file search (read-only)' -Status ("Folders: {0} | Files: {1} | Matches: {2} | Skipped: {3}" -f $counts.Folders, $counts.Files, $counts.Matches, $counts.Skipped)
            $writer.Flush()
        }
    }
} finally {
    $writer.Dispose()
    Write-Progress -Activity 'T2 project file search (read-only)' -Completed
}
Write-Host 'Scan complete (no files modified).' -ForegroundColor Green
Write-Host ("Folders: {0}; Files: {1}; Matches: {2}; Skipped: {3}" -f $counts.Folders, $counts.Files, $counts.Matches, $counts.Skipped)
Write-Host ('CSV report: ' + $OutputPath)
