/**
 * Token Model for AI Beauty Analysis Credit System
 */
export interface BeautyToken {
  id: string;
  token: string;
  type: "free" | "purchased";
  count: number;
  status: "unused" | "used";
  userId?: string;
  createdAt: string;
  usedAt?: string;
}

/**
 * User Quota Model
 */
export interface BeautyUserQuota {
  userId: string;
  freeCount: number;
  tokenCount: number;
  totalCount: number;
  updatedAt: string;
}

/**
 * User Token Balance Model
 */
export interface UserTokenBalance {
  userId: string;
  balance: number;
  freeBalance: number;
  purchasedBalance: number;
  updatedAt: string;
}

/**
 * Token Balance Fetch Result
 */
export interface TokenBalanceResult {
  success: boolean;
  balance?: number;
  error?: string;
}

/**
 * Token Consume Result
 */
export interface TokenConsumeResult {
  success: boolean;
  balance?: number;
  error?: string;
}

/**
 * Token Top-up Result
 */
export interface TokenTopupResult {
  success: boolean;
  balance?: number;
  amount: number;
  error?: string;
}