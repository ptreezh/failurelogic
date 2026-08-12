"""
Progress tracking for historical case scenarios.
Manages and tracks user progress through historical scenarios.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import os
from api_server.models.historical_case_models import (
    HistoricalCaseInteraction, 
    HistoricalCaseProgress, 
    HistoricalCaseAnalytics, 
    UserHistoricalCaseSummary
)


class HistoricalCaseProgressTracker:
    """
    Tracks user progress through historical case scenarios.
    """
    
    def __init__(self, storage_path: str = "api-server/data/user_progress"):
        self.storage_path = storage_path
        self.ensure_storage_directory()
        
        # In-memory cache for active progress tracking
        self.progress_cache = {}
    
    def ensure_storage_directory(self):
        """
        Ensure the storage directory exists.
        """
        os.makedirs(self.storage_path, exist_ok=True)
    
    def get_user_progress(self, user_id: str) -> HistoricalCaseProgress:
        """
        Get a user's overall progress with historical cases.
        """
        file_path = os.path.join(self.storage_path, f"{user_id}_progress.json")
        
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return HistoricalCaseProgress(**data)
            else:
                # Create default progress record
                progress = HistoricalCaseProgress(user_id=user_id)
                self.save_user_progress(progress)
                return progress
        except Exception as e:
            print(f"Error loading progress for user {user_id}: {str(e)}")
            # Return default progress if there's an error
            return HistoricalCaseProgress(user_id=user_id)
    
    def save_user_progress(self, progress: HistoricalCaseProgress) -> bool:
        """
        Save a user's progress to storage.
        """
        try:
            file_path = os.path.join(self.storage_path, f"{progress.user_id}_progress.json")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(progress.dict(), f, ensure_ascii=False, indent=2, default=str)
            
            # Update cache
            self.progress_cache[progress.user_id] = progress
            
            return True
        except Exception as e:
            print(f"Error saving progress for user {progress.user_id}: {str(e)}")
            return False
    
    def get_case_interaction(self, user_id: str, case_id: str) -> Optional[HistoricalCaseInteraction]:
        """
        Get a user's interaction with a specific historical case.
        """
        progress = self.get_user_progress(user_id)
        
        # Find the interaction in in-progress cases
        for in_progress in progress.in_progress_cases:
            if in_progress.get('case_id') == case_id:
                interaction_id = in_progress.get('interaction_id')
                return self._load_interaction_file(user_id, interaction_id)
        
        # Check if it's a completed case
        if case_id in progress.completed_cases:
            return self._load_interaction_file(user_id, case_id)
        
        return None
    
    def _load_interaction_file(self, user_id: str, interaction_id: str) -> Optional[HistoricalCaseInteraction]:
        """
        Load an interaction record from file.
        """
        file_path = os.path.join(self.storage_path, f"{user_id}_interaction_{interaction_id}.json")
        
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return HistoricalCaseInteraction(**data)
        except Exception as e:
            print(f"Error loading interaction {interaction_id} for user {user_id}: {str(e)}")
        
        return None
    
    def save_case_interaction(self, interaction: HistoricalCaseInteraction) -> bool:
        """
        Save a user's interaction with a historical case.
        """
        try:
            if not interaction.id:
                interaction.id = f"{interaction.case_id}_{int(datetime.now().timestamp())}"
            
            file_path = os.path.join(self.storage_path, f"{interaction.user_id}_interaction_{interaction.id}.json")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(interaction.dict(), f, ensure_ascii=False, indent=2, default=str)
            
            # Update user progress
            self._update_user_progress_for_interaction(interaction)
            
            return True
        except Exception as e:
            print(f"Error saving interaction for user {interaction.user_id}, case {interaction.case_id}: {str(e)}")
            return False
    
    def _update_user_progress_for_interaction(self, interaction: HistoricalCaseInteraction):
        """
        Update the user's overall progress based on an interaction.
        """
        progress = self.get_user_progress(interaction.user_id)
        
        # Update completed cases
        if interaction.completed and interaction.case_id not in progress.completed_cases:
            progress.completed_cases.append(interaction.case_id)
        
        # Update in-progress cases
        existing_in_progress = None
        for i, in_progress in enumerate(progress.in_progress_cases):
            if in_progress.get('case_id') == interaction.case_id:
                existing_in_progress = i
                break
        
        if interaction.completed:
            # Remove from in-progress if completed
            if existing_in_progress is not None:
                progress.in_progress_cases.pop(existing_in_progress)
        else:
            # Add or update in-progress
            in_progress_entry = {
                'case_id': interaction.case_id,
                'current_step': interaction.current_step,
                'interaction_id': interaction.id or interaction.case_id
            }
            
            if existing_in_progress is not None:
                progress.in_progress_cases[existing_in_progress] = in_progress_entry
            else:
                progress.in_progress_cases.append(in_progress_entry)
        
        # Update time spent
        progress.total_time_spent += interaction.time_spent_seconds
        
        # Update last accessed
        progress.last_accessed = datetime.now()
        
        # Update rating if provided
        if interaction.rating:
            if progress.overall_rating is None:
                progress.overall_rating = float(interaction.rating)
            else:
                # Calculate weighted average
                total_cases = len(progress.completed_cases)
                if total_cases > 0:
                    progress.overall_rating = (
                        (progress.overall_rating * (total_cases - 1) + interaction.rating) / total_cases
                    )
        
        # Update lessons learned if provided
        if interaction.reflection_notes:
            # Simple keyword extraction from notes (in a real system, this would be more sophisticated)
            keywords = self._extract_keywords(interaction.reflection_notes)
            for keyword in keywords:
                if keyword not in progress.lessons_learned:
                    progress.lessons_learned.append(keyword)
        
        # Save updated progress
        self.save_user_progress(progress)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text (simplified implementation).
        """
        keywords = []
        text_lower = text.lower()
        
        # Common cognitive bias terms
        bias_terms = [
            'confirmation bias', 'groupthink', 'overconfidence', 'availability heuristic',
            'anchoring', 'framing', 'hindsight', 'sunk cost', 'loss aversion'
        ]
        
        for term in bias_terms:
            if term in text_lower:
                if term not in keywords:
                    keywords.append(term)
        
        return keywords
    
    def get_user_summary(self, user_id: str) -> UserHistoricalCaseSummary:
        """
        Get a summary of a user's historical case experience.
        """
        progress = self.get_user_progress(user_id)
        
        # Calculate statistics
        total_attempts = len(progress.completed_cases) + len(progress.in_progress_cases)
        completion_percentage = (
            len(progress.completed_cases) / total_attempts * 100 if total_attempts > 0 else 0
        )
        
        # Find favorite cases (based on ratings or completion)
        # This is a simplified approach - in reality, you'd have more data
        favorite_cases = progress.completed_cases[:3]  # Top 3 completed cases
        
        # Identify areas of improvement (would be based on performance analysis in a real system)
        areas_of_improvement = ["confirmation bias", "system thinking", "risk assessment"]
        
        # Calculate streak (simplified - would need daily login data in reality)
        streak_days = 0  # Would be calculated based on actual usage patterns
        
        summary = UserHistoricalCaseSummary(
            user_id=user_id,
            total_cases_attempted=total_attempts,
            total_cases_completed=len(progress.completed_cases),
            completion_percentage=completion_percentage,
            total_time_spent=progress.total_time_spent,
            favorite_cases=favorite_cases,
            areas_of_improvement=areas_of_improvement,
            achievement_badges=self._calculate_achievements(progress),
            last_active_date=progress.last_accessed,
            streak_days=streak_days
        )
        
        return summary
    
    def _calculate_achievements(self, progress: HistoricalCaseProgress) -> List[str]:
        """
        Calculate achievement badges based on progress.
        """
        achievements = []
        
        if len(progress.completed_cases) >= 5:
            achievements.append("Historical Detective (5+ cases completed)")
        if len(progress.completed_cases) >= 10:
            achievements.append("History Scholar (10+ cases completed)")
        if progress.total_time_spent >= 3600:  # 1 hour
            achievements.append("Deep Thinker (1+ hours spent)")
        if progress.overall_rating and progress.overall_rating >= 4.0:
            achievements.append("Critical Analyst (4+ average rating)")
        
        return achievements
    
    def get_case_analytics(self, case_id: str) -> HistoricalCaseAnalytics:
        """
        Get analytics for a specific historical case.
        """
        # This would typically aggregate data from multiple users
        # For now, we'll create a basic analytics record
        analytics_file = os.path.join(self.storage_path, f"analytics_{case_id}.json")
        
        try:
            if os.path.exists(analytics_file):
                with open(analytics_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return HistoricalCaseAnalytics(**data)
            else:
                # Create default analytics record
                analytics = HistoricalCaseAnalytics(case_id=case_id)
                self.save_case_analytics(analytics)
                return analytics
        except Exception as e:
            print(f"Error loading analytics for case {case_id}: {str(e)}")
            return HistoricalCaseAnalytics(case_id=case_id)
    
    def save_case_analytics(self, analytics: HistoricalCaseAnalytics) -> bool:
        """
        Save analytics for a historical case.
        """
        try:
            file_path = os.path.join(self.storage_path, f"analytics_{analytics.case_id}.json")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(analytics.dict(), f, ensure_ascii=False, indent=2, default=str)
            
            return True
        except Exception as e:
            print(f"Error saving analytics for case {analytics.case_id}: {str(e)}")
            return False
    
    def record_user_decision(self, user_id: str, case_id: str, step: int, option_index: int):
        """
        Record a user's decision in a historical case.
        """
        # Load existing interaction or create new one
        interaction = self.get_case_interaction(user_id, case_id)
        
        if interaction is None:
            # Create new interaction
            interaction = HistoricalCaseInteraction(
                user_id=user_id,
                case_id=case_id,
                started_at=datetime.now(),
                current_step=step
            )
        
        # Add the decision to the interaction
        decision_record = {
            "step": step,
            "option_index": option_index,
            "timestamp": datetime.now().isoformat()
        }
        
        interaction.selected_options.append(decision_record)
        interaction.current_step = step + 1  # Move to next step
        
        # Save the updated interaction
        self.save_case_interaction(interaction)
    
    def complete_case_interaction(self, user_id: str, case_id: str, rating: Optional[int] = None, 
                                 reflection_notes: Optional[str] = None):
        """
        Mark a case interaction as completed.
        """
        interaction = self.get_case_interaction(user_id, case_id)
        
        if interaction is None:
            # This shouldn't happen if the user started the case, but create a minimal record
            interaction = HistoricalCaseInteraction(
                user_id=user_id,
                case_id=case_id,
                started_at=datetime.now()
            )
        
        # Update completion info
        interaction.completed_at = datetime.now()
        interaction.completed = True
        interaction.rating = rating
        interaction.reflection_notes = reflection_notes
        
        # Save the completed interaction
        self.save_case_interaction(interaction)


# Global instance of the progress tracker
historical_progress_tracker = HistoricalCaseProgressTracker()