import { defineOverridesPreferences } from '@vben/preferences';

export const DEFAULT_APP_TITLE =
  import.meta.env.VITE_APP_TITLE || 'Vben Admin';
export const DEFAULT_APP_LOGO =
  'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    defaultHomePath: '/workspace',
    enableRefreshToken: true,
    name: DEFAULT_APP_TITLE,
  },
  logo: {
    enable: true,
    fit: 'contain',
    source: DEFAULT_APP_LOGO,
    sourceDark: DEFAULT_APP_LOGO,
  },
});
