<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import type { AnalyticApi } from '#/models/analytic';

import { computed, onMounted, ref } from 'vue';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';
import { $t } from '@vben/locales';

import { getAnalyticApi } from '#/api';

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisitsData from './analytics-visits-data.vue';
import AnalyticsVisitsSales from './analytics-visits-sales.vue';
import AnalyticsVisitsSource from './analytics-visits-source.vue';
import AnalyticsVisits from './analytics-visits.vue';

const analyticData = ref<AnalyticApi.AnalyticResultData | null>(null);
const analyticError = ref<unknown>(null);
const analyticLoading = ref(false);

async function loadAnalyticData() {
  analyticLoading.value = true;
  analyticError.value = null;
  try {
    const response = await getAnalyticApi();
    analyticData.value = response.data ?? null;
  } catch (error) {
    analyticError.value = error;
    analyticData.value = null;
  } finally {
    analyticLoading.value = false;
  }
}

onMounted(() => {
  void loadAnalyticData();
});

function getAnalyticDetail(type: AnalyticApi.AnalyticDetailType) {
  return analyticData.value?.details?.find((item) => item.type === type);
}

function getTotalInDay(type: AnalyticApi.AnalyticDetailType) {
  return getAnalyticDetail(type)?.totalInDay ?? 0;
}

function getTotal24h(type: AnalyticApi.AnalyticDetailType) {
  return getAnalyticDetail(type)?.total24h ?? 0;
}

function formatBytesValue(bytes: number) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) {
    return {
      suffix: ' GB',
      value: Number(gb.toFixed(2)),
    };
  }

  return {
    suffix: ' MB',
    value: Number((bytes / 1024 ** 2).toFixed(2)),
  };
}

const trafficInDay = computed(() => {
  return formatBytesValue(getTotalInDay('TotalBytes'));
});

const traffic24h = computed(() => {
  return formatBytesValue(getTotal24h('TotalBytes'));
});

const overviewItems = computed<AnalysisOverviewItem[]>(() => [
  {
    icon: SvgCardIcon,
    title: $t('page.dashboard.analyticsPage.overview.users'),
    totalTitle: $t('page.dashboard.analyticsPage.overview.totalUsers'),
    totalValue: 120_000,
    value: 2000,
  },
  {
    icon: SvgCakeIcon,
    title: $t('page.dashboard.analyticsPage.overview.visits'),
    totalTitle: $t('page.dashboard.analyticsPage.overview.totalVisits'),
    totalValue: getTotal24h('UniqueVisitors'),
    value: getTotalInDay('UniqueVisitors'),
  },
  {
    decimals: 2,
    icon: SvgDownloadIcon,
    title: $t('page.dashboard.analyticsPage.overview.downloads'),
    totalSuffix: traffic24h.value.suffix,
    totalTitle: $t('page.dashboard.analyticsPage.overview.totalDownloads'),
    totalValue: traffic24h.value.value,
    value: trafficInDay.value.value,
    valueSuffix: trafficInDay.value.suffix,
  },
  {
    icon: SvgBellIcon,
    title: $t('page.dashboard.analyticsPage.overview.usage'),
    totalTitle: $t('page.dashboard.analyticsPage.overview.totalUsage'),
    totalValue: getTotal24h('TotalRequests'),
    value: getTotalInDay('TotalRequests'),
  },
]);

const chartTabs = computed<TabOption[]>(() => [
  {
    label: $t('page.dashboard.analyticsPage.tabs.trafficTrends'),
    value: 'trends',
  },
  {
    label: $t('page.dashboard.analyticsPage.tabs.monthlyVisits'),
    value: 'visits',
  },
]);
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" />
    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #trends>
        <AnalyticsTrends />
      </template>
      <template #visits>
        <AnalyticsVisits />
      </template>
    </AnalysisChartsTabs>

    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:mr-4 md:w-1/3"
        :title="$t('page.dashboard.analyticsPage.cards.visitCount')"
      >
        <AnalyticsVisitsData />
      </AnalysisChartCard>
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:mr-4 md:w-1/3"
        :title="$t('page.dashboard.analyticsPage.cards.visitSource')"
      >
        <AnalyticsVisitsSource />
      </AnalysisChartCard>
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:w-1/3"
        :title="$t('page.dashboard.analyticsPage.cards.salesRatio')"
      >
        <AnalyticsVisitsSales />
      </AnalysisChartCard>
    </div>
  </div>
</template>
