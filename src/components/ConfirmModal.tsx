import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onCancel} className="text-neutral-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-neutral-600 mb-6 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 rounded-xl hover:bg-neutral-100 font-medium transition-colors text-sm"
          >
            取消
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }} 
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors shadow-sm text-sm"
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  );
}
