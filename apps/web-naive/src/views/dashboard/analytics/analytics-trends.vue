<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalyticApi } from '#/models/analytic';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { NEmpty, NSpin } from 'naive-ui';

import { getOciHourlyChartApi } from '#/api';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const tenant = ref<AnalyticApi.OciHourlyChartParams['etenant']>('ynkdqe');
const tenantOptions: {
  color: string;
  value: AnalyticApi.OciHourlyChartParams['etenant'];
}[] = [
  { color: '#5ab1ef', value: 'ynkdqe' },
  { color: '#b6a2de', value: 'mrdua9x' },
  { color: '#67e0e3', value: 'nguyettun97' },
];
const response = ref<AnalyticApi.OciHourlyChartResponse | null>(null);
const loading = ref(false);
let controller: AbortController | undefined;

const hasData = computed(() => {
  const result = response.value;
  return (result?.xAxis?.data ?? []).some((_, index) =>
    (result?.series ?? []).some((series) =>
      Number.isFinite(series.data?.[index]),
    ),
  );
});

function renderChart() {
  const result = response.value;
  const labels = result?.xAxis?.data ?? [];
  void renderEcharts({
    grid: { bottom: 10, containLabel: true, left: '2%', right: '2%', top: 65 },
    legend: { top: 0 },
    tooltip: { trigger: 'axis', renderMode: 'richText' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
    },
    yAxis: { type: 'value', name: result?.unit ?? '', splitNumber: 4 },
    series: (result?.series ?? []).map((series) => ({
      name: series.name,
      type: 'line' as const,
      smooth: series.smooth,
      areaStyle: {},
      connectNulls: false,
      data: labels.map((_, index) => {
        const value = series.data?.[index];
        return {
          value:
            typeof value === 'number' && Number.isFinite(value) ? value : null,
          datesUtc: series.datesUtc?.[index],
        };
      }),
    })),
  });
}

async function loadHourlyChart() {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  loading.value = true;
  response.value = null;
  try {
    const result = await getOciHourlyChartApi(
      { etenant: tenant.value },
      request.signal,
    );
    if (!request.signal.aborted) response.value = result;
  } catch {
    // The shared request interceptor displays API errors.
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
}

onMounted(() => {
  watch(tenant, loadHourlyChart, { immediate: true });
  watch(response, renderChart, { immediate: true });
});
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-end gap-3">
      <div
        class="mr-auto flex flex-wrap items-center gap-3"
        role="group"
        :aria-label="$t('page.dashboard.analyticsPage.outbound.tenant')"
      >
        <button
          v-for="option in tenantOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-1 rounded px-1 py-1 text-xs transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          :class="
            tenant === option.value ? 'font-semibold opacity-100' : 'opacity-50'
          "
          :aria-pressed="tenant === option.value"
          @click="tenant = option.value"
        >
          <span
            aria-hidden="true"
            class="h-3.5 w-6 rounded-sm"
            :style="{ backgroundColor: option.color }"
          ></span>
          {{ option.value }}
        </button>
      </div>
      <span v-if="response" class="text-muted-foreground text-xs">
        {{ response.skuPartNumber }} · {{ response.unit }} ·
        {{ response.timeZone }}
      </span>
    </div>
    <NSpin :show="loading">
      <NEmpty
        v-if="!loading && !hasData"
        :description="$t('page.dashboard.analyticsPage.chart.empty')"
      />
      <EchartsUI ref="chartRef" />
    </NSpin>
  </div>
</template>
