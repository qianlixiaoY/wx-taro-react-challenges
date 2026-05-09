import type { DanmakuMessage } from '@/types/danmaku'

export function textMatchesAnyKeyword(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase()
  return keywords.some((k) => t.includes(k.toLowerCase()))
}

export function isBlockedFromFlying(text: string, blockList: string[]): boolean {
  return textMatchesAnyKeyword(text, blockList)
}

export type TextSegment = { text: string; highlight: boolean }

/**
 * 按高亮词切分文本；无命中则整段非高亮
 */
export function splitHighlightSegments(text: string, highlights: string[]): TextSegment[] {
  if (!text) return [{ text: '', highlight: false }]
  if (!highlights.length) return [{ text, highlight: false }]

  const lower = text.toLowerCase()
  const hits: { start: number; end: number }[] = []
  for (const raw of highlights) {
    const k = raw.toLowerCase()
    if (!k) continue
    let from = 0
    while (from < lower.length) {
      const idx = lower.indexOf(k, from)
      if (idx === -1) break
      hits.push({ start: idx, end: idx + k.length })
      from = idx + 1
    }
  }
  if (!hits.length) return [{ text, highlight: false }]

  hits.sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: { start: number; end: number }[] = []
  for (const h of hits) {
    const last = merged[merged.length - 1]
    if (!last || h.start > last.end) merged.push({ ...h })
    else last.end = Math.max(last.end, h.end)
  }

  const out: TextSegment[] = []
  let cursor = 0
  for (const m of merged) {
    if (m.start > cursor) out.push({ text: text.slice(cursor, m.start), highlight: false })
    out.push({ text: text.slice(m.start, m.end), highlight: true })
    cursor = m.end
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), highlight: false })
  return out
}

export function decorateDanmakuMessage(
  msg: DanmakuMessage,
  blockList: string[],
  highlightList: string[]
): { segments: TextSegment[]; blockedFromFlying: boolean } {
  const blockedFromFlying = isBlockedFromFlying(msg.text, blockList)
  const segments = splitHighlightSegments(msg.text, highlightList)
  return { segments, blockedFromFlying }
}
