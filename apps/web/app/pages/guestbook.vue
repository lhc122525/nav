<template>
  <div class="guestbook-page">
    <!-- 发布留言区域 -->
    <section class="post-section">
      <div class="section-header">
        <el-icon><EditPen /></el-icon>
        <span>发布留言</span>
      </div>

      <div class="post-card">
        <div v-if="!me?.user" class="login-prompt">
          <div class="prompt-icon">
            <el-icon :size="48"><User /></el-icon>
          </div>
          <p class="prompt-text">登录后即可发表留言</p>
          <el-button type="primary" @click="openLoginDialog">
            立即登录
          </el-button>
        </div>

        <div v-else class="post-form">
          <div class="user-info">
            <el-avatar :size="40" class="user-avatar">{{ me.user.username[0] }}</el-avatar>
            <div class="user-meta">
              <span class="user-name">{{ me.user.username }}</span>
              <span class="user-role">{{ me.user.role === 'admin' ? '管理员' : '用户' }}</span>
            </div>
          </div>

          <div class="input-area">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="4"
              placeholder="写下你的想法..."
              resize="none"
              class="content-input"
            />
            <div class="input-footer">
              <span class="char-count">{{ form.content.length }} / 500</span>
              <el-button
                type="primary"
                :loading="submitting"
                :disabled="!form.content.trim()"
                class="submit-btn"
                @click="submit"
              >
                <el-icon><Promotion /></el-icon>
                发布
              </el-button>
            </div>
          </div>

          <el-alert
            v-if="status.type"
            :type="status.type"
            :title="status.message"
            show-icon
            class="status-alert"
            closable
            @close="status.type = ''; status.message = ''"
          />
        </div>
      </div>
    </section>

    <!-- 留言列表区域 -->
    <section class="messages-section">
      <div class="section-header">
        <el-icon><ChatDotRound /></el-icon>
        <span>最新留言</span>
        <span class="count-badge">{{ total }} 条</span>
      </div>

      <div v-loading="pending" class="messages-container">
        <el-empty v-if="!messages.length && !pending" description="暂无留言，快来发表第一条吧！">
          <el-button type="primary" plain @click="focusInput">发表留言</el-button>
        </el-empty>

        <div v-else class="message-list">
          <div v-for="m in messages" :key="m.id" class="message-card">
            <div class="message-header">
              <el-avatar :size="36" class="msg-avatar">{{ m.nickname[0] }}</el-avatar>
              <div class="msg-meta">
                <span class="msg-nickname">{{ m.nickname }}</span>
                <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
              </div>
            </div>
            <div class="message-body">
              {{ m.content }}
            </div>
          </div>
        </div>

        <div v-if="total > limit" class="pagination-wrap">
          <el-pagination
            v-model:current-page="page"
            layout="prev, pager, next"
            :total="total"
            :page-size="limit"
            background
            :hide-on-single-page="true"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { EditPen, User, Promotion, ChatDotRound } from '@element-plus/icons-vue'

type Message = { id: number; nickname: string; content: string; createdAt: string }
type GuestbookResponse = { list: Message[]; total: number }

useHead(() => ({ title: '留言板 - 非乐鱼导航' }))

// 使用全局用户状态（plugin 已在 app 初始化时获取用户数据）
const { userMe } = useUserMe()
const me = computed(() => userMe.value)

// 使用 useState 共享登录弹窗状态
const loginOpen = useState('loginOpen', () => false)

// 打开登录弹窗
const openLoginDialog = () => {
  loginOpen.value = true
}

const form = reactive({ content: '' })
const submitting = ref(false)
const status = reactive<{ type: '' | 'success' | 'error'; message: string }>({ type: '', message: '' })

const page = ref(1)
const limit = ref(10)

const { data, refresh, pending } = await useFetch<GuestbookResponse>('/api/guestbook', {
  query: { page, limit },
  watch: [page]
})

const messages = computed(() => data.value?.list || [])
const total = computed(() => data.value?.total || 0)

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return d.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function focusInput() {
  const input = document.querySelector('.content-input textarea') as HTMLElement
  if (input) input.focus()
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

  if (form.content.length > 500) {
    status.type = 'error'
    status.message = '内容不能超过 500 字'
    return
  }

  submitting.value = true
  try {
    await $api('/api/guestbook', { method: 'POST', body: form })
    status.type = 'success'
    status.message = '发布成功！'
    form.content = ''
    page.value = 1
    await refresh()
  } catch (e: unknown) {
    status.type = 'error'
    const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    status.message = msg || (e instanceof Error ? e.message : '发布失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="less">
.guestbook-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #24292e;
  margin-bottom: 16px;

  .el-icon {
    color: #0969da;
  }
}

.count-badge {
  font-size: 14px;
  font-weight: 500;
  color: #57606a;
  background: #f1f2f4;
  padding: 2px 10px;
  border-radius: 12px;
  margin-left: 8px;
}

.post-section {
  margin-bottom: 32px;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.login-prompt {
  text-align: center;
  padding: 40px 20px;

  .prompt-icon {
    color: #d0d7de;
    margin-bottom: 16px;
  }

  .prompt-text {
    color: #57606a;
    font-size: 15px;
    margin-bottom: 20px;
  }
}

.post-form {
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .user-avatar {
      background: linear-gradient(135deg, #0969da, #28c76f);
      color: #fff;
      font-weight: 600;
      font-size: 16px;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .user-name {
        font-weight: 600;
        color: #24292e;
        font-size: 15px;
      }

      .user-role {
        font-size: 12px;
        color: #57606a;
      }
    }
  }

  .input-area {
    .content-input {
      :deep(.el-textarea__inner) {
        border: 2px solid #d0d7de;
        border-radius: 8px;
        font-size: 15px;
        line-height: 1.6;
        padding: 12px 16px;
        transition: border-color 0.2s;

        &:focus {
          border-color: #0969da;
        }

        &::placeholder {
          color: #8c959f;
        }
      }
    }

    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;

      .char-count {
        font-size: 13px;
        color: #8c959f;
      }

      .submit-btn {
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 500;

        .el-icon {
          margin-right: 6px;
        }
      }
    }
  }

  .status-alert {
    margin-top: 16px;
    border-radius: 8px;
  }
}

.messages-section {
  .messages-container {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    min-height: 200px;
  }
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-card {
  padding: 16px;
  background: #f6f8fa;
  border-radius: 10px;
  transition: all 0.2s;

  &:hover {
    background: #f1f2f4;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .msg-avatar {
      background: linear-gradient(135deg, #28c76f, #0969da);
      color: #fff;
      font-weight: 600;
      font-size: 14px;
    }

    .msg-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .msg-nickname {
        font-weight: 600;
        color: #24292e;
        font-size: 14px;
      }

      .msg-time {
        font-size: 12px;
        color: #8c959f;
      }
    }
  }

  .message-body {
    color: #24292e;
    font-size: 15px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
    padding-left: 48px;
  }
}

.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;

  :deep(.el-pagination) {
    .el-pager li {
      border-radius: 6px;
    }
  }
}

@media (max-width: 768px) {
  .guestbook-page {
    padding: 16px 12px;
  }

  .post-card {
    padding: 16px;
  }

  .message-body {
    padding-left: 0;
  }
}
</style>