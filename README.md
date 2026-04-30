# live-stream

基于 **Taro 4 + React** 的直播间互动示例（点赞、评论、转发、小游戏、红包雨等），并附带 **本地 RTMP / HTTP-FLV** 与 **Python 摄像头 MJPEG** 服务，便于联调真机预览与拉流。

## 仓库结构

| 目录 | 说明 |
| --- | --- |
| `live-room/` | Taro 小程序 + H5 前端 |
| `streaming-local/` | 本地 RTMP 接收与 HTTP-FLV（Node.js + node-media-server） |
| `server/` | 本机摄像头 → MJPEG / 单帧 JPEG（FastAPI + OpenCV），供 H5 或小程序 Image 轮询 |

## 环境要求

- **Node.js**：建议 18+（与 `@types/node` 一致即可）
- **npm**：用于安装依赖与运行脚本
- 真机调试：手机与电脑需在同一局域网；并在前端常量里把开发机 IP 配成电脑的局域网 IPv4（见下文）

## live-room（Taro）

```bash
cd live-room
npm install
```

- **H5 开发**：`npm run dev:h5`
- **微信小程序开发**：`npm run dev:weapp`
- **构建 H5**：`npm run build:h5`
- **构建小程序**：`npm run build:weapp`

构建产物默认输出到 `live-room/dist/`。

### 真机 / 局域网地址配置

推拉流、MJPEG、HTTP-FLV 的地址集中在 `live-room/src/constants/stream.ts` 中的 `WEAPP_DEV_PC_HOST`。  
在真机或同一 Wi‑Fi 下的手机预览时，请改为运行推流服务的那台电脑的 **局域网 IPv4**，不要长期使用 `127.0.0.1`（手机无法访问你电脑的 localhost）。

微信小程序使用 `live-player` 等能力需在公众平台配置对应类目与接口权限；若无权限，可按该文件中的注释改用 JPEG 轮询或 `camera` 组件等备选路径。

## streaming-local（本地 RTMP + HTTP-FLV）

默认端口（与 `live-room/src/constants/stream.ts` 注释一致）：

- RTMP：**1935**
- HTTP-FLV：**8001**

```bash
cd streaming-local
npm install
npm start
```

推流可用仓库内脚本或自行使用 FFmpeg，将流推到例如 `rtmp://<PC局域网IP>:1935/live/camera`，再通过 HTTP-FLV 地址供前端播放（具体路径见前端常量）。

## server（Python 摄像头 MJPEG / JPEG）

用于浏览器 MJPEG 或小程序侧 **Image 轮询单帧**（不依赖 multipart MJPEG）。

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

可选环境变量：`CAMERA_INDEX`、`MJPEG_FPS`、`JPEG_QUALITY`（见 `server/main.py` 顶部说明）。

## 许可证

若尚未指定开源许可证，可自行在仓库根目录补充 `LICENSE` 后再推送远端。
