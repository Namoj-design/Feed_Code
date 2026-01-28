"""
Friction pattern classifier
"""

from datetime import datetime
from typing import List
from src.models.event import TelemetryEvent, EventType
from src.models.session import FrictionPattern
from src.analysis.session_reconstructor import ReconstructedSession


class FrictionClassifier:
    """Classifies friction patterns from events"""

    def __init__(self):
        self.patterns: List[FrictionPattern] = []

    def analyze_session(self, session: ReconstructedSession) -> List[FrictionPattern]:
        """Analyze session for friction patterns"""
        patterns = []

        # 1. Performance degradation
        patterns.extend(self._detect_performance_degradation(session))

        # 2. Affordance confusion
        patterns.extend(self._detect_affordance_confusion(session))

        # 3. Cognitive overload (not directly detectable, inferred from patterns)
        patterns.extend(self._detect_cognitive_overload(session))

        # 4. Expectation mismatch
        patterns.extend(self._detect_expectation_mismatch(session))

        self.patterns.extend(patterns)
        return patterns

    def _detect_performance_degradation(
        self, session: ReconstructedSession
    ) -> List[FrictionPattern]:
        """Detect performance issues"""
        patterns = []

        # Check for slow page loads
        load_events = session.get_events_by_type(EventType.PERFORMANCE_LOAD)
        for event in load_events:
            load_time = event.data.get("loadTime", 0)
            if load_time > 3000:  # > 3 seconds
                severity = min(1.0, load_time / 10000)  # Scale to 0-1
                patterns.append(
                    FrictionPattern(
                        pattern_type="performance_degradation",
                        severity=severity,
                        timestamp=event.timestamp,
                        description=f"Slow page load detected: {load_time}ms",
                        event_id=event.eventId,
                    )
                )

        # Check for high latency interactions
        latency_events = session.get_events_by_type(EventType.PERFORMANCE_LATENCY)
        for event in latency_events:
            latency = event.data.get("latency", 0)
            operation = event.data.get("operation", "unknown")
            severity = min(1.0, latency / 5000)
            patterns.append(
                FrictionPattern(
                    pattern_type="performance_degradation",
                    severity=severity,
                    timestamp=event.timestamp,
                    description=f"High latency for {operation}: {latency}ms",
                    event_id=event.eventId,
                )
            )

        return patterns

    def _detect_affordance_confusion(
        self, session: ReconstructedSession
    ) -> List[FrictionPattern]:
        """Detect affordance confusion (unclear UI elements)"""
        patterns = []

        # Rapid clicks indicate unclear feedback
        rapid_click_events = session.get_events_by_type(EventType.FRICTION_RAPID_CLICK)
        for event in rapid_click_events:
            click_count = event.data.get("clickCount", 0)
            target = event.data.get("target", "unknown")
            severity = min(1.0, click_count / 10)
            patterns.append(
                FrictionPattern(
                    pattern_type="affordance_confusion",
                    severity=severity,
                    timestamp=event.timestamp,
                    description=f"Rapid clicking on '{target}' suggests unclear affordance or missing feedback",
                    event_id=event.eventId,
                )
            )

        # Navigation reversals can indicate confusion
        reversal_events = session.get_events_by_type(
            EventType.FRICTION_NAVIGATION_REVERSAL
        )
        for event in reversal_events:
            time_on_page = event.data.get("timeOnPage", 0)
            if time_on_page < 2000:  # Very quick reversal
                patterns.append(
                    FrictionPattern(
                        pattern_type="affordance_confusion",
                        severity=0.7,
                        timestamp=event.timestamp,
                        description="Quick navigation reversal suggests user didn't find expected content",
                        event_id=event.eventId,
                    )
                )

        return patterns

    def _detect_cognitive_overload(
        self, session: ReconstructedSession
    ) -> List[FrictionPattern]:
        """Detect cognitive overload indicators"""
        patterns = []

        # Form abandonment indicates complexity/frustration
        abandon_events = session.get_events_by_type(
            EventType.FRICTION_FORM_ABANDONMENT
        )
        for event in abandon_events:
            fields_completed = event.data.get("fieldsCompleted", 0)
            total_fields = event.data.get("totalFields", 1)
            completion_rate = fields_completed / total_fields if total_fields > 0 else 0

            severity = 1.0 - completion_rate  # Higher severity for earlier abandonment
            patterns.append(
                FrictionPattern(
                    pattern_type="cognitive_overload",
                    severity=severity,
                    timestamp=event.timestamp,
                    description=f"Form abandoned after completing {fields_completed}/{total_fields} fields",
                    event_id=event.eventId,
                )
            )

        return patterns

    def _detect_expectation_mismatch(
        self, session: ReconstructedSession
    ) -> List[FrictionPattern]:
        """Detect expectation mismatches"""
        patterns = []

        # Errors indicate broken expectations
        error_events = session.get_events_by_type(EventType.FRICTION_ERROR)
        for event in error_events:
            error_type = event.data.get("errorType", "unknown")
            patterns.append(
                FrictionPattern(
                    pattern_type="expectation_mismatch",
                    severity=0.8,
                    timestamp=event.timestamp,
                    description=f"Error encountered: {error_type}",
                    event_id=event.eventId,
                )
            )

        # Multiple navigation reversals suggest confusion
        reversals = session.get_events_by_type(EventType.FRICTION_NAVIGATION_REVERSAL)
        if len(reversals) >= 3:
            patterns.append(
                FrictionPattern(
                    pattern_type="expectation_mismatch",
                    severity=0.6,
                    timestamp=reversals[-1].timestamp,
                    description=f"Multiple navigation reversals ({len(reversals)}) suggest unmet expectations",
                    event_id=reversals[-1].eventId,
                )
            )

        return patterns

    def get_severity_summary(self) -> dict:
        """Get severity summary across all patterns"""
        if not self.patterns:
            return {"average": 0.0, "max": 0.0, "count": 0}

        severities = [p.severity for p in self.patterns]
        return {
            "average": sum(severities) / len(severities),
            "max": max(severities),
            "count": len(severities),
        }
