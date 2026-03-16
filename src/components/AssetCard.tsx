import { useState, useRef, useEffect, FC } from 'react';
import { Asset, Candidate, CommunicationMessage, StateFinalizedAsset } from '../types';
import { Upload, Download, Trash2, X, Image as ImageIcon, Music, Loader2, Send, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Dropzone } from './Dropzone';
import { EditableField } from './EditableField';
import { uploadFile } from '../lib/storage';
import { ConfirmModal } from './ConfirmModal';
import { ImageLoader } from './ImageLoader';
import { ImagePreviewModal } from './ImagePreviewModal';

type UploadTask = { id: string; file: File; progress: number; previewUrl: string };

interface AssetCardProps {
  asset: Asset;
  onUpdate: (a: Asset) => void;
  onDelete: () => void;
}

export const AssetCard: FC<AssetCardProps> = ({ asset, onUpdate, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const actorInputRef = useRef<HTMLInputElement>(null);
  const stateFinalizedInputRef = useRef<HTMLInputElement>(null);
  
  const latestAsset = useRef(asset);
  useEffect(() => { latestAsset.current = asset; }, [asset]);

  const [activeUploads, setActiveUploads] = useState<Record<string, UploadTask[]>>({
    reference: [],
    stateFinalized: [],
    actorCandidates: [],
    candidates: [],
    audio: []
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{title: string, message: string, action: () => void} | null>(null);
  const [commInput, setCommInput] = useState('');
  const [previewImage, setPreviewImage] = useState<{url: string, originalUrl?: string, name: string} | null>(null);

  const finalizedCandidate = asset.candidates.find(c => c.id === asset.finalizedId);

  const renderUploadTasks = (tasks: UploadTask[]) => {
    return tasks.map(task => (
      <div key={task.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square bg-neutral-100">
        <img src={task.previewUrl} className="object-cover w-full h-full opacity-40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-black mb-3 drop-shadow-md" />
          <div className="w-full bg-white/80 rounded-full h-1.5 overflow-hidden shadow-sm">
            <div className="bg-black h-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="text-[10px] font-medium mt-1 bg-white/90 px-1.5 rounded shadow-sm">{task.progress}%</span>
        </div>
      </div>
    ));
  };

  const COMM_COLORS = [
    'text-blue-600',
    'text-emerald-600',
    'text-violet-600',
    'text-amber-600',
    'text-rose-600',
    'text-cyan-600'
  ];

  const handleAddCommunication = () => {
    if (!commInput.trim()) return;
    const currentComms = asset.communications || [];
    const lastColor = currentComms.length > 0 ? currentComms[currentComms.length - 1].colorClass : '';
    
    let nextColorIndex = currentComms.length % COMM_COLORS.length;
    if (COMM_COLORS[nextColorIndex] === lastColor) {
       nextColorIndex = (nextColorIndex + 1) % COMM_COLORS.length;
    }

    const newMsg: CommunicationMessage = {
      id: uuidv4(),
      text: commInput.trim(),
      colorClass: COMM_COLORS[nextColorIndex],
      isStrikethrough: false
    };

    onUpdate({
      ...asset,
      communications: [...currentComms, newMsg]
    });
    setCommInput('');
  };

  const toggleStrikethrough = (msgId: string) => {
    const currentComms = asset.communications || [];
    const newComms = currentComms.map(msg => 
      msg.id === msgId ? { ...msg, isStrikethrough: !msg.isStrikethrough } : msg
    );
    onUpdate({ ...asset, communications: newComms });
  };

  const confirmDelete = (title: string, message: string, action: () => void) => {
    setConfirmDialog({ title, message, action });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const tasks = fileArray.map(f => ({ id: uuidv4(), file: f, progress: 0, previewUrl: URL.createObjectURL(f) }));
    setActiveUploads(prev => ({ ...prev, candidates: [...prev.candidates, ...tasks] }));

    try {
      const uploadPromises = tasks.map(async (task) => {
        const { url, originalUrl } = await uploadFile(task.file, `assets/${asset.id}/candidates`, (p) => {
          setActiveUploads(prev => ({
            ...prev,
            candidates: prev.candidates.map(t => t.id === task.id ? { ...t, progress: p } : t)
          }));
        });
        return { id: uuidv4(), url, originalUrl, name: task.file.name };
      });
      const newCandidates = await Promise.all(uploadPromises);
      onUpdate({
        ...latestAsset.current,
        candidates: [...latestAsset.current.candidates, ...newCandidates]
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setActiveUploads(prev => ({ ...prev, candidates: prev.candidates.filter(t => !tasks.find(x => x.id === t.id)) }));
      tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRefUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const tasks = fileArray.map(f => ({ id: uuidv4(), file: f, progress: 0, previewUrl: URL.createObjectURL(f) }));
    setActiveUploads(prev => ({ ...prev, reference: [...prev.reference, ...tasks] }));

    try {
      const uploadPromises = tasks.map(async (task) => {
        const { url, originalUrl } = await uploadFile(task.file, `assets/${asset.id}/reference`, (p) => {
          setActiveUploads(prev => ({
            ...prev,
            reference: prev.reference.map(t => t.id === task.id ? { ...t, progress: p } : t)
          }));
        });
        return { id: uuidv4(), url, originalUrl, name: task.file.name };
      });
      const newImages = await Promise.all(uploadPromises);
      const currentRefImages = latestAsset.current.referenceImages || (latestAsset.current.referenceImage ? [latestAsset.current.referenceImage] : []);
      onUpdate({
        ...latestAsset.current,
        referenceImages: [...currentRefImages, ...newImages],
        referenceImage: undefined
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setActiveUploads(prev => ({ ...prev, reference: prev.reference.filter(t => !tasks.find(x => x.id === t.id)) }));
      tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
      if (refInputRef.current) refInputRef.current.value = '';
    }
  };

  const handleAudioUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const task = { id: uuidv4(), file, progress: 0, previewUrl: '' };
    setActiveUploads(prev => ({ ...prev, audio: [task] }));

    try {
      const { url, originalUrl } = await uploadFile(file, `assets/${asset.id}/audio`, (p) => {
        setActiveUploads(prev => ({
          ...prev,
          audio: [{ ...task, progress: p }]
        }));
      });
      onUpdate({
        ...latestAsset.current,
        audioReference: { id: uuidv4(), url, originalUrl, name: file.name }
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setActiveUploads(prev => ({ ...prev, audio: [] }));
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleActorUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const tasks = fileArray.map(f => ({ id: uuidv4(), file: f, progress: 0, previewUrl: URL.createObjectURL(f) }));
    setActiveUploads(prev => ({ ...prev, actorCandidates: [...prev.actorCandidates, ...tasks] }));

    try {
      const uploadPromises = tasks.map(async (task) => {
        const { url, originalUrl } = await uploadFile(task.file, `assets/${asset.id}/actorCandidates`, (p) => {
          setActiveUploads(prev => ({
            ...prev,
            actorCandidates: prev.actorCandidates.map(t => t.id === task.id ? { ...t, progress: p } : t)
          }));
        });
        return { id: uuidv4(), url, originalUrl, name: task.file.name };
      });
      const newCandidates = await Promise.all(uploadPromises);
      onUpdate({
        ...latestAsset.current,
        actorCandidates: [...(latestAsset.current.actorCandidates || []), ...newCandidates]
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setActiveUploads(prev => ({ ...prev, actorCandidates: prev.actorCandidates.filter(t => !tasks.find(x => x.id === t.id)) }));
      tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
      if (actorInputRef.current) actorInputRef.current.value = '';
    }
  };

  const handleStateFinalizedUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const tasks = fileArray.map(f => ({ id: uuidv4(), file: f, progress: 0, previewUrl: URL.createObjectURL(f) }));
    setActiveUploads(prev => ({ ...prev, stateFinalized: [...prev.stateFinalized, ...tasks] }));

    try {
      const uploadPromises = tasks.map(async (task) => {
        const { url, originalUrl } = await uploadFile(task.file, `assets/${asset.id}/stateFinalized`, (p) => {
          setActiveUploads(prev => ({
            ...prev,
            stateFinalized: prev.stateFinalized.map(t => t.id === task.id ? { ...t, progress: p } : t)
          }));
        });
        return { id: uuidv4(), url, originalUrl, name: task.file.name, stateLabel: '未命名状态' };
      });
      const newAssets = await Promise.all(uploadPromises);
      onUpdate({
        ...latestAsset.current,
        stateFinalizedAssets: [...(latestAsset.current.stateFinalizedAssets || []), ...newAssets]
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setActiveUploads(prev => ({ ...prev, stateFinalized: prev.stateFinalized.filter(t => !tasks.find(x => x.id === t.id)) }));
      tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
      if (stateFinalizedInputRef.current) stateFinalizedInputRef.current.value = '';
    }
  };

  const updateStateFinalizedLabel = (id: string, newLabel: string) => {
    const newAssets = (asset.stateFinalizedAssets || []).map(a => 
      a.id === id ? { ...a, stateLabel: newLabel } : a
    );
    onUpdate({ ...asset, stateFinalizedAssets: newAssets });
  };

  const deleteStateFinalized = (id: string) => {
    const newAssets = (asset.stateFinalizedAssets || []).filter(a => a.id !== id);
    onUpdate({ ...asset, stateFinalizedAssets: newAssets });
  };

  const setFinalized = (id: string) => {
    onUpdate({ ...asset, finalizedId: id });
  };

  const removeFinalized = () => {
    onUpdate({ ...asset, finalizedId: undefined });
  };

  const deleteCandidate = (id: string) => {
    const newCandidates = asset.candidates.filter(c => c.id !== id);
    const newFinalizedId = asset.finalizedId === id ? undefined : asset.finalizedId;
    onUpdate({ ...asset, candidates: newCandidates, finalizedId: newFinalizedId });
  };

  const deleteActorCandidate = (id: string) => {
    const newCandidates = (asset.actorCandidates || []).filter(c => c.id !== id);
    onUpdate({ ...asset, actorCandidates: newCandidates });
  };

  const deleteReference = (id: string) => {
    const currentRefImages = asset.referenceImages || (asset.referenceImage ? [asset.referenceImage] : []);
    const newRefImages = currentRefImages.filter(img => img.id !== id);
    onUpdate({ 
      ...asset, 
      referenceImages: newRefImages,
      referenceImage: undefined // Clear legacy field
    });
  };

  const deleteAudio = () => {
    onUpdate({ ...asset, audioReference: undefined });
  };

  const downloadFileFromUrl = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed:', e);
      // Fallback
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col mb-6 relative">
      <div className="flex flex-col lg:flex-row w-full">
        {/* Left: Text Info */}
        <div className="w-full lg:w-[300px] xl:w-[350px] shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <EditableField label="资产名称" value={asset.name} onSave={(v) => onUpdate({...asset, name: v})} />
          </div>
          <button onClick={() => confirmDelete('删除资产', `确定要删除资产 "${asset.name}" 吗？所有相关素材将一并删除，此操作不可恢复。`, onDelete)} className="text-neutral-400 hover:text-red-500 ml-4 p-2 bg-neutral-50 rounded-full hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <EditableField label="出现集数" value={asset.episodes} onSave={(v) => onUpdate({...asset, episodes: v})} />
        <EditableField label="资产描述" value={asset.description} onSave={(v) => onUpdate({...asset, description: v})} multiline />
        <EditableField label="原文描述" value={asset.originalText} onSave={(v) => onUpdate({...asset, originalText: v})} multiline />
      </div>

      {/* Right: Images and Audio */}
      <div className="flex-1 p-6 flex flex-col gap-6 bg-neutral-50/50">
        
        {/* Audio Reference (Characters & Props only) */}
        {(asset.type === 'character' || asset.type === 'prop') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">声音参考 (Audio)</h4>
              <button 
                onClick={() => audioInputRef.current?.click()}
                className="text-xs flex items-center gap-1 text-black font-medium hover:underline"
              >
                <Upload className="w-3 h-3" /> {asset.audioReference ? '替换' : '上传'}
              </button>
              <input 
                type="file" 
                accept="audio/mp3,audio/*" 
                className="hidden" 
                ref={audioInputRef}
                onChange={(e) => handleAudioUpload(e.target.files)}
              />
            </div>
            <Dropzone onDropFiles={handleAudioUpload} className="rounded-xl border border-neutral-200 bg-white p-4 relative group">
              {activeUploads.audio.length > 0 ? (
                <div className="flex items-center gap-4 opacity-60">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activeUploads.audio[0].file.name}</p>
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div className="bg-black h-full transition-all duration-300" style={{ width: `${activeUploads.audio[0].progress}%` }} />
                    </div>
                  </div>
                </div>
              ) : asset.audioReference ? (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.audioReference.name}</p>
                    <audio controls src={asset.audioReference.url} className="w-full h-8 mt-2" />
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => downloadFileFromUrl(asset.audioReference!.url, asset.audioReference!.name)}
                      className="text-neutral-500 hover:text-black p-1"
                      title="下载音频"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => confirmDelete('删除音频', '确定要删除这个音频文件吗？', deleteAudio)}
                      className="text-neutral-500 hover:text-red-600 p-1"
                      title="删除音频"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400 text-sm py-4 cursor-pointer hover:text-neutral-600 transition-colors" onClick={() => audioInputRef.current?.click()}>
                  <Music className="w-6 h-6 mb-2 opacity-50" />
                  <span>点击或拖拽上传 MP3 音频</span>
                </div>
              )}
            </Dropzone>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {/* Reference Image */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">参考图区 (Reference)</h4>
              <button 
                onClick={() => refInputRef.current?.click()}
                className="text-xs flex items-center gap-1 text-black font-medium hover:underline"
              >
                <Upload className="w-3 h-3" /> 上传
              </button>
              <input 
                type="file" 
                multiple
                accept="image/*" 
                className="hidden" 
                ref={refInputRef}
                onChange={(e) => handleRefUpload(e.target.files)}
              />
            </div>
            
            <Dropzone onDropFiles={handleRefUpload} className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 p-3 bg-white border border-neutral-200 rounded-xl min-h-[100px]">
              {renderUploadTasks(activeUploads.reference)}
              {(() => {
                const refImages = asset.referenceImages || (asset.referenceImage ? [asset.referenceImage] : []);
                return refImages.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square">
                    <ImageLoader src={img.url} alt={img.name} />
                    <div 
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1 z-20 cursor-pointer"
                      onClick={() => setPreviewImage({url: img.url, originalUrl: img.originalUrl, name: img.name})}
                    >
                      <div className="flex gap-1 w-full mt-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadFileFromUrl(img.originalUrl || img.url, img.name); }}
                          className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                          title="无损下载"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDelete('删除参考图', '确定要删除这张参考图吗？', () => deleteReference(img.id)); }}
                          className="bg-white text-red-600 p-1 rounded flex-1 flex justify-center hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
              {(!asset.referenceImages || asset.referenceImages.length === 0) && !asset.referenceImage && (
                <div className="col-span-full text-center py-6 text-xs text-neutral-400 border-2 border-dashed border-transparent hover:border-neutral-200 rounded-lg cursor-pointer" onClick={() => refInputRef.current?.click()}>
                  点击或拖拽上传参考图
                </div>
              )}
            </Dropzone>
          </div>

          {/* Finalized Area */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">主定稿区 (Main Finalized)</h4>
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-white aspect-video relative group">
              {finalizedCandidate ? (
                <>
                  <ImageLoader src={finalizedCandidate.url} alt={finalizedCandidate.name} />
                  <div 
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20 cursor-pointer"
                    onClick={() => setPreviewImage({url: finalizedCandidate.url, originalUrl: finalizedCandidate.originalUrl, name: finalizedCandidate.name})}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadFileFromUrl(finalizedCandidate.originalUrl || finalizedCandidate.url, finalizedCandidate.name); }}
                      className="bg-white text-black p-2 rounded-full hover:scale-105 transition-transform"
                      title="无损下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFinalized(); }}
                      className="bg-white text-red-600 p-2 rounded-full hover:scale-105 transition-transform"
                      title="取消定稿"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm border-2 border-dashed border-transparent">
                  暂无定稿
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* State Finalized Area (Characters only) */}
          {asset.type === 'character' && (
            <div className="col-span-full">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">角色状态定稿区 (State Finalized)</h4>
                <button 
                  onClick={() => stateFinalizedInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-black font-medium hover:underline"
                >
                  <Upload className="w-3 h-3" /> 上传状态定稿
                </button>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={stateFinalizedInputRef}
                  onChange={(e) => handleStateFinalizedUpload(e.target.files)}
                />
              </div>
              
              <Dropzone onDropFiles={handleStateFinalizedUpload} className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-4 bg-white border border-neutral-200 rounded-xl min-h-[150px] mb-6">
                {renderUploadTasks(activeUploads.stateFinalized)}
                {(asset.stateFinalizedAssets || []).map(stateAsset => (
                  <div key={stateAsset.id} className="flex flex-col gap-2">
                    <div className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square">
                      <ImageLoader src={stateAsset.url} alt={stateAsset.name} />
                      <div 
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1 z-20 cursor-pointer"
                        onClick={() => setPreviewImage({url: stateAsset.url, originalUrl: stateAsset.originalUrl, name: stateAsset.name})}
                      >
                        <div className="flex gap-1 w-full mt-auto">
                          <button 
                            onClick={(e) => { e.stopPropagation(); downloadFileFromUrl(stateAsset.originalUrl || stateAsset.url, stateAsset.name); }}
                            className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                            title="下载"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete('删除状态定稿', '确定要删除这个状态定稿吗？', () => deleteStateFinalized(stateAsset.id)); }}
                            className="bg-white text-red-600 p-1 rounded flex-1 flex justify-center hover:bg-red-50"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={stateAsset.stateLabel}
                      onChange={(e) => updateStateFinalizedLabel(stateAsset.id, e.target.value)}
                      placeholder="状态名称 (如: 战斗状态)"
                      maxLength={10}
                      className="w-full text-xs text-center border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </div>
                ))}
                {(!asset.stateFinalizedAssets || asset.stateFinalizedAssets.length === 0) && (
                  <div className="col-span-full text-center py-8 text-xs text-neutral-400 border-2 border-dashed border-transparent hover:border-neutral-200 rounded-lg cursor-pointer flex flex-col items-center justify-center gap-2" onClick={() => stateFinalizedInputRef.current?.click()}>
                    <ImageIcon className="w-6 h-6 opacity-30" />
                    <span>点击或拖拽上传角色不同状态的定稿图</span>
                  </div>
                )}
              </Dropzone>
            </div>
          )}

          {/* Actor Candidates Area (Characters only) */}
          {asset.type === 'character' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">素材备选区 (Material Candidates)</h4>
                <button 
                  onClick={() => actorInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-black font-medium hover:underline"
                >
                  <Upload className="w-3 h-3" /> 上传素材
                </button>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={actorInputRef}
                  onChange={(e) => handleActorUpload(e.target.files)}
                />
              </div>
              
              <Dropzone onDropFiles={handleActorUpload} className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-4 bg-white border border-neutral-200 rounded-xl min-h-[100px]">
                {renderUploadTasks(activeUploads.actorCandidates)}
                {(asset.actorCandidates || []).map(candidate => (
                  <div key={candidate.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square">
                    <ImageLoader src={candidate.url} alt={candidate.name} />
                    <div 
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1 z-20 cursor-pointer"
                      onClick={() => setPreviewImage({url: candidate.url, originalUrl: candidate.originalUrl, name: candidate.name})}
                    >
                      <div className="flex gap-1 w-full mt-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadFileFromUrl(candidate.originalUrl || candidate.url, candidate.name); }}
                          className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                          title="下载"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDelete('删除素材', '确定要删除这个素材吗？', () => deleteActorCandidate(candidate.id)); }}
                          className="bg-white text-red-600 p-1 rounded flex-1 flex justify-center hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!asset.actorCandidates || asset.actorCandidates.length === 0) && (
                  <div className="col-span-full text-center py-6 text-xs text-neutral-400 border-2 border-dashed border-transparent hover:border-neutral-200 rounded-lg cursor-pointer" onClick={() => actorInputRef.current?.click()}>
                    点击或拖拽上传素材
                  </div>
                )}
              </Dropzone>
            </div>
          )}

          {/* Candidates Area */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {asset.type === 'character' ? '定妆备选区 (Makeup Candidates)' : '素材备选区 (Material Candidates)'}
              </h4>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center gap-1 text-black font-medium hover:underline"
              >
                <Upload className="w-3 h-3" /> 上传素材
              </button>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
            
            <Dropzone onDropFiles={handleFileUpload} className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-4 bg-white border border-neutral-200 rounded-xl min-h-[100px]">
              {renderUploadTasks(activeUploads.candidates)}
              {asset.candidates.map(candidate => (
                <div key={candidate.id} className={`relative group rounded-lg overflow-hidden border aspect-square ${asset.finalizedId === candidate.id ? 'border-black ring-2 ring-black ring-offset-1' : 'border-neutral-200'}`}>
                  <ImageLoader src={candidate.url} alt={candidate.name} />
                  <div 
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1 z-20 cursor-pointer"
                    onClick={() => setPreviewImage({url: candidate.url, originalUrl: candidate.originalUrl, name: candidate.name})}
                  >
                    {asset.finalizedId !== candidate.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFinalized(candidate.id); }}
                        className="bg-white text-black text-[10px] font-medium px-2 py-1 rounded w-full hover:bg-neutral-200"
                      >
                        设为定稿
                      </button>
                    )}
                    <div className="flex gap-1 w-full">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadFileFromUrl(candidate.originalUrl || candidate.url, candidate.name); }}
                        className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                        title="下载"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete('删除素材', '确定要删除这个素材吗？', () => deleteCandidate(candidate.id)); }}
                        className="bg-white text-red-600 p-1 rounded flex-1 flex justify-center hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {asset.candidates.length === 0 && (
                <div className="col-span-full text-center py-6 text-xs text-neutral-400 border-2 border-dashed border-transparent hover:border-neutral-200 rounded-lg cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  点击或拖拽上传备选素材
                </div>
              )}
            </Dropzone>
          </div>
        </div>
      </div>
      </div>

      {/* Communication Area */}
      <div className="border-t border-neutral-200 p-6 bg-neutral-50/30">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">沟通区域 (Communication)</h4>
        
        <div className="flex flex-col gap-2 mb-4">
          {(asset.communications || []).map((msg, idx) => (
            <div key={msg.id} className="flex items-start gap-2 group">
              <span className={`text-sm font-medium ${msg.colorClass} ${msg.isStrikethrough ? 'line-through opacity-50' : ''}`}>
                {idx + 1}. {msg.text}
              </span>
              <button 
                onClick={() => toggleStrikethrough(msg.id)}
                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity p-0.5"
                title={msg.isStrikethrough ? "取消删除线" : "添加删除线"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {(!asset.communications || asset.communications.length === 0) && (
            <div className="text-sm text-neutral-400 italic">暂无沟通记录</div>
          )}
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            value={commInput}
            onChange={(e) => setCommInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCommunication()}
            placeholder="输入沟通内容..."
            className="flex-1 px-4 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button 
            onClick={handleAddCommunication}
            disabled={!commInput.trim()}
            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> 提交
          </button>
        </div>
      </div>

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.action}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.url}
          originalUrl={previewImage.originalUrl}
          alt={previewImage.name}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
