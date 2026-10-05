<template>
  <div class="share-management">
    <div class="pageHeader">
      <h2>分享资源</h2>
      <div class="headerActions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索资源标题"
          clearable
          class="searchInput"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button @click="handleSearch">查询</el-button>
        <el-button type="danger" plain :disabled="!selected.length" @click="handleBatchDelete">
          批量删除{{ selected.length ? `（${selected.length}）` : '' }}
        </el-button>
        <el-button type="primary" @click="handleAdd">新增资源</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      border
      style="width: 100%"
      @selection-change="(rows: ShareRow[]) => (selected = rows)"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column type="index" label="序号" width="70" align="center" :index="indexMethod" />
      <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'file' ? 'success' : 'primary'">
            {{ scope.row.type === 'file' ? '文件' : '三方链接' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="资源地址" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <el-link :href="resolveUrl(scope.row)" target="_blank" type="primary" class="urlLink">
            {{ scope.row.url }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="文件大小" width="110" align="center">
        <template #default="scope">
          {{ scope.row.type === 'file' ? formatSize(scope.row.file_size) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="140" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160" align="center">
        <template #default="scope">{{ formatTime(scope.row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleShare(scope.row)">分享</el-button>
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      @current-change="fetchData"
      @size-change="handleSizeChange"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑资源' : '新增资源'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="资源类型">
          <el-radio-group v-model="form.type" :disabled="!!form.id">
            <el-radio value="url">三方链接</el-radio>
            <el-radio value="file">上传文件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="输入资源标题" maxlength="100" />
        </el-form-item>
        <el-form-item v-if="form.type === 'url'" label="资源地址" required>
          <el-input v-model="form.url" placeholder="https:// 开头的三方链接" maxlength="500" />
        </el-form-item>
        <el-form-item v-else label="资源文件" required>
          <div class="fileUploadRow">
            <el-upload :show-file-list="false" :http-request="uploadFile">
              <el-button>{{ form.url ? '重新上传' : '上传文件' }}</el-button>
            </el-upload>
            <span v-if="form.url" class="fileInfo">
              {{ form.fileName }}（{{ formatSize(form.fileSize) }}）
            </span>
            <span v-else class="fileTip">上传到服务器后生成外部可访问地址</span>
          </div>
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="资源说明（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分享弹窗 -->
    <el-dialog v-model="shareVisible" title="分享资源" width="380px" align-center>
      <div class="shareDialog">
        <div class="shareTitle">{{ shareInfo.title }}</div>
        <img v-if="shareInfo.qr" :src="shareInfo.qr" alt="二维码" class="qrImg">
        <div class="shareTip">扫码即可访问资源</div>
        <div class="shareLink">{{ shareInfo.link }}</div>
        <div class="shareActions">
          <el-button @click="copyLink">复制链接</el-button>
          <el-button type="primary" @click="openShareLink">打开链接</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import type { UploadAjaxError } from 'element-plus/es/components/upload/src/ajax'
import QRCode from 'qrcode'
import dayjs from 'dayjs'

definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })

type ShareRow = {
  id: number
  title: string
  type: 'url' | 'file'
  url: string
  file_name: string
  file_size: number
  description: string
  created_at: string
}

type ShareForm = {
  id: number | null
  type: 'url' | 'file'
  title: string
  url: string
  fileName: string
  fileSize: number
  description: string
}

const { public: publicConfig } = useRuntimeConfig()

const loading = ref(false)
const submitting = ref(false)
const list = ref<ShareRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const selected = ref<ShareRow[]>([])

const dialogVisible = ref(false)
const form = ref<ShareForm>(emptyForm())

const shareVisible = ref(false)
const shareInfo = ref({ title: '', link: '', qr: '' })

function emptyForm(): ShareForm {
  return {
    id: null,
    type: 'url',
    title: '',
    url: '',
    fileName: '',
    fileSize: 0,
    description: ''
  }
}

// 站点绝对地址（用于文件资源与二维码）
const siteOrigin = computed(() => {
  const base = (publicConfig.siteUrl || '').replace(/\/+$/, '')
  if (base) return base
  if (import.meta.client) return window.location.origin
  return ''
})

const resolveUrl = (row: ShareRow) =>
  row.type === 'file' ? `${siteOrigin.value}${row.url}` : row.url

const indexMethod = (index: number) => (page.value - 1) * pageSize.value + index + 1

const formatSize = (size: number) => {
  const n = Number(size) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const formatTime = (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-')

// 获取列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ list: ShareRow[]; total: number }>('/api/admin/share-resources', {
      query: { page: page.value, pageSize: pageSize.value, keyword: searchKeyword.value }
    })
    list.value = res.list || []
    total.value = res.total || 0
    selected.value = []
  } catch (error) {
    const e = error as { message?: string }
    ElMessage.error('加载失败: ' + (e.message || ''))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchData()
}

const handleSizeChange = () => {
  page.value = 1
  fetchData()
}

// 新增
const handleAdd = () => {
  form.value = emptyForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: ShareRow) => {
  form.value = {
    id: row.id,
    type: row.type,
    title: row.title,
    url: row.url,
    fileName: row.file_name || '',
    fileSize: Number(row.file_size) || 0,
    description: row.description || ''
  }
  dialogVisible.value = true
}

// 上传文件（scope=share）
const uploadFile = async (o: UploadRequestOptions) => {
  const file: File = o.file
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scope', 'share')
  try {
    const res = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: formData })
    form.value.url = res.url
    form.value.fileName = file.name
    form.value.fileSize = file.size
    if (!form.value.title) form.value.title = file.name
    ElMessage.success('上传成功')
    o.onSuccess?.(res)
  } catch (e) {
    const err = e as { message?: string }
    ElMessage.error('上传失败: ' + (err.message || ''))
    o.onError?.(e as UploadAjaxError)
  }
}

// 提交新增/编辑
const submitForm = async () => {
  const f = form.value
  if (!f.title) return ElMessage.warning('请填写资源标题')
  if (f.type === 'url') {
    if (!f.url) return ElMessage.warning('请填写资源地址')
    if (!/^https?:\/\//i.test(f.url)) return ElMessage.warning('资源地址必须以 http:// 或 https:// 开头')
  } else if (!f.url) {
    return ElMessage.warning('请上传资源文件')
  }

  submitting.value = true
  try {
    const api = f.id ? '/api/admin/share-resources/update' : '/api/admin/share-resources/create'
    await $fetch(api, {
      method: 'POST',
      body: {
        id: f.id,
        type: f.type,
        title: f.title,
        url: f.url,
        fileName: f.fileName,
        fileSize: f.fileSize,
        description: f.description
      }
    })
    ElMessage.success(f.id ? '保存成功' : '新增成功')
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    const e = error as { message?: string }
    ElMessage.error('操作失败: ' + (e.message || ''))
  } finally {
    submitting.value = false
  }
}

// 单个删除（真实删除，文件一并删除）
const handleDelete = (row: ShareRow) => {
  ElMessageBox.confirm(
    '删除后不可恢复，文件类型资源的服务器文件将被一并删除。确定删除该资源吗？',
    '删除资源',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(async () => {
    try {
      await $fetch('/api/admin/share-resources/delete', { method: 'POST', body: { id: row.id } })
      ElMessage.success('已删除')
      fetchData()
    } catch (error) {
      const e = error as { message?: string }
      ElMessage.error('删除失败: ' + (e.message || ''))
    }
  })
}

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定删除选中的 ${selected.value.length} 项资源吗？删除后不可恢复，文件类型资源的服务器文件将被一并删除。`,
    '批量删除',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(async () => {
    try {
      const res = await $fetch<{ deleted: number }>('/api/admin/share-resources/batch-delete', {
        method: 'POST',
        body: { ids: selected.value.map((r) => r.id) }
      })
      ElMessage.success(`已删除 ${res.deleted} 项`)
      fetchData()
    } catch (error) {
      const e = error as { message?: string }
      ElMessage.error('删除失败: ' + (e.message || ''))
    }
  })
}

// 分享：生成外部可访问二维码
const handleShare = async (row: ShareRow) => {
  const link = resolveUrl(row)
  try {
    const qr = await QRCode.toDataURL(link, { width: 260, margin: 2 })
    shareInfo.value = { title: row.title, link, qr }
    shareVisible.value = true
  } catch {
    ElMessage.error('生成二维码失败')
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareInfo.value.link)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const openShareLink = () => {
  window.open(shareInfo.value.link, '_blank')
}

onMounted(fetchData)
</script>

<style scoped>
.share-management {
  padding: 20px 0;
}

.pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.pageHeader h2 {
  margin: 0;
  font-size: 20px;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.searchInput {
  width: 220px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.urlLink {
  white-space: normal;
  word-break: break-all;
}

.fileUploadRow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.fileInfo {
  font-size: 13px;
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.fileTip {
  font-size: 12px;
  color: #909399;
}

.shareDialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.shareTitle {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  word-break: break-all;
}

.qrImg {
  width: 240px;
  height: 240px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 8px;
}

.shareTip {
  font-size: 12px;
  color: #909399;
}

.shareLink {
  width: 100%;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  word-break: break-all;
  text-align: center;
}

.shareActions {
  display: flex;
  gap: 10px;
}
</style>
