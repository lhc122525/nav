<template>
  <el-container class="layoutContainer">
    <el-header height="60px" class="mainHeader" :class="{ 'isDark': isHome }">
      <div class="container headerContent">
        <NuxtLink class="brand" to="/">
          <el-icon :size="18" class="brandIcon"><StarFilled /></el-icon>
          <span class="brandText">首页</span>
        </NuxtLink>

        <nav class="desktopNav">
          <NuxtLink class="navLink" to="/submit" active-class="active">
            <el-icon class="navIcon yellow"><Star /></el-icon> 申请收录
          </NuxtLink>
          <NuxtLink class="navLink" to="/guestbook" active-class="active">
            <el-icon class="navIcon red"><ChatDotRound /></el-icon> 留言板
          </NuxtLink>
        </nav>

        <div class="spacer" />

        <div class="headerActions desktopNav">
          <div v-if="isHome" class="headerTime">
            <span class="time">{{ nowTimeText }}</span>
            <span class="date">{{ nowDateText }}</span>
          </div>

          <!-- <el-button link class="actionIconBtn">
            <el-icon :size="18"><ChatLineRound /></el-icon>
          </el-button>
           -->
          <el-button v-if="!me?.user" type="success" class="loginBtn" @click="onGuestCommand('login')">
            登录
          </el-button>
          <el-dropdown v-else @command="onUserCommand">
            <el-button link class="userProfile">
              <el-avatar :size="28" class="userAvatar">{{ me.user.username[0] }}</el-avatar>
              <span class="username">{{ me.user.username }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" class="logoutItem">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <el-button class="mobileMenuBtn" circle @click="mobileMenuOpen = true">
          <el-icon :size="20"><MenuIcon /></el-icon>
        </el-button>
      </div>
    </el-header>

    <el-main class="layoutMain">
      <div class="mainContent">
        <slot />
      </div>
    </el-main>

    <el-drawer v-model="mobileMenuOpen" title="菜单" direction="rtl" size="80%">
      <div class="mobileUser">
        <div v-if="me?.user" class="mobileUsername">
          {{ me.user.username }}
        </div>
        <div v-else class="mobileUsername">
          未登录
        </div>
      </div>
      <el-menu :default-active="mobileActive" @select="onMobileSelect">
        <el-menu-item index="route:/">
          首页
        </el-menu-item>
        <el-menu-item index="route:/submit">
          申请收录
        </el-menu-item>
        <el-menu-item index="route:/guestbook">
          留言板
        </el-menu-item>
        <!-- <el-menu-item index="route:/admin/nav">
          后台
        </el-menu-item>
        <el-menu-item index="route:/openapi">
          OpenAPI
        </el-menu-item> -->
        <el-menu-item v-if="!me?.user" index="action:login">
          登录
        </el-menu-item>
        <el-menu-item v-if="!me?.user" index="action:register">
          注册
        </el-menu-item>
        <el-menu-item v-else index="action:logout">
          退出登录
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <el-dialog v-model="loginOpen" title="登录" append-to-body style="max-width: 550px;width: 90vw;">
      <el-form label-width="72px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="loginOpen = false">取消</el-button>
        <el-button type="primary" :loading="loginSubmitting" @click="submitLogin">
          登录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="registerOpen" title="注册" append-to-body style="max-width: 550px;width: 90vw;">
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="100px" @submit.prevent>
        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="registerForm.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model.trim="registerForm.password" type="password" autocomplete="new-password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="passwordConfirm">
          <el-input v-model.trim="registerForm.passwordConfirm" type="password" autocomplete="new-password" show-password />
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <div class="captchaRow">
            <el-input
              v-model.trim="registerForm.captcha"
              autocomplete="off"
              placeholder="请输入验证码"
              @keydown.enter.prevent="submitRegister"
            />
            <el-button class="captchaText" text @click="refreshRegisterCaptcha">
              {{ registerCaptchaText }}
            </el-button>
            <!-- <el-button class="captchaRefresh" text @click="refreshRegisterCaptcha">
              刷新
            </el-button> -->
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerOpen = false">取消</el-button>
        <el-button type="primary" :loading="registerSubmitting" @click="submitRegister">
          注册
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import {
  StarFilled,
  Star,
  ArrowDown,
  SwitchButton,
  Promotion,
  ChatDotRound,
  ChatLineRound,
  Menu as MenuIcon
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const { public: publicConfig } = useRuntimeConfig()
const siteName = computed(() => publicConfig.siteName || '导航站')
const isHome = computed(() => route.path === '/')

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const nowTimeText = computed(() => {
  const d = now.value
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`  
})
const nowDateText = computed(() => {
  const d = now.value
  const date = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(d)
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(d)
  return `${date} ${weekday}`
})

type MeResponse = { user: null | { id: number; username: string; role: 'admin' | 'user' } }

const { data: meData, refresh: refreshMe } = await useFetch<MeResponse>('/api/auth/me', { server: true })
const me = computed(() => meData.value)

const mobileMenuOpen = ref(false)
const route = useRoute()
const mobileActive = computed(() => `route:${route.path}`)

const loginOpen = ref(false)
const registerOpen = ref(false)

const loginForm = reactive({ username: '', password: '' })
const registerFormRef = ref<FormInstance>()
const registerForm = reactive({ username: '', password: '', passwordConfirm: '', captcha: '' })

function generateCaptchaText(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const chars = alphabet + digits
  let result = ''
  for (let i = 0; i < length; i += 1) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

const registerCaptchaText = ref(generateCaptchaText(5))
function refreshRegisterCaptcha() {
  registerCaptchaText.value = generateCaptchaText(5)
  registerForm.captcha = ''
  registerFormRef.value?.clearValidate(['captcha'])
}

watch(registerOpen, (open) => {
  if (!open) return
  refreshRegisterCaptcha()
})

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度需为 3-20', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度需为 6-64', trigger: 'blur' },
  ],
  passwordConfirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: unknown, callback: (error?: Error) => void) => {
        if (String(value || '') !== registerForm.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (_rule, value: unknown, callback: (error?: Error) => void) => {
        const input = String(value || '').trim().toUpperCase()
        const expected = String(registerCaptchaText.value || '').trim().toUpperCase()
        if (!input) callback(new Error('请输入验证码'))
        else if (input !== expected) callback(new Error('验证码错误，请重试'))
        else callback()
      },
      trigger: ['blur', 'change'],
    },
  ],
}

const loginSubmitting = ref(false)
const registerSubmitting = ref(false)


function onGuestCommand(command: string) {
  if (command === 'login') {
    loginOpen.value = true
    return
  }
  if (command === 'register') {
    registerOpen.value = true
  }
}

async function onUserCommand(command: string) {
  if (command !== 'logout') return
  const { $api } = useNuxtApp()
  await $api('/api/auth/logout', { method: 'POST' })
  await refreshMe()
}

async function onMobileSelect(index: string) {
  if (index.startsWith('route:')) {
    mobileMenuOpen.value = false
    await navigateTo(index.slice('route:'.length))
    return
  }

  if (index === 'action:login') {
    mobileMenuOpen.value = false
    loginOpen.value = true
    return
  }
  if (index === 'action:register') {
    mobileMenuOpen.value = false
    registerOpen.value = true
    return
  }
  if (index === 'action:logout') {
    mobileMenuOpen.value = false
    await onUserCommand('logout')
  }
}

async function submitLogin() {
  const { $api } = useNuxtApp()
  loginSubmitting.value = true
  try {
    await $api('/api/auth/login', { method: 'POST', body: loginForm })
    loginOpen.value = false
    loginForm.password = ''

    await refreshMe()
  } catch {
    // const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    // ElMessage.error("登录失败，请重试")
  } finally {
    loginSubmitting.value = false
  }
}

async function submitRegister() {
  const { $api } = useNuxtApp()
  const valid = await registerFormRef.value?.validate().catch(() => false)
  if (!valid) return

  registerSubmitting.value = true
  try {
    await $api('/api/auth/register', {
      method: 'POST',
      body: { username: registerForm.username, password: registerForm.password },
    })
    registerOpen.value = false
    registerForm.password = ''
    registerForm.passwordConfirm = ''
    registerForm.captcha = ''
    loginForm.username = registerForm.username
    loginForm.password = ''
    loginOpen.value = true
    ElMessage({
      message: '注册成功，请登录',
      type: 'success',
      plain: true,
    })
  } catch {
    refreshRegisterCaptcha()
    // const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    // ElMessage({
    //   message: msg || (e instanceof Error ? e.message : '注册失败，请重试'),
    //   type: 'error',
    //   plain: true,
    //   duration: 3000000,
    // })
  } finally {
    registerSubmitting.value = false
  }
}
</script>

<style scoped>
.layoutContainer {
  min-height: 100vh;
  background-color: #f6f8fa;
  overflow: visible;
}

.mainHeader {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e1e4e8;
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.mainHeader.isDark {
  background-color: #000;
  border-bottom: none;
  backdrop-filter: none;
}

.actionIconBtn {
  color: rgba(255, 255, 255, 0.6);
  padding: 8px;
}

.actionIconBtn:hover {
  color: #fff;
}

.headerContent {
  display: flex;
  align-items: center;
  width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #24292e;
  margin-right: 30px;
}

.isDark .brand {
  color: #fff;
}

.brandIcon {
  color: #0969da;
}

.isDark .brandIcon {
  color: #ffca28;
}

.navIcon {
  font-size: 16px;
}

.navIcon.yellow {
  color: #ffca28;
}

.navIcon.red {
  color: #ff4d4f;
}

.brandText {
  font-size: 14px;
  font-weight: 600;
}

.desktopNav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.navLink {
  text-decoration: none;
  color: #57606a;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.isDark .navLink {
  color: rgba(255, 255, 255, 0.85);
}

.navLink:hover {
  background-color: #f3f4f6;
  color: #24292e;
}

.isDark .navLink:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.navLink.active {
  color: #0969da;
  background-color: #eaf2ff;
  font-weight: 600;
}

.isDark .navLink.active {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.15);
}

.spacer {
  flex: 1;
}

.headerTime {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.headerTime .time {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.headerTime .date {
  opacity: 1;
}

.loginBtn {
  font-weight: 600;
  border-radius: 18px;
  padding: 6px 16px;
  height: 32px;
  font-size: 13px;
  background-color: #28c76f !important;
  border-color: #28c76f !important;
}

.userProfile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.isDark .userProfile {
  color: #fff;
}

.userProfile:hover {
  background-color: #f3f4f6;
}

.isDark .userProfile:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  font-weight: 600;
  color: #24292e;
  padding-left: 5px;
}

.isDark .username {
  color: #fff;
}

.userAvatar {
  background-color: #0969da;
  font-weight: 700;
}

.logoutItem {
  color: #cf222e;
}

.mobileMenuBtn {
  display: none;
}

.isDark .mobileMenuBtn {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
  background: transparent;
}

.layoutMain {
  padding: 0;
  overflow: visible;
}

.mainContent {
  padding: 0;
  overflow: visible;
}

@media (max-width: 768px) {
  .desktopNav {
    display: none;
  }
  .mobileMenuBtn {
    display: flex;
  }
  .brand {
    margin-right: 0;
  }
}

.mobileUser {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f1f2f4;
}

.mobileUsername {
  font-size: 18px;
  font-weight: 700;
  color: #24292e;
}

.captchaRow {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.captchaText {
  min-width: 110px;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 0 12px;
  height: 32px;
}

.captchaRefresh {
  white-space: nowrap;
}
</style>
