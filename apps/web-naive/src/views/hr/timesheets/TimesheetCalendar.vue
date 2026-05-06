<script lang="ts" setup>
import type {
  TimesheetApi,
  TimesheetCalendarBadge,
  TimesheetCalendarDay,
  TimesheetCalendarEntryType,
} from "#/models/hr/timesheet";

import { computed } from "vue";

import { NButton, NCard, NSpin } from "naive-ui";

const props = defineProps<{
  loading?: boolean;
  maxMonth?: string;
  minMonth?: string;
  modelValue?: string;
  selectedDate: string;
  timesheetData?: TimesheetApi.TimesheetItem[];
}>();

const emit = defineEmits<{
  "update:modelValue": [string];
  "update:selectedDate": [string];
}>();

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value?: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year || new Date().getFullYear(), (month || 1) - 1, day || 1);
}

function formatTime(value?: null | string) {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isSameDay(left: string, right: string) {
  return left === right;
}

const calendarValue = computed({
  get: () => props.modelValue ?? toDateKey(new Date()),
  set: (value: string) => emit("update:modelValue", value),
});

const calendarDate = computed(() => parseDateKey(calendarValue.value));

const monthLabel = computed(() => {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(calendarDate.value);
});

const calendarData = computed(() => {
  const result: Record<string, TimesheetCalendarDay> = {};

  (props.timesheetData ?? []).forEach((record) => {
    if (!record.dateSheet) {
      return;
    }

    const dateKey = toDateKey(record.dateSheet);
    const isHoliday = !!record.holiday;
    const badges: TimesheetCalendarBadge[] = [];
    let entryType: TimesheetCalendarEntryType = "work";

    if (isHoliday) {
      entryType = "holiday";
      badges.push({ text: "Ngày nghỉ", type: "purple" });
    } else if (record.isAbsent) {
      entryType = "absent";
      badges.push({ text: "Vắng", type: "danger" });
    } else if (record.isMissing) {
      entryType = "missing";
      badges.push({ text: "Thiếu công", type: "danger" });
    } else if (record.isLate) {
      entryType = "late";
      badges.push({ text: "Đi muộn", type: "warning" });
    }

    const workPoint = record.workshift?.workPoint ?? 1;
    const actualPoint = record.actualPoint ?? 0;
    let highlightType: "danger" | "primary" | "success" | "warning" = "primary";

    if (actualPoint === 0) {
      highlightType = "danger";
    } else if (actualPoint === workPoint) {
      highlightType = "success";
    } else if (actualPoint > 0 && actualPoint < workPoint) {
      highlightType = "warning";
    } else if (isHoliday) {
      highlightType = "warning";
    }

    const holidayLabel = record.holiday?.holidayTypeName ?? record.holiday?.name ?? "Ngày nghỉ";
    const isUnpaidHoliday = isHoliday && record.holiday?.isPaid === false;

    result[dateKey] = isUnpaidHoliday
      ? {
          badges: [{ text: holidayLabel, type: "default" }],
          date: dateKey,
          entries: [],
        }
      : {
          badges,
          date: dateKey,
          entries: isHoliday
            ? [
                {
                  label: holidayLabel,
                  note: record.holiday?.description ?? record.description ?? "",
                  timeRange: "",
                  type: "holiday",
                },
              ]
            : [
                {
                  label: record.workshift?.nameAscii ?? record.workshift?.name ?? "",
                  note: record.description ?? "",
                  timeRange: `${formatTime(record.checkIn)} - ${formatTime(record.checkOut)}`,
                  type: entryType,
                },
              ],
          highlight: {
            type: highlightType,
            value: `${actualPoint}`,
          },
        };
  });

  return result;
});

const monthDays = computed(() => {
  const firstDay = new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
});

function getMonthKey(value: string) {
  const date = parseDateKey(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function canGoMonth(offset: number) {
  const date = new Date(calendarDate.value);
  date.setMonth(date.getMonth() + offset, 1);
  const nextKey = getMonthKey(toDateKey(date));
  const minKey = props.minMonth ? getMonthKey(props.minMonth) : undefined;
  const maxKey = props.maxMonth ? getMonthKey(props.maxMonth) : undefined;

  if (minKey && nextKey < minKey) {
    return false;
  }

  if (maxKey && nextKey > maxKey) {
    return false;
  }

  return true;
}

function changeMonth(offset: number) {
  if (!canGoMonth(offset)) {
    return;
  }

  const date = new Date(calendarDate.value);
  date.setMonth(date.getMonth() + offset, 1);
  const next = toDateKey(date);
  calendarValue.value = next;
  emit("update:selectedDate", next);
}

function getDay(value: Date) {
  return calendarData.value[toDateKey(value)];
}

function isOtherMonth(value: Date) {
  return value.getMonth() !== calendarDate.value.getMonth();
}

function isToday(value: Date) {
  return isSameDay(toDateKey(value), toDateKey(new Date()));
}

function isSelected(value: Date) {
  return isSameDay(toDateKey(value), props.selectedDate);
}

function selectDate(value: Date) {
  if (isOtherMonth(value)) {
    return;
  }

  emit("update:selectedDate", toDateKey(value));
}

function entryClass(type: TimesheetCalendarEntryType) {
  return `calendar-entry--${type}`;
}

function highlightClass(type?: string) {
  return type ? `calendar-highlight--${type}` : "calendar-highlight--primary";
}

function badgeClass(type?: string) {
  return type ? `calendar-badge--${type}` : "calendar-badge--default";
}
</script>

<template>
  <NCard class="calendar-card" :bordered="false">
    <template #header>
      <div class="calendar-toolbar">
        <NButton size="small" quaternary :disabled="!canGoMonth(-1)" @click="changeMonth(-1)">
          Tháng trước
        </NButton>
        <div class="calendar-title">{{ monthLabel }}</div>
        <NButton size="small" quaternary :disabled="!canGoMonth(1)" @click="changeMonth(1)">
          Tháng sau
        </NButton>
      </div>
    </template>

    <NSpin :show="loading">
      <div class="calendar-weekdays">
        <div v-for="day in weekDays" :key="day" class="calendar-weekday">
          {{ day }}
        </div>
      </div>

      <div class="calendar-grid">
        <button
          v-for="day in monthDays"
          :key="toDateKey(day)"
          class="calendar-cell"
          :class="{
            'calendar-cell--other-month': isOtherMonth(day),
            'calendar-cell--selected': isSelected(day),
            'calendar-cell--today': isToday(day),
          }"
          type="button"
          @click="selectDate(day)"
        >
          <div class="calendar-cell__header">
            <span class="calendar-cell__date">{{ day.getDate() }}</span>
            <span
              v-if="getDay(day)?.highlight"
              class="calendar-highlight"
              :class="highlightClass(getDay(day)?.highlight?.type)"
            >
              {{ getDay(day)?.highlight?.value }}
            </span>
          </div>

          <div class="calendar-cell__entries">
            <div
              v-for="entry in getDay(day)?.entries ?? []"
              :key="entry.timeRange + entry.label"
              class="calendar-entry"
              :class="entryClass(entry.type)"
            >
              <div v-if="entry.timeRange" class="calendar-entry__time">
                {{ entry.timeRange }}
              </div>
              <div v-if="entry.type !== 'holiday'" class="calendar-entry__label">
                {{ entry.label }}
              </div>
              <div v-if="entry.note" class="calendar-entry__note">
                {{ entry.note }}
              </div>
            </div>
          </div>

          <div v-if="(getDay(day)?.badges ?? []).length > 0" class="calendar-cell__badges">
            <span
              v-for="badge in getDay(day)?.badges ?? []"
              :key="badge.text + badge.type"
              class="calendar-badge"
              :class="badgeClass(badge.type)"
            >
              {{ badge.text }}
            </span>
          </div>
        </button>
      </div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.calendar-card {
  height: 100%;
}

.calendar-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.calendar-title {
  font-size: 18px;
  font-weight: 700;
  text-transform: capitalize;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-weekday {
  padding: 8px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  opacity: 0.7;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 120px;
  padding: 6px;
  text-align: left;
  cursor: pointer;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.calendar-cell:hover,
.calendar-cell--today {
  border-color: rgb(22 119 255 / 35%);
}

.calendar-cell--selected {
  border-color: rgb(22 119 255 / 60%);
  box-shadow: 0 0 0 1px rgb(22 119 255 / 30%);
}

.calendar-cell--other-month {
  pointer-events: none;
  opacity: 0.15;
}

.calendar-cell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.calendar-cell__date {
  font-size: 16px;
}

.calendar-highlight,
.calendar-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
}

.calendar-highlight {
  min-width: 32px;
  padding: 1px 6px;
}

.calendar-highlight--primary,
.calendar-badge--primary {
  color: #1677ff;
  background-color: rgb(22 119 255 / 12%);
}

.calendar-highlight--success,
.calendar-badge--success {
  color: #389e0d;
  background-color: rgb(82 196 26 / 18%);
}

.calendar-highlight--warning,
.calendar-badge--warning {
  color: #d48806;
  background-color: rgb(250 173 20 / 18%);
}

.calendar-highlight--danger,
.calendar-badge--danger {
  color: #cf1322;
  background-color: rgb(255 77 79 / 18%);
}

.calendar-badge--purple {
  color: #722ed1;
  background-color: rgb(114 46 209 / 15%);
}

.calendar-badge--default {
  background-color: rgb(0 0 0 / 6%);
}

.calendar-cell__entries {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.calendar-entry {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  border-radius: 6px;
}

.calendar-entry__time,
.calendar-entry__label {
  font-weight: 700;
}

.calendar-entry__note {
  font-size: 11px;
  opacity: 0.75;
}

.calendar-entry--work {
  color: #0958d9;
  background-color: rgb(22 119 255 / 8%);
}

.calendar-entry--late {
  color: #d4380d;
  background-color: rgb(245 161 6 / 12%);
}

.calendar-entry--absent,
.calendar-entry--missing {
  color: #cf1322;
  background-color: rgb(255 77 79 / 12%);
}

.calendar-entry--holiday {
  color: #722ed1;
  background-color: rgb(114 46 209 / 12%);
}

.calendar-cell__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.calendar-badge {
  padding: 2px 6px;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .calendar-cell {
    min-height: 100px;
  }
}
</style>
