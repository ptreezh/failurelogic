"""Integration tests for logic/turn_executor.py (R9.2 cover, not refactor).

Covers execute_real_logic with all 12 scenario_id branches.
"""
import pytest

from logic.turn_executor import execute_real_logic


BASE_STATE = {
    "satisfaction": 50,
    "resources": 1000,
    "reputation": 50,
    "portfolio": 10000,
    "knowledge": 0,
    "trust": 50,
    "turn_number": 1,
}


def _mutate(base, **changes):
    return {**base, **changes}


class TestCoffeeShopBranch:
    def test_hire_staff_beginner(self):
        new = execute_real_logic(
            "coffee-shop-linear-thinking", BASE_STATE,
            {"action": "hire_staff", "amount": 2}, "beginner",
        )
        assert "satisfaction" in new
        assert "resources" in new
        assert new["satisfaction"] >= 0
        assert new["resources"] >= 0

    def test_hire_staff_intermediate(self):
        new = execute_real_logic(
            "coffee-shop-linear-thinking", BASE_STATE,
            {"action": "hire_staff", "amount": 4}, "intermediate",
        )
        assert new["satisfaction"] >= 0

    def test_hire_staff_advanced(self):
        new = execute_real_logic(
            "coffee-shop-linear-thinking", BASE_STATE,
            {"action": "hire_staff", "amount": 6}, "advanced",
        )
        assert new["satisfaction"] >= 0

    def test_marketing(self):
        new = execute_real_logic(
            "coffee-shop-linear-thinking", BASE_STATE,
            {"action": "marketing", "amount": 3}, "beginner",
        )
        assert new["satisfaction"] >= 0

    def test_supply_chain(self):
        new = execute_real_logic(
            "coffee-shop-linear-thinking", BASE_STATE,
            {"action": "supply_chain", "amount": 5}, "beginner",
        )
        assert new["satisfaction"] >= 0

    def test_unknown_action_keeps_state(self):
        new = execute_real_logic(
            "coffee-shop-linear-thinking", BASE_STATE,
            {"action": "unknown"}, "beginner",
        )
        # Should not crash; resources/satisfaction should remain valid
        assert isinstance(new, dict)


class TestRelationshipBranch:
    def test_communication(self):
        new = execute_real_logic(
            "relationship-time-delay", BASE_STATE,
            {"action": "communication"},
        )
        assert "trust" in new

    def test_gift(self):
        new = execute_real_logic(
            "relationship-time-delay", BASE_STATE,
            {"action": "gift"},
        )
        assert isinstance(new, dict)


class TestInvestmentBranch:
    def test_research(self):
        new = execute_real_logic(
            "investment-confirmation-bias", BASE_STATE,
            {"action": "research"},
        )
        assert "portfolio" in new

    def test_diversify(self):
        new = execute_real_logic(
            "investment-confirmation-bias", BASE_STATE,
            {"action": "diversify"},
        )
        assert "portfolio" in new


class TestGameScenarios:
    @pytest.mark.parametrize("scenario_id", [
        "game-001", "game-002", "game-003",
    ])
    @pytest.mark.parametrize("option", ["1", "2", "3", "4"])
    def test_all_options(self, scenario_id, option):
        new = execute_real_logic(
            scenario_id, BASE_STATE, {"option": option},
        )
        assert isinstance(new, dict)


class TestHistoricalCases:
    @pytest.mark.parametrize("scenario_id,decision", [
        ("hist-001", "delay"),
        ("hist-001", "launch"),
        ("hist-002", "safe_route"),
        ("hist-002", "fast_route"),
        ("hist-003", "full_support"),
        ("hist-003", "covert"),
    ])
    def test_all_decisions(self, scenario_id, decision):
        new = execute_real_logic(
            scenario_id, BASE_STATE, {"decision": decision},
        )
        assert isinstance(new, dict)


class TestAdvancedGameScenarios:
    @pytest.mark.parametrize("scenario_id", [
        "adv-game-001", "adv-game-002", "adv-game-003",
    ])
    @pytest.mark.parametrize("option", ["1", "2", "3", "4"])
    def test_all_options(self, scenario_id, option):
        new = execute_real_logic(
            scenario_id, BASE_STATE, {"option": option},
        )
        assert isinstance(new, dict)


class TestStateBounds:
    @pytest.mark.parametrize("scenario_id", [
        "coffee-shop-linear-thinking",
        "relationship-time-delay",
        "investment-confirmation-bias",
        "game-001", "game-002", "game-003",
        "hist-001", "hist-002", "hist-003",
        "adv-game-001", "adv-game-002", "adv-game-003",
    ])
    def test_all_12_scenarios_keep_resources_non_negative(self, scenario_id):
        """No scenario can make resources < 0 (game would be unwinnable)."""
        new = execute_real_logic(
            scenario_id, BASE_STATE, {"action": "x", "option": "1", "decision": "x"},
        )
        assert new["resources"] >= 0

    @pytest.mark.parametrize("scenario_id", [
        "coffee-shop-linear-thinking",
        "relationship-time-delay",
        "investment-confirmation-bias",
    ])
    def test_main_scenarios_keep_satisfaction_in_bounds(self, scenario_id):
        new = execute_real_logic(
            scenario_id, BASE_STATE, {"action": "x", "option": "1", "decision": "x"},
        )
        assert 0 <= new["satisfaction"] <= 100


class TestUnknownScenario:
    def test_unknown_returns_clamped_state(self):
        new = execute_real_logic("nonexistent-scenario", BASE_STATE, {})
        assert new["resources"] == BASE_STATE["resources"]
        assert isinstance(new, dict)
