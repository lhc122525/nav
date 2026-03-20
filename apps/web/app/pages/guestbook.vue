<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 12px">
      <template #header>
        <div class="header">
          留言板
        </div>
      </template>

      <el-form label-width="72px" @submit.prevent>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="可选" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">
            提交
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="status.type" :type="status.type" :title="status.message" show-icon />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="header">
          最新留言
        </div>
      </template>
      <el-empty v-if="messages.length === 0" description="暂无留言" />
      <el-timeline v-else>
        <el-timeline-item v-for="m in messages" :key="m.id" :timestamp="formatTime(m.createdAt)">
          <div class="msgTitle">
            <span class="nickname">{{ m.nickname || '匿名' }}</span>
          </div>
          <div class="msgContent">
            {{ m.content }}
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
type Message = { id: number; nickname: string; content: string; createdAt: string }

useHead(() => ({ title: '留言板 - 导航站' }))

const form = reactive({ nickname: '', content: '' })
const submitting = ref(false)
const status = reactive<{ type: '' | 'success' | 'error'; message: string }>({ type: '', message: '' })

const { data, refresh } = await useFetch<Message[]>('/api/guestbook', { server: true })
const messages = computed(() => data.value || [])

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

async function submit() {
  const { $api } = useNuxtApp()
  status.type = ''
  status.message = ''
  submitting.value = true
  try {
    await $api('/api/guestbook', { method: 'POST', body: form })
    status.type = 'success'
    status.message = '提交成功！'
    form.nickname = ''
    form.content = ''
    await refresh()
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

.msgTitle {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.nickname {
  font-weight: 600;
}

.msgContent {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
