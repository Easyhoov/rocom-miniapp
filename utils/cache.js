/**
 * 本地缓存管理
 * 支持 TTL 过期、版本控制、批量操作
 */

const CACHE_PREFIX = 'rocom_'
const META_KEY = 'rocom_cache_meta'

/**
 * 获取缓存元数据
 */
function getMeta() {
  try {
    return wx.getStorageSync(META_KEY) || {}
  } catch (e) {
    return {}
  }
}

/**
 * 保存缓存元数据
 */
function setMeta(meta) {
  try {
    wx.setStorageSync(META_KEY, meta)
  } catch (e) {
    console.error('[Cache] 保存元数据失败:', e)
  }
}

/**
 * 设置缓存（带 TTL，单位：小时）
 */
function set(key, value, ttlHours = 24) {
  try {
    wx.setStorageSync(CACHE_PREFIX + key, value)
    const meta = getMeta()
    meta[key] = {
      time: Date.now(),
      ttl: ttlHours * 3600 * 1000
    }
    setMeta(meta)
    return true
  } catch (e) {
    console.error('[Cache] set 失败:', key, e)
    return false
  }
}

/**
 * 获取缓存
 */
function get(key) {
  try {
    return wx.getStorageSync(CACHE_PREFIX + key) || null
  } catch (e) {
    return null
  }
}

/**
 * 检查缓存是否过期
 */
function isExpired(key, maxHours = null) {
  const meta = getMeta()
  const entry = meta[key]
  if (!entry) return true

  const maxMs = maxHours !== null
    ? maxHours * 3600 * 1000
    : entry.ttl

  return (Date.now() - entry.time) > maxMs
}

/**
 * 删除缓存
 */
function remove(key) {
  try {
    wx.removeStorageSync(CACHE_PREFIX + key)
    const meta = getMeta()
    delete meta[key]
    setMeta(meta)
  } catch (e) {
    console.error('[Cache] remove 失败:', key, e)
  }
}

/**
 * 清除所有缓存
 */
function clear() {
  try {
    const meta = getMeta()
    Object.keys(meta).forEach(key => {
      wx.removeStorageSync(CACHE_PREFIX + key)
    })
    wx.removeStorageSync(META_KEY)
  } catch (e) {
    console.error('[Cache] clear 失败:', e)
  }
}

/**
 * 缓存包装器：有缓存用缓存，否则调函数并缓存结果
 */
async function wrap(key, ttlHours, fetchFn) {
  if (!isExpired(key, ttlHours)) {
    const cached = get(key)
    if (cached) return cached
  }
  try {
    const result = await fetchFn()
    set(key, result, ttlHours)
    return result
  } catch (e) {
    // 请求失败，降级用旧缓存
    const cached = get(key)
    if (cached) {
      console.warn('[Cache] 请求失败，使用旧缓存:', key)
      return cached
    }
    throw e
  }
}

/**
 * 获取缓存统计信息
 */
function stats() {
  const meta = getMeta()
  const keys = Object.keys(meta)
  let totalSize = 0

  keys.forEach(key => {
    try {
      const data = wx.getStorageSync(CACHE_PREFIX + key)
      if (data) {
        totalSize += JSON.stringify(data).length
      }
    } catch (e) {}
  })

  return {
    count: keys.length,
    sizeKB: Math.round(totalSize / 1024),
    entries: keys.map(key => ({
      key,
      expired: isExpired(key),
      age: Math.round((Date.now() - meta[key].time) / 60000) + '分钟前'
    }))
  }
}

const cache = { set, get, isExpired, remove, clear, wrap, stats }

module.exports = { cache }
