import { useState } from 'react';
import { FileBarChart, Download, Printer, CheckCircle2, BarChart3 } from 'lucide-react';
import { FilterRail } from '../components/ui/FilterRail';
import { KpiReportEmbed } from '../components/powerbi/KpiReportEmbed';
import { useKpiStore, useDeptStore } from '../lib/store';
import { calcSummaryMetrics, formatDate } from '../lib/utils';
import { sectionSchemas } from '../lib/sectionSchema';

export function ReportsPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const getSubmission = useKpiStore((s) => s.getSubmission);
  const periods = useKpiStore((s) => s.periods);
  const [showPreview, setShowPreview] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dept = useDeptStore((s) => s.getSelectedDept());

  const submission = getSubmission(currentPeriodId);
  const metrics = calcSummaryMetrics(submission.data);
  const currentPeriod = periods.find((p) => p.id === currentPeriodId);

  const handleDownloadPdf = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Reports</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Interactive Power BI analytics and KPI summary reports.
          </p>
        </div>
        <FilterRail />
      </div>

      {/* Power BI Interactive Dashboard */}
      <div style={{
        background: '#ffffff', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BarChart3 size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Power BI Interactive Dashboard
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              Live KPI visualizations — {dept.name}
            </p>
          </div>
        </div>
        <KpiReportEmbed periodId={currentPeriodId} minHeight={600} />
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl border border-surface-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <FileBarChart size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">
              KPI Summary Report — {currentPeriod?.label}
            </p>
            <p className="text-xs text-surface-500">
              Last updated: {formatDate(submission.lastUpdated)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors focus-ring"
          >
            <Printer size={14} />
            {showPreview ? 'Hide Preview' : 'Generate Report'}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm focus-ring"
          >
            <Download size={14} />
            Download as PDF
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden animate-scale-in print:shadow-none">
          {/* Report Header */}
          <div className="bg-gradient-primary px-8 py-6 text-white">
            <h2 className="text-lg font-bold">Department KPI Report</h2>
            <p className="text-primary-200 text-sm mt-1">
              Department of Computer Science — {currentPeriod?.label}
            </p>
            <p className="text-primary-300 text-xs mt-2">
              Generated on {formatDate(new Date().toISOString())} | Data updated: {formatDate(submission.lastUpdated)}
            </p>
          </div>

          {/* Summary Metrics */}
          <div className="px-8 py-6 border-b border-surface-200">
            <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wider mb-4">Key Metrics Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Faculty', value: metrics.totalFaculty },
                { label: 'LMS Compliance', value: `${metrics.lmsCompliancePercent}%` },
                { label: 'On-time %', value: `${metrics.onTimePunchInPercent}%` },
                { label: 'Active MoUs', value: metrics.activeMous },
                { label: 'Patents Filed', value: metrics.patentsFiledYtd },
                { label: 'Placement Rate', value: `${metrics.placementOfferRatePercent}%` },
              ].map((metric) => (
                <div key={metric.label} className="bg-surface-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-surface-900">{metric.value}</p>
                  <p className="text-[10px] font-medium text-surface-500 uppercase mt-1">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section-by-Section Data */}
          <div className="px-8 py-6 space-y-6">
            <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wider">Section Details</h3>
            {sectionSchemas.map((schema) => {
              const sectionData = submission.data[schema.key as keyof typeof submission.data] as unknown as Record<string, unknown>;
              return (
                <div key={schema.key} className="border border-surface-200 rounded-lg overflow-hidden">
                  <div className="bg-surface-50 px-4 py-2.5 border-b border-surface-200">
                    <h4 className="text-sm font-semibold text-surface-800">{schema.title}</h4>
                  </div>
                  <div className="px-4 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {schema.fields.map((field) => {
                        const val = sectionData[field.key];
                        const displayVal = Array.isArray(val)
                          ? (val as string[]).join(', ') || '—'
                          : val !== undefined && val !== null && val !== ''
                          ? String(val)
                          : '—';
                        return (
                          <div key={field.key} className="flex items-baseline justify-between py-1 border-b border-surface-100 last:border-0">
                            <span className="text-xs text-surface-500 mr-2 truncate">{field.label}</span>
                            <span className="text-xs font-semibold text-surface-800 shrink-0">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
          <div className="bg-surface-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="text-warning-400" />
            Export will be enabled once connected to backend.
          </div>
        </div>
      )}
    </div>
  );
}
