import type { RouteRecordRaw } from "vue-router";

import { $t } from "#/locales";

const identityPermissions = [
  "AbpIdentity.Users",
  "AbpIdentity.Roles",
  "AbpIdentity.OrganizationUnits",
];

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
      {
        name: "IdentityOrganizations",
        path: "/identity/organizations",
        component: () => import("#/views/identity/organizations/index.vue"),
        meta: {
          authority: ["AbpIdentity.OrganizationUnits"],
          icon: "lucide:building-2",
          title: $t("page.identity.organizations"),
        },
      },
    ],
  },
];

export default routes;
