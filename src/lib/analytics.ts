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
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(payload);

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