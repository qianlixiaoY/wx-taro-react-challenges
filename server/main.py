"""
本机摄像头 →（1）MJPEG 流供 H5 /（2）单帧 JPEG 供微信小程序 Image 轮询。

微信小程序不支持浏览器那样的 multipart MJPEG <img>，故前端用 Image 定时刷新 /frame.jpg。

运行：
  cd server
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload

环境变量：CAMERA_INDEX、MJPEG_FPS、JPEG_QUALITY（见下方常量）
"""

from __future__ import annotations

import os
import threading
import time
from contextlib import asynccontextmanager

import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

CAMERA_INDEX = int(os.environ.get("CAMERA_INDEX", "0"))
MJPEG_FPS = float(os.environ.get("MJPEG_FPS", "20"))
JPEG_QUALITY = int(os.environ.get("JPEG_QUALITY", "75"))

_lock = threading.Lock()
_latest_jpeg: bytes | None = None
_capture_thread: threading.Thread | None = None
_stop_capture = threading.Event()


def _capture_loop() -> None:
    global _latest_jpeg
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError(f"无法打开摄像头 index={CAMERA_INDEX}")

    frame_interval = 1.0 / max(MJPEG_FPS, 1.0)
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]

    try:
        while not _stop_capture.is_set():
            t0 = time.perf_counter()
            ok, frame = cap.read()
            if ok:
                ok_j, buf = cv2.imencode(".jpg", frame, encode_params)
                if ok_j:
                    with _lock:
                        _latest_jpeg = buf.tobytes()
            elapsed = time.perf_counter() - t0
            sleep = frame_interval - elapsed
            if sleep > 0:
                time.sleep(sleep)
    finally:
        cap.release()


def _mjpeg_frames():
    while not _stop_capture.is_set():
        with _lock:
            chunk = _latest_jpeg
        if chunk:
            yield (
                b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + chunk + b"\r\n"
            )
        time.sleep(1.0 / max(MJPEG_FPS, 1.0))


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _capture_thread
    _stop_capture.clear()
    _capture_thread = threading.Thread(target=_capture_loop, daemon=True)
    _capture_thread.start()
    yield
    _stop_capture.set()
    if _capture_thread:
        _capture_thread.join(timeout=2.0)


app = FastAPI(title="Live learning camera", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "camera_index": CAMERA_INDEX, "has_frame": _latest_jpeg is not None}


@app.get("/frame.jpg")
def frame_jpg():
    with _lock:
        data = _latest_jpeg
    if not data:
        return Response(status_code=503, content=b"camera not ready")
    return Response(
        content=data,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache"},
    )


@app.get("/stream/mjpeg")
def stream_mjpeg():
    return StreamingResponse(
        _mjpeg_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
