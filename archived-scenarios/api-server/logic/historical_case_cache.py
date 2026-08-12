"""
Caching mechanism for historical case data.
Implements efficient caching to improve performance of historical scenario access.
"""

import json
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from threading import Lock


class HistoricalCaseCache:
    """
    Cache for historical case data with TTL (Time To Live) expiration.
    """
    
    def __init__(self, default_ttl_minutes: int = 60):
        self.cache = {}
        self.timestamps = {}
        self.default_ttl = timedelta(minutes=default_ttl_minutes)
        self.lock = Lock()  # Thread safety for cache operations
        self.hit_count = 0
        self.miss_count = 0
    
    def set(self, key: str, value: Any, ttl_minutes: Optional[int] = None) -> bool:
        """
        Set a value in the cache with optional TTL override.
        """
        with self.lock:
            ttl = timedelta(minutes=ttl_minutes) if ttl_minutes is not None else self.default_ttl
            expiry_time = datetime.now() + ttl
            
            self.cache[key] = value
            self.timestamps[key] = expiry_time
            return True
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache, returning None if expired or not found.
        """
        with self.lock:
            # Check if key exists
            if key not in self.cache:
                self.miss_count += 1
                return None
            
            # Check if expired
            if datetime.now() > self.timestamps[key]:
                # Remove expired entry
                del self.cache[key]
                del self.timestamps[key]
                self.miss_count += 1
                return None
            
            self.hit_count += 1
            return self.cache[key]
    
    def delete(self, key: str) -> bool:
        """
        Delete a key from the cache.
        """
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                del self.timestamps[key]
                return True
            return False
    
    def clear(self):
        """
        Clear all entries from the cache.
        """
        with self.lock:
            self.cache.clear()
            self.timestamps.clear()
    
    def keys(self) -> List[str]:
        """
        Get all valid (non-expired) keys from the cache.
        """
        with self.lock:
            valid_keys = []
            now = datetime.now()
            
            for key, expiry_time in self.timestamps.items():
                if now <= expiry_time:
                    valid_keys.append(key)
                else:
                    # Clean up expired entry
                    del self.cache[key]
            
            return valid_keys
    
    def cleanup_expired(self):
        """
        Remove all expired entries from the cache.
        """
        with self.lock:
            now = datetime.now()
            expired_keys = []
            
            for key, expiry_time in self.timestamps.items():
                if now > expiry_time:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.cache[key]
                del self.timestamps[key]
    
    def stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        """
        with self.lock:
            total_requests = self.hit_count + self.miss_count
            hit_rate = (self.hit_count / total_requests * 100) if total_requests > 0 else 0
            
            return {
                "hit_count": self.hit_count,
                "miss_count": self.miss_count,
                "hit_rate_percent": round(hit_rate, 2),
                "cached_items_count": len(self.keys()),
                "cache_size_bytes": sum(len(str(v)) for v in self.cache.values()) if self.cache else 0
            }


class HistoricalScenarioCacheManager:
    """
    Manager for caching historical scenario data with optimized access patterns.
    """
    
    def __init__(self):
        self.scenario_cache = HistoricalCaseCache(default_ttl_minutes=120)  # 2 hours
        self.user_progress_cache = HistoricalCaseCache(default_ttl_minutes=30)  # 30 minutes
        self.session_cache = HistoricalCaseCache(default_ttl_minutes=60)  # 1 hour
        self.metadata_cache = HistoricalCaseCache(default_ttl_minutes=240)  # 4 hours
    
    def load_scenarios_from_file(self, file_path: str, cache_key_prefix: str = "scenario") -> int:
        """
        Load scenarios from a JSON file and cache them.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            count = 0
            if 'historical_cases' in data:
                for scenario in data['historical_cases']:
                    scenario_id = scenario.get('scenarioId')
                    if scenario_id:
                        cache_key = f"{cache_key_prefix}:{scenario_id}"
                        self.scenario_cache.set(cache_key, scenario)
                        count += 1
            
            return count
        except Exception as e:
            print(f"Error loading scenarios from {file_path}: {str(e)}")
            return 0
    
    def get_scenario(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a scenario from cache, loading from file if not present.
        """
        cache_key = f"scenario:{scenario_id}"
        scenario = self.scenario_cache.get(cache_key)
        
        if scenario is None:
            # Scenario not in cache, would normally load from storage
            # For now, return None - in a real implementation this would load dynamically
            return None
        
        return scenario
    
    def cache_scenario(self, scenario_id: str, scenario_data: Dict[str, Any], ttl_minutes: Optional[int] = None) -> bool:
        """
        Explicitly cache a scenario.
        """
        cache_key = f"scenario:{scenario_id}"
        return self.scenario_cache.set(cache_key, scenario_data, ttl_minutes)
    
    def get_user_progress(self, user_id: str, scenario_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached user progress for a scenario.
        """
        cache_key = f"progress:{user_id}:{scenario_id}"
        return self.user_progress_cache.get(cache_key)
    
    def cache_user_progress(self, user_id: str, scenario_id: str, progress_data: Dict[str, Any]) -> bool:
        """
        Cache user progress for a scenario.
        """
        cache_key = f"progress:{user_id}:{scenario_id}"
        return self.user_progress_cache.set(cache_key, progress_data, ttl_minutes=30)
    
    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached session data.
        """
        cache_key = f"session:{session_id}"
        return self.session_cache.get(cache_key)
    
    def cache_session_data(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """
        Cache session data.
        """
        cache_key = f"session:{session_id}"
        return self.session_cache.set(cache_key, session_data, ttl_minutes=60)
    
    def get_metadata(self, metadata_key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached metadata.
        """
        cache_key = f"metadata:{metadata_key}"
        return self.metadata_cache.get(cache_key)
    
    def cache_metadata(self, metadata_key: str, metadata_data: Dict[str, Any]) -> bool:
        """
        Cache metadata.
        """
        cache_key = f"metadata:{metadata_key}"
        return self.metadata_cache.set(cache_key, metadata_data, ttl_minutes=240)
    
    def invalidate_scenario(self, scenario_id: str) -> bool:
        """
        Invalidate a specific scenario cache entry.
        """
        cache_key = f"scenario:{scenario_id}"
        return self.scenario_cache.delete(cache_key)
    
    def invalidate_user_progress(self, user_id: str, scenario_id: str) -> bool:
        """
        Invalidate user progress cache entry.
        """
        cache_key = f"progress:{user_id}:{scenario_id}"
        return self.user_progress_cache.delete(cache_key)
    
    def cleanup_all_expired(self):
        """
        Cleanup expired entries from all caches.
        """
        self.scenario_cache.cleanup_expired()
        self.user_progress_cache.cleanup_expired()
        self.session_cache.cleanup_expired()
        self.metadata_cache.cleanup_expired()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get statistics for all caches.
        """
        return {
            "scenario_cache": self.scenario_cache.stats(),
            "user_progress_cache": self.user_progress_cache.stats(),
            "session_cache": self.session_cache.stats(),
            "metadata_cache": self.metadata_cache.stats()
        }


# Global instance of the cache manager
historical_cache_manager = HistoricalScenarioCacheManager()