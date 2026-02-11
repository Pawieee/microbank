// src/lib/security.ts

/**
 * Regex for Strong Password:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export type PasswordStrength = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  isValid: boolean;
};

export const validatePassword = (password: string): PasswordStrength => {
  const length = password.length >= 8;
  const uppercase = /[A-Z]/.test(password);
  const lowercase = /[a-z]/.test(password);
  const number = /\d/.test(password);
  // Matches common special characters
  const special = /[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    length,
    uppercase,
    lowercase,
    number,
    special,
    isValid: length && uppercase && lowercase && number && special
  };
};

export const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: '8+ Characters' },
  { key: 'uppercase', label: 'Uppercase Letter' },
  { key: 'lowercase', label: 'Lowercase Letter' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special Char (@$!%*?&)' },
];