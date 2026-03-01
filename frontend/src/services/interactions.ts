import { API_BASE_URL } from "../config/api";

type InteractionEvent = {
  event_type: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

export function sendInteractions(
  slug: string,
  sessionId: string,
  events: InteractionEvent[]
): void {
  if (events.length === 0) return;
  fetch(`${API_BASE_URL}/api/v1/menu/${encodeURIComponent(slug)}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, events }),
  }).catch(() => {
    // Silently fail — analytics should not break the menu
  });
}

export function sendInteractionsBeacon(
  slug: string,
  sessionId: string,
  events: InteractionEvent[]
): void {
  if (events.length === 0) return;
  const blob = new Blob(
    [JSON.stringify({ session_id: sessionId, events })],
    { type: "application/json" }
  );
  navigator.sendBeacon(
    `${API_BASE_URL}/api/v1/menu/${encodeURIComponent(slug)}/interactions`,
    blob
  );
}
