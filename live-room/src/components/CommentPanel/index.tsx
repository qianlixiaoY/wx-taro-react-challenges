import { useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'

import './index.scss'

export type CommentItem = {
  id: string
  nick: string
  text: string
}

export type CommentPanelProps = {
  visible: boolean
  list: CommentItem[]
  onClose: () => void
  onSend: (text: string) => void
}

export function CommentPanel({ visible, list, onClose, onSend }: CommentPanelProps) {
  const [draft, setDraft] = useState('')

  if (!visible) return null

  const submit = () => {
    const t = draft.trim()
    if (!t) return
    onSend(t)
    setDraft('')
  }

  return (
    <View className='comment-panel'>
      <View className='comment-panel__mask' onClick={onClose} />
      <View className='comment-panel__sheet'>
        <View className='comment-panel__header'>
          <Text className='comment-panel__title'>弹幕评论</Text>
          <Text className='comment-panel__close' onClick={onClose}>
            关闭
          </Text>
        </View>
        <ScrollView scrollY className='comment-panel__list'>
          {list.map((c) => (
            <View key={c.id} className='comment-panel__row'>
              <Text className='comment-panel__nick'>{c.nick}</Text>
              <Text className='comment-panel__text'>{c.text}</Text>
            </View>
          ))}
          {!list.length ? (
            <Text className='comment-panel__empty'>暂无评论，抢沙发～</Text>
          ) : null}
        </ScrollView>
        <View className='comment-panel__input-row'>
          <Input
            className='comment-panel__input'
            value={draft}
            placeholder='说点什么…'
            maxlength={80}
            confirmType='send'
            onInput={(e) => setDraft(e.detail.value)}
            onConfirm={submit}
          />
          <Text className='comment-panel__send' onClick={submit}>
            发送
          </Text>
        </View>
      </View>
    </View>
  )
}
