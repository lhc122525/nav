<template>
  <div class="container">
    <el-card shadow="never" style="margin-bottom: 12px">
      <template #header>
        <div class="header">
          留言板
        </div>
      </template>

      <div v-if="!me?.user" class="login-tip">
        <el-alert type="info" :closable="false" show-icon>
          请登录后再发表留言。
        </el-alert>
      </div>
      <el-form v-else label-width="72px" @submit.prevent>
        <el-form-item label="发言人">
          <div class="current-user">
            <el-avatar :size="24">{{ me.user.username[0] }}</el-avatar>
            <span class="username">{{ me.user.username }}</span>
          </div>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入留言内容" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">
            提交
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="status.type" :type="status.type" :title="status.message" show-icon style="margin-top: 12px" />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="header">
          最新留言
        </div>
      </template>
      
      <div v-loading="pending">
        <el-empty v-if="!messages.length && !pending" description="暂无留言" />
        <template v-else>
          <el-timeline>
            <el-timeline-item v-for="m in messages" :key="m.id" :timestamp="formatTime(m.createdAt)" placement="top">
              <div class="msgTitle">
                <el-avatar :size="28" class="msgAvatar">{{ m.nickname[0] }}</el-avatar>
                <span class="nickname">{{ m.nickname }}</span>
              </div>
              <div class="msgContent">
                {{ m.content }}
              </div>
            </el-timeline-item>
          </el-timeline>

          <div v-if="total > limit" class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              layout="prev, pager, next"
              :total="total"
              :page-size="limit"
              background
            />
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
type Message = { id: number; nickname: string; content: string; createdAt: string }
type GuestbookResponse = { list: Message[]; total: number }
type MeResponse = { user: null | { id: number; username: string; role: 'admin' | 'user' } }

useHead(() => ({ title: '留言板 - 导航站' }))

const { data: meData } = await useFetch<MeResponse>('/api/auth/me', {
  headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
})
const me = computed(() => meData.value)

const form = reactive({ content: '' })
const submitting = ref(false)
const status = reactive<{ type: '' | 'success' | 'error'; message: string }>({ type: '', message: '' })

const page = ref(1)
const limit = ref(10)

const { data, refresh, pending } = await useFetch<GuestbookResponse>('/api/guestbook', {
  query: {
    page,
    limit
  },
  watch: [page]
})

const messages = computed(() => data.value?.list || [])
const total = computed(() => data.value?.total || 0)

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

async function submit() {
  const { $api } = useNuxtApp()
  status.type = ''
  status.message = ''
  
  if (!form.content.trim()) {
    status.type = 'error'
    status.message = '内容不能为空'
    return
  }

  submitting.value = true
  try {
    await $api('/api/guestbook', { method: 'POST', body: form })
    status.type = 'success'
    status.message = '提交成功！'
    form.content = ''
    page.value = 1
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
.container {
  padding: 24px;
}

.header {
  font-weight: 600;
}

.login-tip {
  margin-bottom: 12px;
}

.current-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-user .username {
  font-weight: 600;
  color: #303133;
}

.msgTitle {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.msgAvatar {
  background-color: #409eff;
  font-size: 14px;
}

.nickname {
  font-weight: 600;
  color: #303133;
}

.msgContent {
  white-space: pre-wrap;
  word-break: break-word;
  color: #606266;
  line-height: 1.6;
  padding-left: 36px;
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
