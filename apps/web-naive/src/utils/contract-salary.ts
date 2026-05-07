import type {
  ContractFormModel,
  ContractSalaryField,
  ContractTypeItem,
} from "#/models/hr/contract";

import { calculateEmployeeContractCosts } from "./number";

export type SalaryComponentField = "allowance" | "kpi";

export type ContractSalaryChangedField =
  | "contractType"
  | "init"
  | "insuranceType"
  | "insuranceValue"
  | "tax"
  | ContractSalaryField;

export interface ContractSalaryCalculationInput {
  changedField?: ContractSalaryChangedField;
  contractType?: ContractTypeItem | null;
  form: Partial<ContractFormModel>;
  lastManualSalaryComponent?: null | SalaryComponentField;
}

export interface ContractSalaryCalculationResult {
  form: Partial<ContractFormModel>;
  hasSocialInsurance: boolean;
  isTaxFixed: boolean;
}

const DEFAULT_INSURANCE_PERCENT = 100;
const PERCENT_INSURANCE_TYPE = 2;

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value.replaceAll(",", ""));
    return Number.isNaN(numericValue) ? fallback : numericValue;
  }

  return fallback;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function calculatePercentFee(amount: number, percent: unknown) {
  return roundMoney((amount * toNumber(percent, 0)) / 100);
}

export function isContractSocialInsuranceEnabled(
  contractType: ContractTypeItem | null | undefined,
  salaryGross: unknown,
) {
  if (!contractType?.hasSocialInsurance) {
    return false;
  }

  const minInsuranceSalary = toNumber(contractType.minInsuranceSalary, 0);
  return toNumber(salaryGross, 0) >= minInsuranceSalary;
}

export function calculateContractSalaryState({
  changedField = "init",
  contractType,
  form,
  lastManualSalaryComponent = null,
}: ContractSalaryCalculationInput): ContractSalaryCalculationResult {
  const gross = toNumber(form.salaryGross, 0);
  const insuranceType = form.insuranceType ?? PERCENT_INSURANCE_TYPE;
  const hasSocialInsurance = isContractSocialInsuranceEnabled(contractType, gross);
  const isTaxFixed = Boolean(contractType?.isTaxFixed);

  const insuranceValueMax =
    Number(insuranceType) === PERCENT_INSURANCE_TYPE ? DEFAULT_INSURANCE_PERCENT : gross;
  const insuranceValue = hasSocialInsurance
    ? clamp(toNumber(form.insuranceValue, DEFAULT_INSURANCE_PERCENT), 0, insuranceValueMax)
    : 0;
  let insuranceSalary = 0;

  if (hasSocialInsurance) {
    insuranceSalary =
      Number(insuranceType) === PERCENT_INSURANCE_TYPE
        ? roundMoney(gross * (insuranceValue / 100))
        : roundMoney(insuranceValue);
  }
  const basicSalary = insuranceSalary;
  const remainingSalary = Math.max(roundMoney(gross - basicSalary), 0);

  let kpi = toNumber(form.kpi, 0);
  let allowance = toNumber(form.allowance, 0);

  if (changedField === "allowance") {
    allowance = clamp(allowance, 0, remainingSalary);
    kpi = roundMoney(remainingSalary - allowance);
  } else if (changedField === "kpi") {
    kpi = clamp(kpi, 0, remainingSalary);
    allowance = roundMoney(remainingSalary - kpi);
  } else if (lastManualSalaryComponent === "allowance") {
    allowance = clamp(allowance, 0, remainingSalary);
    kpi = roundMoney(remainingSalary - allowance);
  } else if (lastManualSalaryComponent === "kpi") {
    kpi = clamp(kpi, 0, remainingSalary);
    allowance = roundMoney(remainingSalary - kpi);
  } else {
    kpi = remainingSalary;
    allowance = 0;
  }

  const shouldUseContractTaxPercent =
    changedField === "contractType" ||
    changedField === "init" ||
    form.tax === null ||
    form.tax === undefined;
  let tax = 0;

  if (isTaxFixed) {
    tax = shouldUseContractTaxPercent
      ? clamp(toNumber(contractType?.taxPercent, 0), 0, 100)
      : clamp(toNumber(form.tax, 0), 0, 100);
  }

  const employeeCosts = calculateEmployeeContractCosts({
    basicSalary,
    contractType,
    salaryGross: gross,
    taxPercent: tax,
  });

  const businessSocialInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(insuranceSalary, contractType?.businessSocialInsurancePercent)
    : 0;
  const businessHealthInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(insuranceSalary, contractType?.businessHealthInsurancePercent)
    : 0;
  const businessUnemploymentInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(insuranceSalary, contractType?.businessUnemploymentInsurancePercent)
    : 0;
  const businessCalculateOccAccInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(insuranceSalary, contractType?.businessOccAccInsurancePercent)
    : 0;

  const salaryNet = roundMoney(
    gross -
      employeeCosts.employeeSocialInsuranceFee -
      employeeCosts.employeeHealthInsuranceFee -
      employeeCosts.employeeUnemploymentInsuranceFee -
      employeeCosts.taxFee,
  );
  const totalCost = roundMoney(
    gross +
      businessSocialInsuranceFee +
      businessCalculateOccAccInsuranceFee +
      businessHealthInsuranceFee +
      businessUnemploymentInsuranceFee,
  );

  return {
    form: {
      allowance,
      basicSalary,
      businessCalculateOccAccInsuranceFee,
      businessHealthInsuranceFee,
      businessSocialInsuranceFee,
      businessUnemploymentInsuranceFee,
      employeeHealthInsuranceFee: employeeCosts.employeeHealthInsuranceFee,
      employeeSocialInsuranceFee: employeeCosts.employeeSocialInsuranceFee,
      employeeUnemploymentInsuranceFee: employeeCosts.employeeUnemploymentInsuranceFee,
      insuranceSalary,
      insuranceType,
      insuranceValue,
      kpi,
      salaryNet,
      tax,
      taxFee: employeeCosts.taxFee,
      totalCost,
    },
    hasSocialInsurance,
    isTaxFixed,
  };
}
