import type { RouteRecordRaw } from "vue-router";

import { $t } from "#/locales";

const hrPermissions = [
  "Hrms.Spreedsheet",
  "Hrms.Employee",
  "Hrms.OrganizationUnit",
  "Hrms.Payroll",
  "Hrms.Contract",
  "Hrms.ContractType",
  "Hrms.Workshift",
  "Hrms.WorkSchedule",
  "Hrms.Holiday",
];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: hrPermissions,
      icon: "lucide:users-round",
      order: 10,
      title: $t("page.hr.title"),
    },
    name: "HumanResources",
    path: "/hr",
    children: [
      {
        name: "HrAttendance",
        path: "/hr/attendance",
        component: () => import("#/views/hr/timesheets/index.vue"),
        meta: {
          authority: ["Hrms.Spreedsheet"],
          icon: "lucide:calendar-check",
          title: $t("page.hr.attendance"),
          keepAlive: true,
        },
      },
      {
        name: "HrEmployees",
        path: "/hr/employees",
        component: () => import("#/views/hr/employees/index.vue"),
        meta: {
          authority: ["Hrms.Employee"],
          icon: "lucide:user-round",
          title: $t("page.hr.employees"),
          keepAlive: true,
        },
      },
      {
        name: "HrOrganizationUnits",
        path: "/hr/organization-units",
        component: () => import("#/views/identity/organizations/index.vue"),
        meta: {
          authority: ["Hrms.OrganizationUnit"],
          icon: "lucide:building-2",
          title: $t("page.hr.organizationUnits"),
          keepAlive: true,
        },
      },
      {
        name: "HrPayroll",
        path: "/hr/payroll",
        component: () => import("#/views/hr/payrolls/index.vue"),
        meta: {
          authority: ["Hrms.Payroll"],
          icon: "lucide:calculator",
          title: $t("page.hr.payroll"),
          keepAlive: true,
        },
      },
      {
        name: "HrContracts",
        path: "/hr/contracts",
        component: () => import("#/views/hr/contracts/index.vue"),
        meta: {
          authority: ["Hrms.Contract"],
          icon: "lucide:file-signature",
          title: $t("page.hr.contracts"),
          keepAlive: true,
        },
      },
      {
        name: "HrContractTypes",
        path: "/hr/contract-types",
        component: () => import("#/views/hr/contract-types/index.vue"),
        meta: {
          authority: ["Hrms.ContractType"],
          icon: "lucide:files",
          title: $t("page.hr.contractTypes"),
          keepAlive: true,
        },
      },
      {
        name: "HrWorkShifts",
        path: "/hr/work-shifts",
        component: () => import("#/views/hr/workshifts/index.vue"),
        meta: {
          authority: ["Hrms.Workshift"],
          icon: "lucide:clock-3",
          title: $t("page.hr.workShifts"),
          keepAlive: true,
        },
      },
      {
        name: "HrWorkSchedules",
        path: "/hr/work-schedules",
        component: () => import("#/views/hr/work-schedules/index.vue"),
        meta: {
          authority: ["Hrms.WorkSchedule"],
          icon: "lucide:calendar-days",
          title: $t("page.hr.workSchedules"),
          keepAlive: true,
        },
      },
      {
        name: "HrDayOffs",
        path: "/hr/day-offs",
        component: () => import("#/views/hr/holidays/index.vue"),
        meta: {
          authority: ["Hrms.Holiday"],
          icon: "lucide:calendar-x",
          title: $t("page.hr.dayOffs"),
          keepAlive: true,
        },
      },
    ],
  },
];

export default routes;
