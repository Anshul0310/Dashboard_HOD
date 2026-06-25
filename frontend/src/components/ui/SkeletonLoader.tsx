import { cn } from '../../lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'text' | 'chart' | 'embed';
  count?: number;
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('animate-shimmer rounded-lg', className)} style={style} />
  );
}

export function SkeletonLoader({ className, variant = 'card', count = 1 }: SkeletonLoaderProps) {
  if (variant === 'embed') {
    return (
      <div className={cn('bg-white rounded-xl border border-surface-200 p-6', className)}>
        <SkeletonBlock className="h-6 w-48 mb-4" />
        <SkeletonBlock className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn('bg-white rounded-xl border border-surface-200 p-5', className)}>
        <SkeletonBlock className="h-5 w-40 mb-4" />
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    );
  }

  // card variant
  return (
    <div className={cn('grid gap-4', className)} style={{ gridTemplateColumns: `repeat(${Math.min(count, 6)}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-surface-200 p-5">
          <SkeletonBlock className="h-3 w-20 mb-3" />
          <SkeletonBlock className="h-8 w-16 mb-2" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
