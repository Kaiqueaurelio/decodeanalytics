import { useEffect, useState } from "react";

type Violation = {
  rect: { top: number; left: number; width: number; height: number };
  label: string;
  sides: string[]; // which insets it invades
};

/**
 * Overlay de depuração para visualizar as safe areas do dispositivo
 * (env(safe-area-inset-*)). Ativa via:
 *   - localStorage.setItem("debug:safe-area", "1")   (persistente)
 *   - window.__toggleSafeArea()                       (no console)
 *   - URL com ?safeArea=1                             (uma sessão)
 *
 * Desenha 4 faixas coloridas semitransparentes nas bordas do viewport,
 * cada uma com o valor computado da respectiva inset em px,
 * e uma moldura tracejada marcando a "área segura" real.
 */
export function SafeAreaDebug() {
  const [enabled, setEnabled] = useState(false);
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [violations, setViolations] = useState<Violation[]>([]);
  const [threshold, setThreshold] = useState<number>(2);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);visibility:hidden;pointer-events:none;";
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const next = {
        top: parseFloat(cs.paddingTop) || 0,
        right: parseFloat(cs.paddingRight) || 0,
        bottom: parseFloat(cs.paddingBottom) || 0,
        left: parseFloat(cs.paddingLeft) || 0,
      };
      document.body.removeChild(probe);
      setInsets(next);
    };

    const read = () => {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get("safeArea") === "1";
      const fromLS = localStorage.getItem("debug:safe-area") === "1";
      setEnabled(fromUrl || fromLS);
    };

    read();
    compute();

    // Lê threshold salvo (px)
    const savedThreshold = Number(localStorage.getItem("debug:safe-area-threshold"));
    if (Number.isFinite(savedThreshold) && savedThreshold >= 0) {
      setThreshold(savedThreshold);
    }

    const toggle = (value?: boolean) => {
      const next = typeof value === "boolean" ? value : localStorage.getItem("debug:safe-area") !== "1";
      if (next) localStorage.setItem("debug:safe-area", "1");
      else localStorage.removeItem("debug:safe-area");
      setEnabled(next);
      // eslint-disable-next-line no-console
      console.info(`[SafeAreaDebug] ${next ? "ligado" : "desligado"}`);
      return next;
    };
    (window as unknown as { __toggleSafeArea?: (v?: boolean) => boolean }).__toggleSafeArea = toggle;

    const setThresh = (px: number) => {
      const n = Math.max(0, Math.round(Number(px) || 0));
      localStorage.setItem("debug:safe-area-threshold", String(n));
      setThreshold(n);
      // eslint-disable-next-line no-console
      console.info(`[SafeAreaDebug] threshold = ${n}px`);
      return n;
    };
    (window as unknown as { __setSafeAreaThreshold?: (px: number) => number }).__setSafeAreaThreshold =
      setThresh;

    // Aceita ?safeAreaThreshold=NN na URL
    const urlT = new URL(window.location.href).searchParams.get("safeAreaThreshold");
    if (urlT !== null) setThresh(Number(urlT));

    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  // Varre elementos fixed/sticky e detecta invasão nas insets
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let raf = 0;

    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : "";
      const cls =
        el.classList.length > 0
          ? "." + Array.from(el.classList).slice(0, 2).join(".")
          : "";
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    };

    const scan = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const found: Violation[] = [];
      const all = document.body.querySelectorAll<HTMLElement>("*");
      for (const el of Array.from(all)) {
        // pula o próprio overlay
        if (el.closest("[data-safe-area-debug]")) continue;
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        // rects totalmente fora do viewport
        if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;

        const sides: string[] = [];
        // Profundidade da invasão por lado (px), aplica threshold mínimo
        const depthTop = insets.top - r.top;
        const depthBottom = r.bottom - (vh - insets.bottom);
        const depthLeft = insets.left - r.left;
        const depthRight = r.right - (vw - insets.right);
        if (insets.top > 0 && depthTop > threshold) sides.push(`top+${Math.round(depthTop)}`);
        if (insets.bottom > 0 && depthBottom > threshold)
          sides.push(`bottom+${Math.round(depthBottom)}`);
        if (insets.left > 0 && depthLeft > threshold) sides.push(`left+${Math.round(depthLeft)}`);
        if (insets.right > 0 && depthRight > threshold)
          sides.push(`right+${Math.round(depthRight)}`);
        if (sides.length === 0) continue;

        found.push({
          rect: {
            top: Math.max(0, r.top),
            left: Math.max(0, r.left),
            width: Math.min(vw, r.right) - Math.max(0, r.left),
            height: Math.min(vh, r.bottom) - Math.max(0, r.top),
          },
          label: describe(el),
          sides,
        });
      }
      setViolations(found);
    };

    const tick = () => {
      scan();
      raf = window.requestAnimationFrame(() => {
        // amostra ~4x/s pra não pesar
        window.setTimeout(tick, 250);
      });
    };
    tick();

    const onScroll = () => scan();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", scan);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", scan);
    };
  }, [enabled, insets, threshold]);

  if (!enabled) return null;

  const bar = "absolute flex items-center justify-center text-[10px] font-bold text-inverse";
  const color = "rgba(236, 72, 153, 0.35)"; // pink-500 @ 35%
  const border = "2px dashed rgba(236, 72, 153, 0.9)";

  return (
    <div
      aria-hidden
      data-safe-area-debug
      className="pointer-events-none fixed inset-0 z-[2147483647]"
      style={{ contain: "strict" }}
    >
      {/* Faixa superior */}
      {insets.top > 0 && (
        <div
          className={bar}
          style={{ top: 0, left: 0, right: 0, height: insets.top, background: color }}
        >
          top {Math.round(insets.top)}px
        </div>
      )}
      {/* Faixa inferior */}
      {insets.bottom > 0 && (
        <div
          className={bar}
          style={{ bottom: 0, left: 0, right: 0, height: insets.bottom, background: color }}
        >
          bottom {Math.round(insets.bottom)}px
        </div>
      )}
      {/* Faixa esquerda */}
      {insets.left > 0 && (
        <div
          className={bar}
          style={{ top: 0, bottom: 0, left: 0, width: insets.left, background: color }}
        >
          <span style={{ writingMode: "vertical-rl" }}>left {Math.round(insets.left)}px</span>
        </div>
      )}
      {/* Faixa direita */}
      {insets.right > 0 && (
        <div
          className={bar}
          style={{ top: 0, bottom: 0, right: 0, width: insets.right, background: color }}
        >
          <span style={{ writingMode: "vertical-rl" }}>right {Math.round(insets.right)}px</span>
        </div>
      )}
      {/* Moldura da área segura */}
      <div
        className="absolute"
        style={{
          top: insets.top,
          right: insets.right,
          bottom: insets.bottom,
          left: insets.left,
          border,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0)",
        }}
      />
      {/* HUD com valores */}
      <div
        className="absolute rounded-lg bg-surface-dark/80 px-3 py-2 font-mono text-[11px] leading-tight text-inverse shadow-lg"
        style={{
          top: `calc(${insets.top}px + 8px)`,
          left: `calc(${insets.left}px + 8px)`,
        }}
      >
        <div className="font-bold text-highlight">safe-area-inset</div>
        <div>top: {Math.round(insets.top)}px</div>
        <div>right: {Math.round(insets.right)}px</div>
        <div>bottom: {Math.round(insets.bottom)}px</div>
        <div>left: {Math.round(insets.left)}px</div>
        <div className="mt-1 border-t border-inverse/20 pt-1 font-bold text-warning">
          {violations.length} sobrepos{violations.length === 1 ? "ição" : "ições"}
        </div>
        <div className="text-[9px] text-inverse/70">threshold: {threshold}px</div>
        <div className="mt-1 text-[9px] text-inverse/60">__toggleSafeArea() p/ desligar</div>
        <div className="text-[9px] text-inverse/60">__setSafeAreaThreshold(px)</div>
      </div>

      {/* Destaques em elementos fixed/sticky que invadem safe areas */}
      {violations.map((v, i) => (
        <div key={i}>
          <div
            className="absolute animate-pulse"
            style={{
              top: v.rect.top,
              left: v.rect.left,
              width: v.rect.width,
              height: v.rect.height,
              outline: "3px solid rgba(239, 68, 68, 0.95)",
              outlineOffset: "-3px",
              background:
                "repeating-linear-gradient(45deg, rgba(239,68,68,0.18) 0 8px, rgba(239,68,68,0.35) 8px 16px)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.6) inset",
            }}
          />
          <div
            className="absolute rounded bg-destructive px-2 py-1 font-mono text-[10px] font-bold text-inverse shadow"
            style={{
              top: Math.max(insets.top + 2, v.rect.top - 22),
              left: Math.min(
                window.innerWidth - insets.right - 220,
                Math.max(insets.left + 2, v.rect.left),
              ),
              maxWidth: 220,
            }}
          >
            ⚠ {v.label}
            <span className="ml-1 rounded bg-inverse/25 px-1 text-[9px] uppercase">
              {v.sides.join(" · ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}