export type DanmakuUser = {
  avatar: string
  name: string
}

export type DanmakuMessage = {
  id: string
  user: DanmakuUser
  text: string
  color: string
  sendTime: number
}

export type DanmakuFlyingItem = {
  message: DanmakuMessage
  lane: number
  durationMs: number
  widthEst: number
  /** 关键词高亮后的片段 */
  segments: { text: string; highlight: boolean }[]
  /** 被关键词过滤：不飞入画面，但仍可进历史（由上层策略决定） */
  blockedFromFlying: boolean
}
