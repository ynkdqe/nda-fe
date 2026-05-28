<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type {
  WorkShiftFormModel,
  WorkShiftRecord,
} from '#/models/hr/workshift';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NTimePicker,
} from 'naive-ui';

const emit = defineEmits<{
  submit: [Record<string, any>];
  'update:open': [boolean];
}>();

const formRef = ref<FormInst | null>(null);

function createInitialForm(): WorkShiftFormModel {
  return {
    breakFrom: null,
    breakTo: null,
    code: '',
    flexible: false,
    fromTime: null,
    hasBreak: false,
    isDefault: false,
    maxCheckIn: null,
    maxCheckOut: null,
    minCheckIn: null,
    minCheckOut: null,
    name: '',
    nameAscii: '',
    overShift: false,
    toTime: null,
    workHours: 0,
    workPoint: 0,
  };
}

const form = reactive<WorkShiftFormModel>(createInitialForm());

const rules: FormRules = {
  code: [
    {
      max: 10,
      message: 'Mã ca tối đa 10 ký tự',
      trigger: ['blur', 'input'],
    },
  ],
  fromTime: [
    {
      required: true,
      message: 'Vui lòng chọn giờ bắt đầu',
      trigger: ['blur', 'change'],
    },
  ],
  name: [
    {
      required: true,
      message: 'Vui lòng nhập tên ca làm việc',
      trigger: ['blur', 'input'],
    },
    {
      max: 255,
      message: 'Tên ca tối đa 255 ký tự',
      trigger: ['blur', 'input'],
    },
  ],
  nameAscii: [
    {
      max: 20,
      message: 'Tên ASCII tối đa 20 ký tự',
      trigger: ['blur', 'input'],
    },
  ],
  toTime: [
    {
      required: true,
      message: 'Vui lòng chọn giờ kết thúc',
      trigger: ['blur', 'change'],
    },
  ],
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function normalizeTime(value: unknown): null | string {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  const matched = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);

  if (!matched) {
    return null;
  }

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${pad(hour)}:${pad(minute)}`;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? fallback : numberValue;
  }

  return fallback;
}

function resetForm() {
  Object.assign(form, createInitialForm());
  formRef.value?.restoreValidation();
}

function fillForm(record?: null | WorkShiftRecord) {
  Object.assign(form, {
    breakFrom: normalizeTime(record?.breakFrom),
    breakTo: normalizeTime(record?.breakTo),
    code: record?.code ?? '',
    flexible: !!record?.flexible,
    fromTime: normalizeTime(record?.fromTime),
    hasBreak: !!record?.hasBreak,
    isDefault: !!record?.isDefault,
    maxCheckIn: normalizeTime(record?.maxCheckIn),
    maxCheckOut: normalizeTime(record?.maxCheckOut),
    minCheckIn: normalizeTime(record?.minCheckIn),
    minCheckOut: normalizeTime(record?.minCheckOut),
    name: record?.name ?? '',
    nameAscii: record?.nameAscii ?? '',
    overShift: !!record?.overShift,
    toTime: normalizeTime(record?.toTime),
    workHours: toNumber(record?.workHours, 0),
    workPoint: toNumber(record?.workPoint, 0),
  });
}

function createPayload() {
  return {
    ...form,
    breakFrom: form.hasBreak ? form.breakFrom : null,
    breakTo: form.hasBreak ? form.breakTo : null,
    maxCheckIn: form.flexible ? form.maxCheckIn : null,
    maxCheckOut: form.flexible ? form.maxCheckOut : null,
    minCheckIn: form.flexible ? form.minCheckIn : null,
    minCheckOut: form.flexible ? form.minCheckOut : null,
  };
}

async function handleSubmit() {
  await formRef.value?.validate();
  emit('submit', createPayload());
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    emit('update:open', false);
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) {
      emit('update:open', false);
      resetForm();
      return;
    }

    const data = drawerApi.getData<{
      record: null | WorkShiftRecord;
    }>();

    fillForm(data.record);
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{
    record: null | WorkShiftRecord;
  }>();

  return data.record ? 'Sửa ca làm việc' : 'Thêm ca làm việc';
});

defineExpose({
  drawerApi,
  resetForm,
});
</script>

<template>
  <Drawer :title="title" class="md:w-[900px]">
    <div class="p-4">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem label="Tên ca làm việc" path="name" required>
          <NInput
            v-model:value="form.name"
            :maxlength="255"
            placeholder="Nhập tên ca làm việc"
            show-count
          />
        </NFormItem>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem label="Tên ASCII" path="nameAscii">
            <NInput
              v-model:value="form.nameAscii"
              :maxlength="20"
              placeholder="Nhập tên ASCII"
              show-count
            />
          </NFormItem>

          <NFormItem label="Mã ca" path="code">
            <NInput
              v-model:value="form.code"
              :maxlength="10"
              placeholder="Nhập mã ca"
              show-count
            />
          </NFormItem>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NFormItem label="Số giờ làm việc" path="workHours">
            <NInputNumber
              v-model:value="form.workHours"
              :min="0"
              placeholder="Nhập số giờ làm việc"
              :show-button="false"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Điểm" path="workPoint">
            <NInputNumber
              v-model:value="form.workPoint"
              :min="0"
              placeholder="Nhập điểm"
              :show-button="false"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Ca mặc định" path="isDefault">
            <NSwitch v-model:value="form.isDefault" />
          </NFormItem>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NFormItem label="Qua ngày" path="overShift">
            <NSwitch v-model:value="form.overShift" />
          </NFormItem>

          <NFormItem label="Giờ bắt đầu" path="fromTime" required>
            <NTimePicker
              v-model:formatted-value="form.fromTime"
              clearable
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>

          <NFormItem label="Giờ kết thúc" path="toTime" required>
            <NTimePicker
              v-model:formatted-value="form.toTime"
              clearable
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NFormItem label="Có nghỉ giữa ca" path="hasBreak">
            <NSwitch v-model:value="form.hasBreak" />
          </NFormItem>

          <NFormItem label="Nghỉ từ" path="breakFrom">
            <NTimePicker
              v-model:formatted-value="form.breakFrom"
              clearable
              :disabled="!form.hasBreak"
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>

          <NFormItem label="Nghỉ đến" path="breakTo">
            <NTimePicker
              v-model:formatted-value="form.breakTo"
              clearable
              :disabled="!form.hasBreak"
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>
        </div>

        <div class="mb-4 mt-2 flex items-center gap-2">
          <NSwitch v-model:value="form.flexible" />
          <span class="font-medium">Linh hoạt giờ chấm công</span>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem label="Check-in sớm nhất" path="minCheckIn">
            <NTimePicker
              v-model:formatted-value="form.minCheckIn"
              clearable
              :disabled="!form.flexible"
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>

          <NFormItem label="Check-in muộn nhất" path="maxCheckIn">
            <NTimePicker
              v-model:formatted-value="form.maxCheckIn"
              clearable
              :disabled="!form.flexible"
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem label="Check-out sớm nhất" path="minCheckOut">
            <NTimePicker
              v-model:formatted-value="form.minCheckOut"
              clearable
              :disabled="!form.flexible"
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>

          <NFormItem label="Check-out muộn nhất" path="maxCheckOut">
            <NTimePicker
              v-model:formatted-value="form.maxCheckOut"
              clearable
              :disabled="!form.flexible"
              format="HH:mm"
              placeholder="HH:mm"
              style="width: 100%"
              value-format="HH:mm"
            />
          </NFormItem>
        </div>
      </NForm>
    </div>
  </Drawer>
</template>

<style scoped>
.grid {
  width: 100%;
}
</style>
