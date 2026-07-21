import type { MResult } from '#/models/common';

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

  export interface SmsProviderPayload {
    name: string;
    providerConfig: string;
    providerSchema: string;
    providerUrl: string;
    status: 0 | 1;
  }

  export type SmsProviderFormPayload = SmsProviderPayload & {
    id?: number | string;
  };

  export interface SmsTemplate {
    id: number | string;
    code?: string;
    content?: string;
    isActive?: boolean | number | string;
    name?: string;
    smsProviderId?: number | string;
    template?: string;
  }

  export interface SmsTemplatePayload {
    code: string;
    isActive: boolean;
    name: string;
    smsProviderId: number | string;
    template: string;
  }

  export type SmsTemplateFormPayload = SmsTemplatePayload & {
    id?: number | string;
  };

  export interface ListParams {
    current: number;
    keyword?: string;
    pageSize: number;
    smsProviderId?: number | string;
    smsTemplateId?: number | string;
    status?: boolean | number | string;
  }

  export type ListResult<T> = MResult<T[]>;

  export interface SendSmsPayload {
    clientId?: string;
    data?: Record<string, any>;
    message?: string;
    phoneNumber?: string;
    smsProviderId?: number | string;
    smsTemplateId?: number | string;
  }
}
