"""
Session reconstruction engine
"""

from datetime import datetime
from typing import Dict, List
from src.models.event import TelemetryEvent, EventType


class ReconstructedSession:
    """Reconstructed session from events"""

    def __init__(self, session_id: str, events: List[TelemetryEvent]):
        self.session_id = session_id
        self.events = sorted(events, key=lambda e: e.sequenceNumber)
        self.start_time = events[0].timestamp if events else datetime.now()
        self.end_time = events[-1].timestamp if events else None

    def get_duration_ms(self) -> int:
        """Get session duration in milliseconds"""
        if not self.end_time:
            return 0
        return int((self.end_time - self.start_time).total_seconds() * 1000)

    def get_events_by_type(self, event_type: EventType) -> List[TelemetryEvent]:
        """Get events of specific type"""
        return [e for e in self.events if e.type == event_type]

    def get_page_views(self) -> int:
        """Count page views/transitions"""
        return len(self.get_events_by_type(EventType.VIEW_TRANSITION))

    def get_interactions(self) -> int:
        """Count user interactions"""
        interaction_types = [
            EventType.ACTION_CLICK,
            EventType.ACTION_SUBMIT,
            EventType.ACTION_INPUT,
        ]
        return sum(len(self.get_events_by_type(t)) for t in interaction_types)

    def get_friction_events(self) -> List[TelemetryEvent]:
        """Get all friction events"""
        friction_types = [
            EventType.FRICTION_RAPID_CLICK,
            EventType.FRICTION_NAVIGATION_REVERSAL,
            EventType.FRICTION_ERROR,
            EventType.FRICTION_FORM_ABANDONMENT,
        ]
        return [e for e in self.events if e.type in friction_types]

    def get_event_sequence(self) -> List[Dict]:
        """Get simplified event sequence for analysis"""
        return [
            {
                "type": event.type.value,
                "timestamp": event.timestamp.isoformat(),
                "sequence": event.sequenceNumber,
                "data": event.data,
                "context": {
                    "url": event.context.url,
                    "pageTitle": event.context.pageTitle,
                },
            }
            for event in self.events
        ]


class SessionReconstructor:
    """Reconstructs sessions from event streams"""

    def __init__(self):
        self.sessions: Dict[str, List[TelemetryEvent]] = {}

    def add_events(self, events: List[TelemetryEvent]):
        """Add events and group by session"""
        for event in events:
            if event.sessionId not in self.sessions:
                self.sessions[event.sessionId] = []
            self.sessions[event.sessionId].append(event)

    def get_session(self, session_id: str) -> ReconstructedSession:
        """Get reconstructed session"""
        events = self.sessions.get(session_id, [])
        return ReconstructedSession(session_id, events)

    def get_all_sessions(self) -> List[ReconstructedSession]:
        """Get all reconstructed sessions"""
        return [
            ReconstructedSession(sid, events) for sid, events in self.sessions.items()
        ]

    def get_session_count(self) -> int:
        """Get total session count"""
        return len(self.sessions)
