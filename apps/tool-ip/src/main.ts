import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
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

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// 乾坤生命周期
export async function bootstrap() {
  console.log('[tool-ip] bootstrapped')
}

export async function mount(props: { container?: HTMLElement }) {
  console.log('[tool-ip] mounted', props)
  render(props)
}

export async function unmount() {
  console.log('[tool-ip] unmounted')
  app?.unmount()
  app = null
}

// 类型声明
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean
  }
}