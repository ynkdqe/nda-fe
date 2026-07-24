import type { RouteRecordRaw } from "vue-router";

import { $t } from "#/locales";

const identityPermissions = ["AbpIdentity.Users", "AbpIdentity.Roles"];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: identityPermissions,
      icon: "lucide:shield-user",
      order: 20,
      title: $t("page.identity.title"),
    },
    name: "IdentityManagement",
    path: "/identity",
    children: [
      {
        name: "IdentityUsers",
        path: "/identity/users",
        component: () => import("#/views/identity/users/index.vue"),
        meta: {
          authority: ["AbpIdentity.Users"],
          icon: "lucide:users",
          title: $t("page.identity.users"),
        },
      },
      {
        name: "IdentityRoles",
        path: "/identity/roles",
        component: () => import("#/views/identity/roles/index.vue"),
        meta: {
          authority: ["AbpIdentity.Roles"],
          icon: "lucide:shield-check",
          title: $t("page.identity.roles"),
        },
      },
    ],
  },
];

export default routes;
