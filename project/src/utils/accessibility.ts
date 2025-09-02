// Accessibility utilities for the AbleGo application

export interface AccessibilityConfig {
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark' | 'high-contrast';
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig;
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = 0;

  private constructor() {
    this.config = {
      enableHighContrast: false,
      enableReducedMotion: false,
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      fontSize: 'medium',
      colorScheme: 'dark'
    };
    
    this.initializeAccessibility();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private initializeAccessibility() {
    // Check user preferences
    this.checkUserPreferences();
    
    // Apply initial settings
    this.applyAccessibilitySettings();
    
    // Set up keyboard navigation
    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  private checkUserPreferences() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.enableReducedMotion = true;
    }

    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.enableHighContrast = true;
    }

    // Check for dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.config.colorScheme = 'dark';
    }
  }

  private applyAccessibilitySettings() {
    const root = document.documentElement;
    
    // Apply high contrast
    if (this.config.enableHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (this.config.enableReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${this.config.fontSize}`);

    // Apply color scheme
    root.classList.remove('color-light', 'color-dark', 'color-high-contrast');
    root.classList.add(`color-${this.config.colorScheme}`);
  }

  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      } else if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      } else if (event.key === 'Enter' || event.key === ' ') {
        this.handleActivationKey(event);
      }
    });
  }

  private handleTabNavigation(event: KeyboardEvent) {
    // Find all focusable elements
    this.focusableElements = Array.from(
      document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )
    ) as HTMLElement[];

    // Filter out hidden elements
    this.focusableElements = this.focusableElements.filter(
      element => element.offsetParent !== null && !element.hasAttribute('hidden')
    );

    if (event.shiftKey) {
      // Shift + Tab: move backwards
      this.currentFocusIndex = this.currentFocusIndex <= 0 
        ? this.focusableElements.length - 1 
        : this.currentFocusIndex - 1;
    } else {
      // Tab: move forwards
      this.currentFocusIndex = this.currentFocusIndex >= this.focusableElements.length - 1 
        ? 0 
        : this.currentFocusIndex + 1;
    }

    // Focus the element
    this.focusableElements[this.currentFocusIndex]?.focus();
    event.preventDefault();
  }

  private handleEscapeKey(event: KeyboardEvent) {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    }
  }

  private handleActivationKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    
    // Handle button activation
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      event.preventDefault();
      target.click();
    }
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyAccessibilitySettings();
  }

  /**
   * Get current accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    this.config.enableHighContrast = !this.config.enableHighContrast;
    this.applyAccessibilitySettings();
  }

  /**
   * Toggle reduced motion
   */
  toggleReducedMotion(): void {
    this.config.enableReducedMotion = !this.config.enableReducedMotion;
    this.applyAccessibilitySettings();
  }

  /**
   * Change font size
   */
  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.config.fontSize = size;
    this.applyAccessibilitySettings();
  }

  /**
   * Change color scheme
   */
  setColorScheme(scheme: 'light' | 'dark' | 'high-contrast'): void {
    this.config.colorScheme = scheme;
    this.applyAccessibilitySettings();
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.enableScreenReader) return;

    // Create or reuse live region
    let liveRegion = document.getElementById('a11y-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;
    
    // Clear after a delay
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }

  /**
   * Focus management for modals
   */
  trapFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    });

    // Focus first element
    firstElement.focus();
  }

  /**
   * Skip to main content functionality
   */
  createSkipLink(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Add ARIA labels to interactive elements
   */
  enhanceARIA(element: HTMLElement, label: string, description?: string): void {
    element.setAttribute('aria-label', label);
    
    if (description) {
      element.setAttribute('aria-describedby', description);
    }

    // Add role if not already present
    if (!element.getAttribute('role')) {
      if (element.tagName === 'BUTTON') {
        element.setAttribute('role', 'button');
      } else if (element.tagName === 'A') {
        element.setAttribute('role', 'link');
      }
    }
  }

  /**
   * Create accessible form field
   */
  createAccessibleField(
    container: HTMLElement,
    label: string,
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    errorId?: string
  ): void {
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.setAttribute('for', input.id);
    
    input.setAttribute('aria-describedby', errorId || '');
    
    container.insertBefore(labelElement, input);
  }

  /**
   * Handle form validation accessibility
   */
  announceValidationError(field: HTMLElement, message: string): void {
    const errorId = `error-${field.id}`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      errorElement.className = 'error-message';
      field.parentNode?.insertBefore(errorElement, field.nextSibling);
    }
    
    errorElement.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorId);
    
    // Announce to screen reader
    this.announceToScreenReader(message, 'assertive');
  }

  /**
   * Clear validation error
   */
  clearValidationError(field: HTMLElement): void {
    const errorId = field.getAttribute('aria-describedby');
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();

// Convenience functions
export const updateAccessibilityConfig = (config: Partial<AccessibilityConfig>) =>
  accessibilityManager.updateConfig(config);

export const getAccessibilityConfig = () =>
  accessibilityManager.getConfig();

export const toggleHighContrast = () =>
  accessibilityManager.toggleHighContrast();

export const toggleReducedMotion = () =>
  accessibilityManager.toggleReducedMotion();

export const setFontSize = (size: 'small' | 'medium' | 'large') =>
  accessibilityManager.setFontSize(size);

export const setColorScheme = (scheme: 'light' | 'dark' | 'high-contrast') =>
  accessibilityManager.setColorScheme(scheme);

export const announceToScreenReader = (message: string, priority?: 'polite' | 'assertive') =>
  accessibilityManager.announceToScreenReader(message, priority);

export const trapFocus = (container: HTMLElement) =>
  accessibilityManager.trapFocus(container);

export const createSkipLink = () =>
  accessibilityManager.createSkipLink();

export const enhanceARIA = (element: HTMLElement, label: string, description?: string) =>
  accessibilityManager.enhanceARIA(element, label, description);

export const createAccessibleField = (
  container: HTMLElement,
  label: string,
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  errorId?: string
) => accessibilityManager.createAccessibleField(container, label, input, errorId);

export const announceValidationError = (field: HTMLElement, message: string) =>
  accessibilityManager.announceValidationError(field, message);

export const clearValidationError = (field: HTMLElement) =>
  accessibilityManager.clearValidationError(field);

// Accessibility constants
export const ACCESSIBILITY_CONSTANTS = {
  FONT_SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large'
  },
  COLOR_SCHEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    HIGH_CONTRAST: 'high-contrast'
  },
  PRIORITIES: {
    POLITE: 'polite',
    ASSERTIVE: 'assertive'
  }
} as const;
