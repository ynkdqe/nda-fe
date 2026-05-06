<script lang="ts" setup>
import type {
  TimesheetOverviewItem,
  TimesheetStatisticItem,
} from "#/models/hr/timesheet";

import { computed } from "vue";

import { NCard, NDivider, NProgress, NTag } from "naive-ui";

const props = defineProps<{
  monthLabel: string;
  overview: TimesheetOverviewItem[];
  statistics: TimesheetStatisticItem[];
}>();

function overviewColor(item: TimesheetOverviewItem) {
  switch (item.color) {
    case "danger": {
      return "#ff4d4f";
    }
    case "success": {
      return "#52c41a";
    }
    case "warning": {
      return "#faad14";
    }
    default: {
      return "#1677ff";
    }
  }
}

const normalizedOverview = computed(() => {
  return props.overview.map((item) => {
    const percent = item.total ? Math.min((item.value / item.total) * 100, 100) : 0;
    const text = `${item.value}${item.unit ?? ""}/${item.total}${item.unit ?? ""}`;

    return { ...item, percent, text };
  });
});
</script>

<template>
  <NCard class="timesheet-monthly-detail" :bordered="false">
    <div class="monthly-detail__header">
      <h3 class="monthly-detail__title">Tổng quan tháng {{ monthLabel }}</h3>
      <p class="monthly-detail__subtitle">Theo dõi công, giờ làm và trạng thái chấm công</p>
    </div>

    <div class="monthly-detail__overview">
      <div
        v-for="item in normalizedOverview"
        :key="item.label"
        class="monthly-detail__overview-item"
      >
        <div class="monthly-detail__overview-label">{{ item.label }}</div>
        <div class="monthly-detail__overview-value">{{ item.text }}</div>
        <NProgress
          :percentage="item.percent"
          :show-indicator="false"
          :color="overviewColor(item)"
        />
      </div>
    </div>

    <NDivider class="monthly-detail__divider">Ngày công</NDivider>

    <div class="monthly-detail__stats">
      <div v-for="stat in statistics" :key="stat.label" class="monthly-detail__stat-item">
        <div class="monthly-detail__stat-label">{{ stat.label }}</div>
        <div class="monthly-detail__stat-value">{{ stat.value }}</div>
        <NTag v-if="stat.trend" :type="stat.trend === 'up' ? 'success' : 'warning'">
          {{ stat.trend === "up" ? "Tăng" : "Cần chú ý" }}
        </NTag>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.timesheet-monthly-detail {
  height: 100%;
}

.monthly-detail__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.monthly-detail__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.65;
}

.monthly-detail__overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.monthly-detail__overview-item,
.monthly-detail__stat-item {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
}

.monthly-detail__overview-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.monthly-detail__overview-label {
  font-size: 14px;
  font-weight: 700;
}

.monthly-detail__overview-value {
  font-size: 16px;
  font-weight: 800;
  color: #1677ff;
}

.monthly-detail__divider {
  margin: 24px 0 16px;
  font-weight: 700;
}

.monthly-detail__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.monthly-detail__stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
}

.monthly-detail__stat-label {
  font-size: 13px;
  opacity: 0.65;
}

.monthly-detail__stat-value {
  font-size: 20px;
  font-weight: 700;
}
</style>
