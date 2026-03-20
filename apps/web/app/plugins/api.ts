import { $fetch as ofetch } from 'ofetch'
import { ElMessage } from 'element-plus'

export default defineNuxtPlugin(() => {
  class ApiError extends Error {
    statusCode: number
    msg: string
    data: unknown
    url: string

    constructor(params: { statusCode: number; msg: string; data: unknown; url: string }) {
      super(params.msg)
      this.statusCode = params.statusCode
      this.msg = params.msg
      this.data = params.data
      this.url = params.url
    }
  }

  function pickMsg(data: unknown, fallback: string) {
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (!data || typeof data !== 'object') return fallback

    const anyData = data as Record<string, unknown>
    const msg = anyData['msg']
    if (typeof msg === 'string' && msg.trim()) return msg.trim()

    const inner = anyData['data']
    if (inner && typeof inner === 'object') {
      const innerMsg = (inner as Record<string, unknown>)['msg']
      if (typeof innerMsg === 'string' && innerMsg.trim()) return innerMsg.trim()
    }

    const statusMessage = anyData['statusMessage']
    if (typeof statusMessage === 'string' && statusMessage.trim()) return statusMessage.trim()

    const message = anyData['message']
    if (typeof message === 'string' && message.trim()) return message.trim()

    return fallback
  }

  const nuxtFetch = (globalThis as unknown as { $fetch?: typeof ofetch }).$fetch || ofetch
  const api = (async (request: Parameters<typeof nuxtFetch>[0], options?: Parameters<typeof nuxtFetch>[1]) => {
    try {
      return await nuxtFetch(request, options)
    } catch (e: unknown) {
      if (e instanceof ApiError) throw e

      const anyError = e as Record<string, unknown> | null
      const url = typeof anyError?.url === 'string' ? String(anyError.url) : typeof request === 'string' ? request : String(request)
      const statusCode = typeof anyError?.statusCode === 'number' ? Number(anyError.statusCode) : 0
      const data = anyError && 'data' in anyError ? (anyError as { data?: unknown }).data : null
      const msg = pickMsg(data, typeof anyError?.message === 'string' ? String(anyError.message) : '请求失败')

      if (import.meta.client) {
        ElMessage({
          message: msg,
          type: 'error',
          plain: true,
          appendTo: document.body,
          customClass: 'message',
          zIndex: 9999,
        })
      }

      throw new ApiError({ statusCode, msg, data, url })
    }
  }) as typeof nuxtFetch

  return { provide: { api } }
})
