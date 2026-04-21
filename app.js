const { cache } = require('./utils/cache.js')

App({
  globalData: {
    // 域名备案后替换 request.js 中的 BASE_URL
    apiReady: false
  },

  onLaunch() {
    console.log('[App] 洛克王国孵蛋查询启动')
  }
})
