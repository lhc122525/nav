<template>
  <div class="ip-tool">
    <div class="ip-card">
      <div class="ip-header">
        <el-icon class="ip-icon" :size="48"><Location /></el-icon>
        <h2 class="ip-title">您的公网IP地址</h2>
      </div>

      <div v-if="loading" class="ip-loading">
        <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
        <p>正在获取IP信息...</p>
      </div>

      <div v-else-if="error" class="ip-error">
        <el-icon :size="32" color="#f56c6c"><CircleClose /></el-icon>
        <p>{{ error }}</p>
        <el-button type="primary" @click="fetchIpInfo">重新获取</el-button>
      </div>

      <div v-else class="ip-content">
        <div class="ip-address">
          <span class="ip-label">IP 地址</span>
          <span class="ip-value">{{ ipInfo?.ip || '-' }}</span>
          <el-button
            v-if="ipInfo?.ip"
            type="primary"
            size="small"
            text
            @click="copyIp"
          >
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
        </div>

        <div class="ip-details">
          <div class="detail-item">
            <span class="detail-label">国家/地区</span>
            <span class="detail-value">{{ ipInfo?.country || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">省份</span>
            <span class="detail-value">{{ ipInfo?.region || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">城市</span>
            <span class="detail-value">{{ ipInfo?.city || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">ISP</span>
            <span class="detail-value">{{ ipInfo?.isp || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">时区</span>
            <span class="detail-value">{{ ipInfo?.timezone || '-' }}</span>
          </div>
        </div>

        <el-button
          type="primary"
          :loading="loading"
          @click="fetchIpInfo"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="ip-tips">
      <el-icon><InfoFilled /></el-icon>
      <span>IP地址信息仅供参考，实际位置可能因网络运营商而异</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Location, Loading, CircleClose, CopyDocument, Refresh, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'



interface IpInfo {
  ip: string
  country: string
  region: string
  city: string
  isp: string
  timezone: string
}

const loading = ref(true)
const error = ref('')
const ipInfo = ref<IpInfo | null>(null)

async function fetchIpInfo() {
  loading.value = true
  error.value = ''

  try {
    // 使用免费的 IP 查询 API
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) {
      throw new Error('获取IP信息失败')
    }
    const data = await response.json()

    ipInfo.value = {
      ip: data.ip || '',
      country: data.country_name || '',
      region: data.region || '',
      city: data.city || '',
      isp: data.org || '',
      timezone: data.timezone || ''
    }
  } catch (e) {
    error.value = '获取IP信息失败，请稍后重试'
    console.error('Failed to fetch IP info:', e)
  } finally {
    loading.value = false
  }
}

function copyIp() {
  if (ipInfo.value?.ip) {
    navigator.clipboard.writeText(ipInfo.value.ip)
    ElMessage.success('IP地址已复制到剪贴板')
  }
}

onMounted(() => {
  fetchIpInfo()
})
</script>

<style scoped>
.ip-tool {
  padding: 20px;
}

.ip-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.ip-header {
  text-align: center;
  margin-bottom: 32px;
}

.ip-icon {
  color: #409eff;
  margin-bottom: 12px;
}

.ip-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.ip-loading,
.ip-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ip-error {
  gap: 12px;
}

.ip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ip-address {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.ip-label {
  font-size: 14px;
  opacity: 0.9;
}

.ip-value {
  font-size: 24px;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, monospace;
}

.ip-address .el-button {
  color: #fff;
}

.ip-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  width: 100%;
  margin-bottom: 24px;
}

.detail-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
}

.detail-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.ip-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 13px;
  color: #909399;
}

@media (max-width: 768px) {
  .ip-tool {
    padding: 12px;
  }

  .ip-card {
    padding: 20px;
  }

  .ip-address {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }

  .ip-value {
    font-size: 18px;
  }

  .ip-details {
    grid-template-columns: 1fr;
  }
}
</style>