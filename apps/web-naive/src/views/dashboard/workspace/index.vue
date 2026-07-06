<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
} from '@vben/common-ui';

import type {
  AuditActionDto,
  AuditLogDto,
  AuditLogListResult,
} from '#/models/audit-log';
import type { TodoDto, TodoListResult } from '#/models/todo';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { formatDate, openWindow } from '@vben/utils';

import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NModal,
  NPagination,
  NScrollbar,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { requestClient } from '#/api/request';
import {
  getCachedCurrentWeather,
  getLocationByIp,
  resolveWeatherDescription,
} from '#/api/weather';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();
const AUDIT_LOG_PAGE_SIZE = 5;
const TODO_PAGE_SIZE = 5;

// Đây là dữ liệu mẫu; các dự án thực tế cần điều chỉnh dựa trên các trường hợp cụ thể.
// URL cũng có thể là một tuyến đường nội bộ, được xác định và xử lý trong phương thức `navTo` để chuyển hướng nội bộ.
// Ví dụ: URL: /dashboard/workspace
const projectItems: WorkbenchProjectItem[] = [
  {
    color: '',
    content: 'E-commerce',
    date: '07-05-2022',
    group: '29-03-2018',
    icon: 'https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/fd3ef04e572c6436a8580539e7555fd0.jpg',
    title: 'FRT Retail',
    url: 'https://fptshop.com.vn',
  },
  {
    color: '#3fb27f',
    content: 'IT Outsourcing',
    date: '03-02-2023',
    group: '09-05-2022',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi6RVHnMD4Ru7qT0wy4qOduoQflhWN2Qhz9A&s',
    title: 'CMC Global',
    url: 'https://cmcglobal.com.vn',
  },
  {
    color: '#e18525',
    content: 'Education',
    date: '10-11-2023',
    group: '06-02-2023',
    icon: 'https://vinschool.edu.vn/wp-content/themes/vsc/favicon.ico',
    title: 'Vinschool',
    url: 'https://vinschool.edu.vn/',
  },
  {
    color: '#bf0c2c',
    content: 'Real Estate',
    date: '31-07-2025',
    group: '13-11-2023',
    icon: 'https://meeygroup.com/favicon.ico?v=1.48',
    title: 'MeeyLand',
    url: 'https://meeygroup.com/',
  },
  {
    color: '#00d8ff',
    content: 'IT and Software Solutions',
    date: '13-05-2026',
    group: '01-08-2025',
    icon: 'https://www.microtecweb.com/favicon.ico',
    title: 'Microtec',
    url: 'https://www.microtecweb.com/',
  },
  {
    color: '#00d8ff',
    content: 'Restaurant Business',
    date: '-',
    group: '14-05-2026',
    icon: 'https://cdn1.vieclam24h.vn/images/default/2023/06/26/logo%20GGG_vertital_168774578619.w-240.h-240.png',
    title: 'Golden Gate Group',
    url: 'https://ggc.com.vn',
  },
];

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const quickNavItems = computed<WorkbenchQuickNavItem[]>(() => [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: $t('page.dashboard.workspace.nav.home'),
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: $t('page.dashboard.workspace.nav.dashboard'),
    url: '/dashboard',
  },
  {
    color: '#e18525',
    icon: 'ion:layers-outline',
    title: $t('page.dashboard.workspace.nav.components'),
    url: '/demos/features/icons',
  },
  {
    color: '#3fb27f',
    icon: 'ion:settings-outline',
    title: $t('page.dashboard.workspace.nav.settings'),
    url: '/demos/features/login-expired',
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: $t('page.dashboard.workspace.nav.access'),
    url: '/demos/access/page-control',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: $t('page.dashboard.workspace.nav.charts'),
    url: '/analytics',
  },
]);

const todoItems = ref<WorkbenchTodoItem[]>([]);
const todoLoading = ref(false);
const todoCurrentPage = ref(1);
const todoTotal = ref(0);

const auditLogs = ref<AuditLogDto[]>([]);
const auditLogLoading = ref(false);
const auditLogCurrentPage = ref(1);
const auditLogTotal = ref(0);
const selectedAuditLog = ref<AuditLogDto | null>(null);
const showAuditLogDetailModal = ref(false);

const router = useRouter();

const TODO_COMPLETED_STATUSES = new Set(['closed', 'completed', 'done']);

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
const weatherDesc = ref($t('page.dashboard.workspace.weather.loading'));

function escapeHtml(value?: null | number | string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getTodoPriorityLabel(priority?: null | string) {
  const priorityKey = priority?.toLowerCase();

  if (priorityKey && ['high', 'low', 'medium'].includes(priorityKey)) {
    return $t(`page.dashboard.workspace.todo.priority.${priorityKey}`);
  }

  return priority || '-';
}

function getTodoStatusLabel(status?: null | string) {
  const statusKey = status?.toLowerCase();

  if (
    statusKey &&
    ['closed', 'completed', 'done', 'open'].includes(statusKey)
  ) {
    return $t(`page.dashboard.workspace.todo.status.${statusKey}`);
  }

  return status || '-';
}

function isTodoCompleted(todo: TodoDto) {
  const status = todo.status?.toLowerCase();
  return Boolean(
    (status && TODO_COMPLETED_STATUSES.has(status)) || todo.progress === '4',
  );
}

function formatTodoDate(todo: TodoDto) {
  const date = isTodoCompleted(todo)
    ? (todo.completionDate ?? todo.dueDate ?? todo.creationTime)
    : (todo.dueDate ?? todo.creationTime);

  return date ? formatDate(date, 'DD-MM-YYYY HH:mm:ss') : '-';
}

function mapTodoToWorkbenchItem(todo: TodoDto): WorkbenchTodoItem {
  const code = todo.code || todo.taskId || todo.id;
  const creatorName = todo.creatorName || '-';
  const priority = getTodoPriorityLabel(todo.priority);
  const status = getTodoStatusLabel(todo.status);

  return {
    completed: isTodoCompleted(todo),
    content: `${escapeHtml(`#${code}`)} · ${escapeHtml(creatorName)} · ${escapeHtml(priority)}`,
    date: formatTodoDate(todo),
    id: todo.id,
    priority: todo.priority?.toLowerCase() || undefined,
    status,
    title: todo.name || String(code),
  };
}

function normalizeTodos(response: TodoListResult) {
  return (response.data ?? []).map((todo) => mapTodoToWorkbenchItem(todo));
}

async function fetchTodos(page = todoCurrentPage.value) {
  todoLoading.value = true;

  try {
    const response = await requestClient.get<TodoListResult>('/api/todo', {
      params: {
        current: page,
        pageSize: TODO_PAGE_SIZE,
      },
      responseReturn: 'body',
    });

    todoCurrentPage.value = page;
    todoTotal.value = response.total ?? response.data?.length ?? 0;
    todoItems.value = normalizeTodos(response);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    todoItems.value = [];
    todoTotal.value = 0;
  } finally {
    todoLoading.value = false;
  }
}

function getAuditLogTitle(log: AuditLogDto) {
  return (
    log.userName ||
    log.clientId ||
    log.applicationName ||
    $t('page.dashboard.workspace.auditLog.unknownUser')
  );
}

function getAuditLogStatusType(statusCode?: null | number) {
  if (!statusCode) return 'default';
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warning';
  if (statusCode >= 300) return 'info';
  return 'success';
}

function getAuditLogMethodType(method?: null | string) {
  const methodTypeMap: Record<
    string,
    'default' | 'error' | 'info' | 'success' | 'warning'
  > = {
    DELETE: 'error',
    GET: 'info',
    PATCH: 'warning',
    POST: 'success',
    PUT: 'warning',
  };

  return method
    ? (methodTypeMap[method.toUpperCase()] ?? 'default')
    : 'default';
}

function getAuditLogIcon(log: AuditLogDto) {
  if ((log.httpStatusCode ?? 0) >= 400) return 'lucide:shield-alert';

  const method = log.httpMethod?.toUpperCase();
  const methodIconMap: Record<string, string> = {
    DELETE: 'lucide:trash-2',
    GET: 'lucide:eye',
    PATCH: 'lucide:edit-3',
    POST: 'lucide:plus-circle',
    PUT: 'lucide:pencil',
  };

  return method
    ? (methodIconMap[method] ?? 'lucide:activity')
    : 'lucide:activity';
}

function getDefaultAuditLogMethod() {
  return $t('page.dashboard.workspace.auditLog.defaultMethod');
}

function getAuditLogSummary(log: AuditLogDto) {
  const method = log.httpMethod || getDefaultAuditLogMethod();
  const url = log.url || '-';
  const statusCode = log.httpStatusCode ?? 0;
  const duration =
    typeof log.executionDuration === 'number'
      ? $t('page.dashboard.workspace.auditLog.summary.duration', [
          log.executionDuration,
        ])
      : '';

  if (statusCode === 403) {
    return $t('page.dashboard.workspace.auditLog.summary.forbidden', [
      url,
      duration,
    ]);
  }

  if (statusCode >= 400) {
    return $t('page.dashboard.workspace.auditLog.summary.failed', [
      method,
      url,
      statusCode,
      duration,
    ]);
  }

  return $t('page.dashboard.workspace.auditLog.summary.success', [
    method,
    url,
    duration,
  ]);
}

function formatAuditLogDate(value?: null | string) {
  return value ? formatDate(value, 'DD-MM-YYYY HH:mm:ss') : '-';
}

function getShortServiceName(value?: null | string) {
  if (!value) return '-';
  const parts = value.split('.');
  return parts.at(-1) || value;
}

function formatJsonText(value?: null | string) {
  if (!value) return '-';

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function normalizeAuditLogs(
  response: AuditLogListResult,
  currentPage: number,
  pageSize: number,
) {
  const data = response.data ?? [];

  if (response.current || response.pageSize || data.length <= pageSize) {
    return data;
  }

  return data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
}

async function fetchAuditLogs(page = auditLogCurrentPage.value) {
  auditLogLoading.value = true;

  try {
    const response = await requestClient.get<AuditLogListResult>(
      '/api/audit-log',
      {
        params: {
          current: page,
          pageSize: AUDIT_LOG_PAGE_SIZE,
        },
        responseReturn: 'body',
      },
    );

    auditLogCurrentPage.value = page;
    auditLogTotal.value = response.total ?? response.data?.length ?? 0;
    auditLogs.value = normalizeAuditLogs(response, page, AUDIT_LOG_PAGE_SIZE);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    auditLogs.value = [];
    auditLogTotal.value = 0;
  } finally {
    auditLogLoading.value = false;
  }
}

function openAuditLogDetail(log: AuditLogDto) {
  selectedAuditLog.value = log;
  showAuditLogDetailModal.value = true;
}

function getActionTitle(action: AuditActionDto, index: number) {
  const serviceName = getShortServiceName(action.serviceName);
  const methodName = action.methodName || '-';
  return $t('page.dashboard.workspace.auditLog.actionTitle', [
    index + 1,
    serviceName,
    methodName,
  ]);
}

async function fetchWeather() {
  try {
    const location = await getLocationByIp();
    if (location) {
      const weather = await getCachedCurrentWeather(
        location.latitude,
        location.longitude,
      );
      const desc = resolveWeatherDescription(weather.weathercode, $t);
      weatherDesc.value = `${location.city}, ${desc} - ${weather.temperature}℃`;
    }
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    weatherDesc.value = $t('page.dashboard.workspace.weather.error');
  }
}

onMounted(() => {
  void Promise.allSettled([fetchWeather(), fetchAuditLogs(), fetchTodos()]);
});
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        {{
          $t('page.dashboard.workspace.welcomeTitle', [
            userStore.userInfo?.realName,
          ])
        }}
      </template>
      <template #description> {{ weatherDesc }} </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject
          :items="projectItems"
          :title="$t('page.dashboard.workspace.projects')"
          @click="navTo"
        />

        <NCard
          class="mt-5"
          :title="$t('page.dashboard.workspace.latestDynamic')"
        >
          <NSpin :show="auditLogLoading">
            <NEmpty
              v-if="auditLogs.length === 0 && !auditLogLoading"
              :description="$t('page.dashboard.workspace.auditLog.empty')"
            />
            <ul v-else class="w-full divide-y divide-border" role="list">
              <li
                v-for="log in auditLogs"
                :key="log.id"
                class="flex cursor-pointer justify-between gap-x-6 py-5 transition-colors hover:bg-muted/50"
                @click="openAuditLogDetail(log)"
              >
                <div class="flex min-w-0 items-center gap-x-4 px-2">
                  <div
                    class="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <IconifyIcon class="size-5" :icon="getAuditLogIcon(log)" />
                  </div>
                  <div class="min-w-0 flex-auto">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm/6 font-semibold text-foreground">
                        {{ getAuditLogTitle(log) }}
                      </p>
                      <NTag
                        :bordered="false"
                        size="small"
                        :type="getAuditLogMethodType(log.httpMethod)"
                      >
                        {{ log.httpMethod || getDefaultAuditLogMethod() }}
                      </NTag>
                      <NTag
                        :bordered="false"
                        size="small"
                        :type="getAuditLogStatusType(log.httpStatusCode)"
                      >
                        {{ log.httpStatusCode || '-' }}
                      </NTag>
                    </div>
                    <p class="mt-1 truncate text-xs/5 text-foreground/80">
                      {{ getAuditLogSummary(log) }}
                    </p>
                  </div>
                </div>
                <div
                  class="hidden h-full shrink-0 px-2 sm:flex sm:flex-col sm:items-end"
                >
                  <span class="mt-6 text-xs/6 text-foreground/80">
                    {{ formatAuditLogDate(log.executionTime) }}
                  </span>
                </div>
              </li>
            </ul>
          </NSpin>

          <div
            v-if="auditLogTotal > AUDIT_LOG_PAGE_SIZE"
            class="mt-4 flex justify-end"
          >
            <NPagination
              v-model:page="auditLogCurrentPage"
              :item-count="auditLogTotal"
              :page-size="AUDIT_LOG_PAGE_SIZE"
              @update:page="fetchAuditLogs"
            />
          </div>
        </NCard>
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          :title="$t('page.dashboard.workspace.quickNav')"
          @click="navTo"
        />
        <NSpin :show="todoLoading" class="mt-5">
          <WorkbenchTodo
            v-if="todoItems.length > 0 || todoLoading"
            :items="todoItems"
            :title="$t('page.dashboard.workspace.todoItems')"
          />
          <NCard v-else :title="$t('page.dashboard.workspace.todoItems')">
            <NEmpty :description="$t('page.dashboard.workspace.todo.empty')" />
          </NCard>
        </NSpin>
        <div v-if="todoTotal > TODO_PAGE_SIZE" class="mt-4 flex justify-end">
          <NPagination
            v-model:page="todoCurrentPage"
            :item-count="todoTotal"
            :page-size="TODO_PAGE_SIZE"
            @update:page="fetchTodos"
          />
        </div>
        <AnalysisChartCard
          class="mt-5"
          :title="$t('page.dashboard.workspace.accessSource')"
        >
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>

    <NModal
      v-model:show="showAuditLogDetailModal"
      preset="card"
      :title="$t('page.dashboard.workspace.auditLog.detailTitle')"
      class="max-w-[920px]"
    >
      <template v-if="selectedAuditLog">
        <NScrollbar class="max-h-[72vh] pr-2">
          <NSpace vertical :size="16">
            <NDescriptions bordered :column="2" size="small">
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.user')"
              >
                {{ getAuditLogTitle(selectedAuditLog) }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.time')"
              >
                {{ formatAuditLogDate(selectedAuditLog.executionTime) }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.method')"
              >
                <NTag
                  :bordered="false"
                  size="small"
                  :type="getAuditLogMethodType(selectedAuditLog.httpMethod)"
                >
                  {{
                    selectedAuditLog.httpMethod || getDefaultAuditLogMethod()
                  }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.status')"
              >
                <NTag
                  :bordered="false"
                  size="small"
                  :type="getAuditLogStatusType(selectedAuditLog.httpStatusCode)"
                >
                  {{ selectedAuditLog.httpStatusCode || '-' }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.url')"
                :span="2"
              >
                {{ selectedAuditLog.url || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.clientId')"
              >
                {{ selectedAuditLog.clientId || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.ip')"
              >
                {{ selectedAuditLog.clientIpAddress || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="
                  $t('page.dashboard.workspace.auditLog.labels.correlationId')
                "
                :span="2"
              >
                {{ selectedAuditLog.correlationId || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.browser')"
                :span="2"
              >
                {{ selectedAuditLog.browserInfo || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('page.dashboard.workspace.auditLog.labels.error')"
                :span="2"
              >
                <pre class="whitespace-pre-wrap break-words text-xs">{{
                  formatJsonText(selectedAuditLog.exceptions)
                }}</pre>
              </NDescriptionsItem>
            </NDescriptions>

            <div>
              <h3 class="mb-3 text-base font-semibold text-foreground">
                {{ $t('page.dashboard.workspace.auditLog.actions') }}
              </h3>
              <NEmpty
                v-if="(selectedAuditLog.actions?.length ?? 0) === 0"
                :description="$t('page.dashboard.workspace.auditLog.noActions')"
              />
              <NSpace v-else vertical :size="12">
                <NCard
                  v-for="(action, index) in selectedAuditLog.actions"
                  :key="action.id"
                  size="small"
                  :title="getActionTitle(action, index)"
                >
                  <NDescriptions bordered :column="2" size="small">
                    <NDescriptionsItem
                      :label="
                        $t('page.dashboard.workspace.auditLog.labels.service')
                      "
                    >
                      {{ action.serviceName || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem
                      :label="
                        $t(
                          'page.dashboard.workspace.auditLog.labels.actionMethod',
                        )
                      "
                    >
                      {{ action.methodName || '-' }}
                    </NDescriptionsItem>
                    <NDescriptionsItem
                      :label="
                        $t('page.dashboard.workspace.auditLog.labels.time')
                      "
                    >
                      {{ formatAuditLogDate(action.executionTime) }}
                    </NDescriptionsItem>
                    <NDescriptionsItem
                      :label="
                        $t('page.dashboard.workspace.auditLog.labels.duration')
                      "
                    >
                      {{
                        typeof action.executionDuration === 'number'
                          ? $t(
                              'page.dashboard.workspace.auditLog.durationValue',
                              [action.executionDuration],
                            )
                          : '-'
                      }}
                    </NDescriptionsItem>
                    <NDescriptionsItem
                      :label="
                        $t(
                          'page.dashboard.workspace.auditLog.labels.parameters',
                        )
                      "
                      :span="2"
                    >
                      <pre class="whitespace-pre-wrap break-words text-xs">{{
                        formatJsonText(action.parameters)
                      }}</pre>
                    </NDescriptionsItem>
                  </NDescriptions>
                </NCard>
              </NSpace>
            </div>
          </NSpace>
        </NScrollbar>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <NButton @click="showAuditLogDetailModal = false">
            {{ $t('page.dashboard.workspace.auditLog.close') }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
