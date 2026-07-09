/**
 * Lightweight analytics for the landing page.
 *
 * Emits events to:
 *  - `window.dataLayer` (GA4/GTM compatible — plug any tag manager later)
 *  - `console.debug` in dev builds for inspection
 *
 * Session context is kept in `sessionStorage` so we can correlate the
 * infinite scroll depth (`infinite_page`) with card clicks and CTA
 * conversions on the same visit.
 */

type Primitive = string | number | boolean | null | undefined;
export type AnalyticsProps = Record<string, Primitive>;

const SESSION_KEY = "lp_session_v1";

/**
 * IDs de tracking configurados via variáveis públicas (ok em build client):
 *   VITE_GTM_CONTAINER_ID  →  GTM-XXXXXXX   (preferido; carrega GA4 via tag)
 *   VITE_GA4_MEASUREMENT_ID → G-XXXXXXXXXX  (gtag direto, sem GTM)
 *
 * Definidos ambos, GTM tem prioridade e o GA4 é configurado por dentro do container.
 */
export const GTM_ID = (import.meta.env.VITE_GTM_CONTAINER_ID ?? "") as string;
export const GA4_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID ?? "") as string;

let installed = false;

/**
 * Injeta o snippet oficial do GTM (ou do gtag GA4, se só o GA4 estiver
 * configurado) uma única vez. Deve ser chamada no cliente após a
 * montagem — respeitando `prefers-reduced-motion`? Não: analytics não é
 * animação. Só evita rodar em SSR.
 */
export function installAnalytics() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // dataLayer precisa existir antes do snippet do GTM/gtag.
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer ?? [];

  if (GTM_ID) {
    // Snippet oficial do GTM.
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(s);

    // Fallback <noscript> iframe para navegadores sem JS.
    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(GTM_ID)}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.prepend(noscript);
    return;
  }

  if (GA4_ID) {
    // Snippet oficial do gtag GA4 (sem GTM).
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
    document.head.appendChild(s);

    function gtag(...args: unknown[]) {
      (w.dataLayer as unknown[]).push(args);
    }
    w.gtag = gtag as (...a: unknown[]) => void;
    gtag("js", new Date());
    gtag("config", GA4_ID, { send_page_view: true });
  }
}

export function isAnalyticsConfigured() {
  return Boolean(GTM_ID || GA4_ID);
}

type SessionState = {
  session_id: string;
  started_at: number;
  infinite_page: number;
  card_clicks: number;
  cta_clicks: number;
};

function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

function readSession(): SessionState {
  if (typeof window === "undefined") {
    return {
      session_id: "ssr",
      started_at: 0,
      infinite_page: 0,
      card_clicks: 0,
      cta_clicks: 0,
    };
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as SessionState;
  } catch {
    /* ignore */
  }
  const fresh: SessionState = {
    session_id: uid(),
    started_at: Date.now(),
    infinite_page: 1,
    card_clicks: 0,
    cta_clicks: 0,
  };
  writeSession(fresh);
  return fresh;
}

function writeSession(s: SessionState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function getAnalyticsSession(): SessionState {
  return readSession();
}

/* ----------------------- Dev subscriber bus ----------------------- */
/**
 * Barramento simples para o painel de debug em dev. Cada `track()` chama
 * todos os listeners com o payload completo enviado ao dataLayer.
 * Em produção ninguém se inscreve, então o custo é zero.
 */
export type AnalyticsListener = (payload: Record<string, unknown>) => void;
const listeners = new Set<AnalyticsListener>();
export function subscribeAnalytics(fn: AnalyticsListener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function track(event: string, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;
  const session = readSession();
  const payload = {
    event,
    ts: Date.now(),
    path: window.location.pathname + window.location.search,
    session_id: session.session_id,
    session_age_ms: Date.now() - session.started_at,
    infinite_page: session.infinite_page,
    ...props,
  };

  // GA4 / GTM compatible sink
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...a: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(payload);

  // Notifica assinantes (painel de debug em dev, testes, etc.).
  if (listeners.size) {
    for (const fn of listeners) {
      try { fn(payload); } catch { /* ignore */ }
    }
  }

  // Se estamos usando gtag direto (GA4 sem GTM), envia como evento
  // customizado. Com GTM, deixa a tag do container disparar o evento
  // — o push acima já basta.
  if (!GTM_ID && GA4_ID && typeof w.gtag === "function") {
    const { event: _ev, ...rest } = payload;
    w.gtag("event", event, rest);
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
}

/** Card click on the landing. Correlates with infinite scroll depth. */
export function trackCardClick(props: {
  card_id: string;
  card_title: string;
  card_type: "product" | "category" | "testimonial" | "feature";
  section: string;
  position?: number;
  infinite_page_at_click?: number;
  price?: number | null;
  category?: string | null;
}) {
  const session = readSession();
  session.card_clicks += 1;
  writeSession(session);
  track("landing_card_click", {
    ...props,
    card_click_index: session.card_clicks,
  });
}

/** Prominent CTA / signup click. */
export function trackCta(props: {
  cta_id: string;
  cta_label: string;
  section: string;
  destination?: string;
  channel?: "whatsapp" | "internal" | "external" | "email" | "phone";
}) {
  const session = readSession();
  session.cta_clicks += 1;
  writeSession(session);
  track("landing_cta_click", {
    ...props,
    cta_click_index: session.cta_clicks,
  });
}

/**
 * Called each time the infinite grid appends a new page. This is the
 * single source of truth for measuring scroll-depth impact.
 */
export function trackInfinitePage(page: number, itemsVisible: number) {
  const session = readSession();
  session.infinite_page = Math.max(session.infinite_page, page);
  writeSession(session);
  track("landing_infinite_page_view", {
    page,
    items_visible: itemsVisible,
  });
}