import { useCallback, useEffect, useRef } from "react";
import { sendInteractions, sendInteractionsBeacon } from "../services/interactions";

type TrackedEvent = {
  event_type: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

const FLUSH_INTERVAL_MS = 10_000;

export function useInteractionTracker(slug: string | undefined) {
  const sessionIdRef = useRef(crypto.randomUUID());
  const bufferRef = useRef<TrackedEvent[]>([]);
  const mountTimeRef = useRef(Date.now());

  const flush = useCallback(() => {
    if (!slug || bufferRef.current.length === 0) return;
    const events = [...bufferRef.current];
    bufferRef.current = [];
    sendInteractions(slug, sessionIdRef.current, events);
  }, [slug]);

  const flushBeacon = useCallback(() => {
    if (!slug || bufferRef.current.length === 0) return;
    const events = [...bufferRef.current];
    bufferRef.current = [];
    sendInteractionsBeacon(slug, sessionIdRef.current, events);
  }, [slug]);

  const trackEvent = useCallback(
    (eventType: string, payload: Record<string, unknown> = {}) => {
      bufferRef.current.push({
        event_type: eventType,
        payload,
        timestamp: new Date().toISOString(),
      });
    },
    []
  );

  // Periodic flush
  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [flush]);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => {
      // Add session_end event before flushing
      const durationSeconds = Math.round((Date.now() - mountTimeRef.current) / 1000);
      bufferRef.current.push({
        event_type: "session_end",
        payload: { duration_seconds: durationSeconds },
        timestamp: new Date().toISOString(),
      });
      flushBeacon();
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleUnload();
      }
    });
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [flushBeacon]);

  return { trackEvent, sessionId: sessionIdRef.current };
}
