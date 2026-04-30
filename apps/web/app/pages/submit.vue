<template>
  <div class="container">
    <el-card shadow="never" style="margin-bottom: 12px">
      <template #header>
        <div class="header">
          申请收录
        </div>
      </template>

      <div v-if="!me?.user" class="login-tip">
        <el-alert type="info" :closable="false" show-icon>
          请登录后再提交收录申请。
        </el-alert>
      </div>
      <el-form v-else label-width="90px" @submit.prevent>
        <el-form-item label="站点标题">
          <el-input v-model="form.title" placeholder="例如：我的博客" />
        </el-form-item>
        <el-form-item label="站点 URL">
          <el-input v-model="form.url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="简短描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="介绍一下这个站点..." />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.contact" placeholder="可选：邮箱/微信等" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">
            提交
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert v-if="status.type" :type="status.type" :title="status.message" show-icon />
  </div>
</template>

<script setup lang="ts">

useHead(() => ({ title: '申请收录 - 非乐鱼导航' }))


// 使用全局用户状态（plugin 已在 app 初始化时获取用户数据）
const { userMe } = useUserMe()
const me = computed(() => userMe.value)


const form = reactive({
  title: '',
  url: '',
  description: '',
  contact: ''
})

const submitting = ref(false)
const status = reactive<{ type: '' | 'success' | 'error'; message: string }>({ type: '', message: '' })

async function submit() {
  if (submitting.value) return // Basic debounce
  
  if (!me.value?.user) {
    status.type = 'error'
    status.message = '请登录后再提交'
    return
  }

  if (!form.title.trim() || !form.url.trim()) {
    status.type = 'error'
    status.message = '站点标题和 URL 不能为空'
    return
  }

  const { $api } = useNuxtApp()
  status.type = ''
  status.message = ''
  submitting.value = true
  try {
    await $api('/api/submissions', { method: 'POST', body: form })
    status.type = 'success'
    status.message = '提交成功，感谢支持！'
    form.title = ''
    form.url = ''
    form.description = ''
    form.contact = ''
  } catch (e: unknown) {
    status.type = 'error'
    const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    status.message = msg || (e instanceof Error ? e.message : '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.header {
  font-weight: 600;
}
.container {
  padding: 24px;
}
.login-tip {
  margin-bottom: 24px;
}
</style>
