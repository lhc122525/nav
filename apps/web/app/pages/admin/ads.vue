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
          <el-form-item label="开启广告位">
            <el-switch v-model="config.enabled" />
          </el-form-item>
          <el-form-item label="展示数量">
            <el-input-number v-model="config.displayCount" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="随机展示">
            <el-switch v-model="config.isRandom" />
          </el-form-item>
          <span class="configTip">（随机时从列表随机筛选，非随机则按排序取前 N 个）</span>
        </el-form>
      </el-card>

      <el-card class="configCard mt20" shadow="never">
        <template #header>
          <div class="cardHeader">
            <span>打赏二维码配置</span>
            <el-button type="primary" link :loading="donateSaving" @click="saveDonateConfig">保存配置</el-button>
          </div>
        </template>
        <el-form :model="donateConfig" label-width="100px" class="donateForm">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="支付宝二维码">
                <div class="donateUploadRow">
                  <el-upload :show-file-list="false" :http-request="(o) => uploadDonateQr(o, 'alipay')" accept="image/*">
                    <el-button>上传</el-button>
                  </el-upload>
                  <el-input v-model="donateConfig.alipayQrUrl" placeholder="或粘贴图片 URL" />
                </div>
              </el-form-item>
              <div v-if="donateConfig.alipayQrUrl" class="donatePreview">
                <el-image :src="donateConfig.alipayQrUrl" fit="contain" style="width: 100%; height: 240px" :preview-src-list="[donateConfig.alipayQrUrl]" preview-teleported />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="微信二维码">
                <div class="donateUploadRow">
                  <el-upload :show-file-list="false" :http-request="(o) => uploadDonateQr(o, 'wechat')" accept="image/*">
                    <el-button>上传</el-button>
                  </el-upload>
                  <el-input v-model="donateConfig.wechatQrUrl" placeholder="或粘贴图片 URL" />
                </div>
              </el-form-item>
              <div v-if="donateConfig.wechatQrUrl" class="donatePreview">
                <el-image :src="donateConfig.wechatQrUrl" fit="contain" style="width: 100%; height: 240px" :preview-src-list="[donateConfig.wechatQrUrl]" preview-teleported />
              </div>
            </el-col>
          </el-row>
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
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import type { UploadAjaxError } from 'element-plus/es/components/upload/src/ajax'

definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })

type AdRow = {
  id: number
  title: string
  image_url: string
  url: string
  sort: number
  is_active: boolean | number
}

type AdConfigRow = { displayCount?: number; isRandom?: boolean; enabled?: boolean }

type DonateConfigRow = { alipayQrUrl?: string; wechatQrUrl?: string }

const loading = ref(false)
const submitting = ref(false)
const donateSaving = ref(false)
const ads = ref<AdRow[]>([])
const config = ref({
  enabled: true,
  displayCount: 2,
  isRandom: false
})
const donateConfig = ref({
  alipayQrUrl: '',
  wechatQrUrl: ''
})

const dialogVisible = ref(false)
type AdForm = {
  id: number | null
  title: string
  imageUrl: string
  url: string
  sort: number
  isActive: boolean
}

const form = ref<AdForm>({
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
    const [adsRes, configRes, donateRes] = await Promise.all([
      $fetch<AdRow[]>('/api/admin/ads'),
      $fetch<AdConfigRow>('/api/admin/ad-config'),
      $fetch<DonateConfigRow>('/api/admin/donate-config')
    ])
    ads.value = adsRes
    config.value = {
      enabled: configRes.enabled ?? true,
      displayCount: configRes.displayCount ?? 2,
      isRandom: configRes.isRandom ?? false
    }
    donateConfig.value = {
      alipayQrUrl: donateRes.alipayQrUrl || '',
      wechatQrUrl: donateRes.wechatQrUrl || ''
    }
  } catch (error) {
    const e = error as { message?: string }
    ElMessage.error('加载失败: ' + (e.message || ''))
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
        enabled: config.value.enabled,
        displayCount: config.value.displayCount,
        isRandom: config.value.isRandom
      }
    })
    ElMessage.success('配置已保存')
  } catch (error) {
    const e = error as { message?: string }
    ElMessage.error('保存失败: ' + (e.message || ''))
  }
}

const uploadDonateQr = async (o: UploadRequestOptions, type: 'alipay' | 'wechat') => {
  const file: File = o.file
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scope', 'donate')
  try {
    const res = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: formData })
    if (type === 'alipay') donateConfig.value.alipayQrUrl = res.url
    else donateConfig.value.wechatQrUrl = res.url
    ElMessage.success('上传成功')
    o.onSuccess?.(res)
  } catch (e) {
    const err = e as { message?: string }
    ElMessage.error('上传失败: ' + (err.message || ''))
    o.onError?.(e as UploadAjaxError)
  }
}

const saveDonateConfig = async () => {
  donateSaving.value = true
  try {
    await $fetch('/api/admin/donate-config', {
      method: 'POST',
      body: {
        alipayQrUrl: donateConfig.value.alipayQrUrl,
        wechatQrUrl: donateConfig.value.wechatQrUrl
      }
    })
    ElMessage.success('配置已保存')
  } catch (error) {
    const e = error as { message?: string }
    ElMessage.error('保存失败: ' + (e.message || ''))
  } finally {
    donateSaving.value = false
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

const handleEdit = (row: AdRow) => {
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
  } catch (error) {
    const e = error as { message?: string }
    ElMessage.error('操作失败: ' + (e.message || ''))
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: AdRow) => {
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
    } catch (error) {
      const e = error as { message?: string }
      ElMessage.error('删除失败: ' + (e.message || ''))
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

.donateForm {
  width: 100%;
}

.donateUploadRow {
  display: flex;
  gap: 10px;
  width: 100%;
}

.donatePreview {
  margin-top: 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px;
}
</style>
