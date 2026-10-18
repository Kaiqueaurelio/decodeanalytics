import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { installAnalytics } from "@/lib/analytics";
import { SafeAreaDebug } from "@/components/SafeAreaDebug";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080c16] px-4 text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow font-black text-[#080c16] shadow-2xl shadow-brand-yellow/20 text-2xl mb-8">
        A
      </div>
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-black tracking-tighter text-white">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-white/90">Página não encontrada</h2>
        <p className="mt-2 text-sm text-white/40">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-yellow px-8 text-sm font-bold text-[#080c16] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-yellow/10"
          >
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: "Decode Analytics Gestão" },
      { name: "description", content: "Sistema de gestão para a Decode Analytics Produções Gráficas" },
      { name: "author", content: "Decode Analytics" },
      { property: "og:title", content: "Decode Analytics Gestão" },
      {
        property: "og:description",
        content: "Sistema de gestão para a Decode Analytics Produções Gráficas",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Decode Analytics Gestão" },
      {
        name: "twitter:description",
        content: "Sistema de gestão para a Decode Analytics Produções Gráficas",
      },
      { property: "og:image", content: "/brand/app-icon-full.png" },
      { name: "twitter:image", content: "/brand/app-icon-full.png" },
      { name: "theme-color", content: "#172554" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      // "default" faz o iOS reservar a área do notch/status bar automaticamente,
      // evitando que o conteúdo do PWA suba pra baixo da barra de status.
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Decode Analytics" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/brand/app-icon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    installAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Outlet />
            <Toaster richColors position="top-right" />
            <SafeAreaDebug />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
