/**
 * 本地 RTMP 服务（基于 node-media-server）
 *
 * 默认端口：
 *   - RTMP 推流 / 拉流：1935
 *   - HTTP-FLV（给小程序 live-player，避免与 Python uvicorn 默认 8000 冲突）：8001
 *
 * 启动：在当前目录执行 npm install 后，npm start
 */

const NodeMediaServer = require('node-media-server')

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8001,
    allow_origin: '*'
  }
}

const nms = new NodeMediaServer(config)

nms.on('prePublish', (id, streamPath, args) => {
  console.log('[RTMP] prePublish', streamPath)
})

nms.on('donePublish', (id, streamPath, args) => {
  console.log('[RTMP] donePublish', streamPath)
})

nms.run()
