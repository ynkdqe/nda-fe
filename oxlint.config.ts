import { oxlintConfig } from '@vben/oxlint-config';

import { defineConfig } from 'oxlint';

export default defineConfig({
  ...oxlintConfig,
  rules: {
    ...oxlintConfig.rules,
    // Chrome 109 (the last version supported by Windows Server 2008) lacks
    // Array.prototype.toSorted().
    'unicorn/no-array-sort': 'off',
  },
});
