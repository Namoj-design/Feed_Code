"""
FastAPI routes for event ingestion
"""

from typing import List
from fastapi import APIRouter, HTTPException
from src.models.event import EventBatch, TelemetryEvent
from src.analysis.session_reconstructor import SessionReconstructor

router = APIRouter(prefix="/api/v1/events", tags=["events"])

# Global session reconstructor (in production, use proper state management/database)
session_reconstructor = SessionReconstructor()


@router.post("/batch")
async def ingest_batch(batch: EventBatch):
    """
    Ingest a batch of telemetry events

    This endpoint receives batched events from the SDK and stores them for analysis.
    """
    try:
        # Validate and add events to reconstructor
        session_reconstructor.add_events(batch.events)

        return {
            "status": "success",
            "batch_id": batch.batchId,
            "events_received": len(batch.events),
            "total_sessions": session_reconstructor.get_session_count(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process batch: {str(e)}")


@router.get("/stats")
async def get_stats():
    """Get event ingestion statistics"""
    return {
        "total_sessions": session_reconstructor.get_session_count(),
    }
