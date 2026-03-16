import { useState, useRef, FC } from 'react';
import { Asset, Candidate, CommunicationMessage } from '../types';
import { Upload, Download, Trash2, X, Image as ImageIcon, Music, Loader2, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Dropzone } from './Dropzone';
import { EditableField } from './EditableField';
import { uploadFile } from '../lib/storage';
import { ConfirmModal } from './ConfirmModal';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{title: string, message: string, action: () => void} | null>(null);
  const [commInput, setCommInput] = useState('');

  const finalizedCandidate = asset.candidates.find(c => c.id === asset.finalizedId);

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
    if (!files) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const newCandidates: Candidate[] = [];
      const total = files.length;
      let completed = 0;
      for (const file of Array.from(files)) {
        const { url, originalUrl } = await uploadFile(file, `assets/${asset.id}/candidates`, (p) => {
          setUploadProgress(Math.round(((completed * 100) + p) / total));
        });
        newCandidates.push({
          id: uuidv4(),
          url,
          originalUrl,
          name: file.name
        });
        completed++;
      }
      onUpdate({
        ...asset,
        candidates: [...asset.candidates, ...newCandidates]
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRefUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const newImages: Candidate[] = [];
      const total = files.length;
      let completed = 0;
      for (const file of Array.from(files)) {
        const { url, originalUrl } = await uploadFile(file, `assets/${asset.id}/reference`, (p) => {
          setUploadProgress(Math.round(((completed * 100) + p) / total));
        });
        newImages.push({
          id: uuidv4(),
          url,
          originalUrl,
          name: file.name
        });
        completed++;
      }
      
      // Combine with existing reference images, and also handle the legacy referenceImage if it exists
      let currentRefImages = asset.referenceImages || [];
      if (asset.referenceImage && currentRefImages.length === 0) {
        currentRefImages = [asset.referenceImage];
      }
      
      onUpdate({
        ...asset,
        referenceImages: [...currentRefImages, ...newImages],
        referenceImage: undefined // Clear legacy field
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (refInputRef.current) refInputRef.current.value = '';
    }
  };

  const handleAudioUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const file = files[0];
      const { url, originalUrl } = await uploadFile(file, `assets/${asset.id}/audio`, (p) => {
        setUploadProgress(p);
      });
      onUpdate({
        ...asset,
        audioReference: {
          id: uuidv4(),
          url,
          originalUrl,
          name: file.name
        }
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleActorUpload = async (files: FileList | null) => {
    if (!files) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const newCandidates: Candidate[] = [];
      const total = files.length;
      let completed = 0;
      for (const file of Array.from(files)) {
        const { url, originalUrl } = await uploadFile(file, `assets/${asset.id}/actorCandidates`, (p) => {
          setUploadProgress(Math.round(((completed * 100) + p) / total));
        });
        newCandidates.push({
          id: uuidv4(),
          url,
          originalUrl,
          name: file.name
        });
        completed++;
      }
      onUpdate({
        ...asset,
        actorCandidates: [...(asset.actorCandidates || []), ...newCandidates]
      });
    } catch (e: any) {
      alert(`上传失败: ${e.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (actorInputRef.current) actorInputRef.current.value = '';
    }
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
      alert('下载失败');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col mb-6 relative">
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 w-64">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <span className="text-sm font-medium">上传中... {uploadProgress}%</span>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-black h-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
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
              {asset.audioReference ? (
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
            
            <Dropzone onDropFiles={handleRefUpload} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 bg-white border border-neutral-200 rounded-xl min-h-[100px]">
              {(() => {
                const refImages = asset.referenceImages || (asset.referenceImage ? [asset.referenceImage] : []);
                return refImages.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square">
                    <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1">
                      <div className="flex gap-1 w-full mt-auto">
                        <button 
                          onClick={() => downloadFileFromUrl(img.originalUrl || img.url, img.name)}
                          className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                          title="无损下载"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => confirmDelete('删除参考图', '确定要删除这张参考图吗？', () => deleteReference(img.id))}
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
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">定稿区 (Finalized)</h4>
            <div className="rounded-xl overflow-hidden border border-neutral-200 bg-white aspect-video relative group">
              {finalizedCandidate ? (
                <>
                  <img src={finalizedCandidate.url} alt={finalizedCandidate.name} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => downloadFileFromUrl(finalizedCandidate.originalUrl || finalizedCandidate.url, finalizedCandidate.name)}
                      className="bg-white text-black p-2 rounded-full hover:scale-105 transition-transform"
                      title="无损下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={removeFinalized}
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

        <div className={asset.type === 'character' ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : ""}>
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
              
              <Dropzone onDropFiles={handleActorUpload} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 p-2 bg-white border border-neutral-200 rounded-xl min-h-[100px] mb-6 xl:mb-0">
                {(asset.actorCandidates || []).map(candidate => (
                  <div key={candidate.id} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square">
                    <img src={candidate.url} alt={candidate.name} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1">
                      <div className="flex gap-1 w-full mt-auto">
                        <button 
                          onClick={() => downloadFileFromUrl(candidate.originalUrl || candidate.url, candidate.name)}
                          className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                          title="下载"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => confirmDelete('删除素材', '确定要删除这个素材吗？', () => deleteActorCandidate(candidate.id))}
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
            
            <Dropzone onDropFiles={handleFileUpload} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 p-2 bg-white border border-neutral-200 rounded-xl min-h-[100px]">
              {asset.candidates.map(candidate => (
                <div key={candidate.id} className={`relative group rounded-lg overflow-hidden border aspect-square ${asset.finalizedId === candidate.id ? 'border-black ring-2 ring-black ring-offset-1' : 'border-neutral-200'}`}>
                  <img src={candidate.url} alt={candidate.name} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1">
                    {asset.finalizedId !== candidate.id && (
                      <button 
                        onClick={() => setFinalized(candidate.id)}
                        className="bg-white text-black text-[10px] font-medium px-2 py-1 rounded w-full hover:bg-neutral-200"
                      >
                        设为定稿
                      </button>
                    )}
                    <div className="flex gap-1 w-full">
                      <button 
                        onClick={() => downloadFileFromUrl(candidate.originalUrl || candidate.url, candidate.name)}
                        className="bg-white text-black p-1 rounded flex-1 flex justify-center hover:bg-neutral-200"
                        title="下载"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => confirmDelete('删除素材', '确定要删除这个素材吗？', () => deleteCandidate(candidate.id))}
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
    </div>
  );
}
