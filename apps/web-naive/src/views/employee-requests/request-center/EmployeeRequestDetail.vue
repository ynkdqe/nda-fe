<script lang="ts" setup>
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NPopconfirm,
  NTag,
  NUpload,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  createEmployeeRequestDocumentApi,
  deleteEmployeeRequestDocumentApi,
  uploadMediaApi,
} from '#/api';
import {
  EmployeeRequestEffect,
  employeeRequestEffectLabels,
  EmployeeRequestStatus,
} from '#/models/employee-requests/employee-request';
import { formatDateTime } from '#/utils/date';

import EmployeeRequestStatusBadge from '../shared/EmployeeRequestStatusBadge.vue';
import { formatPeriod } from '../shared/formatPeriod';

const emit = defineEmits<{ changed: [] }>();

const record = ref<EmployeeRequestApi.Item | null>(null);
const policy = ref<EmployeeRequestPolicyApi.Item | null>(null);
const documents = ref<EmployeeRequestApi.Document[]>([]);
const uploading = ref(false);

const periods = computed(() => record.value?.periods ?? []);

/** Chỉ đơn còn chờ duyệt mới cho thay đổi hồ sơ đính kèm. */
const canEditDocuments = computed(
  () => record.value?.status === EmployeeRequestStatus.Pending,
);

const missingRequiredDocument = computed(
  () =>
    policy.value?.requireDocument === true &&
    documents.value.length === 0 &&
    canEditDocuments.value,
);

/** Nhãn thời gian đổi theo loại đơn — "thời gian nghỉ" không đúng với đơn chế độ hay tăng ca. */
const periodLabel = computed(() => {
  switch (policy.value?.effectKind) {
    case EmployeeRequestEffect.Overtime: {
      return 'Thời gian làm thêm';
    }
    case EmployeeRequestEffect.TimesheetAdjustment: {
      return 'Ngày cần điều chỉnh';
    }
    case EmployeeRequestEffect.WorkArrangement: {
      return 'Thời gian áp dụng chế độ';
    }
    default: {
      return 'Thời gian nghỉ';
    }
  }
});

const amountText = computed(() => {
  const r = record.value;
  if (!r || r.calculatedAmount <= 0) return '';
  return `${r.calculatedAmount} ${r.amountUnit === 'Hour' ? 'giờ' : 'ngày'}`;
});

async function upload({ file, onError, onFinish }: UploadCustomRequestOptions) {
  if (!record.value || !file.file) {
    onError();
    return;
  }

  uploading.value = true;
  try {
    // Quy ước của backend: tải file lên trước để lấy URL, entity nghiệp vụ chỉ lưu URL.
    const uploaded = await uploadMediaApi(file.file);
    const url = uploaded.data?.url;
    if (!url) {
      message.error(uploaded.message ?? 'Tải tài liệu thất bại');
      onError();
      return;
    }

    const created = await createEmployeeRequestDocumentApi({
      documentType: file.file.type || 'file',
      documentUrl: url,
      employeeRequestId: record.value.id,
    });
    if (created.success === false || !created.data) {
      message.error(created.message ?? 'Không lưu được tài liệu vào đơn');
      onError();
      return;
    }

    documents.value.push(created.data);
    message.success('Đã đính kèm tài liệu');
    onFinish();
    emit('changed');
  } catch {
    onError();
  } finally {
    uploading.value = false;
  }
}

async function removeDocument(id: number) {
  const r = await deleteEmployeeRequestDocumentApi(id);
  if (r.success === false) {
    message.error(r.message ?? 'Xóa tài liệu thất bại');
    return;
  }
  documents.value = documents.value.filter((x) => x.id !== id);
  message.success('Đã xóa tài liệu');
  emit('changed');
}

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) {
      return;
    }

    const data = drawerApi.getData<{
      policies?: EmployeeRequestPolicyApi.Item[];
      record: EmployeeRequestApi.Item;
    }>();
    record.value = data.record;
    documents.value = [...(data.record.documents ?? [])];
    policy.value =
      (data.policies ?? []).find(
        (p) =>
          p.id === data.record.employeeRequestPolicyId ||
          p.employeeRequestReasonId === data.record.employeeRequestReasonId,
      ) ?? null;
  },
});
</script>

<template>
  <Drawer class="md:w-[720px]" title="Chi tiết đơn">
    <div v-if="record" class="space-y-4 p-4">
      <NDescriptions bordered :column="2" label-placement="left" size="small">
        <NDescriptionsItem label="Mã đơn">#{{ record.id }}</NDescriptionsItem>
        <NDescriptionsItem label="Trạng thái">
          <EmployeeRequestStatusBadge :status="record.status" />
        </NDescriptionsItem>
        <NDescriptionsItem label="Nhân viên">
          {{ record.employee?.name ?? `#${record.employeeId}` }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Loại đơn">
          {{
            record.employeeRequestType?.name ??
            `#${record.employeeRequestTypeId}`
          }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Lý do">
          {{
            record.employeeRequestReason?.name ??
            `#${record.employeeRequestReasonId}`
          }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="policy" label="Khi duyệt">
          <NTag :bordered="false" size="small">
            {{ employeeRequestEffectLabels[policy.effectKind] }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="amountText" label="Số ngày đã tính">
          {{ amountText }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Ngày tạo">
          {{ formatDateTime(record.creationTime) }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Mô tả" :span="2">
          {{ record.description || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="record.approveAt" label="Duyệt lúc" :span="2">
          {{ formatDateTime(record.approveAt) }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="record.rejectAt" label="Từ chối lúc">
          {{ formatDateTime(record.rejectAt) }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="record.rejectAt" label="Lý do từ chối">
          {{ record.rejectReason || '-' }}
        </NDescriptionsItem>
      </NDescriptions>

      <div v-if="periods.length > 0">
        <div class="mb-2 text-sm font-medium">{{ periodLabel }}</div>
        <div class="space-y-2">
          <div
            v-for="period in periods"
            :key="period.id"
            class="rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
          >
            {{ formatPeriod(period) }}
          </div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">Tài liệu đính kèm</span>
          <NUpload
            v-if="canEditDocuments"
            :custom-request="upload"
            :show-file-list="false"
          >
            <NButton :loading="uploading" size="small">
              <template #icon><IconifyIcon icon="lucide:upload" /></template>
              Tải lên
            </NButton>
          </NUpload>
        </div>

        <NAlert v-if="missingRequiredDocument" class="mb-2" type="warning">
          Loại đơn này bắt buộc đính kèm tài liệu, đơn sẽ không được duyệt nếu
          còn thiếu.
        </NAlert>

        <NEmpty v-if="documents.length === 0" description="Không có tài liệu" />
        <div v-else class="space-y-2">
          <div
            v-for="document in documents"
            :key="document.id"
            class="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
          >
            <NTag :bordered="false" size="small">
              {{ document.documentType || 'Tài liệu' }}
            </NTag>
            <a
              class="flex-1 truncate text-blue-500 hover:underline"
              :href="document.documentUrl"
              rel="noreferrer"
              target="_blank"
            >
              {{ document.documentUrl }}
            </a>
            <NPopconfirm
              v-if="canEditDocuments"
              @positive-click="removeDocument(document.id)"
            >
              <template #trigger>
                <NButton circle quaternary size="small" type="error">
                  <IconifyIcon icon="lucide:trash-2" />
                </NButton>
              </template>
              Xóa tài liệu này?
            </NPopconfirm>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>
