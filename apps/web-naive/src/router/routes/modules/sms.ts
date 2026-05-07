import type { RouteRecordRaw } from "vue-router";

import { $t } from "#/locales";

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: "lucide:message-square-text",
      order: 30,
      title: $t("page.sms.title"),
    },
    name: "SmsManagement",
    path: "/sms",
    children: [
      {
        name: "SmsMessages",
        path: "/sms/messages",
        component: () => import("#/views/sms/messages.vue"),
        meta: {
          icon: "lucide:messages-square",
          title: $t("page.sms.messages"),
          keepAlive: true,
        },
      },
      {
        name: "SmsProviders",
        path: "/sms/providers",
        component: () => import("#/views/sms/providers.vue"),
        meta: {
          icon: "lucide:radio-tower",
          title: $t("page.sms.providers"),
          keepAlive: true,
        },
      },
      {
        name: "SmsTemplates",
        path: "/sms/templates",
        component: () => import("#/views/sms/templates.vue"),
        meta: {
          icon: "lucide:file-text",
          title: $t("page.sms.templates"),
          keepAlive: true,
        },
      },
      {
        name: "SmsAdminNotifications",
        path: "/sms/admin-notifications",
        component: () => import("#/views/sms/admin-notifications.vue"),
        meta: {
          icon: "lucide:bell-ring",
          title: $t("page.sms.adminNotifications"),
          keepAlive: true,
        },
      },
      {
        name: "SmsPersonalNotifications",
        path: "/sms/personal-notifications",
        component: () => import("#/views/sms/personal-notifications.vue"),
        meta: {
          icon: "lucide:bell",
          title: $t("page.sms.personalNotifications"),
          keepAlive: true,
        },
      },
    ],
  },
];

export default routes;
