type Id = number | string;
type NullableNumber = null | number;
type UnknownRecord = Record<string, unknown>;

export namespace ContractTypeApi {
  export interface DurationItem extends UnknownRecord {
    description?: null | string;
    duration?: null | number | string;
    id?: Id | null;
    name?: null | string;
    unit?: null | string;
  }

  export interface ContractTypeItem extends UnknownRecord {
    businessHealthInsurancePercent?: null | number | string;
    businessOccAccInsurancePercent?: null | number | string;
    businessSocialInsurancePercent?: null | number | string;
    businessUnemploymentInsurancePercent?: null | number | string;
    code?: null | string;
    contractDurations?: DurationItem[];
    creationTime?: null | string;
    durations?: DurationItem[];
    employeeHealthInsurancePercent?: null | number | string;
    employeeMinTaxSalary?: null | number | string;
    employeeSocialInsurancePercent?: null | number | string;
    employeeUnionPercent?: null | number | string;
    employeeUnemployeeInsurancePercent?: null | number | string;
    extraProperties?: {
      durations?: DurationItem[];
    };
    hasSocialInsurance?: boolean | null;
    id: Id;
    isTaxFixed?: boolean | null;
    minInsuranceSalary?: null | number | string;
    modificationTime?: null | string;
    name?: null | string;
    taxPercent?: null | number | string;
  }

  export interface ContractTypeListParams {
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export interface ContractTypeListResult {
    current?: number;
    data?: ContractTypeItem[];
    dataExtend?: unknown;
    items?: ContractTypeItem[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }

  export type ContractTypeDetailResult =
    | ContractTypeItem
    | {
        data?: ContractTypeItem;
      };
}

export type ContractDurationItem = ContractTypeApi.DurationItem;
export type ContractTypeItem = ContractTypeApi.ContractTypeItem;

export interface ContractDurationFormItem {
  duration: number;
  id?: null | number;
  name: string;
}

export interface ContractTypeFormModel extends UnknownRecord {
  businessHealthInsurancePercent: NullableNumber;
  businessOccAccInsurancePercent: NullableNumber;
  businessSocialInsurancePercent: NullableNumber;
  businessUnemploymentInsurancePercent: NullableNumber;
  code: string;
  contractDurations: ContractDurationFormItem[];
  employeeHealthInsurancePercent: NullableNumber;
  employeeMinTaxSalary: NullableNumber;
  employeeSocialInsurancePercent: NullableNumber;
  employeeUnionPercent: NullableNumber;
  employeeUnemployeeInsurancePercent: NullableNumber;
  extraProperties: UnknownRecord;
  hasSocialInsurance: boolean;
  id?: Id;
  isTaxFixed: boolean;
  minInsuranceSalary: NullableNumber;
  name: string;
  taxPercent: NullableNumber;
}

export interface DurationRow {
  duration?: null | number;
  id?: Id | null;
  name?: null | string;
}
