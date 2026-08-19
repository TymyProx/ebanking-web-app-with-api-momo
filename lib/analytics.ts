"use client";

import { getApiBaseUrl } from "./api-url";
import { TENANT_ID } from "./config";

const BUFFER_SIZE = 15;
const FLUSH_INTERVAL_MS = 30000;

interface AnalyticsEvent {
  eventType: string;
  eventCategory: string;
  eventData: Record<string, any>;
  platform: string;
  sessionId: string;
  userId?: string;
  clientId?: string;
}

class WebAnalyticsService {
  private buffer: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private clientId: string | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private currentPage: string | null = null;
  private pageStartTime: number | null = null;

  constructor() {
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  init(userId?: string, clientId?: string) {
    this.userId = userId || null;
    this.clientId = clientId || null;
    this.startFlushTimer();
    this.trackEvent("session_start", "auth", {});

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.trackEvent("session_end", "auth", {});
        this.flushSync();
      });
    }
  }

  destroy() {
    this.trackEvent("session_end", "auth", {});
    this.flush();
    this.stopFlushTimer();
  }

  trackEvent(eventType: string, eventCategory: string, eventData: Record<string, any> = {}) {
    this.buffer.push({
      eventType,
      eventCategory,
      eventData,
      platform: "eportal",
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      clientId: this.clientId || undefined,
    });

    if (this.buffer.length >= BUFFER_SIZE) {
      this.flush();
    }
  }

  trackPageView(pathname: string) {
    const now = Date.now();

    if (this.currentPage && this.pageStartTime) {
      this.trackEvent("page_view", "navigation", {
        screen: this.currentPage,
        duration_ms: now - this.pageStartTime,
      });
    }

    this.currentPage = pathname;
    this.pageStartTime = now;
  }

  trackLogin(method: string, success: boolean) {
    this.trackEvent("login", "auth", { method, success });
  }

  trackTransaction(type: string, amount: number, currency: string, accountId: string) {
    this.trackEvent("transaction", "banking", { type, amount, currency, accountId });
  }

  trackProductView(productId: string, productType: string) {
    this.trackEvent("product_view", "commercial", { productId, productType });
  }

  trackFeatureUse(feature: string, action: string) {
    this.trackEvent("feature_use", "navigation", { feature, action });
  }

  trackSearch(query: string, resultsCount: number) {
    this.trackEvent("search", "navigation", { query, results_count: resultsCount });
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];

    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      await fetch(`${getApiBaseUrl()}/tenant/${TENANT_ID}/analytics/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ data: events }),
      });
    } catch {
      this.buffer = [...events, ...this.buffer];
    }
  }

  private flushSync() {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];

    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      const blob = new Blob(
        [JSON.stringify({ data: events })],
        { type: "application/json" },
      );
      navigator.sendBeacon(
        `${getApiBaseUrl()}/tenant/${TENANT_ID}/analytics/events`,
        blob,
      );
    } catch {
      // best effort
    }
  }

  private startFlushTimer() {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const analytics = new WebAnalyticsService();

// React hook for page view tracking
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function useTrackPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname);
    }
  }, [pathname]);
}
