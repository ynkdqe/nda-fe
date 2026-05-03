import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users-round',
      order: 10,
      title: $t('page.hr.title'),
    },
    name: 'HumanResources',
    path: '/hr',
    children: [
      {
        name: 'HrAttendance',
        path: '/hr/attendance',
        component: () => import('#/views/hr/attendance.vue'),
        meta: {
          icon: 'lucide:calendar-check',
          title: $t('page.hr.attendance'),
        },
      },
      {
        name: 'HrEmployees',
        path: '/hr/employees',
        component: () => import('#/views/hr/employees.vue'),
        meta: {
          icon: 'lucide:user-round',
          title: $t('page.hr.employees'),
        },
      },
      {
        name: 'HrPayroll',
        path: '/hr/payroll',
        component: () => import('#/views/hr/payroll.vue'),
        meta: {
          icon: 'lucide:calculator',
          title: $t('page.hr.payroll'),
        },
      },
      {
        name: 'HrContracts',
        path: '/hr/contracts',
        component: () => import('#/views/hr/contracts.vue'),
        meta: {
          icon: 'lucide:file-signature',
          title: $t('page.hr.contracts'),
        },
      },
      {
        name: 'HrContractTypes',
        path: '/hr/contract-types',
        component: () => import('#/views/hr/contract-types.vue'),
        meta: {
          icon: 'lucide:files',
          title: $t('page.hr.contractTypes'),
        },
      },
      {
        name: 'HrWorkShifts',
        path: '/hr/work-shifts',
        component: () => import('#/views/hr/work-shifts.vue'),
        meta: {
          icon: 'lucide:clock-3',
          title: $t('page.hr.workShifts'),
        },
      },
      {
        name: 'HrWorkSchedules',
        path: '/hr/work-schedules',
        component: () => import('#/views/hr/work-schedules.vue'),
        meta: {
          icon: 'lucide:calendar-days',
          title: $t('page.hr.workSchedules'),
        },
      },
      {
        name: 'HrDayOffs',
        path: '/hr/day-offs',
        component: () => import('#/views/hr/day-offs.vue'),
        meta: {
          icon: 'lucide:calendar-x',
          title: $t('page.hr.dayOffs'),
        },
      },
    ],
  },
];

export default routes;
