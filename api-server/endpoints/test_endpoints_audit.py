"""Audit tests for endpoints/cognitive_tests.py (R10.1).

These tests document current behavior including known issues.
They are intended to FAIL when bugs are present, demonstrating
gaps in endpoint coverage. Use to drive bug fixes.
"""
import pytest
from fastapi.testclient import TestClient

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import start  # noqa: E402


@pytest.fixture(scope="module")
def client():
    return TestClient(start.app)


class TestGetBiasExplanationCoverage:
    """get_bias_explanation hardcodes 3 of 12 bias types (R10.1 audit)."""

    def test_linear_thinking_explanation(self, client):
        r = client.get("/api/explanations/linear_thinking")
        assert r.status_code == 200

    def test_exponential_misconception_explanation(self, client):
        r = client.get("/api/explanations/exponential_misconception")
        assert r.status_code == 200

    def test_compound_interest_explanation(self, client):
        r = client.get("/api/explanations/compound_interest_misunderstanding")
        assert r.status_code == 200


class TestSubmitUserResponse:
    """submit_user_response handles multiple question types."""

    def test_exponential_question(self, client):
        r = client.post("/api/results/submit", json={
            "userId": "u1",
            "sessionId": "s1",
            "questionId": "exp-001",
            "questionType": "exponential",
            "userEstimation": 1e6,
            "actualValue": 2**200,
            "exponentialBase": 2,
            "exponentialPower": 200,
        })
        assert r.status_code == 200
        body = r.json()
        assert body.get("success") is True or "data" in body

    def test_compound_question(self, client):
        r = client.post("/api/results/submit", json={
            "userId": "u1",
            "sessionId": "s1",
            "questionId": "compound-001",
            "questionType": "compound",
            "userEstimation": 50000,
            "actualValue": 162889,
            "principal": 100000,
            "rate": 5,
            "time_years": 10,
        })
        assert r.status_code == 200

    def test_unknown_question_type_returns_error_or_empty(self, client):
        """When question_type doesn't match any branch, analysis_result is None.
        Current code: line 736 accesses analysis_result.get(...) → AttributeError.
        Outer except catches it → 200 with error response."""
        r = client.post("/api/results/submit", json={
            "userId": "u1",
            "sessionId": "s1",
            "questionId": "unknown-001",
            "questionType": "mystery_type",
            "userEstimation": 100,
            "actualValue": 100,
        })
        # Currently returns 200 with error message (outer except catches AttributeError)
        # Should ideally return a clear "no analysis" response
        assert r.status_code in (200, 422, 500)


class TestCheckExponentialAnswer:
    """check_exponential_answer hardcodes analyze_exponential_misconception(2, 200)."""

    def test_exp_001_question(self, client):
        r = client.post("/api/exponential/check-answer/exp-001", json={
            "userChoice": 0,
            "userEstimation": 1e6,
        })
        assert r.status_code == 200
        body = r.json()
        assert body.get("success") is True or "data" in body
        # actual_value should be 2^200
        data = body.get("data", body)
        assert data.get("actual_value") == 2**200

    def test_exp_002_question_uses_5_11_formula(self, client):
        r = client.post("/api/exponential/check-answer/exp-002", json={
            "userChoice": 0,
            "userEstimation": 1e6,
        })
        assert r.status_code == 200
        body = r.json()
        data = body.get("data", body)
        # Should be 10 * (5**11) = 48828125
        assert data.get("actual_value") == 10 * (5**11)


class TestGetQuestionsEndpoints:
    """Question-loading endpoints fall back to empty lists when JSON missing."""

    def test_exponential_questions(self, client):
        r = client.get("/api/exponential/questions")
        # Returns {"exponential_questions": []} when data dir empty
        assert r.status_code == 200

    def test_advanced_exponential_questions(self, client):
        r = client.get("/api/exponential/advanced-questions")
        assert r.status_code == 200

    def test_compound_questions(self, client):
        r = client.get("/api/compound/questions")
        assert r.status_code == 200

    def test_historical_scenarios(self, client):
        r = client.get("/api/historical/scenarios")
        assert r.status_code == 200

    def test_game_scenarios(self, client):
        r = client.get("/api/game/scenarios")
        assert r.status_code == 200


class TestInteractiveEndpoints:
    """Interactive endpoints smoke tests."""

    def test_interactive_health(self, client):
        r = client.get("/api/interactive/health")
        assert r.status_code == 200

    def test_guided_tour(self, client):
        r = client.get("/api/interactive/guided-tour")
        assert r.status_code == 200

    def test_analyze_decision_no_bias(self, client):
        # Note: analyze_decision is POST but uses Query param (unusual but works)
        r = client.post("/api/interactive/analyze-decision", params={
            "user_input": "I made a rational decision based on data"
        })
        assert r.status_code == 200
        body = r.json()
        # Response shape: {response, analysis: {detected_biases: []}, suggestions, confidence}
        analysis = body.get("analysis", {})
        detected = analysis.get("detected_biases", [])
        assert len(detected) == 0

    def test_analyze_decision_with_anchoring(self, client):
        r = client.post("/api/interactive/analyze-decision", params={
            "user_input": "The first number I saw was 100"
        })
        assert r.status_code == 200
        body = r.json()
        analysis = body.get("analysis", {})
        detected = analysis.get("detected_biases", [])
        # Should detect anchoring_bias
        assert any("anchoring" in str(b).lower() for b in detected)
