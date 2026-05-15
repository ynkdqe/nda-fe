export namespace SmsMessageApi {
  export interface SmsMessage {
    id: number | string;
    clientId?: string;
    creationTime?: string;
    data?: string;
    message?: string;
    phoneNumber?: string;
    request?: string;
    requestId?: string;
    response?: string;
    sendedTime?: string;
    smsProvider?: SmsProvider;
    smsProviderId?: number | string;
    smsTemplate?: SmsTemplate;
    smsTemplateId?: number | string;
    status?: boolean | number | string;
  }

  export interface SmsProvider {
    id: number | string;
    creationTime?: string;
    creatorId?: string;
    creatorName?: string;
    modificationTime?: string;
    modifierId?: string;
    modifierName?: string;
    name?: string;
    providerConfig?: string;
    providerSchema?: string;
    providerUrl?: string;
    status?: boolean | number | string;
  }

  export interface SmsTemplate {
    id: number | string;
    code?: string;
    content?: string;
    isActive?: boolean | number | string;
    name?: string;
    smsProviderId?: number | string;
    template?: string;
  }

  export interface ListParams {
    current?: number;
    keyword?: string;
    page?: number;
    pageSize: number;
    smsProviderId?: number | string;
    smsTemplateId?: number | string;
    status?: boolean | number | string;
  }

  export interface ListResult<T> {
    current?: number;
    data?: T[];
    dataExtend?: unknown;
    items?: T[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }

  export interface SendSmsPayload {
    clientId?: string;
    data?: Record<string, any>;
    message?: string;
    phoneNumber?: string;
    smsProviderId?: number | string;
    smsTemplateId?: number | string;
  }
}
