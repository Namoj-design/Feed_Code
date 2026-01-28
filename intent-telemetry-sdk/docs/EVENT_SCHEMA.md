# Event Schema Documentation

Version: 1.0.0

## Overview

All events follow a standardized schema with versioning support for forward compatibility. Every event includes:
- Base event metadata (ID, session, timestamp, sequence)
- Contextual information (URL, viewport, device)
- Event-specific data payload

## Base Event Structure

```typescript
{
  schemaVersion: "1.0.0",        // Semantic version
  type: EventType,               // Event type enum
  eventId: string,               // UUID v4
  sessionId: string,             // Anonymous session ID
  timestamp: string,             // ISO 8601 timestamp
  sequenceNumber: number,        // Sequential event number
  context: EventContext,         // Contextual metadata
  data: object                   // Event-specific payload
}
```

## Context Object

Captured automatically with every event:

```typescript
{
  url: string,                   // Sanitized URL (PII removed)
  pageTitle: string,             // Document title
  viewport: {
    width: number,
    height: number
  },
  device: {
    type: "mobile" | "tablet" | "desktop" | "unknown",
    touchEnabled: boolean
  },
  userAgent: string              // Anonymized if strictPrivacy=true
}
```

## Event Types

### Session Lifecycle

#### `session.start`
Fired when a new session begins.

```json
{
  "type": "session.start",
  "data": {
    "entryPoint": "https://referrer.com",
    "landingPage": "https://app.com/home"
  }
}
```

#### `session.resume`
Fired when user returns after pause (visibility change, focus).

```json
{
  "type": "session.resume",
  "data": {
    "pauseDuration": 15000
  }
}
```

#### `session.pause`
Fired when tab becomes hidden or window loses focus.

```json
{
  "type": "session.pause",
  "data": {
    "reason": "visibility" | "blur" | "beforeunload"
  }
}
```

#### `session.end`
Fired when session terminates.

```json
{
  "type": "session.end",
  "data": {
    "duration": 120000,
    "eventCount": 45
  }
}
```

### Navigation

#### `view.transition`
Fired on page navigation or SPA route change.

```json
{
  "type": "view.transition",
  "data": {
    "from": "/products",
    "to": "/cart",
    "method": "pushState" | "replaceState" | "popState" | "navigation"
  }
}
```

#### `navigation.back`
Fired on back button navigation.

```json
{
  "type": "navigation.back",
  "data": {
    "from": "/cart",
    "to": "/products"
  }
}
```

#### `navigation.forward`
Fired on forward button navigation.

```json
{
  "type": "navigation.forward",
  "data": {
    "from": "/products",
    "to": "/cart"
  }
}
```

### User Interactions

#### `action.click`
Fired on element click.

```json
{
  "type": "action.click",
  "data": {
    "target": "button.btn-primary",
    "targetText": "Add to Cart",
    "coordinates": { "x": 150, "y": 200 },
    "outcome": "success" | "error" | "no_effect" | "unknown"
  }
}
```

#### `action.submit`
Fired on form submission.

```json
{
  "type": "action.submit",
  "data": {
    "formId": "checkout-form",
    "fieldCount": 5,
    "timeSpent": 45000,
    "outcome": "success" | "error" | "no_effect" | "unknown"
  }
}
```

#### `action.focus`
Fired when element receives focus.

```json
{
  "type": "action.focus",
  "data": {
    "elementType": "input",
    "method": "click" | "tab" | "programmatic"
  }
}
```

#### `action.input`
Fired on input/textarea changes.

```json
{
  "type": "action.input",
  "data": {
    "fieldType": "email",
    "characterCount": 15,
    "duration": 5000
  }
}
```

### Performance

#### `performance.load`
Fired when page load completes.

```json
{
  "type": "performance.load",
  "data": {
    "loadTime": 2500,
    "domContentLoaded": 1200,
    "firstContentfulPaint": 800,
    "largestContentfulPaint": 1500
  }
}
```

#### `performance.latency`
Fired when interaction latency exceeds threshold.

```json
{
  "type": "performance.latency",
  "data": {
    "operation": "click",
    "latency": 1500,
    "threshold": 1000
  }
}
```

### Friction Indicators

#### `friction.rapid_click`
Fired when user rapidly clicks same element (suggests confusion).

```json
{
  "type": "friction.rapid_click",
  "data": {
    "target": "button.submit",
    "clickCount": 5,
    "timeWindow": 2000
  }
}
```

#### `friction.navigation_reversal`
Fired when user quickly navigates back (suggests unmet expectations).

```json
{
  "type": "friction.navigation_reversal",
  "data": {
    "navigatedTo": "/checkout",
    "timeOnPage": 1500,
    "returnedTo": "/cart"
  }
}
```

#### `friction.error`
Fired when JavaScript error or API failure occurs.

```json
{
  "type": "friction.error",
  "data": {
    "errorType": "NetworkError",
    "message": "Request failed",
    "errorContext": "/api/checkout"
  }
}
```

#### `friction.form_abandonment`
Fired when user leaves partially completed form.

```json
{
  "type": "friction.form_abandonment",
  "data": {
    "formId": "checkout-form",
    "fieldsCompleted": 2,
    "totalFields": 5,
    "timeSpent": 30000
  }
}
```

## Event Batching

Events are transmitted in batches:

```json
{
  "schemaVersion": "1.0.0",
  "batchId": "uuid-v4",
  "timestamp": "2024-01-28T18:00:00Z",
  "events": [
    { /* event 1 */ },
    { /* event 2 */ },
    // ... up to batchSize events
  ]
}
```

## Privacy Considerations

### Automatic PII Redaction

The SDK automatically redacts:
- Email addresses → `[REDACTED_EMAIL]`
- Phone numbers → `[REDACTED_PHONE]`
- Credit card numbers → `[REDACTED_CC]`
- SSN → `[REDACTED_SSN]`
- IP addresses → `[REDACTED_IP]`
- Sensitive URL params → `?token=[REDACTED]`

### Sanitized Selectors

Element selectors remove:
- IDs (could contain user data)
- Data attributes
- Specific attribute values

Example:
```
#user-123 .item[data-id="456"] → .item
```

## Versioning

Schema follows semantic versioning (semver):

- **Major**: Breaking changes to event structure
- **Minor**: New event types or optional fields
- **Patch**: Bug fixes, documentation

Intelligence layer validates schema compatibility and can handle minor version differences.

## Custom Events (Advanced)

For manual tracking:

```typescript
sdk.trackEvent('custom.event_name', {
  // Your custom data
  customField1: 'value',
  customField2: 123
});
```

Note: Custom events still include base metadata and privacy filtering.
