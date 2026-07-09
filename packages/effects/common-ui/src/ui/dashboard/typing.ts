import type { Component } from 'vue';

interface AnalysisOverviewItem {
  decimals?: number;
  icon: Component | string;
  suffix?: string;
  title: string;
  totalSuffix?: string;
  totalTitle: string;
  totalValue: number;
  value: number;
  valueSuffix?: string;
}

interface WorkbenchProjectItem {
  color?: string;
  content: string;
  date: string;
  group: string;
  icon: Component | string;
  title: string;
  url?: string;
}

interface WorkbenchTrendItem {
  avatar: string;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchTodoItem {
  completed: boolean;
  content: string;
  date: string;
  id?: number | string;
  priority?: string;
  status?: string;
  title: string;
}

interface WorkbenchQuickNavItem {
  color?: string;
  icon: Component | string;
  title: string;
  url?: string;
}

export type {
  AnalysisOverviewItem,
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
};
