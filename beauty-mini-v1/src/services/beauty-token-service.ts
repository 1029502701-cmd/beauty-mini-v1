/**
 * Token Business Service - Manages token exchange workflow for report generation
 * Balance checks use server API as source of truth.
 * Token consumption goes through server API (TokenService -> D1).
 */
import type { ReportLevel } from '@/types/report-level';
import reportConfigService from './report-config-service';
import { fetchServerBalance, consumeServerTokens } from './token';

const TXN_KEY = 'beauty_token_transactions';

function getStoredTransactions(): any[] {
  try {
    const data = wx.getStorageSync(TXN_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStoredTransactions(transactions: any[]): void {
  try {
    wx.setStorageSync(TXN_KEY, JSON.stringify(transactions));
  } catch {}
}

class BeautyTokenService {
  /**
   * Check balance via SERVER API (source of truth).
   */
  async checkBalance(userId: string, level: string): Promise<any> {
    const config = reportConfigService.getLevelConfig(level);
    if (!config) {
      return { success: false, message: '报告等级不存在或已禁用', balance: 0, tokenCost: 0 };
    }
    if (!config.enabled) {
      return { success: false, message: '报告等级已停用，请联系管理员', balance: 0, tokenCost: 0 };
    }
    const tokenCost = config.tokenCost;
    if (tokenCost === 0) {
      return { success: true, message: '报告免费可用', balance: 0, tokenCost: 0, level };
    }
    // Use server balance as source of truth
    const balanceResult = await fetchServerBalance(userId);
    if (!balanceResult.success || balanceResult.balance === undefined) {
      return { success: false, message: balanceResult.error || '获取余额失败', balance: 0, tokenCost };
    }
    const serverBalance = balanceResult.balance;
    if (serverBalance >= tokenCost) {
      return { success: true, message: '余额充足，可兑换报告', balance: serverBalance, tokenCost, level };
    } else {
      return { success: false, message: 'Token不足：需要' + tokenCost + '个，当前只有' + serverBalance + '个', balance: serverBalance, tokenCost };
    }
  }

  /**
   * Consume tokens via SERVER API (TokenService -> D1).
   */
  async consumeToken(userId: string, level: string, amount?: number): Promise<any> {
    const config = reportConfigService.getLevelConfig(level);
    if (!config) {
      return { success: false, message: '报告等级不存在', balanceAfter: 0 };
    }
    const consumeAmount = amount || config.tokenCost;
    if (consumeAmount <= 0) {
      return { success: true, message: '免费报告，无需扣除', balanceAfter: 0 };
    }
    const consumeResult = await consumeServerTokens(consumeAmount, 'Report generation: ' + level);
    if (!consumeResult.success) {
      return { success: false, message: consumeResult.error || 'Token扣除失败', balanceAfter: 0 };
    }
    return { success: true, message: '成功消耗' + consumeAmount + '个Token', balanceAfter: consumeResult.balance };
  }

  createTransaction(params: any): any {
    const transaction = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      reportLevel: params.reportLevel,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      status: params.status || 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderId: params.orderId,
      requestId: params.requestId
    };
    try {
      const transactions = getStoredTransactions();
      transactions.push(transaction);
      setStoredTransactions(transactions);
    } catch {}
    return { success: true, message: '交易记录创建成功', transaction };
  }

  async exchangeTokenForReport(userId: string, level: string, requestId: string): Promise<any> {
    const balanceCheck = await this.checkBalance(userId, level);
    if (!balanceCheck.success) {
      return { success: false, message: balanceCheck.message, transaction: undefined, reportId: undefined };
    }
    const tokenCost = balanceCheck.tokenCost;
    const balanceBefore = balanceCheck.balance;
    const consumeResult = await this.consumeToken(userId, level, tokenCost);
    if (!consumeResult.success) {
      return { success: false, message: consumeResult.message, transaction: undefined, reportId: undefined };
    }
    const txResult = this.createTransaction({
      userId, type: 'exchange', amount: -tokenCost, reportLevel: level,
      balanceBefore, balanceAfter: consumeResult.balanceAfter, status: 'completed', requestId
    });
    if (!txResult.success) {
      return { success: false, message: '交易记录创建失败', transaction: undefined, reportId: undefined };
    }
    return { success: true, message: '成功兑换报告等级', transaction: txResult.transaction, reportId: 'report_' + Date.now() };
  }

  getTransactionHistory(userId: string, level?: string, status?: string): any[] {
    const transactions = getStoredTransactions();
    let filtered = transactions.filter((t: any) => t.userId === userId);
    if (level) filtered = filtered.filter((t: any) => t.reportLevel === level);
    if (status) filtered = filtered.filter((t: any) => t.status === status);
    return filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

const beautyTokenService = new BeautyTokenService();
export default beautyTokenService;
