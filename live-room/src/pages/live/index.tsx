import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Taro, { getCurrentInstance, useShareAppMessage } from '@tarojs/taro'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'

import { LivePlayerArea } from '@/components/LivePlayerArea'
import { FlyingDanmakuLayer, type FlyingDanmakuHandle } from '@/components/FlyingDanmakuLayer'
import { DanmakuHistorySheet } from '@/components/DanmakuHistorySheet'
import { RedPacketRain } from '@/components/RedPacketRain'
import { GamePanel } from '@/components/GamePanel'
import { COMPOSER_EMOJI_PALETTE } from '@/constants/composerEmojis'
import { WEAPP_USE_CAMERA_COMPONENT } from '@/constants/stream'
import type { DanmakuMessage } from '@/types/danmaku'
import { DANMAKU_ACCEPTANCE_SAMPLES, makeDanmakuBatch } from '@/utils/danmakuSamples'
import { formatProofLines, runFullDanmakuProof } from '@/utils/danmakuProof'

import './index.scss'
import { DanmuDefaultList } from '@/constants/danmaku'

/** 避免 React 18 Strict 开发模式下 useEffect 双调用导致重复灌入种子弹幕 */
let liveDanmakuSeedApplied = false

/** 避免带 proof=1 进入时弹窗出现两次 */
let liveDanmakuProofParamShown = false

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function pushHistory(ref: { current: DanmakuMessage[] }, m: DanmakuMessage) {
  ref.current.push(m)
  if (ref.current.length > 12000) ref.current.splice(0, ref.current.length - 12000)
}

/** 小程序 WXSS 不支持 @container；用换行 + 长度近似「多行」以减小圆角 */
function dockDanmakuPillMultiline(text: string): boolean {
  return text.includes('\n') || text.length > 36
}

export default function LivePage() {
  const stressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stressIndexRef = useRef(0)
  const historyRef = useRef<DanmakuMessage[]>([])
  const flyRef = useRef<FlyingDanmakuHandle>(null)

  const [draft, setDraft] = useState('')
  const [gamesOpen, setGamesOpen] = useState(false)
  const [rain, setRain] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [stressing, setStressing] = useState(false)
  const [dockPreview, setDockPreview] = useState<DanmakuMessage[]>(DanmuDefaultList)
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false)
  /** 受控聚焦：便于失焦后再次拉起系统软键盘（小程序点表情等会先 blur） */
  const [composerFocused, setComposerFocused] = useState(true)

  const syncDockFromHistory = useCallback(() => {
    setDockPreview([...DanmuDefaultList, ...historyRef.current.slice(-10)])
  }, [])

  const refocusComposerInput = useCallback(() => {
    setComposerFocused(false)
    setTimeout(() => setComposerFocused(true), 48)
  }, [])

  const appendEmojiToDraft = useCallback(
    (ch: string) => {
      setDraft((d) => (d + ch).slice(0, 60))
      refocusComposerInput()
    },
    [refocusComposerInput]
  )

  const appendMessage = useCallback(
    (m: DanmakuMessage) => {
      pushHistory(historyRef, m)
      flyRef.current?.ingest(m)
      syncDockFromHistory()
    },
    [syncDockFromHistory]
  )

  useShareAppMessage(() => ({
    title: '正在直播：互动直播间',
    path: '/pages/live/index'
  }))

  const getHistorySnapshot = useCallback(() => [...historyRef.current].reverse(), [])

  useEffect(() => {
    const p = getCurrentInstance()?.router?.params
    if (p?.proof !== '1' || liveDanmakuProofParamShown) return
    liveDanmakuProofParamShown = true
    const { pass, lines } = runFullDanmakuProof()
    void Taro.showModal({
      title: pass ? '弹幕自检通过' : '弹幕自检失败',
      content: formatProofLines(lines)
    })
  }, [])

  useEffect(() => {
    if (liveDanmakuSeedApplied) return
    liveDanmakuSeedApplied = true
    const seed = [...DANMAKU_ACCEPTANCE_SAMPLES, ...makeDanmakuBatch(0, 6)]
    for (const m of seed) pushHistory(historyRef, m)
    syncDockFromHistory()
    queueMicrotask(() => {
      for (const m of seed) flyRef.current?.ingest(m)
    })
  }, [syncDockFromHistory])

  useEffect(() => {
    return () => {
      if (stressTimerRef.current) {
        clearInterval(stressTimerRef.current)
        stressTimerRef.current = null
      }
    }
  }, [])

  const runProofUi = useCallback(() => {
    const { pass, lines } = runFullDanmakuProof()
    void Taro.showModal({
      title: pass ? '弹幕自检通过' : '弹幕自检失败',
      content: formatProofLines(lines)
    })
  }, [])

  const injectAcceptance = useCallback(() => {
    for (const m of DANMAKU_ACCEPTANCE_SAMPLES) {
      appendMessage({ ...m, id: `${m.id}-${uid()}`, sendTime: Date.now() })
    }
  }, [appendMessage])

  const toggleStress = useCallback(() => {
    if (stressTimerRef.current) {
      clearInterval(stressTimerRef.current)
      stressTimerRef.current = null
      setStressing(false)
      void Taro.showToast({ title: '已停止压力测试', icon: 'none' })
      return
    }
    setStressing(true)
    stressTimerRef.current = setInterval(() => {
      const batch = makeDanmakuBatch(stressIndexRef.current, 20)
      stressIndexRef.current += 20
      for (const m of batch) pushHistory(historyRef, m)
      flyRef.current?.ingestMany(batch)
      syncDockFromHistory()
    }, 20)
  }, [syncDockFromHistory])

  const handleShare = useCallback(() => {
    const env = Taro.getEnv()
    if (env === Taro.ENV_TYPE.WEAPP) {
      void Taro.showToast({ title: '请点击右上角分享给好友或朋友圈', icon: 'none' })
      return
    }
    if (typeof window !== 'undefined' && window.location?.href) {
      void Taro.setClipboardData({ data: window.location.href })
      void Taro.showToast({ title: '链接已复制', icon: 'none' })
      return
    }
    void Taro.showToast({ title: '请在宿主环境使用转发能力', icon: 'none' })
  }, [])

  const sendComment = useCallback(
    (text: string) => {
      const m: DanmakuMessage = {
        id: uid(),
        user: {
          avatar: 'https://dummyimage.com/64x64/eeeeee/333333.png&text=ME',
          name: '我'
        },
        text,
        color: '#FFFFFF',
        sendTime: Date.now()
      }
      appendMessage(m)
      void Taro.showToast({ title: '已发送', icon: 'success', duration: 900 })
    },
    [appendMessage]
  )

  const submitDraft = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    sendComment(t)
    setDraft('')
    setComposerFocused(true)
  }, [draft, sendComment])

  const startRainFromGamePanel = useCallback(() => {
    setGamesOpen(false)
    setRain(true)
  }, [])

  const stopRain = useCallback(() => {
    setRain(false)
    void Taro.showToast({ title: '本轮红包雨结束', icon: 'none' })
  }, [])

  const isWeapp = useMemo(() => Taro.getEnv() === Taro.ENV_TYPE.WEAPP, [])
  const cameraMode = isWeapp && WEAPP_USE_CAMERA_COMPONENT
  const rootClass = cameraMode ? 'live-page live-page--camera' : 'live-page'

  return (
    <View className={rootClass}>
      <View className='live-page_header'>
        <View className='live-page_titlewrapper'>
          <View className='live-page_avatar' />
          <View className='live-page_title'>直播服务号</View>
          <Button type='primary' size='mini'>
            关注
          </Button>
        </View>
        <View />
      </View>
      <View className='live-page__stage' onClick={() => setEmojiPanelOpen((v) => !v)}>
        <LivePlayerArea fill />
        <FlyingDanmakuLayer ref={flyRef} />
      </View>

      <View className='live-page__dock'>
        <View className='live-page__danmaku-newjoiner'>xxx来了</View>
        <View className='live-page__danmaku-wrap'>
          <View className='live-page__danmaku'>
            {dockPreview.map((c, idx) => (
              <View key={`${idx}-${c.id}`} className='live-page__danmaku-row'>
                <View
                  className={
                    dockDanmakuPillMultiline(c.text)
                      ? 'live-page__danmaku-pill live-page__danmaku-pill--multiline'
                      : 'live-page__danmaku-pill'
                  }
                >
                  <Text className='live-page__danmaku-nick'>{c.user.name}：</Text>
                  <Text className='live-page__danmaku-text'>{c.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className='live-page__dm-tools'>
          <Text className='live-page__dm-tools-item' onClick={() => setHistoryOpen(true)}>
            历史弹幕
          </Text>
          <Text className='live-page__dm-tools-item' onClick={injectAcceptance}>
            注入样例
          </Text>
          <Text className='live-page__dm-tools-item' onClick={toggleStress}>
            {stressing ? '停止压力' : '压力~1000/s'}
          </Text>
          <Text className='live-page__dm-tools-item' onClick={runProofUi}>
            自检
          </Text>
        </View>

        <View className='live-page__composer'>
          <View className='live-page__composer-row'>
            <Text
              className='live-page__composer-emoji-toggle'
              onClick={() => setEmojiPanelOpen((v) => !v)}
            >
              😊
            </Text>
            <Input
              className='live-page__composer-input'
              type='text'
              value={draft}
              placeholder='发个弹幕…'
              placeholderClass='live-page__composer-placeholder'
              maxlength={60}
              confirmType='send'
              adjustPosition
              cursorSpacing={72}
              focus={composerFocused}
              holdKeyboard
              alwaysEmbed={isWeapp}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              onInput={(e) => setDraft(e.detail.value)}
              onConfirm={submitDraft}
            />
            <Text className='live-page__composer-send' onClick={submitDraft}>
              发送
            </Text>
            <Text className='interaction-bar__label' onClick={handleShare}>
              转发
            </Text>
            <Text className='interaction-bar__label' onClick={() => setGamesOpen(true)}>
              玩法
            </Text>
          </View>
          {emojiPanelOpen ? (
            <ScrollView
              scrollY
              enhanced
              showScrollbar={false}
              className='live-page__composer-emoji-scroll'
            >
              <View className='live-page__composer-emoji-panel'>
                {COMPOSER_EMOJI_PALETTE.map((ch) => (
                  <Text
                    key={ch}
                    className='live-page__composer-emoji-item'
                    onClick={() => appendEmojiToDraft(ch)}
                  >
                    {ch}
                  </Text>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>


      <DanmakuHistorySheet
        visible={historyOpen}
        getMessages={getHistorySnapshot}
        onClose={() => setHistoryOpen(false)}
      />

      <GamePanel
        visible={gamesOpen}
        onClose={() => setGamesOpen(false)}
        onStartRain={startRainFromGamePanel}
      />

      <RedPacketRain active={rain} onStop={stopRain} />
    </View>
  )
}
