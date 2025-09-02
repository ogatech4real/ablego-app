// Test setup file for AbleGo application

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { testingUtils } from './utils/testing';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn(() => ({
    getPropertyValue: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
    functions: {
      invoke: jest.fn(),
    },
  },
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  db: {
    getProfile: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock GSAP
jest.mock('gsap', () => ({
  gsap: {
    to: jest.fn(() => ({ kill: jest.fn() })),
    from: jest.fn(() => ({ kill: jest.fn() })),
    fromTo: jest.fn(() => ({ kill: jest.fn() })),
    timeline: jest.fn(() => ({
      to: jest.fn(() => ({ kill: jest.fn() })),
      from: jest.fn(() => ({ kill: jest.fn() })),
      fromTo: jest.fn(() => ({ kill: jest.fn() })),
      kill: jest.fn(),
    })),
    set: jest.fn(),
    killTweensOf: jest.fn(),
  },
}));

// Mock Google Maps
jest.mock('./services/googleMapsService', () => ({
  googleMapsService: {
    getTravelInfo: jest.fn(),
    getDirections: jest.fn(),
    geocodeAddress: jest.fn(),
  },
}));

// Mock Google Places
jest.mock('./services/googlePlacesService', () => ({
  googlePlacesService: {
    searchPlaces: jest.fn(),
    getPlaceDetails: jest.fn(),
  },
}));

// Mock pricing service
jest.mock('./services/pricingService', () => ({
  pricingService: {
    calculateFare: jest.fn(),
    getMinimumPickupTime: jest.fn(() => new Date()),
    getFareBreakdown: jest.fn(),
  },
}));

// Mock validation utilities
jest.mock('./utils/validation', () => ({
  validator: {
    validateField: jest.fn(),
    validateObject: jest.fn(),
    validateForm: jest.fn(),
  },
  validateField: jest.fn(),
  validateObject: jest.fn(),
  validateForm: jest.fn(),
  formSchemas: {
    userRegistration: {},
    booking: {},
    driverApplication: {},
    supportWorkerApplication: {},
  },
}));

// Mock security utilities
jest.mock('./utils/security', () => ({
  securityManager: {
    sanitizeInput: jest.fn(),
    validateFile: jest.fn(),
    checkRateLimit: jest.fn(),
    generateSecureToken: jest.fn(),
    hashData: jest.fn(),
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    sanitizeHTML: jest.fn(),
    validateURL: jest.fn(),
  },
  sanitizeInput: jest.fn((input: string) => input),
  validateFile: jest.fn(() => ({ isValid: true })),
  checkRateLimit: jest.fn(() => ({ allowed: true, remaining: 99, resetTime: Date.now() + 60000 })),
  generateSecureToken: jest.fn(() => 'mock-token'),
  hashData: jest.fn(() => Promise.resolve('mock-hash')),
  validateEmail: jest.fn(() => ({ isValid: true })),
  validatePassword: jest.fn(() => ({ isValid: true, strength: 'strong' })),
  sanitizeHTML: jest.fn((html: string) => html),
  validateURL: jest.fn(() => ({ isValid: true })),
}));

// Mock error handler
jest.mock('./utils/errorHandler', () => ({
  errorHandler: {
    handleError: jest.fn(),
    handleAuthError: jest.fn(),
    handleNetworkError: jest.fn(),
    handleValidationError: jest.fn(),
  },
  handleError: jest.fn((error: any) => ({ message: error.message || 'Test error' })),
  handleAuthError: jest.fn(),
  handleNetworkError: jest.fn(),
  handleValidationError: jest.fn(),
}));

// Mock performance utilities
jest.mock('./utils/performance', () => ({
  performanceMonitor: {
    recordMetric: jest.fn(),
    getMetricStats: jest.fn(),
    clearMetrics: jest.fn(),
  },
  recordMetric: jest.fn(),
  getMetricStats: jest.fn(() => ({ min: 0, max: 0, avg: 0, count: 0 })),
  clearMetrics: jest.fn(),
}));

// Mock accessibility utilities
jest.mock('./utils/accessibility', () => ({
  accessibilityManager: {
    updateConfig: jest.fn(),
    getConfig: jest.fn(() => ({
      enableHighContrast: false,
      enableReducedMotion: false,
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      fontSize: 'medium',
      colorScheme: 'dark',
    })),
    toggleHighContrast: jest.fn(),
    toggleReducedMotion: jest.fn(),
    setFontSize: jest.fn(),
    setColorScheme: jest.fn(),
    announceToScreenReader: jest.fn(),
    trapFocus: jest.fn(),
    createSkipLink: jest.fn(),
    enhanceARIA: jest.fn(),
    createAccessibleField: jest.fn(),
    announceValidationError: jest.fn(),
    clearValidationError: jest.fn(),
  },
  updateAccessibilityConfig: jest.fn(),
  getAccessibilityConfig: jest.fn(() => ({
    enableHighContrast: false,
    enableReducedMotion: false,
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    fontSize: 'medium',
    colorScheme: 'dark',
  })),
  toggleHighContrast: jest.fn(),
  toggleReducedMotion: jest.fn(),
  setFontSize: jest.fn(),
  setColorScheme: jest.fn(),
  announceToScreenReader: jest.fn(),
  trapFocus: jest.fn(),
  createSkipLink: jest.fn(),
  enhanceARIA: jest.fn(),
  createAccessibleField: jest.fn(),
  announceValidationError: jest.fn(),
  clearValidationError: jest.fn(),
}));

// Mock user service
jest.mock('./services/userService', () => ({
  userService: {
    createUserAccount: jest.fn(),
    createUserFromGuestBooking: jest.fn(),
    signInUser: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteUserAccount: jest.fn(),
  },
  createUserAccount: jest.fn(),
  createUserFromGuestBooking: jest.fn(),
  signInUser: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  deleteUserAccount: jest.fn(),
}));

// Setup testing utilities
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset testing utilities
  testingUtils.resetMockData();
  
  // Clear localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  testingUtils.cleanup();
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Export testing utilities for use in tests
export { testingUtils };
