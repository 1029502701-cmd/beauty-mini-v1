$file = 'C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\upload.ts'
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$idx = $c.IndexOf('Content-Type')
Write-Host "Index: $idx"
Write-Host "Context: $($c.Substring($idx-30, 80))"
