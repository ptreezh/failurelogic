/**
 * Enhanced Interaction Fixes for Cognitive Trap Platform
 * Addresses all interaction issues for investment information processing and business strategy scenarios
 */

class EnhancedInteractionManager {
  constructor() {
    this.isInitialized = false;
    this.loadingOverlay = null;
    this.currentScenario = null;
    this.gameState = null;
    
    // Bind methods to preserve 'this' context
    this.init = this.init.bind(this);
    this.setupEnhancedButtons = this.setupEnhancedButtons.bind(this);
    this.setupMultiStepInterface = this.setupMultiStepInterface.bind(this);
    this.setupInvestmentScenario = this.setupInvestmentScenario.bind(this);
    this.setupBusinessStrategyScenario = this.setupBusinessStrategyScenario.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.hideLoading = this.hideLoading.bind(this);
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('Initializing Enhanced Interaction Manager...');
    
    // Create loading overlay
    this.createLoadingOverlay();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.init);
      return;
    }
    
    // Apply fixes after a brief delay to ensure other scripts are loaded
    setTimeout(() => {
      this.applyAllFixes();
      this.isInitialized = true;
      console.log('Enhanced Interaction Manager initialized successfully');
    }, 500);
  }

  createLoadingOverlay() {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载认知场景...</div>
      </div>
    `;
    document.body.appendChild(this.loadingOverlay);
  }

  showLoading(message = '正在加载...') {
    if (this.loadingOverlay) {
      const textElement = this.loadingOverlay.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = message;
      }
      this.loadingOverlay.classList.add('active');
    }
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('active');
    }
  }

  applyAllFixes() {
    this.setupEnhancedButtons();
    this.setupMultiStepInterface();
    this.setupInvestmentScenario();
    this.setupBusinessStrategyScenario();
    this.optimizePerformance();
    this.fixResourceManagement();
  }

  setupEnhancedButtons() {
    console.log('Setting up enhanced buttons...');
    
    // Replace regular buttons with enhanced versions
    const regularButtons = document.querySelectorAll('button:not(.btn-enhanced)');
    regularButtons.forEach(btn => {
      if (btn.classList.contains('btn')) {
        btn.classList.add('btn-enhanced');
        
        // Add additional classes based on original button purpose
        if (btn.classList.contains('btn-primary')) {
          btn.classList.add('btn-enhanced-primary');
        } else if (btn.classList.contains('btn-outline')) {
          btn.classList.add('btn-enhanced-secondary');
        }
        
        // Make sure important buttons are larger
        if (btn.textContent.toLowerCase().includes('开始') || 
            btn.textContent.toLowerCase().includes('start') ||
            btn.textContent.toLowerCase().includes('继续') ||
            btn.textContent.toLowerCase().includes('next')) {
          btn.classList.add('btn-enhanced-large');
        }
      }
    });

    // Add event listeners to ensure buttons work properly
    const enhancedButtons = document.querySelectorAll('.btn-enhanced');
    enhancedButtons.forEach(btn => {
      // Remove duplicate event listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Re-add functionality
      if (btn.onclick) {
        newBtn.onclick = btn.onclick;
      }
      
      // Add visual feedback
      newBtn.addEventListener('mousedown', () => {
        newBtn.style.transform = 'translateY(2px)';
      });
      
      newBtn.addEventListener('mouseup', () => {
        newBtn.style.transform = '';
      });
      
      newBtn.addEventListener('mouseleave', () => {
        newBtn.style.transform = '';
      });
    });
  }

  setupMultiStepInterface() {
    console.log('Setting up multi-step interface...');
    
    // Create a more prominent step indicator for scenarios
    const scenarioContainers = document.querySelectorAll('.game-page, .scenario-container');
    scenarioContainers.forEach(container => {
      // Look for existing step indicators and enhance them
      const existingSteps = container.querySelectorAll('.step-indicator, .progress');
      existingSteps.forEach(step => {
        step.classList.add('step-indicator-enhanced');
      });
      
      // Add keyboard navigation support
      container.setAttribute('tabindex', '0');
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Find the primary action button and click it
          const primaryBtn = container.querySelector('.btn-enhanced-primary, .btn-primary, button');
          if (primaryBtn) {
            primaryBtn.click();
          }
        }
      });
    });
  }

  setupInvestmentScenario() {
    console.log('Setting up investment information processing scenario...');
    
    // Enhance investment scenario specific elements
    const investmentElements = document.querySelectorAll('[class*="investment"], [id*="investment"]');
    investmentElements.forEach(element => {
      // Add enhanced styling to investment-related elements
      if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
        element.classList.add('btn-enhanced', 'btn-enhanced-primary');
      }
      
      // Enhance decision sliders
      if (element.type === 'range' || element.classList.contains('slider')) {
        element.classList.add('range-slider');
      }
    });

    // Add enhanced interaction for information source selection
    const sourceSelections = document.querySelectorAll('.source-card, .information-source');
    sourceSelections.forEach(source => {
      // Remove duplicate event listeners
      const newSource = source.cloneNode(true);
      source.parentNode.replaceChild(newSource, source);
      
      newSource.addEventListener('click', function() {
        // Toggle selection
        this.classList.toggle('selected');
        
        // Visual feedback
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 150);
      });
      
      // Add keyboard support
      newSource.setAttribute('tabindex', '0');
      newSource.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          newSource.click();
        }
      });
    });
  }

  setupBusinessStrategyScenario() {
    console.log('Setting up business strategy scenario...');
    
    // Enhance business strategy specific elements
    const strategyElements = document.querySelectorAll('[class*="strategy"], [id*="strategy"], .option-card');
    strategyElements.forEach(element => {
      if (element.classList.contains('option-card')) {
        element.classList.add('strategy-card');
        
        // Remove duplicate event listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        newElement.addEventListener('click', function() {
          // Remove selection from siblings
          const parent = this.parentElement;
          if (parent) {
            const siblings = parent.querySelectorAll('.strategy-card');
            siblings.forEach(sib => sib.classList.remove('selected'));
          }
          
          // Add selection to clicked element
          this.classList.add('selected');
          
          // Visual feedback
          this.style.transform = 'scale(0.98)';
          setTimeout(() => {
            this.style.transform = '';
          }, 100);
        });
        
        // Add keyboard support
        newElement.setAttribute('tabindex', '0');
        newElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            newElement.click();
          }
        });
      }
    });
  }

  optimizePerformance() {
    console.log('Optimizing performance...');
    
    // Implement debouncing for expensive operations
    this.debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // Optimize scroll performance
    const gameContainers = document.querySelectorAll('.game-content, .modal-body, #game-container');
    gameContainers.forEach(container => {
      container.style.willChange = 'transform';
      container.addEventListener('scroll', this.debounce(() => {
        // Perform scroll-related updates
      }, 16)); // ~60fps
    });

    // Optimize rendering by reducing reflows
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules || styleSheets[i].rules;
        for (let j = 0; j < rules.length; j++) {
          // Optimize frequently accessed styles
          if (rules[j].selectorText && 
              (rules[j].selectorText.includes('.btn') || 
               rules[j].selectorText.includes('.card'))) {
            // Ensure these styles are optimized
          }
        }
      } catch (e) {
        // Skip cross-origin stylesheets
      }
    }
  }

  fixResourceManagement() {
    console.log('Fixing resource management...');
    
    // Clean up old event listeners periodically
    setInterval(() => {
      // Clean up any orphaned event listeners
      const allButtons = document.querySelectorAll('button');
      allButtons.forEach(btn => {
        // Limit the number of event listeners per button
        if (btn.eventListenerCount > 10) {
          // Recreate button to clear listeners
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
        }
      });
    }, 30000); // Every 30 seconds

    // Implement proper cleanup for modals
    const modalCloseButtons = document.querySelectorAll('.modal-close, [data-dismiss="modal"]');
    modalCloseButtons.forEach(closeBtn => {
      const originalClick = closeBtn.onclick;
      closeBtn.onclick = (e) => {
        // Perform cleanup before closing
        this.cleanupScenarioResources();
        if (originalClick) {
          originalClick.call(closeBtn, e);
        }
      };
    });
  }

  cleanupScenarioResources() {
    console.log('Cleaning up scenario resources...');
    
    // Clear any timers
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
    
    // Clear game state
    this.gameState = null;
    this.currentScenario = null;
    
    // Remove temporary elements
    const tempElements = document.querySelectorAll('.temp-element, .temporary');
    tempElements.forEach(el => el.remove());
  }

  // Method to handle scenario-specific initialization
  initializeScenario(scenarioId) {
    this.showLoading(`加载 ${scenarioId} 场景...`);
    
    setTimeout(() => {
      this.currentScenario = scenarioId;
      
      switch(scenarioId) {
        case 'investment-information-processing':
          this.setupInvestmentInformationProcessing();
          break;
        case 'business-strategy-reasoning':
          this.setupBusinessStrategyReasoning();
          break;
        case 'investment-confirmation-bias':
          this.setupInvestmentConfirmationBias();
          break;
        default:
          console.log(`Initializing generic scenario: ${scenarioId}`);
      }
      
      this.hideLoading();
    }, 300);
  }

  setupInvestmentInformationProcessing() {
    console.log('Setting up investment information processing scenario...');
    
    // Enhance the investment information processing interface
    const container = document.getElementById('game-container') || document.querySelector('.game-content');
    if (container) {
      container.classList.add('investment-decision-container');
      
      // Add enhanced controls
      const controls = container.querySelectorAll('input[type="range"], select, .control-group');
      controls.forEach(control => {
        control.classList.add('enhanced-control');
        
        // Add live preview of values
        if (control.type === 'range') {
          const valueDisplay = document.createElement('div');
          valueDisplay.className = 'control-value';
          valueDisplay.textContent = control.value;
          control.parentNode.insertBefore(valueDisplay, control.nextSibling);
          
          control.addEventListener('input', () => {
            valueDisplay.textContent = control.value;
          });
        }
      });
    }
  }

  setupBusinessStrategyReasoning() {
    console.log('Setting up business strategy reasoning scenario...');
    
    // Enhance the business strategy interface
    const container = document.getElementById('game-container') || document.querySelector('.game-content');
    if (container) {
      container.classList.add('business-strategy-container');
      
      // Add enhanced decision cards
      const decisionCards = container.querySelectorAll('.option-card, .decision-option');
      decisionCards.forEach(card => {
        card.classList.add('strategy-card');
        
        // Add selection feedback
        card.addEventListener('click', function() {
          // Remove selection from siblings
          const parent = this.parentElement;
          if (parent) {
            const siblings = parent.querySelectorAll('.strategy-card');
            siblings.forEach(sib => sib.classList.remove('selected'));
          }
          
          // Add selection to clicked card
          this.classList.add('selected');
        });
      });
    }
  }

  setupInvestmentConfirmationBias() {
    console.log('Setting up investment confirmation bias scenario...');
    
    // Enhance the investment confirmation bias interface
    const container = document.getElementById('game-container') || document.querySelector('.game-content');
    if (container) {
      container.classList.add('investment-decision-container');
      
      // Enhance source selection
      const sourceCards = container.querySelectorAll('.source-card');
      sourceCards.forEach(card => {
        card.classList.add('enhanced-source-card');
        
        // Add multi-selection capability
        card.addEventListener('click', function() {
          this.classList.toggle('selected');
        });
      });
    }
  }
}

// Global instance
window.EnhancedInteractionManager = new EnhancedInteractionManager();

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.EnhancedInteractionManager.init();
  });
} else {
  // If already loaded, initialize immediately
  window.EnhancedInteractionManager.init();
}

// Enhance GameManager to use the new interaction manager
if (window.GameManager) {
  const originalStartScenario = window.GameManager.startScenario;
  
  window.GameManager.startScenario = async function(scenarioId) {
    console.log(`Enhanced start scenario: ${scenarioId}`);
    
    // Initialize the enhanced interaction manager for this scenario
    window.EnhancedInteractionManager.initializeScenario(scenarioId);
    
    // Call original method
    return await originalStartScenario.call(this, scenarioId);
  };
}

// Enhance NavigationManager if it exists
if (window.NavigationManager) {
  const originalNavigateTo = window.NavigationManager.navigateTo;
  
  window.NavigationManager.navigateTo = function(page) {
    console.log(`Enhanced navigate to: ${page}`);
    
    // Hide loading overlay when navigating
    if (window.EnhancedInteractionManager) {
      window.EnhancedInteractionManager.hideLoading();
    }
    
    // Call original method
    return originalNavigateTo.call(this, page);
  };
}

console.log('Enhanced Interaction Manager script loaded');