<template>
  <el-container class="adminLayout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="asideTop">
        <!-- <NuxtLink class="brand" to="/">
          {{ siteName }}
        </NuxtLink> -->
        <div class="title" @click="collapsed = !collapsed">{{ siteName }}</div>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="active"
          :collapse="collapsed"
          :collapse-transition="false"
          @select="onSelect"
        >
          <el-menu-item index="/admin/nav">
            <span>导航管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/include">
            <span>收录管理</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header height="56px" class="header">
        <el-button @click="collapsed = !collapsed">
          {{ collapsed ? '展开' : '折叠' }}
        </el-button>
        <div class="spacer" />
        <NuxtLink class="homeLink" to="/">
          返回首页
        </NuxtLink>
      </el-header>
      <el-main class="main">
        <div class="container">
          <slot />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const { public: publicConfig } = useRuntimeConfig()
const siteName = computed(() => publicConfig.siteName || '导航站')
const active = computed(() => {
  if (route.path.startsWith('/admin/include')) return '/admin/include'
  return '/admin/nav'
})

function onSelect(index: string) {
  router.push(index)
}
</script>

<style scoped>
.adminLayout {
  min-height: 100vh;
}

.aside {
  border-right: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.asideTop {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.brand {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color);
}

.spacer {
  flex: 1;
}

.homeLink {
  color: inherit;
  text-decoration: none;
  opacity: 0.9;
}

.main {
  padding: 12px 0;
}

.container{
  max-width: 100%;
}
</style>

