<script lang="ts" setup>
import type {
  TimesheetOverviewItem,
  TimesheetStatisticItem,
} from '#/models/hr/timesheet';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NCard } from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  getEmployeeByIdApi,
  getTimesheetListApi,
  syncTimesheetsApi,
  syncTimesheetsV2Api,
} from '#/api';
import EmployeeSearchSelect from '#/components/EmployeeSearchSelect.vue';

import TimesheetCalendar from './TimesheetCalendar.vue';
import TimesheetMonthlyDetail from './TimesheetMonthlyDetail.vue';

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

function getMonthStartPeriod(value: string) {
  const date = parseDateKey(value);
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/01`;
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
const allowedMonths = Array.from({ length: 6 }, (_, index) => {
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
const selectedEmployeeId = ref<number | string>();
const { hasAccessByCodes } = useAccess();
const canViewAll = computed(() => hasAccessByCodes(['TimeSheet.ViewAll']));
let requestSequence = 0;

function selectEmployee(
  value: (number | string)[] | number | string | undefined,
) {
  if (!canViewAll.value) return;
  selectedEmployeeId.value = Array.isArray(value) ? undefined : value;
}

function handleSync(version: 'v1' | 'v2') {
  const period = getMonthStartPeriod(calendarValue.value);
  const request = version === 'v1' ? syncTimesheetsApi : syncTimesheetsV2Api;

  request(period).catch(() => {
    message.error($t('page.hr.attendancePage.sync.error'));
  });
  message.success($t('page.hr.attendancePage.sync.success'));
}

async function fetchTimesheetData() {
  const sequence = ++requestSequence;
  const target = parseDateKey(calendarValue.value);
  const employeeId = canViewAll.value ? selectedEmployeeId.value : undefined;
  loading.value = true;
  dataSource.value = undefined;

  try {
    let userId: string | undefined;
    if (employeeId !== undefined) {
      // EmployeeSearchSelect returns employee.id, not the linked account's userId.
      const employee = await getEmployeeByIdApi(employeeId);
      if (sequence !== requestSequence) return;
      userId = employee.data?.userId?.trim() || undefined;
      if (!userId) {
        message.warning($t('page.hr.attendancePage.employeeFilter.noAccount'));
        return;
      }
      if (!canViewAll.value) return;
    }
    const result = await getTimesheetListApi({
      month: target.getMonth() + 1,
      year: target.getFullYear(),
      ...(userId ? { userId } : {}),
    });
    // A previous employee/month request must never overwrite the current selection.
    if (sequence === requestSequence) dataSource.value = result;
  } catch {
    // The request interceptor displays backend errors; keep the current view empty.
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
}

const overviewMetrics = computed<TimesheetOverviewItem[]>(() => {
  const dataExtend = dataSource.value?.dataExtend;

  return [
    {
      color: 'primary',
      label: $t('page.hr.attendancePage.summary.actualWorkdays'),
      total: dataExtend?.workdays ?? 0,
      value: dataExtend?.actualWorkdays ?? 0,
    },
    {
      color: 'success',
      label: $t('page.hr.attendancePage.summary.actualWorkHours'),
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
      label: $t('page.hr.attendancePage.summary.totalWorkdays'),
      value: dataExtend?.actualWorkdays?.toString() ?? '0',
    },
    {
      label: $t('page.hr.attendancePage.summary.workingHours'),
      value: `${dataExtend?.actualWorkHours ?? 0}h`,
    },
    {
      label: $t('page.hr.attendancePage.status.lateOrEarly'),
      trend: 'down',
      value: dataExtend?.earlyLate ?? 0,
    },
    {
      label: $t('page.hr.attendancePage.summary.missingCheckInOut'),
      trend: 'down',
      value: dataExtend?.missing ?? 0,
    },
    {
      label: $t('page.hr.attendancePage.summary.annualLeave'),
      value: dataExtend?.annualLeave?.toString() ?? '0',
    },
    {
      label: $t('page.hr.attendancePage.summary.overtime'),
      trend: (dataExtend?.overtime ?? 0) > 0 ? 'up' : undefined,
      value: `${dataExtend?.overtime ?? 0}h`,
    },
    {
      label: $t('page.hr.attendancePage.summary.paidLeave'),
      value: dataExtend?.paidLeave?.toString() ?? '0',
    },
    {
      label: $t('page.hr.attendancePage.summary.unpaidLeave'),
      value: dataExtend?.unpaidLeave?.toString() ?? '0',
    },
  ];
});

watch(
  [calendarValue, selectedEmployeeId, canViewAll],
  ([month, employeeId, allowed]) => {
    if (!allowed && employeeId !== undefined) {
      selectedEmployeeId.value = undefined;
      return;
    }
    selectedDate.value = month === toDateKey(currentMonth) ? today : month;
    void fetchTimesheetData();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  requestSequence += 1;
});
</script>

<template>
  <Page>
    <div class="timesheet-page">
      <NCard v-if="canViewAll" :bordered="false" class="mb-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label for="attendance-employee" class="shrink-0 text-sm font-medium">
            {{ $t('page.hr.attendancePage.employeeFilter.label') }}
          </label>
          <EmployeeSearchSelect
            id="attendance-employee"
            class="w-full sm:w-80"
            mode="single"
            :disabled="!canViewAll"
            :model-value="selectedEmployeeId"
            :placeholder="
              $t('page.hr.attendancePage.employeeFilter.placeholder')
            "
            @update:model-value="selectEmployee"
          />
          <span class="text-sm text-muted-foreground">
            {{ $t('page.hr.attendancePage.employeeFilter.hint') }}
          </span>
        </div>
      </NCard>
      <div class="timesheet-layout">
        <TimesheetCalendar
          v-model:model-value="calendarValue"
          v-model:selected-date="selectedDate"
          :loading="loading"
          :max-month="maxAllowedMonth"
          :min-month="minAllowedMonth"
          :timesheet-data="dataSource?.data ?? []"
        />
        <TimesheetMonthlyDetail
          :month-label="formatMonthLabel(calendarValue)"
          :overview="overviewMetrics"
          :statistics="statistics"
          @sync="handleSync"
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

@media (max-width: 640px) {
  .timesheet-page {
    padding: 12px;
  }
}

@media (min-width: 1200px) {
  .timesheet-layout {
    grid-template-columns: minmax(0, 2.5fr) minmax(0, 1fr);
  }
}
</style>
