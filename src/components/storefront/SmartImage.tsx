import { useEffect, useRef, useState } from "react";

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackEmoji?: string;
  fallbackClass?: string;
}

export function SmartImage({ 
  src, 
  alt, 
  className, 
  fallbackEmoji = "📦", 
  fallbackClass = "bg-[#191920]",
  onLoad,
  onError,
  ...props 
}: SmartImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Só mostramos fallback quando não há src.
  // URLs `/__l5e/...` são válidas no domínio *.lovable.app (CDN de assets).
  const isInvalidUrl = !src;

  useEffect(() => {
    setError(false);
    setLoading(!isInvalidUrl);
  }, [src, isInvalidUrl]);

  useEffect(() => {
    if (isInvalidUrl) return;

    const img = imgRef.current;
    if (!img?.complete) return;

    if (img.naturalWidth > 0) {
      setLoading(false);
    } else {
      setLoading(false);
      setError(true);
    }
  }, [src, isInvalidUrl]);

  if (error || isInvalidUrl) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${fallbackClass} ${className ?? ""}`}>
        <div className="text-center">
          <div className="text-4xl mb-1">{fallbackEmoji}</div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {alt || "Produto"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={(event) => {
          setLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoading(false);
          setError(true);
          onError?.(event);
        }}
        {...props}
      />
    </div>
  );
}
