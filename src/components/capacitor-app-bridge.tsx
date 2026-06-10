"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const APP_LINK_HOST = "qst-kappa.vercel.app";

function isHandledAppLink(url: URL) {
  return url.host === APP_LINK_HOST && url.pathname.startsWith("/auth/callback");
}

function getSafeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/discover";
}

async function navigateToAppLink(url: string) {
  const nextUrl = new URL(url);

  if (isHandledAppLink(nextUrl)) {
    const code = nextUrl.searchParams.get("code");
    const error = nextUrl.searchParams.get("error");
    const next = getSafeNextPath(nextUrl.searchParams.get("next"));

    if (error) {
      window.location.replace("/?auth=oauth-error");
      return true;
    }

    if (code) {
      const supabase = createSupabaseBrowserClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        window.location.replace("/?auth=oauth-error");
        return true;
      }

      window.location.replace(next);
      return true;
    }

    window.location.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    return true;
  }

  if (nextUrl.host === APP_LINK_HOST) {
    window.location.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    return true;
  }

  return false;
}

export function CapacitorAppBridge() {
  useEffect(() => {
    let removeListener: (() => void) | undefined;

    async function setupAppLinkListener() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      const [{ App }, { Browser }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
      ]);

      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        void Browser.close().catch(() => undefined);
        void navigateToAppLink(url).catch(() => {
          window.location.replace("/?auth=oauth-error");
        });
      });

      const launchUrl = await App.getLaunchUrl();
      if (launchUrl?.url) {
        void navigateToAppLink(launchUrl.url).catch(() => {
          window.location.replace("/?auth=oauth-error");
        });
      }

      removeListener = () => {
        void listener.remove();
      };
    }

    void setupAppLinkListener();

    return () => {
      removeListener?.();
    };
  }, []);

  return null;
}
