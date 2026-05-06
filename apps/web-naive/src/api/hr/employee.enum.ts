export enum EmployeeGender {
  Other = 0,
  Male = 1,
  Female = 2,
}

export enum EmployeeMaritalStatus {
  Single = 0,
  Married = 1,
  Divorced = 2,
  Widowed = 3,
  Other = 4,
}

export enum EmployeeStatus {
  AnnualLeave = 'Nghỉ phép năm',
  Resigned = 'Nghỉ việc',
  SickLeave = 'Nghỉ ốm',
  Working = 'Đang làm',
}

export const employeeGenderOptions = [
  { label: 'Nam', value: EmployeeGender.Male },
  { label: 'Nữ', value: EmployeeGender.Female },
  { label: 'Khác', value: EmployeeGender.Other },
];

export const employeeMaritalStatusOptions = [
  { label: 'Độc thân', value: EmployeeMaritalStatus.Single },
  { label: 'Đã kết hôn', value: EmployeeMaritalStatus.Married },
  { label: 'Ly hôn', value: EmployeeMaritalStatus.Divorced },
  { label: 'Góa', value: EmployeeMaritalStatus.Widowed },
  { label: 'Khác', value: EmployeeMaritalStatus.Other },
];

export const employeeStatusOptions = [
  { label: 'Đang làm', value: EmployeeStatus.Working },
  { label: 'Nghỉ việc', value: EmployeeStatus.Resigned },
  { label: 'Nghỉ phép năm', value: EmployeeStatus.AnnualLeave },
  { label: 'Nghỉ ốm', value: EmployeeStatus.SickLeave },
];
