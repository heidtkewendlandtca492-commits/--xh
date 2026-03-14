import { useState, DragEvent, ReactNode } from 'react';
import { cn } from '../lib/utils';

interface DropzoneProps {
  onDropFiles: (files: FileList) => void;
  children: ReactNode;
  className?: string;
}

export function Dropzone({ onDropFiles, children, className }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn("relative transition-colors", isDragging && "bg-neutral-100 ring-2 ring-black ring-inset", className)}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-inherit border-2 border-dashed border-black">
          <span className="text-black font-medium">松开鼠标上传文件</span>
        </div>
      )}
    </div>
  );
}
