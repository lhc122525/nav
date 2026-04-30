import type { ComputedRef, Ref } from 'vue'

export type UserRole = 'admin' | 'user'
export type MeResponse = {
  user: null | {
    id: number
    username: string
    userAlias: string
    role: UserRole
  }
}

const USER_STATE_KEY = 'userMe'

/**
 * 获取用户登录状态的通用方法
 * - 如果全局状态已有用户数据，直接返回
 * - 如果状态为空，主动调用 /api/auth/me 获取用户信息（cookie 是 httpOnly，客户端无法读取）
 */
export function useUserMe() {
  // 全局用户状态
  const userMe = useState<MeResponse>(USER_STATE_KEY, () => ({ user: null }))

  // 是否正在获取用户信息
  const fetching = ref(false)

  // 用户是否已登录
  const isLoggedIn = computed(() => !!userMe.value?.user)

  // 用户信息
  const user = computed(() => userMe.value?.user)

  /**
   * 刷新用户信息
   * 从 /api/auth/me 获取最新的用户数据
   */
  const refreshUserMe = async () => {
    if (fetching.value) return

    fetching.value = true
    try {
      const res = await $fetch<MeResponse>('/api/auth/me')
      userMe.value = res
    } catch {
      userMe.value = { user: null }
    } finally {
      fetching.value = false
    }
  }

  /**
   * 初始化用户状态
   * - 如果状态已有用户数据，不重复获取
   * - 否则调用 API 获取用户信息（服务器会通过 httpOnly cookie 验证）
   */
  const initUserMe = async () => {
    // 已有用户数据，不需要重新获取
    if (userMe.value?.user) return

    // 调用 API 获取用户信息
    await refreshUserMe()
  }

  /**
   * 设置用户数据
   * 用于登录成功后直接设置用户数据，避免额外请求
   */
  const setUserMe = (data: MeResponse) => {
    userMe.value = data
  }

  /**
   * 清除用户状态
   * 用于退出登录时清除全局状态
   */
  const clearUserMe = () => {
    userMe.value = { user: null }
  }

  return {
    userMe: userMe as Ref<MeResponse>,
    user: user as ComputedRef<MeResponse['user']>,
    isLoggedIn,
    fetching,
    refreshUserMe,
    initUserMe,
    setUserMe,
    clearUserMe
  }
}