import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Variant = "up" | "fade" | "left" | "right" | "zoom";

const VARIANTS: Record<Variant, { from: string }> = {
  up: { from: "translate3d(0,24px,0)" },
  fade: { from: "translate3d(0,0,0)" },
  left: { from: "translate3d(-24px,0,0)" },
  right: { from: "translate3d(24px,0,0)" },
  zoom: { from: "scale(0.96)" },
};

export function Reveal({
  children,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  duration = 700,
  className = "",
  style,
  once = true,
}: {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const v = VARIANTS[variant];
  const composed: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0,0,0) scale(1)" : v.from,
    transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    willChange: "opacity, transform",
    ...style,
  };

  // @ts-expect-error dynamic tag
  return <Tag ref={ref} className={className} style={composed}>{children}</Tag>;
}