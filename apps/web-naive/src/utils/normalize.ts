export type NullableSelectValue = null | number | string;
export type NullableString = null | string;

export function normalizeText(value?: NullableString) {
  return value?.trim() || null;
}

export function normalizeSelectValue(value?: NullableSelectValue) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value).trim() || null;
}

export function normalizeNumberValue(value?: null | number | string) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}
