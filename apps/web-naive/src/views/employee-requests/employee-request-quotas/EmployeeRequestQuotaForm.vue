<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestQuotaApi } from '#/models/employee-requests/employee-request-quota';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
} from 'naive-ui';

const emit = defineEmits<{
  submit: [id: number, payload: EmployeeRequestQuotaApi.UpdateInput];
}>();
const formRef = ref<FormInst | null>(null);
/** Giữ nguyên bản ghi gốc để hiển thị phần không sửa được (phép tồn, đã dùng). */
const record = ref<EmployeeRequestQuotaApi.Item | null>(null);
const model = reactive({
  adjustmentDays: 0,
  adjustmentNote: '' as string,
  baseDays: 0,
  seniorityDays: 0,
});
const total = computed(
  () =>
    model.baseDays +
    model.seniorityDays +
    (record.value?.carriedOverDays ?? 0) +
    model.adjustmentDays,
);
/**
 * Backend chặn hạn mức thấp hơn số đã dùng; cảnh báo sớm ở đây để HR
 * không phải bấm lưu mới biết.
 */
const belowUsed = computed(
  () => record.value !== null && total.value < record.value.usedTime,
);
const rules: FormRules = {
  adjustmentNote: {
    validator: () =>
      model.adjustmentDays === 0 || !!model.adjustmentNote.trim(),
    message: 'Vui lòng nhập lý do khi có điều chỉnh',
    trigger: ['blur', 'change'],
  },
};
async function submit() {
  await formRef.value?.validate();
  if (!record.value || belowUsed.value) return;
  emit('submit', record.value.id, {
    adjustmentDays: model.adjustmentDays,
    adjustmentNote: model.adjustmentNote.trim() || null,
    baseDays: model.baseDays,
    seniorityDays: model.seniorityDays,
  });
}
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) return;
    const d = drawerApi.getData<{ record: EmployeeRequestQuotaApi.Item }>();
    record.value = d.record;
    Object.assign(model, {
      adjustmentDays: d.record.adjustmentDays,
      adjustmentNote: d.record.adjustmentNote ?? '',
      baseDays: d.record.baseDays,
      seniorityDays: d.record.seniorityDays,
    });
    void nextTick(() => formRef.value?.restoreValidation());
  },
});
const title = computed(() =>
  record.value
    ? `Điều chỉnh phép ${record.value.year} - ${record.value.employeeName ?? ''}`
    : 'Điều chỉnh quyền lợi phép',
);
</script>
<template>
  <Drawer :title="title" class="md:w-[560px]">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="top"
      class="p-4 pb-20"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Hạn mức chuẩn" path="baseDays">
          <NInputNumber
            v-model:value="model.baseDays"
            :min="0"
            :precision="1"
            :show-button="false"
            style="width: 100%"
          /> </NFormItem
        ><NFormItem label="Phép thâm niên" path="seniorityDays">
          <NInputNumber
            v-model:value="model.seniorityDays"
            :min="0"
            :precision="1"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>
      </div>
      <NFormItem label="Điều chỉnh (+/-)" path="adjustmentDays">
        <NInputNumber
          v-model:value="model.adjustmentDays"
          :precision="1"
          :show-button="false"
          placeholder="Nhập số âm để trừ bớt"
          style="width: 100%"
        />
      </NFormItem>
      <NFormItem label="Lý do điều chỉnh" path="adjustmentNote">
        <NInput
          v-model:value="model.adjustmentNote"
          :maxlength="500"
          placeholder="Ví dụ: thỏa thuận nghỉ bù dự án X"
          show-count
          type="textarea"
        />
      </NFormItem>
      <div
        v-if="record"
        class="bg-accent mb-4 grid grid-cols-2 gap-2 rounded-md p-3 text-sm"
      >
        <span class="text-muted-foreground">Phép tồn năm trước</span>
        <span class="text-right tabular-nums">{{
          record.carriedOverDays
        }}</span>
        <span class="text-muted-foreground">Đã dùng</span>
        <span class="text-right tabular-nums">{{ record.usedTime }}</span>
        <span class="font-medium">Tổng hạn mức sau điều chỉnh</span>
        <span class="text-right font-medium tabular-nums">{{ total }}</span>
        <span class="font-medium">Còn lại</span>
        <span class="text-right font-medium tabular-nums">{{
          total - record.usedTime
        }}</span>
      </div>
      <NAlert v-if="belowUsed" type="error" class="mb-4">
        Tổng hạn mức đang nhỏ hơn số ngày nhân viên đã nghỉ.
      </NAlert>
      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton
        ><NButton :disabled="belowUsed" type="primary" @click="submit">
          Lưu
        </NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
