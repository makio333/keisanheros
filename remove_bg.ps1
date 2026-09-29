Add-Type -AssemblyName System.Drawing
function Remove-WhiteBackground {
    param([string]$inPath, [string]$outPath)
    $img = [System.Drawing.Bitmap]::FromFile($inPath)
    $bmp = new-object System.Drawing.Bitmap($img.Width, $img.Height)
    $img.MakeTransparent([System.Drawing.Color]::White)
    $bmp.MakeTransparent()
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, 0, 0)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

Remove-WhiteBackground -inPath 'C:\Users\info\.gemini\antigravity\brain\391cc366-403c-4b50-bab5-5d140969a436\hero_boy_1790645302233.jpg' -outPath 'assets\characters\ai_hero_boy.png'
Remove-WhiteBackground -inPath 'C:\Users\info\.gemini\antigravity\brain\391cc366-403c-4b50-bab5-5d140969a436\hero_youngman_1790645344782.jpg' -outPath 'assets\characters\ai_hero_youngman.png'
Remove-WhiteBackground -inPath 'C:\Users\info\.gemini\antigravity\brain\391cc366-403c-4b50-bab5-5d140969a436\hero_girl_1790645364501.jpg' -outPath 'assets\characters\ai_hero_girl.png'
Remove-WhiteBackground -inPath 'C:\Users\info\.gemini\antigravity\brain\391cc366-403c-4b50-bab5-5d140969a436\hero_woman_1790645417519.jpg' -outPath 'assets\characters\ai_hero_woman.png'
