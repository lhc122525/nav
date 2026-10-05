<template>
  <el-container class="adminLayout">
    <el-aside :width="collapsed ? '64px' : '221px'" class="aside">
      <div class="asideTop" :class="{ isCollapsed: collapsed }" @click="collapsed = !collapsed">
        <img
          v-if="!collapsed"
          src="/assets/logo2.png"
          alt="Logo"
          class="logoFull"
        />
        <img
          v-else
          src="/assets/logo.png"
          alt="Logo"
          class="logoSmall"
        />
      </div>
      <el-scrollbar style="flex:2">
        <el-menu
          :default-active="active"
          :collapse="collapsed"
          :collapse-transition="false"
          @select="onSelect"
          class="adminMenu"
        >
          <el-menu-item index="/admin/nav">
            <el-icon><Menu /></el-icon>
            <template #title>导航管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/search">
            <el-icon><Search /></el-icon>
            <template #title>搜索管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/stats">
            <el-icon><PieChart /></el-icon>
            <template #title>统计分析</template>
          </el-menu-item>
          <el-menu-item index="/admin/include">
            <el-icon><Document /></el-icon>
            <template #title>收录管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/ads">
            <el-icon><Picture /></el-icon>
            <template #title>广告管理</template>
          </el-menu-item>
          <el-menu-item index="/admin/share">
            <el-icon><Share /></el-icon>
            <template #title>分享资源</template>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header height="56px" class="header">
        <el-button link class="collapseBtn" @click="collapsed = !collapsed">
          <el-icon v-if="collapsed"><Expand /></el-icon>
          <el-icon v-else><Fold /></el-icon>
        </el-button>
        <NuxtLink class="homeLink" to="/">
          <el-button link>返回首页</el-button>
        </NuxtLink>
        <div class="spacer" />
        <el-button link class="logoutBtn" @click="logout">退出</el-button>
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
import { Menu, Document, Expand, Fold, Search, PieChart, Picture, Share } from '@element-plus/icons-vue'
const collapsed = ref(false)
const route = useRoute()
const router = useRouter()

const active = computed(() => {
  if (route.path.startsWith('/admin/include')) return '/admin/include'
  if (route.path.startsWith('/admin/search')) return '/admin/search'
  if (route.path.startsWith('/admin/stats')) return '/admin/stats'
  if (route.path.startsWith('/admin/ads')) return '/admin/ads'
  if (route.path.startsWith('/admin/share')) return '/admin/share'
  return '/admin/nav'
})

// 退出登录
const logout = async () => {
  await $fetch('/api/admin/auth/logout', { method: 'POST' })
  router.push('/admin/login')
}



function onSelect(index: string) {
  router.push(index)
}
</script>

<style scoped>
.adminLayout {
  height: 100vh;
  overflow: auto;
  background-color: #f5f7fa;
}

.aside {
  border-right: 1px solid var(--el-border-color-light);
  background: #fff;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-x: hidden;
}

.asideTop {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  overflow: hidden;
  background: #fff;
}

.logoFull {
  height: 40px;
  max-width: 100%;
  object-fit: contain;
}

.logoSmall {
  height: 32px;
  width: 32px;
  object-fit: contain;
}

.adminMenu {
  border-right: none;
}

.adminMenu:not(.el-menu--collapse) {
  width: 220px;
}

.header {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
}

.collapseBtn {
  font-size: 20px;
  padding: 0;
  height: 32px;
  width: 32px;
}

.spacer {
  flex: 1;
}

.homeLink {
  color: var(--el-text-color-regular);
  text-decoration: none;
}

.main {
  padding: 10px;
  background-color: #f5f7fa;
}

.container {
  max-width: 100%;
  padding: 0;
  margin: 0 auto;
  height: 100%;
}
</style>

