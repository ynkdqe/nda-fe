<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api/hr/employee';
import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NButton,
  NInput,
  NPopconfirm,
  NSpace,
  NTabPane,
  NTabs,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveEmployeeRequestApi,
  cancelEmployeeRequestApi,
  createEmployeeRequestApi,
  deleteEmployeeRequestApi,
  getEmployeeListApi,
  getEmployeeRequestByIdApi,
  getEmployeeRequestListApi,
  getEmployeeRequestOptionsApi,
  getEmployeeRequestReasonListApi,
  getEmployeeRequestTypeListApi,
  rejectEmployeeRequestApi,
  revokeEmployeeRequestApi,
  updateEmployeeRequestApi,
} from '#/api';
import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';
import {
  EmployeeRequestStatus,
  employeeRequestStatusOptions,
} from '#/models/employee-requests/employee-request';
import { formatDateOnly, formatDateTime, toDateOnlyString } from '#/utils/date';

import EmployeeRequestStatusBadge from '../shared/EmployeeRequestStatusBadge.vue';
import EmployeeRequestDetail from './EmployeeRequestDetail.vue';
import EmployeeRequestForm from './EmployeeRequestForm.vue';

const { hasAccessByCodes } = useAccess();

/**
 * Backend dùng chính quyền Approve để quyết định người dùng thấy toàn bộ đơn
 * hay chỉ đơn của mình, nên FE dùng lại đúng code đó cho các nút duyệt.
 */
const canApprove = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.approve]),
);
const canReject = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.reject]),
);
const canRevoke = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.revoke]),
);

const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const reasons = ref<EmployeeRequestReasonApi.Item[]>([]);
const employees = ref<EmployeeApi.EmployeeItem[]>([]);
// Dùng để tra "có tính lương hay không" theo lý do đã chọn khi tạo/sửa đơn.
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
const processingId = ref<null | number>(null);
const rejectReason = ref('');

/**
 * Tab `approval` là màn hình dành cho người duyệt: luôn ép trạng thái Chờ duyệt
 * để chỉ còn các đơn cần xử lý. Backend đã tự giới hạn phạm vi dữ liệu theo quyền
 * Approve (có quyền thì thấy toàn bộ đơn của tenant, không có thì chỉ thấy đơn của mình).
 */
type RequestTab = 'all' | 'approval';

const activeTab = ref<RequestTab>('all');
const isApprovalTab = computed(() => activeTab.value === 'approval');

const typeMap = computed(() => new Map(types.value.map((x) => [x.id, x])));
const reasonMap = computed(() => new Map(reasons.value.map((x) => [x.id, x])));
const employeeMap = computed(
  () => new Map(employees.value.map((x) => [Number(x.id), x])),
);

async function loadDependencies() {
  // Form tạo đơn chỉ được chọn loại đơn/lý do có chính sách còn hiệu lực hôm nay,
  // nên truyền cùng một ngày cho cả hai đầu khoảng.
  const today = toDateOnlyString(Date.now()) ?? undefined;

  const [typeResponse, reasonResponse, employeeResponse, policyResponse] =
    await Promise.all([
      getEmployeeRequestTypeListApi({ current: 1, pageSize: 100 }),
      getEmployeeRequestReasonListApi({ current: 1, pageSize: 100 }),
      getEmployeeListApi({ current: 1, pageSize: 100 }),
      getEmployeeRequestOptionsApi(today),
    ]);

  types.value = (typeResponse.data ?? [])
    .filter((x) => !x.isDeleted)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  reasons.value = (reasonResponse.data ?? []).filter((x) => !x.isDeleted);
  employees.value = employeeResponse.data ?? [];
  policies.value = (policyResponse.data ?? []).filter((x) => !x.isDeleted);
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  schema: [
    {
      component: 'Select',
      fieldName: 'type',
      label: 'Loại đơn',
      componentProps: () => ({
        clearable: true,
        options: types.value.map((x) => ({ label: x.name, value: x.id })),
      }),
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: 'Trạng thái',
      // Tab duyệt đơn đã cố định trạng thái Chờ duyệt nên ẩn filter này để tránh hiểu nhầm.
      dependencies: {
        show: () => !isApprovalTab.value,
        triggerFields: ['status'],
      },
      componentProps: {
        clearable: true,
        options: [...employeeRequestStatusOptions],
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'dateRange',
      label: 'Ngày tạo',
      componentProps: {
        clearable: true,
        format: 'dd/MM/yyyy',
        type: 'daterange',
        valueFormat: 'yyyy-MM-dd',
      },
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: 'Từ khóa',
      componentProps: { clearable: true, placeholder: 'Tìm theo mô tả' },
    },
  ],
};

const gridOptions: VxeGridProps<EmployeeRequestApi.Item> = {
  border: 'full',
  columns: [
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    { field: 'id', title: 'Mã đơn', width: 90, slots: { default: 'codeCell' } },
    {
      field: 'employeeId',
      title: 'Nhân viên',
      minWidth: 180,
      slots: { default: 'employeeCell' },
    },
    {
      field: 'employeeRequestTypeId',
      title: 'Loại đơn',
      minWidth: 160,
      slots: { default: 'typeCell' },
    },
    {
      field: 'employeeRequestReasonId',
      title: 'Lý do',
      minWidth: 160,
      slots: { default: 'reasonCell' },
    },
    {
      field: 'periods',
      title: 'Thời gian nghỉ',
      minWidth: 200,
      slots: { default: 'periodCell' },
    },
    { field: 'description', title: 'Mô tả', minWidth: 200 },
    {
      align: 'center',
      field: 'status',
      title: 'Trạng thái',
      width: 130,
      slots: { default: 'statusCell' },
    },
    {
      field: 'creationTime',
      title: 'Ngày tạo',
      width: 160,
      slots: { default: 'createdCell' },
    },
    {
      align: 'center',
      fixed: 'right',
      title: 'Thao tác',
      width: 170,
      slots: { default: 'actions' },
    },
  ],
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, values: Record<string, any>) => {
        const [startDate, endDate] = values?.dateRange ?? [];
        // Tab duyệt đơn luôn ép trạng thái Chờ duyệt, bỏ qua filter trạng thái của người dùng.
        const status = isApprovalTab.value
          ? String(EmployeeRequestStatus.Pending)
          : (typeof values?.status === 'number'
            ? String(values.status)
            : undefined);
        const params: EmployeeRequestApi.ListParams = {
          current: page.currentPage,
          pageSize: page.pageSize,
          ...(typeof values?.type === 'number'
            ? { type: String(values.type) }
            : {}),
          ...(status === undefined ? {} : { status }),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          ...(values?.keyword ? { keyword: values.keyword } : {}),
        };

        const response = await getEmployeeRequestListApi(params);
        const items = (response.data ?? []).filter((x) => !x.isDeleted);
        return { items, total: response.total ?? items.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};

const [Grid, gridApi] = useVbenVxeGrid<EmployeeRequestApi.Item>({
  formOptions,
  gridOptions,
});
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestForm,
});
const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestDetail,
});

async function changeTab(value: RequestTab) {
  activeTab.value = value;
  await gridApi.query();
}

function employeeName(row: EmployeeRequestApi.Item) {
  return (
    row.employee?.name ??
    employeeMap.value.get(row.employeeId)?.name ??
    `#${row.employeeId}`
  );
}

function periodSummary(row: EmployeeRequestApi.Item) {
  const periods = row.periods ?? [];
  if (periods.length === 0) {
    return '-';
  }

  const first = periods[0];
  if (!first) {
    return '-';
  }

  const range =
    first.fromDate === first.toDate
      ? formatDateOnly(first.fromDate)
      : `${formatDateOnly(first.fromDate)} - ${formatDateOnly(first.toDate)}`;

  return periods.length > 1 ? `${range} (+${periods.length - 1})` : range;
}

function openCreate() {
  formDrawerApi.setData({
    policies: policies.value,
    record: null,
  });
  formDrawerApi.open();
}

async function openEdit(row: EmployeeRequestApi.Item) {
  // Lấy bản chi tiết để có Periods, vì API danh sách không trả kèm.
  const response = await getEmployeeRequestByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy đơn');
    return;
  }

  formDrawerApi.setData({
    policies: policies.value,
    record: response.data,
  });
  formDrawerApi.open();
}

async function openDetail(row: EmployeeRequestApi.Item) {
  const response = await getEmployeeRequestByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy đơn');
    return;
  }

  detailDrawerApi.setData({ record: response.data });
  detailDrawerApi.open();
}

async function submit(
  payload: EmployeeRequestApi.CreateInput | EmployeeRequestApi.UpdateInput,
) {
  formDrawerApi.setState({ confirmLoading: true });
  try {
    if ('id' in payload) {
      await updateEmployeeRequestApi(payload.id, payload);
      message.success('Cập nhật đơn thành công');
    } else {
      await createEmployeeRequestApi(payload);
      message.success('Tạo đơn thành công');
    }
    formDrawerApi.close();
    await gridApi.query();
  } finally {
    formDrawerApi.setState({ confirmLoading: false });
  }
}

async function remove(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await deleteEmployeeRequestApi(row.id);
    message.success('Xóa đơn thành công');
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

async function approve(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await approveEmployeeRequestApi(row.id);
    message.success('Duyệt đơn thành công');
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

async function reject(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await rejectEmployeeRequestApi(row.id, {
      reason: rejectReason.value.trim() || null,
    });
    message.success('Từ chối đơn thành công');
    rejectReason.value = '';
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

async function cancel(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await cancelEmployeeRequestApi(row.id);
    message.success('Hủy đơn thành công');
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

async function revoke(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await revokeEmployeeRequestApi(row.id, {
      reason: rejectReason.value.trim() || null,
    });
    message.success('Thu hồi đơn thành công');
    rejectReason.value = '';
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

function isPending(row: EmployeeRequestApi.Item) {
  return row.status === EmployeeRequestStatus.Pending;
}

function isApproved(row: EmployeeRequestApi.Item) {
  return row.status === EmployeeRequestStatus.Approved;
}

onMounted(loadDependencies);
</script>

<template>
  <Page>
    <NTabs
      v-if="canApprove"
      class="mb-2"
      type="line"
      :value="activeTab"
      @update:value="changeTab"
    >
      <NTabPane name="all" tab="Tất cả đơn từ" />
      <NTabPane name="approval" tab="Đơn cần phê duyệt" />
    </NTabs>

    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="openCreate">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          Tạo đơn mới
        </NButton>
      </template>

      <template #codeCell="{ row }">#{{ row.id }}</template>

      <template #employeeCell="{ row }">{{ employeeName(row) }}</template>

      <template #typeCell="{ row }">
        {{
          row.employeeRequestType?.name ??
          typeMap.get(row.employeeRequestTypeId)?.name ??
          '-'
        }}
      </template>

      <template #reasonCell="{ row }">
        {{
          row.employeeRequestReason?.name ??
          reasonMap.get(row.employeeRequestReasonId)?.name ??
          '-'
        }}
      </template>

      <template #periodCell="{ row }">{{ periodSummary(row) }}</template>

      <template #statusCell="{ row }">
        <EmployeeRequestStatusBadge :status="row.status" />
      </template>

      <template #createdCell="{ row }">
        {{ formatDateTime(row.creationTime) }}
      </template>

      <template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip>
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="info"
                @click="openDetail(row)"
              >
                <template #icon><IconifyIcon icon="lucide:eye" /></template>
              </NButton>
            </template>
            Xem chi tiết
          </NTooltip>

          <NTooltip v-if="isPending(row)">
            <template #trigger>
              <NButton
                circle
                :disabled="processingId !== null"
                quaternary
                size="small"
                type="primary"
                @click="openEdit(row)"
              >
                <template #icon><IconifyIcon icon="lucide:pencil" /></template>
              </NButton>
            </template>
            Sửa đơn của tôi
          </NTooltip>

          <NPopconfirm
            v-if="isPending(row) && canApprove"
            negative-text="Hủy"
            positive-text="Duyệt"
            @positive-click="() => approve(row)"
          >
            <template #trigger>
              <NTooltip>
                <template #trigger>
                  <NButton
                    circle
                    :disabled="processingId !== null"
                    :loading="processingId === row.id"
                    quaternary
                    size="small"
                    type="success"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:check" />
                    </template>
                  </NButton>
                </template>
                Duyệt đơn
              </NTooltip>
            </template>
            Bạn có chắc chắn muốn duyệt đơn #{{ row.id }} của
            {{ employeeName(row) }} không?
          </NPopconfirm>

          <NPopconfirm
            v-if="isPending(row) && canReject"
            negative-text="Hủy"
            positive-text="Từ chối"
            @positive-click="() => reject(row)"
          >
            <template #trigger>
              <NTooltip>
                <template #trigger>
                  <NButton
                    circle
                    :disabled="processingId !== null"
                    :loading="processingId === row.id"
                    quaternary
                    size="small"
                    type="error"
                  >
                    <template #icon><IconifyIcon icon="lucide:x" /></template>
                  </NButton>
                </template>
                Từ chối đơn
              </NTooltip>
            </template>
            <div class="w-64">
              <div class="mb-2">Lý do từ chối đơn #{{ row.id }}:</div>
              <NInput
                v-model:value="rejectReason"
                maxlength="500"
                placeholder="Nhập lý do (không bắt buộc)"
                type="textarea"
              />
            </div>
          </NPopconfirm>

          <NPopconfirm
            v-if="isPending(row)"
            negative-text="Không"
            positive-text="Hủy đơn"
            @positive-click="() => cancel(row)"
          >
            <template #trigger>
              <NTooltip>
                <template #trigger>
                  <NButton
                    circle
                    :disabled="processingId !== null"
                    :loading="processingId === row.id"
                    quaternary
                    size="small"
                    type="warning"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:undo-2" />
                    </template>
                  </NButton>
                </template>
                Hủy đơn của tôi
              </NTooltip>
            </template>
            Bạn có chắc chắn muốn hủy đơn #{{ row.id }} không? Chỉ người tạo đơn
            mới hủy được.
          </NPopconfirm>

          <NPopconfirm
            v-if="isPending(row)"
            negative-text="Không"
            positive-text="Xóa"
            @positive-click="() => remove(row)"
          >
            <template #trigger>
              <NTooltip>
                <template #trigger>
                  <NButton
                    circle
                    :disabled="processingId !== null"
                    :loading="processingId === row.id"
                    quaternary
                    size="small"
                    type="error"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Xóa đơn của tôi
              </NTooltip>
            </template>
            Bạn có chắc chắn muốn xóa đơn #{{ row.id }} không?
          </NPopconfirm>

          <NPopconfirm
            v-if="isApproved(row) && canRevoke"
            negative-text="Hủy"
            positive-text="Thu hồi"
            @positive-click="() => revoke(row)"
          >
            <template #trigger>
              <NTooltip>
                <template #trigger>
                  <NButton
                    circle
                    :disabled="processingId !== null"
                    :loading="processingId === row.id"
                    quaternary
                    size="small"
                    type="warning"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:rotate-ccw" />
                    </template>
                  </NButton>
                </template>
                Thu hồi đơn đã duyệt
              </NTooltip>
            </template>
            <div class="w-64">
              <div class="mb-2">
                Thu hồi đơn #{{ row.id }} và hoàn lại ngày phép. Lý do:
              </div>
              <NInput
                v-model:value="rejectReason"
                maxlength="500"
                placeholder="Nhập lý do (không bắt buộc)"
                type="textarea"
              />
            </div>
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <FormDrawer @submit="submit" />
    <DetailDrawer />
  </Page>
</template>
