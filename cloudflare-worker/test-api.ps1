$uri = "https://beauty-mini-api.1029502701.workers.dev/"
$req = [System.Net.WebRequest]::Create($uri)
$req.Method = "GET"
$req.Timeout = 10000
$req.ServicePoint.Expect100Continue = $false
try {
    $resp = $req.GetResponse()
    $sr = [System.IO.StreamReader]::new($resp.GetResponseStream())
    Write-Output "HTTP $($resp.StatusCode): $($sr.ReadToEnd())"
    $sr.Close()
} catch [System.Net.WebException] {
    $e = $_.Exception
    $resp = $e.Response
    if ($resp) {
        $sr = [System.IO.StreamReader]::new($resp.GetResponseStream())
        $body = $sr.ReadToEnd()
        $sr.Close()
        Write-Output "HTTP $($resp.StatusCode): $body"
    } else {
        Write-Output "NO RESPONSE: $($_.Exception.Message)"
    }
}
