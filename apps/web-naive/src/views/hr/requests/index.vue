<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { VbenFormProps } from '#/adapter/form';

import { computed, h, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NCard, NDataTable, NTabPane, NTabs, NTag } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';

type RequestStatus = 'approved' | 'pending' | 'rejected';

type RequestItem = {
  approver: string;
  createdAt: string;
  createdDate: string;
  dateRange: string;
  id: string;
  reason: string;
  status: RequestStatus;
  type: string;
};

type RequestFilters = {
  dateRange?: string[];
  status?: RequestStatus;
  type?: string;
};

const statusLabels: Record<RequestStatus, string> = {
  approved: 'Đã phê duyệt',
  pending: 'Chờ phê duyệt',
  rejected: 'Từ chối',
};

const statusTypes: Record<RequestStatus, 'error' | 'success' | 'warning'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
};

const requestTypeOptions = [
  { label: 'Đơn xin nghỉ phép', value: 'Đơn xin nghỉ phép' },
  { label: 'Đơn xin làm việc tại nhà', value: 'Đơn xin làm việc tại nhà' },
];

const statusOptions = (Object.keys(statusLabels) as RequestStatus[]).map(
  (value) => ({ label: statusLabels[value], value }),
);

const myRequests: RequestItem[] = [
  {
    approver: 'Nguyễn Văn Bình',
    createdAt: '08/08/2026 09:15',
    createdDate: '2026-08-08',
    dateRange: '15/08/2026',
    id: 'DXN-20260808-001',
    reason: 'Khám sức khỏe định kỳ',
    status: 'pending',
    type: 'Đơn xin nghỉ phép',
  },
  {
    approver: 'Nguyễn Văn Bình',
    createdAt: '01/08/2026 14:30',
    createdDate: '2026-08-01',
    dateRange: '04/08/2026 - 05/08/2026',
    id: 'DXN-20260801-002',
    reason: 'Giải quyết việc cá nhân',
    status: 'approved',
    type: 'Đơn xin làm việc tại nhà',
  },
  {
    approver: 'Nguyễn Văn Bình',
    createdAt: '28/07/2026 10:20',
    createdDate: '2026-07-28',
    dateRange: '30/07/2026',
    id: 'DXN-20260728-003',
    reason: 'Nghỉ việc riêng',
    status: 'rejected',
    type: 'Đơn xin nghỉ phép',
  },
];

const approvalRequests: RequestItem[] = [
  {
    approver: 'Bạn',
    createdAt: '08/08/2026 08:40',
    createdDate: '2026-08-08',
    dateRange: '12/08/2026',
    id: 'DXN-20260808-004',
    reason: 'Đưa con đi khám bệnh',
    status: 'pending',
    type: 'Đơn xin nghỉ phép',
  },
  {
    approver: 'Bạn',
    createdAt: '07/08/2026 16:10',
    createdDate: '2026-08-07',
    dateRange: '11/08/2026 - 12/08/2026',
    id: 'DXN-20260807-005',
    reason: 'Làm việc tại nhà để xử lý công việc gia đình',
    status: 'pending',
    type: 'Đơn xin làm việc tại nhà',
  },
];

const filters = ref<RequestFilters>({});

const filterOptions: VbenFormProps = {
  actionWrapperClass: 'lg:col-span-1',
  collapsed: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: requestTypeOptions,
        placeholder: 'Chọn loại đơn',
      },
      fieldName: 'type',
      label: 'Loại đơn',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: statusOptions,
        placeholder: 'Chọn trạng thái',
      },
      fieldName: 'status',
      label: 'Trạng thái',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'daterange',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'dateRange',
      label: 'Từ ngày - Đến ngày',
    },
  ],
  resetButtonOptions: { content: 'Đặt lại' },
  showCollapseButton: false,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

function applyFilters(values: RequestFilters) {
  filters.value = {
    dateRange: values.dateRange,
    status: values.status,
    type: values.type,
  };
}

function filterRequests(requests: RequestItem[]) {
  const [fromDate, toDate] = filters.value.dateRange ?? [];

  return requests.filter((request) => {
    if (filters.value.type && request.type !== filters.value.type) {
      return false;
    }

    if (filters.value.status && request.status !== filters.value.status) {
      return false;
    }

    if (fromDate && request.createdDate < fromDate) {
      return false;
    }

    return !(toDate && request.createdDate > toDate);
  });
}

const filteredMyRequests = computed(() => filterRequests(myRequests));
const filteredApprovalRequests = computed(() => filterRequests(approvalRequests));

const columns: DataTableColumns<RequestItem> = [
  {
    key: 'id',
    title: 'Mã đơn',
    width: 160,
  },
  {
    key: 'type',
    title: 'Loại đơn',
    width: 220,
  },
  {
    key: 'dateRange',
    title: 'Thời gian',
    width: 210,
  },
  {
    key: 'reason',
    minWidth: 220,
    title: 'Lý do',
  },
  {
    key: 'approver',
    title: 'Người phê duyệt',
    width: 180,
  },
  {
    key: 'createdAt',
    title: 'Ngày tạo',
    width: 170,
  },
  {
    key: 'status',
    render: (row) =>
      h(
        NTag,
        { bordered: false, type: statusTypes[row.status] },
        { default: () => statusLabels[row.status] },
      ),
    title: 'Trạng thái',
    width: 150,
  },
];

const [FilterForm] = useVbenForm({
  ...filterOptions,
  handleSubmit: applyFilters,
});

function openCreateRequest() {
  message.info('Chức năng tạo đơn mới đang được phát triển');
}
</script>

<template>
  <Page>
    <div class="space-y-4">
      <NCard :bordered="false">
        <FilterForm />
      </NCard>

      <NCard :bordered="false">
        <div class="mb-4 flex items-center">
          <NButton type="primary" @click="openCreateRequest">
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
            Tạo đơn mới
          </NButton>
        </div>

        <NTabs default-value="my-requests" type="line" animated>
          <NTabPane name="my-requests" tab="Đơn của tôi">
            <NDataTable
              :columns="columns"
              :data="filteredMyRequests"
              :pagination="false"
              :scroll-x="1310"
              class="mt-4"
            />
          </NTabPane>

          <NTabPane name="approval-requests" tab="Đơn cần phê duyệt">
            <NDataTable
              :columns="columns"
              :data="filteredApprovalRequests"
              :pagination="false"
              :scroll-x="1310"
              class="mt-4"
            />
          </NTabPane>
        </NTabs>
      </NCard>
    </div>
  </Page>
</template>
