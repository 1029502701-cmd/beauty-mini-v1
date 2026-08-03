/**
 * Token Transaction Model - Records all token exchange and consumption activities
 */
import type { ReportLevel } from "./report-level";

export type TransactionType = "exchange" | "refund" | "bonus" | "purchase";
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface TokenTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  reportLevel?: ReportLevel;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
  requestId?: string;
}
