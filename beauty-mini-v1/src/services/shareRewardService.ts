/**
 * Share Reward Service
 * Handles token rewards for sharing reports.
 */
import type { ShareRecord, UserTokenBalance, BeautyUser } from "@/types";
import { setStorage, getStorage } from "@/utils/storage";
import userService from "@/services/user-service";
import { fetchServerBalance, recordConsume } from "@/services/token";

export interface ShareRewardResult {
  success: boolean;
  rewardTokens: number;
  newBalance?: number;
  message?: string;
}

export interface ShareRewardRecord {
  id: string;
  userId: string;
  reportId: string;
  rewardTokens: number;
  claimedAt: string;
  status: "pending" | "claimed" | "expired";
}

/** Callback fired when a share is successfully recorded */
export type ShareSuccessCallback = (record: ShareRecord) => void;
/** Callback fired when a share reward is claimed */
export type RewardClaimedCallback = (result: ShareRewardResult) => void;

const SHARE_REWARD_KEY = "share_reward_config";
const SHARE_RECORDS_KEY = "share_records";
const SHARE_REWARD_RECORDS_KEY = "share_reward_records";
const DEFAULT_SHARE_REWARD = 1;
const SHARE_COOLDOWN_MS = 3600000;

class ShareRewardService {
  private shareSuccessCallbacks: ShareSuccessCallback[] = [];
  private rewardClaimedCallbacks: RewardClaimedCallback[] = [];

  /** Register a callback fired on successful share recording */
  onShareSuccess(cb: ShareSuccessCallback): void {
    this.shareSuccessCallbacks.push(cb);
  }

  /** Register a callback fired when a share reward is claimed */
  onRewardClaimed(cb: RewardClaimedCallback): void {
    this.rewardClaimedCallbacks.push(cb);
  }

  /** Remove a previously registered callback */
  offShareSuccess(cb: ShareSuccessCallback): void {
    this.shareSuccessCallbacks = this.shareSuccessCallbacks.filter((fn) => fn !== cb);
  }

  offRewardClaimed(cb: RewardClaimedCallback): void {
    this.rewardClaimedCallbacks = this.rewardClaimedCallbacks.filter((fn) => fn !== cb);
  }

  getShareRewardConfig(): { rewardTokens: number; cooldownMs: number } {
    const stored = getStorage<Record<string, unknown>>(SHARE_REWARD_KEY, undefined);
    if (stored && typeof stored.rewardTokens === "number") {
      return {
        rewardTokens: stored.rewardTokens as number,
        cooldownMs: (stored.cooldownMs as number) || SHARE_COOLDOWN_MS,
      };
    }
    return { rewardTokens: DEFAULT_SHARE_REWARD, cooldownMs: SHARE_COOLDOWN_MS };
  }

  /**
   * Record a share event.
   * Emits onShareSuccess callbacks with the created record.
   */
  async recordShare(reportId: string): Promise<ShareRecord> {
    const user = await userService.getCurrentUser() as BeautyUser;
    const record: ShareRecord = {
      id: "share_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      reportId,
      shareUserId: user.userId,
      status: "created",
      createdAt: new Date().toISOString(),
    };
    const records = this.getStoredShares();
    records.push(record);
    this.setStoredShares(records);
    // Fire callbacks
    for (const cb of this.shareSuccessCallbacks) {
      try { cb(record); } catch { /* ignore callback errors */ }
    }
    return record;
  }

  /**
   * Claim a share reward. Enforces cooldown to prevent duplicate rewards.
   * Emits onRewardClaimed callbacks with the result.
   */
  async claimShareReward(
    shareRecordId: string,
    userId?: string
  ): Promise<ShareRewardResult> {
    const currentUser = await userService.getCurrentUser() as BeautyUser;
    const user = userId || currentUser.userId;
    const record = this.getShareRecord(shareRecordId);
    if (!record || record.status !== "created") {
      return { success: false, rewardTokens: 0, message: "分享记录不存在或已领取" };
    }
    const config = this.getShareRewardConfig();
    const now = new Date();
    const lastClaimKey = "share_last_claim_" + user;
    const lastClaim = getStorage<string>(lastClaimKey, undefined);
    if (lastClaim) {
      const elapsed = now.getTime() - new Date(lastClaim).getTime();
      if (elapsed < config.cooldownMs) {
        return { success: false, rewardTokens: 0, message: "分享奖励冷却中，请稍后再试" };
      }
    }
    const newBalance = (await this.incrementBalance(user, config.rewardTokens)).balance;
    record.status = "completed";
    const records = this.getStoredShares();
    const idx = records.findIndex((r) => r.id === shareRecordId);
    if (idx !== -1) records[idx] = record;
    this.setStoredShares(records);
    setStorage(lastClaimKey, now.toISOString());

    // Record the reward locally
    const rewardRecord: ShareRewardRecord = {
      id: "reward_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      userId: user,
      reportId: record.reportId,
      rewardTokens: config.rewardTokens,
      claimedAt: now.toISOString(),
      status: "claimed",
    };
    const rewardRecords = this.getStoredRewardRecords();
    rewardRecords.push(rewardRecord);
    this.setStoredRewardRecords(rewardRecords);

    const result: ShareRewardResult = {
      success: true,
      rewardTokens: config.rewardTokens,
      newBalance,
    };
    for (const cb of this.rewardClaimedCallbacks) {
      try { cb(result); } catch { /* ignore callback errors */ }
    }
    return result;
  }

  /**
   * Get all recorded share rewards for a user.
   */
  getRewardRecords(userId?: string): ShareRewardRecord[] {
    const user = userId || (userService.getCurrentUserIdSync());
    return this.getStoredRewardRecords().filter((r: ShareRewardRecord) => r.userId === user);
  }

  private async incrementBalance(userId: string, amount: number): Promise<UserTokenBalance> {
    const current = await fetchServerBalance(userId);
    const newBalance = current.success && current.balance !== undefined
      ? current.balance + amount
      : 0 + amount;
    const stored = getStorage<UserTokenBalance>("user_token_balance_" + userId, undefined);
    const updated: UserTokenBalance = {
      userId,
      balance: newBalance,
      freeBalance: stored ? stored.freeBalance + amount : amount,
      purchasedBalance: stored ? stored.purchasedBalance : 0,
      updatedAt: new Date().toISOString(),
    };
    setStorage("user_token_balance_" + userId, updated);
    return updated;
  }

  private getStoredShares(): ShareRecord[] {
    return getStorage<ShareRecord[]>(SHARE_RECORDS_KEY, []) ?? [];
  }

  private setStoredShares(records: ShareRecord[]): void {
    setStorage(SHARE_RECORDS_KEY, records);
  }

  private getShareRecord(id: string): ShareRecord | undefined {
    return this.getStoredShares().find((r) => r.id === id);
  }

  private getStoredRewardRecords(): ShareRewardRecord[] {
    return getStorage<ShareRewardRecord[]>(SHARE_REWARD_RECORDS_KEY, []) ?? [];
  }

  private setStoredRewardRecords(records: ShareRewardRecord[]): void {
    setStorage(SHARE_REWARD_RECORDS_KEY, records);
  }
}

export const shareRewardService = new ShareRewardService();
export default shareRewardService;