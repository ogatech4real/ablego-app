// Security utilities for the AbleGo application

export interface SecurityConfig {
  maxInputLength: number;
  allowedFileTypes: string[];
  maxFileSize: number; // in bytes
  rateLimitWindow: number; // in milliseconds
  maxRequestsPerWindow: number;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.config = {
      maxInputLength: 1000,
      allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 100
    };
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Sanitize user input to prevent XSS attacks
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters and patterns
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .trim();
  }

  /**
   * Validate file uploads
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${this.config.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.config.allowedFileTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${this.config.allowedFileTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Rate limiting for API requests
   */
  checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const current = this.requestCounts.get(identifier);

    if (!current || now > current.resetTime) {
      // Reset or create new rate limit entry
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerWindow - 1,
        resetTime: now + this.config.rateLimitWindow
      };
    }

    if (current.count >= this.config.maxRequestsPerWindow) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    // Increment count
    current.count++;
    this.requestCounts.set(identifier, current);

    return {
      allowed: true,
      remaining: this.config.maxRequestsPerWindow - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Use crypto.getRandomValues for better security
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for older browsers
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return result;
  }

  /**
   * Hash sensitive data (for client-side validation)
   */
  async hashData(data: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for older browsers
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Validate email format and security
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Check for suspicious patterns
    if (email.includes('javascript:') || email.includes('data:') || email.includes('vbscript:')) {
      return { isValid: false, error: 'Email contains invalid characters' };
    }

    // Check length
    if (email.length > 254) {
      return { isValid: false, error: 'Email is too long' };
    }

    return { isValid: true };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required', strength: 'weak' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: 'Password is too common', strength: 'weak' };
    }

    // Calculate strength
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    if (score < 3) {
      return { 
        isValid: false, 
        error: 'Password must contain uppercase, lowercase, numbers, and special characters', 
        strength 
      };
    }

    return { isValid: true, strength };
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html: string): string {
    if (typeof html !== 'string') {
      return '';
    }

    // Remove all HTML tags and attributes
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, '') // Remove HTML entities
      .trim();
  }

  /**
   * Validate URL security
   */
  validateURL(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);
      
      // Check for dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (dangerousProtocols.includes(urlObj.protocol.toLowerCase())) {
        return { isValid: false, error: 'URL protocol not allowed' };
      }

      // Check for suspicious patterns
      if (url.includes('javascript:') || url.includes('data:') || url.includes('vbscript:')) {
        return { isValid: false, error: 'URL contains invalid content' };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear rate limit data
   */
  clearRateLimits(): void {
    this.requestCounts.clear();
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Convenience functions
export const sanitizeInput = (input: string) => securityManager.sanitizeInput(input);
export const validateFile = (file: File) => securityManager.validateFile(file);
export const checkRateLimit = (identifier: string) => securityManager.checkRateLimit(identifier);
export const generateSecureToken = (length?: number) => securityManager.generateSecureToken(length);
export const hashData = (data: string) => securityManager.hashData(data);
export const validateEmail = (email: string) => securityManager.validateEmail(email);
export const validatePassword = (password: string) => securityManager.validatePassword(password);
export const sanitizeHTML = (html: string) => securityManager.sanitizeHTML(html);
export const validateURL = (url: string) => securityManager.validateURL(url);

// Security constants
export const SECURITY_CONSTANTS = {
  MAX_INPUT_LENGTH: 1000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100
} as const;
