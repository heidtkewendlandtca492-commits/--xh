import { useState, ChangeEvent } from 'react';
import { Upload, FileText } from 'lucide-react';
import { AssetType } from '../types';
import { Dropzone } from './Dropzone';

export function UploadScreen({ onUpload }: { onUpload: (uploads: { data: File | string, type: AssetType }[]) => void }) {
  const [files, setFiles] = useState<{ [key in AssetType]?: File }>({});

  const handleFileChange = (type: AssetType, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleDrop = (type: AssetType, droppedFiles: FileList) => {
    if (droppedFiles && droppedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [type]: droppedFiles[0] }));
    }
  };

  const removeFile = (type: AssetType) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[type];
      return newFiles;
    });
  };

  const handleStart = () => {
    const uploads = Object.entries(files).map(([type, file]) => ({
      data: file as File,
      type: type as AssetType
    }));
    if (uploads.length > 0) {
      onUpload(uploads);
    }
  };

  const UploadBox = ({ type, title }: { type: AssetType, title: string }) => (
    <Dropzone 
      onDropFiles={(files) => handleDrop(type, files)}
      className="border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center relative hover:bg-neutral-50 transition-colors h-48 cursor-pointer"
    >
      {files[type] ? (
        <div className="flex flex-col items-center text-center w-full h-full justify-center">
          <FileText className="w-10 h-10 text-black mb-2" />
          <span className="font-medium text-sm truncate max-w-[150px]">{files[type]!.name}</span>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(type); }}
            className="mt-3 text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded-full z-10 relative"
          >
            移除
          </button>
        </div>
      ) : (
        <div 
          className="flex flex-col items-center justify-center w-full h-full"
          onClick={() => document.getElementById(`file-upload-${type}`)?.click()}
        >
          <input 
            id={`file-upload-${type}`}
            type="file" 
            accept=".xlsx,.xls,.csv,.tsv,.txt" 
            onChange={(e) => handleFileChange(type, e)}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-neutral-400 mb-3" />
          <p className="text-sm font-medium text-neutral-700">{title}</p>
          <p className="text-xs text-neutral-500 mt-1">点击或拖拽上传</p>
        </div>
      )}
    </Dropzone>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-4xl w-full bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
        <h1 className="text-3xl font-bold mb-2 text-center">影视协同创作平台</h1>
        <p className="text-neutral-500 text-center mb-8">上传您的资产表格 (.xlsx, .csv, .txt)，我们将自动为您提取资产信息。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <UploadBox type="character" title="上传人物表格" />
          <UploadBox type="scene" title="上传场景表格" />
          <UploadBox type="prop" title="上传道具表格" />
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleStart}
            disabled={Object.keys(files).length === 0}
            className="w-full max-w-md bg-black text-white py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
          >
            开始提取资产
          </button>
        </div>
      </div>
    </div>
  );
}
