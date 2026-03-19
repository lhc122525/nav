<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 12px">
      <template #header>
        <div class="header">
          申请收录
        </div>
      </template>

      <el-form label-width="90px" @submit.prevent>
        <el-form-item label="站点标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="站点 URL">
          <el-input v-model="form.url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="简短描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
useHead(() => ({ title: '申请收录 - 导航站' }))

const form = reactive({
  title: '',
  url: '',
  description: '',
  contact: ''
})

const submitting = ref(false)
const status = reactive<{ type: '' | 'success' | 'error'; message: string }>({ type: '', message: '' })

async function submit() {
  status.type = ''
  status.message = ''
  submitting.value = true
  try {
    await $fetch('/api/submissions', { method: 'POST', body: form })
    status.type = 'success'
    status.message = '提交成功，感谢支持！'
    form.title = ''
    form.url = ''
    form.description = ''
    form.contact = ''
  } catch (e: unknown) {
    status.type = 'error'
    status.message = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.header {
  font-weight: 600;
}
</style>

