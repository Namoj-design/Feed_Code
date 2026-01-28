"""
Pydantic models for events
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class EventType(str, Enum):
    """Event type enumeration"""

    SESSION_START = "session.start"
    SESSION_RESUME = "session.resume"
    SESSION_PAUSE = "session.pause"
    SESSION_END = "session.end"
    VIEW_TRANSITION = "view.transition"
    NAVIGATION_BACK = "navigation.back"
    NAVIGATION_FORWARD = "navigation.forward"
    ACTION_CLICK = "action.click"
    ACTION_SUBMIT = "action.submit"
    ACTION_FOCUS = "action.focus"
    ACTION_INPUT = "action.input"
    PERFORMANCE_LOAD = "performance.load"
    PERFORMANCE_LATENCY = "performance.latency"
    FRICTION_RAPID_CLICK = "friction.rapid_click"
    FRICTION_NAVIGATION_REVERSAL = "friction.navigation_reversal"
    FRICTION_ERROR = "friction.error"
    FRICTION_FORM_ABANDONMENT = "friction.form_abandonment"


class DeviceInfo(BaseModel):
    """Device information"""

    type: str
    touchEnabled: bool


class Viewport(BaseModel):
    """Viewport dimensions"""

    width: int
    height: int


class EventContext(BaseModel):
    """Event context"""

    url: Optional[str] = None
    pageTitle: Optional[str] = None
    viewport: Viewport
    device: DeviceInfo
    userAgent: Optional[str] = None


class TelemetryEvent(BaseModel):
    """Base telemetry event"""

    schemaVersion: str
    type: EventType
    eventId: str
    sessionId: str
    timestamp: datetime
    sequenceNumber: int
    context: EventContext
    data: Dict[str, Any]

    class Config:
        use_enum_values = True


class EventBatch(BaseModel):
    """Batch of events sent from client"""

    schemaVersion: str
    batchId: str
    timestamp: datetime
    events: list[TelemetryEvent]
