import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Camera } from '@tarojs/components'
import { LivePlayer } from '@tarojs/components'

import {
  CAMERA_FRAME_URL,
  CAMERA_MJPEG_URL,
  WEAPP_CAMERA_POLL_MS,
  WEAPP_LIVE_PLAYER_SRC,
  WEAPP_USE_CAMERA_COMPONENT,
  WEAPP_USE_JPEG_PREVIEW_INSTEAD_OF_LIVE_PLAYER
} from '@/constants/stream'

import './index.scss'

export type LivePlayerAreaProps = {
  weappSrc?: string
  h5MjpegSrc?: string
  /** 铺满父容器高度（直播间全屏时用） */
  fill?: boolean
}

function isLivePlayerFatalCode(code: unknown): boolean {
  if (code === undefined || code === null) return false
  if (typeof code === 'number') {
    return code === -2301 || code === -2302 || (code >= 3001 && code <= 3005)
  }
  const s = String(code)
  return s === '-2301' || s === '-2302'
}

export function LivePlayerArea({ weappSrc, h5MjpegSrc, fill }: LivePlayerAreaProps) {
  const isWeapp = useMemo(() => Taro.getEnv() === Taro.ENV_TYPE.WEAPP, [])
  const mjpeg = h5MjpegSrc ?? CAMERA_MJPEG_URL
  const overrideSrc = (weappSrc ?? '').trim()
  const enableCamera = isWeapp && WEAPP_USE_CAMERA_COMPONENT
  const liveSrc =
    overrideSrc ||
    (WEAPP_USE_JPEG_PREVIEW_INSTEAD_OF_LIVE_PLAYER ? '' : WEAPP_LIVE_PLAYER_SRC.trim())

  const loadingRef = useRef(false)
  const liveFatalToastRef = useRef(false)
  const reqSeqRef = useRef(0)
  const authRequestedRef = useRef(false)
  const [weappPollingSrc, setWeappPollingSrc] = useState(() => {
    reqSeqRef.current += 1
    return `${CAMERA_FRAME_URL}?_=${reqSeqRef.current}`
  })

  useEffect(() => {
    if (!isWeapp || !enableCamera || authRequestedRef.current) return
    authRequestedRef.current = true
    void (async () => {
      try {
        await Taro.authorize({ scope: 'scope.camera' })
      } catch {
        void Taro.showModal({
          title: '需要相机权限',
          content: '请在设置中允许小程序使用相机，然后返回重试。',
          confirmText: '去设置',
          success: (res) => {
            if (!res.confirm) return
            void Taro.openSetting()
          }
        })
      }
    })()
  }, [enableCamera, isWeapp])

  useEffect(() => {
    if (!isWeapp || liveSrc) return undefined

    const timer = setInterval(() => {
      // 避免短时间内连续切换 src 导致“白屏/闪屏”（上一张没加载完就换下一张）
      if (loadingRef.current) return
      loadingRef.current = true
      reqSeqRef.current += 1
      setWeappPollingSrc(`${CAMERA_FRAME_URL}?_=${reqSeqRef.current}`)
    }, WEAPP_CAMERA_POLL_MS)

    return () => clearInterval(timer)
  }, [isWeapp, liveSrc])

  const rootClass = fill ? 'live-player-area live-player-area--fill' : 'live-player-area'

  return (
    <View className={rootClass}>
      {isWeapp ? (
        enableCamera ? (
          <Camera
            className='live-player-area__media'
            mode='normal'
            devicePosition='front'
            flash='off'
            onError={(e) => {
              console.warn('[camera] error', e?.detail)
            }}
          />
        ) : liveSrc ? (
          <LivePlayer
            className='live-player-area__media'
            src={liveSrc}
            mode='live'
            autoplay
            muted
            orientation='horizontal'
            objectFit='contain'
            minCache={1}
            maxCache={3}
            onStateChange={(e) => {
              const code = e.detail?.code
              console.warn('[live-player] state', code, liveSrc)
              if (isLivePlayerFatalCode(code) && !liveFatalToastRef.current) {
                liveFatalToastRef.current = true
                void Taro.showToast({
                  title: `拉流失败(${String(code)}) 查IP/防火墙或 stream.ts 改用 JPEG`,
                  icon: 'none',
                  duration: 4000
                })
              }
            }}
          />
        ) : (
          <Image
            className='live-player-area__mjpeg'
            src={weappPollingSrc}
            mode='aspectFill'
            lazyLoad={false}
            onLoad={() => {
              loadingRef.current = false
            }}
            onError={() => {
              loadingRef.current = false
            }}
          />
        )
      ) : (
        <img className='live-player-area__mjpeg' src={mjpeg} alt='本机摄像头 MJPEG' />
      )}
      <View className='live-player-area__badge'>
        <Text className='live-player-area__badge-text'>LIVE</Text>
      </View>
    </View>
  )
}
