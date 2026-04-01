<template>
  <div class="wrap">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          后台登录
        </div>
      </template>

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
    </el-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead(() => ({ title: '后台登录 - 导航站' }))

const username = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  const { $api } = useNuxtApp()
  error.value = ''
  submitting.value = true
  try {
    await $api('/api/admin/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    await navigateTo('/admin')
  } catch (e: unknown) {
    const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    error.value = msg || (e instanceof Error ? e.message : '登录失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.card {
  width: 420px;
  max-width: 100%;
}

.header {
  font-weight: 600;
}
</style>
