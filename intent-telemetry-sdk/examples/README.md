# Examples

This directory contains example applications demonstrating the Intent Telemetry SDK.

## Demo E-Commerce App

A fully functional demo e-commerce application showcasing:
- Real-time event tracking
- Session lifecycle management
- Friction pattern simulation
- AI-powered insights visualization

### Running the Demo

```bash
# Build the SDK first
cd ../sdk
npm install
npm run build

# Start the intelligence server
cd ../intelligence
python -m venv venv
source venv/bin/activate
pip install -e .
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
uvicorn src.api.main:app --reload

# Serve the demo app
cd ../examples/demo-app
python -m http.server 8080
```

Then open: http://localhost:8080

### Features

**Simulate Happy Path**: Demonstrates smooth user flow
- Browse products
- Add items to cart
- View cart
- Proceed to checkout

**Simulate Friction**: Triggers friction patterns
- Rapid clicks
- Form errors
- Navigation reversals
- Page delays

**View Insights**: Fetches AI-generated analysis
- Intent hypotheses
- Friction patterns detected
- Actionable recommendations
- Confidence scores
