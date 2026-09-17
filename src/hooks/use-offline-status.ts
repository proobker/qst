"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const OFFLINE_CHECK_PATH = "/offline-check.json";
const RETRY_INTERVAL_MS = 8000;
const VERIFY_TIMEOUT_MS = 4000;

function canReadNavigator(): boolean {
  return typeof navigator !== "undefined" && "onLine" in navigator;
}

async function verifyOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(OFFLINE_CHECK_PATH, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    canReadNavigator() ? navigator.onLine : true,
  );
  const [isChecking, setIsChecking] = useState(false);
  const isOnlineRef = useRef(isOnline);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const retry = useCallback(async () => {
    setIsChecking(true);
    const verified = await verifyOnline();
    setIsChecking(false);
    setIsOnline(verified);
    return verified;
  }, []);

  useEffect(() => {
    if (!canReadNavigator()) {
      return;
    }

    let disposed = false;
    const connection = (
      navigator as Navigator & { connection?: EventTarget }
    ).connection;

    const handleRestore = async (silent: boolean) => {
      if (!silent) {
        setIsChecking(true);
      }
      const verified = await verifyOnline();
      if (disposed) {
        return;
      }
      if (!silent) {
        setIsChecking(false);
      }
      setIsOnline(verified);
    };

    const goOffline = () => {
      setIsOnline(false);
    };

    const onConnectionChange = () => {
      if (canReadNavigator() && navigator.onLine) {
        void handleRestore(false);
      } else {
        setIsOnline(false);
      }
    };

    window.addEventListener("online", onConnectionChange);
    window.addEventListener("offline", goOffline);
    connection?.addEventListener?.("change", onConnectionChange);

    const retryTimer = window.setInterval(() => {
      if (disposed) {
        return;
      }
      if (!canReadNavigator()) {
        return;
      }
      if (!isOnlineRef.current && navigator.onLine) {
        void handleRestore(true);
      }
    }, RETRY_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(retryTimer);
      window.removeEventListener("online", onConnectionChange);
      window.removeEventListener("offline", goOffline);
      connection?.removeEventListener?.("change", onConnectionChange);
    };
  }, []);

  return { isOnline, isChecking, retry };
}