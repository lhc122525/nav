<template>
  <el-container class="layoutContainer">
    <el-header height="60px" class="mainHeader" :class="{ isDark: isHome }">
      <div class="container headerContent">
        <NuxtLink class="brand" to="/">
          <el-icon :size="18" class="brandIcon"><StarFilled /></el-icon>
          <span class="brandText">首页</span>
        </NuxtLink>

        <nav class="desktopNav">
          <NuxtLink class="navLink" to="/submit" active-class="active">
            <el-icon class="navIcon yellow"><Star /></el-icon> 申请收录
          </NuxtLink>
          <NuxtLink class="navLink" to="/guestbook" active-class="active">
            <el-icon class="navIcon red"><ChatDotRound /></el-icon> 留言板
          </NuxtLink>
        </nav>

        <div class="spacer" />

        <div class="headerActions">
          <div v-if="isHome" class="headerTime pc">
            <span class="time">{{ nowTimeText }}</span>
            <span class="date">{{ nowDateText }}</span>
          </div>

          <!-- <el-button link class="actionIconBtn">
            <el-icon :size="18"><ChatLineRound /></el-icon>
          </el-button>
           -->
          <el-button
            v-if="!me?.user"
            type="success"
            class="loginBtn"
            @click="onGuestCommand('login')"
          >
            登录
          </el-button>
          <el-dropdown v-else @command="onUserCommand">
            <el-button link class="userProfile">
              <el-avatar :size="28" class="userAvatar">{{
                me.user.username[0]
              }}</el-avatar>
              <span class="username">{{ me.user.username }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout" class="logoutItem">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <el-button class="mobileMenuBtn" circle @click="mobileMenuOpen = true">
          <el-icon :size="20"><MenuIcon /></el-icon>
        </el-button>
      </div>
    </el-header>

    <el-main class="layoutMain">
      <div class="mainContent">
        <slot />
      </div>
    </el-main>

    <div class="Links container">
      <div class="Links_title">友情链接：</div>
      <a
        v-for="l in friendLinks"
        :key="l.url"
        class="Links_link"
        :href="l.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ l.name }}
      </a>
    </div>

    <footer class="footer">
      <div class="container footerInner">
        <div class="footerGrid">
          <div class="footerCol">
            <div class="info">
              <div class="info-top">
                <a
                  data-v-16aa41fb=""
                  href="/"
                  class="logo"
                  title="到迷鹿导航首页"
                  >
                  <img
                    data-v-16aa41fb=""
                    class="logo-img"
                    src="@/assets/logo-1.png"
                    alt="迷鹿导航"
                  />
                </a>
                <div class="keyboard">
                  按住 <i class="i">Ctrl</i> + <i class="i">D</i> 键，收藏本站！
                </div>
              </div>
              <div class="detail">
                非乐鱼导航，致力于为用户提供方便快捷实用的网址导航服务，帮助用户快速访问常用网站，满足用户的上网需求！收录的网站涵盖了生活服务、实用工具、资源发现、AI领域、影音娱乐、设计灵感、站长工具、开发资源、探索发现等多个领域，让您的上网体验更加丰富多彩！
              </div>
            </div>
          </div>

          <div class="footerCol">
            <div class="footerTitle">本网站地图</div>
            <div class="footerLinks">
              <NuxtLink
                v-for="l in siteMapLinks"
                :key="l.to"
                class="footerLink"
                :to="l.to"
              >
                {{ l.name }}
              </NuxtLink>
            </div>
          </div>

          <div class="footerCol">
            <div class="footerTitle">本站声明</div>
            <div class="footerLinks">
              <button
                class="footerLink footerButton"
                type="button"
                @click="statementOpen = true"
              >
                查看声明
              </button>
              <NuxtLink class="footerLink" to="/guestbook">侵权/反馈</NuxtLink>
            </div>
          </div>
        </div>

        <div class="footerBottom">
          <span class="footerMuted"
            >© {{ new Date().getFullYear() }} {{ siteName }}</span
          >
          <a
            class="footerLink footerInlineLink"
            href="https://beian.miit.gov.cn"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ icpText }}
          </a>
        </div>
      </div>
    </footer>

    <el-drawer v-model="mobileMenuOpen" title="菜单" direction="rtl" size="80%">
      <el-menu :default-active="mobileActive" @select="onMobileSelect" style="margin-top: -30px;border:none;">
        <el-menu-item index="route:/"> 首页 </el-menu-item>
        <el-menu-item index="route:/submit"> 申请收录 </el-menu-item>
        <el-menu-item index="route:/guestbook"> 留言板 </el-menu-item>
        <!-- <el-menu-item index="route:/admin/nav">
          后台
        </el-menu-item>
        <el-menu-item index="route:/openapi">
          OpenAPI
        </el-menu-item> -->
        <el-menu-item v-if="!me?.user" index="action:login">
          登录
        </el-menu-item>
        <el-menu-item v-if="!me?.user" index="action:register">
          注册
        </el-menu-item>
        <el-menu-item v-else index="action:logout"> 退出登录 </el-menu-item>
      </el-menu>
    </el-drawer>

    <el-dialog
      v-model="loginOpen"
      title="登录"
      append-to-body
      style="max-width: 550px; width: 90vw"
    >
      <el-form label-width="72px" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            autocomplete="current-password"
            show-password
          />
        </el-form-item>
      </el-form>
      <div class="registerLink" @click="goRegister()">还没有账号？去注册</div>
      <template #footer>
        <el-button @click="loginOpen = false">取消</el-button>
        <el-button
          type="primary"
          :loading="loginSubmitting"
          @click="submitLogin"
        >
          登录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="registerOpen"
      title="注册"
      append-to-body
      style="max-width: 550px; width: 90vw"
    >
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model.trim="registerForm.username"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model.trim="registerForm.password"
            type="password"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="passwordConfirm">
          <el-input
            v-model.trim="registerForm.passwordConfirm"
            type="password"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <div class="captchaRow">
            <el-input
              v-model.trim="registerForm.captcha"
              autocomplete="off"
              placeholder="请输入验证码"
              @keydown.enter.prevent="submitRegister"
            />
            <el-button class="captchaText" text @click="refreshRegisterCaptcha">
              {{ registerCaptchaText }}
            </el-button>
            <!-- <el-button class="captchaRefresh" text @click="refreshRegisterCaptcha">
              刷新
            </el-button> -->
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerOpen = false">取消</el-button>
        <el-button
          type="primary"
          :loading="registerSubmitting"
          @click="submitRegister"
        >
          注册
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="statementOpen"
      title="本站声明"
      append-to-body
      style="max-width: 520px; width: 90vw"
    >
      <div class="statementBody">
        <div class="statementLine">
          本站内容来自互联网收集与用户提交，仅用于学习交流与信息检索。
        </div>
        <div class="statementLine">
          本站不对外链内容的准确性、合法性、可用性承担责任，访问外链风险自担。
        </div>
        <div class="statementLine">
          如有侵权或不当内容，请通过留言板联系管理员处理。
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="statementOpen = false"
          >我知道了</el-button
        >
      </template>
    </el-dialog>

    <div class="floatActions">
      <el-tooltip content="设置" placement="left">
        <el-button class="floatBtn" @click="settingsOpen = true">
          <el-icon><Setting /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="投喂站长" placement="left">
        <el-button class="floatBtn" @click="donateOpen = true">
          <el-icon><StarFilled /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="强制刷新" placement="left">
        <el-button class="floatBtn" @click="forceReload">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="scrollTip" placement="left">
        <el-button class="floatBtn" @click="scrollToggle">
          <el-icon>
            <CaretTop v-if="scrollMode === 'top'" />
            <CaretBottom v-else />
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <el-dialog
      v-model="donateOpen"
      title="投喂本站"
      append-to-body
      style="max-width: 760px; width: 95vw"
    >
      <div class="donatePanel" :loading="donateLoading">
        <div class="donateCol donateAlipay">
          <div class="donateQr">
            <el-image
              v-if="donateConfig.alipayQrUrl"
              :src="donateConfig.alipayQrUrl"
              fit="contain"
              style="width: 100%; height: 360px"
              :preview-src-list="[donateConfig.alipayQrUrl]"
              preview-teleported
            />
            <el-empty v-else description="未配置" />
          </div>
        </div>
        <div class="donateCol donateWechat">
          <div class="donateQr">
            <el-image
              v-if="donateConfig.wechatQrUrl"
              :src="donateConfig.wechatQrUrl"
              fit="contain"
              style="width: 100%; height: 360px"
              :preview-src-list="[donateConfig.wechatQrUrl]"
              preview-teleported
            />
            <el-empty v-else description="未配置" />
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="settingsOpen"
      title="设置"
      append-to-body
      style="max-width: 420px; width: 90vw"
    >
      <div class="settingsPanel">
        <div class="settingsSection">
          <div class="settingsLabel">模式切换</div>
          <div class="modeOptions">
            <div
              v-for="mode in displayModes"
              :key="mode.value"
              class="modeOption"
              :class="{ active: displayModeCookie === mode.value }"
              @click="setDisplayMode(mode.value)"
            >
              <div class="modeIcon">
                <el-icon v-if="mode.value === 'minimal'"><Minus /></el-icon>
                <el-icon v-else-if="mode.value === 'simple'"><Grid /></el-icon>
                <el-icon v-else><Grid /></el-icon>
              </div>
              <div class="modeInfo">
                <div class="modeName">{{ mode.label }}</div>
                <div class="modeDesc">{{ mode.desc }}</div>
              </div>
              <div v-if="displayModeCookie === mode.value" class="modeCheck">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import {
  StarFilled,
  Star,
  ArrowDown,
  SwitchButton,
  ChatDotRound,
  Menu as MenuIcon,
  Refresh,
  CaretTop,
  CaretBottom,
  Setting,
  Minus,
  Grid,
  Check,
} from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

type PublicConfig = {
  siteName?: string;
  siteUrl?: string;
  icp?: string;
  icpNumber?: string;
};

const { public: publicConfig } = useRuntimeConfig() as { public: PublicConfig };
const siteName = computed(() => publicConfig.siteName || "非乐鱼导航");
const isHome = computed(() => route.path === "/");

const statementOpen = ref(false);
const icpText = computed(() => {
  const v = publicConfig.icp || publicConfig.icpNumber;
  return typeof v === "string" && v.trim() ? v.trim() : "备案信息";
});

type RecommendedLink = { id: number; title: string; url: string };
const { data: recommendedData } = await useFetch<{ links: RecommendedLink[] }>(
  "/api/links/recommended",
  { server: true }
);
const friendLinks = computed(() => {
  const list = recommendedData.value?.links || [];
  const results: { name: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const url = item.url?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    results.push({ name: item.title, url });
    if (results.length >= 12) break;
  }
  return results;
});

const siteMapLinks = [
  { name: "首页", to: "/" },
  { name: "申请收录", to: "/submit" },
  { name: "留言板", to: "/guestbook" },
];

type DonateConfig = { alipayQrUrl: string; wechatQrUrl: string };

const donateOpen = ref(false);
const donateLoading = ref(false);
const donateConfig = reactive<DonateConfig>({ alipayQrUrl: "", wechatQrUrl: "" });

// 设置相关
const settingsOpen = ref(false);

type DisplayMode = 'minimal' | 'simple' | 'normal';
const DISPLAY_MODE_KEY = 'display_mode';

const displayModes = [
  { value: 'minimal' as DisplayMode, label: '极简', desc: '隐藏分类列表，只保留搜索区域' },
  { value: 'simple' as DisplayMode, label: '简约', desc: '站点只显示图标，隐藏名称和描述' },
  { value: 'normal' as DisplayMode, label: '常规', desc: '显示完整站点信息' },
];

// 使用 useCookie 实现 SSR 友好的持久化
const displayModeCookie = useCookie<DisplayMode>(DISPLAY_MODE_KEY, {
  default: () => 'normal',
  watch: true,
  maxAge: 60 * 60 * 24 * 365, // 1年有效期
  path: '/',
});

const displayMode = computed({
  get: () => displayModeCookie.value,
  set: (val) => { displayModeCookie.value = val; },
});

function setDisplayMode(mode: DisplayMode) {
  displayModeCookie.value = mode;
}

// 提供给子组件使用的composable
provide('displayMode', displayMode);

// 提供打开登录弹窗的方法
provide('openLoginDialog', () => {
  loginOpen.value = true;
});

const scrollMode = ref<"top" | "bottom">("bottom");
const scrollTip = computed(() =>
  scrollMode.value === "top" ? "回到顶部" : "回到底部"
);

// 去注册
function goRegister() {
  loginOpen.value = false;
  onGuestCommand('register')
}



function forceReload() {
  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(Date.now()));
  window.location.replace(url.toString());
}

function scrollToggle() {
  if (scrollMode.value === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const doc = document.documentElement;
  window.scrollTo({ top: doc.scrollHeight, behavior: "smooth" });
}

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

function updateScrollMode() {
  const doc = document.documentElement;
  const max = Math.max(0, doc.scrollHeight - window.innerHeight);
  const half = max / 2;
  scrollMode.value = window.scrollY >= half ? "top" : "bottom";
}

onMounted(() => {
  updateScrollMode();
  window.addEventListener("scroll", updateScrollMode, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateScrollMode);
});

watch(donateOpen, async (open) => {
  if (!open) return;
  donateLoading.value = true;
  try {
    const res = await $fetch<DonateConfig>("/api/donate/config");
    donateConfig.alipayQrUrl = res.alipayQrUrl || "";
    donateConfig.wechatQrUrl = res.wechatQrUrl || "";
  } finally {
    donateLoading.value = false;
  }
});

const nowTimeText = computed(() => {
  const d = now.value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
});
const nowDateText = computed(() => {
  const d = now.value;
  const date = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(
    d
  );
  return `${date} ${weekday}`;
});

// 使用全局用户状态
const { userMe, refreshUserMe, clearUserMe } = useUserMe()

// SSR 时获取用户信息（客户端由 plugin 处理）
if (import.meta.server) {
  await refreshUserMe()
}

const me = computed(() => userMe.value)

const mobileMenuOpen = ref(false);
const route = useRoute();
const mobileActive = computed(() => `route:${route.path}`);

// 使用 useState 共享登录弹窗状态
const loginOpen = useState('loginOpen', () => false);
const registerOpen = ref(false);

const loginForm = reactive({ username: "", password: "" });
const registerFormRef = ref<FormInstance>();
const registerForm = reactive({
  username: "",
  password: "",
  passwordConfirm: "",
  captcha: "",
});

function generateCaptchaText(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const chars = alphabet + digits;
  let result = "";
  for (let i = 0; i < length; i += 1)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

const registerCaptchaText = ref(generateCaptchaText(5));
function refreshRegisterCaptcha() {
  registerCaptchaText.value = generateCaptchaText(5);
  registerForm.captcha = "";
  registerFormRef.value?.clearValidate(["captcha"]);
}

watch(registerOpen, (open) => {
  if (!open) return;
  refreshRegisterCaptcha();
});

const registerRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度需为 3-20", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 64, message: "密码长度需为 6-64", trigger: "blur" },
  ],
  passwordConfirm: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (_rule, value: unknown, callback: (error?: Error) => void) => {
        if (String(value || "") !== registerForm.password)
          callback(new Error("两次输入的密码不一致"));
        else callback();
      },
      trigger: "blur",
    },
  ],
  captcha: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    {
      validator: (_rule, value: unknown, callback: (error?: Error) => void) => {
        const input = String(value || "")
          .trim()
          .toUpperCase();
        const expected = String(registerCaptchaText.value || "")
          .trim()
          .toUpperCase();
        if (!input) callback(new Error("请输入验证码"));
        else if (input !== expected) callback(new Error("验证码错误，请重试"));
        else callback();
      },
      trigger: ["blur", "change"],
    },
  ],
};

const loginSubmitting = ref(false);
const registerSubmitting = ref(false);

function onGuestCommand(command: string) {
  if (command === "login") {
    loginOpen.value = true;
    return;
  }
  if (command === "register") {
    registerOpen.value = true;
  }
}

async function onUserCommand(command: string) {
  if (command !== "logout") return;
  const { $api } = useNuxtApp();
  await $api("/api/auth/logout", { method: "POST" });
  clearUserMe();
}

async function onMobileSelect(index: string) {
  if (index.startsWith("route:")) {
    mobileMenuOpen.value = false;
    await navigateTo(index.slice("route:".length));
    return;
  }

  if (index === "action:login") {
    mobileMenuOpen.value = false;
    loginOpen.value = true;
    return;
  }
  if (index === "action:register") {
    mobileMenuOpen.value = false;
    registerOpen.value = true;
    return;
  }
  if (index === "action:logout") {
    mobileMenuOpen.value = false;
    await onUserCommand("logout");
  }
}

async function submitLogin() {
  const { $api } = useNuxtApp();
  loginSubmitting.value = true;
  try {
    await $api("/api/auth/login", { method: "POST", body: loginForm });
    loginOpen.value = false;
    loginForm.password = "";

    await refreshUserMe();
  } catch {
    // const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    // ElMessage.error("登录失败，请重试")
  } finally {
    loginSubmitting.value = false;
  }
}

async function submitRegister() {
  const { $api } = useNuxtApp();
  const valid = await registerFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  registerSubmitting.value = true;
  try {
    await $api("/api/auth/register", {
      method: "POST",
      body: {
        username: registerForm.username,
        password: registerForm.password,
      },
    });
    registerOpen.value = false;
    registerForm.password = "";
    registerForm.passwordConfirm = "";
    registerForm.captcha = "";
    loginForm.username = registerForm.username;
    loginForm.password = "";
    loginOpen.value = true;
    ElMessage({
      message: "注册成功，请登录",
      type: "success",
      plain: true,
    });
  } catch {
    refreshRegisterCaptcha();
    // const msg = typeof (e as { msg?: unknown } | null)?.msg === 'string' ? String((e as { msg?: unknown }).msg) : undefined
    // ElMessage({
    //   message: msg || (e instanceof Error ? e.message : '注册失败，请重试'),
    //   type: 'error',
    //   plain: true,
    //   duration: 3000000,
    // })
  } finally {
    registerSubmitting.value = false;
  }
}
</script>

<style scoped lang="less">
.layoutContainer {
  min-height: 100vh;
  background-color: #f6f8fa;
  overflow: visible;
}

.mainHeader {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e1e4e8;
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.mainHeader.isDark {
  background-color: #000;
  border-bottom: none;
  backdrop-filter: none;
}

.actionIconBtn {
  color: rgba(255, 255, 255, 0.6);
  padding: 8px;
}

.actionIconBtn:hover {
  color: #fff;
}

.headerContent {
  display: flex;
  align-items: center;
  width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #24292e;
  margin-right: 30px;
}

.isDark .brand {
  color: #fff;
}

.brandIcon {
  color: #0969da;
}

.isDark .brandIcon {
  color: #ffca28;
}

.navIcon {
  font-size: 16px;
}

.navIcon.yellow {
  color: #ffca28;
}

.navIcon.red {
  color: #ff4d4f;
}

.brandText {
  font-size: 14px;
  font-weight: 600;
}

.desktopNav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.navLink {
  text-decoration: none;
  color: #57606a;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.isDark .navLink {
  color: rgba(255, 255, 255, 0.85);
}

.navLink:hover {
  background-color: #f3f4f6;
  color: #24292e;
}

.isDark .navLink:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.navLink.active {
  color: #0969da;
  background-color: #eaf2ff;
  font-weight: 600;
}

.isDark .navLink.active {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.15);
}

.spacer {
  flex: 1;
}

.headerTime {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.headerTime .time {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.headerTime .date {
  opacity: 1;
}

.loginBtn {
  font-weight: 600;
  border-radius: 18px;
  padding: 6px 16px;
  height: 32px;
  font-size: 13px;
  background-color: #28c76f !important;
  border-color: #28c76f !important;
}

.userProfile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.isDark .userProfile {
  color: #fff;
}

.userProfile:hover {
  background-color: #f3f4f6;
}

.isDark .userProfile:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  font-weight: 600;
  color: #24292e;
  padding-left: 5px;
}

.isDark .username {
  color: #fff;
}

.userAvatar {
  background-color: #0969da;
  font-weight: 700;
}

.logoutItem {
  color: #cf222e;
}

.mobileMenuBtn {
  display: none;
}

.isDark .mobileMenuBtn {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
  background: transparent;
}

.layoutMain {
  padding: 0;
  overflow: visible;
}

.mainContent {
  padding: 0;
  overflow: visible;
}

.Links {
  font-size: 11px;
  margin-top: 30px;
  padding: 14px;
  width: calc(100% - 32px);
  color: #898989;
  .Links_title {
    display: inline-block;
  }
  .Links_link {
    color: currentColor;
    text-decoration: none;
    padding: 4px 8px;
    &:hover {
      color: #0969da;
    }
  }
}

.footer {
  background: #ffffff;
  padding: 12px 0;
}

.footerInner {
  padding: 12px 16px 0;
}

.footerGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 0px;
  border-radius: 10px;
}

.footerCol{
  &:nth-child(1){
    width: 60%;
  }
  &:nth-child(2){
    width: calc(20% - 20px);
  }
  &:nth-child(3){
    width: calc(20% - 20px);
  }
}

.footerTitle {
  font-size: 14px;
  font-weight: 700;
  color: #24292e;
  margin-bottom: 10px;
}
.info {
    flex: 1;
    font-size: 11px;
    color: #696969;
    .info-top {
        align-items: center;
        display: flex;
        .logo {
          text-decoration: none;
          .logo-img{
              height: 40px;
              display: block;
          }
        }
        .keyboard {
            margin-left: 10px;
            line-height: 22px;
            i {
                color: #000000e0;
                border: 1px solid #f0f0f0;
                border-radius: 4px;
                margin: 0 6px;
                padding: 2px 6px;
                font-style: normal;
            }

        }
    }
    .detail {
        color: #696969;
        margin-top: 10px;
        line-height: 21px;
    }
}

.footerLinks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footerLink {
  font-size: 13px;
  color: #57606a;
  text-decoration: none;
  transition: color 0.2s;
}

.footerLink:hover {
  color: #0969da;
}

.footerButton {
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.footerMeta {
  font-size: 12px;
  color: #6e7781;
}

.footerBottom {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 6px;
}

.footerMuted {
  font-size: 12px;
  color: #6e7781;
}

.footerInlineLink {
  font-size: 12px;
}

.statementBody {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #24292e;
}

.statementLine {
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .desktopNav, .pc {
    display: none;
  }
  .mobileMenuBtn {
    display: flex;
  }
  .brand {
    margin-right: 0;
  }
  .footerGrid {
    .footerCol{
      &:nth-child(1){
        width: 100%;
      }
      &:nth-child(2){
        width: calc(50% - 20px);
      }
      &:nth-child(3){
        width: calc(50% - 20px);
      }
    }
  }
}

.mobileUser {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f1f2f4;
}

.mobileUsername {
  font-size: 18px;
  font-weight: 700;
  color: #24292e;
}

.captchaRow {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.captchaText {
  min-width: 110px;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 0 12px;
  height: 32px;
}

.captchaRefresh {
  white-space: nowrap;
}

.floatActions {
  position: fixed;
  right: 10px;
  bottom: 110px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2000;
}

.floatBtn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  margin: 0;
}

.donatePanel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-radius: 10px;
  overflow: hidden;
}

.donateCol {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 420px;
}

.donateAlipay {
  background: #1677ff;
}

.donateWechat {
  background: #16a34a;
}

.donateTitle {
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
}

.donateQr {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.registerLink{
  font-size: 12px;
  color: #409eff;
  text-align: right;
  cursor: pointer;
  &:hover {
    color: #0969da;
  }
}

.settingsPanel {
  padding: 8px 0;
}

.settingsSection {
  margin-bottom: 20px;
}

.settingsLabel {
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
  margin-bottom: 12px;
}

.modeOptions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modeOption {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.modeOption:hover {
  border-color: #0969da;
  background: #f6f8fa;
}

.modeOption.active {
  border-color: #0969da;
  background: #eaf2ff;
}

.modeIcon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #57606a;
  font-size: 18px;
}

.modeOption.active .modeIcon {
  background: #0969da;
  color: #fff;
}

.modeInfo {
  flex: 1;
}

.modeName {
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
  margin-bottom: 2px;
}

.modeDesc {
  font-size: 12px;
  color: #57606a;
}

.modeCheck {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0969da;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
}

@media (max-width: 768px) {
  .floatActions {
    right: 12px;
    bottom: 90px;
  }
  .donatePanel {
    grid-template-columns: 1fr;
    .donateCol {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 220px;
      height: 265px;
      .donateQr{
        height: 100%;
        .el-empty{
          padding: 0;
        }
      }
    }
  }

  .headerContent {
    padding: 0;
  }
}
</style>
