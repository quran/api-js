import type {
  AnalyticsBatchAccepted,
  AnalyticsBatchRequest,
  AnalyticsEvent,
  OperationRequest,
} from "@/types";

type RawOperation = (request?: OperationRequest) => Promise<unknown>;

const optionalField = <T>(value: T | undefined, key: string) =>
  value === undefined ? {} : { [key]: value };

const toAnalyticsEventBody = (event: AnalyticsEvent) => ({
  event_id: event.eventId,
  name: event.name,
  occurred_at:
    event.occurredAt instanceof Date
      ? event.occurredAt.toISOString()
      : event.occurredAt,
  version: event.version,
  ...optionalField(event.actionId, "action_id"),
  ...optionalField(event.anonymousId, "anonymous_id"),
  ...optionalField(event.properties, "properties"),
  ...optionalField(event.sessionId, "session_id"),
  ...optionalField(event.userId, "user_id"),
});

export const createAnalyticsFacade = (raw: Record<string, RawOperation>) => ({
  events: {
    submit: (request: AnalyticsBatchRequest) =>
      raw.submitAnalyticsEvents!({
        body: {
          events: request.events.map(toAnalyticsEventBody),
        },
      }) as Promise<AnalyticsBatchAccepted>,
  },
  raw,
});
