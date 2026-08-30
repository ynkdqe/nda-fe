/**
 * Toàn bộ code dưới đây khớp 1-1 với NDAPermissions ở backend.
 * Backend dùng quyền EmployeeRequest.Approve để quyết định người dùng thấy toàn bộ đơn
 * hay chỉ đơn của mình, nên FE dùng lại đúng code đó cho tab duyệt.
 */
export const EMPLOYEE_REQUEST_PERMISSIONS = {
  // Hrms.EmployeeRequest - xử lý đơn
  approve: 'Hrms.EmployeeRequest.Approve',
  reject: 'Hrms.EmployeeRequest.Reject',
  revoke: 'Hrms.EmployeeRequest.Revoke',

  // Hrms.EmployeeRequestType - cấu hình loại đơn
  viewTypes: 'Hrms.EmployeeRequestType',
  createTypes: 'Hrms.EmployeeRequestType.Create',
  updateTypes: 'Hrms.EmployeeRequestType.Update',
  deleteTypes: 'Hrms.EmployeeRequestType.Delete',

  // Hrms.EmployeeRequestReason - cấu hình lý do
  viewReasons: 'Hrms.EmployeeRequestReason',
  createReasons: 'Hrms.EmployeeRequestReason.Create',
  updateReasons: 'Hrms.EmployeeRequestReason.Update',
  deleteReasons: 'Hrms.EmployeeRequestReason.Delete',

  // Hrms.EmployeeRequestPolicy - cấu hình chính sách
  viewPolicies: 'Hrms.EmployeeRequestPolicy',
  createPolicies: 'Hrms.EmployeeRequestPolicy.Create',
  updatePolicies: 'Hrms.EmployeeRequestPolicy.Update',
  deletePolicies: 'Hrms.EmployeeRequestPolicy.Delete',
} as const;
