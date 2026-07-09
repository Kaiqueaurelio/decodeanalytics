import { useEffect, useRef, useState } from "react";

/**
 * Sutil cursor personalizado para desktop. Segue o mouse com easing,
 * cresce sobre elementos interativos e adiciona um ripple ao clicar.
 * Respeita prefers-reduced-motion e é desativado em pointer coarse (touch).
 */
export function CursorFollower() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const hover = useRef(false);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    const isInteractive = (el: EventTarget | null) => {
      if (!(el instanceof Element)) return false;
      return !!el.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]',
      );
    };
    const onOver = (e: PointerEvent) => {
      hover.current = isInteractive(e.target);
      const ring = ringRef.current;
      if (ring) ring.dataset.hover = hover.current ? "1" : "0";
    };
    const onClick = (e: PointerEvent) => {
      const ripple = document.createElement("span");
      ripple.className = "cursor-follower-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 600);
    };

    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      const d = dotRef.current;
      const r = ringRef.current;
      if (d) d.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0) translate(-50%, -50%)`;
      if (r) r.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onClick, { passive: true });
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onClick);
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={ringRef} className="cursor-follower-ring" data-hover="0" aria-hidden />
      <div ref={dotRef} className="cursor-follower-dot" aria-hidden />
    </>
  );
}