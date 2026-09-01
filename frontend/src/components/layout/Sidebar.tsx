import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardEdit,
  Users,
  BookOpen,
  Briefcase,
  FileBarChart,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { useNotificationStore } from '../../lib/store';
import { useDeptStore } from '../../lib/store';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard, roles: ['hod', 'management', 'faculty', 'college_admin'], color: '#2563eb' },
  { path: '/college-dashboard', label: 'College Dashboard', icon: Building2, roles: ['college_admin', 'management'], color: '#6d28d9' },
  { path: '/my-kpi', label: 'My KPI Entry', icon: ClipboardEdit, roles: ['faculty'], color: '#7c3aed' },
  { path: '/kpi-entry', label: 'Department KPI', icon: ClipboardEdit, roles: ['hod'], color: '#7c3aed' },
  { path: '/review', label: 'Review Submissions', icon: Users, roles: ['hod'], color: '#059669' },
  { path: '/faculty', label: 'Faculty', icon: Users, roles: ['hod', 'management', 'college_admin'], color: '#0891b2' },
  { path: '/publications', label: 'Publications & Research', icon: BookOpen, roles: ['hod', 'management', 'faculty', 'college_admin'], color: '#059669' },
  { path: '/placements', label: 'Placements', icon: Briefcase, roles: ['hod', 'management', 'college_admin'], color: '#d97706' },
  { path: '/reports', label: 'Reports', icon: FileBarChart, roles: ['hod', 'management', 'college_admin'], color: '#dc2626' },
  { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['hod', 'management', 'faculty', 'college_admin'], color: '#7c3aed' },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['hod', 'management', 'faculty', 'college_admin'], color: '#64748b' },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const dept = useDeptStore((s) => s.getSelectedDept());
  const location = useLocation();
  const navigate = useNavigate();

  const filteredItems = navItems.filter((item) => item.roles.includes(role || ''));

  const sidebarWidth = collapsed ? '72px' : '248px';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        transition: 'width 0.25s ease, min-width 0.25s ease, max-width 0.25s ease',
        position: 'relative',
        zIndex: 50,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sidebar)',
        // Mobile
        ...(typeof window !== 'undefined' && window.innerWidth < 1024 ? {
          position: 'fixed' as const,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          width: '260px',
          minWidth: '260px',
        } : {}),
      }}
    >
      {/* Logo / App Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: collapsed ? '0 16px' : '0 18px',
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo mark */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              NMIT KPI Portal
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', marginTop: '1px' }}>
              Academic Dashboard
            </div>
          </div>
        )}
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          style={{ marginLeft: 'auto', display: 'none', padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
          className="lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Department Badge */}
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: (role === 'college_admin' || role === 'management') ? '#6d28d915' : 'var(--bg-surface)',
            border: (role === 'college_admin' || role === 'management') ? '1px solid #6d28d930' : '1px solid var(--border-color)',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (role === 'college_admin' || role === 'management') ? '#6d28d9' : dept.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (role === 'college_admin' || role === 'management') ? '#6d28d9' : 'var(--text-secondary)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {role === 'college_admin' ? 'College Admin' : role === 'management' ? 'Dean' : dept.shortName}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const showBadge = item.path === '/notifications' && unreadCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? `${item.color}12` : 'transparent',
                color: isActive ? item.color : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                marginLeft: collapsed ? '0' : '-2px',
                paddingLeft: collapsed ? '10px' : isActive ? '10px' : '13px',
              }}
            >
              <Icon
                size={19}
                style={{ flexShrink: 0, color: isActive ? item.color : 'var(--text-faint)', transition: 'color 0.15s' }}
              />
              {!collapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
              {showBadge && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background: '#f43f5e',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '0 4px',
                  marginLeft: collapsed ? undefined : 'auto',
                  position: collapsed ? 'absolute' : undefined,
                  top: collapsed ? '4px' : undefined,
                  right: collapsed ? '4px' : undefined,
                }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout + Collapse Footer */}
      <div style={{ borderTop: '1px solid var(--border-color)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            width: '100%',
            padding: collapsed ? '10px' : '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#ef4444',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff1f2'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            width: '100%',
            padding: collapsed ? '10px' : '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
