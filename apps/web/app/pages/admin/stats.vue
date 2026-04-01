<template>
  <div class="statsPage">
      <el-row :gutter="20">
        <el-col :span="6" v-for="item in summaryCards" :key="item.label">
          <el-card shadow="never" class="summaryCard">
            <div class="summaryLabel">{{ item.label }}</div>
            <div class="summaryValue">{{ item.value }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt20">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <div class="cardHeader">
                <span>搜索引擎使用排行 (Top 10)</span>
              </div>
            </template>
            <el-table :data="statsData?.topEngines || []" style="width: 100%">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="名称" min-width="120">
                <template #default="{ row }">
                  <div class="engineInfo">
                    <el-image v-if="row.icon_url" :src="row.icon_url" class="engineIcon" />
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="total_count" label="使用次数" width="100" align="right" />
              <el-table-column label="占比" min-width="150">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="calculatePercentage(row.total_count, totalSearchCount)" 
                    :stroke-width="10"
                    status="success"
                  />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <div class="cardHeader">
                <span>导航链接点击排行 (Top 10)</span>
              </div>
            </template>
            <el-table :data="statsData?.topLinks || []" style="width: 100%">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="标题" min-width="150">
                <template #default="{ row }">
                  <div class="linkInfo">
                    <el-image v-if="row.icon_url" :src="row.icon_url" class="linkIcon" />
                    <span>{{ row.title }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="total_count" label="点击次数" width="100" align="right" />
              <el-table-column label="占比" min-width="150">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="calculatePercentage(row.total_count, totalLinkCount)" 
                    :stroke-width="10"
                    status="warning"
                  />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt20">
        <el-col :span="24">
          <el-card shadow="never">
            <template #header>
              <div class="cardHeader">
                <span>用户活跃分析</span>
              </div>
            </template>
            <div class="userStatsContainer">
              <div class="userStatsBox">
                <h3>搜索行为</h3>
                <el-progress 
                  type="dashboard" 
                  :percentage="userSearchPercentage" 
                  status="success"
                >
                  <template #default="{ percentage }">
                    <span class="percentage-value">{{ percentage }}%</span>
                    <span class="percentage-label">登录用户</span>
                  </template>
                </el-progress>
                <p>非登录用户: {{ guestSearchCount }} | 登录用户: {{ loggedInSearchCount }}</p>
              </div>
              <div class="userStatsBox">
                <h3>点击行为</h3>
                <el-progress 
                  type="dashboard" 
                  :percentage="userLinkPercentage" 
                  status="warning"
                >
                  <template #default="{ percentage }">
                    <span class="percentage-value">{{ percentage }}%</span>
                    <span class="percentage-label">登录用户</span>
                  </template>
                </el-progress>
                <p>非登录用户: {{ guestLinkCount }} | 登录用户: {{ loggedInLinkCount }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })
import { useFetch } from '#app'

interface TrendItem {
  date: string
  count: string
}

interface UserTypeStat {
  user_type: 'guest' | 'user'
  total_count: string
}

interface StatsResponse {
  topEngines: Array<{ name: string; total_count: string; icon_url: string }>
  topLinks: Array<{ title: string; total_count: string; icon_url: string; url: string }>
  trends: {
    search: TrendItem[]
    link: TrendItem[]
  }
  userStats: {
    search: UserTypeStat[]
    link: UserTypeStat[]
  }
}

const { data: statsData } = await useFetch<StatsResponse>('/api/admin/stats')

const totalSearchCount = computed(() => {
  return statsData.value?.topEngines.reduce((sum, item) => sum + Number(item.total_count), 0) || 0
})

const totalLinkCount = computed(() => {
  return statsData.value?.topLinks.reduce((sum, item) => sum + Number(item.total_count), 0) || 0
})

const guestSearchCount = computed(() => {
  return Number(statsData.value?.userStats.search.find(s => s.user_type === 'guest')?.total_count || 0)
})

const loggedInSearchCount = computed(() => {
  return Number(statsData.value?.userStats.search.find(s => s.user_type === 'user')?.total_count || 0)
})

const guestLinkCount = computed(() => {
  return Number(statsData.value?.userStats.link.find(s => s.user_type === 'guest')?.total_count || 0)
})

const loggedInLinkCount = computed(() => {
  return Number(statsData.value?.userStats.link.find(s => s.user_type === 'user')?.total_count || 0)
})

const userSearchPercentage = computed(() => {
  const total = guestSearchCount.value + loggedInSearchCount.value
  return total === 0 ? 0 : Math.round((loggedInSearchCount.value / total) * 100)
})

const userLinkPercentage = computed(() => {
  const total = guestLinkCount.value + loggedInLinkCount.value
  return total === 0 ? 0 : Math.round((loggedInLinkCount.value / total) * 100)
})

const summaryCards = computed(() => [
  { label: '累计搜索次数', value: guestSearchCount.value + loggedInSearchCount.value },
  { label: '累计点击次数', value: guestLinkCount.value + loggedInLinkCount.value },
  { label: '登录搜索占比', value: `${userSearchPercentage.value}%` },
  { label: '登录点击占比', value: `${userLinkPercentage.value}%` }
])

function calculatePercentage(count: string | number, total: number) {
  if (total === 0) return 0
  return Math.round((Number(count) / total) * 100)
}
</script>

<style scoped>
.statsPage {
  padding: 10px;
}
.mt20 {
  margin-top: 20px;
}
.summaryCard {
  text-align: center;
}
.summaryLabel {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}
.summaryValue {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.cardHeader {
  font-weight: bold;
}
.engineInfo, .linkInfo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.engineIcon, .linkIcon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.userStatsContainer {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}
.userStatsBox {
  text-align: center;
}
.userStatsBox h3 {
  margin-bottom: 20px;
  color: #606266;
}
.percentage-value {
  display: block;
  font-size: 24px;
}
.percentage-label {
  display: block;
  font-size: 12px;
  color: #909399;
}
</style>
