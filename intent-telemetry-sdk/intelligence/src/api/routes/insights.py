"""
FastAPI routes for insights
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from src.models.session import InsightSummary
from src.analysis.session_reconstructor import SessionReconstructor
from src.analysis.intent_inferrer import IntentInferrer
from src.analysis.insight_generator import InsightGenerator
from src.api.routes.events import session_reconstructor

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])

# Initialize analysis components
intent_inferrer = IntentInferrer()
insight_generator = InsightGenerator(intent_inferrer)


@router.get("/{session_id}", response_model=InsightSummary)
async def get_session_insights(session_id: str):
    """
    Get AI-generated insights for a specific session

    This endpoint analyzes a session's events and returns:
    - Inferred user intent with confidence scores
    - Detected friction patterns
    - Actionable recommendations
    """
    try:
        # Reconstruct session
        session = session_reconstructor.get_session(session_id)

        if not session.events:
            raise HTTPException(status_code=404, detail="Session not found")

        # Generate insights
        insights = await insight_generator.generate_insights(session)

        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate insights: {str(e)}"
        )


@router.get("/summary/all")
async def get_all_insights_summary():
    """
    Get summary of insights across all sessions

    Returns aggregated insights and statistics across all tracked sessions.
    """
    try:
        all_sessions = session_reconstructor.get_all_sessions()

        if not all_sessions:
            return {
                "total_sessions": 0,
                "sessions": [],
            }

        # Generate insights for each session (limited to avoid overwhelming)
        session_summaries = []
        for session in all_sessions[:10]:  # Limit to 10 most recent
            try:
                insights = await insight_generator.generate_insights(session)
                session_summaries.append(
                    {
                        "session_id": session.session_id,
                        "duration_ms": session.get_duration_ms(),
                        "events": len(session.events),
                        "friction_count": len(insights.friction_patterns),
                        "primary_intent": (
                            insights.intent_hypotheses[0].hypothesis
                            if insights.intent_hypotheses
                            else "Unknown"
                        ),
                        "confidence": insights.confidence_score,
                        "top_recommendation": (
                            insights.recommendations[0] if insights.recommendations else None
                        ),
                    }
                )
            except Exception as e:
                print(f"Failed to analyze session {session.session_id}: {e}")
                continue

        return {
            "total_sessions": len(all_sessions),
            "analyzed_sessions": len(session_summaries),
            "sessions": session_summaries,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get insights summary: {str(e)}"
        )
