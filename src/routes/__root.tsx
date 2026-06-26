import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import logoUrl from "@/assets/wuw-logo.webp?url";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPrompt } from "@/components/InstallPrompt";



function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Wake Up Wednesday — Greater Hartford Branch NAACP" },
      { name: "description", content: "Plain-language information about your home, neighborhood, and life resources in Hartford, CT." },
      { name: "theme-color", content: "#2a2a5c" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Wake Up Wed" },
      { property: "og:title", content: "Wake Up Wednesday — Greater Hartford Branch NAACP" },
      { property: "og:description", content: "Plain-language information about your home, neighborhood, and life resources in Hartford, CT." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Wake Up Wednesday" },

      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Wake Up Wednesday — Greater Hartford Branch NAACP" },
      { name: "twitter:description", content: "Plain-language information about your home, neighborhood, and life resources in Hartford, CT." },
      { property: "og:image", content: "https://wake-up-hartford.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://wake-up-hartford.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "preload", as: "image", href: logoUrl, fetchpriority: "high" },
    ],

    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Wake Up Wednesday",
          url: "https://wake-up-hartford.lovable.app",
          description: "Plain-language information about your home, neighborhood, and life resources in Hartford, CT.",
          publisher: {
            "@type": "Organization",
            name: "Greater Hartford Branch NAACP",
            url: "https://www.naacphartford.org/",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Greater Hartford Branch NAACP",
          url: "https://www.naacphartford.org/",
          areaServed: "Hartford, Connecticut",
          sameAs: ["https://www.naacphartford.org/"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <ThemeToggle />
      <InstallPrompt />

      <Outlet />
      
      <Toaster />
    </QueryClientProvider>
  );
}

function AuthListener() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Drop cached user-scoped data so no protected server fn refetches with a stale enabled flag.
        qc.removeQueries();
      } else {
        qc.invalidateQueries();
      }
      router.invalidate();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
