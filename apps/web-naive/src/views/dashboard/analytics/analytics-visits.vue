<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalyticApi } from '#/models/analytic';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { NDatePicker, NEmpty, NFormItem, NSelect, NSpin } from 'naive-ui';

import { getOciOutboundApi } from '#/api';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const month = ref(new Date().toISOString().slice(0, 7));
const tenant = ref<AnalyticApi.OciOutboundParams['etenant']>('ynkdqe');
const tenantOptions = ['ynkdqe', 'mrdua9x', 'nguyettun97'].map((value) => ({
  label: value,
  value,
}));
const loading = ref(false);
const response = ref<AnalyticApi.OciOutboundResponse | null>(null);
let controller: AbortController | undefined;

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
    xAxis: { data: dates, name: 'UTC', type: 'category' },
    yAxis: units.length > 0
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
      { etenant: tenant.value, month: month.value },
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
    <div class="flex flex-wrap gap-x-4">
      <NFormItem :label="$t('page.dashboard.analyticsPage.outbound.tenant')">
        <NSelect v-model:value="tenant" :options="tenantOptions" class="w-52" />
      </NFormItem>
      <NFormItem :label="$t('page.dashboard.analyticsPage.outbound.month')">
        <NDatePicker
          v-model:formatted-value="month"
          type="month"
          value-format="yyyy-MM"
          :clearable="false"
        />
      </NFormItem>
    </div>
    <NSpin :show="loading">
      <NEmpty
        v-if="!loading && daily.length === 0"
        :description="$t('page.dashboard.analyticsPage.outbound.empty')"
      />
      <EchartsUI ref="chartRef" />
    </NSpin>
  </div>
</template>
