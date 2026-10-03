import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/es/helper'
import App from './App.vue'

let app: ReturnType<typeof createApp> | null = null

function render(props: { container?: HTMLElement } = {}) {
  const { container } = props

  app = createApp(App)
  app.use(ElementPlus)

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app!.component(key, component)
  }

  const containerEl = container ? container.querySelector('#app') : '#app'
  app.mount(containerEl as string | Element)
}

// 乾坤生命周期注册
// vite-plugin-qiankun 会把生命周期挂到 window['tool-ip']，由 qiankun 读取
renderWithQiankun({
  bootstrap() {
    console.log('[tool-ip] bootstrapped')
  },
  mount(props) {
    console.log('[tool-ip] mounted', props)
    render(props)
  },
  update() {},
  unmount() {
    console.log('[tool-ip] unmounted')
    app?.unmount()
    app = null
  }
})

// 独立运行
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
