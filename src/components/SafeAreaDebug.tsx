import { useEffect, useState } from "react";

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

    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  if (!enabled) return null;

  const bar = "absolute flex items-center justify-center text-[10px] font-bold text-white";
  const color = "rgba(236, 72, 153, 0.35)"; // pink-500 @ 35%
  const border = "2px dashed rgba(236, 72, 153, 0.9)";

  return (
    <div
      aria-hidden
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
        className="absolute rounded-lg bg-black/80 px-3 py-2 font-mono text-[11px] leading-tight text-white shadow-lg"
        style={{
          top: `calc(${insets.top}px + 8px)`,
          left: `calc(${insets.left}px + 8px)`,
        }}
      >
        <div className="font-bold text-pink-300">safe-area-inset</div>
        <div>top: {Math.round(insets.top)}px</div>
        <div>right: {Math.round(insets.right)}px</div>
        <div>bottom: {Math.round(insets.bottom)}px</div>
        <div>left: {Math.round(insets.left)}px</div>
        <div className="mt-1 text-[9px] text-white/60">__toggleSafeArea() p/ desligar</div>
      </div>
    </div>
  );
}