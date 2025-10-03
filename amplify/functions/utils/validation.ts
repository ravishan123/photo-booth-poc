/**
 * Input validation utilities
 * Lightweight validation helpers without external dependencies
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate required string field
 */
export function validateRequired(
  value: any,
  fieldName: string,
  errors: ValidationError[]
): boolean {
  if (!value || typeof value !== "string" || value.trim() === "") {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
    });
    return false;
  }
  return true;
}

/**
 * Validate email format
 */
export function validateEmail(
  email: string,
  errors: ValidationError[]
): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
    });
    return false;
  }
  return true;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: any,
  fieldName: string,
  errors: ValidationError[]
): boolean {
  if (typeof value !== "number" || value <= 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a positive number`,
    });
    return false;
  }
  return true;
}

/**
 * Validate non-negative number
 */
export function validateNonNegativeNumber(
  value: any,
  fieldName: string,
  errors: ValidationError[]
): boolean {
  if (typeof value !== "number" || value < 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a non-negative number`,
    });
    return false;
  }
  return true;
}

/**
 * Validate array with minimum length
 */
export function validateArray(
  value: any,
  fieldName: string,
  minLength: number,
  errors: ValidationError[]
): boolean {
  if (!Array.isArray(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be an array`,
    });
    return false;
  }
  if (value.length < minLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must contain at least ${minLength} item(s)`,
    });
    return false;
  }
  return true;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: any,
  fieldName: string,
  allowedValues: T[],
  errors: ValidationError[]
): boolean {
  if (!allowedValues.includes(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
    });
    return false;
  }
  return true;
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Validate UUID format
 */
export function validateUUID(
  value: string,
  fieldName: string,
  errors: ValidationError[]
): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid UUID`,
    });
    return false;
  }
  return true;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  code: string,
  errors?: ValidationError[]
) {
  return {
    statusCode,
    body: JSON.stringify({
      message,
      code,
      ...(errors && { errors }),
    }),
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(statusCode: number, data: any) {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
}
