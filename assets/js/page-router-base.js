/**
 * BasePageRouter - Shared base class for all game page routers
 * Eliminates duplicate render() patterns across 9 router files
 */
class BasePageRouter {
  constructor(name, storageKey) {
    this.name = name;
    this.storageKey = storageKey || `${name}GameState`;
    this.currentPage = 'home';
    this.gameState = {};
  }

  /**
   * Safe render with HTMLSanitizer (XSS protection)
   * Replaces duplicate pattern in all 9 router files
   */
  render() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const html = this.renderPage();
    if (typeof HTMLSanitizer !== 'undefined') {
      HTMLSanitizer.setInnerHTML(container, html);
    } else {
      container.innerHTML = html;
    }
  }

  /**
   * Override in subclass - returns HTML string for the page
   */
  renderPage() {
    return '<div>Override renderPage() in subclass</div>';
  }

  /**
   * Persist game state to sessionStorage
   * Override in subclass to save additional fields
   */
  saveState() {
    const state = {
      currentPage: this.currentPage,
      gameState: this.gameState
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  /**
   * Restore game state from sessionStorage
   * Override in subclass to restore additional fields
   */
  loadState() {
    const saved = sessionStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.currentPage = state.currentPage;
        this.gameState = state.gameState;
      } catch {
        // ignore parse errors
      }
    }
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.BasePageRouter = BasePageRouter;
}
