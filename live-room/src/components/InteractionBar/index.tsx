import { View, Text } from '@tarojs/components'

import './index.scss'

export type InteractionBarProps = {
  likeCount: number
  commentActive?: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onOpenGames: () => void
}

export function InteractionBar({
  likeCount,
  commentActive,
  onLike,
  onComment,
  onShare,
  onOpenGames
}: InteractionBarProps) {
  return (
    <View className='interaction-bar'>
      <View className='interaction-bar__inner'>
        <View className='interaction-bar__item' onClick={onLike}>
          <Text className='interaction-bar__icon'>❤</Text>
          <Text className='interaction-bar__label'>点赞</Text>
          <Text className='interaction-bar__count'>{likeCount > 999 ? '999+' : likeCount}</Text>
        </View>
        <View
          className={`interaction-bar__item ${commentActive ? 'interaction-bar__item--active' : ''}`}
          onClick={onComment}
        >
          <Text className='interaction-bar__icon'>💬</Text>
          <Text className='interaction-bar__label'>评论</Text>
        </View>
        <View className='interaction-bar__item' onClick={onShare}>
          <Text className='interaction-bar__icon'>↗</Text>
          <Text className='interaction-bar__label'>转发</Text>
        </View>
        <View className='interaction-bar__item interaction-bar__item--accent' onClick={onOpenGames}>
          <Text className='interaction-bar__icon'>🎮</Text>
          <Text className='interaction-bar__label'>玩法</Text>
        </View>
      </View>
    </View>
  )
}
