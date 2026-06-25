import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useNotificationStore } from '../../lib/store';
import { formatRelativeTime, cn } from '../../lib/utils';
import type { NotificationSeverity } from '../../lib/types';

interface NotificationPanelProps {
  maxItems?: number;
  className?: string;
}

const severityConfig: Record<NotificationSeverity, { icon: typeof Bell; bgClass: string; borderClass: string; iconClass: string }> = {
  error: {
    icon: AlertCircle,
    bgClass: 'bg-danger-50',
    borderClass: 'border-l-danger-500',
    iconClass: 'text-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-warning-50',
    borderClass: 'border-l-warning-500',
    iconClass: 'text-warning-500',
  },
  info: {
    icon: Info,
    bgClass: 'bg-info-50',
    borderClass: 'border-l-info-500',
    iconClass: 'text-info-500',
  },
};

export function NotificationPanel({ maxItems = 5, className }: NotificationPanelProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const displayedNotifications = notifications.slice(0, maxItems);

  return (
    <div className={cn('bg-white rounded-xl border border-surface-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-surface-600" />
          <h3 className="text-sm font-semibold text-surface-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="divide-y divide-surface-100 max-h-[400px] overflow-y-auto">
        {displayedNotifications.map((notification) => {
          const config = severityConfig[notification.severity];
          const Icon = config.icon;

          return (
            <button
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-l-3 transition-colors hover:bg-surface-50',
                config.borderClass,
                !notification.read && config.bgClass
              )}
            >
              <div className="flex items-start gap-2.5">
                <Icon size={14} className={cn('mt-0.5 shrink-0', config.iconClass)} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs leading-relaxed',
                    notification.read ? 'text-surface-500' : 'text-surface-700 font-medium'
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-surface-400 mt-1">
                    {formatRelativeTime(notification.timestamp)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-surface-200 bg-surface-50">
        <a
          href="/notifications"
          className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View all notifications →
        </a>
      </div>
    </div>
  );
}
