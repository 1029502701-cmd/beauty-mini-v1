/**
 * Token transaction types.
 */
export type TokenType = 'add' | 'consume';

/**
 * A single token transaction record.
 */
export interface TokenTransactionRecord {
  id: string;
  userId: string;
  amount: number;
  type: TokenType;
  description: string;
  createdAt: string;
}

/**
 * Inputs for token service operations.
 */
export interface ConsumeTokenInput {
  userId: string;
  amount: number;
  description: string;
}
