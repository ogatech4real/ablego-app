import { toast } from 'react-hot-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userFriendly?: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors consistently across the application
   */
  handleError(error: any, context?: string): AppError {
    const appError = this.normalizeError(error, context);
    
    // Log the error
    this.logError(appError);
    
    // Show user-friendly message if appropriate
    if (appError.userFriendly) {
      this.showUserMessage(appError);
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${context || 'App'}] Error:`, appError);
    }
    
    return appError;
  }

  /**
   * Normalize different error types into consistent AppError format
   */
  private normalizeError(error: any, context?: string): AppError {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred';
    let details = null;
    let userFriendly = false;

    if (error instanceof Error) {
      message = error.message;
      details = {
        stack: error.stack,
        name: error.name
      };
      
      // Check for specific error types
      if (error.message.includes('network') || error.message.includes('fetch')) {
        code = 'NETWORK_ERROR';
        message = 'Network connection error. Please check your internet connection.';
        userFriendly = true;
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        code = 'AUTH_ERROR';
        message = 'Authentication failed. Please log in again.';
        userFriendly = true;
      } else if (error.message.includes('forbidden') || error.message.includes('403')) {
        code = 'PERMISSION_ERROR';
        message = 'You don\'t have permission to perform this action.';
        userFriendly = true;
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        code = 'NOT_FOUND';
        message = 'The requested resource was not found.';
        userFriendly = true;
      } else if (error.message.includes('validation')) {
        code = 'VALIDATION_ERROR';
        message = 'Please check your input and try again.';
        userFriendly = true;
      }
    } else if (typeof error === 'string') {
      message = error;
      userFriendly = true;
    } else if (error && typeof error === 'object') {
      if (error.message) {
        message = error.message;
      }
      if (error.code) {
        code = error.code;
      }
      details = error;
      userFriendly = error.userFriendly || false;
    }

    return {
      code,
      message,
      details,
      timestamp: new Date(),
      userFriendly
    };
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Send to error reporting service in production
    if (import.meta.env.PROD) {
      this.reportToService(error);
    }
  }

  /**
   * Show user-friendly error message
   */
  private showUserMessage(error: AppError): void {
    if (error.userFriendly) {
      toast.error(error.message, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }
  }

  /**
   * Report error to external service (e.g., Sentry, LogRocket)
   */
  private async reportToService(error: AppError): Promise<void> {
    try {
      // This would integrate with your error reporting service
      // For now, we'll just log it
      console.error('Production Error Report:', error);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Handle specific error types with custom logic
   */
  handleAuthError(error: any): void {
    const appError = this.handleError(error, 'Authentication');
    
    // Redirect to login if needed
    if (appError.code === 'AUTH_ERROR') {
      // This would integrate with your auth system
      console.log('Redirecting to login due to auth error');
    }
  }

  handleNetworkError(error: any): void {
    const appError = this.handleError(error, 'Network');
    
    // Show retry option for network errors
    if (appError.code === 'NETWORK_ERROR') {
      toast.error(
        (t) => (
          <div>
            <p>{appError.message}</p>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                window.location.reload();
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ),
        { duration: 10000 }
      );
    }
  }

  handleValidationError(error: any, field?: string): void {
    const appError = this.handleError(error, 'Validation');
    
    if (field) {
      appError.message = `Please check the ${field} field and try again.`;
    }
    
    this.showUserMessage(appError);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions for common error types
export const handleError = (error: any, context?: string) => 
  errorHandler.handleError(error, context);

export const handleAuthError = (error: any) => 
  errorHandler.handleAuthError(error);

export const handleNetworkError = (error: any) => 
  errorHandler.handleNetworkError(error);

export const handleValidationError = (error: any, field?: string) => 
  errorHandler.handleValidationError(error, field);

// Error boundary helper
export const isRecoverableError = (error: AppError): boolean => {
  const nonRecoverableCodes = ['AUTH_ERROR', 'PERMISSION_ERROR'];
  return !nonRecoverableCodes.includes(error.code);
};

// Retry logic helper
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};
