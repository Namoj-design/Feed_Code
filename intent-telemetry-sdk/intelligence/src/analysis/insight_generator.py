"""
Insight generation system
"""

from typing import List
from src.models.session import IntentHypothesis, FrictionPattern, InsightSummary
from src.analysis.session_reconstructor import ReconstructedSession
from src.analysis.friction_classifier import FrictionClassifier
from src.analysis.intent_inferrer import IntentInferrer


class InsightGenerator:
    """Generates actionable insights from session analysis"""

    def __init__(self, intent_inferrer: IntentInferrer):
        self.intent_inferrer = intent_inferrer
        self.friction_classifier = FrictionClassifier()

    async def generate_insights(self, session: ReconstructedSession) -> InsightSummary:
        """Generate comprehensive insights for a session"""

        # 1. Classify friction patterns
        friction_patterns = self.friction_classifier.analyze_session(session)

        # 2. Infer intent using LLM (skip if no valid API key)
        try:
            intent_hypotheses = await self.intent_inferrer.infer_intent(
                session, friction_patterns
            )
        except (ValueError, Exception) as e:
            # If OpenAI is not available, use basic intent placeholder
            print(f"⚠️  Intent inference skipped: {str(e)}")
            intent_hypotheses = [
                IntentHypothesis(
                    hypothesis="User interacted with the application (AI inference unavailable - OpenAI API key not configured)",
                    confidence=0.5,
                    supporting_evidence=[
                        f"Session included {len(session.events)} events",
                        f"User visited {session.metrics.get('page_views', 0)} pages"
                    ]
                )
            ]

        # 3. Generate recommendations
        recommendations = self._generate_recommendations(
            session, friction_patterns, intent_hypotheses
        )

        # 4. Calculate overall confidence score
        confidence_score = self._calculate_confidence(
            intent_hypotheses, friction_patterns
        )

        return InsightSummary(
            session_id=session.session_id,
            timestamp=session.end_time or session.start_time,
            intent_hypotheses=intent_hypotheses,
            friction_patterns=friction_patterns,
            recommendations=recommendations,
            confidence_score=confidence_score,
        )

    def _generate_recommendations(
        self,
        session: ReconstructedSession,
        friction_patterns: List[FrictionPattern],
        intent_hypotheses: List[IntentHypothesis],
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Group friction by type
        friction_by_type = {}
        for pattern in friction_patterns:
            if pattern.pattern_type not in friction_by_type:
                friction_by_type[pattern.pattern_type] = []
            friction_by_type[pattern.pattern_type].append(pattern)

        # Performance recommendations
        if "performance_degradation" in friction_by_type:
            patterns = friction_by_type["performance_degradation"]
            avg_severity = sum(p.severity for p in patterns) / len(patterns)
            if avg_severity > 0.7:
                recommendations.append(
                    "🚀 Critical: Optimize page load performance and reduce interaction latency"
                )
            else:
                recommendations.append(
                    "⚡ Monitor and improve performance metrics for better user experience"
                )

        # Affordance confusion recommendations
        if "affordance_confusion" in friction_by_type:
            recommendations.append(
                "🎯 Improve visual feedback for interactive elements (consider: loading states, hover effects, click acknowledgment)"
            )

        # Cognitive overload recommendations
        if "cognitive_overload" in friction_by_type:
            recommendations.append(
                "🧠 Simplify forms and reduce cognitive load (consider: progressive disclosure, better labels, inline validation)"
            )

        # Expectation mismatch recommendations
        if "expectation_mismatch" in friction_by_type:
            recommendations.append(
                "✨ Align UI behavior with user expectations (consider: clearer error messages, better navigation cues)"
            )

        # Intent-based recommendations
        for hypothesis in intent_hypotheses:
            if hypothesis.confidence > 0.7:
                if "abandon" in hypothesis.hypothesis.lower() or "unable" in hypothesis.hypothesis.lower():
                    recommendations.append(
                        f"🎓 User appears to be struggling with: {hypothesis.hypothesis.lower().replace('user ', '')}"
                    )

        # General recommendations
        if len(friction_patterns) == 0:
            recommendations.append(
                "✅ Session appears smooth with no major friction detected"
            )
        elif len(friction_patterns) >= 5:
            recommendations.append(
                "⚠️ High friction detected across multiple areas - prioritize UX improvements"
            )

        return recommendations

    def _calculate_confidence(
        self,
        intent_hypotheses: List[IntentHypothesis],
        friction_patterns: List[FrictionPattern],
    ) -> float:
        """Calculate overall confidence score for insights"""

        # Base confidence on intent hypotheses
        if intent_hypotheses:
            intent_confidence = max(h.confidence for h in intent_hypotheses)
        else:
            intent_confidence = 0.0

        # Adjust based on friction detection certainty
        # More friction patterns = more certainty in analysis
        friction_factor = min(1.0, len(friction_patterns) / 10)

        # Weighted average
        confidence = (intent_confidence * 0.7) + (friction_factor * 0.3)

        return round(confidence, 2)
