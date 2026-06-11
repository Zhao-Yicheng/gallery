$htmlHead = @"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Photo Gallery</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="loader" id="loader">
        <div class="loader-spinner"></div>
        <p>加载中...</p>
    </div>

    <div class="scene" id="scene">
        <div class="slider" id="slider"></div>
        <div class="center-content">
            <h1>Photo Gallery</h1>
            <p class="subtitle">3D 环绕展示</p>
        </div>
    </div>

    <div class="controls" id="controls">
        <button class="ctrl-btn" id="prevBtn" title="上一张">&#9664;</button>
        <button class="ctrl-btn" id="pauseBtn" title="暂停/播放">&#9208;</button>
        <button class="ctrl-btn" id="nextBtn" title="下一张">&#9654;</button>
    </div>

    <div class="photo-count" id="photoCount"></div>

    <div class="lightbox" id="lightbox">
        <div class="lightbox-overlay"></div>
        <div class="lightbox-content">
            <img id="lightboxImg" src="" alt="">
            <button class="lightbox-close" id="lightboxClose">&times;</button>
            <button class="lightbox-nav lightbox-prev" id="lightboxPrev">&#9664;</button>
            <button class="lightbox-nav lightbox-next" id="lightboxNext">&#9654;</button>
            <div class="lightbox-info" id="lightboxInfo"></div>
        </div>
    </div>

    <script>
        var photosData = 
"@

$json = Get-Content "f:\py\pic\all_photos.json" -Raw

$htmlTail = @"

    </script>
    <script src="script.js"></script>
</body>
</html>
"@

$newHtml = $htmlHead + $json + $htmlTail
$newHtml | Set-Content "f:\py\pic\3d-gallery\index.html" -NoNewline
Write-Host "Done! New file size: $((Get-Content 'f:\py\pic\3d-gallery\index.html' -Raw).Length) bytes"
