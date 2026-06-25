import { useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { getEmbedInfo } from '../../lib/powerbi';

interface KpiReportEmbedProps {
  periodId: string;
  className?: string;
  /** Minimum height in px for the iframe. Default: 540 */
  minHeight?: number;
}

/**
 * Embeds the real Power BI KPI report using an iframe.
 *
 * Works with both "Publish to Web" URLs (fully public) and autoAuth
 * URLs (requires Power BI sign-in in the browser). Includes loading
 * indicator, error recovery, and fullscreen toggle.
 */
export function KpiReportEmbed({ periodId, className, minHeight = 540 }: KpiReportEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedInfo = getEmbedInfo();

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      iframeRef.current.src = embedInfo.embedUrl;
    }
  }, [embedInfo.embedUrl]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not supported — ignore
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const openInPowerBI = useCallback(() => {
    window.open(
      `https://app.powerbi.com/reports/${embedInfo.reportId}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [embedInfo.reportId]);

  // Error state
  if (error) {
    return (
      <div className={className || ''} style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#fef2f2',
        borderRadius: '12px',
        border: '1px solid #fecaca',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#fee2e2', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 12px',
          color: '#ef4444',
        }}>
          <RefreshCw size={20} />
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
          Failed to Load Report
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px', maxWidth: '380px', margin: '0 auto 16px' }}>
          {embedInfo.mode === 'auto_auth'
            ? 'Make sure you are signed into Power BI in your browser, then try again.'
            : 'Could not connect to Power BI. Please check your network and try again.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={handleRetry}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600,
              color: '#fff', background: '#2563eb', border: 'none',
              borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
          >
            <RefreshCw size={14} />
            Retry
          </button>
          <button
            onClick={openInPowerBI}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600,
              color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#dbeafe')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#eff6ff')}
          >
            <ExternalLink size={14} />
            Open in Power BI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className || ''}
      style={{
        position: 'relative',
        background: isFullscreen ? '#0f172a' : 'transparent',
      }}
    >
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: '6px', padding: '8px 12px',
        background: isFullscreen ? '#1e293b' : 'transparent',
        borderBottom: isFullscreen ? '1px solid #334155' : 'none',
      }}>
        {embedInfo.mode === 'auto_auth' && (
          <span style={{
            fontSize: '0.7rem', color: '#94a3b8', marginRight: 'auto',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: loading ? '#f59e0b' : '#22c55e',
              display: 'inline-block',
            }} />
            {loading ? 'Connecting to Power BI…' : 'Live — Power BI'}
          </span>
        )}
        {embedInfo.mode === 'publish_to_web' && (
          <span style={{
            fontSize: '0.7rem', color: '#94a3b8', marginRight: 'auto',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: loading ? '#f59e0b' : '#22c55e',
              display: 'inline-block',
            }} />
            {loading ? 'Loading report…' : 'Live — Public Embed'}
          </span>
        )}

        <button
          onClick={handleRetry}
          title="Refresh report"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '30px', borderRadius: '6px',
            border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
            background: isFullscreen ? '#334155' : '#f8fafc',
            borderColor: isFullscreen ? '#475569' : '#e2e8f0',
            color: isFullscreen ? '#e2e8f0' : '#64748b',
          }}
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={openInPowerBI}
          title="Open in Power BI"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '30px', borderRadius: '6px',
            border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
            background: isFullscreen ? '#334155' : '#f8fafc',
            borderColor: isFullscreen ? '#475569' : '#e2e8f0',
            color: isFullscreen ? '#e2e8f0' : '#64748b',
          }}
        >
          <ExternalLink size={14} />
        </button>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '30px', borderRadius: '6px',
            border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
            background: isFullscreen ? '#334155' : '#f8fafc',
            borderColor: isFullscreen ? '#475569' : '#e2e8f0',
            color: isFullscreen ? '#e2e8f0' : '#64748b',
          }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, top: '46px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdf4 100%)',
          zIndex: 10, borderRadius: '0 0 12px 12px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>
            <Loader2 size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
            Loading Power BI Report
          </p>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Connecting to your interactive dashboard…
          </p>
        </div>
      )}

      {/* The actual Power BI iframe */}
      <iframe
        ref={iframeRef}
        title="Power BI KPI Report"
        src={embedInfo.embedUrl}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 46px)' : `${minHeight}px`,
          border: 'none',
          display: 'block',
          borderRadius: isFullscreen ? '0' : '0 0 12px 12px',
          background: '#fff',
        }}
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
      />

      {/* Spin animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
