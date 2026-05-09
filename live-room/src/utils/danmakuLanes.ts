import { DANMAKU_LANE_GAP_PX, DANMAKU_SPEED_PX_PER_MS } from '@/constants/danmaku'

export type LaneActive = {
  id: string
  lane: number
  t0: number
  w: number
}

/** 估算弹幕条宽度（px），用于碰撞与时间计算 */
export function estimateDanmakuWidthPx(text: string, screenW: number): number {
  const avatar = 36
  const pad = 28
  const perChar = 13
  const textW = Math.min(screenW * 0.72, Math.max(40, text.length * perChar))
  return Math.ceil(avatar + pad + textW)
}

/** 穿过屏幕所需时间：从右侧外到左侧外 */
export function flightDurationMs(screenW: number, w: number, speed: number = DANMAKU_SPEED_PX_PER_MS): number {
  const dist = screenW + w
  return Math.max(10000, Math.ceil(dist / speed))
}

export function pruneLaneActives(actives: LaneActive[], now: number, screenW: number, speed: number): LaneActive[] {
  return actives.filter((a) => {
    const x = screenW - speed * (now - a.t0)
    return x + a.w > -40
  })
}

/**
 * 新弹幕左边缘从 x=screenW 入场，与轨道上仍在场的弹幕做一维碰撞检测
 */
export function laneCollidesAtSpawn(
  laneActives: LaneActive[],
  now: number,
  wNew: number,
  screenW: number,
  speed: number,
  gap: number = DANMAKU_LANE_GAP_PX
): boolean {
  const xNew = screenW
  for (const a of laneActives) {
    const xA = screenW - speed * (now - a.t0)
    const overlap = xA + a.w > xNew - gap && xA < xNew + wNew + gap
    if (overlap) return true
  }
  return false
}

export function pickLaneForSpawn(
  lanes: LaneActive[][],
  now: number,
  wNew: number,
  screenW: number,
  speed: number = DANMAKU_SPEED_PX_PER_MS
): number | null {
  for (let i = 0; i < lanes.length; i++) {
    const cleaned = pruneLaneActives(lanes[i], now, screenW, speed)
    lanes[i] = cleaned
    if (!laneCollidesAtSpawn(cleaned, now, wNew, screenW, speed)) return i
  }
  return null
}
