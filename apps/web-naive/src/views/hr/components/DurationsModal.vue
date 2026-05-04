<script lang="ts" setup>
import type { ContractTypeApi } from "#/api";

import { ref } from "vue";

import { useVbenModal } from "@vben/common-ui";
import { IconifyIcon } from "@vben/icons";

import { NButton, NInput, NInputNumber, NSpace } from "naive-ui";

const emit = defineEmits<{
  submit: [
    {
      contractTypeId: number | string;
      durations: ContractTypeApi.DurationItem[];
    },
  ];
}>();

const record = ref<ContractTypeApi.ContractTypeItem | null>(null);
const durations = ref<ContractTypeApi.DurationItem[]>([]);

function addDuration() {
  durations.value.push({
    description: "",
    duration: null,
    name: "",
    unit: "",
  });
}

function removeDuration(index: number) {
  durations.value.splice(index, 1);
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    if (!record.value?.id) {
      return;
    }

    emit("submit", {
      contractTypeId: record.value.id,
      durations: durations.value,
    });
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{
      record: ContractTypeApi.ContractTypeItem;
    }>();

    record.value = data.record;
    durations.value = [...(data.record?.durations ?? [])];
  },
  title: "Thời hạn hợp đồng",
});
</script>

<template>
  <Modal class="md:w-[900px]">
    <div class="space-y-3">
      <div class="flex justify-end">
        <NButton size="small" type="primary" @click="addDuration">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          Thêm thời hạn
        </NButton>
      </div>

      <div v-if="durations.length === 0" class="py-8 text-center text-muted-foreground">
        Chưa có thời hạn hợp đồng
      </div>

      <div
        v-for="(item, index) in durations"
        :key="item.id ?? index"
        class="grid grid-cols-1 gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_140px_120px_1fr_auto]"
      >
        <NInput v-model:value="item.name" placeholder="Tên thời hạn" />
        <NInputNumber
          v-model:value="item.duration"
          :min="0"
          placeholder="Thời hạn"
          :show-button="false"
        />
        <NInput v-model:value="item.unit" placeholder="Đơn vị" />
        <NInput v-model:value="item.description" placeholder="Mô tả" />
        <NSpace justify="end">
          <NButton circle quaternary size="small" type="error" @click="removeDuration(index)">
            <template #icon>
              <IconifyIcon class="size-4" icon="lucide:trash-2" />
            </template>
          </NButton>
        </NSpace>
      </div>
    </div>
  </Modal>
</template>
