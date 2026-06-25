import { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { TagInput } from './TagInput';
import type { SectionSchema, FieldSchema } from '../../lib/sectionSchema';
import type { SectionKey } from '../../lib/types';
import { useKpiStore, useAuthStore, useDeptStore } from '../../lib/store';

interface SectionFormModalProps {
  schema: SectionSchema;
  periodId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SectionFormModal({ schema, periodId, isOpen, onClose }: SectionFormModalProps) {
  const submission = useKpiStore((s) => s.getSubmission(periodId));
  const saveSection = useKpiStore((s) => s.saveSection);
  const saveSectionToApi = useKpiStore((s) => s.saveSectionToApi);
  const isSyncing = useKpiStore((s) => s.isSyncing);
  const isApiAvailable = useAuthStore((s) => s.isApiAvailable);
  const user = useAuthStore((s) => s.user);
  const selectedDeptId = useDeptStore((s) => s.selectedDeptId);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  // The department to use: from user profile (API mode) or dept store (demo mode)
  const department = user?.department || selectedDeptId;

  // Initialize form data from store
  useEffect(() => {
    if (isOpen) {
      const sectionData = submission.data[schema.key as keyof typeof submission.data];
      setFormData({ ...sectionData } as Record<string, unknown>);
      setSaved(false);
    }
  }, [isOpen, schema.key, periodId]);

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (isApiAvailable && user) {
      await saveSectionToApi(periodId, schema.key as SectionKey, formData, department);
    } else {
      saveSection(periodId, schema.key as SectionKey, formData);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAndClose = async () => {
    if (isApiAvailable && user) {
      await saveSectionToApi(periodId, schema.key as SectionKey, formData, department);
    } else {
      saveSection(periodId, schema.key as SectionKey, formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg shadow-xl flex flex-col animate-slide-in-right"
        style={{ background: 'var(--bg-modal)', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-modal-header)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{schema.title}</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Fill in the KPI data for this section
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-200 text-surface-500 transition-colors focus-ring"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {schema.fields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={(val) => updateField(field.key, val)}
            />
          ))}
        </div>

        {/* Footer — always visible, never clipped */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-modal-header)', flexShrink: 0, minHeight: '64px' }}>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary-600 animate-fade-in">
                <Loader2 size={14} className="animate-spin" />
                Syncing...
              </span>
            )}
            {saved && !isSyncing && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-success-600 animate-fade-in">
                <CheckCircle2 size={14} />
                {isApiAvailable ? 'Saved to server' : 'Saved locally'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors focus-ring"
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus-ring shadow-sm"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Individual Field Renderer ───────────────────────────────────────────

function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldSchema;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const fieldId = `field-${field.key}`;

  if (field.type === 'taglist') {
    return (
      <TagInput
        id={fieldId}
        label={field.label}
        value={(value as string[]) || []}
        onChange={onChange}
        placeholder={field.placeholder}
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
          className="w-full text-sm text-surface-800 bg-white border border-surface-300 rounded-lg px-3 py-2 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-y"
        />
        {field.helpText && (
          <p className="text-[11px] text-surface-400 mt-1">{field.helpText}</p>
        )}
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
          className="w-full text-sm text-surface-800 bg-white border border-surface-300 rounded-lg px-3 py-2.5 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
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
        className="w-full text-sm text-surface-800 bg-white border border-surface-300 rounded-lg px-3 py-2.5 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
      />
      {field.helpText && (
        <p className="text-[11px] text-surface-400 mt-1">{field.helpText}</p>
      )}
    </div>
  );
}
