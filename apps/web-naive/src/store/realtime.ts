import type {
  RealtimeConnectionStatus,
  RealtimeEvent,
} from '#/services/signalr';

import { computed, shallowRef } from 'vue';

import { defineStore } from 'pinia';

import {
  startRealtimeConnection,
  stopRealtimeConnection,
} from '#/services/signalr';

const MAX_TRACKED_EVENT_TYPES = 32;

export const useRealtimeStore = defineStore('realtime', () => {
  const status = shallowRef<RealtimeConnectionStatus>('disconnected');
  const latestEvent = shallowRef<null | RealtimeEvent>(null);
  const revisions = shallowRef<Record<string, number>>({});

  const connected = computed(() => status.value === 'connected');
  const latestEventType = computed(() => latestEvent.value?.type ?? null);

  function handleEvent(event: RealtimeEvent) {
    const type = event.type.trim().toLowerCase();
    const normalizedEvent = {
      ...event,
      event: event.event?.trim().toLowerCase() ?? null,
      type,
    };

    latestEvent.value = normalizedEvent;

    const nextRevisions = { ...revisions.value };
    if (
      !(type in nextRevisions) &&
      Object.keys(nextRevisions).length >= MAX_TRACKED_EVENT_TYPES
    ) {
      const oldestType = Object.keys(nextRevisions)[0];
      if (oldestType) {
        delete nextRevisions[oldestType];
      }
    }

    nextRevisions[type] = (nextRevisions[type] ?? 0) + 1;
    revisions.value = nextRevisions;
  }

  function getLatestData<TData>(type: string) {
    const normalizedType = type.trim().toLowerCase();
    if (latestEvent.value?.type !== normalizedType) {
      return null;
    }

    return (latestEvent.value.data ?? null) as null | TData;
  }

  function getRevision(type: string) {
    return revisions.value[type.trim().toLowerCase()] ?? 0;
  }

  async function start() {
    await startRealtimeConnection(handleEvent, (nextStatus) => {
      status.value = nextStatus;
    });
  }

  async function stop() {
    await stopRealtimeConnection();
    status.value = 'disconnected';
    latestEvent.value = null;
    revisions.value = {};
  }

  function $reset() {
    status.value = 'disconnected';
    latestEvent.value = null;
    revisions.value = {};
  }

  return {
    $reset,
    connected,
    getLatestData,
    getRevision,
    latestEvent,
    latestEventType,
    revisions,
    start,
    status,
    stop,
  };
});
