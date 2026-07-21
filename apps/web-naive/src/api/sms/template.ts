import type { SmsMessageApi } from "#/models/sms";

import { requestClient } from "#/api/request";

export async function fetchSmsTemplateList(params: {
  current: number;
  keyword?: string;
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

export async function createSmsTemplate(
  data: SmsMessageApi.SmsTemplatePayload,
) {
  return requestClient.post('/api/sms/template', data, {
    responseReturn: 'body',
  });
}

export async function updateSmsTemplate(
  id: number | string,
  data: SmsMessageApi.SmsTemplatePayload,
) {
  return requestClient.put(`/api/sms/template/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteSmsTemplate(id: number | string) {
  return requestClient.delete(`/api/sms/template/${id}`, {
    responseReturn: 'body',
  });
}
