$port = 8001
$root = $PSScriptRoot
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port"

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".gif"  = "image/gif"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".xml"  = "application/xml; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".pdf"  = "application/pdf"
    ".mp4"  = "video/mp4"
}

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
        if ($rel -eq "") { $rel = "index.html" }

        $candidate = Join-Path $root $rel
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($rel)
            if (-not $ext) {
                $htmlTry = Join-Path $root ($rel + ".html")
                $indexTry = Join-Path $root (Join-Path $rel "index.html")
                if (Test-Path -LiteralPath $htmlTry -PathType Leaf) { $candidate = $htmlTry }
                elseif (Test-Path -LiteralPath $indexTry -PathType Leaf) { $candidate = $indexTry }
            }
        }

        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($candidate).ToLower()
            $ct = $mime[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($candidate)
            $res.ContentType = $ct
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "200 $($req.HttpMethod) $($req.Url.AbsolutePath)"
        } else {
            $notFound = Join-Path $root "404.html"
            $res.StatusCode = 404
            if (Test-Path -LiteralPath $notFound -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($notFound)
                $res.ContentType = "text/html; charset=utf-8"
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            Write-Host "404 $($req.HttpMethod) $($req.Url.AbsolutePath)"
        }
        $res.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
