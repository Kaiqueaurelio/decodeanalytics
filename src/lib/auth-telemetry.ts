// Lightweight client-side telemetry for the /auth flow.
// Emits events via console.info + a CustomEvent('auth-telemetry') so any
// analytics layer (Sentry, GA, Mixpanel) can be plugged in without touching
// the auth page.

export type AuthTelemetryEvent =
  | "auth_page_view"
  | "auth_input_focus"
  | "auth_input_focus_failed"
  | "auth_keyboard_suspected_hidden"
  | "auth_submit_attempt"
  | "auth_submit_error";

export interface AuthTelemetryDetail {
  event: AuthTelemetryEvent;
  inputId?: string;
  errorMessage?: string;
  platform?: string;
  userAgent?: string;
  viewport?: { w: number; h: number };
  visualViewport?: { w: number; h: number } | null;
  url?: string;
  ts: number;
  [k: string]: unknown;
}

function detectPlatform(): string {
  if (typeof navigator === "undefined") return "ssr";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function emitAuthTelemetry(
  event: AuthTelemetryEvent,
  extra: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const vv = window.visualViewport;
  const detail: AuthTelemetryDetail = {
    event,
    ts: Date.now(),
    platform: detectPlatform(),
    userAgent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    visualViewport: vv ? { w: vv.width, h: vv.height } : null,
    url: window.location.pathname,
    ...extra,
  };
  try {
    // Only log critical failures or if specifically debugging
    if (event === "auth_input_focus_failed" || event === "auth_submit_error") {
      console.warn("[auth-telemetry]", detail);
    }
    window.dispatchEvent(new CustomEvent("auth-telemetry", { detail }));
  } catch {
    /* noop */
  }
}

/**
 * Wraps an onFocus/onPointerDown handler pair so we can detect taps that
 * do NOT produce a focus event within 500ms (a common symptom of the
 * "keyboard doesn't open" bug on mobile WebViews).
 */
export function trackInputFocus(inputId: string) {
  let focused = false;
  let heightBefore = 0;
  return {
    onPointerDown: () => {
      focused = false;
      heightBefore = window.visualViewport?.height ?? window.innerHeight;
      window.setTimeout(() => {
        if (!focused) {
          emitAuthTelemetry("auth_input_focus_failed", {
            inputId,
            errorMessage: "tap sem focus em 500ms",
          });
        }
      }, 500);
      window.setTimeout(() => {
        const after = window.visualViewport?.height ?? window.innerHeight;
        // Heurística: se o input recebeu foco mas o viewport não encolheu
        // ao menos 100px, o teclado provavelmente não abriu.
        if (focused && heightBefore - after < 100) {
          emitAuthTelemetry("auth_keyboard_suspected_hidden", {
            inputId,
            heightBefore,
            heightAfter: after,
          });
        }
      }, 800);
    },
    onFocus: () => {
      focused = true;
      emitAuthTelemetry("auth_input_focus", { inputId });
    },
  };
}