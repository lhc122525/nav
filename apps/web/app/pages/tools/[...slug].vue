<template>
  <div class="tools-detail-page">
    <!-- 未找到对应的微应用 -->
    <el-empty v-if="!activeApp" description="工具不存在或已下线">
      <el-button type="primary" @click="navigateTo('/tools')">返回工具列表</el-button>
    </el-empty>

    <!-- 微应用容器 -->
    <ClientOnly v-else>
      <div class="app-header">
        <div class="app-icon">
          <el-icon :size="24"><component :is="getIcon(activeApp.icon)" /></el-icon>
        </div>
        <div class="app-meta">
          <h1 class="app-title">{{ activeApp.title }}</h1>
          <p class="app-desc">{{ activeApp.description }}</p>
        </div>
      </div>
      <MicroAppContainer
        :name="activeApp.name"
        :entry="activeApp.entry"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Location } from '@element-plus/icons-vue'
import { microApps, getActiveMicroApp } from '~/config/micro-apps'

const route = useRoute()
const activeApp = computed(() => getActiveMicroApp(route.path))

// 设置页面标题
watchEffect(() => {
  if (activeApp.value) {
    useHead({ title: `${activeApp.value.title} - 站点工具 - 非乐鱼导航` })
  }
})

// 动态图标
const iconComponents = ref<Record<string, any>>({
  Location
})

function getIcon(iconName: string) {
  return iconComponents.value[iconName] || Location
}

onMounted(async () => {
  const icons = await import('@element-plus/icons-vue')
  if (activeApp.value && icons[activeApp.value.icon]) {
    iconComponents.value[activeApp.value.icon] = icons[activeApp.value.icon]
  }
})
</script>

<style scoped lang="less">
.tools-detail-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  min-height: calc(100vh - 180px);
}

.app-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.app-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-radius: 10px;
  color: #fff;
}

.app-meta {
  flex: 1;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.app-desc {
  font-size: 13px;
  color: #909399;
}

@media (max-width: 768px) {
  .tools-detail-page {
    padding: 12px;
  }

  .app-header {
    padding: 16px;
  }

  .app-icon {
    width: 40px;
    height: 40px;
  }

  .app-title {
    font-size: 16px;
  }
}
</style>
