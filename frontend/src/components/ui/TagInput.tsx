import { useState, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: unknown) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  helpText?: string;
}

export function TagInput({ id, value, onChange, placeholder = 'Type and press Enter', label, className, helpText }: TagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        className="flex flex-wrap gap-1.5 p-2 bg-white border border-surface-300 rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2 py-1 rounded-md border border-primary-200"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:bg-primary-200 rounded p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm text-surface-800 placeholder:text-surface-400 bg-transparent"
        />
      </div>
      {helpText && <p className="mt-1 text-xs text-surface-500">{helpText}</p>}
    </div>
  );
}
