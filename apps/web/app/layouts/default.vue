<template>
  <div>
    <el-container>
      <el-header height="56px">
        <div class="container header">
          <NuxtLink class="brand" to="/">
            {{ siteName }}
          </NuxtLink>
          <NuxtLink class="nav" to="/">
            首页
          </NuxtLink>
          <NuxtLink class="nav" to="/submit">
            申请收录
          </NuxtLink>
          <NuxtLink class="nav" to="/guestbook">
            留言板
          </NuxtLink>
          <div class="spacer" />
          <a class="link" href="/login" @click.prevent="loginDialogOpen = true">
            登录
          </a>
          <NuxtLink class="link" to="/admin">
            后台
          </NuxtLink>
          <NuxtLink class="link" to="/openapi">
            OpenAPI
          </NuxtLink>
        </div>
      </el-header>
      <el-main>
        <div class="container page">
          <slot />
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="loginDialogOpen" title="管理员登录" width="420px">
      <el-form label-width="72px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="error" type="error" :title="error" show-icon />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
const { public: publicConfig } = useRuntimeConfig()
const siteName = computed(() => publicConfig.siteName || '导航站')

const loginDialogOpen = ref(false)
const username = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')

watch(loginDialogOpen, (open) => {
  if (!open) {
    error.value = ''
    password.value = ''
  }
})

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/admin/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: { username: username.value, password: password.value }
    })
    loginDialogOpen.value = false
    await navigateTo('/admin')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    submitting.value = false
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
</style>
