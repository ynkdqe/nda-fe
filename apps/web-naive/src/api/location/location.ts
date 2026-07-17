import type { MResult } from '#/models/common';

import { requestClient } from '#/api/request';

export namespace LocationApi {
  export interface GetLocationParams {
    lat: number;
    lon: number;
    vendor: string;
  }

  export interface LocationItem {
    address: string;
    lat: number;
    long: number;
  }

  export interface ValidateLocationParams {
    allowedDistance: number;
    defaultLat: string;
    defaultLong: string;
    lat: string;
    long: string;
  }

  export interface ValidationResult {
    defaultLat: number;
    defaultLong: number;
    isValid: boolean;
    lat: number;
    long: number;
  }

  export type GetLocationResult = MResult<LocationItem[]>;
  export type ValidateLocationResult = MResult<ValidationResult>;
}

export async function getLocationApi(params: LocationApi.GetLocationParams) {
  return requestClient.get<LocationApi.GetLocationResult>(
    '/api/location/get-location',
    {
      params,
      responseReturn: 'body',
    },
  );
}

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return null;

  return (
    document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.split('=')[1] ?? null
  );
}

function createValidationHeaders() {
  const token =
    getCookieValue('RequestVerificationToken') ??
    getCookieValue('__RequestVerificationToken') ??
    getCookieValue('XSRF-TOKEN');
  const headers: Record<string, string> = {
    Accept: 'text/plain',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    headers.RequestVerificationToken = decodeURIComponent(token);
  }

  return headers;
}

export async function validateLocationApi(
  data: LocationApi.ValidateLocationParams,
) {
  return requestClient.post<LocationApi.ValidateLocationResult>(
    '/api/location/validation',
    data,
    {
      headers: createValidationHeaders(),
      responseReturn: 'body',
    },
  );
}
