import { useEffect, useRef, useState, memo } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackClass?: string;
  fallbackSrc?: string | null;
}

export function resolveSmartImageSrc(
  src?: string | null,
  fallbackSrc?: string | null,
  fallbackAttempted = false,
): string | undefined {
  const primary = src?.trim() || undefined;
  const fallback = fallbackSrc?.trim() || undefined;
  return fallbackAttempted ? fallback ?? primary : primary ?? fallback;
}

export const SmartImage = memo(function SmartImage({
  src,
  alt,
  className,
  fallbackClass = "bg-gradient-to-br from-[#10162E] via-[#0B1026] to-[#050505]",
  fallbackSrc,
  loading = "lazy",
  decoding = "async",
  onLoad,
  onError,
  ...props
}: SmartImageProps) {
  const [error, setError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [imgLoading, setImgLoading] = useState(Boolean(src?.trim() || fallbackSrc?.trim()));
  const safeFallbackSrc = fallbackSrc?.trim() || undefined;
  const finalSrc = resolveSmartImageSrc(src, fallbackSrc, fallbackAttempted);

  useEffect(() => {
    setError(false);
    setFallbackAttempted(false);
    setImgLoading(Boolean(src?.trim() || fallbackSrc?.trim()));
  }, [src, fallbackSrc]);

  if (error || !finalSrc) {
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
      {imgLoading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#111A38] via-[#172244] to-[#0B1026]"
        />
      )}
      {/* Renderização robusta sem forçar type="image/webp" sintético em arquivos jpg/png locais */}
      <img
        src={finalSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={(event) => {
          setImgLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setImgLoading(false);
          if (safeFallbackSrc && !fallbackAttempted && finalSrc !== safeFallbackSrc) {
            setFallbackAttempted(true);
            setImgLoading(true);
          } else {
            setError(true);
          }
          onError?.(event);
        }}
        {...props}
      />
    </div>
  );
});
