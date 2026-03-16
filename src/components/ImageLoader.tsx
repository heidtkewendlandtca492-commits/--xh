import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageLoader({ src, alt, className }: ImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setRetryCount(0);
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 z-10">
          <Loader2 className="w-5 h-5 animate-spin mb-1" />
          <span className="text-[10px]">处理中...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs z-10">
          加载失败
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => {
          setIsLoading(false);
          setError(false);
        }}
        onError={(e) => {
          if (retryCount < 3) {
            // Retry loading the image after a delay, as Cloudinary might still be generating the transformation
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              // Force a reload by appending a cache-busting query parameter
              const target = e.target as HTMLImageElement;
              const url = new URL(src);
              url.searchParams.set('retry', String(retryCount + 1));
              target.src = url.toString();
            }, 2000);
          } else {
            setIsLoading(false);
            setError(true);
          }
        }}
      />
    </div>
  );
}
