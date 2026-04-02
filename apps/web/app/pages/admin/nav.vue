<template>
  <div>
    <el-row :gutter="12">
      <el-col :xs="24" :md="7" :lg="6">
        <el-card shadow="never">
          <template #header>
            <div class="cardHeader">
              <span>分类</span>
              <div class="headerActions">
                <el-button size="small" @click="openCategoryCreate">
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
              :class="{ active: categoryId === undefined }"
              @click="selectCategory(undefined)"
            >
              全部
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

      <el-col :xs="24" :md="17" :lg="18">
        <el-card shadow="never" style="margin-bottom: 12px">
          <el-form :inline="true" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model="query" placeholder="标题 / URL / 描述" clearable style="width: 260px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="reloadLinks">
                查询
              </el-button>
              <el-button @click="openCreate">
                新增链接
              </el-button>
              <el-button type="warning" :loading="checkingConnectivity" @click="checkConnectivity">
                检测连通性
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="rows" style="width: 100%" row-key="id">
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
            <el-table-column prop="url" label="URL" min-width="220" />
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
                  @change="(val: boolean) => toggleLinkStatus(row, 'isRecommended', val)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="isActive" label="启用" width="80">
              <template #default="{ row }">
                <el-switch
                  v-model="row.isActive"
                  size="small"
                  :loading="updatingRows.has(row.id)"
                  @change="(val: boolean) => toggleLinkStatus(row, 'isActive', val)"
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
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogOpen" :title="editing?.id ? '编辑链接' : '新增链接'" width="560px">
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
            <!-- 兼容性：如果一个分类既没有父级也没有子级，说明它目前只能作为一个孤立的一级分类，不应直接添加链接 -->
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

    <el-dialog v-model="categoryCreateVisible" :title="categoryForm.id ? '编辑分类' : '新增分类'" width="460px">
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

    <el-dialog v-model="categoryMaintenanceVisible" title="分类排序/维护" width="680px" @closed="onCategoryMaintenanceClosed">
      <div class="categoryMaintenanceList">
        <div
          v-for="(item, index) in maintenanceCategories"
          :key="item.id || index"
          class="maintenanceItem"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragover.prevent
          @drop="onDrop($event, index)"
        >
          <div class="dragHandle">
            <el-icon><Menu /></el-icon>
          </div>
          <el-select v-model="item.parentId" clearable placeholder="父级" style="width: 120px">
            <template #empty>
              <p style="padding: 8px; font-size: 12px; color: #909399; text-align: center; margin: 0">
                请先保存顶级分类
              </p>
            </template>
            <el-option 
              v-for="pc in maintenanceCategories.filter(c => !c.parentId && c.id !== item.id && !c._isNew)" 
              :key="pc.id" 
              :label="pc.name" 
              :value="pc.id" 
            />
          </el-select>
          <el-input v-model="item.name" placeholder="名称" style="width: 120px" />
          <el-input v-model="item.slug" placeholder="标识 (slug)" style="width: 120px" />
          <el-input-number v-model="item.sort" :min="0" placeholder="排序" style="width: 100px" />
          <el-button type="danger" link @click="removeMaintenanceItem(index)">
            删除
          </el-button>
        </div>
      </div>
      <div style="margin-top: 16px; text-align: center">
        <el-button @click="addMaintenanceItem">
          添加分类
        </el-button>
      </div>
      <template #footer>
        <el-button @click="categoryMaintenanceVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingMaintenance" @click="saveMaintenance">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Menu, ArrowRight, CaretRight, CaretBottom } from '@element-plus/icons-vue'
type Category = { id: number; parentId: number | null; name: string; slug: string; sort: number }
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

const categories = ref<Category[]>([])
const maintenanceCategories = ref<(Category & { _isNew?: boolean; _isDeleted?: boolean })[]>([])
const categoryMaintenanceVisible = ref(false)
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
const dragIndex = ref<number | null>(null)

const topLevelCategories = computed(() => categories.value.filter(c => !c.parentId))
const subCategories = computed(() => categories.value.filter(c => c.parentId))

const rows = ref<AdminLink[]>([])
const dialogOpen = ref(false)
const crawling = ref(false)
const checkingConnectivity = ref(false)
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
  // 默认展开所有一级分类
  data.filter(c => !c.parentId).forEach(c => {
    expandedCategories.value.add(c.id)
  })
}

async function reloadLinks() {
  const params: Record<string, string | number> = { limit: 500 }
  if (query.value.trim()) params.q = query.value.trim()
  if (categoryId.value !== undefined) params.categoryId = categoryId.value

  const data = await $api<AdminLink[]>('/api/admin/links', { params, headers: requestHeaders })
  rows.value = data
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
  categoryId.value = id
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
  } catch (e: any) {
    ElMessage.error(e.statusMessage || '获取失败')
  } finally {
    crawling.value = false
  }
}

async function checkConnectivity() {
  try {
    await ElMessageBox.confirm('确定要检测所有已启用的站点吗？不可访问的站点将被自动禁用。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  checkingConnectivity.value = true
  try {
    const data = await $api<{ total: number; failed: number }>('/api/admin/links/check-connectivity', {
      method: 'POST'
    })
    ElMessageBox.alert(`检测完成！共检测 ${data.total} 个站点，其中 ${data.failed} 个站点不可访问并已自动禁用。`, '检测结果')
    await reloadLinks()
  } catch (e: any) {
    ElMessage.error(e.statusMessage || '检测失败')
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
  } catch (e: any) {
    row[field] = !value // 失败时回滚状态
    ElMessage.error(e.statusMessage || '更新失败')
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
  } catch (e: any) {
    ElMessage.error('删除失败')
  }
}

function openCategoryCreate() {
  categoryForm.id = 0
  categoryForm.parentId = null
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.sort = categories.value.length * 10
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
  } catch (e: any) {
    ElMessage.error(e.statusMessage || '保存失败')
  } finally {
    savingCategory.value = false
  }
}

function openCategoryMaintenance() {
  maintenanceCategories.value = JSON.parse(JSON.stringify(categories.value))
  categoryMaintenanceVisible.value = true
}

function addMaintenanceItem() {
  maintenanceCategories.value.push({
    id: 0,
    parentId: null,
    name: '',
    slug: '',
    sort: maintenanceCategories.value.length * 10,
    _isNew: true
  })
}

function removeMaintenanceItem(index: number) {
  const item = maintenanceCategories.value[index]
  if (item._isNew) {
    maintenanceCategories.value.splice(index, 1)
  } else {
    // 标记为删除，或者直接调用 API。这里先简单实现：弹窗内直接删除会比较复杂，因为有外键。
    // 按照用户需求“支持增删改”，如果删除已有分类且有数据，后端会拦截。
    ElMessageBox.confirm(`确定要删除分类 "${item.name}" 吗？`, '提示', {
      type: 'warning'
    }).then(async () => {
      try {
        await $api(`/api/admin/categories/${item.id}`, { method: 'DELETE' })
        maintenanceCategories.value.splice(index, 1)
        ElMessage.success('删除成功')
      } catch (e: any) {
        const status = getErrorStatus(e)
        if (status === 409) {
          ElMessage.error('该分类下有链接，无法删除')
        } else {
          ElMessage.error('删除失败')
        }
      }
    }).catch(() => {})
  }
}

async function saveMaintenance() {
  savingMaintenance.value = true
  try {
    for (let i = 0; i < maintenanceCategories.value.length; i++) {
      const item = maintenanceCategories.value[i]
      // 更新排序
      item.sort = i * 10
      
      const payload = { parentId: item.parentId, name: item.name, slug: item.slug, sort: item.sort }
      if (item._isNew) {
        await $api('/api/admin/categories', { method: 'POST', body: payload })
      } else {
        await $api(`/api/admin/categories/${item.id}`, { method: 'PUT', body: payload })
      }
    }
    ElMessage.success('保存成功')
    categoryMaintenanceVisible.value = false
    await reloadCategories()
  } catch (e: any) {
    ElMessage.error(e.statusMessage || '保存过程中出现错误')
  } finally {
    savingMaintenance.value = false
  }
}

function onCategoryMaintenanceClosed() {
  maintenanceCategories.value = []
}

// 简单拖拽实现
function onDragStart(e: DragEvent, index: number) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDrop(e: DragEvent, index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return
  const list = maintenanceCategories.value
  const item = list.splice(dragIndex.value, 1)[0]
  list.splice(index, 0, item)
  dragIndex.value = null
}

async function removeCategory(row: Category) {
  try {
    await ElMessageBox.confirm(`确定要删除分类 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await $api(`/api/admin/categories/${row.id}`, { method: 'DELETE' })
    ElMessage.success('删除成功')
    await reloadCategories()
  } catch (e: any) {
    const status = getErrorStatus(e)
    if (status === 409) {
      // ElMessage.error(e.statusMessage || '该分类中有导航数据，禁止删除')
    } else {
      ElMessage.error('删除失败')
    }
  }
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

.categoryMaintenanceList {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.maintenanceItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  cursor: move;
}

.maintenanceItem:hover {
  border-color: #409eff;
}

.dragHandle {
  cursor: move;
  color: #909399;
  display: flex;
  align-items: center;
}
</style>
