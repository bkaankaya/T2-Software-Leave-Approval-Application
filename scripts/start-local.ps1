# Windows PowerShell 5.1+ (also works with PowerShell 7 on Windows).
# Starts the backend and frontend in two visible terminal windows.
[CmdletBinding()]
param(
    [switch]$CheckOnly,
    [switch]$SetupAdmin,
    [ValidateSet('Both', 'Backend', 'Frontend')]
    [string]$Mode = 'Both'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root '1.giris'

function Require-Command([string]$name, [string]$installHint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Missing prerequisite: $name. $installHint"
    }
}

Require-Command 'java' 'Install JDK 21 and reopen PowerShell.'
Require-Command 'mvn' 'Install Maven 3.9+ and add its bin directory to PATH.'
Require-Command 'node' 'Install Node.js 22.12+ and reopen PowerShell.'
Require-Command 'npm' 'Install npm with Node.js.'

$javaText = ((& java --version) | Select-Object -First 1)
if ($LASTEXITCODE -ne 0 -or $javaText -notmatch '(?:openjdk|java)\s+(\d+)') {
    throw 'Java 21+ is required. Please check java --version.'
}
$javaMajor = [int]$Matches[1]
if ($javaMajor -lt 21) { throw "Java 21+ is required (found $javaMajor)." }

$mavenText = ((& mvn -version) | Select-Object -First 1)
if ($LASTEXITCODE -ne 0 -or $mavenText -notmatch 'Apache Maven\s+(\d+)\.(\d+)') {
    throw 'Maven 3.9+ is required. Please check mvn -version.'
}
$mavenMajor = [int]$Matches[1]
$mavenMinor = [int]$Matches[2]
if ($mavenMajor -lt 3 -or ($mavenMajor -eq 3 -and $mavenMinor -lt 9)) {
    throw "Maven 3.9+ is required (found $mavenMajor.$mavenMinor)."
}

$nodeText = ((& node --version) | Select-Object -First 1).Trim().TrimStart('v')
$nodeVersion = [version]$nodeText
if ($nodeVersion.Major -lt 22 -or ($nodeVersion.Major -eq 22 -and $nodeVersion -lt [version]'22.12.0')) {
    throw "Node.js 22.12+ is required (found $nodeText)."
}

if (-not (Test-Path -LiteralPath (Join-Path $backendDir 'pom.xml')) -or
    -not (Test-Path -LiteralPath (Join-Path $frontendDir 'package-lock.json'))) {
    throw 'Required project files are missing. Run this script from a complete repository clone.'
}

if ($CheckOnly) {
    Write-Host 'Prerequisites and project layout look OK.' -ForegroundColor Green
    Write-Host ('Java: ' + $javaMajor + ' | Maven: ' + $mavenMajor + '.' + $mavenMinor + ' | Node.js: ' + $nodeText)
    Write-Host ('Repo: ' + $root)
    return
}

if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
    $bytes = New-Object byte[] 32
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) }
    finally { $generator.Dispose() }
    $env:JWT_SECRET = [Convert]::ToBase64String($bytes)
    Write-Host 'Generated an in-memory JWT signing key for this local session.'
}

if ($SetupAdmin) {
    if ($Mode -ne 'Both') { throw '-SetupAdmin is only available with -Mode Both.' }
    $username = (Read-Host 'Choose an administrator username (3-80 letters/digits/._-)').Trim()
    if ($username -cnotmatch '^[A-Za-z0-9._-]{3,80}$') { throw 'Invalid administrator username.' }
    $secure = Read-Host 'Choose an administrator password (at least 12 characters)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    if ($password.Length -lt 12) { throw 'Administrator password must be at least 12 characters.' }
    $env:ADMIN_USERNAME = $username
    $env:ADMIN_PASSWORD = $password
    $env:ADMIN_EMAIL = "$username@localhost.invalid"
}

if ($Mode -eq 'Backend') {
    Set-Location -LiteralPath $backendDir
    Write-Host 'Starting Spring Boot API...' -ForegroundColor Cyan
    & mvn -B spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw "Backend exited with code $LASTEXITCODE." }
    return
}

if ($Mode -eq 'Frontend') {
    Set-Location -LiteralPath $frontendDir
    Write-Host 'Installing locked frontend dependencies...' -ForegroundColor Cyan
    & npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE." }
    Write-Host 'Starting Vite UI...' -ForegroundColor Cyan
    & npm run start
    if ($LASTEXITCODE -ne 0) { throw "Frontend exited with code $LASTEXITCODE." }
    return
}

# Launch separate windows so both services have visible logs. Child processes inherit
# the session-only JWT_SECRET / optional admin bootstrap environment variables.
$scriptPath = '"' + $PSCommandPath + '"'
$backendArgs = '-NoExit -NoProfile -ExecutionPolicy Bypass -File ' + $scriptPath + ' -Mode Backend'
$frontendArgs = '-NoExit -NoProfile -ExecutionPolicy Bypass -File ' + $scriptPath + ' -Mode Frontend'
$backendProcess = $null
try {
    $backendProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList $backendArgs -WorkingDirectory $backendDir -PassThru
    $null = Start-Process -FilePath 'powershell.exe' -ArgumentList $frontendArgs -WorkingDirectory $frontendDir -PassThru
} catch {
    if ($null -ne $backendProcess) { Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue }
    throw
}

Write-Host ''
Write-Host 'Two server windows opened. Keep them open while using the application.' -ForegroundColor Green
Write-Host 'Wait until both show successful startup, then visit http://localhost:3000'
Write-Host 'Close the two windows (or Ctrl+C in each) to stop the servers.'
if ([string]::IsNullOrWhiteSpace($env:ADMIN_USERNAME)) {
    Write-Host 'To create an admin on first run, stop both servers and run: .\scripts\start-local.ps1 -SetupAdmin'
}
