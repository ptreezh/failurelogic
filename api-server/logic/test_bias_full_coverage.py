"""Tests for all 12 bias detection methods (R6.1).

Covers the 7 previously-unimplemented bias types in
enhanced_cognitive_bias_detection.py.
"""
import pytest
from logic.enhanced_cognitive_bias_detection import (
    BiasType,
    EnhancedCognitiveBiasAnalyzer,
)


@pytest.fixture
def analyzer():
    return EnhancedCognitiveBiasAnalyzer()


class TestHindsightBias:
    def test_no_deviation(self, analyzer):
        r = analyzer.detect_hindsight_bias(100, 100)
        assert r.bias_type == BiasType.HINDSIGHT_BIAS
        assert r.detected is False
        assert r.confidence_score < 0.35

    def test_large_deviation_detected(self, analyzer):
        # Would have estimated 500 vs past 100 → 400% deviation
        r = analyzer.detect_hindsight_bias(100, 500)
        assert r.detected is True
        assert r.strength_level in ("strong", "severe")


class TestRepresentativenessBias:
    def test_baseline_match(self, analyzer):
        r = analyzer.detect_representativeness_bias(stereotype_match=0.3, base_rate=0.3)
        assert r.bias_type == BiasType.REPRESENTATIVENESS_BIAS
        assert r.detected is False

    def test_ignore_baseline(self, analyzer):
        # High stereotype estimate (90%) vs low base rate (10%) → 800% deviation
        r = analyzer.detect_representativeness_bias(stereotype_match=0.9, base_rate=0.1)
        assert r.detected is True


class TestLossAversionBias:
    def test_balanced(self, analyzer):
        r = analyzer.detect_loss_aversion_bias(loss_amount=100, gain_amount=100)
        assert r.bias_type == BiasType.LOSS_AVERSION_BIAS
        # Ratio 1.0 = no loss aversion
        assert r.detected is False

    def test_strong_loss_aversion(self, analyzer):
        # Loss feels 3x worse than equivalent gain
        r = analyzer.detect_loss_aversion_bias(loss_amount=300, gain_amount=100)
        assert r.detected is True
        assert r.strength_level in ("strong", "severe")


class TestStatusQuoBias:
    def test_no_bias(self, analyzer):
        # Equal preference
        r = analyzer.detect_status_quo_bias(current_choice=50, alternative_choice=50)
        assert r.bias_type == BiasType.STATUS_QUO_BIAS
        assert r.detected is False

    def test_strong_preference_for_status_quo(self, analyzer):
        r = analyzer.detect_status_quo_bias(current_choice=90, alternative_choice=10)
        # 90% preference for status quo → strong
        assert r.detected is True


class TestAnchorAdjustmentBias:
    def test_reasonable_anchors(self, analyzer):
        r = analyzer.detect_anchor_adjustment_bias(
            high_anchor_estimate=110,
            low_anchor_estimate=90,
            reasonable_value=100,
        )
        assert r.bias_type == BiasType.ANCHOR_ADJUSTMENT_BIAS
        # Small deviation → not detected
        assert r.detected is False

    def test_extreme_anchors(self, analyzer):
        # Both anchors far from reasonable value
        r = analyzer.detect_anchor_adjustment_bias(
            high_anchor_estimate=500,
            low_anchor_estimate=20,
            reasonable_value=100,
        )
        assert r.detected is True

    def test_zero_reasonable_value(self, analyzer):
        r = analyzer.detect_anchor_adjustment_bias(
            high_anchor_estimate=100,
            low_anchor_estimate=50,
            reasonable_value=0,
        )
        # Edge case handled gracefully
        assert r.bias_type == BiasType.ANCHOR_ADJUSTMENT_BIAS


class TestFramingEffectBias:
    def test_same_choice_both_frames(self, analyzer):
        r = analyzer.detect_framing_effect_bias(
            positive_frame_choice=0.5,
            negative_frame_choice=0.5,
        )
        assert r.bias_type == BiasType.FRAMING_EFFECT_BIAS
        assert r.detected is False

    def test_dramatic_frame_difference(self, analyzer):
        r = analyzer.detect_framing_effect_bias(
            positive_frame_choice=0.9,
            negative_frame_choice=0.2,
        )
        # 70% difference
        assert r.detected is True


class TestSocialProofBias:
    def test_independent_judgment(self, analyzer):
        r = analyzer.detect_social_proof_bias(
            group_behavior=20,
            independent_judgment=80,
        )
        assert r.bias_type == BiasType.SOCIAL_PROOF_BIAS
        assert r.detected is False

    def test_strong_group_following(self, analyzer):
        r = analyzer.detect_social_proof_bias(
            group_behavior=90,
            independent_judgment=10,
        )
        assert r.detected is True


class TestDetectAllBiasesFullCoverage:
    """Verify detect_all_biases routes to the 7 new methods correctly."""

    def test_hindsight_routing(self, analyzer):
        results = analyzer.detect_all_biases({"past_estimate": 100, "would_have_estimated": 300})
        assert any(r.bias_type == BiasType.HINDSIGHT_BIAS for r in results)

    def test_representativeness_routing(self, analyzer):
        results = analyzer.detect_all_biases({"stereotype_match": 0.9, "base_rate": 0.1})
        assert any(r.bias_type == BiasType.REPRESENTATIVENESS_BIAS for r in results)

    def test_loss_aversion_routing(self, analyzer):
        results = analyzer.detect_all_biases({"loss_amount": 300, "gain_amount": 100})
        assert any(r.bias_type == BiasType.LOSS_AVERSION_BIAS for r in results)

    def test_status_quo_routing(self, analyzer):
        results = analyzer.detect_all_biases({"current_choice": 90, "alternative_choice": 10})
        assert any(r.bias_type == BiasType.STATUS_QUO_BIAS for r in results)

    def test_anchor_adjustment_routing(self, analyzer):
        results = analyzer.detect_all_biases({
            "high_anchor_estimate": 500,
            "low_anchor_estimate": 20,
            "reasonable_value": 100,
        })
        assert any(r.bias_type == BiasType.ANCHOR_ADJUSTMENT_BIAS for r in results)

    def test_framing_routing(self, analyzer):
        results = analyzer.detect_all_biases({
            "positive_frame_choice": 0.9,
            "negative_frame_choice": 0.2,
        })
        assert any(r.bias_type == BiasType.FRAMING_EFFECT_BIAS for r in results)

    def test_social_proof_routing(self, analyzer):
        results = analyzer.detect_all_biases({
            "group_behavior": 90,
            "independent_judgment": 10,
        })
        assert any(r.bias_type == BiasType.SOCIAL_PROOF_BIAS for r in results)

    def test_full_payload_routes_all_twelve(self, analyzer):
        """With all required keys, detect_all_biases should return 12 results."""
        results = analyzer.detect_all_biases({
            "user_estimation": 100, "actual_value": 10000,
            "selected_info_count": 8, "opposing_info_count": 2, "belief_change_after_opposing": 0.2,
            "initial_anchor": 50, "final_estimate": 55, "reasonable_range_min": 40, "reasonable_range_max": 60,
            "memorable_event_weight": 0.7, "statistical_probability": 0.2, "decision_based_on_memory": True,
            "confidence_percentage": 80, "accuracy_percentage": 50,
            "past_estimate": 100, "would_have_estimated": 300,
            "stereotype_match": 0.9, "base_rate": 0.1,
            "loss_amount": 300, "gain_amount": 100,
            "current_choice": 90, "alternative_choice": 10,
            "high_anchor_estimate": 500, "low_anchor_estimate": 20, "reasonable_value": 100,
            "positive_frame_choice": 0.9, "negative_frame_choice": 0.2,
            "group_behavior": 90, "independent_judgment": 10,
        })
        assert len(results) == 12
        detected_types = {r.bias_type for r in results}
        assert len(detected_types) == 12
