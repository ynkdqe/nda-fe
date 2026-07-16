import type { HubConnection } from '@microsoft/signalr';

import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

const CLIENT_EVENT_NAME = 'HubMessage';
const HUB_PATH = '/hub/app';
const INITIAL_RETRY_DELAYS = [0, 2_000, 5_000, 10_000, 30_000] as const;
const RECONNECT_DELAYS = [0, 2_000, 5_000, 10_000, 30_000];

export interface RealtimeEvent<TData = unknown> {
  createdAt?: null | string;
  data?: null | TData;
  event?: null | string;
  id?: null | number | string;
  type: string;
}

interface RealtimeEventEnvelope<TData = unknown> {
  Data?: null | TData;
  Event?: null | string;
  Type?: null | string;
  data?: null | TData;
  event?: null | string;
  type?: null | string;
}

export type RealtimeConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';

type RealtimeEventHandler = (event: RealtimeEvent) => Promise<void> | void;
type RealtimeStatusHandler = (status: RealtimeConnectionStatus) => void;

let connection: HubConnection | null = null;
let eventHandler: null | RealtimeEventHandler = null;
let statusHandler: null | RealtimeStatusHandler = null;
let retryTimer: null | ReturnType<typeof setTimeout> = null;
let shouldRun = false;
let startPromise: null | Promise<void> = null;

function resolveHubUrl() {
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
  const normalizedApiUrl = apiURL.replace(/\/+$/, '');

  if (!normalizedApiUrl || normalizedApiUrl.startsWith('/')) {
    return HUB_PATH;
  }

  return `${normalizedApiUrl.replace(/\/api$/i, '')}${HUB_PATH}`;
}

function clearRetryTimer() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function createConnection() {
  const accessStore = useAccessStore();
  const hubConnection = new HubConnectionBuilder()
    .withUrl(resolveHubUrl(), {
      accessTokenFactory: () => accessStore.accessToken ?? '',
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect(RECONNECT_DELAYS)
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build();

  hubConnection.on(CLIENT_EVENT_NAME, handleIncomingEvent);
  hubConnection.onreconnecting(() => {
    statusHandler?.('reconnecting');
  });
  hubConnection.onreconnected(() => {
    statusHandler?.('connected');
  });
  hubConnection.onclose(() => {
    statusHandler?.('disconnected');
    if (shouldRun) {
      scheduleInitialRetry(INITIAL_RETRY_DELAYS.length - 1);
    }
  });

  return hubConnection;
}

function handleIncomingEvent(message: RealtimeEventEnvelope) {
  const type = message?.type ?? message?.Type;
  if (typeof type !== 'string' || !type.trim()) {
    return;
  }

  const event: RealtimeEvent = {
    data: message.data ?? message.Data ?? null,
    event: message.event ?? message.Event ?? null,
    type,
  };

  void Promise.resolve(eventHandler?.(event)).catch((error) => {
    console.error('Unable to handle realtime event.', error);
  });
}

function scheduleInitialRetry(attempt: number) {
  if (!shouldRun || retryTimer) {
    return;
  }

  const delay = INITIAL_RETRY_DELAYS[Math.min(attempt, INITIAL_RETRY_DELAYS.length - 1)];
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void startConnection(attempt + 1);
  }, delay);
}

async function startConnection(attempt = 0): Promise<void> {
  if (!shouldRun) {
    return;
  }

  connection ??= createConnection();

  if (
    connection.state === HubConnectionState.Connected ||
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting
  ) {
    return;
  }

  try {
    statusHandler?.('connecting');
    await connection.start();
    statusHandler?.('connected');
  } catch (error) {
    statusHandler?.('disconnected');
    if (!shouldRun) {
      return;
    }

    console.warn('Unable to connect to realtime hub. Retrying...', error);
    scheduleInitialRetry(attempt);
  }
}

export async function startRealtimeConnection(
  handler: RealtimeEventHandler,
  onStatusChange?: RealtimeStatusHandler,
) {
  eventHandler = handler;
  statusHandler = onStatusChange ?? null;
  shouldRun = true;
  clearRetryTimer();

  if (!startPromise) {
    startPromise = startConnection().finally(() => {
      startPromise = null;
    });
  }

  await startPromise;
}

export async function stopRealtimeConnection() {
  shouldRun = false;
  eventHandler = null;
  clearRetryTimer();

  const activeConnection = connection;
  connection = null;

  if (!activeConnection) {
    statusHandler?.('disconnected');
    statusHandler = null;
    return;
  }

  activeConnection.off(CLIENT_EVENT_NAME, handleIncomingEvent);

  if (activeConnection.state !== HubConnectionState.Disconnected) {
    await activeConnection.stop();
  }

  statusHandler?.('disconnected');
  statusHandler = null;
}
