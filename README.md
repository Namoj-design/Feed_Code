### Intent Telemetry SDK

[![CI](https://github.com/Namoj-design/Feed_Code/workflows/CI/badge.svg)](https://github.com/Namoj-design/Feed_Code/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, privacy-preserving SDK for capturing user interaction telemetry and generating AI-driven insights about user intent and friction points.

---

## 📚 Quick Links

- [📖 Documentation](./intent-telemetry-sdk/README.md)
- [🏗️ Architecture](./intent-telemetry-sdk/docs/ARCHITECTURE.md)
- [🚀 Deployment Guide](./intent-telemetry-sdk/docs/DEPLOYMENT.md)
- [📋 API Reference](./intent-telemetry-sdk/docs/API.md)
- [📝 Changelog](./intent-telemetry-sdk/CHANGELOG.md)
- [🔒 Security Policy](./intent-telemetry-sdk/SECURITY.md)
- [🤝 Contributing](./intent-telemetry-sdk/CONTRIBUTING.md)

## 🎯 Features

- **18 Event Types** across 5 categories (session, navigation, interactions, performance, friction)
- **Privacy-First**: Automatic PII filtering, anonymous sessions, no cookies
- **AI-Powered Insights**: GPT-4-based intent inference with confidence scoring
- **4 Friction Patterns**: Performance degradation, affordance confusion, cognitive overload, expectation mismatch
- **Production-Ready**: TypeScript SDK + Python FastAPI backend
- **Zero Dependencies**: Lightweight client-side SDK (<50KB)

## 🚀 Quick Start

### TypeScript SDK

```bash
npm install @your-org/intent-sdk
```

```typescript
import { IntentSDK } from '@your-org/intent-sdk';

IntentSDK.init({
  endpoint: 'https://api.example.com/events/batch',
  strictPrivacy: true
});
```

### Python Intelligence Layer

```bash
cd intelligence
pip install -e .
uvicorn src.api.main:app
```

## 📦 Project Structure

```
Feed_Code/
├── intent-telemetry-sdk/
│   ├── sdk/              # TypeScript SDK
│   ├── intelligence/     # Python backend
│   ├── examples/         # Demo applications
│   └── docs/             # Documentation
└── .github/              # CI/CD workflows
```

## 🔒 Privacy Guarantees

- ✅ No PII collection by default
- ✅ Client-side PII filtering
- ✅ Anonymous session IDs
- ✅ No cookies or persistent identifiers
- ✅ GDPR-compliant opt-out mechanism

## 📊 Use Cases

- **Product Analytics**: Understand what users are trying to accomplish
- **Friction Detection**: Identify UX issues causing user frustration
- **A/B Testing**: Validate hypotheses with behavioral data
- **Customer Success**: Proactive support for struggling users
- **Feature Prioritization**: Data-driven product roadmap decisions

## 🛠️ Development

```bash
# SDK
cd intent-telemetry-sdk/sdk
npm install
npm run build

# Intelligence Layer
cd intent-telemetry-sdk/intelligence
python -m venv venv
source venv/bin/activate
pip install -e .
```

## 📄 License

MIT License - see [LICENSE](./intent-telemetry-sdk/LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./intent-telemetry-sdk/CONTRIBUTING.md) first.

## 🔐 Security

Report security vulnerabilities to: security@example.com

See [SECURITY.md](./intent-telemetry-sdk/SECURITY.md) for our security policy.
