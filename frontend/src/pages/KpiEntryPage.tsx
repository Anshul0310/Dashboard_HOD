import { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Download,
  Send,
  Edit3,
  WifiOff,
  Loader2,
  Cloud,
} from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusChip } from '../components/ui/StatusChip';
import { SectionFormModal } from '../components/ui/SectionFormModal';
import { FilterRail } from '../components/ui/FilterRail';
import { useKpiStore, useAuthStore, useDeptStore } from '../lib/store';
import { getSectionCompletionStats } from '../lib/utils';
import { sectionSchemas } from '../lib/sectionSchema';
import type { SectionKey } from '../lib/types';
import * as LucideIcons from 'lucide-react';
import { generateTemplateCsv, parseKpiCsv } from '../lib/csvUtils';

export function KpiEntryPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const getSubmission = useKpiStore((s) => s.getSubmission);
  const submitAll = useKpiStore((s) => s.submitAll);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  const submission = getSubmission(currentPeriodId);
  const stats = getSectionCompletionStats(submission.sectionStatuses);
  const isApiAvailable = useAuthStore((s) => s.isApiAvailable);
  const user = useAuthStore((s) => s.user);
  const selectedDeptId = useDeptStore((s) => s.selectedDeptId);
  const syncSubmissionToApi = useKpiStore((s) => s.syncSubmissionToApi);
  const saveSectionToApi = useKpiStore((s) => s.saveSectionToApi);
  const isSyncing = useKpiStore((s) => s.isSyncing);
  const department = user?.department || selectedDeptId;
  const activeSchema = activeSection
    ? sectionSchemas.find((s) => s.key === activeSection)
    : null;

  const handleSubmitAll = async () => {
    submitAll(currentPeriodId);
    if (isApiAvailable && user) {
      await syncSubmissionToApi(currentPeriodId, department);
    }
    setShowToast('All sections submitted successfully!');
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDownloadTemplate = () => {
    const csv = generateTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KPI_Template_${currentPeriodId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowToast('Template downloaded successfully.');
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const data = parseKpiCsv(text);
          
          let sectionsCount = 0;
          for (const [sectionKey, values] of Object.entries(data)) {
            if (isApiAvailable && user) {
               await saveSectionToApi(currentPeriodId, sectionKey as SectionKey, values, department);
            } else {
               useKpiStore.getState().saveSection(currentPeriodId, sectionKey as SectionKey, values);
            }
            sectionsCount++;
          }
          
          setShowToast(`Successfully loaded ${sectionsCount} sections from CSV.`);
          setTimeout(() => setShowToast(null), 3000);
        } catch (err) {
          setShowToast('Failed to parse CSV file.');
          setTimeout(() => setShowToast(null), 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">KPI Data Entry</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Fill in KPI data for each section. All fields are saved per period.
          </p>
        </div>
        <FilterRail />
      </div>

      {/* Sync Status Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px', borderRadius: '10px',
        background: isApiAvailable ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${isApiAvailable ? '#bbf7d0' : '#fde68a'}`,
      }}>
        {isSyncing ? (
          <>
            <Loader2 size={16} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e40af' }}>Syncing to server...</span>
          </>
        ) : isApiAvailable ? (
          <>
            <Cloud size={16} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#15803d' }}>Online Mode</span>
            <span style={{ fontSize: '0.78rem', color: '#4ade80' }}>·</span>
            <span style={{ fontSize: '0.78rem', color: '#166534' }}>Data saves directly to the server & updates Power BI</span>
          </>
        ) : (
          <>
            <WifiOff size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#991b1b' }}>Disconnected</span>
            <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>·</span>
            <span style={{ fontSize: '0.78rem', color: '#991b1b' }}>Cannot reach the server. Please check your connection.</span>
          </>
        )}
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={<ClipboardList size={20} />}
          title="Total Sections"
          value={stats.total}
          accentColor="#2563eb"
          className="animate-fade-in stagger-1"
        />
        <KpiCard
          icon={<CheckCircle2 size={20} />}
          title="Completed"
          value={stats.completed}
          accentColor="#16a34a"
          className="animate-fade-in stagger-2"
        />
        <KpiCard
          icon={<Clock size={20} />}
          title="In Progress"
          value={stats.inProgress}
          accentColor="#d97706"
          className="animate-fade-in stagger-3"
        />
        <KpiCard
          icon={<AlertCircle size={20} />}
          title="Not Started"
          value={stats.notStarted}
          accentColor="#64748b"
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Section List */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-800">
            KPI Sections
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 bg-white border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors focus-ring"
            >
              <Download size={13} />
              Download Template
            </button>
            <button
              onClick={handleUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 bg-white border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors focus-ring"
            >
              <Upload size={13} />
              Upload Sheet
            </button>
          </div>
        </div>

        <div className="divide-y divide-surface-100">
          {sectionSchemas.map((section, index) => {
            const status = submission.sectionStatuses[section.key];
            const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[section.icon];

            return (
              <div
                key={section.key}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-surface-500 shrink-0">
                    {IconComponent ? <IconComponent size={16} /> : <ClipboardList size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">
                      {section.title}
                    </p>
                    <p className="text-[11px] text-surface-400">
                      {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusChip status={status} />
                  <button
                    onClick={() => setActiveSection(section.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors focus-ring"
                  >
                    <Edit3 size={12} />
                    {status === 'not_started' ? 'Fill' : 'Edit'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit All Button */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-surface-200 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-surface-800">
            Ready to submit?
          </p>
          <p className="text-xs text-surface-500 mt-0.5">
            {stats.completed === stats.total
              ? 'All sections are complete. You can submit now.'
              : `Complete ${stats.total - stats.completed} more section(s) before submitting.`}
          </p>
        </div>
        <button
          onClick={handleSubmitAll}
          disabled={stats.completed !== stats.total && !submission.submittedAt}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm focus-ring"
        >
          <Send size={16} />
          Submit All for This Period
        </button>
      </div>

      {/* Section Form Modal */}
      {activeSchema && (
        <SectionFormModal
          schema={activeSchema}
          periodId={currentPeriodId}
          isOpen={!!activeSection}
          onClose={() => setActiveSection(null)}
        />
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
