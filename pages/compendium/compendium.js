// pages/compendium/compendium.js
const { getSpirits, fixImageUrl } = require('../../utils/request.js')

const ATTRIBUTES = [
  { value: '', label: '全部', emoji: '🎯' },
  { value: '火', label: '火', emoji: '🔥' },
  { value: '水', label: '水', emoji: '💧' },
  { value: '草', label: '草', emoji: '🌿' },
  { value: '电', label: '电', emoji: '⚡' },
  { value: '冰', label: '冰', emoji: '❄️' },
  { value: '地', label: '地', emoji: '🌍' },
  { value: '翼', label: '翼', emoji: '🪽' },
  { value: '光', label: '光', emoji: '⭐' },
  { value: '暗', label: '暗', emoji: '🌑' },
  { value: '幻', label: '幻', emoji: '🔮' },
  { value: '幽', label: '幽', emoji: '👻' },
  { value: '恶', label: '恶', emoji: '😈' },
  { value: '普通', label: '普通', emoji: '🐾' },
  { value: '机械', label: '机械', emoji: '⚙️' },
  { value: '武', label: '武', emoji: '🥊' },
  { value: '毒', label: '毒', emoji: '☠️' },
  { value: '萌', label: '萌', emoji: '💕' },
  { value: '虫', label: '虫', emoji: '🐛' },
  { value: '龙', label: '龙', emoji: '🐉' }
]

// 属性背景色映射
const ATTR_BG = {
  '火': 'linear-gradient(135deg, #FFD6D6, #FFB8B8)',
  '水': 'linear-gradient(135deg, #D6F0FF, #B8E0FF)',
  '草': 'linear-gradient(135deg, #E8FFD6, #C8FF99)',
  '电': 'linear-gradient(135deg, #FFF8D6, #FFE880)',
  '冰': 'linear-gradient(135deg, #E0F8FF, #B8ECFF)',
  '地': 'linear-gradient(135deg, #F5E8D0, #E8D4B0)',
  '翼': 'linear-gradient(135deg, #E8E0FF, #D0C0FF)',
  '光': 'linear-gradient(135deg, #FFF3D6, #FFE8A0)',
  '暗': 'linear-gradient(135deg, #E0D8E8, #C8B8D8)',
  '幻': 'linear-gradient(135deg, #F0D6FF, #E0B8FF)',
  '幽': 'linear-gradient(135deg, #D8D0E8, #C0B0D8)',
  '恶': 'linear-gradient(135deg, #E8D0D0, #D8B0B0)',
  '普通': 'linear-gradient(135deg, #F0EEE8, #E0DCD0)',
  '机械': 'linear-gradient(135deg, #E0E8F0, #C8D4E0)',
  '武': 'linear-gradient(135deg, #FFE0D0, #FFC8B0)',
  '毒': 'linear-gradient(135deg, #E0D6F0, #C8B8E0)',
  '萌': 'linear-gradient(135deg, #FFD6F0, #FFB8E0)',
  '虫': 'linear-gradient(135deg, #E8FFD0, #D0FFA0)',
  '龙': 'linear-gradient(135deg, #D6E0FF, #B0C0FF)'
}

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
    loadError: false,
    attributes: ATTRIBUTES
  },

  onLoad() {
    this.loadMore()
  },

  // 获取属性背景色
  getAttrBg(attr) {
    return ATTR_BG[attr] || 'linear-gradient(135deg, #F0EEE8, #E0DCD0)'
  },

  // 获取属性 emoji
  getAttrEmoji(attr) {
    const found = ATTRIBUTES.find(a => a.value === attr)
    return found ? found.emoji : '🐾'
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

    this.setData({ loading: true, loadError: false })

    try {
      const res = await getSpirits({
        q: this.data.keyword || undefined,
        attribute: this.data.activeAttr || undefined,
        page: this.data.page,
        pageSize: this.data.pageSize
      })

      const fixedItems = (res.items || []).map(item => ({
        ...item,
        image: fixImageUrl(item.image),
        attrBg: ATTR_BG[item.primary_attribute] || 'linear-gradient(135deg, #F0EEE8, #E0DCD0)',
        attrEmoji: (ATTRIBUTES.find(a => a.value === item.primary_attribute) || {}).emoji || '🐾'
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
      this.setData({ loadError: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  onReachBottom() {
    this.loadMore()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
    }
  },

  onShareAppMessage() {
    return {
      title: '洛克王国精灵图鉴 — 全精灵数据查询',
      path: '/pages/compendium/compendium'
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, items: [], hasMore: true })
    this.loadMore().then(() => wx.stopPullDownRefresh())
  }
})
