/**
 * Token Service - Manages AI Beauty analysis token exchange and validation
 * Uses universal storage layer (wx.storage / localStorage)
 * Balance checks use server API as source of truth.
 */
import type { BeautyToken, BeautyUserQuota, TokenTransaction, ReportAccess, ReportLevel } from "@/types";
import { getStorage, setStorage, removeStorage } from "@/utils/storage";
import { api } from "@/services/api-client";

function getStoredTokens(): BeautyToken[] {
  return getStorage<BeautyToken[]>("beauty_tokens", []) ?? [];
}

function setStoredTokens(tokens: BeautyToken[]): void {
  setStorage("beauty_tokens", tokens);
}

function getStoredQuota(): BeautyUserQuota | null {
  return getStorage<BeautyUserQuota>("beauty_user_quota", undefined);
}

function setStoredQuota(quota: BeautyUserQuota): void {
  setStorage("beauty_user_quota", quota);
}

function generateRandomToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateToken(type: "free" | "purchased", userId?: string): BeautyToken {
  const tokenId = "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  const token = "BEAUTY-" + generateRandomToken() + "-" + generateRandomToken();
  const tokenObj: BeautyToken = {
    id: tokenId,
    token,
    type,
    count: 1,
    status: "unused",
    userId: userId, 
    createdAt: new Date().toISOString(),
    usedAt: undefined,
  };
  const tokens = getStoredTokens();
  tokens.push(tokenObj);
  setStoredTokens(tokens);
  return tokenObj;
}

export function validateToken(token: string): { valid: boolean; error?: string; token?: BeautyToken } {
  if (!token) {
    return { valid: false, error: "Token cannot be empty" };
  }
  const tokens = getStoredTokens();
  const foundToken = tokens.find((t: BeautyToken) => t.token === token.trim() && t.status === "unused");
  if (!foundToken) {
    return { valid: false, error: "Token does not exist or has been used" };
  }
  return { valid: true, token: foundToken };
}

export async function fetchServerBalance(userId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const response = await api.get("/api/token/balance");
    if (response.success && response.data) {
      const data = response.data as { balance?: number };
      return { success: true, balance: data.balance };
    }
    return { success: false, error: response.error || "Failed to get balance" };
  } catch {
    return { success: false, error: "Network error, failed to get balance" };
  }
}

export async function consumeServerTokens(amount: number, reason: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const response = await api.post("/api/token/consume", { amount, reason });
    if (response.success && response.data) {
      const data = response.data as { balance?: number };
      return { success: true, balance: data.balance };
    }
    return { success: false, error: response.error || "Deduction failed" };
  } catch {
    return { success: false, error: "Network error, deduction failed" };
  }
}

export function consumeToken(tokenCode: string, userId: string): { success: boolean; message: string; token?: BeautyToken } {
  const validation = validateToken(tokenCode);
  if (!validation.valid) {
    return { success: false, message: validation.error || "Invalid token" };
  }
  const tokens = getStoredTokens();
  const index = tokens.findIndex((t: BeautyToken) => t.id === validation.token!.id);
  if (index === -1) {
    return { success: false, message: "Token not found" };
  }
  tokens[index].status = "used";
  tokens[index].userId = userId;
  tokens[index].usedAt = new Date().toISOString();
  setStoredTokens(tokens);
  updateQuotaAfterConsume(userId);
  return { success: true, message: "Token redeemed successfully", token: tokens[index] };
}

function updateQuotaAfterConsume(userId: string): void {
  const quota = getUserQuota(userId);
  quota.tokenCount = Math.max(0, quota.tokenCount - 1);
  quota.totalCount = quota.freeCount + quota.tokenCount;
  quota.updatedAt = new Date().toISOString();
  setStoredQuota(quota);
}

export function getUserQuota(userId: string): BeautyUserQuota {
  let quota = getStoredQuota();
  if (!quota || quota.userId !== userId) {
    quota = {
      userId,
      freeCount: 1,
      tokenCount: 0,
      totalCount: 1,
      updatedAt: new Date().toISOString(),
    };
    setStoredQuota(quota);
  }
  return quota;
}

export function getAvailableCredits(userId: string): { freeCount: number; tokenCount: number; totalCount: number } {
  const quota = getUserQuota(userId);
  return {
    freeCount: quota.freeCount,
    tokenCount: quota.tokenCount,
    totalCount: quota.totalCount,
  };
}

const CONSUME_RECORDS_KEY = "beauty_consume_records";

export function recordConsume(
  userId: string,
  amount: number,
  type: "exchange" | "refund" | "bonus" | "purchase",
  reportLevel?: ReportLevel,
  orderId?: string
): TokenTransaction {
  const balanceBefore = getUserQuota(userId).totalCount;
  const transaction: TokenTransaction = {
    id: "txn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    userId,
    type,
    amount,
    reportLevel,
    balanceBefore,
    balanceAfter: balanceBefore - amount,
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orderId,
    requestId: undefined,
  };
  const records = getStoredConsumeRecords();
  records.push(transaction);
  setStoredConsumeRecords(records);
  return transaction;
}

export function getConsumeRecords(userId: string): TokenTransaction[] {
  return getStoredConsumeRecords().filter((r: TokenTransaction) => r.userId === userId);
}

export function getConsumeRecordById(transactionId: string): TokenTransaction | undefined {
  return getStoredConsumeRecords().find((r: TokenTransaction) => r.id === transactionId);
}

function getStoredConsumeRecords(): TokenTransaction[] {
  return getStorage<TokenTransaction[]>(CONSUME_RECORDS_KEY, []) ?? [];
}

function setStoredConsumeRecords(records: TokenTransaction[]): void {
  setStorage(CONSUME_RECORDS_KEY, records);
}

const UNLOCK_RECORDS_KEY = "beauty_unlock_records";

export function recordUnlock(
  userId: string,
  reportId: string,
  level: ReportLevel,
  unlockType: "free" | "token" | "payment",
  tokenCost: number
): ReportAccess {
  const unlock: ReportAccess = {
    reportId,
    userId,
    level,
    unlocked: true,
    unlockType,
    tokenCost,
    createdAt: new Date().toISOString(),
    expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const records = getStoredUnlockRecords();
  records.push(unlock);
  setStoredUnlockRecords(records);
  return unlock;
}

export function getUnlockRecords(userId: string): ReportAccess[] {
  return getStoredUnlockRecords().filter((r: ReportAccess) => r.userId === userId && r.unlocked);
}

export function isReportUnlockedLocally(reportId: string, userId: string): boolean {
  return getStoredUnlockRecords().some(
    (r: ReportAccess) => r.reportId === reportId && r.userId === userId && r.unlocked
  );
}

function getStoredUnlockRecords(): ReportAccess[] {
  return getStorage<ReportAccess[]>(UNLOCK_RECORDS_KEY, []) ?? [];
}

function setStoredUnlockRecords(records: ReportAccess[]): void {
  setStorage(UNLOCK_RECORDS_KEY, records);
}

export function generateDemoTokens(count: number, userId: string): BeautyToken[] {
  const tokens: BeautyToken[] = [];
  for (let i = 0; i < count; i++) {
    tokens.push(generateToken("purchased", userId));
  }
  return tokens;
}

export function resetDemoData(): void {
  removeStorage("beauty_tokens");
  removeStorage("beauty_user_quota");
  removeStorage(CONSUME_RECORDS_KEY);
  removeStorage(UNLOCK_RECORDS_KEY);
}

const tokenService = {
  generateToken,
  validateToken,
  consumeToken,
  getUserQuota,
  getAvailableCredits,
  recordConsume,
  getConsumeRecords,
  getConsumeRecordById,
  recordUnlock,
  getUnlockRecords,
  isReportUnlockedLocally,
  generateDemoTokens,
  resetDemoData,
};

export default tokenService;
