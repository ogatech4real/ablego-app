/**
 * Scroll utilities for better UI flow
 */

export const scrollToTop = (behavior: 'smooth' | 'instant' = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior
  });
};

export const scrollToActionZone = (
  targetSelector?: string,
  behavior: 'smooth' | 'instant' = 'smooth',
  offset = 100
) => {
  // If a specific target is provided, scroll to it
  if (targetSelector) {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (targetElement) {
      const elementPosition = targetElement.offsetTop;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior
      });
      return;
    }
  }

  // Auto-detect action zones in order of priority (forms and interactive content first)
  const actionZoneSelectors = [
    '.error-message, .alert, [role="alert"]', // Error messages (highest priority)
    '.success-message, .confirmation', // Success messages
    '.form-step.active, .current-step', // Active form steps
    '.booking-form, .guest-booking-form', // Booking forms specifically
    'form:not([hidden]):not(.search-form)', // Visible forms (excluding search)
    '.payment-section, .fare-breakdown', // Payment and pricing sections
    '.cta-section, .action-section', // Call-to-action sections
    '.content-section, .main-content', // Main content areas
    '.container > div:first-child:not(.bg-gradient)', // First non-header content
    'main' // Fallback to main content
  ];

  for (const selector of actionZoneSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && isElementVisible(element)) {
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior
      });
      return;
    }
  }

  // Fallback: scroll to a reasonable position (not the very top)
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const smartPosition = Math.min(
    documentHeight * 0.25, // 25% down the page (skip headers)
    viewportHeight * 0.8,  // Or most of viewport height
    400 // Or 400px max (typical header height)
  );
  
  window.scrollTo({
    top: smartPosition,
    behavior
  });
};

const isElementVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
};
export const scrollToElement = (
  element: HTMLElement | string,
  behavior: 'smooth' | 'instant' = 'smooth',
  offset = 0
) => {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) as HTMLElement
    : element;

  if (targetElement) {
    const elementPosition = targetElement.offsetTop;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior
    });
  }
};

export const scrollToFormError = (
  formSelector = 'form',
  behavior: 'smooth' | 'instant' = 'smooth'
) => {
  // Look for error messages within the form
  const form = document.querySelector(formSelector) as HTMLElement;
  if (!form) return;

  const errorElement = form.querySelector(
    '.error-message, .text-red-600, [role="alert"], .bg-red-50'
  ) as HTMLElement;

  if (errorElement) {
    scrollToElement(errorElement, behavior, 120);
  } else {
    // Scroll to top of form if no specific error found
    scrollToElement(form, behavior, 100);
  }
};

export const scrollToSuccess = (
  successSelector = '.success-message, .bg-green-50, .text-green-600',
  behavior: 'smooth' | 'instant' = 'smooth'
) => {
  const successElement = document.querySelector(successSelector) as HTMLElement;
  if (successElement) {
    scrollToElement(successElement, behavior, 120);
  }
};
export const scrollModalToTop = (modalSelector: string = '.modal-content') => {
  const modalElement = document.querySelector(modalSelector) as HTMLElement;
  if (modalElement) {
    modalElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
};

export const scrollToTopOnRouteChange = () => {
  // Smart scroll for route changes - don't always go to very top
  const currentPath = window.location.pathname;
  
  // For booking pages, scroll to action zone instead of top
  if (currentPath.includes('/book') || currentPath.includes('/booking')) {
    setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 50);
  } else if (currentPath.includes('/dashboard')) {
    // For dashboard pages, scroll to main content
    setTimeout(() => scrollToActionZone('.dashboard-content, .main-content'), 50);
  } else {
    // For other pages, scroll to top but with slight offset to avoid sticky headers
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};

export const smoothScrollToActionZone = (
  targetSelector?: string,
  delay = 0,
  offset = 100
) => {
  setTimeout(() => {
    scrollToActionZone(targetSelector, 'smooth', offset);
  }, delay);
};

export const scrollToTopWithFocus = (focusSelector?: string) => {
  scrollToTop('smooth');
  
  if (focusSelector) {
    setTimeout(() => {
      const element = document.querySelector(focusSelector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 500);
  }
};

export const scrollToActionZoneWithFocus = (
  targetSelector?: string,
  focusSelector?: string,
  offset = 100
) => {
  scrollToActionZone(targetSelector, 'smooth', offset);
  
  if (focusSelector) {
    setTimeout(() => {
      const element = document.querySelector(focusSelector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 500);
  }
};

// Mobile-optimized scroll with reduced offset
export const scrollToActionZoneMobile = (
  targetSelector?: string,
  behavior: 'smooth' | 'instant' = 'smooth'
) => {
  const isMobile = window.innerWidth < 768;
  const offset = isMobile ? 60 : 100; // Smaller offset on mobile
  
  scrollToActionZone(targetSelector, behavior, offset);
};