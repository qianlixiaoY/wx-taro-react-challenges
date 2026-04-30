import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'

import './index.scss'

type Packet = {
  id: number
  left: number
  duration: number
  delay: number
}

export type RedPacketRainProps = {
  active: boolean
  onStop?: () => void
}

export function RedPacketRain({ active, onStop }: RedPacketRainProps) {
  const [packets, setPackets] = useState<Packet[]>([])
  const [scoreYuan, setScoreYuan] = useState(0)
  const seq = useRef(0)

  const spawn = useCallback(() => {
    seq.current += 1
    const id = seq.current
    const left = Math.floor(Math.random() * 78) + 8
    const duration = Math.floor(Math.random() * 3) + 4
    const delay = Math.floor(Math.random() * 400)
    const packet: Packet = { id, left, duration, delay }
    setPackets((prev) => [...prev.slice(-40), packet])
    setTimeout(() => {
      setPackets((prev) => prev.filter((p) => p.id !== id))
    }, delay + duration * 1000)
  }, [])

  useEffect(() => {
    if (!active) {
      setPackets([])
      return
    }
    const t = setInterval(spawn, 520)
    const end = setTimeout(() => {
      onStop?.()
    }, 22000)
    spawn()
    return () => {
      clearInterval(t)
      clearTimeout(end)
    }
  }, [active, onStop, spawn])

  const grab = (id: number) => {
    const bonus = Math.round((Math.random() * 1.2 + 0.08) * 100) / 100
    setScoreYuan((s) => Math.round((s + bonus) * 100) / 100)
    setPackets((prev) => prev.filter((p) => p.id !== id))
  }

  if (!active) return null

  return (
    <View className='red-rain'>
      <View className='red-rain__hud'>
        <Text className='red-rain__hud-title'>红包雨</Text>
        <Text className='red-rain__hud-score'>已抢 ¥{scoreYuan.toFixed(2)}</Text>
      </View>
      {packets.map((p) => (
        <View
          key={p.id}
          className='red-rain__packet'
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}ms`
          }}
          onClick={() => grab(p.id)}
        >
          <Text className='red-rain__packet-text'>拆</Text>
        </View>
      ))}
      <Text className='red-rain__tip'>猛戳落下的红包（演示金额）</Text>
    </View>
  )
}
