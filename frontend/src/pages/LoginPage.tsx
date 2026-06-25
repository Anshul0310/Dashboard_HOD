import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { useDeptStore, departments } from '../lib/store';
import { GraduationCap, Shield, BarChart2, ChevronDown, Building2, Mail, Lock, Loader2, Wifi, WifiOff, Users } from 'lucide-react';
import type { UserRole } from '../lib/types';

type LoginMode = 'select' | 'credentials';

export function LoginPage() {
  const navigate = useNavigate();
  const setRole = useAuthStore((s) => s.setRole);
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const checkApiHealth = useAuthStore((s) => s.checkApiHealth);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isApiAvailable = useAuthStore((s) => s.isApiAvailable);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loginError = useAuthStore((s) => s.loginError);
  const role = useAuthStore((s) => s.role);
  const setDept = useDeptStore((s) => s.setDept);
  const selectedDeptId = useDeptStore((s) => s.selectedDeptId);

  const [mode, setMode] = useState<LoginMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);
  const [checkingApi, setCheckingApi] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Redirect if already authenticated
  useEffect(() => {
    if (role) {
      navigate('/overview');
    }
  }, [role, navigate]);

  // Check API health on mount
  useEffect(() => {
    (async () => {
      const available = await checkApiHealth();
      setCheckingApi(false);
      // Auto-switch to Sign In when backend is available
      if (available) {
        setMode('credentials');
      }
    })();
  }, [checkApiHealth]);

  const handleDemoLogin = (selectedRole: UserRole) => {
    loginAsDemo(selectedRole);
    navigate('/overview');
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithCredentials(email, password);
      navigate('/overview');
    } catch {
      // Error is set in the store
    }
  };

  const roles: {
    key: UserRole;
    label: string;
    subLabel: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
    badgeBg: string;
    badgeText: string;
  }[] = [
    {
      key: 'hod',
      label: 'HOD / Department Head',
      subLabel: 'Head of Department',
      description: 'Full access — KPI data entry, department analytics, reports, and notifications.',
      icon: <Shield size={28} />,
      accent: '#2563eb',
      badgeBg: '#dbeafe',
      badgeText: '#1d4ed8',
    },
    {
      key: 'management',
      label: 'Dean / Principal / Management',
      subLabel: 'Management Viewer',
      description: 'Read-only access — view all department KPIs, consolidated reports, and analytics.',
      icon: <BarChart2 size={28} />,
      accent: '#7c3aed',
      badgeBg: '#ede9fe',
      badgeText: '#6d28d9',
    },
    {
      key: 'faculty' as UserRole,
      label: 'Faculty Member',
      subLabel: 'Individual Contributor',
      description: 'Enter your personal KPI data — publications, FDPs, patents — and submit for HOD review.',
      icon: <Users size={28} />,
      accent: '#059669',
      badgeBg: '#ecfdf5',
      badgeText: '#047857',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #f0fdf4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '560px', animation: 'fadeIn 0.5s ease-out forwards' }}>
        {/* Institution Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #1d4ed8, #0d9488)', marginBottom: '16px', boxShadow: '0 8px 24px rgba(29,78,216,0.25)' }}>
            <GraduationCap size={36} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            NMIT Academic KPI Portal
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
            Nitte Meenakshi Institute of Technology
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '999px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Academic Year 2025–26</span>
          </div>
        </div>

        {/* Main Card */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.08)', padding: '32px' }}>

          {/* API Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
            {checkingApi ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Checking server...
              </span>
            ) : isApiAvailable ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#16a34a', padding: '3px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px' }}>
                <Wifi size={12} />
                Backend connected
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#d97706', padding: '3px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '999px' }}>
                <WifiOff size={12} />
                Offline mode — using demo data
              </span>
            )}
          </div>

          {/* Mode Toggle Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '24px' }}>
            <button
              id="tab-demo"
              onClick={() => setMode('select')}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                background: mode === 'select' ? '#ffffff' : 'transparent',
                color: mode === 'select' ? '#0f172a' : '#64748b',
                boxShadow: mode === 'select' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Demo Mode
            </button>
            <button
              id="tab-login"
              onClick={() => setMode('credentials')}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                background: mode === 'credentials' ? '#ffffff' : 'transparent',
                color: mode === 'credentials' ? '#0f172a' : '#64748b',
                boxShadow: mode === 'credentials' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                opacity: isApiAvailable ? 1 : 0.5,
              }}
              disabled={!isApiAvailable}
            >
              Sign In
            </button>
          </div>

          {mode === 'credentials' ? (
            /* ─── Credential Login Form ─── */
            <form onSubmit={handleCredentialLogin}>
              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  <Mail size={14} color="#6b7280" />
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  style={{
                    width: '100%', padding: '11px 14px', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b',
                    background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', outline: 'none',
                    transition: 'border-color 0.2s', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  <Lock size={14} color="#6b7280" />
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '11px 14px', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b',
                    background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', outline: 'none',
                    transition: 'border-color 0.2s', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Error message */}
              {loginError && (
                <div style={{ padding: '10px 14px', marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '0.82rem', color: '#dc2626', fontWeight: 500 }}>
                  {loginError}
                </div>
              )}

              {/* Submit */}
              <button
                id="btn-login"
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: isLoading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #1d4ed8, #0d9488)', color: '#ffffff',
                  fontSize: '0.92rem', fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(29,78,216,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s',
                }}
              >
                {isLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* ─── Demo Mode (Role Selection) ─── */
            <>
              {/* Department Selector */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  <Building2 size={15} color="#6b7280" />
                  Select Your Department
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="dept-select"
                    value={selectedDeptId}
                    onChange={(e) => setDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 14px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: '#1e293b',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      appearance: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>Select your role to continue</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              {/* Role Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roles.map((r) => (
                  <button
                    key={r.key}
                    id={`role-${r.key}`}
                    onClick={() => handleDemoLogin(r.key)}
                    onMouseEnter={() => setHoveredRole(r.key)}
                    onMouseLeave={() => setHoveredRole(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '18px 20px',
                      borderRadius: '14px',
                      border: `2px solid ${hoveredRole === r.key ? r.accent : '#e2e8f0'}`,
                      background: hoveredRole === r.key ? r.badgeBg : '#fafafa',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      transform: hoveredRole === r.key ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: hoveredRole === r.key ? `0 8px 24px ${r.accent}22` : 'none',
                      fontFamily: 'inherit',
                      width: '100%',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: r.badgeBg,
                      color: r.accent,
                      flexShrink: 0,
                      border: `1px solid ${r.accent}33`,
                      transition: 'all 0.2s',
                    }}>
                      {r.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                        {r.description}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ color: hoveredRole === r.key ? r.accent : '#cbd5e1', transition: 'all 0.2s', flexShrink: 0, fontSize: '1.3rem', fontWeight: 300 }}>
                      →
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: '20px' }}>
          {mode === 'credentials'
            ? 'Sign in with your university credentials'
            : 'Demo portal — no real authentication required · Select role to explore'
          }
        </p>
        {mode === 'credentials' && isApiAvailable && (
          <div style={{
            textAlign: 'center', marginTop: '8px', padding: '10px 16px',
            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px',
          }}>
            <p style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, marginBottom: '4px' }}>
              Default Credentials
            </p>
            <p style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
              Faculty (CSE): <strong>faculty1.cse@nmit.ac.in</strong> / <strong>nmit@2026</strong>
            </p>
            <p style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
              HOD (CSE): <strong>hod.cse@nmit.ac.in</strong> / <strong>nmit@2026</strong>
            </p>
            <p style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
              Dean: <strong>dean@nmit.ac.in</strong> / <strong>nmit@2026</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
