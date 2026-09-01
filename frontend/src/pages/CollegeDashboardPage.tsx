import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  BookOpen,
  Briefcase,
  Shield,
  Handshake,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { fetchCollegeOverview, type CollegeOverviewResponse } from '../lib/api';
import { KpiReportEmbed } from '../components/powerbi/KpiReportEmbed';
import { useKpiStore } from '../lib/store';

// ─── Department label map ───────────────────────────────────────────────
const deptLabels: Record<string, { name: string; shortName: string; color: string; gradient: string }> = {
  csbs: { name: 'Computer Science & Business Systems', shortName: 'CSBS', color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
  mech: { name: 'Mechanical Engineering', shortName: 'MECH', color: '#64748b', gradient: 'linear-gradient(135deg, #475569, #64748b)' },
};

// ─── Helper: extract numeric KPI data from raw submission data ──────────
function extractMetrics(data: Record<string, unknown> | null | undefined) {
  if (!data) return null;
  const d = data as Record<string, Record<string, unknown>>;

  const faculty = d.faculty || {};
  const pubs = d.facultyPublications || {};
  const studentPubs = d.studentPublications || {};
  const placement = d.placement || {};
  const patents = d.patentsIpr || {};
  const mous = d.mous || {};
  const fdp = d.fdp || {};
  const consultancy = d.consultancy || {};
  const funded = d.fundedProjects || {};
  const awards = d.awardsFaculty || {};
  const awardsStudents = d.awardsStudents || {};

  const profCount = Number(faculty.profCount || 0);
  const assocProfCount = Number(faculty.assocProfCount || 0);
  const asstProfCount = Number(faculty.asstProfCount || 0);
  const totalFaculty = profCount + assocProfCount + asstProfCount;

  const totalPublications =
    Number(pubs.q1Publications || 0) + Number(pubs.q2Publications || 0) +
    Number(pubs.otherApprovedJournals || 0) + Number(pubs.conferencePapers || 0);

  const totalWithOffers = Number(placement.totalWithOffers || 0);
  const totalWithoutOffers = Number(placement.totalWithoutOffers || 0);
  const placementRate = totalWithOffers + totalWithoutOffers > 0
    ? Math.round((totalWithOffers / (totalWithOffers + totalWithoutOffers)) * 100) : 0;

  return {
    totalFaculty,
    profCount,
    assocProfCount,
    asstProfCount,
    resignedLastMonth: Number(faculty.resignedLastMonth || 0),
    totalPublications,
    q1Pubs: Number(pubs.q1Publications || 0),
    q2Pubs: Number(pubs.q2Publications || 0),
    conferencePapers: Number(pubs.conferencePapers || 0),
    studentPubs: Number(studentPubs.q1Publications || 0) + Number(studentPubs.q2Publications || 0) + Number(studentPubs.conferencePapers || 0),
    totalWithOffers,
    totalWithoutOffers,
    placementRate,
    ctcAbove20L: Number(placement.ctcAbove20L || 0),
    ctc10to20L: Number(placement.ctc10to20L || 0),
    ctc6to10L: Number(placement.ctc6to10L || 0),
    ctcBelow6L: Number(placement.ctcBelow6L || 0),
    patentsFiled: Number(patents.patentsFiled || 0),
    patentsPublished: Number(patents.patentsPublished || 0),
    patentsGranted: Number(patents.patentsGranted || 0),
    activeMous: Number(mous.activeMous || 0),
    facultyWithFdp: Number(fdp.facultyWithFdp || 0),
    totalFdpHours: Number(fdp.totalFdpHours || 0),
    consultanciesUnderExecution: Number(consultancy.consultanciesUnderExecution || 0),
    projectsUnderExecution: Number(funded.projectsUnderExecution || 0),
    totalAwards: Number(awards.totalAwards || 0) + Number(awardsStudents.academicHackathonAwards || 0) + Number(awardsStudents.sportsMusicAwards || 0),
  };
}

// ─── Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({ percent, color, size = 72, thickness = 7 }: { percent: number; color: string; size?: number; thickness?: number }) {
  const radius = (size - thickness * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

// ─── Horizontal Bar ─────────────────────────────────────────────────────
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: '999px', transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ icon, title, value, subtitle, color, delay }: {
  icon: React.ReactNode; title: string; value: string | number; subtitle: string; color: string; delay: string;
}) {
  return (
    <div className={`animate-fade-in ${delay}`} style={{
      background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)',
      padding: '20px', boxShadow: 'var(--shadow-card-val)',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
    }}
      onMouseEnter={(e) => { (e.currentTarget).style.transform = 'translateY(-2px)'; (e.currentTarget).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = 'var(--shadow-card-val)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: `${color}12`, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>{title}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '2px' }}>{subtitle}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CollegeDashboardPage
// ═══════════════════════════════════════════════════════════════════════
export function CollegeDashboardPage() {
  const isApiAvailable = useAuthStore((s) => s.isApiAvailable);
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);

  const [overview, setOverview] = useState<CollegeOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null); // null = all

  // Load college overview data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCollegeOverview();
      setOverview(data);
    } catch (err) {
      setError('Failed to load college overview data. Ensure you are logged in as College Admin or Dean.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isApiAvailable) {
      loadData();
    }
  }, [isApiAvailable]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Compute aggregated metrics
  const deptMetrics: Record<string, ReturnType<typeof extractMetrics>> = {};
  if (overview?.latestPerDept) {
    for (const [dept, sub] of Object.entries(overview.latestPerDept)) {
      deptMetrics[dept] = extractMetrics(sub.data as Record<string, unknown>);
    }
  }

  // Aggregate across all departments
  const aggregated = {
    totalFaculty: 0, totalPublications: 0, totalPlaced: 0, totalPatents: 0,
    totalMous: 0, totalAwards: 0, avgPlacementRate: 0, totalFdpHours: 0,
    totalConsultancies: 0, totalProjects: 0, totalStudentPubs: 0,
  };
  const deptKeys = Object.keys(deptMetrics);
  let placementRateSum = 0;
  for (const m of Object.values(deptMetrics)) {
    if (!m) continue;
    aggregated.totalFaculty += m.totalFaculty;
    aggregated.totalPublications += m.totalPublications;
    aggregated.totalPlaced += m.totalWithOffers;
    aggregated.totalPatents += m.patentsFiled;
    aggregated.totalMous += m.activeMous;
    aggregated.totalAwards += m.totalAwards;
    aggregated.totalFdpHours += m.totalFdpHours;
    aggregated.totalConsultancies += m.consultanciesUnderExecution;
    aggregated.totalProjects += m.projectsUnderExecution;
    aggregated.totalStudentPubs += m.studentPubs;
    placementRateSum += m.placementRate;
  }
  aggregated.avgPlacementRate = deptKeys.length > 0 ? Math.round(placementRateSum / deptKeys.length) : 0;

  // Faculty KPI submission stats grouped
  const facultyKpiByDept: Record<string, Record<string, number>> = {};
  if (overview?.facultyKpiStats) {
    for (const s of overview.facultyKpiStats) {
      if (!facultyKpiByDept[s.department]) facultyKpiByDept[s.department] = {};
      facultyKpiByDept[s.department][s.status] = s.count;
    }
  }

  // ─── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #6d28d9, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(109,40,217,0.3)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <Building2 size={28} color="white" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading College Dashboard...</span>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────
  if (error || !overview) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '40vh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: '#fef2f2', border: '1px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={28} color="#dc2626" />
        </div>
        <p style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 600 }}>{error || 'Failed to load data'}</p>
        <button onClick={handleRefresh} style={{
          padding: '8px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
          background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          color: '#6d28d9', fontFamily: 'inherit',
        }}>
          Try Again
        </button>
      </div>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 40%, #1e1b4b 100%)',
        borderRadius: '16px', padding: '28px 32px', color: 'white',
        position: 'relative', overflow: 'hidden',
      }} className="animate-fade-in">
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '20%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                  College Management Dashboard
                </h1>
                <p style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: '2px' }}>
                  Cross-department KPI overview — NMIT Academic Year 2025–26
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Department Tabs */}
            <div style={{
              display: 'flex', gap: '4px', padding: '4px',
              background: 'rgba(255,255,255,0.1)', borderRadius: '10px',
              backdropFilter: 'blur(10px)',
            }}>
              <button
                onClick={() => setSelectedDept(null)}
                style={{
                  padding: '6px 14px', borderRadius: '7px', border: 'none',
                  background: selectedDept === null ? 'white' : 'transparent',
                  color: selectedDept === null ? '#6d28d9' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
              >
                All Depts
              </button>
              {overview.departments.map((dept) => {
                const dl = deptLabels[dept];
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    style={{
                      padding: '6px 14px', borderRadius: '7px', border: 'none',
                      background: selectedDept === dept ? 'white' : 'transparent',
                      color: selectedDept === dept ? (dl?.color || '#6d28d9') : 'rgba(255,255,255,0.7)',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                  >
                    {dl?.shortName || dept.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                color: 'white', fontSize: '0.78rem', fontWeight: 600,
                cursor: refreshing ? 'wait' : 'pointer', fontFamily: 'inherit',
                opacity: refreshing ? 0.6 : 1, transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats summary pills */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '18px', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Departments', value: overview.departments.length },
            { label: 'Faculty (Total)', value: aggregated.totalFaculty },
            { label: 'KPI Submissions', value: overview.totalSubmissions },
          ].map((pill) => (
            <div key={pill.label} style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{pill.value}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{pill.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Aggregated KPI Cards ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<Users size={20} />} title="Total Faculty" value={selectedDept ? (deptMetrics[selectedDept]?.totalFaculty ?? 0) : aggregated.totalFaculty} subtitle={selectedDept ? deptLabels[selectedDept]?.name || selectedDept : 'Across all departments'} color="#2563eb" delay="stagger-1" />
        <StatCard icon={<BookOpen size={20} />} title="Publications" value={selectedDept ? (deptMetrics[selectedDept]?.totalPublications ?? 0) : aggregated.totalPublications} subtitle="Faculty publications this period" color="#059669" delay="stagger-2" />
        <StatCard icon={<Briefcase size={20} />} title="Placement Rate" value={`${selectedDept ? (deptMetrics[selectedDept]?.placementRate ?? 0) : aggregated.avgPlacementRate}%`} subtitle="Students with offers" color="#d97706" delay="stagger-3" />
        <StatCard icon={<Shield size={20} />} title="Patents Filed" value={selectedDept ? (deptMetrics[selectedDept]?.patentsFiled ?? 0) : aggregated.totalPatents} subtitle="Intellectual property" color="#7c3aed" delay="stagger-4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<Handshake size={20} />} title="Active MoUs" value={selectedDept ? (deptMetrics[selectedDept]?.activeMous ?? 0) : aggregated.totalMous} subtitle="Industry partnerships" color="#0891b2" delay="stagger-5" />
        <StatCard icon={<GraduationCap size={20} />} title="Awards" value={selectedDept ? (deptMetrics[selectedDept]?.totalAwards ?? 0) : aggregated.totalAwards} subtitle="Faculty & student awards" color="#dc2626" delay="stagger-6" />
        <StatCard icon={<TrendingUp size={20} />} title="FDP Hours" value={selectedDept ? (deptMetrics[selectedDept]?.totalFdpHours ?? 0) : aggregated.totalFdpHours} subtitle="Faculty development program" color="#0d9488" delay="stagger-1" />
        <StatCard icon={<BarChart3 size={20} />} title="Consultancies" value={selectedDept ? (deptMetrics[selectedDept]?.consultanciesUnderExecution ?? 0) : aggregated.totalConsultancies} subtitle="Under execution" color="#6366f1" delay="stagger-2" />
      </div>

      {/* ─── Department Comparison Section ────────────────────────────── */}
      {!selectedDept && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="animate-fade-in">

          {/* Publications Comparison */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: '14px',
            border: '1px solid var(--border-color)', overflow: 'hidden',
            boxShadow: 'var(--shadow-card-val)',
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#05966912', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Publications by Department</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', margin: 0 }}>Faculty research output comparison</p>
              </div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              {overview.departments.map((dept) => {
                const m = deptMetrics[dept];
                const dl = deptLabels[dept];
                if (!m) return null;
                return (
                  <div key={dept} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dl?.color || '#6d28d9' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dl?.shortName || dept}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>Total: {m.totalPublications}</span>
                    </div>
                    <HBar label="Q1 Journals" value={m.q1Pubs} max={20} color={dl?.color || '#6d28d9'} />
                    <HBar label="Q2 Journals" value={m.q2Pubs} max={20} color={dl?.color || '#6d28d9'} />
                    <HBar label="Conferences" value={m.conferencePapers} max={25} color={dl?.color || '#6d28d9'} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Placement Comparison */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: '14px',
            border: '1px solid var(--border-color)', overflow: 'hidden',
            boxShadow: 'var(--shadow-card-val)',
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#d9770612', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Placements by Department</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', margin: 0 }}>CTC distribution comparison</p>
              </div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              {overview.departments.map((dept) => {
                const m = deptMetrics[dept];
                const dl = deptLabels[dept];
                if (!m) return null;
                const total = m.totalWithOffers + m.totalWithoutOffers;
                return (
                  <div key={dept} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dl?.color || '#6d28d9' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dl?.shortName || dept}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>Rate: {m.placementRate}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <DonutChart percent={m.placementRate} color={dl?.color || '#059669'} size={56} thickness={5} />
                        <span style={{
                          position: 'absolute', inset: 0, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)',
                        }}>{m.placementRate}%</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <HBar label="Above 20L" value={m.ctcAbove20L} max={total || 1} color="#16a34a" />
                        <HBar label="10–20L" value={m.ctc10to20L} max={total || 1} color="#2563eb" />
                        <HBar label="Below 6L" value={m.ctcBelow6L} max={total || 1} color="#f59e0b" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Department Cards (when "All" is selected) ────────────────── */}
      {!selectedDept && (
        <div className="animate-fade-in">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Department Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
            {overview.departments.map((dept) => {
              const m = deptMetrics[dept];
              const dl = deptLabels[dept];
              const fkpi = facultyKpiByDept[dept] || {};
              const approved = fkpi['APPROVED'] || 0;
              const submitted = fkpi['SUBMITTED'] || 0;
              const rejected = fkpi['REJECTED'] || 0;
              const draft = fkpi['DRAFT'] || 0;
              const totalFKpi = approved + submitted + rejected + draft;

              if (!m) return null;

              return (
                <div key={dept} style={{
                  background: 'var(--bg-card)', borderRadius: '14px',
                  border: '1px solid var(--border-color)', overflow: 'hidden',
                  boxShadow: 'var(--shadow-card-val)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-val)'; }}
                >
                  {/* Header */}
                  <div style={{
                    padding: '18px 22px', borderBottom: '1px solid var(--border-faint)',
                    background: dl ? `${dl.color}08` : '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: dl?.gradient || '#6d28d9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.7rem', fontWeight: 800,
                      }}>
                        {dl?.shortName?.substring(0, 2) || dept.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {dl?.name || dept}
                        </h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', margin: 0 }}>
                          {m.totalFaculty} Faculty Members
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDept(dept)}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: `1px solid ${dl?.color || '#6d28d9'}30`,
                        background: `${dl?.color || '#6d28d9'}10`, color: dl?.color || '#6d28d9',
                        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      View Details →
                    </button>
                  </div>

                  {/* Quick Stats Grid */}
                  <div style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      {[
                        { label: 'Publications', value: m.totalPublications, color: '#059669' },
                        { label: 'Placement %', value: `${m.placementRate}%`, color: '#d97706' },
                        { label: 'Patents', value: m.patentsFiled, color: '#7c3aed' },
                        { label: 'MoUs', value: m.activeMous, color: '#0891b2' },
                      ].map((stat) => (
                        <div key={stat.label} style={{
                          textAlign: 'center', padding: '10px 6px', borderRadius: '8px',
                          background: `${stat.color}08`, border: `1px solid ${stat.color}15`,
                        }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Faculty KPI Submission Status */}
                    {totalFKpi > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Faculty KPI Submissions
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[
                            { label: 'Approved', count: approved, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={11} /> },
                            { label: 'Submitted', count: submitted, color: '#2563eb', bg: '#eff6ff', icon: <TrendingUp size={11} /> },
                            { label: 'Rejected', count: rejected, color: '#dc2626', bg: '#fef2f2', icon: <TrendingDown size={11} /> },
                            { label: 'Draft', count: draft, color: '#94a3b8', bg: '#f8fafc', icon: <Clock size={11} /> },
                          ].map((s) => (
                            <div key={s.label} style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '4px 10px', borderRadius: '999px',
                              background: s.bg, border: `1px solid ${s.color}25`,
                              fontSize: '0.7rem', fontWeight: 600, color: s.color,
                            }}>
                              {s.icon} {s.count} {s.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Single Department Detail (when dept is selected) ─────────── */}
      {selectedDept && deptMetrics[selectedDept] && (() => {
        const m = deptMetrics[selectedDept]!;
        const dl = deptLabels[selectedDept];
        const fkpi = facultyKpiByDept[selectedDept] || {};
        const approved = fkpi['APPROVED'] || 0;
        const submitted = fkpi['SUBMITTED'] || 0;
        const rejected = fkpi['REJECTED'] || 0;
        const draft = fkpi['DRAFT'] || 0;

        return (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Faculty Composition */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '14px',
              border: '1px solid var(--border-color)', overflow: 'hidden',
              boxShadow: 'var(--shadow-card-val)',
            }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-faint)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Faculty Composition</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', margin: 0 }}>{dl?.name || selectedDept}</p>
              </div>
              <div style={{ padding: '18px 22px' }}>
                <HBar label="Professors" value={m.profCount} max={m.totalFaculty || 1} color="#2563eb" />
                <HBar label="Associate Professors" value={m.assocProfCount} max={m.totalFaculty || 1} color="#0891b2" />
                <HBar label="Assistant Professors" value={m.asstProfCount} max={m.totalFaculty || 1} color="#7c3aed" />
                <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown size={14} color="#dc2626" />
                  <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>{m.resignedLastMonth} resigned last month</span>
                </div>
              </div>
            </div>

            {/* Research & IP */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '14px',
              border: '1px solid var(--border-color)', overflow: 'hidden',
              boxShadow: 'var(--shadow-card-val)',
            }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-faint)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Research & Intellectual Property</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', margin: 0 }}>Publications, patents & funded projects</p>
              </div>
              <div style={{ padding: '18px 22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Patents Filed', value: m.patentsFiled, color: '#7c3aed' },
                    { label: 'Published', value: m.patentsPublished, color: '#2563eb' },
                    { label: 'Granted', value: m.patentsGranted, color: '#16a34a' },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: '8px', background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <HBar label="Faculty Publications" value={m.totalPublications} max={50} color="#059669" />
                <HBar label="Student Publications" value={m.studentPubs} max={30} color="#0891b2" />
                <HBar label="Funded Projects" value={m.projectsUnderExecution} max={10} color="#d97706" />
              </div>
            </div>

            {/* Faculty KPI Status */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '14px',
              border: '1px solid var(--border-color)', overflow: 'hidden',
              boxShadow: 'var(--shadow-card-val)', gridColumn: '1 / -1',
            }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-faint)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Faculty KPI Submission Status</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', margin: 0 }}>Individual faculty KPI reports for {dl?.shortName || selectedDept}</p>
              </div>
              <div style={{ padding: '18px 22px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Approved', count: approved, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={18} /> },
                  { label: 'Submitted', count: submitted, color: '#2563eb', bg: '#eff6ff', icon: <TrendingUp size={18} /> },
                  { label: 'Rejected', count: rejected, color: '#dc2626', bg: '#fef2f2', icon: <AlertCircle size={18} /> },
                  { label: 'Draft', count: draft, color: '#94a3b8', bg: '#f8fafc', icon: <Clock size={18} /> },
                ].map((s) => (
                  <div key={s.label} style={{
                    flex: '1 1 120px', padding: '16px', borderRadius: '12px',
                    background: s.bg, border: `1px solid ${s.color}20`,
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{ color: s.color }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontWeight: 500 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Power BI Embed ──────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: '14px',
        border: '1px solid var(--border-color)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card-val)',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={16} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Power BI Analytics</h3>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-faint)', margin: 0 }}>
              {selectedDept ? `${deptLabels[selectedDept]?.name || selectedDept} — ` : 'All Departments — '}Interactive KPI Visualizations
            </p>
          </div>
        </div>
        <KpiReportEmbed periodId={currentPeriodId} minHeight={500} />
      </div>
    </div>
  );
}
