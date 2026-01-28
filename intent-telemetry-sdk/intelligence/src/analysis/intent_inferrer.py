"""
Intent inference using LLM
"""

import json
import os
from typing import List, Optional
from openai import OpenAI
from src.models.session import IntentHypothesis
from src.analysis.session_reconstructor import ReconstructedSession
from src.analysis.friction_classifier import FrictionPattern


class IntentInferrer:
    """Infers user intent from session events using LLM."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the intent inferrer with OpenAI client."""
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._client = None
        self.model = "gpt-4o-mini"  # Cost-effective model
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            if not self._api_key or self._api_key == "sk-dummy-key-for-testing":
                raise ValueError("Valid OPENAI_API_KEY required for intent inference")
            self._client = OpenAI(api_key=self._api_key)
        return self._client

    async def infer_intent(
        self,
        session: ReconstructedSession,
        friction_patterns: List[FrictionPattern],
    ) -> List[IntentHypothesis]:
        """Infer user intent from session events"""

        # Prepare event sequence summary
        event_summary = self._prepare_event_summary(session)
        friction_summary = self._prepare_friction_summary(friction_patterns)

        # Create prompt
        prompt = f"""Analyze this user session and infer their intent.

Session Summary:
- Duration: {session.get_duration_ms()}ms
- Page Views: {session.get_page_views()}
- Interactions: {session.get_interactions()}
- Friction Events: {len(friction_patterns)}

Event Sequence:
{event_summary}

Friction Patterns Detected:
{friction_summary}

Based on this data, provide:
1. Primary user intent (what they were trying to accomplish)
2. Secondary intents (if any)
3. Supporting evidence for each intent
4. Confidence score (0.0-1.0) for each hypothesis

Respond in JSON format:
{{
  "hypotheses": [
    {{
      "intent": "description of intent",
      "confidence": 0.8,
      "evidence": ["evidence 1", "evidence 2"]
    }}
  ]
}}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert UX analyst specializing in user behavior analysis. Analyze user sessions to infer intent and identify friction points.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for more consistent analysis
            )

            # Parse response
            result = json.loads(response.choices[0].message.content)

            # Convert to IntentHypothesis objects
            hypotheses = []
            for h in result.get("hypotheses", []):
                hypotheses.append(
                    IntentHypothesis(
                        hypothesis=h["intent"],
                        confidence=h["confidence"],
                        supporting_evidence=h["evidence"],
                        timestamp=session.end_time or session.start_time,
                    )
                )

            return hypotheses

        except Exception as e:
            print(f"Error inferring intent: {e}")
            # Return fallback hypothesis
            return [
                IntentHypothesis(
                    hypothesis="Unable to determine intent (analysis error)",
                    confidence=0.0,
                    supporting_evidence=["Error during analysis"],
                    timestamp=session.end_time or session.start_time,
                )
            ]

    def _prepare_event_summary(self, session: ReconstructedSession) -> str:
        """Prepare human-readable event summary"""
        sequence = session.get_event_sequence()

        # Limit to most important events
        summary_lines = []
        for i, event in enumerate(sequence[:20]):  # Limit to 20 most recent
            event_type = event["type"].replace("_", " ").title()
            page_title = event["context"].get("pageTitle", "Unknown")
            summary_lines.append(f"{i+1}. {event_type} - {page_title}")

        if len(sequence) > 20:
            summary_lines.append(f"... and {len(sequence) - 20} more events")

        return "\n".join(summary_lines)

    def _prepare_friction_summary(self, patterns: List[FrictionPattern]) -> str:
        """Prepare friction pattern summary"""
        if not patterns:
            return "No friction detected"

        summary_lines = []
        for i, pattern in enumerate(patterns, 1):
            severity_label = (
                "High" if pattern.severity > 0.7 else "Medium" if pattern.severity > 0.4 else "Low"
            )
            summary_lines.append(
                f"{i}. [{severity_label}] {pattern.pattern_type}: {pattern.description}"
            )

        return "\n".join(summary_lines)
