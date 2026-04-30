<template>
  <div class="tools-list-page">
    <div class="page-header">
      <h1 class="page-title">站点工具</h1>
      <p class="page-desc">实用在线工具，提升工作效率</p>
    </div>

    <div class="tools-grid">
      <NuxtLink
        v-for="app in microApps"
        :key="app.name"
        :to="app.activeRule"
        class="tool-card"
      >
        <div class="tool-icon">
          <el-icon :size="32"><component :is="getIcon(app.icon)" /></el-icon>
        </div>
        <div class="tool-info">
          <h3 class="tool-title">{{ app.title }}</h3>
          <p class="tool-desc">{{ app.description }}</p>
        </div>
        <el-icon class="tool-arrow"><ArrowRight /></el-icon>
      </NuxtLink>
    </div>

    <div v-if="microApps.length === 0" class="empty-state">
      <el-empty description="暂无可用工具" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Location, ArrowRight } from '@element-plus/icons-vue'
import { microApps, iconMap } from '~/config/micro-apps'

useHead(() => ({ title: '站点工具 - 非乐鱼导航' }))

// 动态导入图标
const iconComponents = ref<Record<string, any>>({
  Location
})

function getIcon(iconName: string) {
  return iconComponents.value[iconName] || Location
}

// 异步加载其他图标
onMounted(async () => {
  const icons = await import('@element-plus/icons-vue')
  for (const key of Object.keys(iconMap)) {
    if (icons[key]) {
      iconComponents.value[key] = icons[key]
    }
  }
})
</script>

<style scoped lang="less">
.tools-list-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 15px;
  color: #666;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: #409eff;
    transform: translateY(-2px);
  }
}

.tool-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-radius: 12px;
  color: #fff;
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.tool-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tool-arrow {
  flex-shrink: 0;
  color: #c0c4cc;
  transition: transform 0.2s ease;
}

.tool-card:hover .tool-arrow {
  transform: translateX(4px);
  color: #409eff;
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .tools-list-page {
    padding: 20px 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .tool-card {
    padding: 16px;
  }

  .tool-icon {
    width: 48px;
    height: 48px;
  }
}
</style>
