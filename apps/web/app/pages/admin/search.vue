<template>
  <NuxtLayout name="admin">
    <el-row :gutter="12">
      <!-- 左侧分类列表 -->
      <el-col :xs="24" :md="7" :lg="4">
        <el-card shadow="never">
          <template #header>
            <div class="cardHeader">
              <span>搜索分类</span>
              <div class="headerActions">
                <el-button size="small" @click="openCategoryCreate">新增</el-button>
              </div>
            </div>
          </template>

          <div class="categoryList">
            <div
              v-for="c in categories"
              :key="c.id"
              class="categoryItem"
              :class="{ active: activeCategoryId === c.id }"
              @click="activeCategoryId = c.id"
            >
              <div class="categoryName">{{ c.name }}</div>
              <div class="categoryActions">
                <el-button link size="small" @click.stop="openCategoryEdit(c)">编辑</el-button>
                <el-button link size="small" type="danger" @click.stop="handleDeleteCategory(c)">删除</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧引擎列表 -->
      <el-col :xs="24" :md="17" :lg="20">
        <el-card shadow="never">
          <template #header>
            <div class="cardHeader">
              <span>{{ activeCategory?.name || '搜索引擎' }}</span>
              <el-button v-if="activeCategoryId" type="primary" size="small" @click="openEngineCreate">
                新增引擎
              </el-button>
            </div>
          </template>

          <el-table :data="engines" style="width: 100%" v-loading="loadingEngines">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="iconUrl" label="图标" width="80">
              <template #default="{ row }">
                <el-image
                  v-if="row.iconUrl"
                  :src="row.iconUrl"
                  style="width: 24px; height: 24px"
                  fit="contain"
                >
                  <template #error>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-image>
                <el-icon v-else><Search /></el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" width="150" />
            <el-table-column prop="url" label="搜索地址" min-width="300" />
            <el-table-column prop="isDefault" label="默认" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isDefault ? 'success' : 'info'">{{ row.isDefault ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link size="small" @click="openEngineEdit(row)">编辑</el-button>
                <el-button link size="small" type="danger" @click="handleDeleteEngine(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类弹窗 -->
    <el-dialog
      v-model="categoryDialog.visible"
      :title="categoryDialog.isEdit ? '编辑分类' : '新增分类'"
      width="400px"
    >
      <el-form :model="categoryDialog.form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="categoryDialog.form.name" placeholder="分类名称，如：站内" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryDialog.form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="categoryDialog.loading" @click="submitCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 引擎弹窗 -->
    <el-dialog
      v-model="engineDialog.visible"
      :title="engineDialog.isEdit ? '编辑引擎' : '新增引擎'"
      width="500px"
    >
      <el-form :model="engineDialog.form" label-width="100px">
        <el-form-item label="搜索地址" required>
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="engineDialog.form.url" placeholder="如：https://www.baidu.com/s?wd=%s" />
            <el-button :loading="engineDialog.crawling" @click="handleCrawl">获取</el-button>
          </div>
          <div style="font-size: 12px; color: #999; margin-top: 4px">使用 %s 作为关键词占位符</div>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="engineDialog.form.name" placeholder="引擎名称" />
        </el-form-item>
        <el-form-item label="图标地址">
          <el-input v-model="engineDialog.form.iconUrl" placeholder="图标 URL" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="engineDialog.form.isDefault" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="engineDialog.form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="engineDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="engineDialog.loading" @click="submitEngine">确定</el-button>
      </template>
    </el-dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

definePageMeta({
  middleware: ['admin-auth']
})

// 分类数据
const categories = ref<any[]>([])
const activeCategoryId = ref<number | null>(null)
const activeCategory = computed(() => categories.value.find(c => c.id === activeCategoryId.value))

const fetchCategories = async () => {
  try {
    const data = await $fetch('/api/admin/search-categories')
    categories.value = data as any[]
    if (categories.value.length > 0 && !activeCategoryId.value) {
      activeCategoryId.value = categories.value[0].id
    }
  } catch (error) {
    ElMessage.error('获取分类失败')
  }
}

// 引擎数据
const engines = ref<any[]>([])
const loadingEngines = ref(false)

const fetchEngines = async () => {
  if (!activeCategoryId.value) return
  loadingEngines.value = true
  try {
    const data = await $fetch('/api/admin/search-engines', {
      query: { categoryId: activeCategoryId.value }
    })
    engines.value = data as any[]
  } catch (error) {
    ElMessage.error('获取引擎失败')
  } finally {
    loadingEngines.value = false
  }
}

watch(activeCategoryId, () => {
  fetchEngines()
})

// 分类弹窗逻辑
const categoryDialog = reactive({
  visible: false,
  isEdit: false,
  loading: false,
  form: {
    id: null,
    name: '',
    sort: 0
  }
})

const openCategoryCreate = () => {
  categoryDialog.isEdit = false
  categoryDialog.form = { id: null, name: '', sort: 0 }
  categoryDialog.visible = true
}

const openCategoryEdit = (c: any) => {
  categoryDialog.isEdit = true
  categoryDialog.form = { ...c }
  categoryDialog.visible = true
}

const submitCategory = async () => {
  if (!categoryDialog.form.name) return ElMessage.warning('请输入名称')
  categoryDialog.loading = true
  try {
    if (categoryDialog.isEdit) {
      await $fetch(`/api/admin/search-categories/${categoryDialog.form.id}`, {
        method: 'PUT',
        body: categoryDialog.form
      })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/search-categories', {
        method: 'POST',
        body: categoryDialog.form
      })
      ElMessage.success('创建成功')
    }
    categoryDialog.visible = false
    fetchCategories()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    categoryDialog.loading = false
  }
}

const handleDeleteCategory = (c: any) => {
  ElMessageBox.confirm(`确定删除分类 "${c.name}" 吗？其下的搜索引擎也将被删除。`, '提示', {
    type: 'warning'
  }).then(async () => {
    await $fetch(`/api/admin/search-categories/${c.id}`, { method: 'DELETE' })
    ElMessage.success('删除成功')
    if (activeCategoryId.value === c.id) {
      activeCategoryId.value = null
    }
    fetchCategories()
  })
}

// 引擎弹窗逻辑
const engineDialog = reactive({
  visible: false,
  isEdit: false,
  loading: false,
  crawling: false,
  form: {
    id: null,
    categoryId: null as number | null,
    name: '',
    url: '',
    iconUrl: '',
    isDefault: false,
    sort: 0
  }
})

const openEngineCreate = () => {
  engineDialog.isEdit = false
  engineDialog.form = {
    id: null,
    categoryId: activeCategoryId.value,
    name: '',
    url: '',
    iconUrl: '',
    isDefault: false,
    sort: 0
  }
  engineDialog.visible = true
}

const openEngineEdit = (e: any) => {
  engineDialog.isEdit = true
  engineDialog.form = { ...e }
  engineDialog.visible = true
}

const handleCrawl = async () => {
  if (!engineDialog.form.url) return ElMessage.warning('请输入地址')
  engineDialog.crawling = true
  try {
    const data: any = await $fetch('/api/admin/search-engines/crawl', {
      method: 'POST',
      body: { url: engineDialog.form.url }
    })
    if (data.name && !engineDialog.form.name) engineDialog.form.name = data.name
    if (data.iconUrl) engineDialog.form.iconUrl = data.iconUrl
    ElMessage.success('获取成功')
  } catch (error: any) {
    ElMessage.error(error.statusMessage || '获取失败')
  } finally {
    engineDialog.crawling = false
  }
}

const submitEngine = async () => {
  if (!engineDialog.form.name || !engineDialog.form.url) {
    return ElMessage.warning('请填写必填项')
  }
  engineDialog.loading = true
  try {
    if (engineDialog.isEdit) {
      await $fetch(`/api/admin/search-engines/${engineDialog.form.id}`, {
        method: 'PUT',
        body: engineDialog.form
      })
      ElMessage.success('更新成功')
    } else {
      await $fetch('/api/admin/search-engines', {
        method: 'POST',
        body: engineDialog.form
      })
      ElMessage.success('创建成功')
    }
    engineDialog.visible = false
    fetchEngines()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    engineDialog.loading = false
  }
}

const handleDeleteEngine = (e: any) => {
  ElMessageBox.confirm(`确定删除引擎 "${e.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    await $fetch(`/api/admin/search-engines/${e.id}`, { method: 'DELETE' })
    ElMessage.success('删除成功')
    fetchEngines()
  })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.categoryList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.categoryItem {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.categoryItem:hover {
  background-color: #f5f7fa;
}

.categoryItem.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: bold;
}

.categoryName {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.categoryActions {
  display: none;
}

.categoryItem:hover .categoryActions {
  display: flex;
}
</style>
