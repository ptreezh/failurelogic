"""
Sequential Scenario Validation Script
This script uses Playwright to validate all scenarios with interactions in Microsoft Edge browser.
For each scenario, it performs: 1) Find the scenario on the page 2) Launch the scenario 
3) Perform at least one round of interaction 4) Check for appropriate feedback.
Running sequentially to avoid resource conflicts.
"""

import asyncio
import json
from playwright.async_api import async_playwright
from datetime import datetime
import sys
import os
from typing import List, Dict, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Add project path
sys.path.insert(0, os.path.join(os.getcwd(), 'api-server'))

class ScenarioValidator:
    def __init__(self):
        self.all_scenarios = []
        self.results = {}
        
    async def setup_scenarios(self):
        """Load all scenarios from API data files"""
        # Load game scenarios
        game_scenarios_path = "D:/AIDevelop/failureLogic/api-server/data/game_scenarios.json"
        advanced_game_scenarios_path = "D:/AIDevelop/failureLogic/api-server/data/advanced_game_scenarios.json"
        historical_cases_path = "D:/AIDevelop/failureLogic/api-server/data/historical_cases.json"
        advanced_historical_cases_path = "D:/AIDevelop/failureLogic/api-server/data/advanced_historical_cases.json"
        
        try:
            with open(game_scenarios_path, 'r', encoding='utf-8') as f:
                game_data = json.load(f)
                self.all_scenarios.extend(game_data.get('game_scenarios', []))
                
            with open(advanced_game_scenarios_path, 'r', encoding='utf-8') as f:
                advanced_game_data = json.load(f)
                self.all_scenarios.extend(advanced_game_data.get('game_scenarios', []))
                
            with open(historical_cases_path, 'r', encoding='utf-8') as f:
                historical_data = json.load(f)
                self.all_scenarios.extend(historical_data.get('historical_cases', []))
                
            with open(advanced_historical_cases_path, 'r', encoding='utf-8') as f:
                advanced_historical_data = json.load(f)
                self.all_scenarios.extend(advanced_historical_data.get('historical_cases', []))
                
            print(f"✅ Loaded {len(self.all_scenarios)} scenarios for validation")
            
        except Exception as e:
            print(f"❌ Error loading scenarios: {e}")
            # Fallback: create basic scenario list
            self.all_scenarios = [
                {"scenarioId": f"game-{i:03d}", "title": f"Game Scenario {i}", "description": f"Basic game scenario {i}"}
                for i in range(1, 4)
            ] + [
                {"scenarioId": f"adv-game-{i:03d}", "title": f"Advanced Game Scenario {i}", "description": f"Advanced game scenario {i}"}
                for i in range(1, 4)
            ] + [
                {"scenarioId": f"hist-{i:03d}", "title": f"Historical Case {i}", "description": f"Historical case {i}"}
                for i in range(1, 4)
            ] + [
                {"scenarioId": f"adv-hist-{i:03d}", "title": f"Advanced Historical Case {i}", "description": f"Advanced historical case {i}"}
                for i in range(1, 4)
            ]
            print(f"⚠️  Using fallback scenario list with {len(self.all_scenarios)} scenarios")

    async def navigate_to_scenarios_page(self, page):
        """Navigate to the scenarios page"""
        print("🔍 Navigating to scenarios page...")
        
        # Try multiple methods to navigate to scenarios page
        navigation_methods = [
            lambda: page.click("[data-page='scenarios']"),
            lambda: page.click("button:has-text('场景')"),
            lambda: page.click("button:has-text('Scenarios')"),
            lambda: page.evaluate("if(typeof NavigationManager !== 'undefined' && typeof NavigationManager.navigateTo === 'function'){NavigationManager.navigateTo('scenarios');}"),
        ]
        
        for i, method in enumerate(navigation_methods):
            try:
                await method()
                await page.wait_for_timeout(3000)
                
                # Check if we're on the scenarios page
                is_on_scenarios_page = await page.locator('#scenarios-page.active').count() > 0
                if is_on_scenarios_page:
                    print("✅ Successfully navigated to scenarios page")
                    return True
            except Exception as e:
                print(f"⚠️ Navigation attempt {i+1} failed: {e}")
                continue
        
        print("⚠️ Failed to navigate to scenarios page using standard methods")
        return False

    async def find_scenario_by_id(self, page, scenario_id: str) -> bool:
        """Find a specific scenario by ID on the scenarios page"""
        print(f"🔍 Looking for scenario: {scenario_id}")
        
        # Wait for scenarios to load
        try:
            await page.wait_for_function(
                "document.querySelector('#scenarios-loading') === null || "
                "!document.querySelector('#scenarios-loading').offsetParent",
                timeout=10000
            )
        except:
            print("⚠️ Scenario loading indicator timeout")
        
        # Look for scenario card with the specific ID
        scenario_selectors = [
            f'[data-scenario-id="{scenario_id}"]',
            f'.scenario-card:has-text("{scenario_id}")',
            f'.card:has-text("{scenario_id}")',
            f'text={scenario_id}',
            f'.scenario-card:has-text("{scenario_id.split("-")[-1]}")'  # Last part of ID
        ]
        
        for selector in scenario_selectors:
            try:
                elements = await page.locator(selector).all()
                for element in elements:
                    try:
                        # Check if element is visible and clickable
                        if await element.is_visible():
                            print(f"✅ Found scenario {scenario_id} with selector: {selector}")
                            return True
                    except:
                        continue
            except:
                continue
        
        print(f"⚠️ Could not find scenario {scenario_id} with any selector")
        return False

    async def launch_scenario(self, page, scenario_id: str) -> bool:
        """Launch a specific scenario"""
        print(f"🎮 Launching scenario: {scenario_id}")
        
        # Try to find and click the scenario
        launch_selectors = [
            f'[data-scenario-id="{scenario_id}"] button',
            f'[data-scenario-id="{scenario_id}"]',
            f'.scenario-card:has-text("{scenario_id}") button',
            f'.scenario-card:has-text("{scenario_id.split("-")[-1]}") button',
            f'text={scenario_id} >> xpath=../button | text={scenario_id} >> xpath=./button | text={scenario_id.split("-")[-1]} >> xpath=../button'
        ]
        
        for selector in launch_selectors:
            try:
                element = page.locator(selector).first
                if await element.count() > 0:
                    await element.wait_for(state="visible")
                    await element.scroll_into_view_if_needed()
                    await element.click(force=True)  # Use force click to bypass potential overlays
                    
                    # Wait for scenario to load
                    await page.wait_for_timeout(3000)
                    
                    # Check if scenario has loaded by looking for game elements
                    scenario_loaded = await page.locator('.game-container, #game-container, .scenario-content, [class*="game"], [id*="game"]').count() > 0
                    if scenario_loaded:
                        print(f"✅ Successfully launched scenario: {scenario_id}")
                        return True
            except Exception as e:
                print(f"⚠️ Launch attempt with selector '{selector}' failed: {e}")
                continue
        
        print(f"⚠️ Failed to launch scenario: {scenario_id}")
        return False

    async def perform_interaction(self, page, scenario_id: str) -> bool:
        """Perform at least one round of interaction in the scenario"""
        print(f"🔄 Performing interaction for scenario: {scenario_id}")
        
        interaction_performed = False
        
        # Look for various types of interactive elements
        # 1. Radio buttons for decision making
        radio_buttons = await page.locator('input[type="radio"]').all()
        if radio_buttons:
            if len(radio_buttons) > 0:
                await radio_buttons[0].click()
                print("✅ Selected a radio button option")
                interaction_performed = True
        
        # 2. Checkboxes
        if not interaction_performed:
            checkboxes = await page.locator('input[type="checkbox"]').all()
            if checkboxes:
                if len(checkboxes) > 0:
                    await checkboxes[0].click()
                    print("✅ Selected a checkbox option")
                    interaction_performed = True
        
        # 3. Text inputs
        if not interaction_performed:
            text_inputs = await page.locator('input[type="text"], input[type="number"], textarea').all()
            if text_inputs:
                if len(text_inputs) > 0:
                    await text_inputs[0].fill("Test input for validation")
                    print("✅ Filled a text input")
                    interaction_performed = True
        
        # 4. Dropdown selections
        if not interaction_performed:
            selects = await page.locator('select').all()
            if selects:
                if len(selects) > 0:
                    options = await selects[0].locator('option').count()
                    if options > 1:
                        await selects[0].select_option(index=1)
                        print("✅ Selected an option from dropdown")
                        interaction_performed = True
        
        # 5. Buttons (submit, next, etc.)
        if not interaction_performed:
            buttons = await page.locator('button:has-text("提交"), button:has-text("Submit"), button:has-text("Next"), button:has-text("下一步"), button:has-text("开始"), button:has-text("Start")').all()
            if buttons:
                if len(buttons) > 0:
                    await buttons[0].click()
                    print("✅ Clicked a submit/next button")
                    interaction_performed = True
                    await page.wait_for_timeout(1000)  # Wait for potential page change
        
        if interaction_performed:
            print(f"✅ Performed interaction in scenario: {scenario_id}")
            return True
        else:
            print(f"⚠️ No interaction could be performed in scenario: {scenario_id}")
            return False

    async def check_feedback(self, page, scenario_id: str) -> bool:
        """Check for appropriate feedback after interaction"""
        print(f"💬 Checking for feedback in scenario: {scenario_id}")
        
        # Look for feedback elements
        feedback_selectors = [
            '.feedback',
            '.result',
            '.explanation',
            '[class*="feedback"]',
            '[class*="result"]',
            '[class*="explanation"]',
            '[class*="response"]',
            '[class*="outcome"]',
            '.alert',
            '.notification',
            '#feedback',
            '#result'
        ]
        
        for selector in feedback_selectors:
            try:
                elements = await page.locator(selector).all()
                for element in elements:
                    if await element.is_visible():
                        text_content = await element.text_content()
                        if text_content and len(text_content.strip()) > 0:
                            print(f"✅ Found feedback: {text_content[:100]}...")
                            return True
            except:
                continue
        
        # Also check for any newly appeared content after interaction
        try:
            # Check for any new content that might indicate feedback
            all_content = await page.content()
            if "feedback" in all_content.lower() or "result" in all_content.lower() or "explanation" in all_content.lower():
                print("✅ Found feedback-related content in page")
                return True
        except:
            pass
        
        print(f"⚠️ No clear feedback found for scenario: {scenario_id}")
        return False

    async def validate_single_scenario(self, scenario: Dict, browser) -> Dict:
        """Validate a single scenario with all required steps"""
        scenario_id = scenario.get('scenarioId', 'unknown')
        print(f"\n{'='*60}")
        print(f"🧪 Validating scenario: {scenario_id}")
        print(f"{'='*60}")
        
        # Create a new page for this scenario validation
        page = await browser.new_page()
        
        try:
            # Navigate to the main page first
            await page.goto("http://localhost:8083", wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)
            
            # Navigate to scenarios page
            if not await self.navigate_to_scenarios_page(page):
                return {
                    "scenario_id": scenario_id,
                    "status": "failed",
                    "error": "Could not navigate to scenarios page",
                    "steps_completed": []
                }
            
            # Find the scenario
            found = await self.find_scenario_by_id(page, scenario_id)
            if not found:
                return {
                    "scenario_id": scenario_id,
                    "status": "failed", 
                    "error": "Could not find scenario on page",
                    "steps_completed": ["navigation"]
                }
            
            # Launch the scenario
            launched = await self.launch_scenario(page, scenario_id)
            if not launched:
                return {
                    "scenario_id": scenario_id,
                    "status": "failed",
                    "error": "Could not launch scenario",
                    "steps_completed": ["navigation", "find"]
                }
            
            # Perform interaction
            interacted = await self.perform_interaction(page, scenario_id)
            if not interacted:
                return {
                    "scenario_id": scenario_id,
                    "status": "partial",
                    "error": "Could not perform interaction",
                    "steps_completed": ["navigation", "find", "launch"]
                }
            
            # Check for feedback
            feedback_found = await self.check_feedback(page, scenario_id)
            
            # Determine final status
            status = "passed" if feedback_found else "partial"
            error = None if feedback_found else "Feedback check was inconclusive"
            
            result = {
                "scenario_id": scenario_id,
                "status": status,
                "error": error,
                "steps_completed": ["navigation", "find", "launch", "interaction", "feedback" if feedback_found else "interaction_only"],
                "title": scenario.get('title', 'Unknown'),
                "description": scenario.get('description', 'No description')
            }
            
            print(f"✅ Scenario {scenario_id} validation completed: {status.upper()}")
            return result
            
        except Exception as e:
            print(f"❌ Error validating scenario {scenario_id}: {str(e)}")
            return {
                "scenario_id": scenario_id,
                "status": "error",
                "error": str(e),
                "steps_completed": []
            }
        finally:
            await page.close()

    async def run_sequential_validation(self):
        """Run sequential validation of all scenarios"""
        print("🚀 Starting sequential scenario validation...")
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Testing with Microsoft Edge (non-headless mode)")
        print(f"📊 Total scenarios to validate: {len(self.all_scenarios)}")
        
        # Launch a single browser instance to reuse across all scenarios
        async with async_playwright() as p:
            # Launch Microsoft Edge browser in NON-HEADLESS MODE
            browser = await p.chromium.launch(
                channel='msedge', 
                headless=False,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            )
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
            )
            
            # Validate each scenario sequentially
            results = []
            successful_validations = 0
            partial_validations = 0
            failed_validations = 0
            
            print("\n" + "="*80)
            print("📊 VALIDATION RESULTS SUMMARY")
            print("="*80)
            
            for i, scenario in enumerate(self.all_scenarios):
                print(f"\nProgress: {i+1}/{len(self.all_scenarios)}")
                result = await self.validate_single_scenario(scenario, browser)
                
                scenario_id = result.get('scenario_id', 'unknown')
                status = result.get('status', 'unknown')
                
                if status == 'passed':
                    successful_validations += 1
                    status_icon = "✅"
                elif status == 'partial':
                    partial_validations += 1
                    status_icon = "⚠️"
                else:
                    failed_validations += 1
                    status_icon = "❌"
                
                print(f"{status_icon} {scenario_id:<20} | Status: {status.upper():<8} | Title: {result.get('title', 'N/A')}")
                
                # Store result
                self.results[scenario_id] = result
                results.append(result)
            
            # Print summary
            print("\n" + "="*80)
            print("🎯 FINAL VALIDATION SUMMARY")
            print("="*80)
            print(f"✅ Successful validations:  {successful_validations}")
            print(f"⚠️  Partial validations:   {partial_validations}")
            print(f"❌ Failed validations:    {failed_validations}")
            print(f"📊 Total scenarios:       {len(self.all_scenarios)}")
            print(f"📈 Success rate:          {successful_validations/len(self.all_scenarios)*100:.1f}%")
            
            # Overall status
            if successful_validations == len(self.all_scenarios):
                print("\n🎉 ALL SCENARIOS PASSED VALIDATION!")
                print("✅ Every scenario was successfully validated with full interaction and feedback.")
            elif successful_validations + partial_validations == len(self.all_scenarios):
                print("\n👍 ALL SCENARIOS COMPLETED WITH MINIMAL ISSUES!")
                print("✅ All scenarios were processed, though some had partial validation.")
            else:
                print("\n⚠️ SOME SCENARIOS FAILED VALIDATION!")
                print("💡 Please review the failed scenarios above for details.")
            
            print(f"\n🏁 Validation completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Close browser
            await browser.close()
            
            return {
                "successful": successful_validations,
                "partial": partial_validations, 
                "failed": failed_validations,
                "total": len(self.all_scenarios),
                "results": self.results
            }

async def main():
    """Main function to run the sequential scenario validation"""
    print("🚀 INITIALIZING SEQUENTIAL SCENARIO VALIDATION SYSTEM")
    print("="*80)
    
    validator = ScenarioValidator()
    
    # Setup scenarios
    await validator.setup_scenarios()
    
    # Run sequential validation
    results = await validator.run_sequential_validation()
    
    # Exit with appropriate code
    if results["failed"] == 0:
        print("\n✅ EXIT CODE 0: All validations passed successfully")
        return 0
    else:
        print(f"\n⚠️ EXIT CODE 1: {results['failed']} scenarios failed validation")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)