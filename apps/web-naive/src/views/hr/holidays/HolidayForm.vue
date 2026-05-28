<script lang="ts" setup>
import type {
  HolidayApi,
  HolidayFormState,
  HolidayTypeOption,
  WeekendQuickMode,
} from '#/models/hr/holiday';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';

const emit = defineEmits<{
  submit: [Record<string, any>];
}>();

const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const holidayTypes = ref<HolidayTypeOption[]>([]);
const calendarMonth = ref(new Date().getMonth() + 1);
const calendarYear = ref(new Date().getFullYear());
const manualDates = ref(new Set<string>());
const autoWeekendDates = ref(new Set<string>());
const form = ref<HolidayFormState>(createDefaultForm());

const title = computed(() => {
  const data = drawerApi.getData<{ record: HolidayApi.HolidayItem | null }>();
  return data.record ? 'Sửa ngày nghỉ' : 'Thêm ngày nghỉ';
});

const monthLabel = computed(() => {
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(calendarYear.value, calendarMonth.value - 1, 1));
});

const weekendQuickMode = computed<WeekendQuickMode>({
  get() {
    if (form.value.weekendFull) {
      return 'weekend';
    }

    if (form.value.saturdayOnly) {
      return 'saturday';
    }

    if (form.value.sundayOnly) {
      return 'sunday';
    }

    return 'none';
  },
  set(value) {
    form.value.saturdayOnly = value === 'saturday';
    form.value.sundayOnly = value === 'sunday';
    form.value.weekendFull = value === 'weekend';
  },
});

const weekendMode = computed(() => weekendQuickMode.value !== 'none');

const calendarDays = computed(() => {
  const firstDate = new Date(calendarYear.value, calendarMonth.value - 1, 1);
  const firstDayOfWeek = firstDate.getDay() || 7;
  const start = new Date(firstDate);
  start.setDate(firstDate.getDate() - firstDayOfWeek + 1);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
});

function createDefaultForm(): HolidayFormState {
  return {
    dates: [],
    description: '',
    holidayType: null,
    name: '',
    saturdayOnly: false,
    sundayOnly: false,
    weekendFull: false,
  };
}

function formatDateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return formatDateToYmd(value);
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : formatDateToYmd(date);
  }

  if (typeof value === 'string') {
    const ymdMatch = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (ymdMatch) {
      return ymdMatch[0];
    }

    const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : formatDateToYmd(date);
  }

  return null;
}

function updateFormDates() {
  const combined = new Set<string>([
    ...autoWeekendDates.value,
    ...manualDates.value,
  ]);
  form.value.dates = [...combined].toSorted();
}

function computeAutoWeekends(month: number, year: number) {
  autoWeekendDates.value.clear();

  if (!weekendMode.value || !year || !month || month < 1 || month > 12) {
    return;
  }

  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    if (
      (form.value.weekendFull && (isSaturday || isSunday)) ||
      (form.value.saturdayOnly && isSaturday) ||
      (form.value.sundayOnly && isSunday)
    ) {
      autoWeekendDates.value.add(formatDateToYmd(date));
    }

    date.setDate(date.getDate() + 1);
  }
}

function resetForm() {
  form.value = createDefaultForm();
  manualDates.value.clear();
  autoWeekendDates.value.clear();
  calendarMonth.value = new Date().getMonth() + 1;
  calendarYear.value = new Date().getFullYear();
}

function syncRecord(record?: HolidayApi.HolidayItem | null) {
  resetForm();

  if (!record) {
    return;
  }

  const date = normalizeDate(record.date);
  form.value = {
    ...form.value,
    description: record.description ?? '',
    holidayType: record.holidayType ?? record.type ?? null,
    name: record.name ?? '',
  };

  if (date) {
    manualDates.value.add(date);
    const parsedDate = new Date(date);
    calendarMonth.value = parsedDate.getMonth() + 1;
    calendarYear.value = parsedDate.getFullYear();
    updateFormDates();
  }
}

function isOtherMonth(date: Date) {
  return date.getMonth() !== calendarMonth.value - 1;
}

function isSelected(date: Date) {
  return form.value.dates.includes(formatDateToYmd(date));
}

function isToday(date: Date) {
  return formatDateToYmd(date) === formatDateToYmd(new Date());
}

function selectDate(date: Date) {
  if (weekendMode.value || isOtherMonth(date)) {
    return;
  }

  const value = formatDateToYmd(date);
  if (manualDates.value.has(value)) {
    manualDates.value.delete(value);
  } else {
    manualDates.value.add(value);
  }

  updateFormDates();
}

function changeMonth(offset: number) {
  const date = new Date(
    calendarYear.value,
    calendarMonth.value - 1 + offset,
    1,
  );
  calendarMonth.value = date.getMonth() + 1;
  calendarYear.value = date.getFullYear();
  computeAutoWeekends(calendarMonth.value, calendarYear.value);
  updateFormDates();
}

function goCurrentMonth() {
  calendarMonth.value = new Date().getMonth() + 1;
  calendarYear.value = new Date().getFullYear();
  computeAutoWeekends(calendarMonth.value, calendarYear.value);
  updateFormDates();
}

function clearSelection() {
  manualDates.value.clear();
  updateFormDates();
}

function removeDate(date: string) {
  manualDates.value.delete(date);
  autoWeekendDates.value.delete(date);
  updateFormDates();
}

async function handleSubmit() {
  const name = form.value.name.trim();
  const description = form.value.description.trim();

  if (!name) {
    message.error('Vui lòng nhập tên ngày nghỉ');
    return;
  }

  if (!form.value.holidayType) {
    message.error('Vui lòng chọn loại ngày nghỉ');
    return;
  }

  if (form.value.dates.length === 0) {
    message.error('Vui lòng chọn ít nhất một ngày nghỉ');
    return;
  }

  emit('submit', {
    ...form.value,
    dates: [...form.value.dates].toSorted(),
    description,
    name,
  });
}

watch(
  () => weekendQuickMode.value,
  () => {
    computeAutoWeekends(calendarMonth.value, calendarYear.value);
    updateFormDates();
  },
);

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
      return;
    }

    const data = drawerApi.getData<{
      holidayTypes?: HolidayTypeOption[];
      record: HolidayApi.HolidayItem | null;
    }>();

    holidayTypes.value = data.holidayTypes ?? [];
    syncRecord(data.record);
  },
});

defineExpose({
  drawerApi,
  resetForm,
});
</script>

<template>
  <Drawer :title="title" class="md:w-[900px]">
    <div class="holiday-form-wrap">
      <NForm :model="form" label-placement="top">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem label="Tên ngày nghỉ" required>
            <NInput
              v-model:value="form.name"
              clearable
              placeholder="Nhập tên ngày nghỉ"
            />
          </NFormItem>

          <NFormItem label="Loại ngày nghỉ" required>
            <NSelect
              v-model:value="form.holidayType"
              clearable
              :options="holidayTypes"
              placeholder="Chọn loại ngày nghỉ"
            />
          </NFormItem>
        </div>

        <NFormItem label="Chọn nhanh cuối tuần">
          <NRadioGroup
            v-model:value="weekendQuickMode"
            class="weekend-mode-options"
            name="weekendQuickMode"
          >
            <NRadioButton value="none">Không chọn nhanh</NRadioButton>
            <NRadioButton value="saturday">Chỉ thứ 7</NRadioButton>
            <NRadioButton value="sunday">Chỉ chủ nhật</NRadioButton>
            <NRadioButton value="weekend">Thứ 7 và chủ nhật</NRadioButton>
          </NRadioGroup>
        </NFormItem>

        <NFormItem label="Ngày nghỉ" required>
          <div class="holiday-calendar">
            <div class="holiday-calendar__toolbar">
              <NButton size="small" secondary @click="changeMonth(-1)">
                Tháng trước
              </NButton>
              <div class="holiday-calendar__title">{{ monthLabel }}</div>
              <div class="holiday-calendar__actions">
                <NButton size="small" secondary @click="goCurrentMonth">
                  Hôm nay
                </NButton>
                <NButton size="small" secondary @click="changeMonth(1)">
                  Tháng sau
                </NButton>
              </div>
            </div>

            <div class="holiday-calendar__weekdays">
              <div
                v-for="day in weekDays"
                :key="day"
                class="holiday-calendar__weekday"
              >
                {{ day }}
              </div>
            </div>

            <div class="holiday-calendar__grid">
              <button
                v-for="day in calendarDays"
                :key="formatDateToYmd(day)"
                class="holiday-calendar__cell"
                :class="{
                  'holiday-calendar__cell--disabled':
                    weekendMode || isOtherMonth(day),
                  'holiday-calendar__cell--other-month': isOtherMonth(day),
                  'holiday-calendar__cell--selected': isSelected(day),
                  'holiday-calendar__cell--today': isToday(day),
                }"
                :disabled="weekendMode || isOtherMonth(day)"
                type="button"
                @click="selectDate(day)"
              >
                <span class="holiday-calendar__date">{{ day.getDate() }}</span>
              </button>
            </div>

            <div class="holiday-calendar__footer">
              <NButton
                dashed
                :disabled="manualDates.size === 0"
                @click="clearSelection"
              >
                Xóa ngày chọn thủ công
              </NButton>
              <span v-if="weekendMode" class="holiday-calendar__hint">
                Đang bật chọn nhanh cuối tuần, không thể chọn thủ công trên
                lịch.
              </span>
            </div>
          </div>
        </NFormItem>

        <div v-if="form.dates.length > 0" class="selected-dates">
          <NTag
            v-for="date in form.dates"
            :key="date"
            closable
            type="info"
            @close="removeDate(date)"
          >
            {{ formatDate(date, 'DD-MM-YYYY') }}
          </NTag>
        </div>

        <NFormItem label="Mô tả">
          <NInput
            v-model:value="form.description"
            clearable
            placeholder="Nhập mô tả"
            :rows="3"
            type="textarea"
          />
        </NFormItem>
      </NForm>
    </div>
  </Drawer>
</template>

<style scoped>
.holiday-form-wrap {
  padding: 4px;
}

.holiday-calendar {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.holiday-calendar__toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.holiday-calendar__title {
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
}

.holiday-calendar__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.holiday-calendar__weekdays,
.holiday-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.holiday-calendar__weekday {
  padding: 8px 0;
  font-weight: 600;
  color: var(--text-color-2);
  text-align: center;
}

.holiday-calendar__cell {
  min-height: 44px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.holiday-calendar__cell:hover {
  border-color: var(--primary-color);
}

.holiday-calendar__cell--other-month {
  color: var(--text-color-disabled);
  cursor: not-allowed;
  background-color: var(--body-color);
  border-color: var(--border-color);
  opacity: 0.55;
}

.holiday-calendar__cell--today {
  border-color: var(--primary-color);
}

.holiday-calendar__cell--selected {
  background-color: rgb(24 160 88 / 10%);
  border-color: var(--primary-color);
  box-shadow: inset 0 0 0 1px var(--primary-color);
}

.holiday-calendar__cell--selected .holiday-calendar__date {
  font-weight: 700;
  color: #fff;
  background-color: var(--primary-color);
}

.holiday-calendar__cell--today:not(.holiday-calendar__cell--selected)
  .holiday-calendar__date {
  font-weight: 700;
  color: var(--primary-color);
  box-shadow: inset 0 0 0 1px var(--primary-color);
}

.holiday-calendar__cell--disabled {
  cursor: not-allowed;
}

.holiday-calendar__cell--disabled:hover {
  border-color: var(--border-color);
}

.holiday-calendar__date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.holiday-calendar__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
}

.holiday-calendar__hint {
  color: var(--text-color-2);
}

.selected-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .holiday-calendar {
    padding: 8px;
  }

  .holiday-calendar__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .holiday-calendar__actions {
    justify-content: space-between;
  }

  .holiday-calendar__weekdays,
  .holiday-calendar__grid {
    gap: 4px;
  }

  .holiday-calendar__cell {
    min-height: 36px;
  }
}
</style>
