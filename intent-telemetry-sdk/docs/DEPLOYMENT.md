# Deployment Guide

## Production Deployment

### SDK Deployment

#### CDN Hosting

```html
<!-- Option 1: IIFE Bundle -->
<script src="https://cdn.example.com/intent-sdk@0.1.0/index.global.js"></script>
<script>
  IntentSDK.init({
    endpoint: 'https://api.example.com/events/batch',
    strictPrivacy: true
  });
</script>

<!-- Option 2: ES Module -->
<script type="module">
  import { IntentSDK } from 'https://cdn.example.com/intent-sdk@0.1.0/index.mjs';
  IntentSDK.init({ endpoint: '...' });
</script>
```

#### NPM Package

```bash
npm install @your-org/intent-sdk
```

```typescript
import { IntentSDK } from '@your-org/intent-sdk';

IntentSDK.init({
  endpoint: process.env.TELEMETRY_ENDPOINT,
  strictPrivacy: true,
  enableAutoTracking: true
});
```

### Intelligence Layer Deployment

#### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY intelligence/ .

RUN pip install -e .

EXPOSE 8000
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t intent-intelligence .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... intent-intelligence
```

#### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intent-intelligence
spec:
  replicas: 3
  selector:
    matchLabels:
      app: intent-intelligence
  template:
    metadata:
      labels:
        app: intent-intelligence
    spec:
      containers:
      - name: api
        image: your-registry/intent-intelligence:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secrets
              key: api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

#### Cloud Run (GCP)

```bash
gcloud run deploy intent-intelligence \
  --image gcr.io/PROJECT_ID/intent-intelligence \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=sk-...
```

#### AWS Lambda

Use AWS Lambda with FastAPI via Mangum:

```python
from mangum import Mangum
from src.api.main import app

handler = Mangum(app)
```

### Environment Variables

**Required:**
- `OPENAI_API_KEY`: OpenAI API key for intent inference

**Optional:**
- `API_HOST`: Server host (default: 0.0.0.0)
- `API_PORT`: Server port (default: 8000)
- `ALLOWED_ORIGINS`: CORS origins (default: *)
- `LOG_LEVEL`: Logging level (default: INFO)

### Database Integration

For production, replace in-memory storage:

```python
from sqlalchemy import create_engine
from src.analysis.session_reconstructor import SessionReconstructor

engine = create_engine('postgresql://user:pass@host/db')
reconstructor = SessionReconstructor(engine=engine)
```

### Security Checklist

- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS properly
- [ ] Rotate API keys regularly
- [ ] Set up rate limiting
- [ ] Enable request logging
- [ ] Configure firewall rules
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Enable authentication for insights API
- [ ] Set up monitoring and alerts

### Monitoring

**Recommended Metrics:**
- Event ingestion rate
- API response times
- Error rates
- OpenAI API usage
- Session processing latency

**Tools:**
- Prometheus + Grafana
- DataDog
- New Relic
- CloudWatch (AWS)

### Scaling Considerations

1. **Horizontal Scaling**: Add more API instances
2. **Caching**: Redis for session data
3. **Queue**: Use Celery/RabbitMQ for async processing
4. **CDN**: CloudFlare/CloudFront for SDK
5. **Database**: PostgreSQL with read replicas

### Cost Optimization

**OpenAI API:**
- Use GPT-4o-mini (cheaper)
- Implement caching for similar sessions
- Batch inference requests
- Set usage limits

**Infrastructure:**
- Auto-scaling based on load
- Spot instances for non-critical workloads
- CDN caching for SDK
