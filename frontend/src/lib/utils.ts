import clsx, { type ClassValue } from 'clsx';
import type { KpiData, KpiSummaryMetrics, TrendData } from './types';

/** Merge class names (works with Tailwind conditional classes) */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Calculate derived summary metrics from raw KPI data */
export function calcSummaryMetrics(data: KpiData): KpiSummaryMetrics {
  const faculty = data?.faculty;
  const lms = data?.lms;
  const latePunchIn = data?.latePunchIn;
  const placement = data?.placement;
  const mous = data?.mous;
  const patentsIpr = data?.patentsIpr;

  const totalFaculty =
    (faculty?.profCount || 0) +
    (faculty?.assocProfCount || 0) +
    (faculty?.asstProfCount || 0);

  const lmsCompliancePercent =
    totalFaculty > 0
      ? Math.round(
          ((totalFaculty - (lms?.facultyLessThan5Items || 0)) / totalFaculty) * 100
        )
      : 0;

  const onTimePunchInPercent =
    totalFaculty > 0
      ? Math.round(
          ((totalFaculty - (latePunchIn?.latePunchInsLastMonth || 0)) /
            totalFaculty) *
            100
        )
      : 0;

  const totalGraduating =
    (placement?.totalWithOffers || 0) + (placement?.totalWithoutOffers || 0);
  const placementOfferRatePercent =
    totalGraduating > 0
      ? Math.round(((placement?.totalWithOffers || 0) / totalGraduating) * 100)
      : 0;

  return {
    totalFaculty,
    lmsCompliancePercent,
    onTimePunchInPercent,
    activeMous: mous?.activeMous || 0,
    patentsFiledYtd: patentsIpr?.patentsFiled || 0,
    placementOfferRatePercent,
  };
}

/** Calculate trend between current and previous period */
export function calcTrend(current: number, previous: number): TrendData {
  const diff = current - previous;
  const changePercent =
    previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;
  const direction: TrendData['direction'] =
    diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
  return { value: current, previousValue: previous, direction, changePercent };
}

/** Format a date string to human-readable format */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format relative time (e.g. "2 hours ago") */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(isoString);
}

/** Get section completion stats for a submission */
export function getSectionCompletionStats(
  statuses: Record<string, string>
): { total: number; completed: number; inProgress: number; notStarted: number } {
  const entries = Object.values(statuses);
  return {
    total: entries.length,
    completed: entries.filter((s) => s === 'completed').length,
    inProgress: entries.filter((s) => s === 'in_progress').length,
    notStarted: entries.filter((s) => s === 'not_started').length,
  };
}
