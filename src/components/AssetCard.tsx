import { useState, useRef, FC } from 'react';
import { Asset, Candidate } from '../types';
import { Upload, Download, Trash2, X, Image as ImageIcon, Music, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Dropzone } from './Dropzone';
import { EditableField } from './EditableField';
import { uploadFile } from '../lib/storage';

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

  const finalizedCandidate = asset.candidates.find(c => c.id === asset.finalizedId);

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
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col lg:flex-row mb-6 relative">
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
      {/* Left: Text Info */}
      <div className="w-full lg:w-[300px] xl:w-[350px] shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <EditableField label="资产名称" value={asset.name} onSave={(v) => onUpdate({...asset, name: v})} />
          </div>
          <button onClick={onDelete} className="text-neutral-400 hover:text-red-500 ml-4 p-2 bg-neutral-50 rounded-full hover:bg-red-50 transition-colors">
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
                      onClick={deleteAudio}
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
                          onClick={() => deleteReference(img.id)}
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
                          onClick={() => deleteActorCandidate(candidate.id)}
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
                        onClick={() => deleteCandidate(candidate.id)}
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
  );
}
