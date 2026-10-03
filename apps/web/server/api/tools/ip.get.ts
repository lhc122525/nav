// 查询访问者公网 IP 及归属地信息（供 tool-ip 微应用使用）
//
// 背景：第三方 IP API（如 ipapi.co）已启用 Cloudflare 人机验证且在国内不稳定，
// 浏览器直连会被拦截，因此统一改为服务端查询。
//
// 链路：nginx 反代会传递 X-Forwarded-For / X-Real-IP。
// X-Forwarded-For 取最后一跳（由自家 nginx 追加的真实客户端 IP，前面的条目可被伪造）；
// 若是内网/保留地址（本地开发时 Vite 代理会注入 ::1），则查服务器出口 IP。

const IP_API_FIELDS = 'status,message,country,regionName,city,isp,timezone,query'
const TIMEOUT = 5000

interface IpApiResult {
  status: string
  message?: string
  country?: string
  regionName?: string
  city?: string
  isp?: string
  timezone?: string
  query?: string
}

interface IpWhoResult {
  success?: boolean
  message?: string
  ip?: string
  country?: string
  region?: string
  city?: string
  connection?: { isp?: string; org?: string }
  timezone?: { id?: string }
}

// 内网 / 保留地址（含 IPv4 私网段与 IPv6 本地地址）
function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase()
  return (
    v === '' ||
    v === '::1' ||
    v.startsWith('fe80:') ||
    v.startsWith('fc') ||
    v.startsWith('fd') ||
    /^127\./.test(v) ||
    /^10\./.test(v) ||
    /^192\.168\./.test(v) ||
    /^169\.254\./.test(v) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v) ||
    /^0\./.test(v)
  )
}

export default defineEventHandler(async (event) => {
  const headers = getRequestHeaders(event)
  // X-Forwarded-For: <可伪造的入口>, ..., <nginx 追加的真实客户端 IP>
  const forwarded = String(headers['x-forwarded-for'] || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const rawIp = forwarded.length > 0
    ? forwarded[forwarded.length - 1]
    : String(headers['x-real-ip'] || '').trim()

  // 内网地址（本地开发等场景）查归属地无意义，改为查询出口 IP
  const targetIp = isPrivateIp(rawIp) ? '' : rawIp

  // 主查询：ip-api.com（国内服务器可达、中文结果；免费版仅支持 HTTP，服务端调用不受浏览器限制）
  try {
    const url = targetIp
      ? `http://ip-api.com/json/${encodeURIComponent(targetIp)}?lang=zh-CN&fields=${IP_API_FIELDS}`
      : `http://ip-api.com/json?lang=zh-CN&fields=${IP_API_FIELDS}`
    const data = await $fetch<IpApiResult>(url, { timeout: TIMEOUT })
    if (data.status === 'success' && data.query) {
      return {
        ip: data.query,
        country: data.country || '',
        region: data.regionName || '',
        city: data.city || '',
        isp: data.isp || '',
        timezone: data.timezone || ''
      }
    }
    console.warn('[tools/ip] ip-api.com 返回失败:', data.message)
  } catch (err) {
    console.error('[tools/ip] ip-api.com 查询失败:', err)
  }

  // 备用：ipwho.is（HTTPS、支持 CORS）
  try {
    const url = targetIp ? `https://ipwho.is/${encodeURIComponent(targetIp)}` : 'https://ipwho.is/'
    const data = await $fetch<IpWhoResult>(url, { timeout: TIMEOUT })
    if (data.success === true && data.ip) {
      return {
        ip: data.ip,
        country: data.country || '',
        region: data.region || '',
        city: data.city || '',
        isp: data.connection?.isp || data.connection?.org || '',
        timezone: data.timezone?.id || ''
      }
    }
    console.warn('[tools/ip] ipwho.is 返回失败:', data.message)
  } catch (err) {
    console.error('[tools/ip] ipwho.is 查询失败:', err)
  }

  throw createError({ statusCode: 502, statusMessage: 'IP 查询服务暂不可用，请稍后重试' })
})
