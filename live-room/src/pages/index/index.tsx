import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

import './index.scss'

export default function Index() {
  const goLive = () => {
    Taro.navigateTo({ url: '/pages/live/index' })
  }

  return (
    <View className='home'>
      <View className='home__hero'>
        <Text className='home__title'>互动直播间</Text>
        <Text className='home__subtitle'>
          点赞 · 评论 · 转发 · 红包雨与小游戏（演示）
        </Text>
      </View>
      <View className='home__card' onClick={goLive}>
        <Text className='home__card-title'>进入直播间</Text>
        <Text className='home__card-desc'>体验摄像头 MJPEG + 互动玩法（学习用）</Text>
      </View>
      <Text className='home__hint'>
        学习步骤：先在本机运行 Python（server + uvicorn），再在 live-room 执行 npm run dev:weapp，用微信开发者工具打开 dist
        目录；详情里勾选「不校验合法域名」便于访问 http 摄像头接口；画面域名改 src/constants/stream.ts。
      </Text>
    </View>
  )
}
