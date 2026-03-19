<template>
  <el-container class="page">
    <el-aside class="aside">
      <div class="asideHeader">
        分类
      </div>
      <el-menu :default-active="String(activeCategoryId)" class="menu" @select="onSelect">
        <el-menu-item index="0">
          全部
        </el-menu-item>
        <el-menu-item v-for="c in categories" :key="c.id" :index="String(c.id)">
          {{ c.name }}
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-main class="main">
      <div class="mobileBar">
        <el-button @click="drawerOpen = true">
          选择分类
        </el-button>
      </div>

      <el-card shadow="never">
        <template #header>
          <div class="cardHeader">
            <span>{{ activeCategoryName }}</span>
          </div>
        </template>

        <el-row :gutter="12">
          <el-col v-for="item in links" :key="item.id" :xs="24" :sm="12" :md="8">
            <el-card class="linkCard" shadow="hover" @click="open(item.url)">
              <div class="title">
                {{ item.title }}
              </div>
              <div class="desc">
                {{ item.description }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </el-main>

    <el-drawer v-model="drawerOpen" title="选择分类" size="70%">
      <el-menu :default-active="String(activeCategoryId)" @select="onSelect">
        <el-menu-item index="0">
          全部
        </el-menu-item>
        <el-menu-item v-for="c in categories" :key="c.id" :index="String(c.id)">
          {{ c.name }}
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
type Category = { id: number; name: string; slug: string; sort: number }
type NavLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
  sort: number
}

const { public: publicConfig } = useRuntimeConfig()
const route = useRoute()

const drawerOpen = ref(false)

useHead(() => ({
  title: `${publicConfig.siteName || '导航站'} - 首页`,
  meta: [
    {
      name: 'description',
      content: '一个支持 SSR 与 SEO 的导航网站。'
    }
  ]
}))

const { data: categoriesData } = await useFetch<Category[]>('/api/categories', { server: true })
const categories = computed(() => categoriesData.value || [])

const activeCategoryId = computed(() => {
  const raw = route.query.categoryId
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
})

const activeCategoryName = computed(() => {
  if (activeCategoryId.value === 0) return '全部'
  const hit = categories.value.find((c) => c.id === activeCategoryId.value)
  return hit?.name || '分类'
})

const { data: linksData } = await useAsyncData(
  () => `links-${activeCategoryId.value}`,
  async () => {
    const params: Record<string, number> = { limit: 500 }
    if (activeCategoryId.value > 0) params.categoryId = activeCategoryId.value
    return await $fetch<NavLink[]>('/api/links', { params })
  },
  { watch: [activeCategoryId] }
)

const links = computed(() => linksData.value || [])

function onSelect(index: string) {
  drawerOpen.value = false
  const id = Number(index)
  if (!Number.isFinite(id) || id <= 0) {
    navigateTo({ path: '/', query: {} })
    return
  }
  navigateTo({ path: '/', query: { categoryId: String(id) } })
}

function open(url: string) {
  if (!url) return
  navigateTo(url, { external: true, open: { target: '_blank' } })
}
</script>

<style scoped>
.page {
  min-height: calc(100vh - 56px);
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.aside {
  width: 240px;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 12px;
}

.asideHeader {
  font-weight: 600;
  margin: 6px 0 10px;
}

.menu {
  border-right: 0;
}

.main {
  padding-left: 12px;
}

.mobileBar {
  display: none;
  margin-bottom: 12px;
}

.linkCard {
  cursor: pointer;
  margin-bottom: 12px;
}

.title {
  font-weight: 600;
}

.desc {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .aside {
    display: none;
  }
  .main {
    padding-left: 0;
  }
  .mobileBar {
    display: block;
  }
}
</style>
