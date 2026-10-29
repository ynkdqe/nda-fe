<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalyticApi } from '#/models/analytic';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  NButton,
  NDatePicker,
  NEmpty,
  NFormItem,
  NPopover,
  NSpin,
} from 'naive-ui';

import { getOciOutboundApi } from '#/api';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const month = ref(new Date().toISOString().slice(0, 7));
const monthLabel = computed(
  () => `${month.value.slice(5, 7)}/${month.value.slice(0, 4)}`,
);
const tenant = ref<AnalyticApi.OciOutboundParams['etenant']>('ynkdqe');
const tenantOptions: {
  color: string;
  value: AnalyticApi.OciOutboundParams['etenant'];
}[] = [
  { color: '#5ab1ef', value: 'ynkdqe' },
  { color: '#b6a2de', value: 'mrdua9x' },
  { color: '#67e0e3', value: 'nguyettun97' },
];
const loading = ref(false);
const response = ref<AnalyticApi.OciOutboundResponse | null>(null);
let controller: AbortController | undefined;

const totals = computed(() =>
  (response.value?.totals ?? []).filter((item) =>
    Number.isFinite(item?.quantity),
  ),
);

const daily = computed(() =>
  (response.value?.daily ?? []).filter(
    (item) =>
      item?.dateUtc?.startsWith(`${month.value}-`) &&
      Number.isFinite(item.quantity),
  ),
);

function renderChart() {
  const dates = [
    ...new Set(daily.value.map((item) => item.dateUtc.slice(0, 10))),
  ].sort();
  const units = [...new Set(daily.value.map((item) => item.unit))];
  const groups = new Map<
    string,
    { sku: string; unit: string; values: Map<string, number> }
  >();
  for (const item of daily.value) {
    const key = JSON.stringify([item.skuPartNumber, item.unit]);
    let group = groups.get(key);
    if (!group) {
      group = { sku: item.skuPartNumber, unit: item.unit, values: new Map() };
      groups.set(key, group);
    }
    const date = item.dateUtc.slice(0, 10);
    group.values.set(date, (group.values.get(date) ?? 0) + item.quantity);
  }
  void renderEcharts({
    grid: { bottom: 30, containLabel: true, left: '2%', right: '5%', top: 60 },
    legend: { show: groups.size > 1 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: {
        formatter: (value: string) =>
          `${value.slice(8, 10)}/${value.slice(5, 7)}`,
      },
      data: dates,
      name: 'UTC',
      type: 'category',
    },
    yAxis:
      units.length > 0
        ? units.map((unit, index) => ({
            name: unit,
            offset: index > 1 ? (index - 1) * 60 : 0,
            splitNumber: 4,
            type: 'value' as const,
          }))
        : [{ type: 'value' as const }],
    series: [...groups.values()].map((group) => ({
      barMaxWidth: 40,
      data: dates.map((date) => group.values.get(date) ?? null),
      name: `${group.sku} (${group.unit})`,
      type: 'bar' as const,
      yAxisIndex: units.indexOf(group.unit),
    })),
  });
}

async function loadOutbound() {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  loading.value = true;
  response.value = null;
  try {
    const result = await getOciOutboundApi(
      {
        etenant: tenant.value,
        month: Number(month.value.slice(5, 7)),
        year: Number(month.value.slice(0, 4)),
      },
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
  watch([month, tenant], loadOutbound, { immediate: true });
  watch(daily, renderChart, { immediate: true });
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
      <span class="text-muted-foreground text-xs">{{ monthLabel }}</span>
      <NPopover trigger="click" placement="bottom-end">
        <template #trigger>
          <NButton
            quaternary
            circle
            size="small"
            :aria-label="$t('page.dashboard.analyticsPage.outbound.month')"
            :title="$t('page.dashboard.analyticsPage.outbound.month')"
          >
            <template #icon>
              <IconifyIcon icon="lucide:calendar-days" />
            </template>
          </NButton>
        </template>
        <NFormItem
          :label="$t('page.dashboard.analyticsPage.outbound.month')"
          :show-feedback="false"
        >
          <NDatePicker
            v-model:formatted-value="month"
            type="month"
            format="MM/yyyy"
            value-format="yyyy-MM"
            :clearable="false"
          />
        </NFormItem>
      </NPopover>
    </div>
    <NSpin :show="loading">
      <div
        v-if="totals.length > 0"
        class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm"
        aria-live="polite"
      >
        <div v-for="(total, index) in totals" :key="index">
          <span class="text-muted-foreground">
            {{ $t('page.dashboard.analyticsPage.outbound.total') }}
            <template v-if="totals.length > 1">
              ({{ total.skuPartNumber }})</template
            >:
          </span>
          <span
            class="font-semibold tabular-nums"
            :title="String(total.quantity)"
          >
            {{ total.quantity.toFixed(2) }} {{ total.unit }}
          </span>
        </div>
      </div>
      <NEmpty
        v-if="!loading && daily.length === 0"
        :description="$t('page.dashboard.analyticsPage.outbound.empty')"
      />
      <EchartsUI ref="chartRef" />
    </NSpin>
  </div>
</template>
