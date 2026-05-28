import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 40,
      title: $t('page.system.title'),
    },
    name: 'SystemManagement',
    path: '/system',
    children: [
      {
        name: 'SystemSettings',
        path: '/system/settings',
        component: () => import('#/views/system/settings.vue'),
        meta: {
          icon: 'lucide:settings',
          title: $t('page.system.settings'),
        },
      },
      {
        name: 'SystemTenants',
        path: '/system/tenants',
        component: () => import('#/views/system/tenants.vue'),
        meta: {
          icon: 'lucide:building',
          title: $t('page.system.tenants'),
        },
      },
      {
        name: 'SystemAuthentication',
        path: '/system/authentication',
        component: () => import('#/views/system/authentication.vue'),
        meta: {
          icon: 'lucide:key-round',
          title: $t('page.system.authentication'),
        },
      },
    ],
  },
];

export default routes;
