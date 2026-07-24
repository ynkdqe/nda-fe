<script lang="ts" setup>
import { About } from '@vben/common-ui';

import { $t } from '#/locales';

defineOptions({ name: 'About' });
</script>

<template>
  <About
    :description="$t('page.about.description')"
    :labels="{
      author: $t('page.about.author'),
      basicInfo: $t('page.about.basicInfo'),
      buildTime: $t('page.about.buildTime'),
      dependencies: $t('page.about.dependencies'),
      devDependencies: $t('page.about.devDependencies'),
      document: $t('page.about.document'),
      github: $t('page.about.github'),
      homepage: $t('page.about.homepage'),
      license: $t('page.about.license'),
      preview: $t('page.about.preview'),
      version: $t('page.about.version'),
      view: $t('page.about.view'),
    }"
    :title="$t('page.about.title')"
  />
</template>
