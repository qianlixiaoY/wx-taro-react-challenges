import type { DanmakuMessage } from '@/types/danmaku'

const AVA = [
  'https://dummyimage.com/64x64/4a90d9/ffffff.png&text=A',
  'https://dummyimage.com/64x64/e94b7a/ffffff.png&text=B',
  'https://dummyimage.com/64x64/50c878/ffffff.png&text=C',
  'https://dummyimage.com/64x64/f5a623/ffffff.png&text=D'
]

const PHRASES = [
  '主播加油！',
  '666666',
  '这段好看',
  '来了来了',
  '前方高能',
  '泪目',
  '哈哈哈哈',
  '垃圾广告代刷', // 命中过滤词
  '家人们谁懂啊',
  '主播唱得好',
  '礼物走一波',
  '666 主播稳',
  '加个微信私聊你', // 过滤
  '晚安晚安'
]

export function makeSampleDanmaku(i: number): DanmakuMessage {
  const id = `msg-${i}-${Math.random().toString(16).slice(2, 8)}`
  const name = `用户${(i % 40) + 1}`
  const text = PHRASES[i % PHRASES.length]
  const color = i % 5 === 0 ? '#FFDD55' : '#FFFFFF'
  return {
    id,
    user: { avatar: AVA[i % AVA.length], name },
    text,
    color,
    sendTime: Date.now()
  }
}

/** 构造一批用于压测/演示的消息（非随机，便于复现） */
export function makeDanmakuBatch(startIndex: number, count: number): DanmakuMessage[] {
  const out: DanmakuMessage[] = []
  for (let k = 0; k < count; k++) out.push(makeSampleDanmaku(startIndex + k))
  return out
}

/** 文档与手测用的固定样例（含过滤、高亮、指定 id） */
export const DANMAKU_ACCEPTANCE_SAMPLES: DanmakuMessage[] = [
  // {
  //   id: 'msg-615',
  //   user: { avatar: AVA[0], name: '用户A' },
  //   text: '主播加油！',
  //   color: '#FF0000',
  //   sendTime: 1_722_968_348_123
  // },
  {
    id: 'msg-highlight-1',
    user: { avatar: AVA[1], name: '粉丝鑫**' },
    text: '666 主播今天状态太好了',
    color: '#FFFFFF',
    sendTime: 1_722_968_348_200
  },
  // {
  //   id: 'msg-filter-1',
  //   user: { avatar: AVA[2], name: '路人' },
  //   text: '垃圾广告请不要信',
  //   color: '#AAAAAA',
  //   sendTime: 1_722_968_348_260
  // },
  // {
  //   id: 'msg-plain',
  //   user: { avatar: AVA[3], name: '念祈' },
  //   text: '哦豁，一个高密的居然位列四品',
  //   color: '#FFFFFF',
  //   sendTime: 1_722_968_348_320
  // }
]
