import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { emitAuthTelemetry, trackInputFocus } from "@/lib/auth-telemetry";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar | Decode Analytics Gestão" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);
  const loginEmailId = useId();
  const loginPwdId = useId();
  const signupNameId = useId();
  const signupEmailId = useId();
  const signupPwdId = useId();
  const recoveryPwdId = useId();
  const recoveryConfirmPwdId = useId();

  // Recovery links must never point to localhost when requested from a local
  // preview or development server. The email link is opened on another device
  // or after the local server has stopped, which otherwise causes ERR_CONNECTION_REFUSED.
  function getAuthRedirectUrl() {
    const hostname = window.location.hostname;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    const origin = isLocal ? "https://decodeanalyticsdev.vercel.app" : window.location.origin;
    return `${origin}/auth`;
  }

  useEffect(() => {
    emitAuthTelemetry("auth_page_view");

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const recoveryLink =
      hashParams.get("type") === "recovery" ||
      queryParams.get("type") === "recovery" ||
      queryParams.has("code");

    if (recoveryLink) {
      setIsRecovery(true);
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user.email) setEmail(data.session.user.email);
      });
    }

    const errorDescription =
      hashParams.get("error_description") ?? queryParams.get("error_description");
    if (errorDescription) {
      toast.error("Este link de recuperação expirou ou não é válido. Solicite outro.");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        if (session?.user.email) setEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginEmailTrack = trackInputFocus("login-email");
  const loginPwdTrack = trackInputFocus("login-password");
  const signupNameTrack = trackInputFocus("signup-name");
  const signupEmailTrack = trackInputFocus("signup-email");
  const signupPwdTrack = trackInputFocus("signup-password");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    emitAuthTelemetry("auth_submit_attempt", { form: "login" });
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      emitAuthTelemetry("auth_submit_error", { form: "login", errorMessage: error.message });
      return toast.error(error.message);
    }

    // The connected Supabase project uses profiles.role/is_active (not user_roles).
    // Check the actual schema to avoid signing valid users out due to a missing table.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.is_active === false || !profile.role || profile.role === "user" || profile.role === "aguardando_aprovacao") {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.info("O acesso à equipe ainda aguarda aprovação de um administrador.");
    }

    setLoading(false);
    toast.success("Bem-vindo!");
    nav({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    emitAuthTelemetry("auth_submit_attempt", { form: "signup" });
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: getAuthRedirectUrl() },
    });
    setLoading(false);
    if (error) {
      emitAuthTelemetry("auth_submit_error", { form: "signup", errorMessage: error.message });
      return toast.error(error.message);
    }
    if (data.session) await supabase.auth.signOut();
    toast.success("Cadastro criado. Entre para verificar as permissões da sua conta.");
  }

  async function handleReset() {
    if (!email) return toast.error("Informe o e-mail primeiro");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl(),
    });
    if (error) return toast.error(error.message);
    toast.success("Link de recuperação enviado.");
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);

    await supabase.auth.signOut();
    setIsRecovery(false);
    setPassword("");
    setConfirmPassword("");
    window.history.replaceState({}, document.title, window.location.pathname);
    toast.success("Senha redefinida. Entre com sua nova senha.");
  }

  return (
    <div
      className="auth-screen min-h-screen-dvh flex items-center justify-center overflow-x-hidden p-3 safe-pt safe-pb sm:p-4"
      style={{ background: "linear-gradient(135deg, #0B1026 0%, #10275A 58%, #087CF0 100%)" }}
    >
      <div className="auth-card w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <img
            src="/brand/decode-logo.png"
            alt="Decode Analytics — Design & Soluções"
            className="brand-logo auth-logo mx-auto mb-3 h-24 w-auto max-w-full rounded-xl bg-black p-2 object-contain sm:mb-4 sm:h-36 md:h-44"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Decode Analytics Gestão</h1>
          <p className="text-sm text-muted-foreground">Design & soluções digitais para o seu negócio</p>
        </div>
        <Tabs defaultValue="login" className={isRecovery ? "hidden" : undefined}>
          <TabsList className="grid grid-cols-2 w-full mb-4 h-12">
            <TabsTrigger value="login" className="h-10 text-base">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="signup" className="h-10 text-base">
              Criar conta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3">
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
                />
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
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full min-h-12 text-base">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-primary block w-full min-h-11 text-center mt-2 py-2 transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3">
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
                />
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
                />
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
                    enterKeyHint="go"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onPointerDown={signupPwdTrack.onPointerDown}
                    onFocus={signupPwdTrack.onFocus}
                    required
                    minLength={6}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full min-h-12 text-base">
                {loading ? "Criando..." : "Criar conta"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                O acesso às áreas internas depende das permissões liberadas para a conta.
              </p>
            </form>
          </TabsContent>
        </Tabs>
        {isRecovery && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Criar nova senha</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Defina uma senha nova para sua conta.
              </p>
            </div>
            <div>
              <Label htmlFor={recoveryPwdId}>Nova senha</Label>
              <Input
                id={recoveryPwdId}
                name="new-password"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div>
              <Label htmlFor={recoveryConfirmPwdId}>Confirme a nova senha</Label>
              <Input
                id={recoveryConfirmPwdId}
                name="confirm-new-password"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPwd((visible) => !visible)}
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
              className="min-h-11 text-sm text-muted-foreground hover:text-primary"
            >
              {showPwd ? "Ocultar senhas" : "Mostrar senhas"}
            </button>
            <Button type="submit" disabled={loading} className="w-full min-h-12 text-base">
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
