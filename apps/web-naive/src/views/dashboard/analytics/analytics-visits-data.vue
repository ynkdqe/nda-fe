<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    legend: {
      bottom: 0,
      data: [
        $t('page.dashboard.analyticsPage.chart.visits'),
        $t('page.dashboard.analyticsPage.chart.trend'),
      ],
    },
    radar: {
      indicator: [
        {
          name: $t('page.dashboard.analyticsPage.platform.web'),
        },
        {
          name: $t('page.dashboard.analyticsPage.platform.mobile'),
        },
        {
          name: $t('page.dashboard.analyticsPage.platform.ipad'),
        },
        {
          name: $t('page.dashboard.analyticsPage.platform.client'),
        },
        {
          name: $t('page.dashboard.analyticsPage.platform.thirdParty'),
        },
        {
          name: $t('page.dashboard.analyticsPage.platform.other'),
        },
      ],
      radius: '60%',
      splitNumber: 8,
    },
    series: [
      {
        areaStyle: {
          opacity: 1,
          shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,.2)',
          shadowOffsetX: 0,
          shadowOffsetY: 10,
        },
        data: [
          {
            itemStyle: {
              color: '#b6a2de',
            },
            name: $t('page.dashboard.analyticsPage.chart.visits'),
            value: [90, 50, 86, 40, 50, 20],
          },
          {
            itemStyle: {
              color: '#5ab1ef',
            },
            name: $t('page.dashboard.analyticsPage.chart.trend'),
            value: [70, 75, 70, 76, 20, 85],
          },
        ],
        itemStyle: {
          // borderColor: '#fff',
          borderRadius: 10,
          borderWidth: 2,
        },
        symbolSize: 0,
        type: 'radar',
      },
    ],
    tooltip: {},
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
