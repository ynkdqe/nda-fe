<script lang="ts" setup>
import type { VbenFormProps } from "#/adapter/form";
import type { VxeGridProps } from "#/adapter/vxe-table";
import type { SmsMessageApi } from "#/models/sms";

import { onMounted, ref } from "vue";

import { Page } from "@vben/common-ui";
import { IconifyIcon } from "@vben/icons";
import { useI18n } from "@vben/locales";

import { NButton, NPopconfirm, NSpace, NTag, NTooltip } from "naive-ui";

import { message } from "#/adapter/naive";
import { useVbenVxeGrid } from "#/adapter/vxe-table";
import { fetchSmsProviderList, fetchSmsTemplateList } from "#/api";

const { t } = useI18n();

const providerMap = ref<Record<string, string>>({});

function handleNotImplemented() {
  message.info(t("page.sms.templatePage.action.notImplemented"));
}

function handleAdd() {
  handleNotImplemented();
  gridApi.reload();
}

async function loadProviders() {
  try {
    const response = await fetchSmsProviderList({ page: 1, pageSize: 1000 });
    const mapEntries = (response.data ?? response.items ?? []).map(
      (provider: SmsMessageApi.SmsProvider) =>
        [String(provider.id), provider.name || String(provider.id)] as const,
    );

    providerMap.value = Object.fromEntries(mapEntries);
  } catch (error: any) {
    console.warn("Load providers failed:", error?.message || error);
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: {
    content: t("page.sms.templatePage.search.reset"),
  },
  schema: [
    {
      component: "Input",
      componentProps: {
        placeholder: t("page.sms.templatePage.search.keywordPlaceholder"),
      },
      fieldName: "keyword",
      label: t("page.sms.templatePage.search.keywordLabel"),
    },
    {
      component: "Select",
      componentProps: {
        clearable: true,
        options: [
          {
            label: t("page.sms.templatePage.search.status.active"),
            value: "true",
          },
          {
            label: t("page.sms.templatePage.search.status.inactive"),
            value: "false",
          },
        ],
        placeholder: t("page.sms.templatePage.search.allPlaceholder"),
      },
      fieldName: "status",
      label: t("page.sms.templatePage.search.statusLabel"),
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: {
    content: t("page.sms.templatePage.search.submit"),
  },
  submitOnChange: false,
  submitOnEnter: true,
};

const toolbarConfig = {
  custom: true,
  export: true,
  search: true,
} as VxeGridProps<SmsMessageApi.SmsTemplate>["toolbarConfig"];

const gridOptions: VxeGridProps<SmsMessageApi.SmsTemplate> = {
  border: "full",
  checkboxConfig: {
    highlight: true,
    labelField: "name",
  },
  columns: [
    {
      field: "id",
      title: "#",
      width: 80,
    },
    {
      field: "code",
      title: t("page.sms.templatePage.table.code"),
      width: 140,
    },
    {
      field: "name",
      title: t("page.sms.templatePage.table.name"),
      width: 220,
    },
    {
      field: "smsProviderId",
      slots: { default: "providerCell" },
      title: t("page.sms.templatePage.table.provider"),
      width: 150,
    },
    {
      field: "template",
      minWidth: 200,
      showOverflow: "tooltip",
      title: t("page.sms.templatePage.table.template"),
    },
    {
      field: "isActive",
      slots: { default: "statusCell" },
      title: t("page.sms.templatePage.table.status"),
      width: 140,
    },
    {
      field: "action",
      fixed: "right",
      slots: { default: "action" },
      title: t("page.sms.templatePage.table.action"),
      width: 120,
    },
  ],
  keepSource: true,
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await fetchSmsTemplateList({
          keyword: formValues.keyword?.trim?.() || undefined,
          page: page.currentPage,
          pageSize: page.pageSize,
          status: formValues.status || undefined,
        });

        return {
          items: response.data ?? response.items ?? [],
          total: response.total ?? 0,
        };
      },
    },
  },
  stripe: true,
  toolbarConfig,
};

const [Grid, gridApi] = useVbenVxeGrid<SmsMessageApi.SmsTemplate>({
  formOptions,
  gridOptions,
});

onMounted(() => {
  loadProviders();
});

function isActiveStatus(status: SmsMessageApi.SmsTemplate["isActive"]) {
  if (typeof status === "boolean") {
    return status;
  }

  const value = String(status ?? "").toLowerCase();
  if (!value) {
    return false;
  }

  if (value === "active" || value === "true") {
    return true;
  }

  if (value === "inactive" || value === "false") {
    return false;
  }

  const num = Number(value);
  return !Number.isNaN(num) && num === 1;
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
        </NButton>
      </template>

      <template #providerCell="{ row }">
        {{ providerMap[String(row.smsProviderId)] || row.smsProviderId || "-" }}
      </template>

      <template #statusCell="{ row }">
        <NTag :bordered="false" :type="isActiveStatus(row.isActive) ? 'success' : 'default'">
          {{
            isActiveStatus(row.isActive)
              ? t("page.sms.templatePage.statusTag.active")
              : t("page.sms.templatePage.statusTag.inactive")
          }}
        </NTag>
      </template>

      <template #action>
        <NSpace justify="center" :size="4">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton circle quaternary size="small" type="primary" @click="handleNotImplemented">
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:pencil" />
                </template>
              </NButton>
            </template>
            {{ t("page.sms.templatePage.action.edit") }}
          </NTooltip>

          <NPopconfirm
            :negative-text="t('page.sms.templatePage.action.deleteCancel')"
            :positive-text="t('page.sms.templatePage.action.deleteOk')"
            @positive-click="handleNotImplemented"
          >
            <template #trigger>
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton circle quaternary size="small" type="error">
                    <template #icon>
                      <IconifyIcon class="size-4" icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                {{ t("page.sms.templatePage.action.delete") }}
              </NTooltip>
            </template>
            {{ t("page.sms.templatePage.action.deleteConfirm") }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>
  </Page>
</template>
