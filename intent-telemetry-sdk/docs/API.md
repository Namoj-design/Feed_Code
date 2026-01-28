# API Reference

## SDK API

### IntentSDK.init(config)

Initialize the SDK with configuration.

```typescript
IntentSDK.init({
  endpoint: string;              // Required: API endpoint
  batchSize?: number;            // Default: 50
  flushInterval?: number;        // Default: 30000ms
  strictPrivacy?: boolean;       // Default: true
  enableOptOut?: boolean;        // Default: true
  enableAutoTracking?: boolean;  // Default: true
  trackSession?: boolean;        // Default: true
  trackNavigation?: boolean;     // Default: true
  trackInteractions?: boolean;   // Default: true
  trackPerformance?: boolean;    // Default: true
  sessionTimeout?: number;       // Default: 1800000ms (30min)
  debug?: boolean;               // Default: false
});
```

### IntentSDK.getInstance()

Get the singleton SDK instance.

```typescript
const sdk = IntentSDK.getInstance();
```

### IntentSDK.trackEvent(type, data)

Manually track a custom event.

```typescript
await sdk.trackEvent('action.click', {
  elementId: 'buy-button',
  elementText: 'Purchase Now'
});
```

### IntentSDK.getSessionId()

Get the current session ID.

```typescript
const sessionId = sdk.getSessionId();
```

### IntentSDK.flush()

Manually flush buffered events.

```typescript
await sdk.flush();
```

### IntentSDK.optOut()

Opt the user out of tracking.

```typescript
sdk.optOut();
```

### IntentSDK.optIn()

Opt the user back into tracking.

```typescript
sdk.optIn();
```

### IntentSDK.destroy()

Clean up and destroy the SDK instance.

```typescript
sdk.destroy();
```

## Intelligence Layer API

### POST /api/v1/events/batch

Ingest a batch of events.

**Request:**
```json
{
  "events": [
    {
      "type": "session.start",
      "timestamp": 1706500000000,
      "sessionId": "uuid",
      "data": {}
    }
  ]
}
```

**Response:**
```json
{
  "received": 1,
  "processed": 1,
  "stats": {
    "sessions": 1,
    "events": 1
  }
}
```

### GET /api/v1/insights/{session_id}

Get insights for a specific session.

**Response:**
```json
{
  "sessionId": "uuid",
  "duration": 120000,
  "eventCount": 25,
  "frictionPatterns": [
    {
      "type": "performance_degradation",
      "severity": "medium",
      "instances": 2,
      "description": "Slow page loads detected"
    }
  ],
  "intentHypotheses": [
    {
      "hypothesis": "Complete purchase",
      "confidence": 0.85,
      "supportingEvidence": ["Added items", "Viewed cart"]
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "category": "performance",
      "action": "Optimize page load time",
      "rationale": "2 slow loads >3s detected",
      "confidence": 0.9
    }
  ],
  "summary": "User attempted checkout but encountered friction"
}
```

### GET /api/v1/insights

Get aggregated insights across all sessions.

**Query Parameters:**
- `limit`: Number of sessions (default: 10)

**Response:**
```json
{
  "totalSessions": 100,
  "totalEvents": 5000,
  "topFrictionPatterns": [
    {
      "type": "form_abandonment",
      "frequency": 45,
      "averageSeverity": "high"
    }
  ],
  "commonIntents": [
    {
      "intent": "Browse products",
      "frequency": 60
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Event Types

### Session Lifecycle

- `session.start`: User starts a new session
- `session.resume`: User returns to the site
- `session.pause`: User goes idle
- `session.end`: Session concludes

### Navigation

- `view.load`: Page loads
- `view.transition`: View changes
- `nav.reversal`: User navigates backward
- `nav.back`: Back button click
- `nav.forward`: Forward button click

### Interactions

- `action.click`: Element clicked
- `action.focus`: Element focused
- `action.input`: Text input
- `action.submit`: Form submitted

### Performance

- `performance.load`: Page load metrics
- `performance.slow_interaction`: Slow response

### Friction

- `friction.rapid_click`: Rapid repeated clicks
- `friction.error`: JavaScript error
- `friction.form_abandonment`: Incomplete form
