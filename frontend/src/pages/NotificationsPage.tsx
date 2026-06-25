import { Bell, CheckCheck, Filter, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';
import { useNotificationStore } from '../lib/store';
import { formatRelativeTime, cn } from '../lib/utils';
import type { NotificationSeverity } from '../lib/types';

type FilterType = 'all' | 'unread' | 'kpi_reminder' | 'compliance' | 'research' | 'system';

const severityConfig: Record<NotificationSeverity, { icon: typeof Bell; bgClass: string; borderClass: string; iconClass: string }> = {
  error: { icon: AlertCircle, bgClass: 'bg-danger-50', borderClass: 'border-l-danger-500', iconClass: 'text-danger-500' },
  warning: { icon: AlertTriangle, bgClass: 'bg-warning-50', borderClass: 'border-l-warning-500', iconClass: 'text-warning-500' },
  info: { icon: Info, bgClass: 'bg-info-50', borderClass: 'border-l-info-500', iconClass: 'text-info-500' },
};

export function NotificationsPage() {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: `Unread (${unreadCount})` },
    { value: 'kpi_reminder', label: 'KPI Reminders' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'research', label: 'Research' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Notifications</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors focus-ring"
          >
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-surface-400" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus-ring',
              filter === opt.value
                ? 'bg-primary-50 text-primary-700 border-primary-200'
                : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <Bell size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-500">No notifications match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filtered.map((notification) => {
              const config = severityConfig[notification.severity];
              const Icon = config.icon;
              return (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    'w-full text-left px-5 py-4 border-l-3 transition-colors hover:bg-surface-50 flex items-start gap-3',
                    config.borderClass,
                    !notification.read && config.bgClass
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', `${config.bgClass}`)}>
                    <Icon size={16} className={config.iconClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-relaxed',
                      notification.read ? 'text-surface-500' : 'text-surface-700 font-medium'
                    )}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-surface-400">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                      <span className="text-[10px] font-medium text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded uppercase">
                        {notification.type.replace('_', ' ')}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
