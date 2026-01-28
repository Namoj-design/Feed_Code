"""
FastAPI application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import events, insights

# Create FastAPI app
app = FastAPI(
    title="Intent Intelligence API",
    description="AI-driven intelligence layer for intent-aware user telemetry",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events.router)
app.include_router(insights.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Intent Intelligence API",
        "version": "0.1.0",
        "status": "operational",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
