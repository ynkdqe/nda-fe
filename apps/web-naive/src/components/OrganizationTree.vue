<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import { computed, h } from 'vue';

import { NTree } from 'naive-ui';

interface OrgItem {
  code?: string;
  displayName?: string;
  id: string;
  parentId?: string;
  userCount?: number;
}

interface OrgTreeNode extends TreeOption {
  children?: OrgTreeNode[];
  code?: string;
  displayName: string;
  key: string;
  label: string;
  userCount?: number;
}

const props = defineProps<{
  items?: OrgItem[];
}>();

const treeData = computed<OrgTreeNode[]>(() => {
  if (!props.items?.length) return [];

  const nodesMap = new Map<string, OrgTreeNode>();
  const roots: OrgTreeNode[] = [];

  props.items.forEach((item) => {
    nodesMap.set(item.id, {
      key: item.id,
      label: item.displayName ?? item.code ?? item.id,
      displayName: item.displayName ?? item.code ?? item.id,
      code: item.code,
      userCount: item.userCount,
      children: [],
    });
  });

  props.items.forEach((item) => {
    const node = nodesMap.get(item.id);
    if (!node) return;
    if (item.parentId && nodesMap.has(item.parentId)) {
      nodesMap.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const prune = (list: OrgTreeNode[]) => {
    list.forEach((n) => {
      if (!n.children?.length) delete n.children;
      else prune(n.children);
    });
  };
  prune(roots);

  return roots;
});

const expandedKeys = computed<string[]>(() => {
  const keys: string[] = [];
  const stack = [...treeData.value];
  while (stack.length > 0) {
    const node = stack.shift();
    if (!node) continue;
    keys.push(node.key);
    if (node.children?.length) stack.push(...node.children);
  }
  return [...new Set(keys)];
});

function renderLabel({ option }: { option: TreeOption }) {
  const node = option as OrgTreeNode;
  return h('div', { class: 'flex w-full items-center gap-2' }, [
    h('span', { class: 'font-medium' }, node.displayName),
    node.code
      ? h('span', { class: 'text-xs text-gray-400' }, `(${node.code})`)
      : null,
    typeof node.userCount === 'number'
      ? h(
          'span',
          { class: 'ml-auto text-xs text-gray-400' },
          `${node.userCount} thành viên`,
        )
      : null,
  ]);
}
</script>

<template>
  <NTree
    block-line
    show-line
    :data="treeData"
    :default-expanded-keys="expandedKeys"
    :render-label="renderLabel"
  />
</template>
