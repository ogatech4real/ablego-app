/**
 * Validation utilities for input sanitization and validation
 */

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+44|0)[1-9]\d{1,4}\s?\d{3,4}\s?\d{3,4}$/,
  POSTCODE: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
  UK_PHONE: /^(\+44|0)[1-9]\d{1,4}\s?\d{3,4}\s?\d{3,4}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  VEHICLE_REG: /^[A-Z]{2}\d{2}\s?[A-Z]{3}$/i,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  CURRENCY: /^£?\d+(\.\d{2})?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  ALPHA_ONLY: /^[a-zA-Z\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_ADDRESS_LENGTH: 10,
  MAX_ADDRESS_LENGTH: 200,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 15,
  MAX_EMAIL_LENGTH: 254,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_NOTES_LENGTH: 500
} as const;

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid UK phone number',
  INVALID_POSTCODE: 'Please enter a valid UK postcode',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  INVALID_VEHICLE_REG: 'Please enter a valid UK vehicle registration',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_TIME: 'Please enter a valid time',
  INVALID_CURRENCY: 'Please enter a valid amount',
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,
  TOO_LONG: (field: string, max: number) => `${field} must be no more than ${max} characters`,
  INVALID_FORMAT: (field: string) => `Please enter a valid ${field}`,
  FUTURE_DATE_REQUIRED: 'Date must be in the future',
  PAST_DATE_REQUIRED: 'Date must be in the past',
  MIN_AMOUNT: (amount: number) => `Amount must be at least £${amount}`,
  MAX_AMOUNT: (amount: number) => `Amount must be no more than £${amount}`
} as const;

// Input sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

export function sanitizeEmail(email: string): string {
  return sanitizeString(email).toLowerCase();
}

export function sanitizePhone(phone: string): string {
  return sanitizeString(phone).replace(/[^\d+]/g, '');
}

export function sanitizePostcode(postcode: string): string {
  return sanitizeString(postcode).toUpperCase();
}

export function sanitizeCurrency(amount: string): string {
  return sanitizeString(amount).replace(/[^\d.]/g, '');
}

// Validation functions
export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return VALIDATION_MESSAGES.REQUIRED;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedEmail = sanitizeEmail(email);
  if (sanitizedEmail.length > VALIDATION_RULES.MAX_EMAIL_LENGTH) {
    return VALIDATION_MESSAGES.TOO_LONG('email', VALIDATION_RULES.MAX_EMAIL_LENGTH);
  }
  
  if (!VALIDATION_PATTERNS.EMAIL.test(sanitizedEmail)) {
    return VALIDATION_MESSAGES.INVALID_EMAIL;
  }
  
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedPhone = sanitizePhone(phone);
  if (sanitizedPhone.length < VALIDATION_RULES.MIN_PHONE_LENGTH) {
    return VALIDATION_MESSAGES.TOO_SHORT('phone number', VALIDATION_RULES.MIN_PHONE_LENGTH);
  }
  
  if (sanitizedPhone.length > VALIDATION_RULES.MAX_PHONE_LENGTH) {
    return VALIDATION_MESSAGES.TOO_LONG('phone number', VALIDATION_RULES.MAX_PHONE_LENGTH);
  }
  
  if (!VALIDATION_PATTERNS.UK_PHONE.test(sanitizedPhone)) {
    return VALIDATION_MESSAGES.INVALID_PHONE;
  }
  
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return VALIDATION_MESSAGES.REQUIRED;
  
  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    return VALIDATION_MESSAGES.TOO_SHORT('password', VALIDATION_RULES.MIN_PASSWORD_LENGTH);
  }
  
  if (password.length > VALIDATION_RULES.MAX_PASSWORD_LENGTH) {
    return VALIDATION_MESSAGES.TOO_LONG('password', VALIDATION_RULES.MAX_PASSWORD_LENGTH);
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    return VALIDATION_MESSAGES.INVALID_PASSWORD;
  }
  
  return null;
}

export function validateName(name: string, fieldName: string = 'name'): string | null {
  if (!name) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedName = sanitizeString(name);
  if (sanitizedName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    return VALIDATION_MESSAGES.TOO_SHORT(fieldName, VALIDATION_RULES.MIN_NAME_LENGTH);
  }
  
  if (sanitizedName.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
    return VALIDATION_MESSAGES.TOO_LONG(fieldName, VALIDATION_RULES.MAX_NAME_LENGTH);
  }
  
  if (!VALIDATION_PATTERNS.ALPHA_ONLY.test(sanitizedName)) {
    return VALIDATION_MESSAGES.INVALID_FORMAT(fieldName);
  }
  
  return null;
}

export function validateAddress(address: string): string | null {
  if (!address) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedAddress = sanitizeString(address);
  if (sanitizedAddress.length < VALIDATION_RULES.MIN_ADDRESS_LENGTH) {
    return VALIDATION_MESSAGES.TOO_SHORT('address', VALIDATION_RULES.MIN_ADDRESS_LENGTH);
  }
  
  if (sanitizedAddress.length > VALIDATION_RULES.MAX_ADDRESS_LENGTH) {
    return VALIDATION_MESSAGES.TOO_LONG('address', VALIDATION_RULES.MAX_ADDRESS_LENGTH);
  }
  
  return null;
}

export function validatePostcode(postcode: string): string | null {
  if (!postcode) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedPostcode = sanitizePostcode(postcode);
  if (!VALIDATION_PATTERNS.POSTCODE.test(sanitizedPostcode)) {
    return VALIDATION_MESSAGES.INVALID_POSTCODE;
  }
  
  return null;
}

export function validateVehicleReg(reg: string): string | null {
  if (!reg) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedReg = sanitizeString(reg).toUpperCase();
  if (!VALIDATION_PATTERNS.VEHICLE_REG.test(sanitizedReg)) {
    return VALIDATION_MESSAGES.INVALID_VEHICLE_REG;
  }
  
  return null;
}

export function validateDate(date: string, requireFuture: boolean = false): string | null {
  if (!date) return VALIDATION_MESSAGES.REQUIRED;
  
  if (!VALIDATION_PATTERNS.DATE.test(date)) {
    return VALIDATION_MESSAGES.INVALID_DATE;
  }
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (requireFuture && dateObj <= today) {
    return VALIDATION_MESSAGES.FUTURE_DATE_REQUIRED;
  }
  
  return null;
}

export function validateTime(time: string): string | null {
  if (!time) return VALIDATION_MESSAGES.REQUIRED;
  
  if (!VALIDATION_PATTERNS.TIME.test(time)) {
    return VALIDATION_MESSAGES.INVALID_TIME;
  }
  
  return null;
}

export function validateCurrency(amount: string, minAmount?: number, maxAmount?: number): string | null {
  if (!amount) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedAmount = sanitizeCurrency(amount);
  if (!VALIDATION_PATTERNS.DECIMAL.test(sanitizedAmount)) {
    return VALIDATION_MESSAGES.INVALID_CURRENCY;
  }
  
  const numAmount = parseFloat(sanitizedAmount);
  
  if (minAmount !== undefined && numAmount < minAmount) {
    return VALIDATION_MESSAGES.MIN_AMOUNT(minAmount);
  }
  
  if (maxAmount !== undefined && numAmount > maxAmount) {
    return VALIDATION_MESSAGES.MAX_AMOUNT(maxAmount);
  }
  
  return null;
}

export function validateDescription(description: string, fieldName: string = 'description'): string | null {
  if (!description) return VALIDATION_MESSAGES.REQUIRED;
  
  const sanitizedDescription = sanitizeString(description);
  if (sanitizedDescription.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    return VALIDATION_MESSAGES.TOO_LONG(fieldName, VALIDATION_RULES.MAX_DESCRIPTION_LENGTH);
  }
  
  return null;
}

// Composite validation functions
export function validateBookingForm(data: any): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields
  const requiredFields = ['pickup_address', 'destination_address', 'pickup_date', 'pickup_time'];
  requiredFields.forEach(field => {
    const error = validateRequired(data[field], field);
    if (error) errors[field] = error;
  });
  
  // Email validation
  if (data.email) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
  }
  
  // Phone validation
  if (data.phone) {
    const phoneError = validatePhone(data.phone);
    if (phoneError) errors.phone = phoneError;
  }
  
  // Date validation (must be future)
  if (data.pickup_date) {
    const dateError = validateDate(data.pickup_date, true);
    if (dateError) errors.pickup_date = dateError;
  }
  
  // Time validation
  if (data.pickup_time) {
    const timeError = validateTime(data.pickup_time);
    if (timeError) errors.pickup_time = timeError;
  }
  
  // Address validation
  if (data.pickup_address) {
    const addressError = validateAddress(data.pickup_address);
    if (addressError) errors.pickup_address = addressError;
  }
  
  if (data.destination_address) {
    const addressError = validateAddress(data.destination_address);
    if (addressError) errors.destination_address = addressError;
  }
  
  return errors;
}

export function validateUserRegistration(data: any): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields
  const requiredFields = ['first_name', 'last_name', 'email', 'password'];
  requiredFields.forEach(field => {
    const error = validateRequired(data[field], field);
    if (error) errors[field] = error;
  });
  
  // Name validation
  if (data.first_name) {
    const nameError = validateName(data.first_name, 'first name');
    if (nameError) errors.first_name = nameError;
  }
  
  if (data.last_name) {
    const nameError = validateName(data.last_name, 'last name');
    if (nameError) errors.last_name = nameError;
  }
  
  // Email validation
  if (data.email) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
  }
  
  // Password validation
  if (data.password) {
    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;
  }
  
  // Phone validation (optional)
  if (data.phone) {
    const phoneError = validatePhone(data.phone);
    if (phoneError) errors.phone = phoneError;
  }
  
  return errors;
}

// Utility function to check if form has errors
export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

// Utility function to get first error message
export function getFirstError(errors: Record<string, string>): string | null {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
}
