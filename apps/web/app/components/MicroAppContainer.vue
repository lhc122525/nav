<template>
  <div class="micro-app-wrap">
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    <!-- qiankun 容器：必须保持为空。
         qiankun 挂载时会清空容器内所有子节点，若宿主把 Vue 管理的节点（如 v-if loading）
         放在里面，会被 qiankun 移除出 DOM，导致宿主 Vue 后续补丁时 parentNode 为 null 报错 -->
    <div id="micro-app-container" class="micro-app-container" :class="{ 'is-loading': loading }"></div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { loadMicroApp, type MicroApp } from 'qiankun'

const props = defineProps<{
  name: string
  entry: string
}>()

const loading = ref(true)
let microApp: MicroApp | null = null

onMounted(() => {
  const container = document.getElementById('micro-app-container')
  if (!container) return

  microApp = loadMicroApp(
    {
      name: props.name,
      entry: props.entry,
      container: '#micro-app-container',
      props: {
        // 传递给子应用的参数
        basePath: '/tools/' + props.name.replace('tool-', '')
      }
    },
    {},
    // 生命周期钩子必须作为第 3 个参数传入（qiankun 的 loadMicroApp 签名），
    // 传到第 2 个参数里会被忽略，导致 loading 永远不结束
    {
      beforeLoad: () => {
        loading.value = true
        return Promise.resolve()
      },
      beforeMount: () => {
        loading.value = false
        return Promise.resolve()
      },
      afterMount: () => {
        loading.value = false
        return Promise.resolve()
      },
      afterUnmount: () => {
        loading.value = true
        return Promise.resolve()
      }
    }
  )
})

onBeforeUnmount(() => {
  if (microApp) {
    microApp.unmount()
    microApp = null
  }
})
</script>

<style scoped>
.micro-app-container {
  min-height: calc(100vh - 180px);
}

.micro-app-container.is-loading {
  min-height: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
