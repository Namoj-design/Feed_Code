# Intent-Aware Telemetry SDK

A lightweight, privacy-preserving SDK for capturing user interaction telemetry and generating AI-driven insights about user intent and friction points.

## Overview

This SDK enables product teams to understand **what users are trying to accomplish** and **what prevents their success** through:

- **Minimal, High-Signal Data Collection**: Captures only essential user interaction primitives
- **Privacy-First Design**: PII filtering, anonymization, and opt-out by default
- **AI-Powered Intent Inference**: Uses LLMs to infer user goals from behavior patterns
- **Friction Detection**: Automatically identifies 4 types of friction patterns
- **Actionable Insights**: Generates human-readable recommendations for product improvements

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Web App       │         │  Intelligence    │
│                 │         │  Layer (Python)  │
│  ┌───────────┐  │  HTTP   │                  │
│  │ Intent SDK│──┼────────▶│  FastAPI Server  │
│  │           │  │  Batch  │                  │
│  │ • Collect │  │  Events │  ┌────────────┐  │
│  │ • Buffer  │  │         │  │ Session    │  │
│  │ • Transmit│  │         │  │ Reconstruct│  │
│  └───────────┘  │         │  └──────┬─────┘  │
│                 │         │         │        │
└─────────────────┘         │  ┌──────▼─────┐  │
                            │  │ Friction   │  │
                            │  │ Classifier │  │
                            │  └──────┬─────┘  │
                            │         │        │
                            │  ┌──────▼─────┐  │
                            │  │ Intent     │  │
                            │  │ Inferrer   │  │
                            │  │ (GPT-4)    │  │
                            │  └──────┬─────┘  │
                            │         │        │
                            │  ┌──────▼─────┐  │
                            │  │ Insight    │  │
                            │  │ Generator  │  │
                            │  └────────────┘  │
                            └──────────────────┘
```

## Quick Start

### SDK Integration (TypeScript/JavaScript)

```bash
cd sdk
npm install
npm run build
```

**In your application:**

```typescript
import { IntentSDK } from '@intent-sdk/core';

// Initialize SDK
IntentSDK.init({
  endpoint: 'https://your-intelligence-server.com/api/v1/events/batch',
  enableAutoTracking: true,
  strictPrivacy: true,
  debug: false,
});
```

That's it! The SDK will now automatically track:
- ✅ Session lifecycle
- ✅ Page navigations
- ✅ User interactions (clicks, forms, inputs)
- ✅ Performance metrics
- ✅ Friction indicators (rapid clicks, navigation reversals, errors)

### Intelligence Layer (Python)

```bash
cd intelligence

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run server
uvicorn src.api.main:app --reload
```

Server will start on `http://localhost:8000`

### API Endpoints

- `POST /api/v1/events/batch` - Ingest event batches
- `GET /api/v1/insights/{session_id}` - Get insights for specific session
- `GET /api/v1/insights/summary/all` - Get aggregated insights

## 📊 Event Schema

The SDK captures 18 standardized event types:

### Session Lifecycle
- `session.start` - Session begins
- `session.resume` - User returns after pause
- `session.pause` - Tab hidden/unfocused
- `session.end` - Session terminates

### Navigation
- `view.transition` - Page/view change
- `navigation.back` - Back button
- `navigation.forward` - Forward button

### Interactions
- `action.click` - Element clicks
- `action.submit` - Form submissions
- `action.focus` - Element focus
- `action.input` - Input events

### Performance
- `performance.load` - Page load metrics
- `performance.latency` - High latency events

### Friction Indicators
- `friction.rapid_click` - Repeated clicking (confusion)
- `friction.navigation_reversal` - Quick back navigation
- `friction.error` - JavaScript/API errors
- `friction.form_abandonment` - Incomplete forms

## Privacy Guarantees

1. **No PII by Default**: Email, phone numbers, credit cards, SSN, IP addresses automatically redacted
2. **Anonymous Sessions**: Client-generated UUIDs, no cookies
3. **Sanitized URLs**: Query parameters with sensitive names removed
4. **Opt-Out Support**: `localStorage` flag instantly disables tracking
5. **No User Identification**: No cross-session tracking

**Example PII filtering:**
```typescript
// Before filtering:
{ email: "user@example.com", phone: "555-1234" }

// After filtering:
{ email: "[REDACTED_EMAIL]", phone: "[REDACTED_PHONE]" }
```

## 🤖 AI-Powered Analysis

The intelligence layer analyzes sessions to detect:

### Friction Patterns (4 Types)

1. **Performance Degradation**
   - Slow page loads (>3s)
   - High interaction latency (>1s)

2. **Affordance Confusion**
   - Rapid repeated clicks
   - Quick navigation reversals
   - Unclear UI feedback

3. **Cognitive Overload**
   - Form abandonment
   - Long pause times
   - Excessive scrolling

4. **Expectation Mismatch**
   - Errors encountered
   - Multiple navigation reversals
   - Unexpected outcomes

### Intent Inference

Uses GPT-4 to generate hypotheses about user goals:

```json
{
  "hypothesis": "User attempted to complete checkout but abandoned due to form complexity",
  "confidence": 0.85,
  "supporting_evidence": [
    "Navigated to checkout page",
    "Started filling form (2/5 fields completed)",
    "Abandoned after 45 seconds",
    "Returned to product page"
  ]
}
```

## Demo Application

Run the demo e-commerce app to see the SDK in action:

```bash
# Build SDK first
cd sdk && npm install && npm run build

# Run demo app
cd ../examples/demo-app
python -m http.server 8080
```

Open `http://localhost:8080` and try:
- **Happy Path**: Smooth purchasing flow
- **Friction Scenario**: Simulates confusion and abandonment
- **View Insights**: See AI-generated analysis

## 📦 Project Structure

```
intent-telemetry-sdk/
├── sdk/                    # TypeScript SDK
│   ├── src/
│   │   ├── types/         # Event schema & types
│   │   ├── core/          # Collector, buffer, transmitter
│   │   ├── trackers/      # Auto-tracking modules
│   │   └── privacy/       # PII filtering
│   └── package.json
├── intelligence/          # Python backend
│   ├── src/
│   │   ├── api/          # FastAPI routes
│   │   ├── analysis/     # Intent & friction detection
│   │   └── models/       # Pydantic models
│   └── pyproject.toml
├── examples/
│   └── demo-app/         # Demo application
└── docs/                 # Documentation
```

## 🧪 Testing

### SDK Tests
```bash
cd sdk
npm test
```

### Intelligence Layer Tests
```bash
cd intelligence
pytest
```

### End-to-End Test
1. Start intelligence server: `uvicorn src.api.main:app --reload`
2. Open demo app: `python -m http.server 8080`
3. Click "Simulate Friction Scenario"
4. Wait 30 seconds
5. Click "View Insights" to see analysis

## 🔧 Configuration

### SDK Options

```typescript
IntentSDK.init({
  endpoint: string;              // Required: API endpoint
  batchSize?: number;            // Default: 50 events
  flushInterval?: number;        // Default: 30000ms (30s)
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

### Environment Variables (Intelligence Layer)

```bash
OPENAI_API_KEY=your_key_here    # Required for intent inference
API_HOST=0.0.0.0                # Server host
API_PORT=8000                   # Server port
ALLOWED_ORIGINS=*               # CORS origins
```

## 📈 Deployment

### SDK Deployment
Build and distribute via npm:
```bash
npm run build
npm publish
```

### Intelligence Layer Deployment

**Docker:**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY intelligence/ .
RUN pip install -e .
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Cloud Platforms:**
- AWS: Elastic Beanstalk / ECS
- GCP: Cloud Run / App Engine
- Azure: App Service

## Contributing

This is a demo implementation for research and evaluation. For production use:

1. Add database persistence (PostgreSQL/MongoDB)
2. Implement authentication for insights API
3. Add rate limiting and request validation
4. Set up monitoring and logging
5. Create client SDKs for native platforms (iOS, Android)

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built with:
- **TypeScript** - Type-safe SDK
- **FastAPI** - High-performance Python backend
- **OpenAI GPT-4** - Intent inference
- **Pydantic** - Data validation
- **Vitest** - Testing framework

---

**Note**: This SDK is designed for intent analysis and UX research. Always ensure compliance with privacy regulations (GDPR, CCPA) and obtain user consent where required.
