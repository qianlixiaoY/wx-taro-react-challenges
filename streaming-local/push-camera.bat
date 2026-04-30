@echo off
setlocal EnableExtensions

REM FFmpeg path (btbn shared build). Change if yours differs.
set "FFMPEG_EXE=D:\softwares\ffmpeg-btbN\bin\ffmpeg.exe"

REM Camera name from: ffmpeg -list_devices true -f dshow -i dummy
set "CAMERA_NAME=HD Camera"

if not exist "%FFMPEG_EXE%" (
  echo ERROR: FFmpeg not found at:
  echo %FFMPEG_EXE%
  pause
  exit /b 1
)

REM RTMP must be listening first, or FFmpeg exits with error -138 and dshow may spam "rtbufsize ... frame dropped".
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $t = Test-NetConnection -ComputerName 127.0.0.1 -Port 1935 -WarningAction SilentlyContinue; if (-not $t.TcpTestSucceeded) { Write-Host ERROR: 127.0.0.1:1935 is not accepting connections. In streaming-local run: npm start ; exit 1 } }"
if errorlevel 1 (
  pause
  exit /b 1
)

REM thread_queue_size / rtbufsize reduce drops while encoder or RTMP connects; keep command on one line for CMD.
"%FFMPEG_EXE%" -hide_banner -loglevel info -thread_queue_size 512 -f dshow -rtbufsize 150M -i video="%CAMERA_NAME%" -an -c:v libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -f flv "rtmp://127.0.0.1:1935/live/camera"

echo Exit code: %ERRORLEVEL%
pause
endlocal
