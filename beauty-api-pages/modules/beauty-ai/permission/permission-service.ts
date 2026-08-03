import type { CanAccessReportInput, PermissionResult, ReportLevel } from './types';

/**
 * Token cost per report level.
 */
export const TOKEN_COST: Record<ReportLevel, number> = {
  'first-look': 0,
  'style-upgrade': 0,
  'beauty-pro': 1,
};

/**
 * TTL in days for saved reports per level.
 */
export const REPORT_TTL_DAYS: Record<ReportLevel, number> = {
  'first-look': 7,
  'style-upgrade': 15,
  'beauty-pro': 30,
};

/**
 * PermissionService - checks whether a user can access a report of a given level.
 */
export class PermissionService {
  canAccessReport(input: CanAccessReportInput): PermissionResult {
    const { userId, reportLevel, tokenBalance = 0 } = input;
    const cost = TOKEN_COST[reportLevel];

    if (cost === 0) {
      return { allowed: true, reason: 'The ' + reportLevel + ' report is free.' };
    }

    if (tokenBalance < cost) {
      return {
        allowed: false,
        reason: 'Insufficient tokens. ' + reportLevel + ' requires ' + cost + ' token(s), balance: ' + tokenBalance,
        tokenRequired: cost,
        balance: tokenBalance,
      };
    }

    return {
      allowed: true,
      reason: 'Access granted. ' + cost + ' token(s) will be consumed.',
      tokenRequired: cost,
      balance: tokenBalance,
    };
  }
}
