export type ValidationCode =
  | 'INVALID_FORMAT'
  | 'IMAGE_TOO_LARGE'
  | 'IMAGE_TOO_SMALL'
  | 'IMAGE_EMPTY'
  | 'BLURRY'
  | 'FACE_NOT_DETECTED';

export interface ValidationResult {
  valid: boolean;
  code?: ValidationCode;
  message?: string;
}
