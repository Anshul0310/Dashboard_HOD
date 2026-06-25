import { Users, UserMinus, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { KpiCard } from '../components/ui/KpiCard';
import { FilterRail } from '../components/ui/FilterRail';
import { useKpiStore } from '../lib/store';
import { calcTrend } from '../lib/utils';

export function FacultyPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const getSubmission = useKpiStore((s) => s.getSubmission);
  const periods = useKpiStore((s) => s.periods);

  const submission = getSubmission(currentPeriodId);
  const { faculty, lms, latePunchIn } = submission.data;
  const totalFaculty = faculty.profCount + faculty.assocProfCount + faculty.asstProfCount;

  // Previous period for trends
  const currentIndex = periods.findIndex((p) => p.id === currentPeriodId);
  const prevPeriodId = currentIndex > 0 ? periods[currentIndex - 1].id : null;
  const prevData = prevPeriodId ? getSubmission(prevPeriodId).data : null;
  const prevTotal = prevData ? prevData.faculty.profCount + prevData.faculty.assocProfCount + prevData.faculty.asstProfCount : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to="/overview" className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          <ArrowLeft size={16} />
          Back to Overview
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-surface-900">Faculty</h1>
        <FilterRail />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={<Users size={20} />}
          title="Total Faculty"
          value={totalFaculty}
          subtitle={`${faculty.profCount} Prof · ${faculty.assocProfCount} Assoc · ${faculty.asstProfCount} Asst`}
          trend={prevTotal !== null ? calcTrend(totalFaculty, prevTotal) : undefined}
          accentColor="#2563eb"
          className="animate-fade-in stagger-1"
        />
        <KpiCard
          icon={<UserMinus size={20} />}
          title="Resigned Last Month"
          value={faculty.resignedLastMonth}
          subtitle={`Ratio: ${faculty.studentFacultyRatio}`}
          accentColor="#dc2626"
          className="animate-fade-in stagger-2"
        />
        <KpiCard
          icon={<BookOpen size={20} />}
          title="LMS Non-Compliance"
          value={lms.lessonPlansNotInLms}
          subtitle={`${lms.facultyLessThan5Items} faculty with <5 items`}
          accentColor="#d97706"
          className="animate-fade-in stagger-3"
        />
        <KpiCard
          icon={<Clock size={20} />}
          title="Late Punch-ins"
          value={latePunchIn.latePunchInsLastMonth}
          subtitle="After 09:15 last month"
          accentColor="#0891b2"
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Faculty Designation Breakdown */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden animate-fade-in">
          <div className="px-5 py-3.5 border-b border-surface-200 bg-surface-50">
            <h3 className="text-sm font-semibold text-surface-800">Faculty Designation Breakdown</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Designation</th>
                <th className="text-right text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Count</th>
                <th className="text-right text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {[
                { label: 'Professor', count: faculty.profCount, color: 'bg-primary-500' },
                { label: 'Associate Professor', count: faculty.assocProfCount, color: 'bg-info-500' },
                { label: 'Assistant Professor', count: faculty.asstProfCount, color: 'bg-success-500' },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-surface-700 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.color}`} />
                    {row.label}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-surface-800 text-right">{row.count}</td>
                  <td className="px-5 py-3 text-sm text-surface-500 text-right">
                    {totalFaculty > 0 ? Math.round((row.count / totalFaculty) * 100) : 0}%
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-50 font-semibold">
                <td className="px-5 py-3 text-sm text-surface-800">Total</td>
                <td className="px-5 py-3 text-sm text-surface-800 text-right">{totalFaculty}</td>
                <td className="px-5 py-3 text-sm text-surface-800 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LMS Compliance Detail */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden animate-fade-in">
          <div className="px-5 py-3.5 border-b border-surface-200 bg-surface-50">
            <h3 className="text-sm font-semibold text-surface-800">LMS Non-Compliance — Faculty List</h3>
            <p className="text-[11px] text-surface-400 mt-0.5">
              Faculty whose lesson plans are NOT uploaded to LMS
            </p>
          </div>
          <div className="divide-y divide-surface-100">
            {lms.facultyNamesNotInLms.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-surface-400">
                All faculty have lesson plans in LMS ✓
              </div>
            ) : (
              lms.facultyNamesNotInLms.map((name, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-danger-50 flex items-center justify-center text-danger-600 text-xs font-bold">
                      {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm text-surface-700">{name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-danger-600 bg-danger-50 px-2 py-0.5 rounded-full">
                    Missing
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-surface-200 bg-surface-50">
            <p className="text-xs text-surface-500">
              Additionally, <span className="font-semibold text-warning-600">{lms.facultyLessThan5Items}</span> faculty have posted fewer than 5 items in LMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
