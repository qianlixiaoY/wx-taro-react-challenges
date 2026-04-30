/**
 * 真机预览 / 真机调试：填运行 streaming-local、Python 的那台电脑的局域网 IPv4（与手机同一 Wi‑Fi）。
 * 仅在电脑模拟器里可看 localhost 时，可改为 `127.0.0.1`（live-player 仍可能超时）。
 */
export const WEAPP_DEV_PC_HOST = '127.0.0.1'

/** Python FastAPI（MJPEG/JPEG）端口与 WEAPP_DEV_PC_HOST 一致，便于手机访问 */
export const CAMERA_SERVICE_ORIGIN = `http://${WEAPP_DEV_PC_HOST}:8000`

/** H5：MJPEG 连续流 */
export const CAMERA_MJPEG_URL = `${CAMERA_SERVICE_ORIGIN}/stream/mjpeg`

/** 微信小程序：<Image> 轮询单帧（不推荐 multipart MJPEG） */
export const CAMERA_FRAME_URL = `${CAMERA_SERVICE_ORIGIN}/frame.jpg`

/** 小程序轮询间隔（毫秒），越小越流畅但请求更频繁 */
export const WEAPP_CAMERA_POLL_MS = 120

/** node-media-server HTTP 端口（与 streaming-local/server.js 一致），用于 HTTP-FLV */
export const STREAMING_HTTP_ORIGIN = `http://${WEAPP_DEV_PC_HOST}:8001`

/**
 * 微信小程序 live-player 播放地址（HTTP-FLV）
 * live-player 需在公众平台类目与「接口设置」中开通，否则真机可能一直黑屏。
 */
export const WEAPP_LIVE_PLAYER_SRC = `${STREAMING_HTTP_ORIGIN}/live/camera.flv`

/** 备选 RTMP（真机上 FLV 异常时可改走 LivePlayer + 此地址） */
export const WEAPP_LIVE_RTMP_FALLBACK = `rtmp://${WEAPP_DEV_PC_HOST}:1935/live/camera`

/**
 * 未开通 live-player 或长期黑屏时，改为 true：使用 Image 轮询 JPEG。
 * 需本机运行 Python（server/main.py）且放行 TCP 8000，摄像头由 Python/OpenCV 采集（与 FFmpeg 推流是另一条链路）。
 */
export const WEAPP_USE_JPEG_PREVIEW_INSTEAD_OF_LIVE_PLAYER = false

/**
 * 无 live-player 权限时，推荐用 camera 组件做真机预览（使用手机摄像头）。
 * 注意：这是“手机本机采集”，不是电脑摄像头推流。
 */
export const WEAPP_USE_CAMERA_COMPONENT = true
