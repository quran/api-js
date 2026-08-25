/** A JSON value accepted in an analytics event's properties object. */
export type AnalyticsJsonValue =
  | boolean
  | null
  | number
  | string
  | AnalyticsJsonValue[]
  | { [key: string]: AnalyticsJsonValue };

export interface AnalyticsEvent {
  /** Stable caller-generated ID. Reuse it when retrying this event. */
  eventId: string;
  /** Namespaced event name, for example `quran.reader.verse_viewed`. */
  name: string;
  /** When the event happened. Date values are serialized as RFC 3339. */
  occurredAt: Date | string;
  /** Version of this event's property structure, starting at 1. */
  version: number;
  /** Optional ID linking the event to a specific action. */
  actionId?: null | string;
  /** Application-generated ID for a person who is not signed in. */
  anonymousId?: null | string;
  /** Event-specific JSON. Caller-defined property names are preserved. */
  properties?: { [key: string]: AnalyticsJsonValue };
  /** Application-generated ID grouping events from one usage session. */
  sessionId?: null | string;
  /** Quran Foundation OAuth user ID. Do not send an application-local ID. */
  userId?: null | string;
}

export interface AnalyticsBatchRequest {
  /** The API accepts between 1 and 100 events as one all-or-nothing batch. */
  events: AnalyticsEvent[];
}

export interface AnalyticsBatchAccepted {
  /** Number of accepted events; this equals the submitted count on HTTP 202. */
  accepted: number;
  /** Server-generated identifier shared by all events in this batch. */
  batchId: string;
}
