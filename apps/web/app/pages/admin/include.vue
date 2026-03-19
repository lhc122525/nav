<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 12px">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="status" style="width: 160px">
            <el-option label="全部" value="all" />
            <el-option label="待处理" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="query" placeholder="标题 / URL / 描述" clearable style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="rows" style="width: 100%" row-key="id">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="url" label="URL" min-width="240" />
        <el-table-column prop="description" label="描述" min-width="240" />
        <el-table-column prop="contact" label="联系方式" min-width="160" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
type Submission = {
  id: number
  title: string
  url: string
  description: string
  contact: string
  status: string
  createdAt: string
  handledBy: number | null
  handledAt: string | null
}

definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })

useHead(() => ({ title: '收录管理 - 后台' }))

const status = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')
const query = ref('')
const rows = ref<Submission[]>([])

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

function getErrorStatus(e: unknown): number | undefined {
  if (!e || typeof e !== 'object') return undefined
  const anyError = e as { statusCode?: unknown; response?: { status?: unknown } }
  if (typeof anyError.statusCode === 'number') return anyError.statusCode
  if (typeof anyError.response?.status === 'number') return anyError.response.status
  return undefined
}

async function reload() {
  const params: Record<string, string | number> = { limit: 500, status: status.value }
  if (query.value.trim()) params.q = query.value.trim()
  const data = await $fetch<Submission[]>('/api/admin/submissions', { params, headers: requestHeaders })
  rows.value = data
}

try {
  await reload()
} catch (e: unknown) {
  if (getErrorStatus(e) === 401) {
    await navigateTo('/admin/login')
  } else {
    throw e
  }
}
</script>

