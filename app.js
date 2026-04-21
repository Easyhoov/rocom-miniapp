const { cache } = require('./utils/cache.js')

App({
  globalData: {
    apiReady: false
  },

  onLaunch() {
    console.log('[App] 洛克王国孵蛋查询启动')
    // 启动时预热 API 连接
    const { healthCheck } = require('./utils/request.js')
    healthCheck().then(() => {
      this.globalData.apiReady = true
    }).catch(() => {})
  }
})
