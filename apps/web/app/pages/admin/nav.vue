<template>
  <div style="height: 100%;">
    <el-row :gutter="12" style="height: 100%;">
      <el-col :xs="24" :md="6" :lg="5" style="height: 100%;">
        <el-card shadow="never" style="height: 100%;overflow: auto;">
          <template #header>
            <div class="cardHeader">
              <span>分类</span>
              <div class="headerActions">
                <el-button size="small" @click="() => openCategoryCreate()">
                  新增
                </el-button>
                <el-button size="small" type="primary" plain @click="openCategoryMaintenance">
                  维护
                </el-button>
              </div>
            </div>
          </template>

          <div class="categoryList">
            <div
              class="categoryItem"
              :class="{ active: categoryId === undefined && !recommendedMode }"
              @click="selectCategory(undefined)"
            >
              全部
            </div>
            <div
              class="categoryItem"
              :class="{ active: recommendedMode }"
              @click="selectRecommended"
            >
              推荐管理
            </div>
            <template v-for="pc in topLevelCategories" :key="pc.id">
              <div
                class="categoryItem parentCategory"
                @click="toggleExpand(pc.id, $event)"
              >
                <div 
                  v-if="categories.some(c => c.parentId === pc.id)" 
                  class="expandIcon"
                >
                  <el-icon v-if="expandedCategories.has(pc.id)"><CaretBottom /></el-icon>
                  <el-icon v-else><CaretRight /></el-icon>
                </div>
                <div v-else class="expandPlaceholder"></div>
                {{ pc.name }} <span class="categorySlug">({{ pc.slug }})</span>
              </div>
              <div v-if="expandedCategories.has(pc.id)">
                <div
                  v-for="c in categories.filter(cat => cat.parentId === pc.id)"
                  :key="c.id"
                  class="categoryItem subCategory"
                  :class="{ active: categoryId === c.id }"
                  @click="selectCategory(c.id)"
                >
                  <el-icon style="margin-right: 4px"><ArrowRight /></el-icon>
                  {{ c.name }} <span class="categorySlug">({{ c.slug }})</span>
                </div>
              </div>
            </template>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="18" :lg="19" style="height: 100%;display: flex;flex-direction: column;">
        <el-card shadow="never" style="margin-bottom: 12px;padding: 0;">
          <el-form :inline="true" @submit.prevent style="display: flex;flex-wrap: wrap;gap: 10px;">
            <el-form-item label="关键词" style="margin-bottom: 0;">
              <el-input v-model="query" placeholder="标题 / URL / 描述" clearable style="width: 260px" />
            </el-form-item>
            <el-form-item style="margin: 0;">
              <el-button type="primary" @click="onSearch">
                查询
              </el-button>
              <el-button @click="openCreate">
                新增链接
              </el-button>
              <el-button type="warning" :loading="checkingConnectivity" @click="checkConnectivity">
                {{ checkingConnectivity ? '检测中...' : '检测连通性' }}
              </el-button>
              <!-- <span v-if="checkingConnectivity" style="color: #E6A23C; font-size: 12px;">
                正在检测 {{ recommendedMode ? '推荐站点' : (categoryId ? '当前分类' : '全部站点') }}...
              </span> -->
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" style="flex:2;overflow: hidden;padding: 0;" body-style="padding: 0;display: flex;flex-direction: column;">
          <div style="flex: 2;height: 100%;overflow: hidden;">
            <el-table :data="rows" style="width: 100%" row-key="id" height="100%">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="iconUrl" label="图标" width="60">
                <template #default="{ row }">
                  <el-image
                    v-if="row.iconUrl"
                    :src="row.iconUrl"
                    style="width: 24px; height: 24px"
                    fit="contain"
                    :preview-src-list="[row.iconUrl]"
                    preview-teleported
                  >
                    <template #error>
                      <div style="font-size: 12px; color: #999">N/A</div>
                    </template>
                  </el-image>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="title" label="标题" min-width="180" />
              <el-table-column prop="url" label="URL" min-width="220">
                <template #default="{ row }">
                  <a :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.url }}</a>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="categoryId" label="分类" width="140">
                <template #default="{ row }">
                  {{ categoryName(row.categoryId) }}
                </template>
              </el-table-column>
              <el-table-column prop="isRecommended" label="推荐" width="80">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.isRecommended"
                    size="small"
                    :loading="updatingRows.has(row.id)"
                    @change="(val) => toggleLinkStatus(row, 'isRecommended', val as boolean)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="isActive" label="启用" width="80">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.isActive"
                    size="small"
                    :loading="updatingRows.has(row.id)"
                    @change="(val) => toggleLinkStatus(row, 'isActive', val as boolean)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="sort" label="排序" width="90" />
              <el-table-column label="操作" width="110" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEdit(row)">
                    编辑
                  </el-button>
                  <el-button link type="danger" @click="remove(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div style="padding: 12px; display: flex; justify-content: flex-end; border-top: 1px solid #f0f0f0;">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              size="small"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogOpen" :title="editing?.id ? '编辑链接' : '新增链接'" width="100%" style="max-width: 600px;">
      <el-form label-width="90px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="URL">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="form.url" placeholder="https://..." />
            <el-button type="primary" :loading="crawling" @click="crawlUrl">获取信息</el-button>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="请选择二级分类" style="width: 100%">
            <el-option-group v-for="pc in topLevelCategories" :key="pc.id" :label="pc.name">
              <el-option 
                v-for="c in categories.filter(cat => cat.parentId === pc.id)" 
                :key="c.id" 
                :label="c.name" 
                :value="c.id" 
              />
            </el-option-group>
          </el-select>
          <div class="formTip" style="font-size: 12px; color: #909399; margin-top: 4px;">
            注：导航只能添加在二级分类下
          </div>
        </el-form-item>
        <el-form-item label="图标">
          <div style="display: flex; gap: 8px; width: 100%; align-items: center">
            <el-input v-model="form.iconUrl" placeholder="https://..." />
            <el-image
              v-if="form.iconUrl"
              :src="form.iconUrl"
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
          <el-switch v-model="form.isActive" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.isRecommended" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="100000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryCreateVisible" :title="categoryForm.id ? '编辑分类' : '新增分类'" width="100%" style="max-width: 600px;">
      <el-form label-width="90px">
        <el-form-item label="父级分类">
          <el-select v-model="categoryForm.parentId" clearable placeholder="不选则为一级分类" style="width: 100%">
            <el-option 
              v-for="pc in topLevelCategories.filter(c => c.id !== categoryForm.id)" 
              :key="pc.id" 
              :label="pc.name" 
              :value="pc.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" placeholder="例如：影视休闲" />
        </el-form-item>
        <el-form-item label="标识(Slug)">
          <el-input v-model="categoryForm.slug" placeholder="例如：movies" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryCreateVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingCategory" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="categoryMaintenanceVisible" 
      title="分类排序/维护" 
      width="100%" 
      style="max-width: 1200px;"
      @closed="onCategoryMaintenanceClosed"
      top="5vh"
    >
      <template #header>
        <div style="display: flex; gap: 8px;">
          <el-button type="primary" @click="openCategoryCreate()">
            <el-icon><Plus /></el-icon> 新增分类
          </el-button>
          <el-button @click="loadMaintenanceCategories">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>
      
      <VirtualTreeTable
        v-model:expand-row-keys="expandedRowKeys"
        :data="maintenanceCategories"
        :columns="maintenanceColumns"
        :default-expand-all="false"
        :height="getHeight()"
        :row-height="52"
        :indent-size="12"
        row-key="id"
        children-key="_children"
      >
        <template #cell-tree-expand="{ row, expandable, expanded }">
          <span 
            v-if="expandable" 
            class="custom-arrow"
            :class="{ expanded }"
            @click.stop="handleToggleExpand(row.id)"
          >
            ▶
          </span>
          <span v-else style="width: 16px;"></span>
        </template>
        
        <template #cell-name="{ row }">
          <el-input v-model="row.name" size="small" placeholder="分类名称" />
        </template>
        
        <template #cell-slug="{ row }">
          <el-input v-model="row.slug" size="small" placeholder="slug" />
        </template>
        
        <template #cell-parentId="{ row }">
          <span v-if="!row.parentId" style="color: #c0c4cc;">一级分类</span>
          <el-select v-else v-model="row.parentId" clearable size="small" placeholder="选择父级" style="width: calc(100% - 16px)">
            <el-option 
              v-for="pc in topLevelCategories.filter(c => c.id !== row.id)" 
              :key="pc.id" 
              :label="pc.name" 
              :value="pc.id" 
              
            />
          </el-select>
        </template>
        
        <template #cell-sort="{ row }">
          <div class="sortCell">
            <el-input-number 
              v-model="row.sort" 
              :min="0" 
              size="small" 
              controls-position="right"
              style="width: 80px"
            />
            <div class="sortMove">
              <el-button
                text
                :disabled="isMoveUpDisabled(row.id)"
                @click.stop="moveCategory(row.id, 'up')"
              >
                <el-icon><CaretTop /></el-icon>
              </el-button>
              <el-button
                text
                :disabled="isMoveDownDisabled(row.id)"
                @click.stop="moveCategory(row.id, 'down')"
              >
                <el-icon><CaretBottom /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
        
        <template #cell-actions="{ row }">
          <el-button 
            v-if="!row.parentId" 
            link 
            type="success" 
            size="small" 
            @click="openCategoryCreate(row.id)"
          >
            +子分类
          </el-button>
          <el-popconfirm title="确定要删除该分类吗？" @confirm="deleteCategoryInMaintenance(row)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </VirtualTreeTable>
      
      <template #footer>
        <el-button @click="categoryMaintenanceVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingMaintenance" @click="saveMaintenance">
          保存全部修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, CaretRight, CaretBottom, CaretTop, Plus, Refresh } from '@element-plus/icons-vue'
import type { Column } from '~/components/VirtualTreeTable.vue'

type Category = { id: number; parentId: number | null; name: string; slug: string; sort: number }
type MaintenanceNode = Category & { _children?: MaintenanceNode[] }

type AdminLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
  isRecommended: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

type LinkForm = {
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
  isRecommended: boolean
  sort: number
}

definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })

useHead(() => ({ title: '导航管理 - 后台' }))

const { $api } = useNuxtApp()

const query = ref('')
const categoryId = ref<number | undefined>(undefined)
const recommendedMode = ref(false)

const categories = ref<Category[]>([])
const maintenanceCategories = ref<MaintenanceNode[]>([])
const categoryMaintenanceVisible = ref(false)
const editingRowId = ref<number | null>(null)
const expandedRowKeys = ref<number[]>([])

const maintenanceColumns: Column[] = [
  { key: 'name', dataKey: 'name', label: '分类名称', width: 150 },
  { key: 'slug', dataKey: 'slug', label: '标识 (slug)', width: 100 },
  { key: 'parentId', dataKey: 'parentId', label: '父级分类', width: 120 },
  { key: 'sort', dataKey: 'sort', label: '排序', width: 90 },
  { key: 'actions', dataKey: 'actions', label: '操作', align: 'center', fixed: 'right', width: 180 }
]

function handleToggleExpand(key: number) {
  const index = expandedRowKeys.value.indexOf(key)
  if (index > -1) {
    expandedRowKeys.value.splice(index, 1)
  } else {
    expandedRowKeys.value.push(key)
  }
}

function findSiblingsById(nodes: MaintenanceNode[], id: number): { siblings: MaintenanceNode[]; index: number } | null {
  for (const [index, node] of nodes.entries()) {
    if (node.id === id) return { siblings: nodes, index }
    if (node._children && node._children.length) {
      const hit = findSiblingsById(node._children, id)
      if (hit) return hit
    }
  }
  return null
}

function isMoveUpDisabled(id: number) {
  const hit = findSiblingsById(maintenanceCategories.value, id)
  if (!hit) return true
  return hit.index <= 0
}

function isMoveDownDisabled(id: number) {
  const hit = findSiblingsById(maintenanceCategories.value, id)
  if (!hit) return true
  return hit.index >= hit.siblings.length - 1
}

function moveCategory(id: number, dir: 'up' | 'down') {
  const hit = findSiblingsById(maintenanceCategories.value, id)
  if (!hit) return
  const delta = dir === 'up' ? -1 : 1
  const otherIndex = hit.index + delta
  if (otherIndex < 0 || otherIndex >= hit.siblings.length) return

  const siblings = hit.siblings
  const a = siblings[hit.index]
  const b = siblings[otherIndex]
  if (!a || !b) return

  const aSort = a.sort
  a.sort = b.sort
  b.sort = aSort

  siblings[hit.index] = b
  siblings[otherIndex] = a
}

const categoryCreateVisible = ref(false)
const savingCategory = ref(false)
const categoryForm = reactive({
  id: 0,
  parentId: null as number | null,
  name: '',
  slug: '',
  sort: 0
})
const savingMaintenance = ref(false)

const topLevelCategories = computed(() => categories.value.filter(c => !c.parentId))

const rows = ref<AdminLink[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dialogOpen = ref(false)
const crawling = ref(false)
const checkingConnectivity = ref(false)
const checkProgress = ref({ current: 0, total: 0 })
const updatingRows = reactive(new Set<number>())
const editing = ref<AdminLink | null>(null)
const form = reactive<LinkForm>({
  categoryId: null,
  title: '',
  url: '',
  description: '',
  iconUrl: '',
  isActive: true,
  isRecommended: false,
  sort: 0
})

function getHeight() {
  return ( (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 300 ) || 500
}



function categoryName(id: number | null) {
  if (id == null) return '-'
  const hit = categories.value.find((c) => c.id === id)
  if (!hit) return String(id)
  if (hit.parentId) {
    const parent = categories.value.find(c => c.id === hit.parentId)
    return `${parent?.name || '?' } / ${hit.name}`
  }
  return hit.name
}

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
  data.filter(c => !c.parentId).forEach(c => {
    expandedCategories.value.add(c.id)
  })
}

async function reloadLinks() {
  const params: Record<string, string | number> = { 
    page: page.value,
    limit: pageSize.value 
  }
  if (query.value.trim()) params.q = query.value.trim()
  if (categoryId.value !== undefined) params.categoryId = categoryId.value
  if (recommendedMode.value) params.recommended = 1

  const data = await $api<{ total: number; list: AdminLink[] }>('/api/admin/links', { params, headers: requestHeaders })
  rows.value = data.list
  total.value = data.total
}

function handlePageChange(val: number) {
  page.value = val
  reloadLinks()
}

function handleSizeChange(val: number) {
  pageSize.value = val
  page.value = 1
  reloadLinks()
}

function onSearch() {
  page.value = 1
  reloadLinks()
}

const expandedCategories = ref<Set<number>>(new Set())

function toggleExpand(id: number, event?: Event) {
  if (event) event.stopPropagation()
  if (expandedCategories.value.has(id)) {
    expandedCategories.value.delete(id)
  } else {
    expandedCategories.value.add(id)
  }
}

function selectCategory(id: number | undefined) {
  recommendedMode.value = false
  categoryId.value = id
  page.value = 1
  reloadLinks()
}

function selectRecommended() {
  recommendedMode.value = true
  categoryId.value = undefined
  page.value = 1
  reloadLinks()
}

function openCreate() {
  editing.value = null
  form.categoryId = null
  form.title = ''
  form.url = ''
  form.description = ''
  form.iconUrl = ''
  form.isActive = true
  form.isRecommended = false
  form.sort = 0
  dialogOpen.value = true
}

function openEdit(row: AdminLink) {
  editing.value = row
  form.categoryId = row.categoryId
  form.title = row.title
  form.url = row.url
  form.description = row.description
  form.iconUrl = row.iconUrl
  form.isActive = row.isActive
  form.isRecommended = row.isRecommended
  form.sort = row.sort
  dialogOpen.value = true
}

async function crawlUrl() {
  const url = form.url?.trim()
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
    
    if (data.title) form.title = data.title
    if (data.description) form.description = data.description
    if (data.iconUrl) form.iconUrl = data.iconUrl
    if (data.url) form.url = data.url

    ElMessage.success('获取成功')
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    ElMessage.error(error.statusMessage || '获取失败')
  } finally {
    crawling.value = false
  }
}

async function checkConnectivity() {
  // 确定检测范围
  let targetName = '全部站点'
  let requestBody: { categoryId?: number | null; recommended?: boolean } = {}

  if (recommendedMode.value) {
    targetName = '推荐站点'
    requestBody = { recommended: true }
  } else if (categoryId.value !== undefined) {
    const cat = categories.value.find(c => c.id === categoryId.value)
    targetName = cat ? `「${cat.name}」分类` : '当前分类'
    requestBody = { categoryId: categoryId.value }
  }

  try {
    await ElMessageBox.confirm(
      `确定要检测 ${targetName} 吗？\n\n- 可访问的站点将更新图标并启用\n- 不可访问的站点将被禁用`,
      '检测连通性',
      {
        confirmButtonText: '开始检测',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
  } catch {
    return
  }

  checkingConnectivity.value = true
  checkProgress.value = { current: 0, total: 0 }

  try {
    const data = await $api<{
      total: number
      reachable: number
      failed: number
      iconsUpdated: number
      disabled: number
      reEnabled: number
    }>('/api/admin/links/check-connectivity', {
      method: 'POST',
      body: requestBody
    })
    ElMessageBox.alert(
      `检测完成！\n\n共检测 ${data.total} 个站点\n- 可访问：${data.reachable} 个\n- 不可访问：${data.failed} 个\n- 图标已更新：${data.iconsUpdated} 个\n- 新禁用：${data.disabled} 个\n- 重新启用：${data.reEnabled} 个`,
      '检测结果'
    )
    await reloadLinks()
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    ElMessage.error(error.statusMessage || '检测失败')
  } finally {
    checkingConnectivity.value = false
  }
}

async function toggleLinkStatus(row: AdminLink, field: 'isActive' | 'isRecommended', value: boolean) {
  updatingRows.add(row.id)
  try {
    await $api(`/api/admin/links/${row.id}`, {
      method: 'PUT',
      body: { [field]: value }
    })
    ElMessage.success('更新成功')
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    row[field] = !value
    ElMessage.error(error.statusMessage || '更新失败')
  } finally {
    updatingRows.delete(row.id)
  }
}

async function save() {
  if (!form.categoryId) {
    ElMessage.warning('请选择一个二级分类')
    return
  }
  
  const payload = {
    categoryId: form.categoryId,
    title: form.title,
    url: form.url,
    description: form.description,
    iconUrl: form.iconUrl,
    isActive: form.isActive,
    isRecommended: form.isRecommended,
    sort: form.sort
  }

  if (editing.value?.id) {
    await $api(`/api/admin/links/${editing.value.id}`, { method: 'PUT', body: payload })
  } else {
    await $api('/api/admin/links', { method: 'POST', body: payload })
  }

  dialogOpen.value = false
  await reloadLinks()
}

async function remove(row: AdminLink) {
  try {
    await ElMessageBox.confirm(`确定要删除链接 "${row.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await $api(`/api/admin/links/${row.id}`, { method: 'DELETE' })
    ElMessage.success('删除成功')
    await reloadLinks()
  } catch {
    ElMessage.error('删除失败')
  }
}

function openCategoryCreate(parentId: number | null = null) {
  categoryForm.id = 0
  categoryForm.parentId = typeof parentId === 'number' ? parentId : null
  categoryForm.name = ''
  categoryForm.slug = ''
  
  if (parentId === null) {
    categoryForm.sort = (topLevelCategories.value.length + 1) * 10
  } else {
    const siblingCount = categories.value.filter(c => c.parentId === parentId).length
    categoryForm.sort = (siblingCount + 1) * 10
  }
  
  categoryCreateVisible.value = true
}

async function saveCategory() {
  if (!categoryForm.name || !categoryForm.slug) {
    ElMessage.warning('名称和标识不能为空')
    return
  }
  
  savingCategory.value = true
  try {
    const payload = { 
      parentId: categoryForm.parentId, 
      name: categoryForm.name, 
      slug: categoryForm.slug, 
      sort: categoryForm.sort 
    }
    
    if (categoryForm.id) {
      await $api(`/api/admin/categories/${categoryForm.id}`, { method: 'PUT', body: payload })
    } else {
      await $api('/api/admin/categories', { method: 'POST', body: payload })
    }
    
    ElMessage.success('保存成功')
    categoryCreateVisible.value = false
    await reloadCategories()
    
    if (categoryMaintenanceVisible.value) {
      loadMaintenanceCategories()
    }
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    ElMessage.error(error.statusMessage || '保存失败')
  } finally {
    savingCategory.value = false
  }
}

function _buildTreeData(data: Category[]): MaintenanceNode[] {
  const map = new Map<number, MaintenanceNode>()
  const roots: MaintenanceNode[] = []
  
  data.forEach((item) => {
    map.set(item.id, { ...item, _children: [] })
  })
  
  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!._children!.push(item)
    } else {
      roots.push(item)
    }
  })

  function sortTree(nodes: MaintenanceNode[]) {
    nodes.sort((a, b) => (a.sort || 0) - (b.sort || 0))
    for (const node of nodes) {
      if (node._children && node._children.length) sortTree(node._children)
    }
  }
  sortTree(roots)

  return roots
}

function loadMaintenanceCategories() {
  maintenanceCategories.value = _buildTreeData(categories.value)
  expandedRowKeys.value = []
}

function openCategoryMaintenance() {
  loadMaintenanceCategories()
  categoryMaintenanceVisible.value = true
}
async function deleteCategoryInMaintenance(row: Category) {
  try {
    await $api(`/api/admin/categories/${row.id}`, { method: 'DELETE' })
    ElMessage.success('删除成功')
    await reloadCategories()
    loadMaintenanceCategories()
  } catch (e: unknown) {
    const status = getErrorStatus(e)
    if (status === 409) {
      ElMessage.error('该分类下有链接，无法删除')
    } else {
      ElMessage.error('删除失败')
    }
  }
}

async function saveMaintenance() {
  savingMaintenance.value = true
  try {
    const flatList: Category[] = []
    function flatten(items: (Category & { _children?: Category[] })[]) {
      items.forEach(item => {
        flatList.push({ id: item.id, parentId: item.parentId, name: item.name, slug: item.slug, sort: item.sort })
        if (item._children?.length) flatten(item._children)
      })
    }
    flatten(maintenanceCategories.value)
    
    const promises = flatList.map(item => {
      const payload = { parentId: item.parentId, name: item.name, slug: item.slug, sort: item.sort }
      return $api(`/api/admin/categories/${item.id}`, { method: 'PUT', body: payload })
    })
    
    await Promise.all(promises)
    ElMessage.success('保存成功')
    categoryMaintenanceVisible.value = false
    await reloadCategories()
  } catch (e: unknown) {
    const error = e as { statusMessage?: string }
    ElMessage.error(error.statusMessage || '保存过程中出现错误')
  } finally {
    savingMaintenance.value = false
  }
}

function onCategoryMaintenanceClosed() {
  maintenanceCategories.value = []
  editingRowId.value = null
  expandedRowKeys.value = []
}

try {
  await reloadCategories()
  await reloadLinks()
} catch (e: unknown) {
  if (getErrorStatus(e) === 401) {
    await navigateTo('/admin/login')
  } else {
    throw e
  }
}
</script>

<style scoped>
.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.headerActions {
  display: flex;
  gap: 8px;
}

.categoryList {
  display: flex;
  flex-direction: column;
}

.categoryItem {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.expandIcon {
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  color: #909399;
}

.expandIcon:hover {
  background-color: #f2f6fc;
  color: #409eff;
}

.expandPlaceholder {
  width: 20px;
}

.categoryItem:hover {
  background-color: #f5f7fa;
}

.categoryItem.active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: bold;
}

.parentCategory {
  font-weight: 600;
  color: #303133;
}

.subCategory {
  padding-left: 28px;
  color: #606266;
  position: relative;
}

.subCategory::before {
  content: '';
  position: absolute;
  left: 18px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #dcdfe6;
}

.subCategory:last-child::before {
  height: 50%;
}

.categorySlug {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

:deep(.tree-expand-icon) {
  color: #409eff;
  margin-right: 4px;
  cursor: pointer;
}

:deep(.custom-arrow) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #606266;
  cursor: pointer;
  transition: transform 0.3s ease;
  user-select: none;
}

:deep(.custom-arrow:hover) {
  color: #409eff;
}

:deep(.custom-arrow.expanded) {
  transform: rotate(90deg);
}

:deep(.cell) {
  display: flex;
}

.sortCell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sortMove {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.sortMove :deep(.el-button) {
  padding: 0;
  height: 18px;
  line-height: 18px;
}
</style>
