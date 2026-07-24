import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const systemPermissions = [
  'Settings.View',
  'AbpTenantManagement.Tenants',
  'OpenIddict.Application',
];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: systemPermissions,
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
          authority: ['Settings.View'],
          icon: 'lucide:settings',
          title: $t('page.system.settings'),
        },
      },
      {
        name: 'SystemTenants',
        path: '/system/tenants',
        component: () => import('#/views/system/tenants.vue'),
        meta: {
          authority: ['AbpTenantManagement.Tenants'],
          icon: 'lucide:building',
          title: $t('page.system.tenants'),
        },
      },
      {
        name: 'SystemAuthentication',
        path: '/system/oidc',
        component: () => import('#/views/system/authentication.vue'),
        meta: {
          authority: ['OpenIddict.Application'],
          icon: 'lucide:key-round',
          title: $t('page.system.authentication'),
        },
      },
    ],
  },
];

export default routes;
