$ErrorActionPreference = 'Continue'
$base = 'https://vcd-app.ber1205.workers.dev'
$wav = 'c:\Users\ber12\.trae-cn\work\6a7638096a98106c54635a56\voice_natural.wav'
$size = (Get-Item $wav).Length
Write-Output "WAV: $size bytes"

# 登录
$loginBody = @{username='vcdtest1025'; password='Test123456!'} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -TimeoutSec 30
$token = $login.data.access_token
$headers = @{ Authorization = "Bearer $token" }
Write-Output "LOGIN OK"

# 创建任务
$taskBody = @{source_language='zh'; target_language='en'; source_filename='voice_natural.wav'; input_type='video'} | ConvertTo-Json
$task = Invoke-RestMethod -Uri "$base/api/task/create" -Method Post -Body $taskBody -ContentType 'application/json' -Headers $headers -TimeoutSec 30
$taskId = $task.data.id
Write-Output "TASK: $taskId"

# 直接上传
$boundary = '----VCDBoundary' + [System.Guid]::NewGuid().ToString('N')
$fileBytes = [System.IO.File]::ReadAllBytes($wav)
$ms = New-Object System.IO.MemoryStream
$sw = New-Object System.IO.StreamWriter($ms, [System.Text.Encoding]::UTF8)
$sw.Write("--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"voice_natural.wav`"`r`nContent-Type: audio/wav`r`n`r`n")
$sw.Flush()
$ms.Write($fileBytes, 0, $fileBytes.Length)
$sw.Write("`r`n--$boundary--`r`n")
$sw.Flush()
$multipartBody = $ms.ToArray()
$sw.Dispose(); $ms.Dispose()
try {
    $upResp = Invoke-WebRequest -Uri "$base/api/task/$taskId/upload" -Method Post -Body $multipartBody -ContentType "multipart/form-data; boundary=$boundary" -Headers $headers -TimeoutSec 120 -UseBasicParsing
    Write-Output "UPLOAD HTTP $($upResp.StatusCode)"
} catch {
    Write-Output "UPLOAD ERR: $($_.Exception.Message)"
    exit 1
}

# 轮询 (最长 20 分钟)
for ($i = 1; $i -le 80; $i++) {
    Start-Sleep -Seconds 15
    try {
        $st = Invoke-RestMethod -Uri "$base/api/task/$taskId" -Method Get -Headers $headers -TimeoutSec 20
        $t = $st.data
        $errMsg = [string]$t.error_message
        if ($errMsg.Length -gt 70) { $errMsg = $errMsg.Substring(0, 70) }
        Write-Output ("POLL[{0}] status={1} progress={2} err={3}" -f $i, $t.status, $t.progress, $errMsg)
        if ($t.status -eq 'done' -or $t.status -eq 'failed' -or $t.status -eq 'failed_final' -or $t.status -eq 'cancelled') { break }
    } catch {
        Write-Output "POLL[$i] err: $($_.Exception.Message)"
    }
}

Write-Output "=== FINAL ==="
try {
    $st = Invoke-RestMethod -Uri "$base/api/task/$taskId" -Method Get -Headers $headers -TimeoutSec 20
    $d = $st.data
    Write-Output ("FINAL status={0} progress={1}" -f $d.status, $d.progress)
    Write-Output "ERROR: $($d.error_message)"
    Write-Output "ARTIFACTS: $((@($d.artifacts) | ForEach-Object { $_.artifact_type }) -join ', ')"
} catch { Write-Output "final err: $($_.Exception.Message)" }
