"""
Session models
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SessionSummary(BaseModel):
    """Session summary"""

    session_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[int] = None
    event_count: int
    page_views: int
    interactions: int
    friction_events: int


class FrictionPattern(BaseModel):
    """Detected friction pattern"""

    pattern_type: str
    severity: float  # 0.0 - 1.0
    timestamp: datetime
    description: str
    event_id: str


class IntentHypothesis(BaseModel):
    """User intent hypothesis"""

    hypothesis: str
    confidence: float  # 0.0 - 1.0
    supporting_evidence: list[str]
    timestamp: datetime


class InsightSummary(BaseModel):
    """Generated insight"""

    session_id: str
    timestamp: datetime
    intent_hypotheses: list[IntentHypothesis]
    friction_patterns: list[FrictionPattern]
    recommendations: list[str]
    confidence_score: float
