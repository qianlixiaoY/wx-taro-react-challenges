import { useCallback, useMemo, useState } from 'react'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { View, Text, Input, Button } from '@tarojs/components'

import { LivePlayerArea } from '@/components/LivePlayerArea'
import { InteractionBar } from '@/components/InteractionBar'
import type { CommentItem } from '@/components/CommentPanel'
import { RedPacketRain } from '@/components/RedPacketRain'
import { GamePanel } from '@/components/GamePanel'
import { WEAPP_USE_CAMERA_COMPONENT } from '@/constants/stream'

import './index.scss'

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function LivePage() {
  const [likes, setLikes] = useState(1288)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [gamesOpen, setGamesOpen] = useState(false)
  const [rain, setRain] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>(() => [
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },
    { id: uid(), nick: '粉丝A', text: '主播晚上好～' },
    { id: uid(), nick: '路人甲', text: '画质不错！' },

  ])

  useShareAppMessage(() => ({
    title: '正在直播：互动直播间',
    path: '/pages/live/index'
  }))

  const danmakuLines = useMemo(() => comments.slice(-8), [comments])

  const handleLike = useCallback(() => {
    setLikes((n) => n + 1)
    void Taro.showToast({ title: '+1', icon: 'none', duration: 900 })
  }, [])

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

  const sendComment = useCallback((text: string) => {
    setComments((list) => [...list, { id: uid(), nick: '我', text }])
    void Taro.showToast({ title: '已发送', icon: 'success', duration: 900 })
  }, [])

  const submitDraft = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    sendComment(t)
    setDraft('')
    setComposerOpen(false)
  }, [draft, sendComment])

  const toggleComposer = useCallback(() => {
    setComposerOpen((v) => !v)
  }, [])

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
            <View className='live-page_avatar'>
            </View>
            <View className='live-page_title'>
              直播服务号
            </View>
            <Button type='primary' size='mini'>
              关注
            </Button>
        </View>
        <View>

        </View>
      </View>
      <View className='live-page__stage'>
        <LivePlayerArea fill />
      </View>

      <View className='live-page_bullet_wrapper'>
        <View className='live-page_bullet_newfan'>
          xxx来了
        </View>
        <View>
          
        </View>
      </View>

      <View className='live-page__dock'>
        <View className='live-page__danmaku'>
          {danmakuLines.map((c) => (
            <View key={c.id} className='live-page__danmaku-row'>
              <View className='live-page__danmaku-pill'>
                <Text className='live-page__danmaku-nick'>{c.nick}</Text>
                <Text className='live-page__danmaku-text'>{c.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {composerOpen ? (
          <View className='live-page__composer'>
            <Input
              className='live-page__composer-input'
              value={draft}
              placeholder='发个弹幕…'
              placeholderClass='live-page__composer-placeholder'
              maxlength={80}
              confirmType='send'
              adjustPosition
              cursorSpacing={72}
              focus
              onInput={(e) => setDraft(e.detail.value)}
              onConfirm={submitDraft}
            />
            <Text className='live-page__composer-send' onClick={submitDraft}>
              发送
            </Text>
          </View>
        ) : null}

        <InteractionBar
          likeCount={likes}
          commentActive={composerOpen}
          onLike={handleLike}
          onComment={toggleComposer}
          onShare={handleShare}
          onOpenGames={() => setGamesOpen(true)}
        />
      </View>

      <GamePanel
        visible={gamesOpen}
        onClose={() => setGamesOpen(false)}
        onStartRain={startRainFromGamePanel}
      />

      <RedPacketRain active={rain} onStop={stopRain} />
    </View>
  )
}
