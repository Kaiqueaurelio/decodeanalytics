import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { HackedPrankContext } from "@/components/useHackedPrank";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Radio,
  ShieldAlert,
  Terminal,
  WifiOff,
} from "lucide-react";

const EXIT_PASSWORD = "Aurelio0496@@$$";
const DOUBLE_TAP_WINDOW = 650;

export function HackedPrankProvider({ children }: { children: ReactNode }) {
  const [isHacked, setIsHacked] = useState(true);
  const [password, setPassword] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const lastTapAt = useRef(0);
  const resetTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siteContentRef = useRef<HTMLDivElement>(null);

  const registerLogoTap = useCallback(() => {
    const now = Date.now();

    if (now - lastTapAt.current <= DOUBLE_TAP_WINDOW) {
      if (resetTapTimer.current) clearTimeout(resetTapTimer.current);
      lastTapAt.current = 0;
      setPassword("");
      setWrongAttempts(0);
      setIsHacked(true);
      return;
    }

    lastTapAt.current = now;
    if (resetTapTimer.current) clearTimeout(resetTapTimer.current);
    resetTapTimer.current = setTimeout(() => {
      lastTapAt.current = 0;
    }, DOUBLE_TAP_WINDOW);
  }, []);

  useEffect(() => {
    return () => {
      if (resetTapTimer.current) clearTimeout(resetTapTimer.current);
    };
  }, []);

  useEffect(() => {
    const siteContent = siteContentRef.current;
    if (!siteContent) return;

    siteContent.inert = isHacked;
    if (isHacked) {
      siteContent.setAttribute("aria-hidden", "true");
    } else {
      siteContent.removeAttribute("aria-hidden");
    }

    return () => {
      siteContent.inert = false;
      siteContent.removeAttribute("aria-hidden");
    };
  }, [isHacked]);

  useEffect(() => {
    if (!isHacked) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isHacked]);

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password === EXIT_PASSWORD) {
      setIsHacked(false);
      setPassword("");
      setWrongAttempts(0);
      return;
    }

    setWrongAttempts((attempts) => attempts + 1);
    setPassword("");
  };

  return (
    <HackedPrankContext.Provider value={{ registerLogoTap }}>
      <div ref={siteContentRef} className="contents">
        {children}
      </div>
      {isHacked && (
        <HackedPrankOverlay
          password={password}
          wrongAttempts={wrongAttempts}
          onPasswordChange={setPassword}
          onSubmit={submitPassword}
        />
      )}
    </HackedPrankContext.Provider>
  );
}

function HackedPrankOverlay({
  password,
  wrongAttempts,
  onPasswordChange,
  onSubmit,
}: {
  password: string;
  wrongAttempts: number;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      className="hack-prank-overlay fixed inset-0 z-[9999] overflow-y-auto bg-[#050505] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Simulação de site hackeado"
    >
      <div className="hack-prank-noise pointer-events-none fixed inset-0 opacity-30" />
      <div className="hack-prank-scanlines pointer-events-none fixed inset-0 opacity-20" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1320px] flex-col px-4 py-5 sm:px-6 md:px-10 md:py-7">
        <header className="flex items-center justify-between border-b border-red-500/30 pb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300 sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_15px_#ef4444]" />
            <span>Alcateia // acesso comprometido</span>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-red-500">[ transmissão interceptada ]</span>
            <WifiOff className="h-4 w-4" />
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-14">
          <section className="min-w-0">
            <div className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Alerta de segurança // prank mode</span>
            </div>
            <h1
              className="hack-prank-glitch max-w-5xl font-display text-[clamp(4.5rem,14vw,12rem)] leading-[0.78] tracking-[-0.06em] text-red-500"
              data-text="HACKEADO"
            >
              HACKEADO
            </h1>
            <p className="mt-7 max-w-2xl font-mono text-base font-bold uppercase leading-relaxed tracking-[0.1em] text-white sm:text-xl">
              Seu site foi interceptado por um operador remoto.
            </p>

            <div className="mt-8 grid max-w-3xl gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-red-100/70 sm:grid-cols-3">
              <StatusLine icon={<Radio className="h-4 w-4" />} label="canal" value="offline" />
              <StatusLine
                icon={<ShieldAlert className="h-4 w-4" />}
                label="firewall"
                value="bypass"
              />
              <StatusLine
                icon={<Terminal className="h-4 w-4" />}
                label="origem"
                value="nó remoto CN"
              />
            </div>

            <div className="mt-8 max-w-3xl overflow-hidden rounded-xl border border-red-500/30 bg-black/60 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
              <div className="flex items-center justify-between border-b border-red-500/20 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-red-300">
                <span className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5" /> intruder.log
                </span>
                <span className="text-red-500">live</span>
              </div>
              <div className="space-y-2 p-4 font-mono text-xs leading-relaxed text-red-200/75 sm:text-sm">
                <p>
                  <span className="text-red-500">root@alcateia:~$</span> ./takeover --visual-only
                </p>
                <p className="text-red-300">
                  [ok] interface intercepted — nenhum dado foi alterado
                </p>
                <p className="text-white/60">
                  [!!] assinatura visual: máscara DALI // canal vermelho
                </p>
                <p>
                  <span className="text-red-500">root@alcateia:~$</span> await recovery_key
                  <span className="hack-prank-caret" />
                </p>
              </div>
            </div>
          </section>

          <aside className="relative mx-auto w-full max-w-md">
            <div className="hack-prank-card relative overflow-hidden rounded-2xl border border-red-500/40 bg-[#100909]/90 p-5 shadow-[0_0_70px_rgba(239,68,68,0.18)] sm:p-7">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-600/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-red-300">
                  <span>identidade do invasor</span>
                  <span className="rounded border border-red-500/40 px-2 py-1 text-red-400">
                    404
                  </span>
                </div>
                <DaliMask />
                <div className="mt-5 text-center">
                  <p className="font-display text-4xl tracking-wide text-white">DALI PROTOCOL</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-red-400">
                    operação visual não autorizada
                  </p>
                </div>

                <div className="mt-6 border-t border-red-500/20 pt-5">
                  <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-red-200/80">
                    <LockKeyhole className="h-4 w-4" />
                    <span>chave de recuperação</span>
                  </div>
                  <form onSubmit={onSubmit}>
                    <label htmlFor="hack-recovery-key" className="sr-only">
                      Digite a senha para sair do modo hackeado
                    </label>
                    <input
                      id="hack-recovery-key"
                      type="password"
                      value={password}
                      autoFocus
                      onChange={(event) => onPasswordChange(event.target.value)}
                      placeholder="Digite a senha..."
                      className="h-12 w-full rounded-lg border border-red-500/40 bg-black/70 px-4 font-mono text-sm text-white outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/30 placeholder:text-red-100/30"
                    />
                    <button
                      type="submit"
                      className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 font-mono text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-red-500 active:scale-[0.98]"
                    >
                      <KeyRound className="h-4 w-4" />
                      Encerrar invasão
                    </button>
                  </form>
                  {wrongAttempts > 0 && (
                    <p
                      className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-red-400"
                      role="alert"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> chave rejeitada // tentativa{" "}
                      {wrongAttempts}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="flex flex-col gap-2 border-t border-red-500/30 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-red-200/50 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-red-400" /> simulação visual // nenhum dado
            foi alterado
          </span>
          <span>toque duplo detectado // saída requer autenticação</span>
        </footer>
      </div>
    </div>
  );
}

function StatusLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-red-500/20 bg-red-500/5 px-3 py-2">
      <span className="text-red-500">{icon}</span>
      <span>
        {label}: <strong className="text-red-300">{value}</strong>
      </span>
    </div>
  );
}

function DaliMask() {
  return (
    <div className="hack-prank-mask mx-auto mt-6 flex h-56 items-center justify-center rounded-xl border border-red-500/20 bg-gradient-to-b from-red-950/80 to-black/80 p-4">
      <svg
        viewBox="0 0 260 220"
        className="h-full w-full max-w-[280px]"
        role="img"
        aria-label="Máscara teatral estilizada do protocolo Dali"
      >
        <defs>
          <linearGradient id="maskHood" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ef4444" />
            <stop offset="0.55" stopColor="#991b1b" />
            <stop offset="1" stopColor="#450a0a" />
          </linearGradient>
          <linearGradient id="maskFace" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffe0c2" />
            <stop offset="1" stopColor="#d99b78" />
          </linearGradient>
        </defs>
        <path
          d="M44 210C30 178 28 67 53 32 78 1 181 1 207 32c25 35 23 146 9 178H44Z"
          fill="url(#maskHood)"
          stroke="#f87171"
          strokeWidth="3"
        />
        <path
          d="M52 78c18-43 50-59 78-59s61 16 78 59c-22 12-43 18-78 18S74 90 52 78Z"
          fill="#111827"
          opacity=".9"
        />
        <path
          d="M74 69c7-22 23-37 40-46-2 19-10 31-23 43 15-8 28-10 39-10 11 0 25 2 39 10-13-12-21-24-23-43 18 9 34 24 40 46-26 11-86 11-112 0Z"
          fill="#050505"
        />
        <path
          d="M75 81c5-22 25-36 55-36s50 14 55 36l-4 82c-13 28-28 41-51 41s-38-13-51-41l-4-82Z"
          fill="url(#maskFace)"
          stroke="#fecaca"
          strokeWidth="2"
        />
        <path
          d="M82 87c13-12 29-16 48-16 19 0 35 4 48 16l-7 28c-12-9-25-13-41-13s-29 4-41 13l-7-28Z"
          fill="#111827"
        />
        <path
          d="M91 93c10 1 16 4 22 10M169 93c-10 1-16 4-22 10"
          fill="none"
          stroke="#fef2f2"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse cx="112" cy="105" rx="5" ry="3.5" fill="#050505" />
        <ellipse cx="148" cy="105" rx="5" ry="3.5" fill="#050505" />
        <path
          d="M128 109c-2 11-4 20 3 23"
          fill="none"
          stroke="#9a5f4a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M97 143c12 17 50 17 66 0-2 34-15 47-33 47s-31-13-33-47Z"
          fill="#210b0b"
          stroke="#111827"
          strokeWidth="3"
        />
        <path
          d="M104 158c15 9 35 9 52 0"
          fill="none"
          stroke="#fca5a5"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M85 134c-7 11-14 13-21 10M175 134c7 11 14 13 21 10"
          fill="none"
          stroke="#050505"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M60 58c-17 5-28 15-35 31M200 58c17 5 28 15 35 31"
          fill="none"
          stroke="#fca5a5"
          strokeOpacity=".5"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
