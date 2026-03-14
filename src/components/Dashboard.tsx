import React, { useState, useRef } from 'react';
import { Project, AssetType, Asset } from '../types';
import { AssetCard } from './AssetCard';
import { Plus, Trash2, Upload as UploadIcon, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AddAssetModal } from './AddAssetModal';
import { parseFileOrText } from '../lib/parser';

export function Dashboard({ project, onUpdate, onClear }: { project: Project, onUpdate: (p: Project) => void, onClear: () => void }) {
  const [activeTab, setActiveTab] = useState<AssetType>('character');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      const found = filteredAssets.find(a => a.name.includes(searchQuery.trim()));
      if (found) {
        document.getElementById(`asset-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        alert('未找到匹配的资产');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
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
          <button onClick={onClear} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> 重新开始项目
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {(['character', 'scene', 'prop'] as AssetType[]).map(tab => (
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 relative">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            没有找到相关资产，您可以手动添加或批量上传。
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {filteredAssets.map(asset => (
              <div key={asset.id} id={`asset-${asset.id}`}>
                <AssetCard asset={asset} onUpdate={updateAsset} onDelete={() => deleteAsset(asset.id)} />
              </div>
            ))}
          </div>
        )}

        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-20">
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

          <div className="relative group">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-800 transition-transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
            </button>
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              手动添加
            </span>
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
    </div>
  );
}
