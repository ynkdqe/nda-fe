import type { SmsMessageApi } from "#/models/sms";

import { requestClient } from "#/api/request";

export async function fetchSmsProviderList(params: {
  keyword?: string;
  page: number;
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
