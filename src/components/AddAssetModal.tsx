import { useState, FormEvent } from 'react';
import { AssetType } from '../types';
import { X } from 'lucide-react';

export function AddAssetModal({ type, onClose, onAdd }: { type: AssetType, onClose: () => void, onAdd: (name: string, desc: string) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), desc.trim());
    }
  };

  const typeName = type === 'character' ? '人物' : type === 'scene' ? '场景' : '道具';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-neutral-100">
          <h2 className="text-xl font-bold">添加新{typeName}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">名称 *</label>
            <input 
              autoFocus
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
              placeholder={`输入${typeName}名称`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">描述 (可选)</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full p-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none resize-none"
              rows={3}
              placeholder={`输入${typeName}描述`}
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
