import { DANMAKU_FLIGHT_TAIL_PX, DANMAKU_SPEED_PX_PER_MS } from '@/constants/danmaku'

/** 估算弹幕条宽度（px），用于时间片长度 */
export function estimateDanmakuWidthPx(text: string): number {
  const avatar = 36
  const pad = 28
  const perChar = 48
  return Math.ceil(avatar + pad + text.length * perChar)
}

/** 单条弹幕水平飞行总路程（px），与 FlyingDanmakuLayer 的 --fly-end 一致 */
export function flightDistancePx(screenW: number, w: number): number {
  return screenW + w + DANMAKU_FLIGHT_TAIL_PX
}

/**
 * 穿过屏幕所需时间；路程与动画位移一致，保证每条弹幕水平速度均为 `speed`（px/ms）。
 */
export function flightDurationMs(screenW: number, w: number, speed: number = DANMAKU_SPEED_PX_PER_MS): number {
  const dist = flightDistancePx(screenW, w)
  return Math.max(100, Math.ceil(dist / speed))
}

/**
 * 单条弹幕占轨时间片长度（ms）：`(screenW + w) / v`（与需求一致；不含尾量，由多轨消化）。
 */
export function laneSlotDurationMs(screenW: number, w: number, speed: number = DANMAKU_SPEED_PX_PER_MS): number {
  return Math.max(1, (screenW + w) / speed)
}

export type LanePickResult = {
  lane: number
  /** 实际允许开启动画的时间戳（与 `now` 同源，一般为 performance.now） */
  spawnAt: number
}

/**
 * 轨道时间片调度：优先选 `nextAllowTime <= now` 的轨道（其中 next 最小者）；
 * 否则选全局 `nextAllowTime` 最小的轨道，`spawnAt` 为该值（需延迟发射）。
 */
export function pickLaneByNextAllowTime(
  nextAllowTimes: number[],
  now: number
): LanePickResult {
  const n = nextAllowTimes.length
  if (n === 0) return { lane: 0, spawnAt: now }

  let readyLane = -1
  let readyMin = Infinity
  for (let i = 0; i < n; i++) {
    const t = nextAllowTimes[i]
    if (t <= now && t < readyMin) {
      readyMin = t
      readyLane = i
    }
  }
  if (readyLane >= 0) return { lane: readyLane, spawnAt: now }

  let lane = 0
  let minT = nextAllowTimes[0]
  for (let i = 1; i < n; i++) {
    if (nextAllowTimes[i] < minT) {
      minT = nextAllowTimes[i]
      lane = i
    }
  }
  return { lane, spawnAt: minT }
}
