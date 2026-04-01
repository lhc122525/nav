<template>
  <div class="ads-management">
      <div class="pageHeader">
        <h2>广告管理</h2>
        <div class="headerActions">
          <el-button type="primary" @click="handleAdd">新增广告</el-button>
        </div>
      </div>

      <!-- 配置部分 -->
      <el-card class="configCard" shadow="never">
        <template #header>
          <div class="cardHeader">
            <span>广告展示配置</span>
            <el-button type="primary" link @click="saveConfig">保存配置</el-button>
          </div>
        </template>
        <el-form :inline="true" :model="config" class="configForm">
          <el-form-item label="展示数量">
            <el-input-number v-model="config.displayCount" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="随机展示">
            <el-switch v-model="config.isRandom" />
          </el-form-item>
          <span class="configTip">（随机时从列表随机筛选，非随机则按排序取前 N 个）</span>
        </el-form>
      </el-card>

      <!-- 列表部分 -->
      <el-table :data="ads" border style="width: 100%" class="mt20" v-loading="loading">
        <el-table-column label="序号" width="80" align="center">
          <template #default="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="宣传图" width="120" align="center">
          <template #default="scope">
            <el-image 
              :src="scope.row.image_url" 
              style="width: 80px; height: 45px" 
              fit="cover"
              :preview-src-list="[scope.row.image_url]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="url" label="超链接" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 弹窗部分 -->
      <el-dialog
        v-model="dialogVisible"
        :title="form.id ? '编辑广告' : '新增广告'"
        width="500px"
      >
        <el-form :model="form" label-width="80px">
          <el-form-item label="标题" required>
            <el-input v-model="form.title" placeholder="输入广告标题" />
          </el-form-item>
          <el-form-item label="宣传图" required>
            <el-input v-model="form.imageUrl" placeholder="输入图片 URL" />
          </el-form-item>
          <el-form-item label="超链接" required>
            <el-input v-model="form.url" placeholder="输入广告跳转链接" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" />
          </el-form-item>
          <el-form-item label="启用">
            <el-switch v-model="form.isActive" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </template>
      </el-dialog>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const ads = ref([])
const config = ref({
  displayCount: 2,
  isRandom: false
})

const dialogVisible = ref(false)
const form = ref({
  id: null,
  title: '',
  imageUrl: '',
  url: '',
  sort: 0,
  isActive: true
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const [adsRes, configRes] = await Promise.all([
      $fetch('/api/admin/ads'),
      $fetch('/api/admin/ad-config')
    ])
    ads.value = adsRes
    config.value = {
      displayCount: configRes.display_count || 2,
      isRandom: !!configRes.is_random
    }
  } catch (error: any) {
    ElMessage.error('加载失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  try {
    await $fetch('/api/admin/ad-config', {
      method: 'POST',
      body: {
        displayCount: config.value.displayCount,
        isRandom: config.value.isRandom
      }
    })
    ElMessage.success('配置已保存')
  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const handleAdd = () => {
  form.value = {
    id: null,
    title: '',
    imageUrl: '',
    url: '',
    sort: 0,
    isActive: true
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  form.value = {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    url: row.url,
    sort: row.sort,
    isActive: !!row.is_active
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!form.value.title || !form.value.imageUrl || !form.value.url) {
    return ElMessage.warning('请填写必要字段')
  }
  
  submitting.value = true
  try {
    const api = form.value.id ? '/api/admin/ads/update' : '/api/admin/ads/create'
    await $fetch(api, {
      method: 'POST',
      body: form.value
    })
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchData()
  } catch (error: any) {
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该广告吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await $fetch('/api/admin/ads/delete', {
        method: 'POST',
        body: { id: row.id }
      })
      ElMessage.success('已删除')
      fetchData()
    } catch (error: any) {
      ElMessage.error('删除失败: ' + error.message)
    }
  })
}

onMounted(fetchData)
</script>

<style scoped>
.ads-management {
  padding: 20px 0;
}

.pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pageHeader h2 {
  margin: 0;
  font-size: 20px;
}

.configCard {
  background-color: #fcfcfc;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.configForm {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.configTip {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.mt20 {
  margin-top: 20px;
}
</style>
