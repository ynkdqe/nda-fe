<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ContractTypeApi, DurationRow } from '#/models/hr/contract-type';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NInput, NInputNumber, NSpace } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

const emit = defineEmits<{
  cancel: [];
  submit: [
    payload: {
      contractTypeId: number | string;
      durations: DurationRow[];
    },
  ];
}>();

const durations = ref<DurationRow[]>([]);
const loading = ref(false);
const contractTypeId = ref<null | number | string>(null);

function normalizeDuration(
  row: ContractTypeApi.DurationItem | DurationRow,
): DurationRow {
  const duration = Number(row.duration);

  return {
    duration: Number.isFinite(duration) ? duration : null,
    id: row.id ?? null,
    name: row.name ?? null,
  };
}

function getGridFullData() {
  const tableData = gridApi?.grid?.getTableData?.() as
    | undefined
    | { fullData?: DurationRow[] };

  return tableData?.fullData ?? durations.value;
}

function setupGridData() {
  durations.value = getGridFullData().map((duration) =>
    normalizeDuration(duration),
  );
}

function syncGridData() {
  gridApi?.setGridOptions?.({
    data: durations.value,
  });
}

function addRow() {
  setupGridData();
  durations.value.push({ duration: 1, name: '' });
  syncGridData();
}

function removeRow(index: number) {
  setupGridData();
  durations.value.splice(index, 1);
  syncGridData();
}

async function handleSubmit() {
  if (!contractTypeId.value) {
    message.error('Không tìm thấy loại hợp đồng');
    return;
  }

  loading.value = true;

  try {
    const normalized = getGridFullData().map((duration) =>
      normalizeDuration(duration),
    );
    durations.value = normalized;

    emit('submit', {
      contractTypeId: contractTypeId.value,
      durations: normalized,
    });
  } catch {
    message.error('Lưu thời hạn hợp đồng thất bại');
  } finally {
    loading.value = false;
  }
}

function close() {
  emit('cancel');
  modalApi.close();
}

const gridOptions: VxeGridProps<DurationRow> = {
  autoResize: true,
  border: 'full',
  columns: [
    {
      align: 'center',
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'name',
      minWidth: 180,
      slots: { default: 'name' },
      title: 'Tên thời hạn',
    },
    {
      field: 'duration',
      minWidth: 140,
      slots: { default: 'duration' },
      title: 'Thời hạn',
    },
    {
      align: 'center',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'actions' },
      title: 'Hành động',
    },
  ],
  data: durations.value,
  stripe: true,
  toolbarConfig: {
    custom: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid<DurationRow>({ gridOptions });

const [Modal, modalApi] = useVbenModal({
  bordered: true,
  class: 'w-[800px]',
  fullscreenButton: false,
  onCancel: close,
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{
      record?: ContractTypeApi.ContractTypeItem;
    }>();
    const record = data.record;

    contractTypeId.value = record?.id ?? null;
    durations.value = (record?.durations ?? []).map((duration) =>
      normalizeDuration(duration),
    );
    syncGridData();
  },
  title: 'Thời hạn hợp đồng',
});

watch(
  durations,
  () => {
    syncGridData();
  },
  { deep: true },
);
</script>

<template>
  <Modal>
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="addRow">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          Thêm thời hạn
        </NButton>
      </template>

      <template #toolbar-tools>
        <div class="text-foreground/80">Tổng: {{ durations.length }}</div>
      </template>

      <template #name="{ row }">
        <NInput v-model:value="row.name" placeholder="Tên thời hạn" />
      </template>

      <template #duration="{ row }">
        <NInputNumber
          v-model:value="row.duration"
          :min="0"
          placeholder="Thời hạn"
          :show-button="false"
          style="width: 100%"
        />
      </template>

      <template #actions="{ rowIndex }">
        <NSpace justify="center">
          <NButton
            circle
            quaternary
            size="small"
            type="error"
            @click="() => removeRow(rowIndex)"
          >
            <template #icon>
              <IconifyIcon class="size-4" icon="lucide:trash-2" />
            </template>
          </NButton>
        </NSpace>
      </template>
    </Grid>
  </Modal>
</template>
