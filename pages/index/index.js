// pages/index/index.js
const { queryEgg, fixImageUrl } = require('../../utils/request.js')

Page({
  data: {
    height: '',
    weight: '',
    eggFilter: 0,           // 0=神奇的蛋, 1=炫彩蛋, null=不限，默认神奇的蛋（和原项目一致）
    loading: false,
    queried: false,
    shake: false,           // 校验失败抖动动画
    showRTip: false,        // R值说明弹窗

    // 查询结果
    allResults: [],
    total: 0,
    normalCount: 0,
    preciousCount: 0,
    userR: '0',

    // 结果筛选 tab
    resultTab: 'all',       // all / normal / special
    filteredResults: []
  },

  // 身高输入
  onHeightInput(e) {
    this.setData({ height: e.detail.value })
  },

  // 体重输入
  onWeightInput(e) {
    this.setData({ weight: e.detail.value })
  },

  // 蛋类型筛选
  setFilter(e) {
    const val = e.currentTarget.dataset.value
    this.setData({
      eggFilter: val === '' ? null : Number(val)
    })
  },

  // 结果 tab 切换
  setResultTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ resultTab: tab })
    this.filterResults()
  },

  // 按 tab 过滤结果
  filterResults() {
    const { allResults, resultTab } = this.data
    let filtered
    if (resultTab === 'normal') {
      filtered = allResults.filter(r => !r.is_precious)
    } else if (resultTab === 'special') {
      filtered = allResults.filter(r => r.is_precious)
    } else {
      filtered = allResults
    }
    this.setData({ filteredResults: filtered })
  },

  // 校验失败抖动
  triggerShake() {
    this.setData({ shake: true })
    setTimeout(() => this.setData({ shake: false }), 300)
  },

  // 查询
  async doQuery() {
    const { height, weight, eggFilter, loading } = this.data
    if (loading) return

    // 校验 — 失败时输入框抖动（和原项目一致）
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!h || h <= 0 || !w || w <= 0) {
      this.triggerShake()
      return
    }

    this.setData({ loading: true })

    try {
      const res = await queryEgg(h, w, eggFilter)
      // 修复图片相对路径为绝对 URL
      const results = (res.results || []).map(r => ({
        ...r,
        image: fixImageUrl(r.image)
      }))
      this.setData({
        allResults: results,
        total: res.total || 0,
        normalCount: res.normal_count || 0,
        preciousCount: res.precious_count || 0,
        userR: res.user_r ? res.user_r.toFixed(2) : '0',
        queried: true,
        resultTab: 'all'
      })
      this.filterResults()
    } catch (err) {
      console.error('[Index] 查询失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.spiritId
    if (id) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
    }
  },

  // R 值说明
  showRTip() {
    this.setData({ showRTip: true })
  },
  hideRTip() {
    this.setData({ showRTip: false })
  },

  // 分享 — 带参数
  onShareAppMessage() {
    const { height, weight, eggFilter } = this.data
    if (height && weight) {
      return {
        title: `身高${height}m 体重${weight}kg 能孵出什么精灵？`,
        path: `/pages/index/index?h=${height}&w=${weight}&f=${eggFilter != null ? eggFilter : ''}`
      }
    }
    return {
      title: '洛克王国孵蛋查询 — 看看你的蛋能孵出什么！',
      path: '/pages/index/index'
    }
  },

  // 接收分享参数自动查询
  onLoad(options) {
    if (options.h && options.w) {
      this.setData({
        height: options.h,
        weight: options.w,
        eggFilter: options.f !== undefined && options.f !== '' ? Number(options.f) : 0
      })
      this.doQuery()
    }
  }
})
