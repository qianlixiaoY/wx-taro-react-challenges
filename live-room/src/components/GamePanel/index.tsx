import { useState } from 'react'
import { View, Text } from '@tarojs/components'

import './index.scss'

export type GamePanelProps = {
  visible: boolean
  onClose: () => void
  onStartRain: () => void
}

const PRIZES = ['谢谢参与', '¥0.5', '¥1', '优惠券', '¥2', '再来一次']

export function GamePanel({ visible, onClose, onStartRain }: GamePanelProps) {
  const [spinning, setSpinning] = useState(false)
  const [prize, setPrize] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)

  if (!visible) return null

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setPrize(null)
    const turns = 5 + Math.floor(Math.random() * 2)
    const idx = Math.floor(Math.random() * PRIZES.length)
    const slice = 360 / PRIZES.length
    const targetAngle = 360 * turns + idx * slice + slice / 2
    setRotation((r) => r + targetAngle)
    setTimeout(() => {
      setSpinning(false)
      setPrize(PRIZES[idx])
    }, 3000)
  }

  return (
    <View className='game-panel'>
      <View className='game-panel__mask' onClick={onClose} />
      <View className='game-panel__sheet'>
        <Text className='game-panel__title'>直播间玩法</Text>

        <View className='game-panel__section'>
          <Text className='game-panel__section-title'>红包雨</Text>
          <Text className='game-panel__section-desc'>
            全屏掉落红包，点击拆开获取演示金额（可与服务端下发红包策略对接）。
          </Text>
          <View className='game-panel__btn game-panel__btn--primary' onClick={onStartRain}>
            <Text className='game-panel__btn-text'>开启红包雨</Text>
          </View>
        </View>

        <View className='game-panel__section'>
          <Text className='game-panel__section-title'>幸运转盘</Text>
          <View className='game-panel__wheel-box'>
            <View className='game-panel__wheel-pointer' />
            <View className='game-panel__wheel' style={{ transform: `rotate(${rotation}deg)` }}>
              <Text className='game-panel__wheel-label'>幸运抽奖</Text>
              <Text className='game-panel__wheel-sub'>共 {PRIZES.length} 档奖品</Text>
            </View>
          </View>
          <View className={`game-panel__btn ${spinning ? 'is-disabled' : ''}`} onClick={spin}>
            <Text className='game-panel__btn-text'>{spinning ? '抽奖中…' : '转盘抽奖'}</Text>
          </View>
          {prize ? (
            <Text className='game-panel__prize'>
              恭喜获得：
              <Text className='game-panel__prize-strong'>{prize}</Text>
            </Text>
          ) : null}
        </View>

        <Text className='game-panel__close' onClick={onClose}>
          收起
        </Text>
      </View>
    </View>
  )
}
