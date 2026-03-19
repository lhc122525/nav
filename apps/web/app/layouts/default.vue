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

    <el-dialog v-model="loginOpen" title="登录" width="420px">
      <el-form label-width="72px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
      </el-form>
      <el-alert v-if="loginError" type="error" :title="loginError" show-icon />
      <template #footer>
        <el-button @click="loginOpen = false">取消</el-button>
        <el-button type="primary" :loading="loginSubmitting" @click="submitLogin">
          登录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="registerOpen" title="注册" width="420px">
      <el-form label-width="72px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" autocomplete="new-password" show-password />
        </el-form-item>
      </el-form>
      <el-alert v-if="registerError" type="error" :title="registerError" show-icon />
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
const registerForm = reactive({ username: '', password: '' })

const loginSubmitting = ref(false)
const registerSubmitting = ref(false)

const loginError = ref('')
const registerError = ref('')

function onGuestCommand(command: string) {
  if (command === 'login') {
    loginError.value = ''
    loginOpen.value = true
    return
  }
  if (command === 'register') {
    registerError.value = ''
    registerOpen.value = true
  }
}

async function onUserCommand(command: string) {
  if (command !== 'logout') return
  await $fetch('/api/auth/logout', { method: 'POST' })
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
    loginError.value = ''
    loginOpen.value = true
    return
  }
  if (index === 'action:register') {
    mobileMenuOpen.value = false
    registerError.value = ''
    registerOpen.value = true
    return
  }
  if (index === 'action:logout') {
    mobileMenuOpen.value = false
    await onUserCommand('logout')
  }
}

async function submitLogin() {
  loginError.value = ''
  loginSubmitting.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: loginForm })
    loginOpen.value = false
    loginForm.password = ''
    await refreshMe()
  } catch (e: unknown) {
    loginError.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loginSubmitting.value = false
  }
}

async function submitRegister() {
  registerError.value = ''
  registerSubmitting.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: registerForm })
    registerOpen.value = false
    registerForm.password = ''
    loginError.value = ''
    loginForm.username = registerForm.username
    loginForm.password = ''
    loginOpen.value = true
  } catch (e: unknown) {
    registerError.value = e instanceof Error ? e.message : '注册失败'
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
</style>
