/**
 * 网络请求封装 — 按 skill 规范
 * 所有异步操作必须有 loading 状态和错误处理
 */

const { cache } = require('./cache.js')

// 基础 URL — 域名备案后替换
const BASE_URL = 'https://rocom.online'

/**
 * 基础请求
 */
const request = (options, retryCount = 1) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      timeout: options.timeout || 10000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({
            code: res.statusCode,
            message: res.data?.detail || res.data?.msg || '请求失败'
          })
        }
      },
      fail(err) {
        if (retryCount > 0) {
          console.warn('[Request] 网络异常，重试中...', options.url)
          setTimeout(() => {
            request(options, retryCount - 1).then(resolve).catch(reject)
          }, 500)
        } else {
          reject({ code: -1, message: '网络异常，请检查网络连接' })
        }
      }
    })
  })
}

/**
 * 带 loading 的请求封装 — skill 规范要求
 */
const requestWithLoading = async (options, loadingText = '加载中...') => {
  wx.showLoading({ title: loadingText, mask: true })
  try {
    const result = await request(options)
    return result
  } catch (err) {
    wx.showToast({ title: err.message || '请求失败', icon: 'none', duration: 2000 })
    throw err
  } finally {
    wx.hideLoading()
  }
}

// ========== 业务接口 ==========

/**
 * 孵蛋查询
 */
function queryEgg(height, weight, eggFilter = null) {
  const data = { height, weight }
  if (eggFilter !== null && eggFilter !== undefined) {
    data.precious = eggFilter
  }
  return requestWithLoading({ url: '/api/query', data }, '查询中...')
}

/**
 * 精灵列表（图鉴）
 */
function getSpirits(options = {}) {
  const { q, attribute, eggGroup, shiny, page = 1, pageSize = 24 } = options
  const data = { page, page_size: pageSize }
  if (q) data.q = q
  if (attribute) data.attribute = attribute
  if (eggGroup) data.egg_group = eggGroup
  if (shiny) data.shiny = shiny
  return requestWithLoading({ url: '/api/spirits', data })
}

/**
 * 精灵详情
 */
function getSpiritDetail(spiritId) {
  return requestWithLoading({ url: `/api/spirits/${spiritId}` })
}

/**
 * 数据统计（带缓存）
 */
async function getStats() {
  const cached = cache.get('stats')
  if (cached && !cache.isExpired('stats', 24)) return cached
  try {
    const result = await request({ url: '/api/stats' })
    cache.set('stats', result, 24)
    return result
  } catch (err) {
    if (cached) return cached  // 降级用旧缓存
    throw err
  }
}

/**
 * 健康检查
 */
function healthCheck() {
  return request({ url: '/health', timeout: 5000 })
}

/**
 * 将相对图片路径转为绝对 URL
 * API 返回 image: "/creature-atlas/001-base.webp"
 * 小程序 image 组件需要完整 URL
 */
function fixImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

module.exports = {
  BASE_URL,
  request,
  requestWithLoading,
  fixImageUrl,
  queryEgg,
  getSpirits,
  getSpiritDetail,
  getStats,
  healthCheck
}
