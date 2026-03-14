import { useState, useRef, useEffect, FC } from 'react';
import { Asset, Candidate } from '../types';
import { Upload, Download, Trash2, X, Image as ImageIcon, Music } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { downloadFile } from '../lib/utils';
import { Dropzone } from './Dropzone';
import { EditableField } from './EditableField';

interface AssetCardProps {
  asset: Asset;
  onUpdate: (a: Asset) => void;
  onDelete: () => void;
}

export const AssetCard: FC<AssetCardProps> = ({ asset, onUpdate, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const finalizedCandidate = asset.candidates.find(c => c.id === asset.finalizedId);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const newCandidates: Candidate[] = Array.from(files).map((file: File) => ({
      id: uuidv4(),
      file,
      name: file.name
    }));
    onUpdate({
      ...asset,
      candidates: [...asset.candidates, ...newCandidates]
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRefUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    onUpdate({
      ...asset,
      referenceImage: {
        id: uuidv4(),
        file,
        name: file.name
      }
    });
    if (refInputRef.current) refInputRef.current.value = '';
  };

  const handleAudioUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    onUpdate({
      ...asset,
      audioReference: {
        id: uuidv4(),
        file,
        name: file.name
      }
    });
    if (audioInputRef.current) audioInputRef.current.value = '';
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

  const deleteReference = () => {
    onUpdate({ ...asset, referenceImage: undefined });
  };

  const deleteAudio = () => {
    onUpdate({ ...asset, audioReference: undefined });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col lg:flex-row mb-6">
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
                    <audio controls src={URL.createObjectURL(asset.audioReference.file)} className="w-full h-8 mt-2" />
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => downloadFile(asset.audioReference!.file)}
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
                <Upload className="w-3 h-3" /> {asset.referenceImage ? '替换' : '上传'}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={refInputRef}
                onChange={(e) => handleRefUpload(e.target.files)}
              />
            </div>
            <Dropzone onDropFiles={handleRefUpload} className="rounded-xl overflow-hidden border border-neutral-200 bg-white aspect-video relative group">
              {asset.referenceImage ? (
                <>
                  <CandidateImage file={asset.referenceImage.file} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => downloadFile(asset.referenceImage!.file)}
                      className="bg-white text-black p-2 rounded-full hover:scale-105 transition-transform"
                      title="无损下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={deleteReference}
                      className="bg-white text-red-600 p-2 rounded-full hover:scale-105 transition-transform"
                      title="删除参考图"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-sm border-2 border-dashed border-transparent hover:border-neutral-300 transition-colors cursor-pointer" onClick={() => refInputRef.current?.click()}>
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span>点击或拖拽上传参考图</span>
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
                  <CandidateImage file={finalizedCandidate.file} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => downloadFile(finalizedCandidate.file)}
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

        {/* Candidates Area */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">备选区 (Candidates)</h4>
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
                <CandidateImage file={candidate.file} />
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
                      onClick={() => downloadFile(candidate.file)}
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
  );
}

function CandidateImage({ file }: { file: File }) {
  const [url, setUrl] = useState<string>('');
  
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <div className="w-full h-full bg-neutral-100 animate-pulse" />;

  return <img src={url} alt={file.name} className="object-cover w-full h-full" />;
}
