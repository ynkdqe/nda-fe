<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import {
  getCachedCurrentWeather,
  getLocationByIp,
  resolveWeatherDescription,
} from '#/api/weather';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();

// Đây là dữ liệu mẫu; các dự án thực tế cần điều chỉnh dựa trên các trường hợp cụ thể.
// URL cũng có thể là một tuyến đường nội bộ, được xác định và xử lý trong phương thức `navTo` để chuyển hướng nội bộ.
// Ví dụ: URL: /dashboard/workspace
const projectItems: WorkbenchProjectItem[] = [
  {
    color: '',
    content: 'E-commerce',
    date: '07-05-2022',
    group: '29-03-2018',
    icon: 'https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/fd3ef04e572c6436a8580539e7555fd0.jpg',
    title: 'FRT Retail',
    url: 'https://fptshop.com.vn',
  },
  {
    color: '#3fb27f',
    content: 'IT Outsourcing',
    date: '03-02-2023',
    group: '09-05-2022',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi6RVHnMD4Ru7qT0wy4qOduoQflhWN2Qhz9A&s',
    title: 'CMC Global',
    url: 'https://cmcglobal.com.vn',
  },
  {
    color: '#e18525',
    content: 'Education',
    date: '10-11-2023',
    group: '06-02-2023',
    icon: 'https://vinschool.edu.vn/wp-content/themes/vsc/favicon.ico',
    title: 'Vinschool',
    url: 'https://vinschool.edu.vn/',
  },
  {
    color: '#bf0c2c',
    content: 'Real Estate',
    date: '31-07-2025',
    group: '13-11-2023',
    icon: 'https://meeygroup.com/favicon.ico?v=1.48',
    title: 'MeeyLand',
    url: 'https://meeygroup.com/',
  },
  {
    color: '#00d8ff',
    content: 'IT and Software Solutions',
    date: '13-05-2026',
    group: '01-08-2025',
    icon: 'https://www.microtecweb.com/favicon.ico',
    title: 'Microtec',
    url: 'https://www.microtecweb.com/',
  },
  {
    color: '#00d8ff',
    content: 'Restaurant Business',
    date: '-',
    group: '14-05-2026',
    icon: 'https://cdn1.vieclam24h.vn/images/default/2023/06/26/logo%20GGG_vertital_168774578619.w-240.h-240.png',
    title: 'Golden Gate Group',
    url: 'https://ggc.com.vn',
  },
];

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const quickNavItems = computed<WorkbenchQuickNavItem[]>(() => [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: $t('page.dashboard.workspace.nav.home'),
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: $t('page.dashboard.workspace.nav.dashboard'),
    url: '/dashboard',
  },
  {
    color: '#e18525',
    icon: 'ion:layers-outline',
    title: $t('page.dashboard.workspace.nav.components'),
    url: '/demos/features/icons',
  },
  {
    color: '#3fb27f',
    icon: 'ion:settings-outline',
    title: $t('page.dashboard.workspace.nav.settings'),
    url: '/demos/features/login-expired',
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: $t('page.dashboard.workspace.nav.access'),
    url: '/demos/access/page-control',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: $t('page.dashboard.workspace.nav.charts'),
    url: '/analytics',
  },
]);

const todoItems = computed<WorkbenchTodoItem[]>(() => [
  {
    completed: false,
    content: $t('page.dashboard.workspace.todo.codeReview'),
    date: '2024-07-30 11:00:00',
    title: $t('page.dashboard.workspace.todo.codeReview'),
  },
  {
    completed: true,
    content: $t('page.dashboard.workspace.todo.optimization'),
    date: '2024-07-30 11:00:00',
    title: $t('page.dashboard.workspace.todo.optimization'),
  },
  {
    completed: false,
    content: $t('page.dashboard.workspace.todo.security'),
    date: '2024-07-30 11:00:00',
    title: $t('page.dashboard.workspace.todo.security'),
  },
  {
    completed: false,
    content: $t('page.dashboard.workspace.todo.dependency'),
    date: '2024-07-30 11:00:00',
    title: $t('page.dashboard.workspace.todo.dependency'),
  },
  {
    completed: false,
    content: $t('page.dashboard.workspace.todo.uiFix'),
    date: '2024-07-30 11:00:00',
    title: $t('page.dashboard.workspace.todo.uiFix'),
  },
]);
const trendItems = computed<WorkbenchTrendItem[]>(() => [
  {
    avatar: 'svg:avatar-1',
    content: $t('page.dashboard.workspace.trends.createProject', [
      'Vue',
      '开源组',
    ]),
    date: '刚刚',
    title: '威廉',
  },
  {
    avatar: 'svg:avatar-2',
    content: $t('page.dashboard.workspace.trends.follow', ['威廉']),
    date: '1个小时前',
    title: '艾文',
  },
  {
    avatar: 'svg:avatar-3',
    content: $t('page.dashboard.workspace.trends.publish', ['个人动态']),
    date: '1天前',
    title: '克里斯',
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('page.dashboard.workspace.trends.writeArticle', [
      '如何编写一个Vite插件',
    ]),
    date: '2天前',
    title: 'Vben',
  },
  {
    avatar: 'svg:avatar-1',
    content: $t('page.dashboard.workspace.trends.replyQuestion', [
      '杰克',
      '如何进行项目 optimization？',
    ]),
    date: '3天前',
    title: '皮特',
  },
  {
    avatar: 'svg:avatar-2',
    content: $t('page.dashboard.workspace.trends.closeIssue', ['如何运行项目']),
    date: '1周前',
    title: '杰克',
  },
  {
    avatar: 'svg:avatar-3',
    content: $t('page.dashboard.workspace.trends.publish', ['个人动态']),
    date: '1周前',
    title: '威廉',
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('page.dashboard.workspace.trends.pushCode', ['Github']),
    date: '2021-04-01 20:00',
    title: '威廉',
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('page.dashboard.workspace.trends.writeArticle', [
      '如何编写 sử dụng Admin Vben',
    ]),
    date: '2021-03-01 20:00',
    title: 'Vben',
  },
]);

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
const weatherDesc = ref($t('page.dashboard.workspace.weather.loading'));

async function fetchWeather() {
  try {
    const location = await getLocationByIp();
    if (location) {
      const weather = await getCachedCurrentWeather(
        location.latitude,
        location.longitude,
      );
      const desc = resolveWeatherDescription(weather.weathercode, $t);
      weatherDesc.value = `${location.city}, ${desc} - ${weather.temperature}℃`;
    }
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    weatherDesc.value = $t('page.dashboard.workspace.weather.error');
  }
}

onMounted(() => {
  fetchWeather();
});
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        {{
          $t('page.dashboard.workspace.welcomeTitle', [
            userStore.userInfo?.realName,
          ])
        }}
      </template>
      <template #description> {{ weatherDesc }} </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject
          :items="projectItems"
          :title="$t('page.dashboard.workspace.projects')"
          @click="navTo"
        />
        <WorkbenchTrends
          :items="trendItems"
          class="mt-5"
          :title="$t('page.dashboard.workspace.latestDynamic')"
        />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          :title="$t('page.dashboard.workspace.quickNav')"
          @click="navTo"
        />
        <WorkbenchTodo
          :items="todoItems"
          class="mt-5"
          :title="$t('page.dashboard.workspace.todoItems')"
        />
        <AnalysisChartCard
          class="mt-5"
          :title="$t('page.dashboard.workspace.accessSource')"
        >
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
