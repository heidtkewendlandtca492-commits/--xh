import { useState, useEffect, WheelEvent } from 'react';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, alt, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleWheel = (e: WheelEvent) => {
    const delta = e.deltaY * -0.002;
    const newScale = Math.min(Math.max(0.1, scale + delta), 10);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-white/70 hover:text-white z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="absolute bottom-6 flex items-center gap-4 text-white/70 z-10 bg-black/50 px-6 py-3 rounded-full backdrop-blur-md">
        <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="hover:text-white"><ZoomOut className="w-5 h-5" /></button>
        <span className="text-sm font-medium w-12 text-center select-none">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(10, s + 0.2))} className="hover:text-white"><ZoomIn className="w-5 h-5" /></button>
        <div className="w-px h-4 bg-white/20 mx-2"></div>
        <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="hover:text-white" title="重置"><Maximize className="w-4 h-4" /></button>
      </div>

      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <img
          src={src}
          alt={alt}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
          }}
          className="max-w-full max-h-full object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
