import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project } from '../types';

export function SettingsModal({ 
  project, 
  onUpdate, 
  onClose 
}: { 
  project: Project, 
  onUpdate: (p: Project) => void, 
  onClose: () => void 
}) {
  const [apiKey, setApiKey] = useState('');
  const [clearPassword, setClearPassword] = useState(project.clearPassword || 'xwz666');

  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY') || '';
    setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    onUpdate({ ...project, clearPassword: clearPassword.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">设置</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入您的 Gemini API Key"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-neutral-500 mt-2">
            您的 API Key 仅保存在本地浏览器中，用于文本分析功能。
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            重新开始项目密码
          </label>
          <input
            type="text"
            value={clearPassword}
            onChange={(e) => setClearPassword(e.target.value)}
            placeholder="设置重新开始项目的密码"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-neutral-500 mt-2">
            用于保护“重新开始项目”操作，防止误删数据。默认密码：xwz666。
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl hover:bg-neutral-100 font-medium transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave} 
            className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-neutral-800 font-medium transition-colors shadow-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
