<template>
  <view class="index">
    <Doughnut v-model="ratios"
              :radius="100"
              :width="300"
              :height="300"
              :active="activeIndex"
              :duration="900"
              :renderText="renderTextHandle"
              centerText="结果显示"
              :centerTextSize="14" />
    <button @tap="changeRatios">动态改变数值</button>
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
      ratios: [1, 49, 15, 35],
      activeIndex: 1
    }
  },
  methods: {
    changeRatios() {
      this.activeIndex = Math.round(Math.random() * 4)
      this.ratios = [15, 35, 20, 30]
    },
    renderTextHandle(index) {
      const str = 'ABCD'
      return `${str[index]}:${this.ratios[index]}%`
    }
  }
}
</script>
