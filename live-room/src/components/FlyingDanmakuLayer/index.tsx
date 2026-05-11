import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import type { CSSProperties } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'

import {
  DANMAKU_FILTER_KEYWORDS,
  DANMAKU_HIGHLIGHT_KEYWORDS,
  DANMAKU_LANE_COUNT,
  DANMAKU_MAX_SPAWN_PER_TICK,
  DANMAKU_PENDING_CAP,
  DANMAKU_SPEED_PX_PER_MS
} from '@/constants/danmaku'
import type { DanmakuMessage } from '@/types/danmaku'
import { decorateDanmakuMessage, type TextSegment } from '@/utils/danmakuKeyword'
import {
  estimateDanmakuWidthPx,
  flightDistancePx,
  flightDurationMs,
  laneSlotDurationMs,
  pickLaneByNextAllowTime
} from '@/utils/danmakuLanes'

import './index.scss'

export type FlyingDanmakuHandle = {
  ingest: (msg: DanmakuMessage) => void
  ingestMany: (msgs: DanmakuMessage[]) => void
  getStats: () => { pending: number; dropped: number; flying: number }
  clear: () => void
}

export type FlyingDanmakuLayerProps = {
  /** 顶部预留（避免挡住 LIVE 角标） */
  topInsetPx?: number
}

type RowModel = {
  id: string
  lane: number
  durationMs: number
  message: DanmakuMessage
  segments: TextSegment[]
}

function readScreenW(): number {
  try {
    const w = Taro.getWindowInfo?.()?.windowWidth
    if (typeof w === 'number' && w > 0) return w
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.innerWidth) return window.innerWidth
  return 375
}

export const FlyingDanmakuLayer = forwardRef<FlyingDanmakuHandle, FlyingDanmakuLayerProps>(
  function FlyingDanmakuLayer({ topInsetPx = 20 }, ref) {
    const screenWRef = useRef(readScreenW())
    const [layoutW, setLayoutW] = useState(() => readScreenW())
    const pendingRef = useRef<DanmakuMessage[]>([])
    const droppedRef = useRef(0)
    /** 每条轨道下一次允许发射的时间戳（performance.now 空间） */
    const nextAllowRef = useRef<number[]>(Array.from({ length: DANMAKU_LANE_COUNT }, () => 0))
    /** 延迟到 spawnAt 再挂到 rows（替代每条弹幕一个 setTimeout） */
    const pendingMountsRef = useRef<{ spawnAt: number; row: RowModel }[]>([])
    /** 到 removeAt 从 rows 移除（替代 animation 结束 setTimeout） */
    const pendingRemovesRef = useRef<{ id: string; removeAt: number }[]>([])
    const rafRef = useRef<number | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const flyingCountRef = useRef(0)
    const [rows, setRows] = useState<RowModel[]>([])

    const laneHeight = useMemo(() => 40, [])
    const laneGap = useMemo(() => 6, [])

    const tick = useCallback(() => {
      const W = screenWRef.current
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()

      const flushScheduled = (t: number) => {
        const removeIds = new Set<string>()
        for (const p of pendingRemovesRef.current) {
          if (p.removeAt <= t) removeIds.add(p.id)
        }
        pendingRemovesRef.current = pendingRemovesRef.current.filter((p) => p.removeAt > t)

        const toMount: RowModel[] = []
        const keep: { spawnAt: number; row: RowModel }[] = []
        for (const p of pendingMountsRef.current) {
          if (p.spawnAt <= t) toMount.push(p.row)
          else keep.push(p)
        }
        pendingMountsRef.current = keep

        if (removeIds.size === 0 && toMount.length === 0) return

        setRows((prev) => {
          const next = prev.filter((r) => !removeIds.has(r.id)).concat(toMount)
          return next
        })

        for (const row of toMount) {
          pendingRemovesRef.current.push({ id: row.id, removeAt: t + row.durationMs + 40 })
        }
      }

      flushScheduled(now)

      let budget = DANMAKU_MAX_SPAWN_PER_TICK

      while (budget > 0 && pendingRef.current.length > 0) {
        budget -= 1
        const msg = pendingRef.current.shift()
        if (!msg) break

        const { segments, blockedFromFlying } = decorateDanmakuMessage(
          msg,
          DANMAKU_FILTER_KEYWORDS,
          DANMAKU_HIGHLIGHT_KEYWORDS
        )

        if (blockedFromFlying) {
          continue
        }

        const w = estimateDanmakuWidthPx(msg.text)
        const { lane, spawnAt } = pickLaneByNextAllowTime(nextAllowRef.current, now)
        const slotMs = laneSlotDurationMs(w, DANMAKU_SPEED_PX_PER_MS)
        nextAllowRef.current[lane] = spawnAt + slotMs

        const durationMs = flightDurationMs(W, w, DANMAKU_SPEED_PX_PER_MS)

        const row: RowModel = {
          id: msg.id,
          lane,
          durationMs,
          message: msg,
          segments
        }

        pendingMountsRef.current.push({ spawnAt, row })
      }

      flushScheduled(now)
    }, [])

    useImperativeHandle(ref, () => ({
      ingest: (msg) => {
        if (pendingRef.current.length >= DANMAKU_PENDING_CAP) {
          pendingRef.current.shift()
          droppedRef.current += 1
        }
        pendingRef.current.push(msg)
      },
      ingestMany: (msgs) => {
        for (const m of msgs) {
          if (pendingRef.current.length >= DANMAKU_PENDING_CAP) {
            pendingRef.current.shift()
            droppedRef.current += 1
          }
          pendingRef.current.push(m)
        }
      },
      getStats: () => ({
        pending: pendingRef.current.length,
        dropped: droppedRef.current,
        flying: flyingCountRef.current
      }),
      clear: () => {
        pendingRef.current.length = 0
        pendingMountsRef.current.length = 0
        pendingRemovesRef.current.length = 0
        nextAllowRef.current = Array.from({ length: DANMAKU_LANE_COUNT }, () => 0)
        droppedRef.current = 0
        flyingCountRef.current = 0
        setRows([])
      }
    }))

    useEffect(() => {
      const refreshW = () => {
        const w = readScreenW()
        screenWRef.current = w
        setLayoutW(w)
      }
      refreshW()
      const on = (Taro as unknown as { onWindowResize?: (cb: () => void) => void }).onWindowResize
      const off = (Taro as unknown as { offWindowResize?: (cb: () => void) => void }).offWindowResize
      if (typeof on === 'function') on(refreshW)
      return () => {
        if (typeof off === 'function') off(refreshW)
      }
    }, [])

    useEffect(() => {
      const loop = () => {
        tick()
        rafRef.current = requestAnimationFrame(loop)
      }
      if (typeof requestAnimationFrame !== 'undefined') {
        rafRef.current = requestAnimationFrame(loop)
        return () => {
          if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        }
      }
      timerRef.current = setInterval(tick, 32)
      return () => {
        if (timerRef.current != null) clearInterval(timerRef.current)
      }
    }, [tick])

    useEffect(() => {
      flyingCountRef.current = rows.length
    }, [rows.length])

    return (
      <View className='fly-dm'>
        {rows.map((r) => {
          const top = topInsetPx + r.lane * (laneHeight + laneGap)
          const W = layoutW
          const itemW = estimateDanmakuWidthPx(r.message.text)
          const flyEndPx = -flightDistancePx(W, itemW)
          return (
            <View
              key={r.id}
              className='fly-dm__track'
              style={{
                top: `${top}px`,
                height: `${laneHeight}px`
              }}
            >
              <View className='fly-dm__anchor'>
                <View
                  className='fly-dm__slide'
                  style={
                    {
                      animationDuration: `${r.durationMs}ms`,
                      ['--fly-end' as string]: `${flyEndPx}px`
                    } as CSSProperties
                  }
                >
                  <View className='fly-dm__bubble'>
                    <Image
                      className='fly-dm__avatar'
                      src={r.message.user.avatar}
                      mode='aspectFill'
                      lazyLoad={false}
                    />
                    <View className='fly-dm__pill'>
                      <Text className='fly-dm__name' style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {r.message.user.name}
                      </Text>
                      <Text className='fly-dm__colon'>：</Text>
                      <Text className='fly-dm__text'>
                        {r.segments.map(item => item.text).join('')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }
)

FlyingDanmakuLayer.displayName = 'FlyingDanmakuLayer'
