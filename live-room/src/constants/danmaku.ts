/** 含任一子串的弹幕不在飞行层展示（仍写入历史，历史里可搜到） */
export const DANMAKU_FILTER_KEYWORDS = ['垃圾广告', '加微信', '代刷']

/** 含任一子串的片段在飞行层高亮 */
export const DANMAKU_HIGHLIGHT_KEYWORDS = ['主播', '666', '加油']

/** 轨道数量：每条轨道独立做横向碰撞检测 */
export const DANMAKU_LANE_COUNT = 7

/** 弹幕横向速度（px/ms），与 duration 推导一致 */
export const DANMAKU_SPEED_PX_PER_MS = 0.2

/** 飞出左缘外的额外位移（px），须与动画 translate 总路程一致 */
export const DANMAKU_FLIGHT_TAIL_PX = 32

/** 每帧最多从积压队列中发射的条数（配合峰值采样） */
export const DANMAKU_MAX_SPAWN_PER_TICK = 6

/** 待发射队列上限，超出丢弃并计数（模拟热门房背压） */
export const DANMAKU_PENDING_CAP = 4000

/** Dock 弹幕列表 ScrollView 最大高度（px），超出则内部滚动 */
export const DANMAKU_DOCK_SCROLL_MAX_PX = 440
/** 列表区最小高度（px） */
export const DANMAKU_DOCK_SCROLL_MIN_PX = 72

export const SYSTEM_WARNING_MSG = '欢迎来到直播间。直播间内禁止未成年人打赏礼物或进行直播/连麦，禁止主播诱导观众私下交易。如发现违规行为，请及时举报。'
/** 直播间默认内容 */
export const DanmuDefaultList = [
    {
        id: '',
        user: {
            avatar: 'https://dummyimage.com/64x64/eeeeee/333333.png&text=ME',
            name: '系统'
        },
        text: SYSTEM_WARNING_MSG,
        color: '#FFFFFF',
        sendTime: Date.now()
    }
]
