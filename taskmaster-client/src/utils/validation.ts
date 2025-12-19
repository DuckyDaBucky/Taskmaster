/**
 * Validation utilities
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 9) {
    errors.push("Password must be at least 9 characters");
  }

  if (password.length > 20) {
    errors.push("Password must not exceed 20 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUsername = (username: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (username.length < 9) {
    errors.push("Username must be at least 9 characters");
  }

  if (username.length > 20) {
    errors.push("Username must not exceed 20 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

