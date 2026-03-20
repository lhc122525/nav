<template>
  <el-container>
    <el-header height="56px">
      <div class="container header">
        <NuxtLink class="brand" to="/">
          {{ siteName }}
        </NuxtLink>
        <div class="desktopOnly">
          <NuxtLink class="nav" to="/">
            首页
          </NuxtLink>
          <NuxtLink class="nav" to="/submit">
            申请收录
          </NuxtLink>
          <NuxtLink class="nav" to="/guestbook">
            留言板
          </NuxtLink>
        </div>
        <div class="spacer" />
        <div class="desktopOnly">
          <el-dropdown v-if="!me?.user" @command="onGuestCommand">
            <span class="userTrigger">
              未登录
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="login">
                  登录
                </el-dropdown-item>
                <el-dropdown-item command="register">
                  注册
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown v-else @command="onUserCommand">
            <span class="userTrigger">
              {{ me.user.username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- <NuxtLink class="link" to="/admin/nav">
            后台
          </NuxtLink>
          <NuxtLink class="link" to="/openapi">
            OpenAPI
          </NuxtLink> -->
        </div>
        <el-button class="mobileOnly" @click="mobileMenuOpen = true">
          菜单
        </el-button>
      </div>
    </el-header>
    <el-main>
      <div class="container page">
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
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const { public: publicConfig } = useRuntimeConfig()
const siteName = computed(() => publicConfig.siteName || '导航站')

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
.header {
  display: flex;
  align-items: center;
  height: 56px;
}

.brand {
  font-size: 16px;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.spacer {
  flex: 1;
}

.nav {
  margin-left: 14px;
  color: inherit;
  text-decoration: none;
  opacity: 0.9;
}

.link {
  margin-left: 14px;
  color: inherit;
  text-decoration: none;
  opacity: 0.9;
}

.userTrigger {
  margin-left: 14px;
  cursor: pointer;
  opacity: 0.95;
  user-select: none;
}

.desktopOnly {
  display: flex;
  align-items: center;
}

.mobileOnly {
  display: none;
}

.mobileUser {
  margin-bottom: 12px;
}

.mobileUsername {
  font-weight: 600;
}

@media (max-width: 768px) {
  .desktopOnly {
    display: none;
  }

  .mobileOnly {
    display: inline-flex;
  }
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
