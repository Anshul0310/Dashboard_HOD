import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { GraduationCap, Mail, Lock, Loader2, Wifi, WifiOff } from 'lucide-react';



export function LoginPage() {
  const navigate = useNavigate();
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const checkApiHealth = useAuthStore((s) => s.checkApiHealth);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isApiAvailable = useAuthStore((s) => s.isApiAvailable);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loginError = useAuthStore((s) => s.loginError);
  const role = useAuthStore((s) => s.role);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await checkApiHealth();
      setCheckingApi(false);

    })();
  }, [checkApiHealth]);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithCredentials(email, password);
      navigate('/overview');
    } catch {
      // Error is set in the store
    }
  };

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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#dc2626', padding: '3px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '999px' }}>
                <WifiOff size={12} />
                Disconnected from backend
              </span>
            )}
          </div>

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
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: '20px' }}>
          Sign in with your university credentials
        </p>
        {isApiAvailable && (
          <div style={{
            textAlign: 'center', marginTop: '8px', padding: '10px 16px',
            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px',
          }}>
            <p style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600, marginBottom: '4px' }}>
              Default Credentials
            </p>
            <p style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
              Faculty (CSBS): <strong>faculty1.csbs@nmit.ac.in</strong> / <strong>nmit@2026</strong>
            </p>
            <p style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
              HOD (CSBS): <strong>hod.csbs@nmit.ac.in</strong> / <strong>nmit@2026</strong>
            </p>
            <p style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
              HOD (MECH): <strong>hod.mech@nmit.ac.in</strong> / <strong>nmit@2026</strong>
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

