import type { SmsMessageApi } from "#/models/sms";

import { requestClient } from "#/api/request";

export async function fetchSmsProviderList(params: {
  current: number;
  keyword?: string;
  pageSize: number;
  status?: number | string;
}) {
  return requestClient.get<SmsMessageApi.ListResult<SmsMessageApi.SmsProvider>>(
    "/api/sms/provider",
    {
      params,
      responseReturn: "body",
    },
  );
}

export async function createSmsProvider(
  data: SmsMessageApi.SmsProviderPayload,
) {
  return requestClient.post('/api/sms/provider', data, {
    responseReturn: 'body',
  });
}

export async function updateSmsProvider(
  id: number | string,
  data: SmsMessageApi.SmsProviderPayload,
) {
  return requestClient.put(`/api/sms/provider/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteSmsProvider(id: number | string) {
  return requestClient.delete(`/api/sms/provider/${id}`, {
    responseReturn: 'body',
  });
}
