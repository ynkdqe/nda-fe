import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    rules: {
      // Chrome 109 (the last version supported by Windows Server 2008) lacks
      // Array.prototype.toSorted().
      'unicorn/no-array-sort': 'off',
    },
  },
]);
