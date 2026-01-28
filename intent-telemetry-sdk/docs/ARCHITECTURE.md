## Architecture Overview

The Intent Telemetry SDK consists of three main components:

### 1. TypeScript SDK (Client-Side)

```
sdk/
├── src/
│   ├── types/        # Event schema and versioning
│   ├── privacy/      # PII filtering and anonymization
│   ├── core/         # Event collection, buffering, transmission
│   └── trackers/     # Auto-tracking modules
└── dist/             # Compiled bundles
```

**Key Features:**
- Type-safe event system
- Automatic privacy filtering
- localStorage persistence
- Exponential backoff retry logic
- Zero dependencies

### 2. Python Intelligence Layer (Server-Side)

```
intelligence/
├── src/
│   ├── models/       # Pydantic data models
│   ├── analysis/     # Session reconstruction, friction detection, AI inference
│   └── api/          # FastAPI endpoints
```

**Key Features:**
- Session reconstruction from events
- 4 friction pattern classifiers
- GPT-4-powered intent inference
- Confidence-scored insights
- RESTful API

### 3. Data Flow

```
Browser → SDK → Buffer → Transmitter → API → Analysis → Insights
```

1. **Collection**: Auto-trackers capture user interactions
2. **Privacy**: PII filtered client-side
3. **Buffering**: Events batched in localStorage
4. **Transmission**: Sent to API with retry logic
5. **Analysis**: AI processes sessions for insights
6. **Delivery**: Actionable recommendations returned

### Event Schema

18 standardized event types across 5 categories:
- Session Lifecycle (start, resume, pause, end)
- Navigation (view, transition, reversal, back/forward)
- Interactions (click, focus, input, form submit/abandon)
- Performance (page load, slow interaction, resource timing)
- Friction (rapid clicks, errors)

### Privacy Architecture

**Client-Side Protection:**
- Regex-based PII detection (email, phone, SSN, etc.)
- CSS selector sanitization
- Anonymous session IDs (UUID v4)
- User agent anonymization

**Server-Side Safeguards:**
- No raw event storage
- Aggregated metrics only
- Configurable data retention
- GDPR-compliant opt-out

### Friction Detection

**4 Pattern Types:**

1. **Performance Degradation**
   - Slow page loads >3s
   - Interaction latency >100ms
   - Resource loading issues

2. **Affordance Confusion**
   - Rapid repeated clicks
   - High error rates
   - Navigation reversals

3. **Cognitive Overload**
   - Form abandonment
   - Multiple rapid errors
   - High interaction density

4. **Expectation Mismatch**
   - Back button usage
   - Search abandonment
   - Checkout abandonment

### Intent Inference

Uses GPT-4o-mini with structured prompts:
- Session timeline analysis
- Friction pattern correlation
- Confidence scoring (0-1)
- Supporting evidence extraction

**Output Format:**
```json
{
  "hypotheses": [
    {
      "intent": "Complete purchase",
      "confidence": 0.85,
      "evidence": ["Added items", "Viewed cart", "Started checkout"]
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Simplify checkout flow",
      "rationale": "Form abandonment detected"
    }
  ]
}
```
