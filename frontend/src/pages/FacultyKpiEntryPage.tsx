import { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Edit3,
  Save,
  X,
  Loader2,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusChip } from '../components/ui/StatusChip';
import { FilterRail } from '../components/ui/FilterRail';
import { useKpiStore, useAuthStore } from '../lib/store';
import { getSectionCompletionStats } from '../lib/utils';
import type { SectionStatus } from '../lib/types';
import {
  facultySectionSchemas,
  emptyFacultyData,
  type FacultySectionKey,
  type FacultySectionSchema,
  type FacultyFieldSchema,
} from '../lib/facultySchema';
import {
  saveFacultyKpiSubmission,
  fetchMyFacultyKpiSubmission,
} from '../lib/api';
import * as LucideIcons from 'lucide-react';
import { EvidenceInput, type EvidenceItem } from '../components/ui/EvidenceInput';

type FacultySubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;

export function FacultyKpiEntryPage() {
  const currentPeriodId = useKpiStore((s) => s.currentPeriodId);
  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState<Record<string, Record<string, unknown>>>({ ...emptyFacultyData });
  const [sectionStatuses, setSectionStatuses] = useState<Record<FacultySectionKey, SectionStatus>>({
    myPublications: 'not_started', myStudentPublications: 'not_started',
    myFundedProjects: 'not_started', myPhdGuideship: 'not_started',
    myMous: 'not_started', myFdp: 'not_started', myAwards: 'not_started',
    myConsultancy: 'not_started', myPartialDelivery: 'not_started', myPatents: 'not_started',
  });
  const [submissionStatus, setSubmissionStatus] = useState<FacultySubmissionStatus>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<FacultySectionKey | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing submission for this period
  useEffect(() => {
    async function loadSubmission() {
      setIsLoading(true);
      try {
        const sub = await fetchMyFacultyKpiSubmission(currentPeriodId);
        if (sub) {
          setFormData(sub.data as Record<string, Record<string, unknown>>);
          setSubmissionStatus(sub.status as FacultySubmissionStatus);
          setReviewNote(sub.reviewNote || null);
          // Derive section statuses from data
          const statuses: Record<string, SectionStatus> = {};
          for (const schema of facultySectionSchemas) {
            const sectionData = (sub.data as Record<string, unknown>)[schema.key];
            if (sectionData && typeof sectionData === 'object' && Object.values(sectionData as Record<string, unknown>).some(v => v !== 0 && v !== '' && v !== null && (!Array.isArray(v) || v.length > 0))) {
              statuses[schema.key] = 'completed';
            } else {
              statuses[schema.key] = 'not_started';
            }
          }
          setSectionStatuses(statuses as Record<FacultySectionKey, SectionStatus>);
        }
      } catch {
        // No existing submission — start fresh
        setFormData({ ...emptyFacultyData });
        setSubmissionStatus(null);
      }
      setIsLoading(false);
    }
    loadSubmission();
  }, [currentPeriodId]);

  const stats = getSectionCompletionStats(sectionStatuses as Record<string, SectionStatus>);
  const isEditable = !submissionStatus || submissionStatus === 'DRAFT' || submissionStatus === 'REJECTED';
  const activeSchema = activeSection
    ? facultySectionSchemas.find((s) => s.key === activeSection)
    : null;

  const handleSaveSection = (sectionKey: FacultySectionKey, values: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], ...values },
    }));
    setSectionStatuses((prev) => ({
      ...prev,
      [sectionKey]: 'completed',
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveFacultyKpiSubmission({
        periodId: currentPeriodId,
        data: formData,
        submit: false,
      });
      setSubmissionStatus('DRAFT');
      setShowToast('Draft saved successfully!');
    } catch {
      setShowToast('Failed to save draft.');
    }
    setIsSaving(false);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      await saveFacultyKpiSubmission({
        periodId: currentPeriodId,
        data: formData,
        submit: true,
      });
      setSubmissionStatus('SUBMITTED');
      setShowToast('Submitted for HOD review!');
    } catch {
      setShowToast('Failed to submit. Please try again.');
    }
    setIsSubmitting(false);
    setTimeout(() => setShowToast(null), 3000);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#64748b' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading your KPI data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">My KPI Data Entry</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Fill in your personal KPI contributions. Submit for HOD review when ready.
          </p>
        </div>
        <FilterRail />
      </div>

      {/* Submission Status Banner */}
      {submissionStatus && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '10px',
          background: submissionStatus === 'APPROVED' ? '#f0fdf4'
            : submissionStatus === 'REJECTED' ? '#fef2f2'
            : submissionStatus === 'SUBMITTED' ? '#eff6ff'
            : '#fffbeb',
          border: `1px solid ${
            submissionStatus === 'APPROVED' ? '#bbf7d0'
            : submissionStatus === 'REJECTED' ? '#fecaca'
            : submissionStatus === 'SUBMITTED' ? '#bfdbfe'
            : '#fde68a'
          }`,
        }}>
          {submissionStatus === 'APPROVED' && <FileCheck size={18} style={{ color: '#16a34a' }} />}
          {submissionStatus === 'REJECTED' && <AlertTriangle size={18} style={{ color: '#dc2626' }} />}
          {submissionStatus === 'SUBMITTED' && <Clock size={18} style={{ color: '#2563eb' }} />}
          {submissionStatus === 'DRAFT' && <Edit3 size={18} style={{ color: '#d97706' }} />}
          <div>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700,
              color: submissionStatus === 'APPROVED' ? '#15803d'
                : submissionStatus === 'REJECTED' ? '#dc2626'
                : submissionStatus === 'SUBMITTED' ? '#1d4ed8'
                : '#92400e',
            }}>
              {submissionStatus === 'APPROVED' && 'Approved by HOD'}
              {submissionStatus === 'REJECTED' && 'Returned by HOD — Please Revise'}
              {submissionStatus === 'SUBMITTED' && 'Submitted — Pending HOD Review'}
              {submissionStatus === 'DRAFT' && 'Draft — Not Yet Submitted'}
            </span>
            {reviewNote && submissionStatus === 'REJECTED' && (
              <p style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '4px' }}>
                <strong>HOD Feedback:</strong> {reviewNote}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <KpiCard icon={<ClipboardList size={20} />} title="Total Sections" value={stats.total} accentColor="#2563eb" />
        <KpiCard icon={<CheckCircle2 size={20} />} title="Completed" value={stats.completed} accentColor="#16a34a" />
        <KpiCard icon={<Clock size={20} />} title="In Progress" value={stats.inProgress} accentColor="#d97706" />
        <KpiCard icon={<AlertCircle size={20} />} title="Not Started" value={stats.notStarted} accentColor="#64748b" />
      </div>

      {/* Section List */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-800">
            KPI Sections — Your Personal Data
          </h2>
          {isEditable && (
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 bg-white border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors focus-ring"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
        </div>

        <div className="divide-y divide-surface-100">
          {facultySectionSchemas.map((section, index) => {
            const status = sectionStatuses[section.key];
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
                  {isEditable ? (
                    <button
                      onClick={() => setActiveSection(section.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors focus-ring"
                    >
                      <Edit3 size={12} />
                      {status === 'not_started' ? 'Fill' : 'Edit'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveSection(section.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-500 bg-surface-50 border border-surface-200 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit / Action Buttons */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-surface-200 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-surface-800">
            {isEditable ? 'Ready to submit for review?' : 'Submission status'}
          </p>
          <p className="text-xs text-surface-500 mt-0.5">
            {submissionStatus === 'SUBMITTED' && 'Your HOD will review your submission.'}
            {submissionStatus === 'APPROVED' && 'Your data has been approved and included in the department report.'}
            {submissionStatus === 'REJECTED' && 'Please update your data based on the HOD\'s feedback and resubmit.'}
            {(!submissionStatus || submissionStatus === 'DRAFT') && 'Fill all sections and submit for your HOD to review.'}
          </p>
        </div>
        {isEditable && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <Save size={16} />
              Save Draft
            </button>
            <button
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm focus-ring"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        )}
      </div>

      {/* Section Form Modal — reuse existing modal but in "standalone" mode */}
      {activeSchema && (
        <FacultyFormModal
          schema={activeSchema}
          data={formData}
          isOpen={!!activeSection}
          isEditable={isEditable}
          onSave={(sectionKey, values) => {
            handleSaveSection(sectionKey as FacultySectionKey, values);
            setActiveSection(null);
          }}
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

// ─── Faculty Form Modal (simplified wrapper) ──────────────────────────────

import { TagInput } from '../components/ui/TagInput';

function FacultyFormModal({
  schema,
  data,
  isOpen,
  isEditable,
  onSave,
  onClose,
}: {
  schema: FacultySectionSchema;
  data: Record<string, Record<string, unknown>>;
  isOpen: boolean;
  isEditable: boolean;
  onSave: (sectionKey: string, values: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (isOpen) {
      const sectionData = data[schema.key];
      setFormValues({ ...sectionData });
    }
  }, [isOpen, schema.key, data]);

  const updateField = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg shadow-xl flex flex-col animate-slide-in-right"
        style={{ background: 'var(--bg-modal)', boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-modal-header)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{schema.title}</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isEditable ? schema.description || 'Fill in your personal KPI data' : 'Viewing submitted data (read-only)'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-200 text-surface-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {schema.fields.map((field) => (
            <FacultyFormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={(val) => updateField(field.key, val)}
              disabled={!isEditable}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '14px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-modal-header)', flexShrink: 0 }}>
          {isEditable ? (
            <button
              onClick={() => onSave(schema.key, formValues)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
            >
              <Save size={14} />
              Save & Close
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function FacultyFormField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FacultyFieldSchema;
  value: unknown;
  onChange: (val: unknown) => void;
  disabled: boolean;
}) {
  const fieldId = `fac-field-${field.key}`;

  if (field.type === 'evidence') {
    return (
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {field.label}
        </label>
        <EvidenceInput
          value={(value as EvidenceItem[]) || []}
          onChange={onChange}
          disabled={disabled}
        />
        {field.helpText && <p className="mt-1 text-xs text-surface-500">{field.helpText}</p>}
      </div>
    );
  }

  if (field.type === 'taglist') {
    return (
      <TagInput
        id={fieldId}
        label={field.label}
        value={(value as string[]) || []}
        onChange={onChange}
        placeholder={field.placeholder}
        helpText={field.helpText}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-surface-700 mb-1.5">
          {field.label}
        </label>
        <textarea
          id={fieldId}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          disabled={disabled}
          className="w-full text-sm text-surface-800 bg-white border border-surface-300 rounded-lg px-3 py-2 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-y disabled:bg-surface-50 disabled:text-surface-500"
        />
        {field.helpText && <p className="mt-1 text-xs text-surface-500">{field.helpText}</p>}
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-surface-700 mb-1.5">
          {field.label}
          {field.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
        <input
          id={fieldId}
          type="number"
          min={field.min ?? 0}
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder="0"
          disabled={disabled}
          className="w-full text-sm text-surface-800 bg-white border border-surface-300 rounded-lg px-3 py-2.5 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-surface-50 disabled:text-surface-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {field.helpText && <p className="mt-1 text-xs text-surface-500">{field.helpText}</p>}
      </div>
    );
  }

  // text
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-surface-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <input
        id={fieldId}
        type="text"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className="w-full text-sm text-surface-800 bg-white border border-surface-300 rounded-lg px-3 py-2.5 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-surface-50 disabled:text-surface-500"
      />
      {field.helpText && <p className="mt-1 text-xs text-surface-500">{field.helpText}</p>}
    </div>
  );
}
