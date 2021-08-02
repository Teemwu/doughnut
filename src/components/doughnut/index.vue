<template>
  <canvas style="width: 200px; height: 200px;"
          id="canvas"
          canvas-id="canvas"
          :type="is2D?'2d':''"
          @touchstart="canvasTouch"></canvas>
</template>

<script>
import { createCanvasContext, createSelectorQuery, getSystemInfoSync, nextTick } from '@tarojs/taro'

export default {
  props: {
    value: {
      type: Array,
      default: () => []
    },
    active: {
      type: Number,
      default: -1
    },
    renderText: Function,
    is2D: {
      type: Boolean,
      default: false
    },
    border: {
      type: Number,
      default: 32
    },
    activeBorder: {
      type: Number,
      default: 36
    },
    duration: {
      type: Number,
      default: 600
    },
    borderBgColor: {
      type: String,
      default: '#efefef'
    },
    borderColors: {
      type: Array,
      default: () => ['#6d77e6', '#fe4e75', '#fcd95c', '#3bdeff']
    },
    tipsColor: {
      type: String,
      default: '#ffffff'
    },
    tipsSize: {
      type: Number,
      default: 8
    }
  },
  data() {
    return {
      r: 65,
      centerPoint: { x: 100, y: 100 },
      textPoints: [],
      activeIndex: -1,
      angles: [],
      timer: null,
      canvas: null,
      ctx: null,
      intervel: 16
    }
  },
  watch: {
    value: {
      immediate: false,
      handler(val) {
        if (val && val.length) this.animate()
      }
    },
    active(val, oval) {
      if (val !== oval) {
        this.activeIndex = val
        this.init()
      }
    }
  },
  methods: {
    /**
     * 二次方缓动函数
     * currentTime：当前动画执行的时长
     * startValue：开始值
     * changeValue：变化量，即动画执行到最后的值
     * duration：动画持续执行的时间
     */
    easeInQuadratic(currentTime, startValue, changeValue, duration) {
      currentTime /= duration
      return changeValue * currentTime * currentTime + startValue
    },
    requestAnimationFrame(callback, lastTime = 0) {
      const { canvas, is2D, intervel } = this
      const start = new Date().getTime()

      if (is2D && canvas && canvas.requestAnimationFrame) {
        this.timer = canvas.requestAnimationFrame(() => {
          const now = new Date().getTime()
          lastTime += now - start
          callback(lastTime)
        })
      } else {
        this.timer = setTimeout(() => {
          const now = new Date().getTime()
          lastTime += now - start
          callback(lastTime)
        }, intervel)
      }
    },
    cancelAnimationFrame() {
      const { is2D, canvas, timer, ctx } = this
      if (is2D && canvas && canvas.cancelAnimationFrame) {
        canvas.cancelAnimationFrame(timer)
      } else {
        clearTimeout(timer)
      }
    },
    canvasTouch(e) {
      const { centerPoint, r, angles, border, activeIndex } = this
      const { x, y } = e.changedTouches[0]
      const { x: _x, y: _y } = centerPoint
      // 两点距离
      const len = Math.sqrt(Math.pow(_y - y, 2) + Math.pow(_x - x, 2))
      const borderHalf = border / 2
      // 是否在弧线内
      const isInRing = len > r - borderHalf && len < r + borderHalf
      let current = activeIndex

      if (isInRing) {
        // 获取圆心角
        let angle = Math.atan2(y - _y, x - _x)
        // 判断弧度是否为负，为负时需要转正
        angle = angle > 0 ? angle : 2 * Math.PI + angle

        angles.some((item, index) => {
          // 是否在弧度内
          if (item > angle) {
            current = index
            return true
          }
        })
      } else {
        current = -1
      }

      this.activeIndex = current
      this.init()
    },
    animate() {
      const { border, is2D, ctx, value, duration, borderBgColor, timer } = this
      if (ctx) {
        if (timer) this.cancelAnimationFrame()

        const callback = lastTime => {
          ctx.clearRect(0, 0, 200, 200)

          lastTime = lastTime >= duration ? duration : lastTime

          if (lastTime === duration) {
            this.cancelAnimationFrame()
            this.activeIndex = this.active
            this.init()
            return
          }

          const ratios = value.map(i => this.easeInQuadratic(lastTime, 0, i, duration))

          this.drawArc(0, 2 * Math.PI, border, borderBgColor)
          this.drawArcs(ratios)

          if (!is2D) ctx.draw()

          this.requestAnimationFrame(callback, lastTime)
        }

        this.requestAnimationFrame(callback)
      } else {
        this.initCanvas()
      }
    },
    /**画中心区域 */
    drawCenter() {
      const { r, border, is2D, centerPoint, ctx } = this
      const { x, y } = centerPoint
      /**画圆遮挡 */
      ctx.beginPath()
      ctx.arc(x, y, r - border / 2, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.closePath()

      const fontSize = 12

      if (is2D) {
        ctx.font = fontSize
        ctx.fillStyle = '#203e62'
      } else {
        ctx.setFontSize(fontSize)
        ctx.setFillStyle('#203e62')
      }

      /**画圆中心的文字 */
      const { width } = ctx.measureText('结果统计')
      ctx.fillText('结果统计', x - width / 2, y + fontSize / 2)
    },
    /**绘画每段百分比文本 */
    drawText() {
      const { textPoints, renderText, is2D, ctx, tipsColor, tipsSize } = this

      if (is2D) {
        ctx.font = tipsSize
        ctx.fillStyle = tipsColor
      } else {
        ctx.setFontSize(tipsSize)
        ctx.setFillStyle(tipsColor)
      }

      textPoints.forEach((item, index) => {
        if (item.value > 0) {
          const { width } = ctx.measureText(`${item.value}%`)
          const x = item.x - width / 2
          const y = item.y + tipsSize / 2
          const text = renderText ? renderText(index) : `${item.value}%`

          ctx.fillText(text, x, y)
        }
      })
    },
    /**
     * 画弧线
     */
    drawArc(sAngle, eAngle, border, color) {
      const { r, centerPoint, ctx } = this
      const { x, y } = centerPoint

      ctx.beginPath()
      ctx.lineWidth = border
      ctx.strokeStyle = color
      ctx.arc(x, y, r, sAngle, eAngle, false)
      ctx.stroke()
      ctx.closePath()
    },
    drawArcs(ratios) {
      const { r, activeIndex, borderColors, border, activeBorder, centerPoint, ctx } = this
      const { x: _x, y: _y } = centerPoint
      const _angles = []
      const _textPoints = []
      let sAngle = 0

      ratios.forEach((item, index) => {
        const angle = (item * Math.PI) / 50
        const eAngle = sAngle + angle

        const _activeBorder = activeIndex === index && ratios.length > 1 ? (activeBorder - border) * 2 : 0
        const _border = border + _activeBorder
        const _color = borderColors[index]

        this.drawArc(sAngle, eAngle, _border, _color)

        // 要绘制文本所在点的弧度
        const _angle = sAngle + angle / 2

        const x = _x + r * Math.cos(_angle)
        const y = _y + r * Math.sin(_angle)

        _textPoints.push({ x, y, value: item })
        _angles.push(eAngle)

        sAngle = eAngle
      })

      this.angles = _angles
      this.textPoints = _textPoints
    },
    init() {
      const { border, is2D, ctx, value } = this
      ctx.clearRect(0, 0, 200, 200)

      /**画环形图的背景 */
      this.drawArc(0, 2 * Math.PI, border, '#efefef')

      this.drawArcs(value)

      this.drawText()

      this.drawCenter()

      if (!is2D) ctx.draw()
    },
    initCanvas() {
      if (this.is2D) {
        createSelectorQuery()
          .select('#canvas')
          .fields({ node: true, size: true })
          .exec(res => {
            const canvas = res[0].node
            const _ctx = canvas.getContext('2d')
            const dpr = getSystemInfoSync().pixelRatio

            canvas.width = res[0].width * dpr
            canvas.height = res[0].height * dpr
            _ctx.scale(dpr, dpr)

            this.canvas = canvas
            this.ctx = _ctx
            if (_ctx) this.animate()
          })
      } else {
        this.ctx = createCanvasContext('canvas')
        if (this.ctx) this.animate()
      }
    }
  },
  mounted() {
    this.initCanvas()
  }
}
</script>