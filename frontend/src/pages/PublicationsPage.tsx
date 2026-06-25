import { ArrowLeft, FileText, GraduationCap, Beaker, BookOpen, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { KpiCard } from '../components/ui/KpiCard';
import { FilterRail } from '../components/ui/FilterRail';
import { useKpiStore } from '../lib/store';

export function PublicationsPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const getSubmission = useKpiStore((s) => s.getSubmission);

  const submission = getSubmission(currentPeriodId);
  const { facultyPublications: fp, studentPublications: sp, fundedProjects, phdGuideship, patentsIpr } = submission.data;

  const totalFacultyPubs = fp.q1Publications + fp.q2Publications + fp.otherApprovedJournals + fp.conferencePapers;
  const totalStudentPubs = sp.q1Publications + sp.q2Publications + sp.otherApprovedJournals + sp.conferencePapers;

  // Chart data
  const pubComparisonData = [
    { name: 'Q1', Faculty: fp.q1Publications, Students: sp.q1Publications },
    { name: 'Q2', Faculty: fp.q2Publications, Students: sp.q2Publications },
    { name: 'Other Journals', Faculty: fp.otherApprovedJournals, Students: sp.otherApprovedJournals },
    { name: 'Conference', Faculty: fp.conferencePapers, Students: sp.conferencePapers },
  ];

  const patentsData = [
    { name: 'Filed', value: patentsIpr.patentsFiled },
    { name: 'Published', value: patentsIpr.patentsPublished },
    { name: 'Granted', value: patentsIpr.patentsGranted },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/overview" className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          <ArrowLeft size={16} />
          Back to Overview
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-surface-900">Publications & Research</h1>
        <FilterRail />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <KpiCard
          icon={<FileText size={20} />}
          title="Faculty Publications"
          value={totalFacultyPubs}
          subtitle="Since Jan 1"
          accentColor="#2563eb"
          className="animate-fade-in stagger-1"
        />
        <KpiCard
          icon={<GraduationCap size={20} />}
          title="Student Publications"
          value={totalStudentPubs}
          subtitle="Since Jan 1"
          accentColor="#0891b2"
          className="animate-fade-in stagger-2"
        />
        <KpiCard
          icon={<Beaker size={20} />}
          title="Funded Projects"
          value={fundedProjects.projectsUnderExecution}
          subtitle={`${fundedProjects.proposalsUnderPreparation} proposals in prep`}
          accentColor="#16a34a"
          className="animate-fade-in stagger-3"
        />
        <KpiCard
          icon={<BookOpen size={20} />}
          title="PhD Guides"
          value={phdGuideship.registeredGuides}
          subtitle={`${phdGuideship.eligibleNotRegistered} eligible but unregistered`}
          accentColor="#d97706"
          className="animate-fade-in stagger-4"
        />
        <KpiCard
          icon={<Shield size={20} />}
          title="Patents Filed"
          value={patentsIpr.patentsFiled}
          subtitle={`${patentsIpr.patentsGranted} granted`}
          accentColor="#7c3aed"
          className="animate-fade-in stagger-5"
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Publications Comparison Chart */}
        <div className="bg-white rounded-xl border border-surface-200 p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-surface-800 mb-4">
            Faculty vs Student Publications (Since Jan)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pubComparisonData} barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Faculty" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Students" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patents/IPR Timeline */}
        <div className="bg-white rounded-xl border border-surface-200 p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-surface-800 mb-4">
            Patents / IPR Pipeline (Since Jan)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={patentsData} layout="vertical" barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Faculty Publications Detail */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden animate-fade-in">
          <div className="px-5 py-3.5 border-b border-surface-200 bg-surface-50">
            <h3 className="text-sm font-semibold text-surface-800">Faculty Publications Detail</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Category</th>
                <th className="text-right text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Published</th>
                <th className="text-right text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Under Prep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Q1 Journals</td><td className="px-5 py-3 text-sm text-right font-semibold">{fp.q1Publications}</td><td className="px-5 py-3 text-sm text-right text-surface-500">{fp.q1UnderPreparation}</td></tr>
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Q2 Journals</td><td className="px-5 py-3 text-sm text-right font-semibold">{fp.q2Publications}</td><td className="px-5 py-3 text-sm text-right text-surface-500">{fp.q2UnderPreparation}</td></tr>
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Other Journals</td><td className="px-5 py-3 text-sm text-right font-semibold">{fp.otherApprovedJournals}</td><td className="px-5 py-3 text-sm text-right text-surface-500">{fp.journalUnderPreparation}</td></tr>
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Conference Papers</td><td className="px-5 py-3 text-sm text-right font-semibold">{fp.conferencePapers}</td><td className="px-5 py-3 text-sm text-right text-surface-500">—</td></tr>
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-surface-200 bg-danger-50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger-500" />
            <span className="text-xs text-danger-700 font-medium">{fp.facultyNilPublications} faculty with nil publications since Jan</span>
          </div>
        </div>

        {/* PhD Guideship Detail */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden animate-fade-in">
          <div className="px-5 py-3.5 border-b border-surface-200 bg-surface-50">
            <h3 className="text-sm font-semibold text-surface-800">PhD Guideship</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Metric</th>
                <th className="text-right text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Registered as PhD guides</td><td className="px-5 py-3 text-sm text-right font-semibold text-success-600">{phdGuideship.registeredGuides}</td></tr>
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Eligible but NOT registered</td><td className="px-5 py-3 text-sm text-right font-semibold text-danger-600">{phdGuideship.eligibleNotRegistered}</td></tr>
              <tr className="hover:bg-surface-50"><td className="px-5 py-3 text-sm text-surface-700">Guides with nil PhD students</td><td className="px-5 py-3 text-sm text-right font-semibold text-warning-600">{phdGuideship.guidesWithNilStudents}</td></tr>
            </tbody>
          </table>
          {phdGuideship.namesEligibleNotRegistered.length > 0 && (
            <div className="px-5 py-3 border-t border-surface-200 bg-warning-50">
              <p className="text-xs text-warning-700 font-medium mb-1">Eligible but not registered:</p>
              <div className="flex flex-wrap gap-1.5">
                {phdGuideship.namesEligibleNotRegistered.map((name, i) => (
                  <span key={i} className="text-[11px] bg-white text-warning-700 px-2 py-0.5 rounded-full border border-warning-200">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
