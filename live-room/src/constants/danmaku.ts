/** 含任一子串的弹幕不在飞行层展示（仍写入历史，历史里可搜到） */
export const DANMAKU_FILTER_KEYWORDS = ['垃圾广告', '加微信', '代刷']

/** 含任一子串的片段在飞行层高亮 */
export const DANMAKU_HIGHLIGHT_KEYWORDS = ['主播', '666', '加油']

/** 轨道数量：每条轨道独立做横向碰撞检测 */
export const DANMAKU_LANE_COUNT = 7

/** 弹幕横向速度（px/ms），与 duration 推导一致 */
export const DANMAKU_SPEED_PX_PER_MS = 0.42

/** 同轨_spawn 安全间距（px） */
export const DANMAKU_LANE_GAP_PX = 24

/** 每帧最多从积压队列中发射的条数（配合峰值采样） */
export const DANMAKU_MAX_SPAWN_PER_TICK = 6

/** 待发射队列上限，超出丢弃并计数（模拟热门房背压） */
export const DANMAKU_PENDING_CAP = 4000
