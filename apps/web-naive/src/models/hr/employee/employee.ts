import type { NullableSelectValue, NullableString } from '#/utils/normalize';

export interface EmployeeBankFormItem {
  accountName: string;
  accountNo: string;
  bankId: NullableSelectValue;
  id: string;
  key: number;
}

export interface EmployeeFormData {
  address?: NullableString;
  banks: EmployeeBankFormItem[];
  birthDate?: null | number;
  concurrencyStamp?: NullableString;
  department?: NullableSelectValue;
  email?: NullableString;
  employeeCode?: NullableString;
  enrollDate?: null | number;
  gender?: null | number;
  id?: number | string;
  identification?: NullableString;
  maritalStatus?: null | number;
  name: string;
  phone: string;
  position?: NullableSelectValue;
  resignationDate?: null | number;
  status?: NullableString;
  taxCode?: NullableString;
  userId?: NullableString;
  userName?: NullableString;
}
