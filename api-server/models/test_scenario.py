"""Tests for api-server/models/scenario.py (R7.3)."""
import pytest
from pydantic import ValidationError

from models.scenario import (
    ScenarioType,
    DifficultyLevel,
    AdvancedChallenge,
    GameRules,
    GameStep,
    GameAnalysis,
    DecisionPoint,
    PyramidAnalysis,
    BasicScenario,
    GameScenario,
    HistoricalCase,
    GameState,
)


class TestEnums:
    def test_scenario_type_values(self):
        assert ScenarioType.BASIC.value == "basic"
        assert ScenarioType.GAME.value == "game"
        assert ScenarioType.HISTORICAL.value == "historical"

    def test_difficulty_levels(self):
        assert DifficultyLevel.BEGINNER.value == "beginner"
        assert DifficultyLevel.INTERMEDIATE.value == "intermediate"
        assert DifficultyLevel.ADVANCED.value == "advanced"


class TestBasicScenario:
    def test_minimal(self):
        s = BasicScenario(
            id="coffee-shop-test",
            title="Test Coffee",
            description="Test desc",
            difficulty=DifficultyLevel.BEGINNER,
            estimatedDuration=15,
        )
        assert s.id == "coffee-shop-test"
        assert s.scenarioType == ScenarioType.BASIC
        assert s.estimatedDuration == 15
        assert s.category is None
        assert s.targetBiases == []
        assert s.advancedChallenges == []

    def test_with_optional_fields(self):
        s = BasicScenario(
            id="relationship-time-delay",
            title="Relationship",
            description="Desc",
            difficulty=DifficultyLevel.INTERMEDIATE,
            estimatedDuration=20,
            fullDescription="Full",
            targetBiases=["time_delay"],
            cognitiveBias="time_delay_bias",
            category="人际关系",
        )
        assert s.fullDescription == "Full"
        assert "time_delay" in s.targetBiases

    def test_zero_duration_rejected(self):
        with pytest.raises(ValidationError):
            BasicScenario(
                id="x", title="x", description="x",
                difficulty=DifficultyLevel.BEGINNER,
                estimatedDuration=0,
            )

    def test_negative_duration_rejected(self):
        with pytest.raises(ValidationError):
            BasicScenario(
                id="x", title="x", description="x",
                difficulty=DifficultyLevel.BEGINNER,
                estimatedDuration=-5,
            )


class TestGameScenario:
    def test_id_property_returns_scenario_id(self):
        s = GameScenario(
            scenarioId="game-001",
            title="Test Game",
            description="Desc",
            gameType="strategy",
            rules=GameRules(players=2, duration="30min", skillsTested=["logic"]),
            steps=[GameStep(step=1, situation="Setup", options=["a", "b"])],
            analysis=GameAnalysis(
                purpose="Test purpose",
                cognitiveBiasesTested=["confirmation_bias"],
                learningObjectives=["Learn X"],
            ),
            difficulty=DifficultyLevel.INTERMEDIATE,
            estimatedDuration=30,
        )
        assert s.id == "game-001"  # property returns scenarioId
        assert s.scenarioType == ScenarioType.GAME

    def test_scenario_id_required(self):
        with pytest.raises(ValidationError):
            GameScenario(
                title="x", description="x", gameType="x",
                rules=GameRules(players=1, duration="x", skillsTested=[]),
                steps=[], analysis=GameAnalysis(purpose="x", cognitiveBiasesTested=[], learningObjectives=[]),
                difficulty=DifficultyLevel.BEGINNER, estimatedDuration=10,
            )


class TestHistoricalCase:
    def test_minimal(self):
        h = HistoricalCase(
            scenarioId="hist-001",
            title="Challenger",
            description="O-ring failure",
            decisionPoints=[DecisionPoint(step=1, situation="Cold weather", options=["delay", "launch"])],
            actualOutcomes=["Disaster"],
            alternativeOptions=["Delay launch"],
            lessons=["Listen to engineers"],
            pyramidAnalysis=PyramidAnalysis(
                coreConclusion="Hubris kills",
                supportingArguments=["ignored warning signs"],
                examples=["Challenger"],
                actionableAdvice=["Respect domain expertise"],
            ),
            difficulty=DifficultyLevel.ADVANCED,
            estimatedDuration=25,
        )
        assert h.id == "hist-001"
        assert h.scenarioType == ScenarioType.HISTORICAL
        assert len(h.decisionPoints) == 1
        assert h.pyramidAnalysis.coreConclusion == "Hubris kills"


class TestGameState:
    def test_default_values(self):
        gs = GameState()
        assert gs.satisfaction == 50
        assert gs.resources == 1000
        assert gs.reputation == 50
        assert gs.portfolio == 10000
        assert gs.knowledge == 0
        assert gs.trust == 50
        assert gs.turn_number == 1

    def test_custom_values(self):
        gs = GameState(satisfaction=80, resources=500, turn_number=5)
        assert gs.satisfaction == 80
        assert gs.resources == 500
        assert gs.turn_number == 5

    def test_partial_update_keeps_defaults(self):
        gs = GameState(portfolio=50000)
        assert gs.portfolio == 50000
        assert gs.satisfaction == 50  # default unchanged


class TestAdvancedChallenge:
    def test_create(self):
        c = AdvancedChallenge(
            title="Hard",
            description="Desc",
            difficulty=DifficultyLevel.ADVANCED,
            cognitiveBiases=["nonlinear_effects"],
        )
        assert c.title == "Hard"
        assert "nonlinear_effects" in c.cognitiveBiases


class TestGameStep:
    def test_with_optional_explanation(self):
        step = GameStep(step=1, situation="Setup", options=["a", "b"], explanation="Why?")
        assert step.explanation == "Why?"

    def test_without_explanation(self):
        step = GameStep(step=1, situation="Setup", options=["a", "b"])
        assert step.explanation is None


class TestPyramidAnalysis:
    def test_create(self):
        p = PyramidAnalysis(
            coreConclusion="Test",
            supportingArguments=["a1", "a2"],
            examples=["ex1"],
            actionableAdvice=["do X"],
        )
        assert p.coreConclusion == "Test"
        assert len(p.supportingArguments) == 2
