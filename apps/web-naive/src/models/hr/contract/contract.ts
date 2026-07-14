import type { MResult } from '#/models/common';

import type { SelectOption } from "naive-ui";

export type { ContractTypeItem } from "#/models/hr/contract-type";

export type Id = number | string;
export type NullableNumber = null | number;
export type NullableString = null | string;
export type UnknownRecord = Record<string, unknown>;
export type EmployeeSelectValue = Id;
export type EmployeeModelValue = EmployeeSelectValue | EmployeeSelectValue[] | undefined;
export type EmployeeUpdateValue = (Id | null | undefined)[] | Id | null | undefined;

export type ContractSelectOption = Omit<SelectOption, "label" | "value"> & {
  label: string;
  value: Id;
};

export namespace ContractApi {
  export interface ContractEmployee {
    employeeCode?: null | string;
    id?: Id | null;
    name?: null | string;
    userName?: null | string;
  }

  export interface ContractItem extends UnknownRecord {
    allowance?: null | number | string;
    approver?: Id | null;
    basicSalary?: null | number | string;
    birthDate?: null | string;
    checkers?: Id[];
    contractCode?: null | string;
    contractName?: null | string;
    contractType?: Id | null;
    contractTypeId?: Id | null;
    creationTime?: null | string;
    effectiveDate?: null | string;
    employee?: ContractEmployee | null;
    employeeCode?: null | string;
    employeeId?: Id | null;
    employeeName?: null | string;
    expiryDate?: null | string;
    id: Id;
    insurance?: null | number | string;
    insuranceType?: Id | null;
    insuranceValue?: null | number | string;
    kpi?: null | number | string;
    modificationTime?: null | string;
    name?: null | string;
    note?: null | string;
    notes?: null | string;
    salaryGross?: null | number | string;
    status?: Id | null;
    totalCost?: null | number | string;
    totalSalary?: null | number | string;
  }

  export interface ContractListParams {
    contractType?: Id | null;
    current: number;
    effectiveEnd?: string;
    effectiveStart?: string;
    isActive?: Id | null;
    keyword?: string;
    pageSize: number;
    status?: Id | null;
  }

  export type ContractListResult = MResult<ContractItem[]>;

  export type ContractDetailResult = MResult<ContractItem>;

  export interface ContractOptionItem {
    id: Id;
    name?: null | string;
  }

  export type ContractOptionResult =
    | ContractOptionItem[]
    | {
        data?: ContractOptionItem[];
        items?: ContractOptionItem[];
      };
}

export interface SalaryConfig {
  bHealthInsurance: number;
  bOccAccInsurance: number;
  bSocialInsurance: number;
  bUnemploymentInsurance: number;
  eHealthInsurancePercent: number;
  eIsTaxFixed: boolean;
  eMinTaxSalary: number;
  eSocialInsurancePercent: number;
  eTaxPercent: number;
  eUnemployeeInsurancePercent: number;
  eUnionPercent: number;
}

export interface ContractFormModel extends UnknownRecord {
  allowance?: NullableNumber;
  approver?: Id;
  basicSalary?: NullableNumber;
  birthDate?: NullableString;
  businessCalculateOccAccInsuranceFee?: NullableNumber;
  businessHealthInsuranceFee?: NullableNumber;
  businessSocialInsuranceFee?: NullableNumber;
  businessUnemploymentInsuranceFee?: NullableNumber;
  checkers: Id[];
  contractCode?: NullableString;
  contractName?: NullableString;
  contractTypeId?: Id;
  effectiveDate?: NullableNumber;
  email?: NullableString;
  employeeCode?: NullableString;
  employeeHealthInsuranceFee?: NullableNumber;
  employeeId?: Id;
  employeeName?: NullableString;
  employeeSocialInsuranceFee?: NullableNumber;
  employeeUnionFee?: NullableNumber;
  employeeUnemploymentInsuranceFee?: NullableNumber;
  expiryDate?: NullableNumber;
  id?: Id;
  identification?: NullableString;
  insuranceSalary?: NullableNumber;
  insuranceType?: Id;
  insuranceValue?: NullableNumber;
  kpi?: NullableNumber;
  notes?: NullableString;
  phone?: NullableString;
  salaryGross?: NullableNumber;
  salaryNet?: NullableNumber;
  status?: Id;
  tax?: NullableNumber;
  taxCode?: NullableNumber;
  taxFee?: NullableNumber;
  totalCost?: NullableNumber;
}

export type ContractBusinessCostValue = null | number | string | undefined;
export type ContractBusinessCostField =
  | "businessCalculateOccAccInsuranceFee"
  | "businessHealthInsuranceFee"
  | "businessSocialInsuranceFee"
  | "businessUnemploymentInsuranceFee"
  | "totalCost";
export type ContractBusinessCostsForm = Partial<
  Record<ContractBusinessCostField, ContractBusinessCostValue>
> &
  UnknownRecord;
export interface ContractBusinessCostItem {
  field: ContractBusinessCostField;
  label: string;
}

export type ContractEmployeeCostValue = null | number | string | undefined;
export type ContractEmployeeCostField =
  | "employeeHealthInsuranceFee"
  | "employeeSocialInsuranceFee"
  | "employeeUnemploymentInsuranceFee"
  | "employeeUnionFee"
  | "insuranceSalary"
  | "insuranceType"
  | "insuranceValue"
  | "tax"
  | "taxFee";
export type ContractEmployeeCostsForm = Partial<
  Record<ContractEmployeeCostField, ContractEmployeeCostValue>
> &
  UnknownRecord;
export interface ContractEmployeeFeeItem {
  field: ContractEmployeeCostField;
  label: string;
  placeholder?: string;
}

export type ContractEmployeeInfoValue = null | number | string | undefined;
export type ContractEmployeeInfoField =
  | "birthDate"
  | "email"
  | "employeeId"
  | "identification"
  | "phone"
  | "taxCode";
export type ContractEmployeeInfoForm = Partial<
  Record<ContractEmployeeInfoField, ContractEmployeeInfoValue>
> &
  UnknownRecord;

export type ContractSalaryValue = null | number | string | undefined;
export type ContractSalaryField = "allowance" | "basicSalary" | "kpi" | "salaryGross";
export type ContractSalaryForm = Partial<Record<ContractSalaryField, ContractSalaryValue>> &
  UnknownRecord;

export type ContractStatusValue = null | number | string | undefined;
export type ContractStatusField = "approver" | "checkers" | "notes" | "status";
export type ContractStatusApprovalForm = Partial<
  Record<ContractStatusField, ContractStatusValue | EmployeeSelectValue[]>
> &
  UnknownRecord;
export type ContractStatusOption = ContractSelectOption;
