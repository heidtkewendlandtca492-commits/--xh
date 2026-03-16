import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { analyzeScript } from '../lib/gemini';
import { Asset } from '../types';

export function AnalyzeModal({ 
  initialText,
  onClose, 
  onAddAssets,
  onUpdateText
}: { 
  initialText: string,
  onClose: () => void, 
  onAddAssets: (assets: Asset[]) => void,
  onUpdateText: (text: string) => void
}) {
  const [text, setText] = useState(initialText);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const newAssets = await analyzeScript(text);
      onUpdateText(text);
      onAddAssets(newAssets);
      onClose();
    } catch (e: any) {
      alert('分析失败: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl max-w-2xl w-full shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI 分析提取</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col min-h-[300px] relative">
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
              <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
              <p className="text-lg font-medium animate-pulse">AI 正在深度分析文本...</p>
              <p className="text-sm text-neutral-500 mt-2">正在提取角色、场景和道具，请稍候</p>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此粘贴剧本或原始文本..."
            className="flex-1 w-full p-4 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black"
            disabled={isAnalyzing}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose} 
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-xl hover:bg-neutral-100 font-medium transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !text.trim()}
            className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-neutral-800 font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> 分析中</> : '开始分析'}
          </button>
        </div>
      </div>
    </div>
  );
}
