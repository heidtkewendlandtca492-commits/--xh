import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Edit2 } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
}

export function EditableField({ label, value, onSave, multiline = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onSave(tempValue);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{label}</span>
        <div className="flex gap-2">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-neutral-400 hover:text-black p-1 rounded"
              title="编辑"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="text-neutral-400 hover:text-black p-1 rounded"
            title="一键复制"
          >
            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      
      {isEditing ? (
        multiline ? (
          <textarea
            ref={inputRef as any}
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onBlur={handleSave}
            className="w-full text-sm p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none resize-y min-h-[100px]"
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full text-sm p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        )
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className={`text-sm text-neutral-800 cursor-pointer hover:bg-neutral-50 p-2 -mx-2 rounded-lg whitespace-pre-wrap ${!value && 'text-neutral-400 italic'}`}
        >
          {value || `点击添加${label}...`}
        </div>
      )}
    </div>
  );
}
