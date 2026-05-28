import type { SmsMessageApi } from "#/models/sms";

import { requestClient } from "#/api/request";

export async function fetchSmsMessageList(params: SmsMessageApi.ListParams) {
  return requestClient.get<SmsMessageApi.ListResult<SmsMessageApi.SmsMessage>>("/api/sms/message", {
    params,
    responseReturn: "body",
  });
}

export async function sendSmsMessage(data: SmsMessageApi.SendSmsPayload) {
  return requestClient.post("/api/sms/messages/send", data, {
    responseReturn: "body",
  });
}
