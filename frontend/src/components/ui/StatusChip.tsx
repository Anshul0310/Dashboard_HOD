import { cn } from '../../lib/utils';
import type { SectionStatus } from '../../lib/types';

interface StatusChipProps {
  status: SectionStatus | 'overdue';
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig = {
  completed: {
    label: 'Completed',
    bgClass: 'bg-success-50 text-success-700 border-success-200',
    dotClass: 'bg-success-500',
  },
  in_progress: {
    label: 'In Progress',
    bgClass: 'bg-warning-50 text-warning-600 border-warning-200',
    dotClass: 'bg-warning-500',
  },
  not_started: {
    label: 'Not Started',
    bgClass: 'bg-surface-100 text-surface-500 border-surface-200',
    dotClass: 'bg-surface-400',
  },
  overdue: {
    label: 'Overdue',
    bgClass: 'bg-danger-50 text-danger-600 border-danger-200',
    dotClass: 'bg-danger-500',
  },
};

export function StatusChip({ status, size = 'sm', className }: StatusChipProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['not_started'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        config.bgClass,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}
