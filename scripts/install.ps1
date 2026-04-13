<#
Copyright 2026 promptLM

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
#>

[CmdletBinding()]
param(
    [string]$Version,
    [string]$InstallDir = $(if ($env:PROMPTLM_INSTALL_DIR) { $env:PROMPTLM_INSTALL_DIR } else { Join-Path $HOME ".local\bin" }),
    [string]$Repository = "promptLM/promptlm-app"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-LatestVersion {
    param(
        [Parameter(Mandatory = $true)][string]$Repo
    )

    $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ "Accept" = "application/vnd.github+json" }
    if (-not $release.tag_name) {
        throw "Unable to resolve latest release version from $apiUrl."
    }
    return ($release.tag_name -replace '^v', '')
}

function Resolve-Arch {
    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
    switch ($arch) {
        "X64" { return "x64" }
        "Arm64" { return "arm64" }
        default { throw "Unsupported architecture: $arch. Supported: x64, arm64." }
    }
}

if (-not [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)) {
    throw "Unsupported operating system. scripts/install.ps1 supports Windows only."
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    $Version = Resolve-LatestVersion -Repo $Repository
}
$Version = ($Version.Trim() -replace '^v', '')
if ([string]::IsNullOrWhiteSpace($Version)) {
    throw "Resolved release version is empty."
}

$arch = Resolve-Arch
$tag = "v$Version"
$assetName = "promptlm-cli-windows-$arch.zip"
$checksumsName = "SHA256SUMS"
$baseUrl = "https://github.com/$Repository/releases/download/$tag"

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("promptlm-install-" + [Guid]::NewGuid().ToString("N"))
$archivePath = Join-Path $tempRoot $assetName
$checksumsPath = Join-Path $tempRoot $checksumsName
$extractDir = Join-Path $tempRoot "extract"
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

try {
    Invoke-WebRequest -Uri "$baseUrl/$assetName" -OutFile $archivePath
    Invoke-WebRequest -Uri "$baseUrl/$checksumsName" -OutFile $checksumsPath

    $checksumPattern = '^([A-Fa-f0-9]{64})\s+\*?' + [Regex]::Escape($assetName) + '$'
    $checksumMatch = Select-String -Path $checksumsPath -Pattern $checksumPattern | Select-Object -First 1
    if (-not $checksumMatch) {
        throw "No checksum entry found for $assetName in $checksumsName."
    }

    $expectedHash = $checksumMatch.Matches[0].Groups[1].Value.ToLowerInvariant()
    $actualHash = (Get-FileHash -Path $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expectedHash -ne $actualHash) {
        throw "Checksum mismatch for $assetName. Expected $expectedHash, got $actualHash."
    }

    Expand-Archive -Path $archivePath -DestinationPath $extractDir -Force
    $sourceBinary = Join-Path $extractDir "promptlm-cli.exe"
    if (-not (Test-Path $sourceBinary)) {
        throw "Expected binary not found in archive: $sourceBinary"
    }

    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    $targetBinary = Join-Path $InstallDir "promptlm-cli.exe"
    Copy-Item -Path $sourceBinary -Destination $targetBinary -Force

    & $targetBinary --version | Out-Null
    Write-Host "Installed promptlm-cli $Version to $targetBinary"

    $pathEntries = $env:PATH -split ';'
    if ($pathEntries -notcontains $InstallDir) {
        Write-Host "Add $InstallDir to your PATH to run promptlm-cli globally."
    }
}
finally {
    Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}

