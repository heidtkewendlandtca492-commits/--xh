import React, { useState, useRef } from 'react';
import { Project, AssetType, Asset } from '../types';
import { AssetCard } from './AssetCard';
import { Plus, Trash2, Upload as UploadIcon, Search, Settings, Sparkles, Edit2, Check, X, ArrowUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AddAssetModal } from './AddAssetModal';
import { parseFileOrText } from '../lib/parser';
import { SettingsModal } from './SettingsModal';
import { AnalyzeModal } from './AnalyzeModal';

export function Dashboard({ 
  project, 
  onUpdate, 
  onClear
}: { 
  project: Project, 
  onUpdate: (p: Project) => void, 
  onClear: () => void
}) {
  const [activeTab, setActiveTab] = useState<AssetType>('character');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editAnnouncementText, setEditAnnouncementText] = useState(project.announcement || '');
  const batchUploadRef = useRef<HTMLInputElement>(null);

  const filteredAssets = project.assets.filter(a => a.type === activeTab);

  const updateAsset = (updatedAsset: Asset) => {
    const newAssets = project.assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    onUpdate({ ...project, assets: newAssets });
  };

  const deleteAsset = (id: string) => {
    const newAssets = project.assets.filter(a => a.id !== id);
    onUpdate({ ...project, assets: newAssets });
  };

  const addAsset = (name: string, desc: string) => {
    const newAsset: Asset = {
      id: uuidv4(),
      type: activeTab,
      name,
      episodes: '',
      description: desc,
      originalText: '',
      candidates: []
    };
    onUpdate({ ...project, assets: [newAsset, ...project.assets] });
    setIsAddModalOpen(false);
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newAssets = await parseFileOrText(file, activeTab);
      onUpdate({ ...project, assets: [...newAssets, ...project.assets] });
    } catch (err) {
      alert('批量上传解析失败');
    }
    if (batchUploadRef.current) batchUploadRef.current.value = '';
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const found = project.assets.find(a => a.name.includes(searchQuery.trim()));
      if (found) {
        if (activeTab !== found.type) {
          setActiveTab(found.type);
        }
        setTimeout(() => {
          const el = document.getElementById(`asset-${found.id}`);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 160;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 100);
      } else {
        alert('未找到匹配的资产');
      }
    }
  };

  const handleAddAnalyzedAssets = (newAssets: Asset[]) => {
    onUpdate({ ...project, assets: [...newAssets, ...project.assets] });
    alert('分析完成，已提取新资产！');
  };

  const saveAnnouncement = () => {
    onUpdate({ ...project, announcement: editAnnouncementText });
    setIsEditingAnnouncement(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 flex flex-col shadow-sm">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-800 mb-1">项目公告</h3>
              {isEditingAnnouncement ? (
                <textarea
                  value={editAnnouncementText}
                  onChange={(e) => setEditAnnouncementText(e.target.value)}
                  className="w-full p-2 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm bg-white min-h-[60px]"
                  placeholder="输入项目公告..."
                />
              ) : (
                <p className="text-sm text-amber-900 whitespace-pre-wrap">
                  {project.announcement || <span className="text-amber-700/50 italic">暂无公告，点击右侧编辑图标添加</span>}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              {isEditingAnnouncement ? (
                <div className="flex gap-2">
                  <button onClick={saveAnnouncement} className="p-1.5 bg-amber-600 text-white rounded hover:bg-amber-700" title="保存">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsEditingAnnouncement(false); setEditAnnouncementText(project.announcement || ''); }} className="p-1.5 bg-amber-200 text-amber-800 rounded hover:bg-amber-300" title="取消">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditingAnnouncement(true)} className="p-1.5 text-amber-700 hover:bg-amber-200 rounded transition-colors" title="编辑公告">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold">资产管理面板</h1>
              <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder="搜索资产名称 (回车跳转)" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-9 pr-4 py-1.5 text-sm border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSettingsOpen(true)} className="text-sm text-neutral-600 hover:text-black flex items-center gap-1">
              <Settings className="w-4 h-4" /> 设置
            </button>
            <button onClick={onClear} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> 重新开始项目
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {(['character', 'scene', 'prop'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab === 'character' ? '人物 (Characters)' : tab === 'scene' ? '场景 (Scenes)' : '道具 (Props)'}
            </button>
          ))}
        </div>
      </header>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex gap-8 relative items-start">
        {/* Sidebar Navigation */}
        {filteredAssets.length > 0 && (
          <aside className="w-48 shrink-0 sticky top-40 max-h-[calc(100vh-12rem)] overflow-y-auto hidden md:block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
              资产目录 ({filteredAssets.length})
            </h3>
            <div className="flex flex-col gap-1">
              {filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => {
                    const el = document.getElementById(`asset-${asset.id}`);
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 160;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="text-left text-sm px-3 py-2 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black truncate transition-colors font-medium"
                  title={asset.name}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              没有找到相关资产，您可以手动添加或批量上传。
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {filteredAssets.map(asset => (
                <div key={asset.id} id={`asset-${asset.id}`} className="scroll-mt-40">
                  <AssetCard asset={asset} onUpdate={updateAsset} onDelete={() => deleteAsset(asset.id)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-20">
          <div className="relative group">
            <button
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="w-14 h-14 bg-white text-black border border-neutral-200 rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-transform hover:scale-105"
            >
              <Sparkles className="w-6 h-6" />
            </button>
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              AI 分析提取
            </span>
          </div>

          <div className="relative group">
            <input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" className="hidden" ref={batchUploadRef} onChange={handleBatchUpload} />
            <button
              onClick={() => batchUploadRef.current?.click()}
              className="w-14 h-14 bg-white text-black border border-neutral-200 rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-transform hover:scale-105"
            >
              <UploadIcon className="w-6 h-6" />
            </button>
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              批量上传
            </span>
          </div>

          <div className="flex gap-4">
            <div className="relative group">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-14 h-14 bg-white text-black border border-neutral-200 rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-transform hover:scale-105"
              >
                <ArrowUp className="w-6 h-6" />
              </button>
              <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                返回顶部
              </span>
            </div>

            <div className="relative group">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-800 transition-transform hover:scale-105"
              >
                <Plus className="w-6 h-6" />
              </button>
              <span className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                手动添加
              </span>
            </div>
          </div>
        </div>
      </main>

      {isAddModalOpen && (
        <AddAssetModal 
          type={activeTab} 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={addAsset} 
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          project={project}
          onUpdate={onUpdate}
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {isAnalyzeModalOpen && (
        <AnalyzeModal 
          initialText={project.scriptText}
          onClose={() => setIsAnalyzeModalOpen(false)} 
          onAddAssets={handleAddAnalyzedAssets} 
          onUpdateText={(text) => onUpdate({ ...project, scriptText: text })}
        />
      )}
    </div>
  );
}
