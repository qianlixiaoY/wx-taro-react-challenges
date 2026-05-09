import { useEffect, useMemo, useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'

import type { DanmakuMessage } from '@/types/danmaku'
import { decorateDanmakuMessage } from '@/utils/danmakuKeyword'
import { DANMAKU_FILTER_KEYWORDS, DANMAKU_HIGHLIGHT_KEYWORDS } from '@/constants/danmaku'

import './index.scss'

export type DanmakuHistorySheetProps = {
  visible: boolean
  /** 返回按时间从新到旧排序的快照 */
  getMessages: () => DanmakuMessage[]
  onClose: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const p2 = (n: number) => `${n}`.padStart(2, '0')
  return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
}

export function DanmakuHistorySheet({ visible, getMessages, onClose }: DanmakuHistorySheetProps) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<DanmakuMessage[]>([])

  useEffect(() => {
    if (!visible) return
    setRows(getMessages())
    const t = setInterval(() => setRows(getMessages()), 600)
    return () => clearInterval(t)
  }, [visible, getMessages])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((m) => {
      const blob = `${m.user.name} ${m.text} ${m.id}`.toLowerCase()
      return blob.includes(q)
    })
  }, [query, rows])

  if (!visible) return null

  return (
    <View className='dm-history'>
      <View className='dm-history__mask' onClick={onClose} />
      <View className='dm-history__sheet'>
        <View className='dm-history__header'>
          <Text className='dm-history__title'>历史弹幕</Text>
          <Text className='dm-history__close' onClick={onClose}>
            关闭
          </Text>
        </View>
        <View className='dm-history__search'>
          <Input
            className='dm-history__input'
            value={query}
            placeholder='搜索昵称 / 内容 / id'
            confirmType='search'
            onInput={(e) => setQuery(e.detail.value)}
          />
        </View>
        <ScrollView scrollY className='dm-history__list'>
          {filtered.map((m) => {
            const { segments, blockedFromFlying } = decorateDanmakuMessage(
              m,
              DANMAKU_FILTER_KEYWORDS,
              DANMAKU_HIGHLIGHT_KEYWORDS
            )
            return (
              <View key={m.id} className='dm-history__row'>
                <Text className='dm-history__time'>{formatTime(m.sendTime)}</Text>
                <View className='dm-history__main'>
                  <View className='dm-history__meta'>
                    <Text className='dm-history__nick'>{m.user.name}</Text>
                    {blockedFromFlying ? (
                      <Text className='dm-history__tag'>含过滤词</Text>
                    ) : null}
                  </View>
                  <Text className='dm-history__id'>{m.id}</Text>
                  <Text className='dm-history__text'>
                    {segments.map((s, i) => (
                      <Text key={`${m.id}-h-${i}`} className={s.highlight ? 'dm-history__hl' : ''}>
                        {s.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              </View>
            )
          })}
          {!filtered.length ? <Text className='dm-history__empty'>无匹配记录</Text> : null}
        </ScrollView>
      </View>
    </View>
  )
}
