<script lang="ts" setup>
import type {
  TimesheetOverviewItem,
  TimesheetStatisticItem,
} from './components/TimesheetMonthlyDetail.vue';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { getTimesheetListApi } from '#/api';

import TimesheetCalendar from './components/TimesheetCalendar.vue';
import TimesheetMonthlyDetail from './components/TimesheetMonthlyDetail.vue';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1);
}

function formatMonthLabel(value: string) {
  const date = parseDateKey(value);
  return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function addMonths(value: Date, offset: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + offset, 1);
  return date;
}

const currentMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
);
const allowedMonths = Array.from({ length: 3 }, (_, index) => {
  const date = addMonths(currentMonth, -index);
  const value = toDateKey(date);

  return { value };
});
const minAllowedMonth = allowedMonths.at(-1)?.value;
const maxAllowedMonth = allowedMonths[0]?.value;

const today = toDateKey(new Date());
const calendarValue = ref(toDateKey(currentMonth));
const selectedDate = ref(today);
const dataSource = ref<Awaited<ReturnType<typeof getTimesheetListApi>>>();
const loading = ref(false);

async function fetchTimesheetData(selected?: string) {
  loading.value = true;

  try {
    const target = parseDateKey(selected ?? calendarValue.value);
    dataSource.value = await getTimesheetListApi({
      month: target.getMonth() + 1,
      year: target.getFullYear(),
    });
  } finally {
    loading.value = false;
  }
}

const overviewMetrics = computed<TimesheetOverviewItem[]>(() => {
  const dataExtend = dataSource.value?.dataExtend;

  return [
    {
      color: 'primary',
      label: 'Ngày công thực tế',
      total: dataExtend?.workdays ?? 0,
      value: dataExtend?.actualWorkdays ?? 0,
    },
    {
      color: 'success',
      label: 'Giờ làm thực tế',
      total: dataExtend?.workHours ?? 0,
      unit: 'h',
      value: dataExtend?.actualWorkHours ?? 0,
    },
  ];
});

const statistics = computed<TimesheetStatisticItem[]>(() => {
  const dataExtend = dataSource.value?.dataExtend;

  return [
    {
      label: 'Tổng công',
      value: dataExtend?.actualWorkdays?.toString() ?? '0',
    },
    { label: 'Giờ làm', value: `${dataExtend?.actualWorkHours ?? 0}h` },
    {
      label: 'Đi muộn/về sớm',
      trend: 'down',
      value: dataExtend?.earlyLate ?? 0,
    },
    {
      label: 'Thiếu check-in/out',
      trend: 'down',
      value: dataExtend?.missing ?? 0,
    },
    {
      label: 'Nghỉ phép năm',
      value: dataExtend?.annualLeave?.toString() ?? '0',
    },
    { label: 'Tăng ca', trend: 'up', value: `${dataExtend?.overtime ?? 0}h` },
    { label: 'Nghỉ có lương', value: dataExtend?.paidLeave?.toString() ?? '0' },
    {
      label: 'Nghỉ không lương',
      value: dataExtend?.unpaidLeave?.toString() ?? '0',
    },
  ];
});

onMounted(() => fetchTimesheetData(calendarValue.value));

watch(calendarValue, (value) => {
  selectedDate.value = value;
  fetchTimesheetData(value);
});
</script>

<template>
  <Page>
    <div class="timesheet-page">
      <div class="timesheet-layout">
        <TimesheetCalendar
          v-model:model-value="calendarValue"
          v-model:selected-date="selectedDate"
          :loading="loading"
          :max-month="maxAllowedMonth"
          :min-month="minAllowedMonth"
          :timesheet-data="dataSource?.data"
        />
        <TimesheetMonthlyDetail
          :month-label="formatMonthLabel(calendarValue)"
          :overview="overviewMetrics"
          :statistics="statistics"
        />
      </div>
    </div>
  </Page>
</template>

<style scoped>
.timesheet-page {
  padding: 16px;
}

.timesheet-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 1200px) {
  .timesheet-layout {
    grid-template-columns: minmax(0, 2.5fr) minmax(0, 1fr);
  }
}
</style>
