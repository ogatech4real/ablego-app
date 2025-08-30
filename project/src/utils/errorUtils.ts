/**
 * Error handling and monitoring utilities
 */

export interface ErrorResponse {
  error: string;
  code: string;
  requestId: string;
  timestamp: string;
  details?: any;
  context?: {
    function?: string;
    endpoint?: string;
    userId?: string;
  };
}

export interface PerformanceMetrics {
  requestId: string;
  function: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

// Global performance tracking
const performanceMetrics: Map<string, PerformanceMetrics> = new Map();

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start performance tracking
export function startPerformanceTracking(functionName: string): string {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  performanceMetrics.set(requestId, {
    requestId,
    function: functionName,
    startTime,
    success: false
  });
  
  console.log(`🚀 [${requestId}] Starting ${functionName}`);
  return requestId;
}

// End performance tracking
export function endPerformanceTracking(requestId: string, success: boolean, error?: string): void {
  const metric = performanceMetrics.get(requestId);
  if (!metric) return;
  
  const endTime = Date.now();
  const duration = endTime - metric.startTime;
  
  metric.endTime = endTime;
  metric.duration = duration;
  metric.success = success;
  metric.error = error;
  
  const status = success ? '✅' : '❌';
  console.log(`${status} [${requestId}] ${metric.function} completed in ${duration}ms`);
  
  // Log slow requests
  if (duration > 5000) {
    console.warn(`⚠️ [${requestId}] Slow request detected: ${metric.function} took ${duration}ms`);
  }
  
  // Clean up old metrics (keep last 100)
  if (performanceMetrics.size > 100) {
    const oldestKey = performanceMetrics.keys().next().value;
    performanceMetrics.delete(oldestKey);
  }
}

// Create structured error response
export function createErrorResponse(
  error: string,
  code: string,
  requestId: string,
  details?: any,
  context?: { function?: string; endpoint?: string; userId?: string }
): ErrorResponse {
  return {
    error,
    code,
    requestId,
    timestamp: new Date().toISOString(),
    details,
    context
  };
}

// Error codes for different types of errors
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'AUTH_001',
  INVALID_TOKEN: 'AUTH_002',
  EXPIRED_TOKEN: 'AUTH_003',
  
  // Database errors
  DATABASE_CONNECTION: 'DB_001',
  QUERY_FAILED: 'DB_002',
  RECORD_NOT_FOUND: 'DB_003',
  
  // Validation errors
  INVALID_INPUT: 'VAL_001',
  MISSING_REQUIRED_FIELD: 'VAL_002',
  INVALID_FORMAT: 'VAL_003',
  
  // Business logic errors
  BOOKING_NOT_FOUND: 'BIZ_001',
  PAYMENT_FAILED: 'BIZ_002',
  EMAIL_SEND_FAILED: 'BIZ_003',
  
  // System errors
  INTERNAL_ERROR: 'SYS_001',
  EXTERNAL_API_ERROR: 'SYS_002',
  TIMEOUT_ERROR: 'SYS_003'
} as const;

// Error message mapping
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token',
  [ERROR_CODES.EXPIRED_TOKEN]: 'Authentication token expired',
  [ERROR_CODES.DATABASE_CONNECTION]: 'Database connection failed',
  [ERROR_CODES.QUERY_FAILED]: 'Database query failed',
  [ERROR_CODES.RECORD_NOT_FOUND]: 'Record not found',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid data format',
  [ERROR_CODES.BOOKING_NOT_FOUND]: 'Booking not found',
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed',
  [ERROR_CODES.EMAIL_SEND_FAILED]: 'Failed to send email',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.EXTERNAL_API_ERROR]: 'External API error',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timeout'
} as const;

// Get performance metrics
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return Array.from(performanceMetrics.values());
}

// Clear performance metrics
export function clearPerformanceMetrics(): void {
  performanceMetrics.clear();
}

// Error boundary helper
export function logError(error: Error, errorInfo?: any): void {
  const requestId = generateRequestId();
  console.error(`❌ [${requestId}] Error occurred:`, {
    message: error.message,
    stack: error.stack,
    errorInfo,
    timestamp: new Date().toISOString()
  });
}
