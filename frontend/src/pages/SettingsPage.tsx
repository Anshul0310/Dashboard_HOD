import { Settings as SettingsIcon, Palette, Bell, Database, Moon, Sun } from 'lucide-react';
import { useThemeStore, useDeptStore } from '../lib/store';

export function SettingsPage() {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const dept = useDeptStore((s) => s.getSelectedDept());

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card-val)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-surface)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    background: 'var(--bg-input)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '9px 12px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Application preferences and configuration.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>

        {/* Department Info */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <SettingsIcon size={16} color="var(--text-muted)" />
            <h3 style={labelStyle}>Department</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-label)', marginBottom: '6px' }}>
                Department Name
              </label>
              <input
                id="dept-name"
                type="text"
                value={dept.name}
                style={inputStyle}
                readOnly
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '4px' }}>
                Change your department from the login page or filter rail.
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-label)', marginBottom: '6px' }}>
                Institution
              </label>
              <input
                id="institution"
                type="text"
                defaultValue="Nitte Meenakshi Institute of Technology"
                style={inputStyle}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Appearance / Dark Mode */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <Palette size={16} color="var(--text-muted)" />
            <h3 style={labelStyle}>Appearance</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Dark Mode Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color)',
              background: isDark ? 'rgba(37,99,235,0.08)' : 'var(--bg-surface)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: isDark ? '#1d4ed820' : '#fef9c3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDark
                    ? <Moon size={18} color="#60a5fa" />
                    : <Sun size={18} color="#ca8a04" />
                  }
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                id="dark-mode-toggle"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{
                  width: '48px',
                  height: '26px',
                  borderRadius: '999px',
                  border: 'none',
                  background: isDark ? '#2563eb' : '#e2e8f0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.25s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: isDark ? '25px' : '3px',
                  transition: 'left 0.25s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }} />
              </button>
            </div>

            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}>
              Dark mode reduces eye strain in low-light environments. Your preference is applied immediately.
            </p>
          </div>
        </div>

        {/* Notification Preferences */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <Bell size={16} color="var(--text-muted)" />
            <h3 style={labelStyle}>Notification Preferences</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'KPI submission reminders', defaultChecked: true },
              { label: 'LMS compliance alerts', defaultChecked: true },
              { label: 'Research & publication updates', defaultChecked: true },
              { label: 'System notifications', defaultChecked: false },
            ].map((pref) => (
              <label key={pref.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{pref.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={pref.defaultChecked}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Data Connection */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <Database size={16} color="var(--text-muted)" />
            <h3 style={labelStyle}>Data Connection</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-faint)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Power BI Report</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ca8a04', background: '#fef9c3', padding: '3px 10px', borderRadius: '999px', border: '1px solid #fde68a' }}>
                Not Connected
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Backend API</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
                Connected
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
              See <code style={{ fontFamily: 'monospace', background: 'var(--bg-surface-alt)', padding: '1px 4px', borderRadius: '4px' }}>README.md</code> for backend integration instructions.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
