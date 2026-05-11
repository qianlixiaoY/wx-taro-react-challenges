import {
  DANMAKU_FILTER_KEYWORDS,
  DANMAKU_HIGHLIGHT_KEYWORDS,
  DANMAKU_SPEED_PX_PER_MS
} from '@/constants/danmaku'
import { isBlockedFromFlying, splitHighlightSegments } from '@/utils/danmakuKeyword'
import {
  estimateDanmakuWidthPx,
  flightDistancePx,
  flightDurationMs,
  laneSlotDurationMs,
  pickLaneByNextAllowTime
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

  const w1 = estimateDanmakuWidthPx('短')
  const w2 = estimateDanmakuWidthPx('这是一段明显更长的弹幕文本用于宽度估算')
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
  const n = 7
  const busy0 = Array.from({ length: n }, (_, i) => (i === 0 ? now + 5000 : 0))
  const pickReady = pickLaneByNextAllowTime(busy0, now)
  lines.push(
    pickReady.lane === 1 && pickReady.spawnAt === now
      ? ok('nextAllow 调度：有空轨时 spawnAt 为当前时刻')
      : fail(`nextAllow 空轨：期望 lane=1 spawnAt=${now}，实际 lane=${pickReady.lane} spawnAt=${pickReady.spawnAt}`)
  )

  const allBusy = Array.from({ length: n }, () => now + 3000)
  const pickWait = pickLaneByNextAllowTime(allBusy, now)
  lines.push(
    pickWait.lane === 0 && pickWait.spawnAt === now + 3000
      ? ok('nextAllow 调度：全忙时选最小 next 且 spawnAt 为最早可发射')
      : fail(`nextAllow 全忙：期望 lane=0 spawnAt=${now + 3000}，实际 lane=${pickWait.lane} spawnAt=${pickWait.spawnAt}`)
  )

  const slot = laneSlotDurationMs(screenW, 100, speed)
  lines.push(slot > 0 ? ok('轨道时间片 laneSlotDurationMs > 0') : fail('轨道时间片应大于 0'))

  const wProbe = 300
  const distProbe = flightDistancePx(screenW, wProbe)
  const d = flightDurationMs(screenW, wProbe)
  lines.push(
    d === Math.max(100, Math.ceil(distProbe / speed))
      ? ok('飞行时长与路程/速度一致（同速）')
      : fail('飞行时长与路程/速度不一致')
  )

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
