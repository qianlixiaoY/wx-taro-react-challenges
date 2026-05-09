import {
  DANMAKU_FILTER_KEYWORDS,
  DANMAKU_HIGHLIGHT_KEYWORDS,
  DANMAKU_LANE_GAP_PX,
  DANMAKU_SPEED_PX_PER_MS
} from '@/constants/danmaku'
import { isBlockedFromFlying, splitHighlightSegments } from '@/utils/danmakuKeyword'
import {
  estimateDanmakuWidthPx,
  flightDurationMs,
  laneCollidesAtSpawn,
  pickLaneForSpawn,
  pruneLaneActives,
  type LaneActive
} from '@/utils/danmakuLanes'
import { DANMAKU_ACCEPTANCE_SAMPLES } from '@/utils/danmakuSamples'

export type ProofLine = { ok: boolean; message: string }

function ok(msg: string): ProofLine {
  return { ok: true, message: `✓ ${msg}` }
}

function fail(msg: string): ProofLine {
  return { ok: false, message: `✗ ${msg}` }
}

/**
 * 纯函数自检：可在小程序启动或 H5 带参调用，不依赖 DOM
 */
export function runDanmakuProofSuite(): ProofLine[] {
  const lines: ProofLine[] = []

  const w1 = estimateDanmakuWidthPx('短', 390)
  const w2 = estimateDanmakuWidthPx('这是一段明显更长的弹幕文本用于宽度估算', 390)
  lines.push(w2 > w1 ? ok('宽度估算随文本增长') : fail('宽度估算未随文本增长'))

  const segs = splitHighlightSegments('主播666真棒', DANMAKU_HIGHLIGHT_KEYWORDS)
  const joined = segs.map((s) => s.text).join('')
  const hasHl = segs.some((s) => s.highlight)
  lines.push(joined === '主播666真棒' && hasHl ? ok('关键词高亮切分') : fail('关键词高亮切分'))

  lines.push(
    isBlockedFromFlying('请加微信刷单', DANMAKU_FILTER_KEYWORDS)
      ? ok('过滤关键词命中（加微信）')
      : fail('过滤关键词未命中')
  )
  lines.push(
    !isBlockedFromFlying('正常聊天内容', DANMAKU_FILTER_KEYWORDS)
      ? ok('正常文本不被过滤')
      : fail('正常文本被误过滤')
  )

  const screenW = 390
  const speed = DANMAKU_SPEED_PX_PER_MS
  const now = 10_000
  const existing: LaneActive[] = [{ id: 'a', lane: 0, t0: now - 200, w: 220 }]
  lines.push(
    laneCollidesAtSpawn(existing, now, 200, screenW, speed, DANMAKU_LANE_GAP_PX)
      ? ok('同轨碰撞检测：应判定重叠')
      : fail('同轨碰撞检测：应重叠但未检出')
  )

  const emptyLane: LaneActive[] = []
  lines.push(
    !laneCollidesAtSpawn(emptyLane, now, 200, screenW, speed, DANMAKU_LANE_GAP_PX)
      ? ok('空轨道不碰撞')
      : fail('空轨道误判碰撞')
  )

  const lanes: LaneActive[][] = [[{ id: 'x', lane: 0, t0: now - 20_000, w: 100 }], [], [], [], [], [], []]
  const picked = pickLaneForSpawn(lanes, now, 180, screenW, speed)
  lines.push(picked !== null ? ok(`多轨调度：找到轨道 #${picked}`) : fail('多轨调度失败'))

  const pruned = pruneLaneActives(
    [{ id: 'old', lane: 0, t0: 0, w: 100 }],
    now + 999_999,
    screenW,
    speed
  )
  lines.push(pruned.length === 0 ? ok('离场 prune：超时应清空') : fail('离场 prune 未清空'))

  const d = flightDurationMs(screenW, 300)
  lines.push(d >= 5200 ? ok('飞行时长下限合理') : fail('飞行时长异常'))

  lines.push(ok(`验收样例已加载 ${DANMAKU_ACCEPTANCE_SAMPLES.length} 条（见 danmakuSamples）`))

  return lines
}

export function proofSuiteAllPassed(lines: ProofLine[]): boolean {
  return lines.every((l) => l.ok)
}

export function formatProofLines(lines: ProofLine[]): string {
  return lines.map((l) => l.message).join('\n')
}

export function assertSampleMatchesSpec(): ProofLine {
  const s = DANMAKU_ACCEPTANCE_SAMPLES[0]
  const valid =
    s.id === 'msg-615' &&
    s.user.name === '用户A' &&
    s.text === '主播加油！' &&
    s.color === '#FF0000' &&
    s.sendTime === 1_722_968_348_123
  return valid ? ok('验收样例 msg-615 字段与题目一致') : fail('验收样例 msg-615 字段不一致')
}

export function runFullDanmakuProof(): { pass: boolean; lines: ProofLine[] } {
  const lines: ProofLine[] = [assertSampleMatchesSpec(), ...runDanmakuProofSuite()]
  return { pass: proofSuiteAllPassed(lines), lines }
}
