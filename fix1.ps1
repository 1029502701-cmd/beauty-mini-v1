$path = "C:\Users\yao\Documents\Ai美妆\beauty-api-pages\modules\beauty-ai\permission\report-access-service.ts"
$content = Get-Content $path -Raw -Encoding UTF8
$content = $content -replace "'first-look': 3", "'first-look': 2"
Set-Content $path $content -Encoding UTF8 -NoNewline
Write-Host "Done"
