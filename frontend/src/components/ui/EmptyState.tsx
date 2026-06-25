import { BarChart3, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border-2 border-dashed border-surface-300 flex flex-col items-center justify-center py-16 px-8',
        className
      )}
    >
      {/* Decorative icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <BarChart3 size={36} className="text-primary-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md">
          <ExternalLink size={14} className="text-white" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-surface-800 mb-2 text-center">
        Connect a Power BI Report
      </h3>
      <p className="text-sm text-surface-500 text-center max-w-md mb-6 leading-relaxed">
        This area will display your live Power BI report with interactive KPI visualizations. 
        Configure a backend endpoint to provide the embed token and connect your{' '}
        <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded font-mono text-primary-600">.pbix</code>{' '}
        report to see data here.
      </p>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-surface-400 bg-surface-50 px-4 py-2 rounded-lg border border-surface-200">
          <span className="w-2 h-2 rounded-full bg-warning-400 animate-pulse-soft" />
          Waiting for embed configuration…
        </div>
        <p className="text-[11px] text-surface-400">
          See <code className="font-mono bg-surface-100 px-1 rounded">src/lib/powerbi.ts</code> for setup instructions
        </p>
      </div>
    </div>
  );
}
