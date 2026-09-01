import { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, Handshake, Shield, Briefcase, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { FilterRail } from '../components/ui/FilterRail';
import { StatusChip } from '../components/ui/StatusChip';
import { KpiReportEmbed } from '../components/powerbi/KpiReportEmbed';
import { useKpiStore, useAuthStore } from '../lib/store';
import { calcSummaryMetrics, calcTrend, getSectionCompletionStats } from '../lib/utils';
import { sectionSchemas } from '../lib/sectionSchema';
import { useDeptStore } from '../lib/store';

// Simple donut chart component (pure SVG, no library)
function DonutChart({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

// Simple horizontal bar chart
function BarChart({ data, color }: { data: { label: string; value: number; max: number }[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item) => {
        const pct = item.max > 0 ? Math.min((item.value / item.max) * 100, 100) : 0;
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 700 }}>{item.value}</span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.7s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OverviewPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const getSubmission = useKpiStore((s) => s.getSubmission);
  const loadPeriodsFromApi = useKpiStore((s) => s.loadPeriodsFromApi);
  const loadSubmissionsFromApi = useKpiStore((s) => s.loadSubmissionsFromApi);
  const role = useAuthStore((s) => s.role);
  const isApiAvailable = useAuthStore((s) => s.isApiAvailable);
  const user = useAuthStore((s) => s.user);
  const dept = useDeptStore((s) => s.getSelectedDept());

  // Load data from API when available
  useEffect(() => {
    if (isApiAvailable && user) {
      loadPeriodsFromApi();
      loadSubmissionsFromApi(dept.id);
    }
  }, [isApiAvailable, user, dept.id, loadPeriodsFromApi, loadSubmissionsFromApi]);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!isApiAvailable || !user) return;
    setRefreshing(true);
    await loadPeriodsFromApi();
    await loadSubmissionsFromApi(user.department);
    setRefreshing(false);
  };

  const currentSub = getSubmission(currentPeriodId);
  const currentMetrics = calcSummaryMetrics(currentSub.data);

  const periods = useKpiStore((s) => s.periods);
  const currentIndex = periods.findIndex((p) => p.id === currentPeriodId);
  const prevPeriodId = currentIndex > 0 ? periods[currentIndex - 1].id : null;
  const prevMetrics = prevPeriodId
    ? calcSummaryMetrics(getSubmission(prevPeriodId).data)
    : null;

  const completionStats = getSectionCompletionStats(currentSub.sectionStatuses);
  const completionPct = Math.round((completionStats.completed / completionStats.total) * 100);

  const mouData = currentSub.data?.mous || { activeMous: 0, newMousSigned: 0, mou1Activity: '', mou2Activity: '', mou3Activity: '' };
  const pubData = currentSub.data?.facultyPublications || { q1Publications: 0, q2Publications: 0, conferencePapers: 0 };
  const studentPubData = currentSub.data?.studentPublications || { totalPapers: 0, totalConferences: 0, q1Publications: 0 };
  const placementData = currentSub.data?.placement || { totalWithOffers: 0, totalWithoutOffers: 0, ctcAbove20L: 0, ctc10to20L: 0, ctc6to10L: 0, ctcBelow6L: 0 };

  // KPI cards config
  const kpiCards = [
    {
      id: 'kpi-total-faculty',
      icon: <Users size={20} />,
      title: 'Total Faculty',
      value: currentMetrics.totalFaculty,
      subtitle: 'Active Faculty',
      accentColor: '#2563eb',
      trend: prevMetrics ? calcTrend(currentMetrics.totalFaculty, prevMetrics.totalFaculty) : undefined,
      delay: 'stagger-1',
    },
    {
      id: 'kpi-lms-compliance',
      icon: <BookOpen size={20} />,
      title: 'LMS Compliance',
      value: `${currentMetrics.lmsCompliancePercent}%`,
      subtitle: 'Faculty ≥5 items posted',
      accentColor: '#16a34a',
      trend: prevMetrics ? calcTrend(currentMetrics.lmsCompliancePercent, prevMetrics.lmsCompliancePercent) : undefined,
      delay: 'stagger-2',
    },
    {
      id: 'kpi-punctuality',
      icon: <Clock size={20} />,
      title: 'On-time Punch-in',
      value: `${currentMetrics.onTimePunchInPercent}%`,
      subtitle: 'Before 09:15',
      accentColor: '#0891b2',
      trend: prevMetrics ? calcTrend(currentMetrics.onTimePunchInPercent, prevMetrics.onTimePunchInPercent) : undefined,
      delay: 'stagger-3',
    },
    {
      id: 'kpi-active-mous',
      icon: <Handshake size={20} />,
      title: 'Active MoUs',
      value: currentMetrics.activeMous,
      subtitle: 'Industry partnerships',
      accentColor: '#d97706',
      trend: prevMetrics ? calcTrend(currentMetrics.activeMous, prevMetrics.activeMous) : undefined,
      delay: 'stagger-4',
    },
    {
      id: 'kpi-patents-filed',
      icon: <Shield size={20} />,
      title: 'Patents Filed',
      value: currentMetrics.patentsFiledYtd,
      subtitle: 'Since Jan 1',
      accentColor: '#7c3aed',
      trend: prevMetrics ? calcTrend(currentMetrics.patentsFiledYtd, prevMetrics.patentsFiledYtd) : undefined,
      delay: 'stagger-5',
    },
    {
      id: 'kpi-placement-rate',
      icon: <Briefcase size={20} />,
      title: 'Placement Rate',
      value: `${currentMetrics.placementOfferRatePercent}%`,
      subtitle: 'With job offers',
      accentColor: '#059669',
      trend: prevMetrics ? calcTrend(currentMetrics.placementOfferRatePercent, prevMetrics.placementOfferRatePercent) : undefined,
      delay: 'stagger-6',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Filter Rail + Period */}
      <FilterRail />

      {/* Data Source Indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderRadius: '10px',
        background: isApiAvailable ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${isApiAvailable ? '#bbf7d0' : '#fde68a'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isApiAvailable ? (
            <Wifi size={15} style={{ color: '#16a34a' }} />
          ) : (
            <WifiOff size={15} style={{ color: '#d97706' }} />
          )}
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isApiAvailable ? '#15803d' : '#991b1b' }}>
            {isApiAvailable ? 'Live Data — Connected to Server' : 'Disconnected from Server'}
          </span>
          {isApiAvailable && (
            <span style={{ fontSize: '0.75rem', color: '#166534', marginLeft: '4px' }}>
              Data entered on KPI forms is saved to the database & reflected in Power BI
            </span>
          )}
        </div>
        {isApiAvailable && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600,
              color: '#15803d', background: '#dcfce7', border: '1px solid #86efac',
              borderRadius: '6px', cursor: refreshing ? 'wait' : 'pointer',
              opacity: refreshing ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={12} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        )}
      </div>

      {/* KPI Submission Progress Bar */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '18px 22px', boxShadow: 'var(--shadow-card-val)' }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>KPI Submission Progress</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginLeft: '8px' }}>
              {completionStats.completed} of {completionStats.total} sections completed
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700,
              color: completionPct === 100 ? '#16a34a' : completionPct > 50 ? '#2563eb' : '#d97706',
            }}>{completionPct}%</span>
            {role === 'hod' && completionPct < 100 && (
              <a
                href="/kpi-entry"
                style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none', padding: '3px 10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}
              >
                Enter Data →
              </a>
            )}
          </div>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${completionPct}%`,
            background: completionPct === 100
              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
              : 'linear-gradient(90deg, #2563eb, #14b8a6)',
            borderRadius: '999px',
            transition: 'width 0.8s ease',
          }} />
        </div>
        {/* Section status pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          {sectionSchemas.map((s) => {
            const status = currentSub.sectionStatuses[s.key];
            const bg = status === 'completed' ? '#f0fdf4' : status === 'in_progress' ? '#eff6ff' : '#f8fafc';
            const color = status === 'completed' ? '#16a34a' : status === 'in_progress' ? '#2563eb' : '#94a3b8';
            const dot = status === 'completed' ? '#22c55e' : status === 'in_progress' ? '#3b82f6' : '#cbd5e1';
            return (
              <span key={s.key} style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '999px',
                background: bg, color, fontSize: '0.72rem', fontWeight: 600,
                border: `1px solid ${dot}40`,
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot }} />
                {s.title}
              </span>
            );
          })}
        </div>
      </div>

      {/* KPI Cards – 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {kpiCards.map((card) => (
          <KpiCard
            key={card.id}
            id={card.id}
            icon={card.icon}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            accentColor={card.accentColor}
            trend={card.trend}
            className={`animate-fade-in ${card.delay}`}
          />
        ))}
      </div>

      {/* Analytics Row: Charts + MoU Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* Publications Overview */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-card-val)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Publications</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>Faculty & Student</p>
            </div>
            <div style={{ position: 'relative' }}>
              <DonutChart
                percent={pubData.q1Publications + pubData.q2Publications > 0
                  ? Math.min(((pubData.q1Publications + pubData.q2Publications) / 30) * 100, 100) : 0}
                color="#2563eb"
                size={60}
              />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#1e293b' }}>
                {pubData.q1Publications + pubData.q2Publications}
              </span>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <BarChart color="#2563eb" data={[
              { label: 'Q1 Journals', value: pubData.q1Publications, max: 20 },
              { label: 'Q2 Journals', value: pubData.q2Publications, max: 15 },
              { label: 'Conferences', value: pubData.conferencePapers, max: 20 },
              { label: 'Student Q1', value: studentPubData.q1Publications, max: 10 },
            ]} />
          </div>
        </div>

        {/* Placement Breakdown */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-card-val)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Placements</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>CTC Distribution</p>
            </div>
            <div style={{ position: 'relative' }}>
              <DonutChart
                percent={currentMetrics.placementOfferRatePercent}
                color="#059669"
                size={60}
              />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#1e293b' }}>
                {currentMetrics.placementOfferRatePercent}%
              </span>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <BarChart color="#059669" data={[
              { label: 'Above 20 LPA', value: placementData.ctcAbove20L, max: placementData.totalWithOffers },
              { label: '10–20 LPA', value: placementData.ctc10to20L, max: placementData.totalWithOffers },
              { label: '6–10 LPA', value: placementData.ctc6to10L, max: placementData.totalWithOffers },
              { label: 'Below 6 LPA', value: placementData.ctcBelow6L, max: placementData.totalWithOffers },
            ]} />
          </div>
        </div>

        {/* MoU Activity */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-card-val)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-faint)' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>MoU Activity</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>
              {mouData.activeMous} active partnerships
            </p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {[
              { label: 'MoU 1', activity: mouData.mou1Activity },
              { label: 'MoU 2', activity: mouData.mou2Activity },
              { label: 'MoU 3', activity: mouData.mou3Activity },
            ].map((mou, i) => {
              const colors = ['#2563eb', '#059669', '#d97706'];
              return (
                <div key={mou.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 20px', borderBottom: i < 2 ? '1px solid var(--border-faint)' : undefined }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: `${colors[i]}15`, color: colors[i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>{mou.label}</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mou.activity || 'No activity logged'}
                    </p>
                  </div>
                  <StatusChip status={mou.activity ? 'completed' : 'not_started'} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Power BI Embed */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Power BI Report</h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Interactive KPI Visualizations — {dept.name}</p>
        </div>
        <KpiReportEmbed periodId={currentPeriodId} />
      </div>
    </div>
  );
}
