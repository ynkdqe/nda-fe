export interface ShowBrowserNotificationOptions extends NotificationOptions {
  onClick?: (notification: Notification) => Promise<void> | void;
}

let permissionRequestPromise: null | Promise<NotificationPermission> = null;

export function canUseBrowserNotifications() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.isSecureContext
  );
}

export async function requestBrowserNotificationPermission() {
  if (!canUseBrowserNotifications()) {
    return 'denied' as const;
  }

  if (window.Notification.permission !== 'default') {
    return window.Notification.permission;
  }

  permissionRequestPromise ??= window.Notification.requestPermission().finally(
    () => {
      permissionRequestPromise = null;
    },
  );

  return await permissionRequestPromise;
}

export function requestBrowserNotificationPermissionOnInteraction() {
  if (
    !canUseBrowserNotifications() ||
    window.Notification.permission !== 'default'
  ) {
    return () => {};
  }

  let disposed = false;

  const cleanup = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    window.removeEventListener('pointerdown', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };

  const handleInteraction = () => {
    cleanup();
    void requestBrowserNotificationPermission().catch((error) => {
      console.warn('Unable to request browser notification permission.', error);
    });
  };

  window.addEventListener('pointerdown', handleInteraction, { once: true });
  window.addEventListener('keydown', handleInteraction, { once: true });

  return cleanup;
}

export function showBrowserNotification(
  title: string,
  options: ShowBrowserNotificationOptions = {},
) {
  if (
    !canUseBrowserNotifications() ||
    window.Notification.permission !== 'granted'
  ) {
    return null;
  }

  const { onClick, ...notificationOptions } = options;
  const notification = new window.Notification(title, notificationOptions);

  if (onClick) {
    notification.addEventListener('click', () => {
      void Promise.resolve(onClick(notification)).catch((error) => {
        console.error('Unable to handle browser notification click.', error);
      });
    });
  }

  return notification;
}
