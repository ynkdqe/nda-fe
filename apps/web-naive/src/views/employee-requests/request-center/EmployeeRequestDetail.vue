<script lang="ts" setup>
import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NDescriptions, NDescriptionsItem, NEmpty, NTag } from 'naive-ui';

import { formatDateOnly, formatDateTime, formatTimeOnly } from '#/utils/date';

import EmployeeRequestStatusBadge from '../shared/EmployeeRequestStatusBadge.vue';

const record = ref<EmployeeRequestApi.Item | null>(null);

const periods = computed(() => record.value?.periods ?? []);
const documents = computed(() => record.value?.documents ?? []);

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) {
      return;
    }

    const data = drawerApi.getData<{ record: EmployeeRequestApi.Item }>();
    record.value = data.record;
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

      <div>
        <div class="mb-2 text-sm font-medium">Thời gian nghỉ</div>
        <NEmpty v-if="periods.length === 0" description="Không có dữ liệu" />
        <div v-else class="space-y-2">
          <div
            v-for="period in periods"
            :key="period.id"
            class="rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
          >
            {{ formatDateOnly(period.fromDate) }}
            {{ formatTimeOnly(period.fromTime) }}
            &rarr;
            {{ formatDateOnly(period.toDate) }}
            {{ formatTimeOnly(period.toTime) }}
          </div>
        </div>
      </div>

      <div>
        <div class="mb-2 text-sm font-medium">Tài liệu đính kèm</div>
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
              class="truncate text-blue-500 hover:underline"
              :href="document.documentUrl"
              rel="noreferrer"
              target="_blank"
            >
              {{ document.documentUrl }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>
