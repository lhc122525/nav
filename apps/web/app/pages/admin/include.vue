<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 12px">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="收录状态">
          <el-select v-model="isIncluded" style="width: 160px">
            <el-option label="全部" value="all" />
            <el-option label="未收录" value="false" />
            <el-option label="已收录" value="true" />
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
        <el-table-column prop="isIncluded" label="收录状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isIncluded" type="success" size="small">已收录</el-tag>
            <el-tag v-else type="info" size="small">未收录</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isIncluded"
              type="primary"
              size="small"
              @click="openIncludeDialog(row)"
            >
              收录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 收录弹窗 -->
    <el-dialog
      v-model="includeDialogVisible"
      title="收录链接"
      width="100%"
      style="max-width: 600px"
    >
      <el-form label-width="90px">
        <el-form-item label="标题">
          <el-input v-model="includeForm.title" />
        </el-form-item>
        <el-form-item label="URL">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="includeForm.url" />
            <el-button type="primary" :loading="crawling" @click="crawlUrl">获取信息</el-button>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="includeForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="includeForm.categoryId" placeholder="请选择二级分类" style="width: 100%">
            <el-option-group v-for="pc in topLevelCategories" :key="pc.id" :label="pc.name">
              <el-option
                v-for="c in categories.filter(cat => cat.parentId === pc.id)"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-option-group>
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            注：导航只能添加在二级分类下
          </div>
        </el-form-item>
        <el-form-item label="图标">
          <div style="display: flex; gap: 8px; width: 100%; align-items: center">
            <el-input v-model="includeForm.iconUrl" placeholder="https://..." />
            <el-image
              v-if="includeForm.iconUrl"
              :src="includeForm.iconUrl"
              style="width: 32px; height: 32px; flex-shrink: 0"
              fit="contain"
            >
              <template #error>
                <div style="font-size: 12px; color: #999">N/A</div>
              </template>
            </el-image>
          </div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="includeForm.isActive" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="includeForm.isRecommended" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="includeForm.sort" :min="0" :max="100000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="includeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="includeSubmitting" @click="submitInclude">
          确定收录
        </el-button>
      </template>
    </el-dialog>
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
  isIncluded: boolean
  createdAt: string
  handledBy: number | null
  handledAt: string | null
}

type Category = { id: number; parentId: number | null; name: string; slug: string; sort: number }

definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })

useHead(() => ({ title: '收录管理 - 后台' }))

const { $api } = useNuxtApp()

const isIncluded = ref<'all' | 'true' | 'false'>('false')
const query = ref('')
const rows = ref<Submission[]>([])

// 分类数据
const categories = ref<Category[]>([])
const topLevelCategories = computed(() => categories.value.filter(c => !c.parentId))

// 收录弹窗
const includeDialogVisible = ref(false)
const includeSubmitting = ref(false)
const crawling = ref(false)
const currentSubmission = ref<Submission | null>(null)
const includeForm = reactive({
  categoryId: null as number | null,
  title: '',
  url: '',
  description: '',
  iconUrl: '',
  isActive: true,
  isRecommended: false,
  sort: 0
})

const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

function getErrorStatus(e: unknown): number | undefined {
  if (!e || typeof e !== 'object') return undefined
  const anyError = e as { statusCode?: unknown; response?: { status?: unknown } }
  if (typeof anyError.statusCode === 'number') return anyError.statusCode
  if (typeof anyError.response?.status === 'number') return anyError.response.status
  return undefined
}

async function reloadCategories() {
  const data = await $api<Category[]>('/api/admin/categories', { params: { limit: 500 }, headers: requestHeaders })
  categories.value = data
}

async function reload() {
  const params: Record<string, string | number> = { limit: 500 }
  if (isIncluded.value !== 'all') params.isIncluded = isIncluded.value
  if (query.value.trim()) params.q = query.value.trim()
  const data = await $fetch<Submission[]>('/api/admin/submissions', { params, headers: requestHeaders })
  rows.value = data
}

function openIncludeDialog(row: Submission) {
  currentSubmission.value = row
  includeForm.categoryId = null
  includeForm.title = row.title
  includeForm.url = row.url
  includeForm.description = row.description
  includeForm.iconUrl = ''
  includeForm.isActive = true
  includeForm.isRecommended = false
  includeForm.sort = 0
  includeDialogVisible.value = true
}

async function crawlUrl() {
  const url = includeForm.url?.trim()
  if (!url || !url.startsWith('http')) {
    ElMessage.warning('请输入有效的 HTTP(S) 地址')
    return
  }

  crawling.value = true
  try {
    const data = await $api<{ title: string; description: string; iconUrl: string; url: string }>('/api/admin/links/crawl', {
      method: 'POST',
      body: { url }
    })

    if (data.title) includeForm.title = data.title
    if (data.description) includeForm.description = data.description
    if (data.iconUrl) includeForm.iconUrl = data.iconUrl
    if (data.url) includeForm.url = data.url

    ElMessage.success('获取成功')
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    ElMessage.error(error.statusMessage || '获取失败')
  } finally {
    crawling.value = false
  }
}

async function submitInclude() {
  if (!includeForm.categoryId) {
    ElMessage.warning('请选择一个二级分类')
    return
  }
  if (!currentSubmission.value) return

  includeSubmitting.value = true
  try {
    // 创建链接
    await $api('/api/admin/links', {
      method: 'POST',
      body: {
        categoryId: includeForm.categoryId,
        title: includeForm.title,
        url: includeForm.url,
        description: includeForm.description,
        iconUrl: includeForm.iconUrl,
        isActive: includeForm.isActive,
        isRecommended: includeForm.isRecommended,
        sort: includeForm.sort
      }
    })

    // 更新收录状态
    await $api(`/api/admin/submissions/${currentSubmission.value.id}`, {
      method: 'PUT',
      body: { isIncluded: true }
    })

    ElMessage.success('收录成功')
    includeDialogVisible.value = false
    await reload()
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    ElMessage.error(error.statusMessage || '收录失败')
  } finally {
    includeSubmitting.value = false
  }
}

try {
  await reloadCategories()
  await reload()
} catch (e: unknown) {
  if (getErrorStatus(e) === 401) {
    await navigateTo('/admin/login')
  } else {
    throw e
  }
}
</script>

