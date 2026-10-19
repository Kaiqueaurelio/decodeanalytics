import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackClass?: string;
  fallbackSrc?: string | null;
}

export function SmartImage({
  src,
  alt,
  className,
  fallbackClass = "bg-gradient-to-br from-[#10162E] via-[#0B1026] to-[#050505]",
  fallbackSrc,
  onLoad,
  onError,
  ...props
}: SmartImageProps) {
  const [error, setError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [loading, setLoading] = useState(Boolean(src));

  useEffect(() => {
    setError(false);
    setFallbackAttempted(false);
    setLoading(Boolean(src || fallbackSrc));
  }, [src, fallbackSrc]);

  if (error || (!src && !fallbackSrc)) {
    return (
      <div
        role="img"
        aria-label={alt || "Imagem indisponível"}
        className={`relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden p-4 text-center ${fallbackClass} ${className ?? ""}`}
      >
        <span
          aria-hidden="true"
          className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#67E8F9] shadow-lg"
        >
          <ImageIcon className="h-6 w-6" />
        </span>
        <span className="line-clamp-2 max-w-full text-xs font-semibold leading-relaxed text-white/80">
          {alt || "Imagem indisponível"}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      {loading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#111A38] via-[#172244] to-[#0B1026]"
        />
      )}
      <img
        src={fallbackAttempted ? (fallbackSrc ?? src) : (src ?? fallbackSrc)}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
        onLoad={(event) => {
          setLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoading(false);
          if (fallbackSrc && !fallbackAttempted && src !== fallbackSrc) {
            setFallbackAttempted(true);
            setLoading(true);
          } else {
            setError(true);
          }
          onError?.(event);
        }}
        {...props}
      />
    </div>
  );
}
