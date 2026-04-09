<template>
  <div class="page">
    <div class="mobileBar">
      <el-button type="primary" plain @click="drawerOpen = true">
        <el-icon><MenuIcon /></el-icon>
        选择分类
      </el-button>
    </div>

    <div>
      <section class="heroSearchArea">
        <div class="searchContent">
          <div class="searchTabs">
            <span 
              v-for="cat in searchCategories" 
              :key="cat.id"
              class="tabItem" 
              :class="{ active: activeSearchTabId === cat.id }"
              @click="activeSearchTabId = cat.id"
            >
              {{ cat.name }}
            </span>
          </div>

          <div class="searchContainer">
            <el-input
              v-model="searchKeyword"
              :placeholder="searchPlaceholder"
              clearable
              class="searchInput"
              @keydown.enter.prevent="submitSearch"
            >
            </el-input>
            <el-button type="success" class="searchButton" @click="submitSearch">
              <el-icon :size="22"><Search /></el-icon>
            </el-button>
          </div>

          <div class="engineTabs">
            <span
              v-for="engine in currentEngines"
              :key="engine.id"
              class="engineItem"
              :class="{ active: activeEngineId === engine.id }"
              @click="activeEngineId = engine.id"
            >
              {{ engine.name }}
            </span>
          </div>
        </div>
      </section>

      <!-- Main Layout -->
      <div class="container mainLayout">
        <el-row :gutter="24">
          <!-- Sidebar: Visible on Desktop -->
          <el-col :xs="24" :sm="4" :md="3" :lg="3" :xl="3" class="mainSidebar">
            <aside class="aside">
              <div class="asideContent">
                <div class="asideHeader">
                  <el-icon><Grid /></el-icon>
                  <span>分类</span>
                </div>
                <el-menu :default-active="String(activeCategoryId)" class="menu" @select="onSelect">
                  <el-menu-item index="0">
                    <el-icon><Collection /></el-icon>
                    <span>全部</span>
                  </el-menu-item>
                  <el-menu-item index="-1">
                    <el-icon><Star /></el-icon>
                    <span>推荐导航</span>
                  </el-menu-item>
                  <el-menu-item v-if="user" index="-2">
                    <el-icon><StarFilled /></el-icon>
                    <span>常用导航</span>
                  </el-menu-item>
                  
                  <template v-for="pc in topLevelCategories" :key="pc.id">
                    <!-- <el-sub-menu v-if="categories.some(c => c.parentId === pc.id)" :index="String(pc.id)">
                      <template #title>
                        <el-icon><Folder /></el-icon>
                        <span>{{ pc.name }}</span>
                      </template>
                      <el-menu-item :index="String(pc.id)">
                        <span>全部 {{ pc.name }}</span>
                      </el-menu-item>
                      <el-menu-item v-for="c in categories.filter(cat => cat.parentId === pc.id)" :key="c.id" :index="String(c.id)">
                        <span>{{ c.name }}</span>
                      </el-menu-item>
                    </el-sub-menu> -->
                    <el-menu-item :index="String(pc.id)">
                      <el-icon><Folder /></el-icon>
                      <span>{{ pc.name }}</span>
                    </el-menu-item>
                  </template>
                </el-menu>
              </div>
            </aside>
          </el-col>

          <!-- Main Content Area -->
          <el-col :xs="24" :sm="20" :md="21" :lg="21" :xl="21" class="mainContentArea">
            <section v-if="activeCategoryId === 0" class="block contentArea">
              <el-row :gutter="20">
                <!-- <div class="sectionTitle">
                  <el-icon><Promotion /></el-icon>
                  <span>公告/广告</span>
                </div> -->
                <el-col v-for="(ad, index) in ads" :key="index" :xs="12" :xl="24 / (ads.length || 1)" :lg="24 / (ads.length || 1)" :md="24 / (ads.length || 1)">
                  <a :href="ad.url" target="_blank" class="adLink">
                    <el-card class="adCard modernCard" shadow="hover">
                      <div class="adBody">
                        <!-- 为首屏广告设置 fetchpriority="high" 优化 LCP -->
                        <img 
                          v-if="index === 0" 
                          :src="ad.imageUrl" 
                          class="adImage" 
                          style="object-fit: cover;" 
                          fetchpriority="high"
                        />
                        <el-image v-else :src="ad.imageUrl" fit="cover" class="adImage" loading="lazy" />
                        <div class="adTitleOverlay">{{ ad.title }}</div>
                      </div>
                    </el-card>
                  </a>
                </el-col>
                <el-col v-if="ads.length === 0" :xs="24" :xl="24" :lg="24" :md="24">
                  <el-card class="adCard modernCard" shadow="hover">
                    <div class="adBody">
                      <div class="adPlaceholder">
                        <el-icon :size="40"><Picture /></el-icon>
                        <p>广告位招租</p>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
              
            </section>

            <!-- 推荐导航 (选中独立分类时) -->
            <section v-if="activeCategoryId === -1 || activeCategoryId === 0" class="block contentArea">
              <div class="sectionTitle">
                <el-icon><Star /></el-icon>
                <span>推荐导航</span>
              </div>
              <el-row :gutter="16">
                <el-col v-for="item in recommendedLinks" :key="item.id" :xs="12" :sm="8" :md="6" class="col-5">
                  <div class="linkCardWrapper" @click="open(item.url, item.id)">
                    <div class="linkCard modernCard" shadow="hover">
                      <div class="linkContent">
                        <div class="linkIcon">
                          <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.title">
                          <div v-else class="iconPlaceholder">{{ item.title[0] }}</div>
                        </div>
                        <div class="linkInfo">
                          <div class="title">{{ item.title }}</div>
                          <div class="desc" :title="item.description">{{ item.description }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
              <el-empty v-if="recommendedLinks.length === 0" description="暂无推荐导航" />
            </section>

            <!-- 常用导航 (选中独立分类时) -->
            <section v-if="(activeCategoryId === -2 || activeCategoryId === 0) && user" class="block contentArea">
              <div class="sectionTitle">
                <el-icon><StarFilled /></el-icon>
                <span>常用导航</span>
              </div>
              <el-row :gutter="16">
                <el-col v-for="item in commonLinks" :key="item.id" :xs="12" :sm="8" :md="6" class="col-5">
                  <div class="linkCardWrapper" @click="open(item.url, item.id)">
                    <div class="linkCard modernCard" shadow="hover">
                      <div class="linkContent">
                        <div class="linkIcon">
                          <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.title">
                          <div v-else class="iconPlaceholder">{{ item.title[0] }}</div>
                        </div>
                        <div class="linkInfo">
                          <div class="title">{{ item.title }}</div>
                          <div class="desc" :title="item.description">{{ item.description }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
              <el-empty v-if="commonLinks.length === 0" description="暂无常用导航" />
            </section>

            <section class="block">
             
              <div class="categorySections">
                <section v-for="c in displayCategories" :key="c.id" class="categorySection">
                  <div class="categoryHeader">
                    <span class="categoryTitle">{{ c.name }}</span>
                    <div v-if="categories.some(cat => cat.parentId === c.id)" class="subCategoryLinks">
                      <span 
                        v-for="(sub, sIdx) in categories.filter(cat => cat.parentId === c.id)" 
                        :key="sub.id" 
                        class="subCategoryLink"
                        :class="{ active: activeCategoryId === sub.id || (activeCategoryId === 0 && sIdx === 0) || (activeCategoryId === c.id && sIdx === 0) }"
                        @click="onSelect(String(sub.id))"
                      >
                        {{ sub.name }}
                      </span>
                    </div>
                  </div>
                  <el-row :gutter="16">
                    <el-col
                      v-for="item in (activeCategoryId === c.id || !categories.some(cat => cat.id === activeCategoryId && cat.parentId === c.id)) ? getCategoryLinks(c.id) : (linksByCategory.get(activeCategoryId) || [])"
                      :key="item.id"
                      :xs="12" :sm="8" :md="6"
                      class="col-5"
                    >
                      <div class="linkCardWrapper" @click="open(item.url, item.id)">
                        <div class="linkCard modernCard" shadow="hover">
                          <div class="linkContent">
                            <div class="linkIcon">
                              <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.title">
                              <div v-else class="iconPlaceholder">{{ item.title[0] }}</div>
                            </div>
                            <div class="linkInfo">
                              <div class="title">{{ item.title }}</div>
                              <div class="desc" :title="item.description">{{ item.description }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                  <el-empty v-if="((activeCategoryId === c.id || !categories.some(cat => cat.id === activeCategoryId && cat.parentId === c.id)) ? getCategoryLinks(c.id) : (linksByCategory.get(activeCategoryId) || [])).length === 0" description="暂无数据" />
                </section>
              </div>
            </section>
          </el-col>
        </el-row>
      </div>
    </div>


    
    <el-drawer v-model="drawerOpen" title="选择分类" size="280px" direction="ltr">
      <el-menu :default-active="String(activeCategoryId)" class="menu" @select="onSelect">
        <el-menu-item index="0">
          <el-icon><Collection /></el-icon>
          <span>全部</span>
        </el-menu-item>
        <el-menu-item index="-1">
          <el-icon><Star /></el-icon>
          <span>推荐导航</span>
        </el-menu-item>
        <el-menu-item v-if="user" index="-2">
          <el-icon><StarFilled /></el-icon>
          <span>常用导航</span>
        </el-menu-item>
        
        <template v-for="pc in topLevelCategories" :key="pc.id">
          <el-sub-menu v-if="categories.some(c => c.parentId === pc.id)" :index="String(pc.id)">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>{{ pc.name }}</span>
            </template>
            <el-menu-item :index="String(pc.id)">
              <span>全部 {{ pc.name }}</span>
            </el-menu-item>
            <el-menu-item v-for="c in categories.filter(cat => cat.parentId === pc.id)" :key="c.id" :index="String(c.id)">
              <span>{{ c.name }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="String(pc.id)">
            <el-icon><Folder /></el-icon>
            <span>{{ pc.name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-drawer>
  </div>

</template>

<script setup lang="ts">
import {
  Menu as MenuIcon,
  Collection,
  Folder,
  Search,
  Picture,
  Star,
  StarFilled,
  Grid,
} from '@element-plus/icons-vue'

type Category = { id: number; parentId: number | null; name: string; slug: string; sort: number }
type NavLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
  isRecommended: boolean
  sort: number
}

const { public: publicConfig } = useRuntimeConfig()

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

const { data: initialData } = await useAsyncData('home-initial-data', async () => {
  const [
    categories,
    links,
    recommended,
    ads,
    userRes,
    searchCategories
  ] = await Promise.all([
    $fetch<Category[]>('/api/categories'),
    $fetch<NavLink[]>('/api/links', { params: { limit: 2000 } }),
    $fetch<{ links: NavLink[] }>('/api/links/recommended'),
    $fetch<{ ads: { title: string, imageUrl: string, url: string }[] }>('/api/ads'),
    $fetch<{ user: { id: number; username: string; role: string } | null }>('/api/auth/me'),
    $fetch<SearchCategory[]>('/api/search-categories')
  ])
  return {
    categories,
    links,
    recommended,
    ads,
    user: userRes.user,
    searchCategories
  }
})

const categories = computed(() => initialData.value?.categories || [])
const topLevelCategories = computed(() => categories.value.filter(c => !c.parentId))

const route = useRoute()
const activeCategoryId = ref(Number(route.query.categoryId) || 0)

// Sync activeCategoryId with route query
watch(() => route.query.categoryId, (newId) => {
  activeCategoryId.value = Number(newId) || 0
})

const allLinks = computed(() => initialData.value?.links || [])
const recommendedLinks = computed(() => initialData.value?.recommended?.links || [])

const linksByCategory = computed(() => {
  const map = new Map<number, NavLink[]>()
  for (const link of allLinks.value) {
    if (link.categoryId == null) continue
    const id = link.categoryId
    const arr = map.get(id) || []
    arr.push(link)
    map.set(id, arr)
  }
  return map
})

const displayCategories = computed(() => {
  if (activeCategoryId.value === 0) {
    return topLevelCategories.value
  }
  const selected = categories.value.find(c => c.id === activeCategoryId.value)
  if (!selected) return []
  
  if (!selected.parentId) {
    // Selected a top level category
    return [selected]
  } else {
    const parent = categories.value.find(c => c.id === selected.parentId)
    return parent ? [parent] : [selected]
  }
})

function getCategoryLinks(catId: number) {
  const cat = categories.value.find(c => c.id === catId)
  if (!cat) return []
  
  // Get direct links of this category
  const directLinks = linksByCategory.value.get(cat.id) || []
  
  // If it's a top level category, aggregate all its children's links
  const children = categories.value.filter(c => c.parentId === cat.id)
  if (children.length > 0) {
    const allChildLinks: NavLink[] = [...directLinks]
    for (const child of children) {
      allChildLinks.push(...(linksByCategory.value.get(child.id) || []))
    }
    // Return unique links by ID (in case some links are in both parent and child, though unlikely in typical DB structure)
    const uniqueMap = new Map<number, NavLink>()
    allChildLinks.forEach(l => uniqueMap.set(l.id, l))
    return Array.from(uniqueMap.values()).sort((a, b) => (a.sort - b.sort) || (b.id - a.id))
  }
  
  return directLinks
}

const ads = computed(() => initialData.value?.ads?.ads || [])

function onSelect(index: string) {
  drawerOpen.value = false
  const id = Number(index)
  
  const children = categories.value.filter(c => c.parentId === id)
  if (children.length > 0) {
    activeCategoryId.value = children[0].id
  } else {
    activeCategoryId.value = id
  }
  
  const query = activeCategoryId.value !== 0 ? { categoryId: String(activeCategoryId.value) } : {}
  navigateTo({ path: '/', query }, { replace: true })
}

// 统计埋点记录，带简易防抖
const lastStatsRecord = new Map<string, number>()
async function recordStats(type: 'engine' | 'link', id: number) {
  const key = `${type}_${id}`
  const now = Date.now()
  const lastTime = lastStatsRecord.get(key) || 0
  
  // 1秒内重复点击同一项不计入统计
  if (now - lastTime < 1000) return
  
  lastStatsRecord.set(key, now)
  try {
    await $fetch('/api/stats/record', {
      method: 'POST',
      body: { type, id }
    })
  } catch {
    lastStatsRecord.delete(key)
  }
}

function open(url: string, linkId?: number) {
  if (!url) return
  
  if (linkId) {
    recordStats('link', linkId)
  }

  navigateTo(url, { external: true, open: { target: '_blank' } })
}

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

// 搜索管理动态数据
interface SearchEngine {
  id: number
  categoryId: number
  name: string
  url: string
  iconUrl: string
  isDefault: boolean
}

interface SearchCategory {
  id: number
  name: string
  engines: SearchEngine[]
}

const user = computed(() => initialData.value?.user || null)

// 常用导航
const { data: commonLinksData } = useFetch<{ links: NavLink[] }>('/api/stats/common-links', { 
  server: true,
  watch: [user]
})
const commonLinks = computed(() => commonLinksData.value?.links || [])

const { data: commonEnginesData } = useFetch<{ engines: SearchEngine[] }>('/api/stats/common-engines', { 
  server: true,
  watch: [user]
})

const searchCategoriesData = computed(() => initialData.value?.searchCategories || [])

const searchCategories = computed(() => {
  const categories = [...(searchCategoriesData.value || [])]
  
  // 如果已登录且有常用引擎，则在最前面插入【常用】栏
  if (user.value && commonEnginesData.value?.engines && commonEnginesData.value.engines.length > 0) {
    const commonCategory: SearchCategory = {
      id: -1, // 使用一个特殊 ID 表示“常用”
      name: '常用',
      engines: commonEnginesData.value.engines
    }
    categories.unshift(commonCategory)
  }
  
  return categories
})

const activeSearchTabId = ref<number | null>(null)
const activeEngineId = ref<number | null>(null)
const searchKeyword = ref('')

// 本地存储的 Key
const CACHE_KEY_TAB = 'search_tab_id'
const CACHE_KEY_ENGINE_PREFIX = 'search_engine_id_'

// 初始化默认选中的分类和引擎
watch(searchCategories, (newVal: SearchCategory[]) => {
  if (newVal && newVal.length > 0) {
    const isValid = activeSearchTabId.value !== null && newVal.some(c => c.id === activeSearchTabId.value)
    
    if (!isValid) {
      if (import.meta.client) {
        const cachedTabId = localStorage.getItem(CACHE_KEY_TAB)
        if (cachedTabId && newVal.some(c => c.id === Number(cachedTabId))) {
          activeSearchTabId.value = Number(cachedTabId)
        } else {
          activeSearchTabId.value = newVal[0]?.id || null
        }
      } else {
        activeSearchTabId.value = newVal[0]?.id || null
      }
    }
    
    const engines = newVal.find(c => c.id === activeSearchTabId.value)?.engines || []
    if (engines.length > 0) {
      const isValidEngine = activeEngineId.value !== null && engines.some(e => e.id === activeEngineId.value)
      if (!isValidEngine) {
        if (import.meta.client) {
          const cachedEngineId = localStorage.getItem(CACHE_KEY_ENGINE_PREFIX + activeSearchTabId.value)
          if (cachedEngineId && engines.some(e => e.id === Number(cachedEngineId))) {
            activeEngineId.value = Number(cachedEngineId)
          } else {
            const defaultEngine = engines.find(e => e.isDefault) || engines[0]
            if (defaultEngine) {
              activeEngineId.value = defaultEngine.id
            }
          }
        } else {
          const defaultEngine = engines.find(e => e.isDefault) || engines[0]
          if (defaultEngine) {
            activeEngineId.value = defaultEngine.id
          }
        }
      }
    }
  }
}, { immediate: true })

const currentEngines = computed(() => {
  const cat = searchCategories.value.find(c => c.id === activeSearchTabId.value)
  return cat?.engines || []
})

watch(activeSearchTabId, (newTabId) => {
  if (newTabId !== null && import.meta.client) {
    localStorage.setItem(CACHE_KEY_TAB, String(newTabId))
    
    const cachedEngineId = localStorage.getItem(CACHE_KEY_ENGINE_PREFIX + newTabId)
    const engines = searchCategories.value.find(c => c.id === newTabId)?.engines || []
    
    if (cachedEngineId && engines.some(e => e.id === Number(cachedEngineId))) {
      activeEngineId.value = Number(cachedEngineId)
    } else {
      const defaultEngine = engines.find(e => e.isDefault) || engines[0]
      activeEngineId.value = defaultEngine?.id || null
    }
  }
})

watch(activeEngineId, (newEngineId) => {
  if (newEngineId !== null && activeSearchTabId.value !== null && import.meta.client) {
    localStorage.setItem(CACHE_KEY_ENGINE_PREFIX + activeSearchTabId.value, String(newEngineId))
  }
})

const activeEngine = computed(() => {
  return currentEngines.value.find(e => e.id === activeEngineId.value)
})

const searchPlaceholder = computed(() => {
  if (activeEngine.value) {
    return `在 ${activeEngine.value.name} 中搜索...`
  }
  return '搜索你想要的...'
})

function submitSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw || !activeEngine.value) return
  
  // 记录搜索统计 (防抖)
  recordStats('engine', activeEngine.value.id)

  let url = activeEngine.value.url
  if (url.includes('%s')) {
    url = url.replace('%s', encodeURIComponent(kw))
  } else {
    // 如果没有占位符，尝试拼接到末尾（虽然不推荐，但作为兜底）
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}q=${encodeURIComponent(kw)}`
  }
  open(url)
}
</script>

<style scoped lang="less">
.page {
  min-height: calc(100vh - 60px);
  background-color: #f6f8fa;
  padding: 0;
}



.mainLayout {
  margin-bottom: 40px;
  padding-top: 20px;
}
.mainSidebar {
  align-self: flex-start;
  position: sticky !important;
  top: 75px;
  height: fit-content;
  z-index: 100;

  .aside {
    background-color: rgba(255, 255, 255, 0.55);
    box-shadow: 0 0 3px 0 #2930421a;
    backdrop-filter: blur(10px);
    transition: all 0.3s;
    border-radius: 6px;
  }
}
.mainContentArea {
  
  padding: 0px !important;
}

.mainContentArea .block:last-child {
  margin-bottom: 0;
}

.asideContent {
  padding: 0 16px 16px;
}

.asideHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
  padding: 10px 0 8px;
  border-bottom: 1px solid #f1f2f4;
  margin-bottom: 6px;
}

.menu {
  border-right: none;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  height: 25px;
  line-height: 25px;
  border-radius: 8px;
  margin-bottom: 4px;
  color: #57606a;
  padding: 0 !important;
}
.menu :deep(.el-menu-item [class^=el-icon]) {
  font-size: 15px;
  margin-right: 4px;
  width: auto;
}
.menu :deep(.el-menu-item.is-active) {
  background-color: #eaf2ff;
  color: #0969da;
  font-weight: 600;
}

.menu :deep(.el-menu-item:hover) {
  background-color: #f3f4f6;
}

.main {
  padding: 0;
}

.mobileBar {
  display: none;
  padding: 16px 16px 0;
}

.heroSearchArea {
  background-color: #000;
  padding: 60px 20px 80px;
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.searchContent {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.searchTabs {
  display: flex;
  gap: 36px;
  margin-bottom: 28px;
}

.tabItem {
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  padding-bottom: 6px;
  position: relative;
  font-weight: 500;
}

.tabItem:hover {
  color: rgba(255, 255, 255, 0.85);
}

.tabItem.active {
  color: #fff;
  font-weight: 600;
}

.tabItem.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: #28c76f;
  border-radius: 2px;
}

.searchContainer {
  width: 100%;
  display: flex;
  background: #fff;
  padding: 4px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.searchInput {
  flex: 1;
}

.searchInput :deep(.el-input__wrapper) {
  box-shadow: none !important;
  height: 44px;
  padding: 0 20px;
  border-radius: 0;
}

.searchInput :deep(.el-input__inner) {
  font-size: 18px;
  color: #24292e;
}

.searchButton {
  border-radius: 8px;
  padding: 0 28px;
  height: 44px;
  border: none;
  background-color: #28c76f !important;
  transition: all 0.2s;
}

.searchButton:hover {
  opacity: 0.9;
  transform: scale(0.98);
}

.engineTabs {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  justify-content: center;
}

.engineItem {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 4px 8px;
}

.engineItem:hover {
  color: rgba(255, 255, 255, 0.7);
}

.engineItem.active {
  color: #fff;
  font-weight: 600;
}

.engineItem.active::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #fff;
}

.contentArea {
  background-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 3px 0 #2930421a;
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 12px;
}

@media (min-width: 1200px) {
  .col-5 {
    flex: 0 0 20%;
    max-width: 20%;
  }
}

.block {
  margin-bottom: 18px;
}

.sectionTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #24292e;
  margin-bottom: 20px;
}

.modernCard {
  border: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.modernCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
}

.adCard {
  height: 200px;
  background: #fff;
}

.adBody {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f8fa;
  position: relative;
  overflow: hidden;
}

.adImage {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.adCard:hover .adImage {
  transform: scale(1.05);
}

.adTitleOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 8px;
  font-size: 12px;
  text-align: center;
  backdrop-filter: blur(2px);
}

.adLink {
  text-decoration: none;
}

.adPlaceholder {
  text-align: center;
  color: #909399;
}

.adPlaceholder p {
  margin-top: 8px;
  font-size: 14px;
}

.linkCardWrapper {
  cursor: pointer;
  margin-bottom: 16px;
}

.linkCard {
  background: #fff;
  box-shadow: 0px 0px 20px -5px rgba(158, 158, 158, .2);
}

.linkContent {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
}

.linkIcon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: #f6f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.linkIcon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.iconPlaceholder {
  font-size: 18px;
  font-weight: 800;
  color: #0969da;
  text-transform: uppercase;
}

.linkInfo {
  flex: 1;
  min-width: 0;
}

.linkInfo .title {
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linkInfo .desc {
  font-size: 12px;
  color: #57606a;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.mt20 {
  margin-top: 20px;
}

.linkIcon.small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.linkInfo .title.small {
  font-size: 13px;
  font-weight: 500;
}

.categorySection {
  margin-bottom: 18px;
  background-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 3px 0 #2930421a;
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 12px;
}

.categoryHeader {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f2f4;
  padding-bottom: 12px;
}

.categoryTitle {
  font-size: 18px;
  font-weight: 700;
  color: #24292e;
  position: relative;
}

.subCategoryLinks {
  display: flex;
  gap: 16px;
  align-items: center;
}

.subCategoryLink {
  font-size: 14px;
  color: #57606a;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
}

.subCategoryLink:hover {
  color: #0969da;
}

.subCategoryLink.active {
  color: #0969da;
  font-weight: 600;
  border-bottom-color: #0969da;
}

.activeCategoryTitle {
  font-size: 18px;
  color: #57606a;
}

@media (max-width: 1024px) {
  .aside {
    // width: 200px;
  }
}

@media (max-width: 768px) {
  .aside {
    display: none;
  }
  .main {
    padding: 0;
  }
  .mobileBar {
    display: block;
  }
  .heroSearchArea {
    padding: 30px 16px 40px;
  }
  .searchTabs {
    gap: 12px;
    overflow-x: auto;
    width: 100%;
    padding-bottom: 8px;
  }
  .tabItem {
    flex-shrink: 0;
    font-size: 14px;
  }
  .engineTabs {
    gap: 12px;
    flex-wrap: wrap;
  }
}
</style>
