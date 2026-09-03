"""Unit tests for logic/pattern_tracker.py (R2.6)."""
import pytest
from logic.pattern_tracker import DecisionPatternTracker, CrossScenarioAnalyzer


class TestDecisionPatternTracker:
    def test_initial_state_has_empty_lists(self):
        t = DecisionPatternTracker()
        for v in t.patterns.values():
            assert v == []

    def test_track_aggressive_option(self):
        t = DecisionPatternTracker()
        t.track_decision("test-scenario", {"option": "1"}, {})
        assert t.patterns["risk_preference"] == ["激进"]
        assert t.patterns["pace_preference"] == ["立即"]

    def test_track_conservative_option(self):
        t = DecisionPatternTracker()
        t.track_decision("test-scenario", {"option": "4"}, {})
        assert t.patterns["risk_preference"] == ["保守"]
        assert t.patterns["pace_preference"] == ["合作"]

    def test_track_three_same_consistency_high(self):
        t = DecisionPatternTracker()
        for _ in range(3):
            t.track_decision("test", {"option": "1"}, {})
        assert "高度一致" in t.patterns["decision_consistency"]

    def test_track_three_diverse_consistency_low(self):
        t = DecisionPatternTracker()
        t.track_decision("test", {"option": "1"}, {})
        t.track_decision("test", {"option": "2"}, {})
        t.track_decision("test", {"option": "4"}, {})
        assert "多样化" in t.patterns["decision_consistency"]

    def test_personalized_insight_aggressive(self):
        t = DecisionPatternTracker()
        for _ in range(3):
            t.track_decision("test", {"option": "1"}, {})
        insight = t.generate_personalized_insight()
        assert "高风险" in insight

    def test_personalized_insight_empty(self):
        t = DecisionPatternTracker()
        assert t.generate_personalized_insight() == ""

    def test_personalized_insight_consistency_warning(self):
        t = DecisionPatternTracker()
        # 3 same → consistency recorded
        for _ in range(3):
            t.track_decision("test", {"option": "1"}, {})
        # 4th → triggers consistency warning on next call
        t.track_decision("test", {"option": "1"}, {})
        insight = t.generate_personalized_insight()
        assert "思维定势" in insight


class TestCrossScenarioAnalyzer:
    def test_record_and_retrieve(self):
        a = CrossScenarioAnalyzer()
        a.record_pattern("s1", "激进模式")
        assert a.scenario_patterns["s1"] == "激进模式"
        assert a.pattern_frequency["激进模式"] == ["s1"]

    def test_insight_with_two_same_patterns(self):
        a = CrossScenarioAnalyzer()
        a.record_pattern("game-001", "激进")
        a.record_pattern("game-002", "激进")
        insight = a.generate_cross_scenario_insight(["game-001", "game-002"])
        assert "跨场景模式" in insight
        assert "激进" in insight

    def test_insight_single_pattern_no_output(self):
        a = CrossScenarioAnalyzer()
        a.record_pattern("game-001", "激进")
        insight = a.generate_cross_scenario_insight(["game-001"])
        # Only one scenario with this pattern → no cross-scenario insight
        assert insight == ""

    def test_insight_empty_input(self):
        a = CrossScenarioAnalyzer()
        assert a.generate_cross_scenario_insight([]) == ""
