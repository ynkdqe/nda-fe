import type { SmsMessageApi } from "#/models/sms";

import { requestClient } from "#/api/request";

export async function fetchSmsTemplateList(params: {
  keyword?: string;
  page: number;
  pageSize: number;
  status?: boolean | number | string;
}) {
  return requestClient.get<SmsMessageApi.ListResult<SmsMessageApi.SmsTemplate>>(
    "/api/sms/template",
    {
      params,
      responseReturn: "body",
    },
  );
}
