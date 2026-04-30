<template>
  <div class="submit-page">
    <div class="page-header">
      <h1 class="page-title">申请收录</h1>
      <p class="page-desc">提交您的网站，让更多人发现</p>
    </div>

    <!-- 未登录状态 -->
    <div v-if="!me?.user" class="login-prompt">
      <div class="prompt-icon">
        <el-icon :size="64"><User /></el-icon>
      </div>
      <h3 class="prompt-title">登录后可提交收录申请</h3>
      <p class="prompt-text">登录后即可提交网站收录申请，我们会尽快审核</p>
      <el-button type="primary" size="large" @click="openLoginDialog">
        立即登录
      </el-button>
    </div>

    <!-- 已登录表单 -->
    <el-card v-else class="submit-card" shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="站点标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入站点名称，如：我的博客"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="站点地址" prop="url">
          <el-input
            v-model="form.url"
            placeholder="https://example.com"
            maxlength="500"
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="简短描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="介绍一下这个站点的主要内容和特色..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="form.contact"
            placeholder="可选：邮箱、微信等，方便我们联系您"
            maxlength="100"
          >
            <template #prepend>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            style="width: 100%;"
            @click="submit"
          >
            <el-icon v-if="!submitting"><Promotion /></el-icon>
            {{ submitting ? '提交中...' : '提交申请' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 提交成功提示 -->
      <el-result
        v-if="submitSuccess"
        icon="success"
        title="提交成功"
        sub-title="感谢您的提交，我们会尽快审核"
      >
        <template #extra>
          <el-button type="primary" @click="resetForm">继续提交</el-button>
        </template>
      </el-result>
    </el-card>

    <!-- 提示信息 -->
    <div class="tips-card">
      <h4 class="tips-title">
        <el-icon><InfoFilled /></el-icon>
        提交须知
      </h4>
      <ul class="tips-list">
        <li>请确保网站内容合法合规，无不良信息</li>
        <li>网站需能正常访问，加载速度合理</li>
        <li>描述请尽量简洁明了，突出站点特色</li>
        <li>审核通过后，您的网站将展示在导航页</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Link, Message, Promotion, InfoFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

useHead(() => ({ title: '申请收录 - 非乐鱼导航' }))

// 使用全局用户状态
const { userMe } = useUserMe()
const me = userMe

// 登录弹窗
const loginOpen = useState('loginOpen', () => false)
const openLoginDialog = () => {
  loginOpen.value = true
}

// 表单
const formRef = ref<FormInstance>()
const form = reactive({
  title: '',
  url: '',
  description: '',
  contact: ''
})

const submitting = ref(false)
const submitSuccess = ref(false)

// URL 校验
const urlValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入站点地址'))
    return
  }
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) {
      callback(new Error('请输入有效的 HTTP/HTTPS 地址'))
      return
    }
    callback()
  } catch {
    callback(new Error('请输入有效的网址'))
  }
}

const rules: FormRules = {
  title: [
    { required: true, message: '请输入站点标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度需为 2-50 个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入站点地址', trigger: 'blur' },
    { validator: urlValidator, trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ],
  contact: [
    { max: 100, message: '联系方式不能超过 100 个字符', trigger: 'blur' }
  ]
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const { $api } = useNuxtApp()
    await $api('/api/submissions', { method: 'POST', body: form })
    submitSuccess.value = true
  } catch (e: unknown) {
    const msg = typeof (e as { msg?: unknown })?.msg === 'string'
      ? String((e as { msg?: unknown }).msg)
      : '提交失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formRef.value?.resetFields()
  submitSuccess.value = false
}
</script>

<style scoped lang="less">
.submit-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 15px;
  color: #666;
}

.login-prompt {
  background: #fff;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.prompt-icon {
  color: #dcdfe6;
  margin-bottom: 20px;
}

.prompt-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.prompt-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 28px;
}



.tips-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px 24px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;

  .el-icon {
    color: #409eff;
  }
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #666;
  line-height: 2;
}

@media (max-width: 768px) {
  .submit-page {
    padding: 20px 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .login-prompt {
    padding: 40px 24px;
  }
}
</style>
