// pages/detail/detail.js
const { getSpiritDetail, fixImageUrl } = require('../../utils/request.js')

Page({
  data: {
    loading: true,
    spirit: null,
    id: null,
    raceBars: []
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ id: Number(id) })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await getSpiritDetail(this.data.id)
      const spirit = res.spirit
      // 修复所有图片相对路径
      spirit.image = fixImageUrl(spirit.image)
      spirit.shiny_image = fixImageUrl(spirit.shiny_image)
      if (spirit.evolution_chain) {
        spirit.evolution_chain = spirit.evolution_chain.map(e => ({
          ...e,
          image: fixImageUrl(e.image)
        }))
      }
      if (spirit.forms) {
        spirit.forms = spirit.forms.map(f => ({
          ...f,
          image: fixImageUrl(f.image)
        }))
      }
      // 计算种族值条
      const raceBars = this.buildRaceBars(spirit)
      this.setData({ spirit, raceBars })
    } catch (err) {
      console.error('[Detail] 加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 用这个精灵查孵蛋结果
  queryBySpirit() {
    const { spirit } = this.data
    if (!spirit) return
    // 取身高体重范围中值跳转首页
    const hText = spirit.height_text || ''
    const wText = spirit.weight_text || ''
    // 解析范围取中值
    const hMatch = hText.match(/([\d.]+)\s*-\s*([\d.]+)/)
    const wMatch = wText.match(/([\d.]+)\s*-\s*([\d.]+)/)
    if (hMatch && wMatch) {
      const h = ((parseFloat(hMatch[1]) + parseFloat(hMatch[2])) / 2).toFixed(2)
      const w = ((parseFloat(wMatch[1]) + parseFloat(wMatch[2])) / 2).toFixed(3)
      wx.reLaunch({ url: `/pages/index/index?h=${h}&w=${w}` })
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  // 分享
  onShareAppMessage() {
    const { spirit } = this.data
    if (spirit) {
      return {
        title: `${spirit.base_name} — 洛克王国图鉴`,
        path: `/pages/detail/detail?id=${this.data.id}`
      }
    }
    return {
      title: '洛克王国精灵图鉴',
      path: '/pages/detail/detail'
    }
  },

  // 构建种族值条
  buildRaceBars(spirit) {
    if (!spirit || !spirit.race_total) return []
    const maxVal = 200  // 单项最大值参考
    const items = [
      { label: '生命', value: spirit.hp || 0, color: '#4caf50' },
      { label: '物攻', value: spirit.attack || 0, color: '#f44336' },
      { label: '魔攻', value: spirit.magic_attack || 0, color: '#9c27b0' },
      { label: '物防', value: spirit.defense || 0, color: '#2196f3' },
      { label: '魔防', value: spirit.magic_defense || 0, color: '#00bcd4' },
      { label: '速度', value: spirit.speed || 0, color: '#ff9800' }
    ]
    return items.map(i => ({
      ...i,
      percent: Math.min(100, Math.round(i.value / maxVal * 100))
    }))
  },

  // 跳转进化形态
  goEvolution(e) {
    const id = e.currentTarget.dataset.id
    if (id && id !== this.data.id) {
      wx.redirectTo({ url: `/pages/detail/detail?id=${id}` })
    }
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.previewImage({ urls: [url], current: url })
    }
  }
})
