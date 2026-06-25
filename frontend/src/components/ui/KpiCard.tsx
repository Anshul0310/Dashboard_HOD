import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendData } from '../../lib/types';

interface KpiCardProps {
  id?: string;
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendData;
  accentColor?: string;
  iconBg?: string;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  id,
  icon,
  title,
  value,
  subtitle,
  trend,
  accentColor = '#2563eb',
  iconBg,
  className,
  onClick,
}: KpiCardProps) {
  const iconBgColor = iconBg || `${accentColor}18`;

  return (
    <div
      id={id}
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accentColor}`,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: 'var(--shadow-card-val)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
          el.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          el.style.transform = 'translateY(0)';
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Icon + Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.3 }}>
          {title}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: iconBgColor,
          color: accentColor,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' }}>
        {value}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: trend ? '10px' : '0' }}>
          {subtitle}
        </p>
      )}

      {/* Trend */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
          {trend.direction === 'up' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 7px', borderRadius: '6px' }}>
              <TrendingUp size={12} />
              +{Math.abs(trend.changePercent)}%
            </span>
          )}
          {trend.direction === 'down' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', background: '#fff1f2', padding: '2px 7px', borderRadius: '6px' }}>
              <TrendingDown size={12} />
              −{Math.abs(trend.changePercent)}%
            </span>
          )}
          {trend.direction === 'neutral' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '6px' }}>
              <Minus size={12} />
              0%
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>vs last period</span>
        </div>
      )}
    </div>
  );
}
