/**
 * Report levels used in the beauty system.
 */
export type ReportLevel = 'first-look' | 'style-upgrade' | 'beauty-pro';

/**
 * Result of a permission check for report access.
 */
export interface PermissionResult {
  allowed: boolean;
  reason: string;
  tokenRequired?: number;
  balance?: number;
}

/**
 * Permission check inputs.
 */
export interface CanAccessReportInput {
  userId: string;
  reportLevel: ReportLevel;
  tokenBalance?: number;
}
