<template>
  <view class="index">
    <Doughnut v-model="ratios"
              :active="activeIndex"
              :is2D="is2D"
              :duration="800"
              :renderText="renderTextHandle" />
  </view>
</template>

<script>
import './index.scss'
import Doughnut from '../../components/doughnut/index.vue'
import { getSystemInfo, getSystemInfoSync } from '@tarojs/taro'

export default {
  components: { Doughnut },
  data() {
    return {
      ratios: [20, 30, 15, 35],
      activeIndex: 1,
      is2D: true
    }
  },
  methods: {
    renderTextHandle(index) {
      const str = 'ABCD'
      return `${str[index]}:${this.ratios[index]}%`
    }
  },
  created() {
    try {
      const { platform } = getSystemInfoSync()
      this.is2D = platform === 'ios' || platform === 'android'
    } catch (error) {}
  }
}
</script>
