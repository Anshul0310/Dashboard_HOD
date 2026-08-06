import { useState, useRef, useCallback } from 'react';
import { FileUp, Link2, X, Plus, ExternalLink, Loader2, Image, FileText, File as FileIcon } from 'lucide-react';
import { uploadFile } from '../../lib/api';

export interface EvidenceItem {
  type: 'link' | 'file';
  url: string;
  description: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

interface EvidenceInputProps {
  value: EvidenceItem[];
  onChange: (value: EvidenceItem[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

// Allowed file types
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 10;

function getFileIcon(mimeType?: string) {
  if (!mimeType) return <FileIcon size={16} />;
  if (mimeType.startsWith('image/')) return <Image size={16} />;
  if (mimeType === 'application/pdf') return <FileText size={16} />;
  return <FileIcon size={16} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

interface PendingFile {
  file: File;
  preview?: string; // Object URL for images
  error?: string;
}

export function EvidenceInput({ value = [], onChange, disabled = false, maxFiles = DEFAULT_MAX_FILES }: EvidenceInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<'link' | 'file'>('link');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileCount = (value || []).filter(v => v.type === 'file').length;
  const remainingSlots = maxFiles - fileCount;

  const handleAddLink = () => {
    if (!linkUrl.trim() || !description.trim()) return;
    onChange([...(value || []), { type: 'link', url: linkUrl.trim(), description: description.trim() }]);
    resetForm();
  };

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return `"${file.name}" — Invalid file type. Allowed: Images, PDF, DOC, DOCX.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" — File too large (${formatFileSize(file.size)}). Max: 10MB.`;
    }
    return null;
  }, []);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check total count limit
    if (selectedFiles.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more file(s). Maximum is ${maxFiles} files total.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newPending: PendingFile[] = selectedFiles.map(file => {
      const error = validateFile(file);
      const preview = !error && isImageMime(file.type) ? URL.createObjectURL(file) : undefined;
      return { file, preview, error: error || undefined };
    });

    setPendingFiles(prev => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePending = (index: number) => {
    setPendingFiles(prev => {
      const item = prev[index];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadAll = async () => {
    const validFiles = pendingFiles.filter(pf => !pf.error);
    if (validFiles.length === 0) return;

    const desc = description.trim() || 'Uploaded file';
    setIsUploading(true);
    setUploadProgress({ completed: 0, total: validFiles.length });

    const newItems: EvidenceItem[] = [];
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const pf = validFiles[i];
        const res = await uploadFile(pf.file);
        newItems.push({
          type: 'file',
          url: res.url,
          description: validFiles.length === 1 ? desc : `${desc} (${i + 1}/${validFiles.length})`,
          originalName: res.originalName || pf.file.name,
          mimeType: res.mimeType || pf.file.type,
          size: res.size || pf.file.size,
        });
        setUploadProgress({ completed: i + 1, total: validFiles.length });
      }

      // Clean up previews
      pendingFiles.forEach(pf => { if (pf.preview) URL.revokeObjectURL(pf.preview); });

      onChange([...(value || []), ...newItems]);
      setPendingFiles([]);
      resetForm();
    } catch (err) {
      // Add any successfully uploaded items so far
      if (newItems.length > 0) {
        onChange([...(value || []), ...newItems]);
      }
      alert(`Upload failed after ${newItems.length} of ${validFiles.length} file(s). Please try again for remaining files.`);
    }
    setIsUploading(false);
  };

  const removeEvidence = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setIsAdding(false);
    setDescription('');
    setLinkUrl('');
    setPendingFiles([]);
    setUploadProgress({ completed: 0, total: 0 });
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
                  {item.type === 'file' ? getFileIcon(item.mimeType) : <Link2 size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{item.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 truncate"
                    >
                      {item.type === 'file' ? (item.originalName || 'View Document') : item.url}
                      <ExternalLink size={10} />
                    </a>
                    {item.size && (
                      <span className="text-[10px] text-surface-400 shrink-0">
                        {formatFileSize(item.size)}
                      </span>
                    )}
                  </div>
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
          Add Evidence (Link or Files)
        </button>
      )}

      {/* Add new evidence form */}
      {!disabled && isAdding && (
        <div className="p-3 bg-white border border-surface-200 rounded-xl space-y-3 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAddType('link'); setPendingFiles([]); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${addType === 'link' ? 'bg-surface-800 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              Add Link
            </button>
            <button
              type="button"
              onClick={() => setAddType('file')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${addType === 'file' ? 'bg-surface-800 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              Upload Files
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
            <div className="space-y-3">
              {/* File type/size info */}
              <div className="text-[11px] text-surface-500 bg-surface-50 rounded-md px-2.5 py-1.5 border border-surface-100">
                Allowed: Images (JPG, PNG, GIF), PDF, DOC, DOCX · Max 10MB each · {remainingSlots} file(s) remaining
              </div>

              {/* File input */}
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Select Files {pendingFiles.length > 0 && `(${pendingFiles.length} selected)`}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                  onChange={handleFilesSelected}
                  disabled={isUploading || remainingSlots <= 0}
                  className="w-full text-sm text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-surface-100 file:text-surface-700 hover:file:bg-surface-200 disabled:opacity-50 cursor-pointer"
                />
              </div>

              {/* Pending files list with previews */}
              {pendingFiles.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {pendingFiles.map((pf, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border ${
                        pf.error
                          ? 'bg-red-50 border-red-200'
                          : 'bg-surface-50 border-surface-200'
                      }`}
                    >
                      {/* Preview / Icon */}
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-surface-200 flex items-center justify-center shrink-0">
                        {pf.preview ? (
                          <img src={pf.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className={pf.error ? 'text-red-400' : 'text-surface-400'}>
                            {getFileIcon(pf.file.type)}
                          </div>
                        )}
                      </div>

                      {/* File info */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium truncate ${pf.error ? 'text-red-700' : 'text-surface-700'}`}>
                          {pf.file.name}
                        </p>
                        {pf.error ? (
                          <p className="text-[10px] text-red-500 mt-0.5">{pf.error}</p>
                        ) : (
                          <p className="text-[10px] text-surface-400 mt-0.5">{formatFileSize(pf.file.size)}</p>
                        )}
                      </div>

                      {/* Remove button */}
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="p-1 text-surface-400 hover:text-red-500 rounded transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload progress */}
              {isUploading && (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 size={14} className="animate-spin text-primary-600" />
                  <span className="text-xs font-medium text-primary-600">
                    Uploading {uploadProgress.completed}/{uploadProgress.total}...
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={isUploading || pendingFiles.filter(pf => !pf.error).length === 0 || !description.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp size={12} />
                      Upload {pendingFiles.filter(pf => !pf.error).length} File(s)
                    </>
                  )}
                </button>
              </div>

              {!description.trim() && pendingFiles.length > 0 && (
                <p className="text-[11px] text-danger-600">Please enter a description before uploading.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
