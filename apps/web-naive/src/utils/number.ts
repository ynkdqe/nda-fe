/**
 * Tính thuế Thu nhập Cá nhân (TNCN) theo biểu thuế lũy tiến 5 bậc năm 2026
 * Áp dụng từ 01/01/2026 theo Luật Thuế TNCN 2025 (số 109/2025/QH15)
 *
 * @param thuNhapTinhThue - Thu nhập tính thuế hàng tháng (SAU KHI giảm trừ gia cảnh), đơn vị: VND
 * @returns Số thuế TNCN phải nộp (làm tròn xuống đồng), đơn vị: VND
 */
export function tinhThueTNCN2026(thuNhapTinhThue: number): number {
  if (!thuNhapTinhThue || thuNhapTinhThue <= 0) {
    return 0;
  }

  let thue: number;

  if (thuNhapTinhThue <= 10_000_000) {
    // Bậc 1
    thue = thuNhapTinhThue * 0.05;
  } else if (thuNhapTinhThue <= 30_000_000) {
    // Bậc 2: 10% - 500.000
    thue = thuNhapTinhThue * 0.1 - 500_000;
  } else if (thuNhapTinhThue <= 60_000_000) {
    // Bậc 3: 20% - 3.500.000
    thue = thuNhapTinhThue * 0.2 - 3_500_000;
  } else if (thuNhapTinhThue <= 100_000_000) {
    // Bậc 4: 30% - 9.500.000
    thue = thuNhapTinhThue * 0.3 - 9_500_000;
  } else {
    // Bậc 5: 35% - 14.500.000
    thue = thuNhapTinhThue * 0.35 - 14_500_000;
  }

  return Math.floor(thue); // Làm tròn xuống đồng
}

export interface EmployeeContractCostConfig {
  employeeHealthInsurancePercent?: null | number | string;
  employeeMinTaxSalary?: null | number | string;
  employeeSocialInsurancePercent?: null | number | string;
  employeeUnemployeeInsurancePercent?: null | number | string;
  hasSocialInsurance?: boolean | null;
  isTaxFixed?: boolean | null;
  taxPercent?: null | number | string;
}

export interface EmployeeContractCostParams {
  basicSalary?: null | number | string;
  contractType?: EmployeeContractCostConfig | null;
  salaryGross?: null | number | string;
  taxPercent?: null | number | string;
}

export interface EmployeeContractCostResult {
  employeeHealthInsuranceFee: number;
  employeeSocialInsuranceFee: number;
  employeeUnemploymentInsuranceFee: number;
  taxFee: number;
  taxableIncome: number;
  preTaxIncome: number;
}

function toFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value.replaceAll(",", ""));
    return Number.isNaN(numericValue) ? fallback : numericValue;
  }

  return fallback;
}

function calculatePercentFee(amount: number, percent: unknown) {
  return Math.floor((amount * toFiniteNumber(percent, 0)) / 100);
}

/**
 * Tính các khoản phí nhân viên theo cấu hình loại hợp đồng.
 *
 * Công thức:
 * - BHXH/BHYT/BHTN = BasicSalary * percent / 100
 * - Thu nhập trước thuế = SalaryGross - BHXH - BHYT - BHTN
 * - Thu nhập chịu thuế = Thu nhập trước thuế - employeeMinTaxSalary
 * - TaxFee:
 *   - isTaxFixed = false: dùng biểu thuế lũy tiến `tinhThueTNCN2026`
 *   - isTaxFixed = true: Thu nhập chịu thuế * taxPercent / 100
 */
export function calculateEmployeeContractCosts({
  basicSalary,
  contractType,
  salaryGross,
  taxPercent,
}: EmployeeContractCostParams): EmployeeContractCostResult {
  if (!contractType) {
    return {
      employeeHealthInsuranceFee: 0,
      employeeSocialInsuranceFee: 0,
      employeeUnemploymentInsuranceFee: 0,
      preTaxIncome: 0,
      taxableIncome: 0,
      taxFee: 0,
    };
  }

  const salaryBasic = toFiniteNumber(basicSalary, 0);
  const grossSalary = toFiniteNumber(salaryGross, salaryBasic);
  const hasSocialInsurance = Boolean(contractType.hasSocialInsurance);

  const employeeSocialInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(salaryBasic, contractType?.employeeSocialInsurancePercent)
    : 0;
  const employeeHealthInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(salaryBasic, contractType?.employeeHealthInsurancePercent)
    : 0;
  const employeeUnemploymentInsuranceFee = hasSocialInsurance
    ? calculatePercentFee(salaryBasic, contractType?.employeeUnemployeeInsurancePercent)
    : 0;

  const preTaxIncome = Math.floor(
    grossSalary -
      employeeSocialInsuranceFee -
      employeeHealthInsuranceFee -
      employeeUnemploymentInsuranceFee,
  );
  const taxableIncome = Math.max(
    preTaxIncome - toFiniteNumber(contractType?.employeeMinTaxSalary, 0),
    0,
  );
  const taxFee = contractType?.isTaxFixed
    ? calculatePercentFee(taxableIncome, taxPercent ?? contractType.taxPercent)
    : tinhThueTNCN2026(taxableIncome);

  return {
    employeeHealthInsuranceFee,
    employeeSocialInsuranceFee,
    employeeUnemploymentInsuranceFee,
    preTaxIncome,
    taxableIncome,
    taxFee,
  };
}
