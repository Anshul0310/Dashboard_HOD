import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore, useNotificationStore, useKpiStore, useDeptStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useNotificationStore as useNS } from '../../lib/store';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

const routeLabels: Record<string, string> = {
  '/overview': 'Overview',
  '/college-dashboard': 'College Dashboard',
  '/kpi-entry': 'KPI Data Entry',
  '/faculty': 'Faculty',
  '/publications': 'Publications & Research',
  '/placements': 'Placements',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const submissions = useKpiStore((s) => s.submissions);
  const dept = useDeptStore((s) => s.getSelectedDept());
  const notifications = useNS((s) => s.notifications);
  const markAsRead = useNS((s) => s.markAsRead);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentLabel = routeLabels[location.pathname] || 'Dashboard';
  const lastUpdated = submissions[currentPeriodId]?.lastUpdated;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = role === 'hod' ? 'HOD' : role === 'college_admin' ? 'College Admin' : role === 'management' ? 'Dean' : 'Faculty';
  const roleColor = role === 'hod' ? '#2563eb' : role === 'college_admin' ? '#6d28d9' : role === 'management' ? '#7c3aed' : '#059669';
  const roleBg = role === 'hod' ? '#dbeafe' : role === 'college_admin' ? '#ede9fe' : role === 'management' ? '#ede9fe' : '#ecfdf5';

  const recentNotifs = notifications.slice(0, 6);

  const severityColor = (s: string) => {
    if (s === 'error') return '#ef4444';
    if (s === 'warning') return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      padding: '0 20px',
      background: 'var(--bg-topbar)',
      borderBottom: '1px solid var(--border-color)',
      flexShrink: 0,
      gap: '12px',
      boxShadow: 'var(--shadow-topbar)',
    }}>
      {/* Left: hamburger + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          style={{ display: 'flex', padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}
          aria-label="Open menu"
          className="lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', overflow: 'hidden' }}>
          <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>NMIT</span>
          <ChevronRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
          {/* Department/Role pill — for dean/college_admin show role, otherwise show department */}
          {(role === 'college_admin' || role === 'management') ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: role === 'college_admin' ? '#6d28d915' : '#7c3aed15',
              color: role === 'college_admin' ? '#6d28d9' : '#7c3aed',
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1px solid ${role === 'college_admin' ? '#6d28d930' : '#7c3aed30'}`,
              flexShrink: 0,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: role === 'college_admin' ? '#6d28d9' : '#7c3aed', display: 'inline-block' }} />
              {role === 'college_admin' ? 'College Admin' : 'Dean'}
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: `${dept.color}15`,
              color: dept.color,
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1px solid ${dept.color}30`,
              flexShrink: 0,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dept.color, display: 'inline-block' }} />
              {dept.shortName}
            </span>
          )}
          <ChevronRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{currentLabel}</span>
        </nav>
      </div>

      {/* Right: last updated + bell + role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Last updated */}
        {lastUpdated && (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', display: 'none' }} className="lg:block">
            Updated: {formatDate(lastUpdated)}
          </span>
        )}

        {/* Notification Bell Dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: notifOpen ? 'var(--bg-surface)' : 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: notifOpen ? '#2563eb' : 'var(--text-muted)',
            }}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '16px',
                height: '16px',
                borderRadius: '999px',
                background: '#f43f5e',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '0 3px',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '360px',
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'scaleIn 0.15s ease-out forwards',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {recentNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--border-faint)',
                      cursor: 'pointer',
                      background: n.read ? 'transparent' : 'var(--bg-surface)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-nav-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'var(--bg-surface)'; }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? '#cbd5e1' : severityColor(n.severity), flexShrink: 0, marginTop: '5px' }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{n.message}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '3px' }}>
                        {new Date(n.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button
                  onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                  style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: roleBg,
          border: `1px solid ${roleColor}30`,
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: roleColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 800,
            flexShrink: 0,
          }}>
            {role === 'hod' ? 'HD' : role === 'college_admin' ? 'CA' : role === 'management' ? 'DN' : 'FC'}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: roleColor, whiteSpace: 'nowrap' }}>
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
