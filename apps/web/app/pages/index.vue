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

      <template v-if="activeCategoryId === 0">
        <section>
          <el-card class="heroCard" shadow="never">
            <div class="hero">
              <div class="heroTime">
                {{ nowTimeText }}
              </div>
              <div class="heroDate">
                {{ nowDateText }}
              </div>
            </div>
          </el-card>
        </section>

        <section class="block">
          <el-card shadow="never">
            <template #header>
              <div class="cardHeader">
                <span>搜索</span>
              </div>
            </template>

            <div class="searchRow">
              <el-select v-model="searchEngine" style="width: 140px">
                <el-option label="百度" value="baidu" />
                <el-option label="必应" value="bing" />
                <el-option label="谷歌" value="google" />
              </el-select>
              <el-input
                v-model="searchKeyword"
                placeholder="输入关键词"
                clearable
                @keydown.enter.prevent="submitSearch"
              />
              <el-button type="primary" @click="submitSearch">
                搜索
              </el-button>
            </div>
          </el-card>
        </section>

        <section class="block">
          <el-row :gutter="12">
            <el-col :xs="24" :md="8" :lg="7">
              <el-card class="adCard" shadow="never">
                <template #header>
                  <div class="cardHeader">
                    <span>广告位</span>
                  </div>
                </template>
                <div class="adBody">
                  广告位
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :md="16" :lg="17">
              <el-card shadow="never">
                <template #header>
                  <div class="cardHeader">
                    <span>推荐导航</span>
                  </div>
                </template>

                <el-row :gutter="12">
                  <el-col v-for="item in recommendedLinks" :key="item.id" :xs="24" :sm="12" :md="8">
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
                <el-empty v-if="recommendedLinks.length === 0" description="暂无推荐导航" />
              </el-card>
            </el-col>
          </el-row>
        </section>

        <section class="block">
          <el-card shadow="never">
            <template #header>
              <div class="cardHeader">
                <span>全部分类</span>
              </div>
            </template>

            <div class="categorySections">
              <section v-for="c in categories" :key="c.id" class="categorySection">
                <div class="categoryTitle">
                  {{ c.name }}
                </div>
                <el-row :gutter="12">
                  <el-col
                    v-for="item in linksByCategory.get(c.id) || []"
                    :key="item.id"
                    :xs="24"
                    :sm="12"
                    :md="8"
                  >
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
                <el-empty v-if="(linksByCategory.get(c.id) || []).length === 0" description="暂无数据" />
              </section>
            </div>
          </el-card>
        </section>
      </template>

      <template v-else>
        <el-card shadow="never">
          <template #header>
            <div class="cardHeader">
              <span>{{ activeCategoryName }}</span>
            </div>
          </template>

          <el-row :gutter="12">
            <el-col v-for="item in categoryLinks" :key="item.id" :xs="24" :sm="12" :md="8">
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
          <el-empty v-if="categoryLinks.length === 0" description="暂无数据" />
        </el-card>
      </template>
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

const nowTimeText = computed(() => {
  const d = now.value
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})
const nowDateText = computed(() => {
  const d = now.value
  const date = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(d)
  return `${date} ${weekday}`
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

function submitSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  open(getSearchUrl(searchEngine.value || 'baidu', kw))
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

.block {
  margin-top: 12px;
}

.heroCard {
  border: 0;
  background: linear-gradient(135deg, rgba(32, 128, 240, 0.18), rgba(255, 120, 180, 0.14));
}

.hero {
  padding: 22px 12px;
  text-align: center;
}

.heroTime {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 1px;
}

.heroDate {
  margin-top: 6px;
  opacity: 0.8;
}

.searchRow {
  display: flex;
  gap: 12px;
  align-items: center;
}

.adCard {
  height: 100%;
}

.adBody {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.categorySections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.categorySection {
  scroll-margin-top: 72px;
}

.categoryTitle {
  font-weight: 700;
  margin: 4px 0 12px;
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
  .searchRow {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
