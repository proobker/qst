"use client";

import { useEffect } from "react";

const APP_LINK_HOST = "qst-kappa.vercel.app";

function isHandledAppLink(url: URL) {
  return url.host === APP_LINK_HOST && url.pathname.startsWith("/auth/callback");
}

function navigateToAppLink(url: string) {
  const nextUrl = new URL(url);

  if (isHandledAppLink(nextUrl)) {
    window.location.href = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    return true;
  }

  if (nextUrl.host === APP_LINK_HOST) {
    window.location.href = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
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
        if (navigateToAppLink(url)) {
          void Browser.close();
        }
      });

      const launchUrl = await App.getLaunchUrl();
      if (launchUrl?.url) {
        navigateToAppLink(launchUrl.url);
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
