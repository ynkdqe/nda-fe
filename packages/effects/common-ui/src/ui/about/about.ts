import type { Component } from 'vue';

interface AboutLabels {
  author: string;
  basicInfo: string;
  buildTime: string;
  dependencies: string;
  devDependencies: string;
  document: string;
  github: string;
  homepage: string;
  license: string;
  preview: string;
  view: string;
  version: string;
}

interface AboutProps {
  description?: string;
  labels?: AboutLabels;
  name?: string;
  title?: string;
}

interface DescriptionItem {
  content: Component | string;
  title: string;
}

export type { AboutLabels, AboutProps, DescriptionItem };
