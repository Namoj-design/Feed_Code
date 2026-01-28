# Contributing to Intent Telemetry SDK

We welcome contributions! Please follow these guidelines:

## Development Setup

```bash
# SDK
cd sdk
npm install
npm run build

# Intelligence Layer
cd intelligence
python -m venv venv
source venv/bin/activate
pip install -e .
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Code Style

- TypeScript: Follow the existing ESLint configuration
- Python: Follow PEP 8 guidelines
-commit messages: Use conventional commits format
