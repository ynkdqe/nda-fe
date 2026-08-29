export const EMPLOYEE_REQUEST_PERMISSIONS = {
  managePolicies: 'EmployeeRequests.ManagePolicies',
  manageReasons: 'EmployeeRequests.ManageReasons',
  manageTypes: 'EmployeeRequests.ManageTypes',
  /**
   * Hai code dưới đây khớp với NDAPermissions.EmployeeRequestGroupName ở backend
   * (Hrms.EmployeeRequest.Approve / .Reject). Backend cũng dùng quyền Approve
   * để quyết định người dùng có được xem toàn bộ đơn hay chỉ đơn của mình.
   */
  approve: 'Hrms.EmployeeRequest.Approve',
  reject: 'Hrms.EmployeeRequest.Reject',
  revoke: 'Hrms.EmployeeRequest.Revoke',
} as const;
