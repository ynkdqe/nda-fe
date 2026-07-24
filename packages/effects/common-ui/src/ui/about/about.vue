<script setup lang="ts">
import type { AboutProps, DescriptionItem } from './about';

import { computed, h } from 'vue';

import {
  VBEN_DOC_URL,
  VBEN_GITHUB_URL,
  VBEN_PREVIEW_URL,
} from '@vben/constants';

import { VbenRenderContent } from '@vben-core/shadcn-ui';

import { Page } from '../../components';

interface Props extends AboutProps {}

defineOptions({
  name: 'AboutUI',
});

const props = withDefaults(defineProps<Props>(), {
  description:
    '是一个现代化开箱即用的中后台解决方案，采用最新的技术栈，包括 Vue 3.0、Vite、TailwindCSS 和 TypeScript 等前沿技术，代码规范严谨，提供丰富的配置选项，旨在为中大型项目的开发提供现成的开箱即用解决方案及丰富的示例，同时，它也是学习和深入前端技术的一个极佳示例。',
  labels: () => ({
    author: '作者',
    basicInfo: '基本信息',
    buildTime: '最后构建时间',
    dependencies: '生产环境依赖',
    devDependencies: '开发环境依赖',
    document: '文档地址',
    github: 'Github',
    homepage: '主页',
    license: '开源许可协议',
    preview: '预览地址',
    version: '版本号',
    view: '点击查看',
  }),
  name: 'NDA',
  title: '关于项目',
});

declare global {
  const __VBEN_ADMIN_METADATA__: {
    authorEmail: string;
    authorName: string;
    authorUrl: string;
    buildTime: string;
    dependencies: Record<string, string>;
    description: string;
    devDependencies: Record<string, string>;
    homepage: string;
    license: string;
    repositoryUrl: string;
    version: string;
  };
}

const renderLink = (href: string, text: string) =>
  h(
    'a',
    { href, target: '_blank', class: 'vben-link' },
    { default: () => text },
  );

const {
  authorEmail,
  authorName,
  authorUrl,
  buildTime,
  dependencies = {},
  devDependencies = {},
  homepage,
  license,
  version,
  // vite inject-metadata 插件注入的全局变量
} = __VBEN_ADMIN_METADATA__ || {};

const vbenDescriptionItems = computed<DescriptionItem[]>(() => [
  {
    content: version,
    title: props.labels.version,
  },
  {
    content: license,
    title: props.labels.license,
  },
  {
    content: buildTime,
    title: props.labels.buildTime,
  },
  {
    content: renderLink(homepage, props.labels.view),
    title: props.labels.homepage,
  },
  {
    content: renderLink(VBEN_DOC_URL, props.labels.view),
    title: props.labels.document,
  },
  {
    content: renderLink(VBEN_PREVIEW_URL, props.labels.view),
    title: props.labels.preview,
  },
  {
    content: renderLink(VBEN_GITHUB_URL, props.labels.view),
    title: props.labels.github,
  },
  {
    content: h('div', [
      renderLink(authorUrl, `${authorName}  `),
      renderLink(`mailto:${authorEmail}`, authorEmail),
    ]),
    title: props.labels.author,
  },
]);

const dependenciesItems = Object.keys(dependencies).map((key) => ({
  content: dependencies[key],
  title: key,
}));

const devDependenciesItems = Object.keys(devDependencies).map((key) => ({
  content: devDependencies[key],
  title: key,
}));
</script>

<template>
  <Page :title="title">
    <template #description>
      <p class="mt-3 text-sm/6 text-foreground">
        <a :href="VBEN_GITHUB_URL" class="vben-link" target="_blank">
          {{ name }}
        </a>
        {{ description }}
      </p>
    </template>
    <div class="card-box p-5">
      <div>
        <h5 class="text-lg text-foreground">{{ labels.basicInfo }}</h5>
      </div>
      <div class="mt-4">
        <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <template v-for="item in vbenDescriptionItems" :key="item.title">
            <div class="border-t border-border px-4 py-6 sm:col-span-1 sm:px-0">
              <dt class="text-sm/6 font-medium text-foreground">
                {{ item.title }}
              </dt>
              <dd class="mt-1 text-sm/6 text-foreground sm:mt-2">
                <VbenRenderContent :content="item.content" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>

    <div class="card-box mt-6 p-5">
      <div>
        <h5 class="text-lg text-foreground">{{ labels.dependencies }}</h5>
      </div>
      <div class="mt-4">
        <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <template v-for="item in dependenciesItems" :key="item.title">
            <div class="border-t border-border px-4 py-3 sm:col-span-1 sm:px-0">
              <dt class="text-sm text-foreground">
                {{ item.title }}
              </dt>
              <dd class="mt-1 text-sm text-foreground/80 sm:mt-2">
                <VbenRenderContent :content="item.content" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>
    <div class="card-box mt-6 p-5">
      <div>
        <h5 class="text-lg text-foreground">{{ labels.devDependencies }}</h5>
      </div>
      <div class="mt-4">
        <dl class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <template v-for="item in devDependenciesItems" :key="item.title">
            <div class="border-t border-border px-4 py-3 sm:col-span-1 sm:px-0">
              <dt class="text-sm text-foreground">
                {{ item.title }}
              </dt>
              <dd class="mt-1 text-sm text-foreground/80 sm:mt-2">
                <VbenRenderContent :content="item.content" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>
  </Page>
</template>
