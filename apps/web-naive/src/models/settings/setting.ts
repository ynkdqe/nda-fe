import type { MResult } from '#/models/common';

export namespace SettingsApi {
  export interface SettingItem {
    defaultValue: null | string;
    description: null | string;
    displayName: null | string;
    isEncrypted: boolean;
    isSensitive: boolean;
    isVisibleToClients: boolean;
    name: string;
    providers: unknown[];
    value: null | string;
  }

  export interface SettingListParams {
    current: number;
    filter?: string;
    pageSize: number;
  }

  export type SettingListResult = MResult<SettingItem[]>;
}
