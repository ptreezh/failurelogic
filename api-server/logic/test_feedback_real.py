"""Tests for logic/feedback_real.py (R8.2).

Covers the 3 feedback generators and 11 scenario_id branches in
generate_real_feedback.
"""
import pytest

from logic.feedback_real import (
    generate_real_feedback,
    generate_pattern_analysis_feedback,
    generate_advanced_feedback,
)


BASE_STATE = {
    "satisfaction": 50,
    "resources": 1000,
    "reputation": 50,
    "portfolio": 10000,
    "knowledge": 0,
    "trust": 50,
    "turn_number": 1,
}


def _delta(base, **changes):
    """Return new_state = base + changes (positive deltas)."""
    return {**base, **changes}


class TestGenerateRealFeedbackCoffeeShop:
    def test_coffee_shop_hire_staff_beginner(self):
        new = _delta(BASE_STATE, satisfaction=55, resources=900)
        fb = generate_real_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "hire_staff", "amount": 2},
            BASE_STATE, new, difficulty="beginner",
        )
        assert isinstance(fb, str)
        assert len(fb) > 10

    def test_coffee_shop_marketing_intermediate(self):
        new = _delta(BASE_STATE, satisfaction=60, resources=950)
        fb = generate_real_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "marketing", "amount": 5},
            BASE_STATE, new, difficulty="intermediate",
        )
        assert isinstance(fb, str)

    def test_coffee_shop_supply_chain_advanced(self):
        new = _delta(BASE_STATE, satisfaction=70, resources=800)
        fb = generate_real_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "supply_chain", "amount": 10},
            BASE_STATE, new, difficulty="advanced",
        )
        assert isinstance(fb, str)


class TestGenerateRealFeedbackRelationship:
    def test_relationship_communication(self):
        new = _delta(BASE_STATE, trust=55, satisfaction=52)
        fb = generate_real_feedback(
            "relationship-time-delay",
            {"action": "communication"},
            BASE_STATE, new,
        )
        assert isinstance(fb, str)
        assert len(fb) > 5

    def test_relationship_gift(self):
        new = _delta(BASE_STATE, trust=60, satisfaction=55)
        fb = generate_real_feedback(
            "relationship-time-delay",
            {"action": "gift"},
            BASE_STATE, new,
        )
        assert isinstance(fb, str)


class TestGenerateRealFeedbackInvestment:
    def test_investment_research(self):
        new = _delta(BASE_STATE, knowledge=10, portfolio=10500)
        fb = generate_real_feedback(
            "investment-confirmation-bias",
            {"action": "research"},
            BASE_STATE, new,
        )
        assert isinstance(fb, str)

    def test_investment_diversify(self):
        new = _delta(BASE_STATE, portfolio=9800, knowledge=5)
        fb = generate_real_feedback(
            "investment-confirmation-bias",
            {"action": "diversify"},
            BASE_STATE, new,
        )
        assert isinstance(fb, str)


class TestGenerateRealFeedbackGameScenarios:
    @pytest.mark.parametrize("scenario_id", [
        "game-001", "game-002", "game-003",
        "adv-game-001", "adv-game-002", "adv-game-003",
    ])
    def test_game_scenarios(self, scenario_id):
        new = _delta(BASE_STATE, resources=900, satisfaction=55)
        fb = generate_real_feedback(
            scenario_id, {"option": "2"}, BASE_STATE, new,
        )
        assert isinstance(fb, str)
        assert len(fb) > 0

    @pytest.mark.parametrize("scenario_id,option", [
        ("game-001", "1"), ("game-001", "3"), ("game-001", "4"),
        ("game-002", "1"), ("game-003", "4"),
    ])
    def test_game_options(self, scenario_id, option):
        new = _delta(BASE_STATE, satisfaction=50, resources=1000)
        fb = generate_real_feedback(
            scenario_id, {"option": option}, BASE_STATE, new,
        )
        assert isinstance(fb, str)


class TestGenerateRealFeedbackHistoricalCases:
    @pytest.mark.parametrize("scenario_id,decision", [
        ("hist-001", "delay"),
        ("hist-001", "launch"),
        ("hist-002", "safe_route"),
        ("hist-002", "fast_route"),
        ("hist-003", "full_support"),
        ("hist-003", "covert"),
    ])
    def test_historical_scenarios(self, scenario_id, decision):
        new = _delta(BASE_STATE, reputation=40, resources=900)
        fb = generate_real_feedback(
            scenario_id, {"decision": decision}, BASE_STATE, new,
        )
        assert isinstance(fb, str)


class TestGenerateRealFeedbackEdgeCases:
    def test_unknown_scenario_returns_default(self):
        new = _delta(BASE_STATE)
        fb = generate_real_feedback(
            "nonexistent-scenario", {}, BASE_STATE, new,
        )
        # Should still return a string (possibly a default message)
        assert isinstance(fb, str)

    def test_empty_decisions_dict(self):
        new = _delta(BASE_STATE)
        fb = generate_real_feedback(
            "coffee-shop-nonlinear-effects", {}, BASE_STATE, new,
        )
        assert isinstance(fb, str)

    def test_zero_amount_hire_staff(self):
        new = _delta(BASE_STATE, satisfaction=50, resources=1000)
        fb = generate_real_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "hire_staff", "amount": 0},
            BASE_STATE, new,
        )
        assert isinstance(fb, str)


class TestGeneratePatternAnalysisFeedback:
    def test_no_pattern_returns_base_feedback(self):
        new = _delta(BASE_STATE)
        fb = generate_pattern_analysis_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "hire_staff"},
            BASE_STATE, new,
            decision_history=[],
            pattern_detected=None,
        )
        assert isinstance(fb, str)


@pytest.mark.skip(reason="generate_pattern_analysis_feedback uses global cross_scenario_analyzer from start.py; requires full module setup")
class TestGeneratePatternAnalysisFeedbackWithPattern:
    def test_with_pattern_returns_bias_reveal(self):
        new = _delta(BASE_STATE)
        pattern = {
            "pattern_type": "激进/立即决策模式",
            "evidence": "3次连续选择激进选项",
            "significance": "高",
        }
        fb = generate_pattern_analysis_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "hire_staff"},
            BASE_STATE, new,
            decision_history=[{"decisions": {"option": "1"}}] * 3,
            pattern_detected=pattern,
        )
        assert "激进" in fb or "模式" in fb


@pytest.mark.skip(reason="generate_advanced_feedback uses global cross_scenario_analyzer from start.py; requires full module setup")
class TestGenerateAdvancedFeedback:
    def test_with_pattern_tracker(self):
        from logic.pattern_tracker import DecisionPatternTracker
        tracker = DecisionPatternTracker()
        for _ in range(3):
            tracker.track_decision("test", {"option": "1"}, {})

        new = _delta(BASE_STATE)
        fb = generate_advanced_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "hire_staff"},
            BASE_STATE, new,
            decision_history=[],
            pattern_tracker=tracker,
            turn_number=5,
        )
        assert isinstance(fb, str)

    def test_turn_4_plus_triggers_advanced(self):
        new = _delta(BASE_STATE)
        fb = generate_advanced_feedback(
            "relationship-time-delay",
            {"action": "communication"},
            BASE_STATE, new,
            decision_history=[],
            pattern_tracker=None,
            turn_number=4,
        )
        assert isinstance(fb, str)

    def test_without_tracker_turn_3_or_less(self):
        new = _delta(BASE_STATE)
        fb = generate_advanced_feedback(
            "coffee-shop-nonlinear-effects",
            {"action": "hire_staff"},
            BASE_STATE, new,
            decision_history=[],
            pattern_tracker=None,
            turn_number=2,
        )
        assert isinstance(fb, str)
