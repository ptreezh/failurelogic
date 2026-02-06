#!/usr/bin/env python3
"""
Qwen Session Catchup Script for planning-with-files

Analyzes the previous session to find unsynced context after the last
planning file update. Designed to run when resuming work after a break.

Usage: python3 session-catchup.py [project-path]
"""

import json
import sys
import os
from pathlib import Path
from typing import List, Dict, Optional, Tuple

PLANNING_FILES = ['task_plan.md', 'progress.md', 'findings.md']


def get_project_dir(project_path: str) -> Path:
    """Convert project path to Qwen's storage path format."""
    # For this implementation, we'll look in the current project directory
    # In a real implementation, this would map to Qwen's project storage
    return Path(project_path)


def get_sessions_sorted(project_dir: Path) -> List[Path]:
    """Get all session files sorted by modification time (newest first)."""
    # For this implementation, we'll look for potential session files
    # In a real Qwen implementation, this would look in Qwen's session storage
    sessions = list(project_dir.glob('*.json')) + list(project_dir.glob('*.log'))
    return sorted(sessions, key=lambda p: p.stat().st_mtime, reverse=True)


def parse_session_messages(session_file: Path) -> List[Dict]:
    """Parse all messages from a session file, preserving order."""
    messages = []
    try:
        with open(session_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f):
                try:
                    data = json.loads(line.strip())
                    data['_line_num'] = line_num
                    messages.append(data)
                except json.JSONDecodeError:
                    # Try reading as a whole JSON object if not JSONL
                    try:
                        f.seek(0)
                        content = f.read()
                        data = json.loads(content)
                        data['_line_num'] = 0
                        messages.append(data)
                        break
                    except json.JSONDecodeError:
                        pass
    except Exception:
        pass
    return messages


def find_last_planning_update(messages: List[Dict]) -> Tuple[int, Optional[str]]:
    """
    Find the last time a planning file was written/edited.
    Returns (line_number, filename) or (-1, None) if not found.
    """
    last_update_line = -1
    last_update_file = None

    for msg in messages:
        # Look for file operations in the messages
        msg_str = str(msg)
        
        # Check if any planning file is mentioned in the message
        for pf in PLANNING_FILES:
            if pf in msg_str.lower():
                # This is a simplified check - in a real implementation,
                # we would look for actual file write/edit operations
                last_update_line = msg.get('_line_num', 0)
                last_update_file = pf

    return last_update_line, last_update_file


def extract_messages_after(messages: List[Dict], after_line: int) -> List[Dict]:
    """Extract conversation messages after a certain line number."""
    result = []
    
    for msg in messages:
        if msg.get('_line_num', 0) <= after_line:
            continue

        # Simplified extraction - in a real implementation, 
        # this would parse Qwen's message format
        content = str(msg)[:600]  # Truncate for brevity
        
        if len(content) > 20:
            result.append({
                'role': 'system',
                'content': content,
                'line': msg.get('_line_num', 0)
            })

    return result


def main():
    project_path = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    project_dir = get_project_dir(project_path)

    # Check if planning files exist (indicates active task)
    has_planning_files = any(
        Path(project_path, f).exists() for f in PLANNING_FILES
    )

    if not has_planning_files:
        print("No planning files found in current directory.")
        print("Run /planning-with-files:start to initialize planning files.")
        return

    # In a real implementation, we would look for Qwen session files
    # For now, we'll just check if planning files have been recently updated
    
    planning_files_info = []
    for pf in PLANNING_FILES:
        pf_path = Path(project_path) / pf
        if pf_path.exists():
            mtime = pf_path.stat().st_mtime
            planning_files_info.append((pf, mtime))
    
    if not planning_files_info:
        return

    # Sort by modification time (newest first)
    planning_files_info.sort(key=lambda x: x[1], reverse=True)
    latest_file, latest_time = planning_files_info[0]
    
    print(f"\n[planning-with-files] SESSION CATCHUP")
    print(f"Latest planning file update: {latest_file}")
    print(f"Last modified: {os.path.getmtime(Path(project_path) / latest_file)}")
    
    print("\n--- CURRENT PLANNING FILES STATUS ---")
    for pf, mtime in planning_files_info:
        pf_path = Path(project_path) / pf
        size = pf_path.stat().st_size
        print(f"- {pf}: {size} bytes, modified recently")
    
    print("\n--- RECOMMENDED NEXT STEPS ---")
    print("1. Review current planning files:")
    print("   - task_plan.md: Check current phase and status")
    print("   - findings.md: Review recent discoveries") 
    print("   - progress.md: Check last recorded actions")
    print("2. Update planning files based on your recollection of recent work")
    print("3. Continue with your task")


if __name__ == '__main__':
    main()