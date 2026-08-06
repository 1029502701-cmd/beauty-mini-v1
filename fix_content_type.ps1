$c1 = [System.IO.File]::ReadAllText('C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\upload.ts', [System.Text.Encoding]::UTF8)
$c1 = $c1 -replace 'header: \{ \.\.\.sessionHeaders, "Content-Type": "multipart/form-data" \}', 'header: { ...sessionHeaders }'
[System.IO.File]::WriteAllText('C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\upload.ts', $c1, [System.Text.Encoding]::UTF8)
Write-Host "upload.ts done"

$c2 = [System.IO.File]::ReadAllText('C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\api.ts', [System.Text.Encoding]::UTF8)
$c2 = $c2 -replace 'header: \{ "Content-Type": "multipart/form-data", \.\.\.sessionHeaders \}', 'header: { ...sessionHeaders }'
[System.IO.File]::WriteAllText('C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\api.ts', $c2, [System.Text.Encoding]::UTF8)
Write-Host "api.ts done"
