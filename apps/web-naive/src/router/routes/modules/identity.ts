import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-user',
      order: 20,
      title: $t('page.identity.title'),
    },
    name: 'IdentityManagement',
    path: '/identity',
    children: [
      {
        name: 'IdentityUsers',
        path: '/identity/users',
        component: () => import('#/views/identity/users.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('page.identity.users'),
        },
      },
      {
        name: 'IdentityRoles',
        path: '/identity/roles',
        component: () => import('#/views/identity/roles.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: $t('page.identity.roles'),
        },
      },
      {
        name: 'IdentityOrganizations',
        path: '/identity/organizations',
        component: () => import('#/views/identity/organizations.vue'),
        meta: {
          icon: 'lucide:building-2',
          title: $t('page.identity.organizations'),
        },
      },
    ],
  },
];

export default routes;
