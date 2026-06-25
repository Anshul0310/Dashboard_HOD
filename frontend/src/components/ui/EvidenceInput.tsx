import { useState, useRef } from 'react';
import { FileUp, Link2, X, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { uploadFile } from '../../lib/api';

export interface EvidenceItem {
  type: 'link' | 'file';
  url: string;
  description: string;
}

interface EvidenceInputProps {
  value: EvidenceItem[];
  onChange: (value: EvidenceItem[]) => void;
  disabled?: boolean;
}

export function EvidenceInput({ value = [], onChange, disabled = false }: EvidenceInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<'link' | 'file'>('link');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddLink = () => {
    if (!linkUrl.trim() || !description.trim()) return;
    onChange([...(value || []), { type: 'link', url: linkUrl.trim(), description: description.trim() }]);
    resetForm();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !description.trim()) return;

    setIsUploading(true);
    try {
      const res = await uploadFile(file);
      onChange([...(value || []), { type: 'file', url: res.url, description: description.trim() }]);
      resetForm();
    } catch (err) {
      alert('Failed to upload file. Please try again.');
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeEvidence = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setIsAdding(false);
    setDescription('');
    setLinkUrl('');
  };

  return (
    <div className="space-y-3">
      {/* List existing evidence */}
      {value && value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-surface-50 border border-surface-200 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-surface-200 shrink-0 text-primary-600">
                  {item.type === 'file' ? <FileUp size={16} /> : <Link2 size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{item.description}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 mt-0.5 truncate"
                  >
                    {item.type === 'file' ? 'View Document' : item.url}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeEvidence(i)}
                  className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new evidence button */}
      {!disabled && !isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Plus size={16} />
          Add Evidence (Link or File)
        </button>
      )}

      {/* Add new evidence form */}
      {!disabled && isAdding && (
        <div className="p-3 bg-white border border-surface-200 rounded-xl space-y-3 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddType('link')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${addType === 'link' ? 'bg-surface-800 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              Add Link
            </button>
            <button
              type="button"
              onClick={() => setAddType('file')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${addType === 'file' ? 'bg-surface-800 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              Upload File
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. MoU Document, Publication Link..."
              className="w-full text-sm bg-surface-50 border border-surface-200 rounded-md px-2.5 py-1.5 outline-none focus:border-primary-500"
            />
          </div>

          {addType === 'link' ? (
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-sm bg-surface-50 border border-surface-200 rounded-md px-2.5 py-1.5 outline-none focus:border-primary-500"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={resetForm} className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md">Cancel</button>
                <button type="button" onClick={handleAddLink} disabled={!description.trim() || !linkUrl.trim()} className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-md disabled:opacity-50">Add Link</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Upload File</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading || !description.trim()}
                className="w-full text-sm text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-surface-100 file:text-surface-700 hover:file:bg-surface-200 disabled:opacity-50 cursor-pointer"
              />
              {!description.trim() && <p className="text-[11px] text-danger-600 mt-1">Please enter a description first</p>}
              
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={resetForm} disabled={isUploading} className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md disabled:opacity-50">Cancel</button>
                {isUploading && <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600"><Loader2 size={14} className="animate-spin" /> Uploading...</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
