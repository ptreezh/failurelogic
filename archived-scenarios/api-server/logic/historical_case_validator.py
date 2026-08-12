"""
Data validation schema for historical case structures.
Provides validation functions to ensure historical case data conforms to expected format.
"""

import json
from typing import Dict, Any, List, Union
from datetime import datetime


def validate_decision_point(decision_point: Dict[str, Any]) -> List[str]:
    """Validate a single decision point in a historical case."""
    errors = []
    
    if 'step' not in decision_point:
        errors.append("Decision point missing required 'step' field")
    elif not isinstance(decision_point['step'], int):
        errors.append(f"'step' field must be integer, got {type(decision_point['step'])}")
    
    if 'situation' not in decision_point:
        errors.append("Decision point missing required 'situation' field")
    elif not isinstance(decision_point['situation'], str):
        errors.append(f"'situation' field must be string, got {type(decision_point['situation'])}")
    
    if 'options' not in decision_point:
        errors.append("Decision point missing required 'options' field")
    elif not isinstance(decision_point['options'], list):
        errors.append(f"'options' field must be list, got {type(decision_point['options'])}")
    else:
        for i, option in enumerate(decision_point['options']):
            if not isinstance(option, str):
                errors.append(f"Option {i} in decision point must be string, got {type(option)}")
    
    return errors


def validate_pyramid_analysis(pyramid_analysis: Dict[str, Any]) -> List[str]:
    """Validate the pyramid analysis structure."""
    errors = []
    
    required_fields = ['coreConclusion', 'supportingArguments', 'examples', 'actionableAdvice']
    for field in required_fields:
        if field not in pyramid_analysis:
            errors.append(f"Pyramid analysis missing required field '{field}'")
    
    if 'supportingArguments' in pyramid_analysis:
        if not isinstance(pyramid_analysis['supportingArguments'], list):
            errors.append("'supportingArguments' must be a list")
        else:
            for i, arg in enumerate(pyramid_analysis['supportingArguments']):
                if not isinstance(arg, str):
                    errors.append(f"Supporting argument {i} must be string, got {type(arg)}")
    
    if 'examples' in pyramid_analysis:
        if not isinstance(pyramid_analysis['examples'], list):
            errors.append("'examples' must be a list")
        else:
            for i, ex in enumerate(pyramid_analysis['examples']):
                if not isinstance(ex, str):
                    errors.append(f"Example {i} must be string, got {type(ex)}")
    
    if 'actionableAdvice' in pyramid_analysis:
        if not isinstance(pyramid_analysis['actionableAdvice'], list):
            errors.append("'actionableAdvice' must be a list")
        else:
            for i, advice in enumerate(pyramid_analysis['actionableAdvice']):
                if not isinstance(advice, str):
                    errors.append(f"Actionable advice {i} must be string, got {type(advice)}")
    
    return errors


def validate_historical_case(case: Dict[str, Any]) -> List[str]:
    """Validate a single historical case structure."""
    errors = []
    
    required_fields = ['scenarioId', 'title', 'description', 'decisionPoints', 'actualOutcomes', 'alternativeOptions', 'lessons', 'pyramidAnalysis']
    for field in required_fields:
        if field not in case:
            errors.append(f"Historical case missing required field '{field}'")
    
    # Validate specific fields
    if 'scenarioId' in case and not isinstance(case['scenarioId'], str):
        errors.append(f"'scenarioId' must be string, got {type(case['scenarioId'])}")
    
    if 'title' in case and not isinstance(case['title'], str):
        errors.append(f"'title' must be string, got {type(case['title'])}")
    
    if 'description' in case and not isinstance(case['description'], str):
        errors.append(f"'description' must be string, got {type(case['description'])}")
    
    if 'decisionPoints' in case:
        if not isinstance(case['decisionPoints'], list):
            errors.append(f"'decisionPoints' must be list, got {type(case['decisionPoints'])}")
        else:
            for i, dp in enumerate(case['decisionPoints']):
                dp_errors = validate_decision_point(dp)
                for err in dp_errors:
                    errors.append(f"Decision point {i}: {err}")
    
    if 'actualOutcomes' in case:
        if not isinstance(case['actualOutcomes'], list):
            errors.append(f"'actualOutcomes' must be list, got {type(case['actualOutcomes'])}")
        else:
            for i, outcome in enumerate(case['actualOutcomes']):
                if not isinstance(outcome, str):
                    errors.append(f"Actual outcome {i} must be string, got {type(outcome)}")
    
    if 'alternativeOptions' in case:
        if not isinstance(case['alternativeOptions'], list):
            errors.append(f"'alternativeOptions' must be list, got {type(case['alternativeOptions'])}")
        else:
            for i, opt in enumerate(case['alternativeOptions']):
                if not isinstance(opt, str):
                    errors.append(f"Alternative option {i} must be string, got {type(opt)}")
    
    if 'lessons' in case:
        if not isinstance(case['lessons'], list):
            errors.append(f"'lessons' must be list, got {type(case['lessons'])}")
        else:
            for i, lesson in enumerate(case['lessons']):
                if not isinstance(lesson, str):
                    errors.append(f"Lesson {i} must be string, got {type(lesson)}")
    
    if 'pyramidAnalysis' in case:
        pa_errors = validate_pyramid_analysis(case['pyramidAnalysis'])
        for err in pa_errors:
            errors.append(f"Pyramid analysis: {err}")
    
    return errors


def validate_historical_cases_data(data: Dict[str, Any]) -> List[str]:
    """Validate the entire historical cases data structure."""
    errors = []
    
    if 'historical_cases' not in data:
        errors.append("Data missing required 'historical_cases' field")
        return errors
    
    if 'metadata' not in data:
        errors.append("Data missing required 'metadata' field")
    else:
        metadata = data['metadata']
        if 'total_cases' not in metadata:
            errors.append("Metadata missing required 'total_cases' field")
        if 'last_updated' not in metadata:
            errors.append("Metadata missing required 'last_updated' field")
        if 'version' not in metadata:
            errors.append("Metadata missing required 'version' field")
    
    if not isinstance(data['historical_cases'], list):
        errors.append(f"'historical_cases' must be list, got {type(data['historical_cases'])}")
        return errors
    
    for i, case in enumerate(data['historical_cases']):
        case_errors = validate_historical_case(case)
        for err in case_errors:
            errors.append(f"Case {i}: {err}")
    
    return errors


def validate_from_file(file_path: str) -> bool:
    """Validate historical cases data from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        errors = validate_historical_cases_data(data)
        
        if errors:
            print(f"Validation failed for {file_path}:")
            for error in errors:
                print(f"  - {error}")
            return False
        else:
            print(f"Validation passed for {file_path}")
            return True
            
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in {file_path}: {str(e)}")
        return False
    except Exception as e:
        print(f"Error validating {file_path}: {str(e)}")
        return False


if __name__ == "__main__":
    # Example usage
    print("Historical Case Data Validator")
    print("Validates the structure and content of historical case data files")
    
    # Validate the main historical cases file
    validate_from_file("api-server/data/historical_cases.json")
    
    # Validate the advanced historical cases file
    validate_from_file("api-server/data/advanced_historical_cases.json")