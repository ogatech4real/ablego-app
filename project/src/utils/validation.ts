export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  field?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export class Validator {
  private static instance: Validator;

  private constructor() {}

  static getInstance(): Validator {
    if (!Validator.instance) {
      Validator.instance = new Validator();
    }
    return Validator.instance;
  }

  /**
   * Validate a single field against a rule
   */
  validateField(value: any, rule: ValidationRule, fieldName?: string): ValidationResult {
    const errors: string[] = [];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(rule.message || `${fieldName || 'Field'} is required`);
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { isValid: true, errors: [], field: fieldName };
    }

    // Type-specific validations
    if (value !== undefined && value !== null && value !== '') {
      // String validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(rule.message || `${fieldName || 'Field'} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(rule.message || `${fieldName || 'Field'} must be no more than ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(rule.message || `${fieldName || 'Field'} format is invalid`);
        }
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : `${fieldName || 'Field'} validation failed`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      field: fieldName
    };
  }

  /**
   * Validate an object against a schema
   */
  validateObject(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    let isValid = true;

    for (const [field, rule] of Object.entries(schema)) {
      const fieldValue = data[field];
      const fieldResult = this.validateField(fieldValue, rule, field);
      
      if (!fieldResult.isValid) {
        isValid = false;
        errors.push(...fieldResult.errors);
      }
    }

    return {
      isValid,
      errors
    };
  }

  /**
   * Validate form data with field-specific error mapping
   */
  validateForm(data: any, schema: ValidationSchema): { isValid: boolean; errors: { [field: string]: string[] } } {
    const fieldErrors: { [field: string]: string[] } = {};
    let isValid = true;

    for (const [field, rule] of Object.entries(schema)) {
      const fieldValue = data[field];
      const fieldResult = this.validateField(fieldValue, rule, field);
      
      if (!fieldResult.isValid) {
        isValid = false;
        fieldErrors[field] = fieldResult.errors;
      }
    }

    return {
      isValid,
      errors: fieldErrors
    };
  }
}

// Export singleton instance
export const validator = Validator.getInstance();

// Common validation rules
export const commonRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'This field is required'
  }),

  email: (message?: string): ValidationRule => ({
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Please enter a valid email address'
  }),

  phone: (message?: string): ValidationRule => ({
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: message || 'Please enter a valid phone number'
  }),

  password: (minLength: number = 6, message?: string): ValidationRule => ({
    required: true,
    minLength,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: message || `Password must be at least ${minLength} characters with uppercase, lowercase, and number`
  }),

  postcode: (message?: string): ValidationRule => ({
    required: true,
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/i,
    message: message || 'Please enter a valid UK postcode'
  }),

  name: (message?: string): ValidationRule => ({
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/,
    message: message || 'Please enter a valid name (letters, spaces, hyphens, apostrophes only)'
  }),

  url: (message?: string): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message: message || 'Please enter a valid URL starting with http:// or https://'
  }),

  number: (min?: number, max?: number, message?: string): ValidationRule => ({
    custom: (value) => {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (min !== undefined && num < min) return `Value must be at least ${min}`;
      if (max !== undefined && num > max) return `Value must be no more than ${max}`;
      return true;
    },
    message
  }),

  date: (minDate?: Date, maxDate?: Date, message?: string): ValidationRule => ({
    custom: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Please enter a valid date';
      if (minDate && date < minDate) return `Date must be on or after ${minDate.toLocaleDateString()}`;
      if (maxDate && date > maxDate) return `Date must be on or before ${maxDate.toLocaleDateString()}`;
      return true;
    },
    message
  })
};

// Predefined schemas for common forms
export const formSchemas = {
  userRegistration: {
    firstName: commonRules.name('First name is required'),
    lastName: commonRules.name('Last name is required'),
    email: commonRules.email(),
    phone: commonRules.phone(),
    password: commonRules.password(8, 'Password must be at least 8 characters with uppercase, lowercase, and number'),
    confirmPassword: {
      required: true,
      custom: (value, formData) => {
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return true;
      },
      message: 'Passwords do not match'
    }
  },

  booking: {
    pickupAddress: commonRules.required('Pickup address is required'),
    dropoffAddress: commonRules.required('Dropoff address is required'),
    pickupTime: commonRules.date(undefined, undefined, 'Please select a valid pickup time'),
    supportWorkersCount: commonRules.number(0, 10, 'Support workers count must be between 0 and 10'),
    specialRequirements: {
      maxLength: 500,
      message: 'Special requirements must be no more than 500 characters'
    }
  },

  driverApplication: {
    fullName: commonRules.name('Full name is required'),
    email: commonRules.email(),
    phone: commonRules.phone(),
    dateOfBirth: commonRules.date(undefined, new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old'),
    address: commonRules.required('Address is required'),
    licenseNumber: {
      required: true,
      pattern: /^[A-Z]{5}[0-9]{6}[A-Z]{1}[0-9]{2}$/,
      message: 'Please enter a valid UK driving license number'
    },
    vehicleRegistration: {
      required: true,
      pattern: /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/,
      message: 'Please enter a valid UK vehicle registration number'
    }
  },

  supportWorkerApplication: {
    fullName: commonRules.name('Full name is required'),
    email: commonRules.email(),
    phone: commonRules.phone(),
    dateOfBirth: commonRules.date(undefined, new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old'),
    address: commonRules.required('Address is required'),
    bio: {
      required: true,
      minLength: 100,
      maxLength: 1000,
      message: 'Bio must be between 100 and 1000 characters'
    },
    specializations: {
      required: true,
      custom: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          return 'Please select at least one specialization';
        }
        return true;
      },
      message: 'Please select at least one specialization'
    }
  }
};

// Convenience functions
export const validateField = (value: any, rule: ValidationRule, fieldName?: string) =>
  validator.validateField(value, rule, fieldName);

export const validateObject = (data: any, schema: ValidationSchema) =>
  validator.validateObject(data, schema);

export const validateForm = (data: any, schema: ValidationSchema) =>
  validator.validateForm(data, schema);

// Real-time validation helper for forms
export const createFieldValidator = (schema: ValidationSchema) => {
  return (fieldName: string, value: any) => {
    const rule = schema[fieldName];
    if (!rule) return { isValid: true, errors: [] };
    return validator.validateField(value, rule, fieldName);
  };
};
