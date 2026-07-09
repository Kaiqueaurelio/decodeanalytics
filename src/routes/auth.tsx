import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar | Alcateia's Gestão" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);
  const loginEmailId = useId();
  const loginPwdId = useId();
  const signupNameId = useId();
  const signupEmailId = useId();
  const signupPwdId = useId();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAuthViewport = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const keyboardIsOpen =
        !!window.visualViewport && viewportHeight < window.innerHeight - 120;

      document.documentElement.style.setProperty("--auth-viewport-height", `${viewportHeight}px`);
      document.documentElement.classList.toggle("auth-keyboard-open", keyboardIsOpen);
    };

    syncAuthViewport();
    window.visualViewport?.addEventListener("resize", syncAuthViewport);
    window.visualViewport?.addEventListener("scroll", syncAuthViewport);
    window.addEventListener("resize", syncAuthViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncAuthViewport);
      window.visualViewport?.removeEventListener("scroll", syncAuthViewport);
      window.removeEventListener("resize", syncAuthViewport);
      document.documentElement.style.removeProperty("--auth-viewport-height");
      document.documentElement.classList.remove("auth-keyboard-open");
    };
  }, []);

  function keepFocusedInputVisible(input: HTMLInputElement) {
    window.requestAnimationFrame(() => {
      input.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    nav({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Faça login.");
  }

  async function handleReset() {
    if (!email) return toast.error("Informe o e-mail primeiro");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth",
    });
    if (error) return toast.error(error.message);
    toast.success("Link de recuperação enviado.");
  }

  return (
    <div
      className="auth-screen min-h-screen-dvh flex items-center justify-center overflow-x-hidden overflow-y-auto p-3 safe-pt safe-pb sm:p-4"
      style={{ background: "linear-gradient(135deg, #031c18, #074531 58%, #d9a83f)" }}
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
          <TabsList className="grid grid-cols-2 w-full mb-4 h-11">
            <TabsTrigger value="login" className="h-9">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="h-9">Criar conta</TabsTrigger>
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
                  onFocus={(e) => keepFocusedInputVisible(e.currentTarget)}
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
                    onFocus={(e) => keepFocusedInputVisible(e.currentTarget)}
                    required
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:text-foreground"
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
                className="text-sm text-muted-foreground hover:text-primary block w-full text-center mt-2 py-2"
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
                  onFocus={(e) => keepFocusedInputVisible(e.currentTarget)}
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
                  onFocus={(e) => keepFocusedInputVisible(e.currentTarget)}
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
                    onFocus={(e) => keepFocusedInputVisible(e.currentTarget)}
                    required
                    minLength={6}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
