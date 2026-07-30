import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { mapApiError } from "@/lib/api-errors";
import { emitAuthTelemetry, trackInputFocus } from "@/lib/auth-telemetry";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar | Alcateia's Gestão" }] }),
  component: AuthPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Record<string, string>;

function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Informe o e-mail.";
  if (email.length > 255) return "E-mail muito longo (máx. 255 caracteres).";
  if (!EMAIL_RE.test(email)) return "E-mail em formato inválido.";
  return null;
}

function validatePassword(value: string, min = 8): string | null {
  if (!value) return "Informe a senha.";
  if (value.length < min) return `A senha precisa ter pelo menos ${min} caracteres.`;
  return null;
}

/** Mensagens neutras: nunca repassa o texto cru do provedor. */
function friendlyAuthError(err: unknown): string {
  const raw = String((err as { message?: string })?.message ?? err ?? "").toLowerCase();
  if (raw.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (raw.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (raw.includes("already registered") || raw.includes("already been registered"))
    return "Se este e-mail for válido, você receberá um link de confirmação.";
  if (raw.includes("too many") || raw.includes("rate limit"))
    return "Muitas tentativas. Aguarde alguns instantes e tente de novo.";
  return mapApiError(err).message;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Errors>({});
  const [signupErrors, setSignupErrors] = useState<Errors>({});
  const [showPwd, setShowPwd] = useState(false);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);
  const loginEmailId = useId();
  const loginPwdId = useId();
  const signupNameId = useId();
  const signupEmailId = useId();
  const signupPwdId = useId();
  const signupConfirmId = useId();

  useEffect(() => {
    emitAuthTelemetry("auth_page_view");
  }, []);

  const loginEmailTrack = trackInputFocus("login-email");
  const loginPwdTrack = trackInputFocus("login-password");
  const signupNameTrack = trackInputFocus("signup-name");
  const signupEmailTrack = trackInputFocus("signup-email");
  const signupPwdTrack = trackInputFocus("signup-password");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const errs: Errors = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const pwdErr = validatePassword(password, 1);
    if (pwdErr) errs.password = pwdErr;
    setLoginErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Verifique os campos", { description: Object.values(errs)[0] });
      return;
    }

    emitAuthTelemetry("auth_submit_attempt", { form: "login" });
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success("Bem-vindo!");
      nav({ to: "/dashboard" });
    } catch (err) {
      const message = friendlyAuthError(err);
      emitAuthTelemetry("auth_submit_error", { form: "login", errorMessage: message });
      setLoginErrors({ form: message });
      toast.error("Não foi possível entrar", { description: message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const errs: Errors = {};
    const name = fullName.trim();
    if (!name) errs.name = "Informe seu nome.";
    else if (name.length > 100) errs.name = "Nome muito longo (máx. 100 caracteres).";
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const pwdErr = validatePassword(password, 8);
    if (pwdErr) errs.password = pwdErr;
    if (!confirmPassword) errs.confirm = "Confirme a senha.";
    else if (confirmPassword !== password) errs.confirm = "As senhas não são iguais.";
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Verifique os campos", { description: Object.values(errs)[0] });
      return;
    }

    emitAuthTelemetry("auth_submit_attempt", { form: "signup" });
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Conta criada!", { description: "Confirme seu e-mail e faça login." });
      setConfirmPassword("");
      setPassword("");
    } catch (err) {
      const message = friendlyAuthError(err);
      emitAuthTelemetry("auth_submit_error", { form: "signup", errorMessage: message });
      setSignupErrors({ form: message });
      toast.error("Não foi possível criar a conta", { description: message });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setLoginErrors((p) => ({ ...p, email: emailErr }));
      toast.error("Verifique o e-mail", { description: emailErr });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/auth",
      });
      if (error) throw error;
      toast.success("Se este e-mail existir, enviamos um link de recuperação.");
    } catch (err) {
      toast.error("Não foi possível enviar o link", { description: friendlyAuthError(err) });
    }
  }

  return (
    <div
      className="auth-screen min-h-screen-dvh flex items-center justify-center overflow-x-hidden p-3 safe-pt safe-pb sm:p-4"
      style={{ background: "linear-gradient(135deg, var(--surface-dark), var(--brand-blue) 58%, var(--gold))" }}
    >
      <div className="auth-card w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <img
            src="/brand/alcateia-logo.png"
            alt="Alcateia's Produções Gráficas - Criando impacto a cada imagem"
            className="auth-logo mx-auto mb-3 h-24 w-auto max-w-full object-contain sm:mb-4 sm:h-36 md:h-44"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Alcateia's Gestão</h1>
          <p className="text-sm text-muted-foreground">Sistema de gestão da produção gráfica</p>
        </div>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full mb-4 h-12">
            <TabsTrigger value="login" className="h-10 text-base">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="h-10 text-base">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form method="post" onSubmit={handleLogin} noValidate className="space-y-3">
              {loginErrors.form && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                >
                  {loginErrors.form}
                </p>
              )}
              <div>
                <Label htmlFor={loginEmailId}>E-mail</Label>
                <Input
                  id={loginEmailId}
                  name="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  enterKeyHint="next"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPointerDown={loginEmailTrack.onPointerDown}
                  onFocus={loginEmailTrack.onFocus}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loginPasswordRef.current?.focus();
                  }}
                  required
                  aria-invalid={Boolean(loginErrors.email)}
                  aria-describedby={loginErrors.email ? `${loginEmailId}-error` : undefined}
                />
                <FieldError id={`${loginEmailId}-error`} message={loginErrors.email} />
              </div>
              <div>
                <Label htmlFor={loginPwdId}>Senha</Label>
                <div className="relative">
                  <Input
                    ref={loginPasswordRef}
                    id={loginPwdId}
                    name="current-password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onPointerDown={loginPwdTrack.onPointerDown}
                    onFocus={loginPwdTrack.onFocus}
                    required
                    aria-invalid={Boolean(loginErrors.password)}
                    aria-describedby={loginErrors.password ? `${loginPwdId}-error` : undefined}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPwd}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError id={`${loginPwdId}-error`} message={loginErrors.password} />
              </div>
              <Button type="submit" disabled={loading} className="w-full min-h-12 text-base">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-primary block w-full min-h-11 rounded-md text-center mt-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Esqueci minha senha
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form method="post" onSubmit={handleSignup} noValidate className="space-y-3">
              {signupErrors.form && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                >
                  {signupErrors.form}
                </p>
              )}
              <div>
                <Label htmlFor={signupNameId}>Nome</Label>
                <Input
                  id={signupNameId}
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  inputMode="text"
                  enterKeyHint="next"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onPointerDown={signupNameTrack.onPointerDown}
                  onFocus={signupNameTrack.onFocus}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") signupEmailRef.current?.focus();
                  }}
                  required
                  maxLength={100}
                  aria-invalid={Boolean(signupErrors.name)}
                  aria-describedby={signupErrors.name ? `${signupNameId}-error` : undefined}
                />
                <FieldError id={`${signupNameId}-error`} message={signupErrors.name} />
              </div>
              <div>
                <Label htmlFor={signupEmailId}>E-mail</Label>
                <Input
                  ref={signupEmailRef}
                  id={signupEmailId}
                  name="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  enterKeyHint="next"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPointerDown={signupEmailTrack.onPointerDown}
                  onFocus={signupEmailTrack.onFocus}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") signupPasswordRef.current?.focus();
                  }}
                  required
                  maxLength={255}
                  aria-invalid={Boolean(signupErrors.email)}
                  aria-describedby={signupErrors.email ? `${signupEmailId}-error` : undefined}
                />
                <FieldError id={`${signupEmailId}-error`} message={signupErrors.email} />
              </div>
              <div>
                <Label htmlFor={signupPwdId}>Senha</Label>
                <div className="relative">
                  <Input
                    ref={signupPasswordRef}
                    id={signupPwdId}
                    name="new-password"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onPointerDown={signupPwdTrack.onPointerDown}
                    onFocus={signupPwdTrack.onFocus}
                    required
                    minLength={8}
                    aria-invalid={Boolean(signupErrors.password)}
                    aria-describedby={`${signupPwdId}-hint${signupErrors.password ? ` ${signupPwdId}-error` : ""}`}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPwd}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p id={`${signupPwdId}-hint`} className="mt-1 text-xs text-muted-foreground">
                  Mínimo de 8 caracteres.
                </p>
                <FieldError id={`${signupPwdId}-error`} message={signupErrors.password} />
              </div>
              <div>
                <Label htmlFor={signupConfirmId}>Confirmar senha</Label>
                <Input
                  id={signupConfirmId}
                  name="confirm-password"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  type={showPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  aria-invalid={Boolean(signupErrors.confirm)}
                  aria-describedby={signupErrors.confirm ? `${signupConfirmId}-error` : undefined}
                />
                <FieldError id={`${signupConfirmId}-error`} message={signupErrors.confirm} />
              </div>
              <Button type="submit" disabled={loading} className="w-full min-h-12 text-base">
                {loading ? "Criando..." : "Criar conta"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                A primeira conta criada vira administrador automaticamente.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
