// pages/compendium/compendium.js
const { getSpirits, fixImageUrl } = require('../../utils/request.js')

const ATTRIBUTES = ['', '火', '水', '草', '电', '冰', '地', '翼', '光', '暗', '幻', '幽', '恶', '普通', '机械', '武', '毒', '萌', '虫', '龙']

Page({
  data: {
    keyword: '',
    activeAttr: '',
    items: [],
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 0,
    loading: false,
    hasMore: true,
    attributes: ATTRIBUTES
  },

  onLoad() {
    this.loadMore()
  },

  // 搜索输入（防抖）
  _searchTimer: null,
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
    clearTimeout(this._searchTimer)
    this._searchTimer = setTimeout(() => {
      this.setData({ page: 1, items: [], hasMore: true })
      this.loadMore()
    }, 500)
  },

  // 属性筛选
  setAttribute(e) {
    const attr = e.currentTarget.dataset.attr
    this.setData({
      activeAttr: attr,
      page: 1,
      items: [],
      hasMore: true
    })
    this.loadMore()
  },

  // 加载更多
  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await getSpirits({
        q: this.data.keyword || undefined,
        attribute: this.data.activeAttr || undefined,
        page: this.data.page,
        pageSize: this.data.pageSize
      })

      // 修复图片路径
      const fixedItems = (res.items || []).map(item => ({
        ...item,
        image: fixImageUrl(item.image)
      }))

      const newItems = this.data.items.concat(fixedItems)
      const totalPages = res.total_pages || 1

      this.setData({
        items: newItems,
        total: res.total || 0,
        totalPages,
        hasMore: this.data.page < totalPages,
        page: this.data.page + 1
      })
    } catch (err) {
      console.error('[Compendium] 加载失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 滚动到底部加载更多
  onReachBottom() {
    this.loadMore()
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '洛克王国精灵图鉴 — 全精灵数据查询',
      path: '/pages/compendium/compendium'
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1, items: [], hasMore: true })
    this.loadMore().then(() => wx.stopPullDownRefresh())
  }
})
