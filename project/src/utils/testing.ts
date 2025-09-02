// Testing utilities for the AbleGo application

export interface TestConfig {
  enableMocking: boolean;
  enableLogging: boolean;
  testTimeout: number;
  retryAttempts: number;
}

export interface MockData {
  users: any[];
  profiles: any[];
  bookings: any[];
  guestBookings: any[];
  notifications: any[];
}

export class TestingUtils {
  private static instance: TestingUtils;
  private config: TestConfig;
  private mockData: MockData;
  private originalFetch: typeof fetch | null = null;
  private originalLocalStorage: Storage | null = null;
  private originalSessionStorage: Storage | null = null;

  private constructor() {
    this.config = {
      enableMocking: false,
      enableLogging: false,
      testTimeout: 5000,
      retryAttempts: 3
    };
    
    this.mockData = this.generateMockData();
  }

  static getInstance(): TestingUtils {
    if (!TestingUtils.instance) {
      TestingUtils.instance = new TestingUtils();
    }
    return TestingUtils.instance;
  }

  /**
   * Configure testing utilities
   */
  configure(config: Partial<TestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate mock data for testing
   */
  private generateMockData(): MockData {
    return {
      users: [
        {
          id: 'test-user-1',
          email: 'test@example.com',
          role: 'rider',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test-admin-1',
          email: 'admin@ablego.co.uk',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      profiles: [
        {
          id: 'test-user-1',
          email: 'test@example.com',
          name: 'Test User',
          phone: '+44123456789',
          role: 'rider',
          is_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test-admin-1',
          email: 'admin@ablego.co.uk',
          name: 'AbleGo Admin',
          phone: '+44123456788',
          role: 'admin',
          is_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      bookings: [
        {
          id: 'test-booking-1',
          user_id: 'test-user-1',
          pickup_address: '123 Test Street, London',
          dropoff_address: '456 Test Avenue, London',
          pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          support_workers_count: 1,
          special_requirements: 'Wheelchair access required',
          fare_estimate: 25.50,
          payment_method: 'cash_bank',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      guestBookings: [
        {
          id: 'test-guest-booking-1',
          guest_rider_id: 'test-guest-rider-1',
          pickup_address: '789 Guest Street, London',
          dropoff_address: '012 Guest Avenue, London',
          pickup_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          support_workers_count: 0,
          special_requirements: '',
          fare_estimate: 18.75,
          payment_method: 'cash_bank',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      notifications: [
        {
          id: 'test-notification-1',
          user_id: 'test-user-1',
          type: 'booking_confirmation',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed',
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  /**
   * Mock fetch API for testing
   */
  mockFetch(): void {
    if (this.originalFetch) return; // Already mocked
    
    this.originalFetch = global.fetch;
    
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      if (this.config.enableLogging) {
        console.log(`[TEST] Mock fetch called: ${urlString}`, init);
      }

      // Mock different endpoints
      if (urlString.includes('/auth/')) {
        return this.mockAuthResponse(urlString, init);
      } else if (urlString.includes('/rest/v1/')) {
        return this.mockSupabaseResponse(urlString, init);
      } else if (urlString.includes('/functions/v1/')) {
        return this.mockEdgeFunctionResponse(urlString, init);
      }

      // Default mock response
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };
  }

  /**
   * Restore original fetch
   */
  restoreFetch(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  /**
   * Mock authentication responses
   */
  private mockAuthResponse(url: string, init?: RequestInit): Response {
    if (url.includes('/signup')) {
      return new Response(JSON.stringify({
        user: this.mockData.users[0],
        session: { access_token: 'mock-token' }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (url.includes('/signin')) {
      return new Response(JSON.stringify({
        user: this.mockData.users[0],
        session: { access_token: 'mock-token' }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  /**
   * Mock Supabase REST API responses
   */
  private mockSupabaseResponse(url: string, init?: RequestInit): Response {
    const method = init?.method || 'GET';
    
    if (url.includes('/profiles')) {
      if (method === 'GET') {
        return new Response(JSON.stringify(this.mockData.profiles), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        const newProfile = { ...this.mockData.profiles[0], id: `new-${Date.now()}` };
        return new Response(JSON.stringify(newProfile), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.includes('/bookings')) {
      if (method === 'GET') {
        return new Response(JSON.stringify(this.mockData.bookings), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        const newBooking = { ...this.mockData.bookings[0], id: `new-${Date.now()}` };
        return new Response(JSON.stringify(newBooking), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  /**
   * Mock Edge Function responses
   */
  private mockEdgeFunctionResponse(url: string, init?: RequestInit): Response {
    if (url.includes('/unified-email-service')) {
      return new Response(JSON.stringify({
        message: 'Email sent successfully',
        success: true
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (url.includes('/create-driver-application')) {
      return new Response(JSON.stringify({
        success: true,
        application_id: `app-${Date.now()}`
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Function not found' }), { status: 404 });
  }

  /**
   * Mock localStorage
   */
  mockLocalStorage(): void {
    if (this.originalLocalStorage) return;
    
    this.originalLocalStorage = global.localStorage;
    const mockStorage: { [key: string]: string } = {};
    
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
      key: (index: number) => Object.keys(mockStorage)[index] || null,
      length: Object.keys(mockStorage).length
    };
  }

  /**
   * Restore localStorage
   */
  restoreLocalStorage(): void {
    if (this.originalLocalStorage) {
      global.localStorage = this.originalLocalStorage;
      this.originalLocalStorage = null;
    }
  }

  /**
   * Mock sessionStorage
   */
  mockSessionStorage(): void {
    if (this.originalSessionStorage) return;
    
    this.originalSessionStorage = global.sessionStorage;
    const mockStorage: { [key: string]: string } = {};
    
    global.sessionStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); },
      key: (index: number) => Object.keys(mockStorage)[index] || null,
      length: Object.keys(mockStorage).length
    };
  }

  /**
   * Restore sessionStorage
   */
  restoreSessionStorage(): void {
    if (this.originalSessionStorage) {
      global.sessionStorage = this.originalSessionStorage;
      this.originalSessionStorage = null;
    }
  }

  /**
   * Create test user data
   */
  createTestUser(overrides: Partial<any> = {}): any {
    return {
      id: `test-user-${Date.now()}`,
      email: 'test@example.com',
      role: 'rider',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create test profile data
   */
  createTestProfile(overrides: Partial<any> = {}): any {
    return {
      id: `test-profile-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      phone: '+44123456789',
      role: 'rider',
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create test booking data
   */
  createTestBooking(overrides: Partial<any> = {}): any {
    return {
      id: `test-booking-${Date.now()}`,
      user_id: 'test-user-1',
      pickup_address: '123 Test Street, London',
      dropoff_address: '456 Test Avenue, London',
      pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      support_workers_count: 1,
      special_requirements: 'Wheelchair access required',
      fare_estimate: 25.50,
      payment_method: 'cash_bank',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition: () => boolean, timeout: number = this.config.testTimeout): Promise<void> {
    const startTime = Date.now();
    
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Condition not met within ${timeout}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Clean up all mocks
   */
  cleanup(): void {
    this.restoreFetch();
    this.restoreLocalStorage();
    this.restoreSessionStorage();
  }

  /**
   * Get mock data
   */
  getMockData(): MockData {
    return { ...this.mockData };
  }

  /**
   * Set mock data
   */
  setMockData(data: Partial<MockData>): void {
    this.mockData = { ...this.mockData, ...data };
  }

  /**
   * Reset mock data to defaults
   */
  resetMockData(): void {
    this.mockData = this.generateMockData();
  }
}

// Export singleton instance
export const testingUtils = TestingUtils.getInstance();

// Convenience functions
export const mockFetch = () => testingUtils.mockFetch();
export const restoreFetch = () => testingUtils.restoreFetch();
export const mockLocalStorage = () => testingUtils.mockLocalStorage();
export const restoreLocalStorage = () => testingUtils.restoreLocalStorage();
export const mockSessionStorage = () => testingUtils.mockSessionStorage();
export const restoreSessionStorage = () => testingUtils.restoreSessionStorage();
export const createTestUser = (overrides?: Partial<any>) => testingUtils.createTestUser(overrides);
export const createTestProfile = (overrides?: Partial<any>) => testingUtils.createTestProfile(overrides);
export const createTestBooking = (overrides?: Partial<any>) => testingUtils.createTestBooking(overrides);
export const waitFor = (condition: () => boolean, timeout?: number) => testingUtils.waitFor(condition, timeout);
export const retry = <T>(fn: () => Promise<T>, maxAttempts?: number) => testingUtils.retry(fn, maxAttempts);
export const cleanup = () => testingUtils.cleanup();
export const getMockData = () => testingUtils.getMockData();
export const setMockData = (data: Partial<MockData>) => testingUtils.setMockData(data);
export const resetMockData = () => testingUtils.resetMockData();

// Testing constants
export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 1000,
    MEDIUM: 5000,
    LONG: 10000
  },
  DELAYS: {
    MINIMAL: 100,
    SHORT: 500,
    MEDIUM: 1000
  },
  RETRY_ATTEMPTS: {
    MINIMAL: 1,
    DEFAULT: 3,
    MAXIMUM: 5
  }
} as const;
