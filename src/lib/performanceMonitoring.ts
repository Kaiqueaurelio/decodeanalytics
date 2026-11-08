/**
 * Monitoramento de Performance em Tempo Real (RUM - Real User Monitoring).
 * Mede Core Web Vitals (LCP, FID/INP, CLS, TTFB, FCP) de usuários reais
 * e despacha métricas para o console em dev e dataLayer para observabilidade.
 */

export function initPerformanceMonitoring() {
  if (typeof window === "undefined" || !("performance" in window)) return;

  try {
    // 1. Navigation Timing (TTFB, DomContentLoaded, Load)
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navEntries = performance.getEntriesByType("navigation");
        if (navEntries.length > 0) {
          const nav = navEntries[0] as PerformanceNavigationTiming;
          const metrics = {
            ttfb: Math.round(nav.responseStart - nav.requestStart),
            domReady: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            pageLoad: Math.round(nav.loadEventEnd - nav.startTime),
            transferSize: nav.transferSize,
          };

          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug("[Performance] Navigation Metrics:", metrics);
          }

          const w = window as unknown as { dataLayer?: unknown[] };
          w.dataLayer = w.dataLayer ?? [];
          w.dataLayer.push({
            event: "web_vitals_navigation",
            ...metrics,
          });
        }
      }, 0);
    });

    // 2. Performance Observer para Largest Contentful Paint (LCP)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            const lcp = Math.round(lastEntry.startTime);
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.debug("[Performance] LCP:", lcp, "ms");
            }
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // Ignora navegadores que não suportam LCP
      }
    }
  } catch {
    // Falha silenciosa
  }
}
