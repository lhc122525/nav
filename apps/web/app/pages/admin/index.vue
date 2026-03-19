<template>
  <div>
    <el-row :gutter="12">
      <el-col :xs="24" :md="7" :lg="6">
        <el-card shadow="never">
          <template #header>
            <div class="cardHeader">
              <span>分类</span>
              <el-button size="small" @click="openCategoryCreate">
                新增
              </el-button>
            </div>
          </template>

          <el-table :data="categories" size="small" row-key="id" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column prop="slug" label="slug" min-width="120" />
            <el-table-column prop="sort" label="排序" width="70" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="primary" @click="openCategoryEdit(row)">
                  编辑
                </el-button>
                <el-button link type="danger" @click="removeCategory(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="17" :lg="18">
        <el-card shadow="never" style="margin-bottom: 12px">
          <el-form :inline="true" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model="query" placeholder="标题 / URL / 描述" clearable style="width: 260px" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="categoryId" clearable placeholder="全部" style="width: 200px">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="reloadLinks">
                查询
              </el-button>
              <el-button @click="openCreate">
                新增链接
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="rows" style="width: 100%" row-key="id">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="url" label="URL" min-width="220" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="categoryId" label="分类" width="140">
              <template #default="{ row }">
                {{ categoryName(row.categoryId) }}
              </template>
            </el-table-column>
            <el-table-column prop="isActive" label="启用" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.isActive" type="success">是</el-tag>
                <el-tag v-else type="info">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="90" />
            <el-table-column label="操作" width="180">
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
          <el-input v-model="form.url" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" clearable placeholder="不设置" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.iconUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" />
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

    <el-dialog v-model="categoryDialogOpen" :title="editingCategory?.id ? '编辑分类' : '新增分类'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" />
        </el-form-item>
        <el-form-item label="slug">
          <el-input v-model="categoryForm.slug" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="100000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogOpen = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
type Category = { id: number; name: string; slug: string; sort: number }
type AdminLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
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
  sort: number
}

type CategoryForm = {
  name: string
  slug: string
  sort: number
}

definePageMeta({ middleware: ['admin-auth'] })

useHead(() => ({ title: '后台管理 - 导航站' }))

const query = ref('')
const categoryId = ref<number | undefined>(undefined)

const categories = ref<Category[]>([])

const rows = ref<AdminLink[]>([])
const dialogOpen = ref(false)
const editing = ref<AdminLink | null>(null)
const form = reactive<LinkForm>({
  categoryId: null,
  title: '',
  url: '',
  description: '',
  iconUrl: '',
  isActive: true,
  sort: 0
})

const categoryDialogOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = reactive<CategoryForm>({
  name: '',
  slug: '',
  sort: 0
})

function categoryName(id: number | null) {
  if (id == null) return '-'
  const hit = categories.value.find((c) => c.id === id)
  return hit?.name || String(id)
}

async function reloadCategories() {
  const data = await $fetch<Category[]>('/api/admin/categories', { params: { limit: 500 } })
  categories.value = data
}

async function reloadLinks() {
  const params: Record<string, string | number> = { limit: 500 }
  if (query.value.trim()) params.q = query.value.trim()
  if (categoryId.value != null) params.categoryId = categoryId.value

  const data = await $fetch<AdminLink[]>('/api/admin/links', { params })
  rows.value = data
}

function openCreate() {
  editing.value = null
  form.categoryId = null
  form.title = ''
  form.url = ''
  form.description = ''
  form.iconUrl = ''
  form.isActive = true
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
  form.sort = row.sort
  dialogOpen.value = true
}

async function save() {
  const payload = {
    categoryId: form.categoryId,
    title: form.title,
    url: form.url,
    description: form.description,
    iconUrl: form.iconUrl,
    isActive: form.isActive,
    sort: form.sort
  }

  if (editing.value?.id) {
    await $fetch(`/api/admin/links/${editing.value.id}`, { method: 'PUT', body: payload })
  } else {
    await $fetch('/api/admin/links', { method: 'POST', body: payload })
  }

  dialogOpen.value = false
  await reloadLinks()
}

async function remove(row: AdminLink) {
  await $fetch(`/api/admin/links/${row.id}`, { method: 'DELETE' })
  await reloadLinks()
}

function openCategoryCreate() {
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.sort = 0
  categoryDialogOpen.value = true
}

function openCategoryEdit(row: Category) {
  editingCategory.value = row
  categoryForm.name = row.name
  categoryForm.slug = row.slug
  categoryForm.sort = row.sort
  categoryDialogOpen.value = true
}

async function saveCategory() {
  const payload = { name: categoryForm.name, slug: categoryForm.slug, sort: categoryForm.sort }
  if (editingCategory.value?.id) {
    await $fetch(`/api/admin/categories/${editingCategory.value.id}`, { method: 'PUT', body: payload })
  } else {
    await $fetch('/api/admin/categories', { method: 'POST', body: payload })
  }
  categoryDialogOpen.value = false
  await reloadCategories()
}

async function removeCategory(row: Category) {
  await $fetch(`/api/admin/categories/${row.id}`, { method: 'DELETE' })
  await reloadCategories()
}

await reloadCategories()
await reloadLinks()
</script>

<style scoped>
.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
