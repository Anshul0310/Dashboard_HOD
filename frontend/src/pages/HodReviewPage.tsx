import { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  AlertTriangle,
  Eye,
  Zap,
  ExternalLink,
  FileUp,
  Link2,
} from 'lucide-react';
import { FilterRail } from '../components/ui/FilterRail';
import { KpiCard } from '../components/ui/KpiCard';
import { useKpiStore, useAuthStore } from '../lib/store';
import {
  fetchDepartmentFacultySubmissions,
  reviewFacultyKpiSubmission,
  saveKpiSubmission,
  type ApiFacultyKpiSubmission,
} from '../lib/api';
import { sectionSchemas } from '../lib/sectionSchema';
import { facultySectionSchemas } from '../lib/facultySchema';
import type { SectionKey, SectionStatus } from '../lib/types';

type ReviewFilter = 'all' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export function HodReviewPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const user = useAuthStore((s) => s.user);

  const [submissions, setSubmissions] = useState<ApiFacultyKpiSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Load submissions
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchDepartmentFacultySubmissions(currentPeriodId);
        setSubmissions(data);
      } catch {
        setSubmissions([]);
      }
      setIsLoading(false);
    }
    load();
  }, [currentPeriodId]);

  const filteredSubmissions = filter === 'all'
    ? submissions
    : submissions.filter((s) => s.status === filter);

  const stats = {
    total: submissions.length,
    submitted: submissions.filter((s) => s.status === 'SUBMITTED').length,
    approved: submissions.filter((s) => s.status === 'APPROVED').length,
    rejected: submissions.filter((s) => s.status === 'REJECTED').length,
    draft: submissions.filter((s) => s.status === 'DRAFT').length,
  };

  const handleReview = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setReviewingId(id);
    try {
      const updated = await reviewFacultyKpiSubmission(id, action, reviewNote || undefined);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
      );
      setShowToast(`Submission ${action.toLowerCase()}!`);
      setExpandedId(null);
      setReviewNote('');
    } catch {
      setShowToast('Failed to review. Please try again.');
    }
    setReviewingId(null);
    setTimeout(() => setShowToast(null), 3000);
  };

  const statusColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    DRAFT: { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b', border: '#fde68a' },
    SUBMITTED: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', border: '#bfdbfe' },
    APPROVED: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#bbf7d0' },
    REJECTED: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', border: '#fecaca' },
  };

  // ─── Auto-Compile: Aggregate all approved faculty data into dept report ───
  const handleCompile = async () => {
    const approved = submissions.filter((s) => s.status === 'APPROVED');
    if (approved.length === 0) {
      setShowToast('No approved submissions to compile.');
      setTimeout(() => setShowToast(null), 3000);
      return;
    }

    setIsCompiling(true);
    try {
      // Initialize compiled department report with zeros/empty
      const compiled: Record<string, Record<string, unknown>> = {};
      for (const section of sectionSchemas) {
        compiled[section.key] = {};
        for (const field of section.fields) {
          if (field.type === 'number') compiled[section.key][field.key] = 0;
          else if (field.type === 'taglist') compiled[section.key][field.key] = [];
          else compiled[section.key][field.key] = '';
        }
      }

      // Use faculty schema mapsTo metadata for smart aggregation
      for (const facSection of facultySectionSchemas) {
        for (const facField of facSection.fields) {
          if (!facField.mapsTo) continue;
          const { deptSection, deptField, aggregation } = facField.mapsTo;

          // Ensure target exists
          if (!compiled[deptSection]) compiled[deptSection] = {};

          for (const sub of approved) {
            const facData = (sub.data as Record<string, Record<string, unknown>>)[facSection.key];
            if (!facData) continue;
            const val = facData[facField.key];

            switch (aggregation) {
              case 'sum':
                compiled[deptSection][deptField] = ((compiled[deptSection][deptField] as number) || 0) + ((val as number) || 0);
                break;
              case 'count_nonzero':
                if (typeof val === 'number' && val > 0) {
                  compiled[deptSection][deptField] = ((compiled[deptSection][deptField] as number) || 0) + 1;
                }
                break;
              case 'count_zero':
                if (typeof val === 'number' && val === 0) {
                  compiled[deptSection][deptField] = ((compiled[deptSection][deptField] as number) || 0) + 1;
                }
                break;
              case 'concat':
                if (val && typeof val === 'string' && val.trim()) {
                  const existing = compiled[deptSection][deptField] as string;
                  compiled[deptSection][deptField] = existing ? `${existing}; ${val}` : val;
                }
                break;
              case 'merge_tags':
                if (Array.isArray(val)) {
                  const existing = (compiled[deptSection][deptField] as string[]) || [];
                  compiled[deptSection][deptField] = [...new Set([...existing, ...val])];
                }
                break;
            }
          }
        }
      }

      // Smart derived fields from faculty data
      // FDP: count faculty with >0 hours / 0 hours
      let facultyWithFdp = 0;
      let facultyNilFdp = 0;
      for (const sub of approved) {
        const fdpData = (sub.data as Record<string, Record<string, unknown>>)['myFdp'];
        if (fdpData) {
          const hours = (fdpData['fdpHoursCompleted'] as number) || 0;
          if (hours > 0) facultyWithFdp++;
          else facultyNilFdp++;
        }
      }
      if (compiled['fdp']) {
        compiled['fdp']['facultyWithFdp'] = facultyWithFdp;
        compiled['fdp']['facultyNilFdp'] = facultyNilFdp;
      }

      // Publications: count faculty with nil publications
      let facultyNilPubs = 0;
      for (const sub of approved) {
        const pubData = (sub.data as Record<string, Record<string, unknown>>)['myPublications'];
        if (pubData) {
          const total = ((pubData['q1Publications'] as number) || 0) +
            ((pubData['q2Publications'] as number) || 0) +
            ((pubData['otherApprovedJournals'] as number) || 0) +
            ((pubData['conferencePapers'] as number) || 0);
          if (total === 0) facultyNilPubs++;
        }
      }
      if (compiled['facultyPublications']) {
        compiled['facultyPublications']['facultyNilPublications'] = facultyNilPubs;
      }

      // PhD Guideship: derive from individual yes/no answers
      let eligibleNotRegistered = 0;
      const namesEligibleNotRegistered: string[] = [];
      let registeredGuides = 0;
      let guidesWithNilStudents = 0;
      for (const sub of approved) {
        const phdData = (sub.data as Record<string, Record<string, unknown>>)['myPhdGuideship'];
        if (!phdData) continue;
        const facultyName = sub.faculty?.name || 'Unknown';
        const eligible = String(phdData['isEligibleForPhd'] || '').toLowerCase();
        const registered = String(phdData['isRegisteredAsGuide'] || '').toLowerCase();
        const students = (phdData['phdStudentsCount'] as number) || 0;

        if (eligible === 'yes' && registered !== 'yes') {
          eligibleNotRegistered++;
          namesEligibleNotRegistered.push(facultyName);
        }
        if (registered === 'yes') {
          registeredGuides++;
          if (students === 0) guidesWithNilStudents++;
        }
      }
      if (compiled['phdGuideship']) {
        compiled['phdGuideship']['eligibleNotRegistered'] = eligibleNotRegistered;
        compiled['phdGuideship']['namesEligibleNotRegistered'] = namesEligibleNotRegistered;
        compiled['phdGuideship']['registeredGuides'] = registeredGuides;
        compiled['phdGuideship']['guidesWithNilStudents'] = guidesWithNilStudents;
      }

      // MoUs: count active MoUs from unique summaries
      if (compiled['mous']) {
        const summaries = (compiled['mous']['mouSummaries'] as string[]) || [];
        compiled['mous']['activeMous'] = summaries.length;
      }

      // Build section statuses (mark all as completed)
      const sectionStatuses: Record<string, string> = {};
      for (const section of sectionSchemas) {
        sectionStatuses[section.key] = 'completed';
      }

      // Save as the official department KPI submission
      await saveKpiSubmission({
        periodId: currentPeriodId,
        department: user?.department || '',
        data: compiled,
        sectionStatuses,
        submittedAt: new Date().toISOString(),
      });

      setShowToast(`Department report compiled from ${approved.length} approved submissions!`);
    } catch (err) {
      console.error('Compile error:', err);
      setShowToast('Failed to compile report. Please try again.');
    }
    setIsCompiling(false);
    setTimeout(() => setShowToast(null), 4000);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#64748b' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading faculty submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Review Faculty Submissions</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Review, approve, or return faculty KPI submissions for your department.
          </p>
        </div>
        <FilterRail />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard icon={<Users size={18} />} title="Total" value={stats.total} accentColor="#2563eb" />
        <KpiCard icon={<Clock size={18} />} title="Pending Review" value={stats.submitted} accentColor="#d97706" />
        <KpiCard icon={<CheckCircle2 size={18} />} title="Approved" value={stats.approved} accentColor="#16a34a" />
        <KpiCard icon={<XCircle size={18} />} title="Rejected" value={stats.rejected} accentColor="#dc2626" />
        <KpiCard icon={<FileText size={18} />} title="Drafts" value={stats.draft} accentColor="#64748b" />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
        {(['all', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT'] as ReviewFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
              background: filter === f ? '#ffffff' : 'transparent',
              color: filter === f ? '#0f172a' : '#64748b',
              boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? `All (${stats.total})` 
              : f === 'SUBMITTED' ? `Pending (${stats.submitted})`
              : f === 'APPROVED' ? `Approved (${stats.approved})`
              : f === 'REJECTED' ? `Returned (${stats.rejected})`
              : `Drafts (${stats.draft})`
            }
          </button>
        ))}
      </div>

      {/* Auto-Compile Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: '#fbbf24' }} />
            Compile Department Report
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
            Automatically merge all <strong style={{ color: '#e2e8f0' }}>{stats.approved} approved</strong> faculty submissions into the official department KPI report.
          </p>
        </div>
        <button
          onClick={handleCompile}
          disabled={isCompiling || stats.approved === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            background: stats.approved > 0 ? '#fbbf24' : '#334155',
            color: stats.approved > 0 ? '#92400e' : '#64748b',
            fontSize: '0.9rem', fontWeight: 700, cursor: stats.approved > 0 && !isCompiling ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
        >
          {isCompiling ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <FileText size={16} />
          )}
          {isCompiling ? 'Compiling...' : 'Compile Now'}
        </button>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0',
        }}>
          <Users size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569' }}>No submissions found</p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
            {filter === 'all'
              ? 'No faculty members have submitted KPI data for this period yet.'
              : `No ${filter.toLowerCase()} submissions for this period.`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredSubmissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            const colors = statusColors[sub.status] || statusColors.DRAFT;
            const data = sub.data as Record<string, Record<string, unknown>>;

            return (
              <div
                key={sub.id}
                style={{
                  background: '#ffffff', borderRadius: '12px',
                  border: `1px solid ${isExpanded ? colors.border : '#e2e8f0'}`,
                  overflow: 'hidden', transition: 'all 0.2s',
                }}
              >
                {/* Row header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#475569', fontSize: '0.85rem', fontWeight: 700,
                    }}>
                      {sub.faculty?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                        {sub.faculty?.name || 'Unknown Faculty'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {sub.faculty?.email || ''} · Last updated {new Date(sub.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Status Badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 12px', borderRadius: '999px',
                      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                      fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.dot }} />
                      {sub.status}
                    </span>
                    {isExpanded ? <ChevronUp size={16} style={{ color: '#94a3b8' }} /> : <ChevronDown size={16} style={{ color: '#94a3b8' }} />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f1f5f9' }}>
                    {/* Data Summary */}
                    <div style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>
                        Submitted Data Summary
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {sectionSchemas.map((section) => {
                          const sectionData = data[section.key];
                          const hasData = sectionData && typeof sectionData === 'object' &&
                            Object.values(sectionData).some(v => v !== 0 && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0));

                          return (
                            <div
                              key={section.key}
                              style={{
                                padding: '8px 12px', borderRadius: '8px',
                                background: hasData ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${hasData ? '#bbf7d0' : '#e2e8f0'}`,
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}
                            >
                              <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: hasData ? '#22c55e' : '#cbd5e1',
                              }} />
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 500,
                                color: hasData ? '#166534' : '#94a3b8',
                              }}>
                                {section.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Key numbers from data */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {data.facultyPublications && (
                          <div style={{ padding: '6px 12px', background: '#eff6ff', borderRadius: '6px', fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>
                            Publications: {((data.facultyPublications as Record<string, number>).q1Publications || 0) + ((data.facultyPublications as Record<string, number>).q2Publications || 0)}
                          </div>
                        )}
                        {data.patentsIpr && (
                          <div style={{ padding: '6px 12px', background: '#f5f3ff', borderRadius: '6px', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                            Patents: {(data.patentsIpr as Record<string, number>).patentsFiled || 0}
                          </div>
                        )}
                        {data.fdp && (
                          <div style={{ padding: '6px 12px', background: '#fef3c7', borderRadius: '6px', fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>
                            FDP Hours: {(data.fdp as Record<string, number>).totalFdpHours || 0}
                          </div>
                        )}
                      </div>

                      {/* Render Evidence */}
                      {(() => {
                        const allEvidence: { sectionTitle: string; url: string; description: string; type: 'link' | 'file' }[] = [];
                        facultySectionSchemas.forEach(sec => {
                          const secData = data[sec.key] as Record<string, any>;
                          if (secData && secData.sectionEvidence && Array.isArray(secData.sectionEvidence)) {
                            secData.sectionEvidence.forEach(ev => {
                              allEvidence.push({ sectionTitle: sec.title, ...ev });
                            });
                          }
                        });

                        if (allEvidence.length > 0) {
                          return (
                            <div style={{ marginTop: '16px' }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Attached Evidence</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                                {allEvidence.map((ev, i) => (
                                  <a
                                    key={i}
                                    href={ev.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
                                      textDecoration: 'none', color: 'inherit'
                                    }}
                                  >
                                    <div style={{ color: '#2563eb', flexShrink: 0 }}>
                                      {ev.type === 'file' ? <FileUp size={16} /> : <Link2 size={16} />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.description}</p>
                                      <p style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.sectionTitle}</p>
                                    </div>
                                    <ExternalLink size={12} style={{ color: '#94a3b8', marginLeft: 'auto', flexShrink: 0 }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Review Actions — only show for SUBMITTED status */}
                    {sub.status === 'SUBMITTED' && (
                      <div style={{
                        padding: '16px 20px', borderTop: '1px solid #f1f5f9',
                        background: '#fafbfc',
                      }}>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                            Feedback Note (optional)
                          </label>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add a note for the faculty member..."
                            rows={2}
                            style={{
                              width: '100%', padding: '8px 12px', fontSize: '0.82rem',
                              border: '1px solid #e2e8f0', borderRadius: '8px',
                              outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleReview(sub.id, 'REJECTED')}
                            disabled={reviewingId === sub.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca',
                              background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
                              fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                              opacity: reviewingId === sub.id ? 0.6 : 1,
                            }}
                          >
                            <XCircle size={14} />
                            Return for Revision
                          </button>
                          <button
                            onClick={() => handleReview(sub.id, 'APPROVED')}
                            disabled={reviewingId === sub.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '8px 16px', borderRadius: '8px', border: 'none',
                              background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#ffffff',
                              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                              fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                              opacity: reviewingId === sub.id ? 0.6 : 1,
                            }}
                          >
                            {reviewingId === sub.id ? (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show review note for already reviewed */}
                    {(sub.status === 'APPROVED' || sub.status === 'REJECTED') && sub.reviewNote && (
                      <div style={{
                        padding: '12px 20px', borderTop: '1px solid #f1f5f9',
                        background: '#fafbfc', fontSize: '0.82rem', color: '#475569',
                      }}>
                        <strong>Review Note:</strong> {sub.reviewNote}
                        {sub.reviewedAt && (
                          <span style={{ color: '#94a3b8', marginLeft: '8px' }}>
                            — {new Date(sub.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
          <div className="bg-surface-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success-500" />
            {showToast}
          </div>
        </div>
      )}
    </div>
  );
}
