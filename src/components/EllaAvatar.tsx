import { useEffect, useRef, useState } from "react";
import ellaAvatar from "@/assets/ella-avatar.jpg";
import { cn } from "@/lib/utils";

interface EllaAvatarProps {
  size?: number;
  className?: string;
  imgClassName?: string;
  alt?: string;
  ringClassName?: string;
  /** number of retry attempts before giving up (default 3) */
  maxRetries?: number;
  /** base delay in ms between retries (default 2000) */
  retryDelayMs?: number;
  loading?: "lazy" | "eager";
}

/**
 * Resilient avatar for Ella:
 * - Shows the bundled avatar image.
 * - On load failure, retries up to `maxRetries` with backoff.
 * - After exhaustion, renders a permanent fallback with initials ("ER") on
 *   a brand-tinted circle. Accessible via alt text.
 */
export function EllaAvatar({
  size = 44,
  className,
  imgClassName,
  ringClassName = "ring-2 ring-brand-yellow",
  alt = "Avatar do Assistente",
  maxRetries = 3,
  retryDelayMs = 2000,
  loading = "lazy",
}: EllaAvatarProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const src = attempt === 0 ? ellaAvatar : `${ellaAvatar}?retry=${attempt}`;

  const handleError = () => {
    if (attempt >= maxRetries) {
      console.warn("[EllaAvatar] falha ao carregar avatar após retries", { attempt });
      setFailed(true);
      return;
    }
    const delay = retryDelayMs * Math.pow(1.5, attempt);
    timerRef.current = setTimeout(() => setAttempt((a) => a + 1), delay);
  };

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{ width: size, height: size }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-blue to-brand-blue/70 text-white font-black",
          ringClassName,
          className,
        )}
      >
        <span style={{ fontSize: Math.max(12, Math.round(size * 0.4)) }}>ER</span>
      </div>
    );
  }

  return (
    <img
      key={attempt}
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading={loading}
      onError={handleError}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-full object-cover object-top", ringClassName, imgClassName, className)}
    />
  );
}
