import { ArrowLeft, Briefcase, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { KpiCard } from '../components/ui/KpiCard';
import { FilterRail } from '../components/ui/FilterRail';
import { useKpiStore } from '../lib/store';



export function PlacementsPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const getSubmission = useKpiStore((s) => s.getSubmission);

  const submission = getSubmission(currentPeriodId);
  const { placement } = submission.data;
  const totalGraduating = placement.totalWithOffers + placement.totalWithoutOffers;
  const offerRate = totalGraduating > 0 ? Math.round((placement.totalWithOffers / totalGraduating) * 100) : 0;

  const ctcBandData = [
    { name: '> ₹20L', value: placement.ctcAbove20L, fill: '#10b981' },
    { name: '₹10-20L', value: placement.ctc10to20L, fill: '#6366f1' },
    { name: '₹6-10L', value: placement.ctc6to10L, fill: '#0ea5e9' },
    { name: '< ₹6L', value: placement.ctcBelow6L, fill: '#f59e0b' },
  ];

  const offerPieData = [
    { name: 'With Offers', value: placement.totalWithOffers },
    { name: 'Without Offers', value: placement.totalWithoutOffers },
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
        <h1 className="text-xl font-bold text-surface-900">Placements</h1>
        <FilterRail />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={<Briefcase size={20} />}
          title="Offer Rate"
          value={`${offerRate}%`}
          subtitle={`${placement.totalWithOffers} of ${totalGraduating} students`}
          accentColor="#16a34a"
          className="animate-fade-in stagger-1"
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          title="CTC > ₹20L"
          value={placement.ctcAbove20L}
          subtitle="Top tier placements"
          accentColor="#059669"
          className="animate-fade-in stagger-2"
        />
        <KpiCard
          icon={<Award size={20} />}
          title="Total Placed"
          value={placement.totalWithOffers}
          subtitle="With job offers"
          accentColor="#2563eb"
          className="animate-fade-in stagger-3"
        />
        <KpiCard
          icon={<Briefcase size={20} />}
          title="Without Offers"
          value={placement.totalWithoutOffers}
          subtitle="Need attention"
          accentColor="#dc2626"
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* CTC Band Bar Chart */}
        <div className="bg-white rounded-xl border border-surface-200 p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-surface-800 mb-4">
            CTC Distribution — Graduating Batch
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ctcBandData} barSize={48}>
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
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {ctcBandData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Offers vs No Offers Pie */}
        <div className="bg-white rounded-xl border border-surface-200 p-5 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-sm font-semibold text-surface-800 mb-4" style={{ color: 'var(--text-primary)' }}>
            Placement Status — Offers vs No Offers
          </h3>
          <div style={{ flex: 1, minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
              <Pie
                data={offerPieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                label={false}
                labelLine={false}
              >
                <Cell fill="#10b981" />
                <Cell fill="#f43f5e" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-success-500" />
              <span className="text-xs text-surface-600">With Offers ({placement.totalWithOffers})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-danger-500" />
              <span className="text-xs text-surface-600">Without Offers ({placement.totalWithoutOffers})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw numbers table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden animate-fade-in">
        <div className="px-5 py-3.5 border-b border-surface-200 bg-surface-50">
          <h3 className="text-sm font-semibold text-surface-800">Placement Data — Raw Numbers</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Metric</th>
              <th className="text-right text-xs font-semibold text-surface-500 uppercase px-5 py-2.5">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {[
              { label: 'Total Graduating Students', value: totalGraduating },
              { label: 'Students with Job Offers', value: placement.totalWithOffers },
              { label: 'Students without Job Offers', value: placement.totalWithoutOffers },
              { label: 'CTC > ₹20 Lacs', value: placement.ctcAbove20L },
              { label: 'CTC ₹10–20 Lacs', value: placement.ctc10to20L },
              { label: 'CTC ₹6–10 Lacs', value: placement.ctc6to10L },
              { label: 'CTC < ₹6 Lacs', value: placement.ctcBelow6L },
              { label: 'Placement Offer Rate', value: `${offerRate}%` },
            ].map((row) => (
              <tr key={row.label} className="hover:bg-surface-50 transition-colors">
                <td className="px-5 py-3 text-sm text-surface-700">{row.label}</td>
                <td className="px-5 py-3 text-sm font-semibold text-surface-800 text-right">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
