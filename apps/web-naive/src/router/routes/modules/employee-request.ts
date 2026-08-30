import type { RouteRecordRaw } from 'vue-router';

import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';
import { $t } from '#/locales';


const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:file-pen-line',
      order: 15,
      title: $t('page.employeeRequest.title'),
    },
    name: 'EmployeeRequestManagement',
    path: '/employee-requests',
    children: [
      {
        name: 'EmployeeRequests',
        path: '/employee-requests/requests',
        component: () => import('#/views/employee-requests/request-center/index.vue'),
        meta: {
          icon: 'lucide:file-pen-line',
          keepAlive: true,
          title: $t('page.employeeRequest.requests'),
        },
      },
      {
        name: 'EmployeeRequestConfiguration',
        path: '/employee-requests/configuration',
        meta: {
          icon: 'lucide:settings-2',
          title: $t('page.employeeRequest.configuration'),
        },
        children: [
          {
            name: 'EmployeeRequestTypes',
            path: '/employee-requests/types',
            component: () =>
              import('#/views/employee-requests/employee-request-types/index.vue'),
            meta: {
              authority: [EMPLOYEE_REQUEST_PERMISSIONS.viewTypes],
              icon: 'lucide:files',
              keepAlive: true,
              title: $t('page.employeeRequest.types'),
            },
          },
          {
            name: 'EmployeeRequestReasons',
            path: '/employee-requests/reasons',
            component: () =>
              import('#/views/employee-requests/employee-request-reasons/index.vue'),
            meta: {
              authority: [EMPLOYEE_REQUEST_PERMISSIONS.viewReasons],
              icon: 'lucide:list-checks',
              keepAlive: true,
              title: $t('page.employeeRequest.reasons'),
            },
          },
          {
            name: 'EmployeeRequestPolicies',
            path: '/employee-requests/policies',
            component: () =>
              import('#/views/employee-requests/employee-request-policies/index.vue'),
            meta: {
              authority: [EMPLOYEE_REQUEST_PERMISSIONS.viewPolicies],
              icon: 'lucide:shield-check',
              keepAlive: true,
              title: $t('page.employeeRequest.policies'),
            },
          },
        ],
      },
    ],
  },
];


export default routes;
