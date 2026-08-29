<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { TimesheetCutoffApi } from '#/models/hr/timesheet-cutoff';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
} from 'naive-ui';

import { toDateOnlyString, toTimestamp } from '#/utils/date';

const emit = defineEmits<{
  submit: [TimesheetCutoffApi.CreateInput | TimesheetCutoffApi.UpdateInput];
}>();

const formRef = ref<FormInst | null>(null);

const model = reactive({
  cutoffDate: null as null | number,
  id: undefined as number | undefined,
  month: null as null | number,
  note: '',
  year: null as null | number,
});

const rules: FormRules = {
  year: {
    message: 'Vui lòng nhập năm',
    required: true,
    trigger: ['blur', 'change'],
    type: 'number',
  },
  month: [
    {
      message: 'Vui lòng nhập tháng',
      required: true,
      trigger: ['blur', 'change'],
      type: 'number',
    },
    {
      message: 'Tháng phải từ 1 đến 12',
      trigger: ['blur', 'change'],
      validator: (_r, v) => typeof v === 'number' && v >= 1 && v <= 12,
    },
  ],
  cutoffDate: {
    message: 'Vui lòng chọn ngày chốt',
    required: true,
    trigger: 'change',
    type: 'number',
  },
};

async function submit() {
  await formRef.value?.validate();

  const cutoffDate = toDateOnlyString(model.cutoffDate);
  if (model.year === null || model.month === null || !cutoffDate) {
    return;
  }

  const base = {
    cutoffDate,
    month: model.month,
    note: model.note.trim() || null,
    year: model.year,
  };

  emit('submit', model.id === undefined ? base : { ...base, id: model.id });
}

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) {
      return;
    }

    const data = drawerApi.getData<{
      record?: null | TimesheetCutoffApi.Item;
    }>();
    const record = data.record ?? null;

    Object.assign(model, {
      cutoffDate: record ? toTimestamp(record.cutoffDate) : null,
      id: record?.id,
      month: record?.month ?? null,
      note: record?.note ?? '',
      year: record?.year ?? new Date().getFullYear(),
    });

    void nextTick(() => formRef.value?.restoreValidation());
  },
});

const title = computed(() =>
  model.id ? 'Sửa ngày chốt công' : 'Thêm ngày chốt công',
);
</script>

<template>
  <Drawer class="md:w-[560px]" :title="title">
    <NForm
      ref="formRef"
      class="p-4 pb-20"
      label-placement="top"
      :model="model"
      :rules="rules"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Năm của kỳ công" path="year" required>
          <NInputNumber
            v-model:value="model.year"
            class="w-full"
            :max="2100"
            :min="2000"
            :show-button="false"
          />
        </NFormItem>
        <NFormItem label="Tháng của kỳ công" path="month" required>
          <NInputNumber
            v-model:value="model.month"
            class="w-full"
            :max="12"
            :min="1"
            :show-button="false"
          />
        </NFormItem>
      </div>

      <NFormItem label="Ngày chốt" path="cutoffDate" required>
        <NDatePicker
          v-model:value="model.cutoffDate"
          class="w-full"
          clearable
          format="dd/MM/yyyy"
          type="date"
        />
      </NFormItem>

      <p class="mb-4 text-sm text-gray-500">
        Ngày chốt thường rơi vào tháng kế tiếp. Ví dụ công tháng 8 chốt ngày
        05/09. Sau ngày này, nhân viên không tạo hoặc sửa được đơn từ thuộc kỳ
        công đó.
      </p>

      <NFormItem label="Ghi chú" path="note">
        <NInput
          v-model:value="model.note"
          :autosize="{ maxRows: 4, minRows: 2 }"
          maxlength="500"
          placeholder="Ví dụ: lùi ngày chốt do trùng nghỉ lễ 2/9"
          show-count
          type="textarea"
        />
      </NFormItem>

      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton>
        <NButton type="primary" @click="submit">Lưu</NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
