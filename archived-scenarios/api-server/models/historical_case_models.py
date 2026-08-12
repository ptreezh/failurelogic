"""
Database models for storing user interaction with historical cases.
Defines the data structures for tracking user progress and interactions.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class HistoricalCaseInteraction(BaseModel):
    """
    Model representing a user's interaction with a historical case scenario.
    """
    id: Optional[str] = None
    user_id: str
    case_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_step: int = 0
    selected_options: List[Dict[str, Any]] = []  # Stores {step: int, option_index: int, timestamp: datetime}
    time_spent_seconds: int = 0
    reflection_notes: Optional[str] = None
    rating: Optional[int] = None  # 1-5 star rating
    completed: bool = False


class HistoricalCaseProgress(BaseModel):
    """
    Model representing a user's overall progress with historical cases.
    """
    user_id: str
    completed_cases: List[str] = []  # List of case IDs completed
    in_progress_cases: List[Dict[str, Any]] = []  # {case_id: str, current_step: int, interaction_id: str}
    total_time_spent: int = 0  # Total seconds spent on historical cases
    last_accessed: Optional[datetime] = None
    overall_rating: Optional[float] = None  # Average rating across all completed cases
    lessons_learned: List[str] = []  # List of key lessons the user feels they learned


class HistoricalCaseAnalytics(BaseModel):
    """
    Model for storing analytics data about historical case usage.
    """
    case_id: str
    total_attempts: int = 0
    completion_rate: float = 0.0
    average_time_spent: int = 0  # Average seconds to complete
    most_common_selections: List[Dict[str, Any]] = []  # {step: int, option_index: int, count: int, percentage: float}
    average_rating: Optional[float] = None
    feedback_count: int = 0
    last_updated: datetime = datetime.now()


class UserHistoricalCaseSummary(BaseModel):
    """
    Model for summarizing a user's historical case experience.
    """
    user_id: str
    total_cases_attempted: int = 0
    total_cases_completed: int = 0
    completion_percentage: float = 0.0
    total_time_spent: int = 0  # In seconds
    favorite_cases: List[str] = []  # Top 3 favorite case IDs
    areas_of_improvement: List[str] = []  # Cognitive bias areas needing improvement
    achievement_badges: List[str] = []  # Earned badges
    last_active_date: Optional[datetime] = None
    streak_days: int = 0  # Consecutive days of activity