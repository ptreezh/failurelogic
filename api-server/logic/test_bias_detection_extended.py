"""Extended tests for enhanced_cognitive_bias_detection.py (R4.3).

Covers:
- All 12 BiasType enum values
- detect_all_biases with various user_data combinations
- calculate_overall_bias_profile edge cases
- analyze_cognitive_bias_patterns wrapping
"""
import pytest
from logic.enhanced_cognitive_bias_detection import (
    BiasType,
    EnhancedCognitiveBiasAnalyzer,
    analyze_cognitive_bias_patterns,
)


class TestBiasTypeEnum:
    """Verify the 12 declared bias types are intact."""

    def test_all_12_bias_types_exist(self):
        expected = {
            "LINEAR_THINKING_BIAS",
            "CONFIRMATION_BIAS",
            "ANCHORING_BIAS",
            "AVAILABILITY_BIAS",
            "OVERCONFIDENCE_BIAS",
            "HINDSIGHT_BIAS",
            "REPRESENTATIVENESS_BIAS",
            "LOSS_AVERSION_BIAS",
            "STATUS_QUO_BIAS",
            "ANCHOR_ADJUSTMENT_BIAS",
            "FRAMING_EFFECT_BIAS",
            "SOCIAL_PROOF_BIAS",
        }
        actual = {bt.name for bt in BiasType}
        assert actual == expected

    def test_bias_type_values_are_lowercase(self):
        for bt in BiasType:
            assert bt.value == bt.value.lower()
            assert "_bias" in bt.value

    def test_analyzer_initialized_with_all_thresholds(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        assert len(analyzer.bias_thresholds) == 12


class TestDetectAllBiasesCombinations:
    """Verify detect_all_biases handles varied user_data."""

    def test_only_linear_thinking_data(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        results = analyzer.detect_all_biases({
            "user_estimation": 100,
            "actual_value": 10000
        })
        assert len(results) == 1
        assert results[0].bias_type == BiasType.LINEAR_THINKING_BIAS

    def test_overconfidence_data(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        # Large gap (>50% threshold): 95% confidence vs 30% accuracy = 65% gap
        results = analyzer.detect_all_biases({
            "confidence_percentage": 95,
            "accuracy_percentage": 30
        })
        assert len(results) == 1
        assert results[0].bias_type == BiasType.OVERCONFIDENCE_BIAS
        # 65% gap > 50% threshold → detected
        assert results[0].detected is True
        assert results[0].strength_level in ("strong", "severe")

    def test_overconfidence_within_range_not_detected(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        results = analyzer.detect_all_biases({
            "confidence_percentage": 70,
            "accuracy_percentage": 65
        })
        assert len(results) == 1
        # 5% gap should not trigger detection (threshold 50%)
        assert results[0].detected is False

    def test_anchoring_within_reasonable_range(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        results = analyzer.detect_all_biases({
            "initial_anchor": 50,
            "final_estimate": 55,
            "reasonable_range_min": 40,
            "reasonable_range_max": 60
        })
        assert len(results) == 1
        assert results[0].bias_type == BiasType.ANCHORING_BIAS

    def test_empty_data_returns_empty(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        assert analyzer.detect_all_biases({}) == []


class TestOverallBiasProfile:
    """calculate_overall_bias_profile edge cases."""

    def test_empty_results(self):
        analyzer = EnhancedCognitiveBiasAnalyzer()
        profile = analyzer.calculate_overall_bias_profile([])
        assert profile["total_biases_detected"] == 0
        assert profile["total_biases_analyzed"] == 0
        assert profile["average_confidence_score"] == 0
        assert profile["strongest_bias"] is None

    def test_profile_counts_strengths(self):
        from logic.enhanced_cognitive_bias_detection import BiasDetectionResult
        analyzer = EnhancedCognitiveBiasAnalyzer()
        results = [
            BiasDetectionResult(
                bias_type=BiasType.LINEAR_THINKING_BIAS,
                detected=True,
                confidence_score=0.8,
                strength_level="strong",
                explanation="",
                supporting_evidence=[],
                recommendations=[],
                timestamp=None,
            ),
            BiasDetectionResult(
                bias_type=BiasType.CONFIRMATION_BIAS,
                detected=False,
                confidence_score=0.2,
                strength_level="weak",
                explanation="",
                supporting_evidence=[],
                recommendations=[],
                timestamp=None,
            ),
        ]
        profile = analyzer.calculate_overall_bias_profile(results)
        assert profile["total_biases_detected"] == 1
        assert profile["total_biases_analyzed"] == 2
        assert profile["strongest_bias"] == "linear_thinking_bias"
        assert profile["bias_strength_distribution"]["strong"] == 1
        assert profile["bias_strength_distribution"]["weak"] == 0  # only counted if detected


class TestAnalyzePatternsWrapper:
    """analyze_cognitive_bias_patterns returns correct shape."""

    def test_returns_correct_keys(self):
        result = analyze_cognitive_bias_patterns([])
        assert "individual_results" in result
        assert "profile_summary" in result
        assert "analysis_timestamp" in result
        assert "accuracy_assessment" in result

    def test_processes_multiple_responses(self):
        result = analyze_cognitive_bias_patterns([
            {"user_estimation": 100, "actual_value": 10000},
            {"user_estimation": 200, "actual_value": 50000},
        ])
        assert len(result["individual_results"]) == 2

    def test_skips_responses_without_bias_keys(self):
        # No bias-detectable fields → individual_results should be empty
        result = analyze_cognitive_bias_patterns([{"random_field": "x"}])
        assert result["individual_results"] == []
        assert result["profile_summary"]["total_biases_analyzed"] == 0
