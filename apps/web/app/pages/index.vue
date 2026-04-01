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
              v-for="tab in ['站内', '搜索', '网盘', '社区', '生活', '求职']" 
              :key="tab"
              class="tabItem" 
              :class="{ active: activeSearchTab === tab }"
              @click="activeSearchTab = tab"
            >
              {{ tab }}
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
              v-for="engine in engines"
              :key="engine.value"
              class="engineItem"
              :class="{ active: searchEngine === engine.value }"
              @click="searchEngine = engine.value"
            >
              {{ engine.label }}
            </span>
          </div>
        </div>
      </section>

      <!-- Main Layout -->
      <div class="container mainLayout">
        <el-row :gutter="24">
          <!-- Sidebar: Visible on Desktop -->
          <el-col :md="6" :lg="5" class="mainSidebar">
            <aside class="aside">
              <div class="asideContent">
                <div class="asideHeader">
                  <el-icon><Grid /></el-icon>
                  <span>分类导航</span>
                </div>
                <el-menu :default-active="String(activeCategoryId)" class="menu" @select="onSelect">
                  <el-menu-item index="0">
                    <el-icon><Collection /></el-icon>
                    <span>全部</span>
                  </el-menu-item>
                  <el-menu-item v-for="c in categories" :key="c.id" :index="String(c.id)">
                    <el-icon><Folder /></el-icon>
                    <span>{{ c.name }}</span>
                  </el-menu-item>
                </el-menu>
              </div>
            </aside>
          </el-col>

          <!-- Main Content Area -->
          <el-col :xs="24" :md="18" :lg="19" class="mainContentArea">
            <section class="block contentArea" v-if="activeCategoryId === 0">
              <el-row :gutter="20">
                <el-col :xs="24" :xl="8" :lg="8" :md="24">
                  <div class="sectionTitle">
                    <el-icon><Promotion /></el-icon>
                    <span>公告/广告</span>
                  </div>
                  <el-card class="adCard modernCard" shadow="hover">
                    <div class="adBody">
                      <div class="adPlaceholder">
                        <el-icon :size="40"><Picture /></el-icon>
                        <p>广告位</p>
                      </div>
                    </div>
                  </el-card>
                </el-col>

                <el-col :xs="24" :xl="16" :lg="16" :md="24">
                  <div class="sectionTitle">
                    <el-icon><Star /></el-icon>
                    <span>推荐导航</span>
                  </div>
                  <el-row :gutter="16">
                    <el-col v-for="item in recommendedLinks" :key="item.id" :xs="24" :sm="12" :md="12" :lg="8" :xl="6">
                      <div class="linkCardWrapper" @click="open(item.url)">
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
                </el-col>
              </el-row>
            </section>

            <section class="block">
             
              <div class="categorySections">
                <section v-for="c in categories.filter(cat => activeCategoryId === 0 || cat.id === activeCategoryId)" :key="c.id" class="categorySection">
                  <div class="categoryHeader">
                    <span class="categoryTitle">{{ c.name }}</span>
                    <el-button link type="primary" @click="onSelect(String(c.id))">更多 <el-icon><ArrowRight /></el-icon></el-button>
                  </div>
                  <el-row :gutter="16">
                    <el-col
                      v-for="item in linksByCategory.get(c.id) || []"
                      :key="item.id"
                      :xs="24"
                      :sm="12"
                      :md="12"
                      :lg="8"
                      :xl="6"
                    >
                      <div class="linkCardWrapper" @click="open(item.url)">
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
                  <el-empty v-if="(linksByCategory.get(c.id) || []).length === 0" description="暂无数据" />
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
        <el-menu-item v-for="c in categories" :key="c.id" :index="String(c.id)">
          <el-icon><Folder /></el-icon>
          <span>{{ c.name }}</span>
        </el-menu-item>
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
  Promotion,
  Picture,
  Star,
  Grid,
  ArrowRight,
  ArrowLeft
} from '@element-plus/icons-vue'

const activeSearchTab = ref('搜索')

type Category = { id: number; name: string; slug: string; sort: number }
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

const { data: categoriesData } = await useFetch<Category[]>('/api/categories', { server: true })
const categories = computed(() => categoriesData.value || [])

const route = useRoute()
const activeCategoryId = ref(Number(route.query.categoryId) || 0)

const activeCategoryName = computed(() => {
  if (activeCategoryId.value === 0) return '全部'
  const hit = categories.value.find((c) => c.id === activeCategoryId.value)
  return hit?.name || '分类'
})

const { data: linksData } = await useFetch<NavLink[]>('/api/links', { params: { limit: 500 }, server: true })
const allLinks = computed(() => linksData.value || [])

const { data: recommendedData } = await useFetch<NavLink[]>('/api/links', {
  params: { limit: 12, recommended: 1 },
  server: true
})
const recommendedLinks = computed(() => recommendedData.value || [])

const categoryLinks = computed(() => {
  if (activeCategoryId.value <= 0) return []
  return allLinks.value.filter((l) => l.categoryId === activeCategoryId.value)
})

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

function onSelect(index: string) {
  drawerOpen.value = false
  const id = Number(index)
  activeCategoryId.value = (Number.isFinite(id) && id > 0) ? id : 0
  
  // Update URL query without full navigation
  const query = activeCategoryId.value > 0 ? { categoryId: String(activeCategoryId.value) } : {}
  navigateTo({ path: '/', query }, { replace: true })
}

function open(url: string) {
  if (!url) return
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

type SearchEngine = 'baidu' | 'bing' | 'google'
const searchEngine = useCookie<SearchEngine>('navigation_search_engine', { default: () => 'baidu' })
const searchKeyword = ref('')

function getSearchUrl(engine: SearchEngine, keyword: string) {
  const q = encodeURIComponent(keyword.trim())
  if (engine === 'bing') return `https://www.bing.com/search?q=${q}`
  if (engine === 'google') return `https://www.google.com/search?q=${q}`
  return `https://www.baidu.com/s?wd=${q}`
}

const engines = [
  { label: '百度', value: 'baidu' },
  { label: 'Google', value: 'google' },
  { label: 'Bing', value: 'bing' }
]

const searchPlaceholder = computed(() => {
  if (searchEngine.value === 'baidu') return '百度一下'
  if (searchEngine.value === 'google') return 'Google 搜索'
  return '搜索你想要的...'
})

function submitSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  open(getSearchUrl(searchEngine.value || 'baidu', kw))
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
.mainSidebar{
    position: sticky;
    top: 75px;
    align-self: flex-start;
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
  padding: 16px 0 12px;
  border-bottom: 1px solid #f1f2f4;
  margin-bottom: 8px;
}

.menu {
  border-right: none;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  height: 40px;
  line-height: 40px;
  border-radius: 8px;
  margin-bottom: 4px;
  color: #57606a;
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
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.categorySection {
  margin-bottom: 18px;
  background-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 3px 0 #2930421a;
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 12px;
;
}

.categoryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f2f4;
}

.categoryTitle {
  font-size: 15px;
  font-weight: 700;
  color: #24292e;
}

.activeCategoryTitle {
  font-size: 18px;
  color: #57606a;
}

@media (max-width: 1024px) {
  .aside {
    width: 200px;
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
