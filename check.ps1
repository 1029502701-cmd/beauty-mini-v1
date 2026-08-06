$c = [System.IO.File]::ReadAllText('C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\upload.ts', [System.Text.Encoding]::UTF8)
Write-Host "Length: $($c.Length)"
Write-Host "First: $($c.Substring(0,30))"
Write-Host "Last:  $($c.Substring($c.Length-30))"
