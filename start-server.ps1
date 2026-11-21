param (
    [int]$Port = 5173
)

$rootDir = $PSScriptRoot
if (-not $rootDir) {
    $rootDir = Get-Location
}

# Test if port is in use; if so, find an available port
$attempts = 0
while ($attempts -lt 10) {
    try {
        $listener = New-Object System.Net.HttpListener
        $prefix = "http://localhost:$Port/"
        $listener.Prefixes.Add($prefix)
        $listener.Start()
        break
    } catch {
        $Port++
        $attempts++
    }
}

if (-not $listener.IsListening) {
    Write-Error "HTTP sunucusu başlatılamadı."
    exit 1
}

$url = "http://localhost:$Port/"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Clou AI Yerel Sunucu Baslatildi!" -ForegroundColor Green
Write-Host "  Adres: $url" -ForegroundColor Yellow
Write-Host "  Kapatmak icin bu pencerede Ctrl+C yapin." -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

# Open default browser
try {
    Start-Process $url
} catch {
    Write-Host "Tarayici otomatik acilamadi, lutfen su adresi ziyaret edin: $url" -ForegroundColor Yellow
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = "index.html"
        }

        # Normalize relative path
        $filePath = [System.IO.Path]::Combine($rootDir, $path.Replace('/', [System.IO.Path]::DirectorySeparatorChar))

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $mime = $mimeTypes[$ext]
            }

            $response.ContentType = $mime
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
