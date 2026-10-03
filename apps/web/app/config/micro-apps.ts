export interface MicroAppConfig {
  name: string
  title: string
  icon: string
  entry: string
  activeRule: string
  description?: string
}

// 开发环境配置
const devApps: MicroAppConfig[] = [
  {
    name: 'tool-ip',
    title: '获取当前IP',
    icon: 'Location',
    entry: '//localhost:8979',
    activeRule: '/tools/ip',
    description: '查看您的公网IP地址和地理位置信息'
  }
]

// 生产环境配置
const prodApps: MicroAppConfig[] = [
  {
    name: 'tool-ip',
    title: '获取当前IP',
    icon: 'Location',
    entry: '/tools-sub/ip/',
    activeRule: '/tools/ip',
    description: '查看您的公网IP地址和地理位置信息'
  }
]

export const microApps = import.meta.dev ? devApps : prodApps

// 获取当前激活的微应用
export function getActiveMicroApp(path: string): MicroAppConfig | undefined {
  return microApps.find(app => path.startsWith(app.activeRule))
}

// 图标映射
export const iconMap: Record<string, string> = {
  Location: 'Location',
  Document: 'Document',
  Picture: 'Picture',
  Grid: 'Grid',
  Tools: 'Tools',
  Cpu: 'Cpu',
  Connection: 'Connection',
  Key: 'Key'
}
