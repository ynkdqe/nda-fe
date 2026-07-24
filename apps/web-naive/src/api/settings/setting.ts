import type { SettingsApi } from '#/models/settings';

import { requestClient } from '#/api/request';

export async function getSettingsApi(params: SettingsApi.SettingListParams) {
  return requestClient.get<SettingsApi.SettingListResult>('/api/settings', {
    params,
    responseReturn: 'body',
  });
}
