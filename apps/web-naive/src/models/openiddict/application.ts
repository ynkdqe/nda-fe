import type { MResult } from '#/models/common';

export namespace OpenIddictApplicationApi {
  export interface ApplicationItem {
    applicationType: null | string;
    clientId: string;
    clientType: null | string;
    clientUri: null | string;
    consentType: null | string;
    creationTime: null | string;
    displayName: null | string;
    grantTypes: string[];
    id: string;
    lastModificationTime: null | string;
    logoUri: null | string;
    postLogoutRedirectUris: string[];
    redirectUris: string[];
    scopes: string[];
  }

  export interface ApplicationListParams {
    current: number;
    pageSize: number;
  }

  export interface CreateApplicationParams {
    applicationType: string;
    clientId: string;
    clientSecret: string;
    clientType: string;
    clientUri: string;
    consentType: string;
    displayName: string;
    grantTypes: string[];
    logoUri: string;
    postLogoutRedirectUris: string[];
    redirectUris: string[];
    scopes: string[];
  }

  export type UpdateApplicationParams = Omit<
    CreateApplicationParams,
    'clientId'
  >;

  export type ApplicationFormPayload = CreateApplicationParams & {
    id?: string;
  };

  export type ApplicationDetailResult = MResult<ApplicationItem>;

  export type ApplicationListResult = MResult<ApplicationItem[]>;
}
