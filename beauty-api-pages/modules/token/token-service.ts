import type { Env } from '../../functions/types';
import type { ConsumeTokenInput, TokenTransactionRecord, TokenType } from './types';

const INITIAL_BALANCE = 0;

export class TokenService {
  constructor(private db: Env["D1_DB"]) {
    this.ensureTables();
  }

  private async ensureTables(): Promise<void> {
    try {
      await this.db
        .prepare(
          "CREATE TABLE IF NOT EXISTS user_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE, balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)"
        )
        .run();
      await this.db
        .prepare(
          "CREATE TABLE IF NOT EXISTS token_transactions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('add', 'consume')), description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)"
        )
        .run();
      await this.db
        .prepare("CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id)")
        .run();
      await this.db
        .prepare("CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id)")
        .run();
      await this.db
        .prepare("CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC)")
        .run();
    } catch (e) {
      console.error("[TokenService.ensureTables] Error:", e);
    }
  }

  async getBalance(userId: string): Promise<number> {
    const row = await this.db
      .prepare("SELECT balance FROM user_tokens WHERE user_id = ?")
      .bind(userId)
      .first<{ balance: number }>();
    if (row) return row.balance;
    const now = new Date().toISOString();
    await this.db
      .prepare("INSERT INTO user_tokens (user_id, balance, updated_at) VALUES (?, ?, ?)")
      .bind(userId, INITIAL_BALANCE, now)
      .run();
    return INITIAL_BALANCE;
  }

  async consume(input: ConsumeTokenInput): Promise<number> {
    const { userId, amount, description } = input;
    const currentBalance = await this.getBalance(userId);
    if (currentBalance < amount) {
      throw new Error("Insufficient tokens. Required: " + amount + ", balance: " + currentBalance);
    }
    const newBalance = currentBalance - amount;
    await this.db
      .prepare("UPDATE user_tokens SET balance = balance - ?, updated_at = ? WHERE user_id = ?")
      .bind(amount, new Date().toISOString(), userId)
      .run();
    await this.createTransaction(userId, -amount, "consume", description);
    return newBalance;
  }

  async add(userId: string, amount: number, description: string = "Token added"): Promise<number> {
    const newBalance = await this.getBalance(userId);
    const updatedBalance = newBalance + amount;
    await this.db
      .prepare("UPDATE user_tokens SET balance = balance + ?, updated_at = ? WHERE user_id = ?")
      .bind(amount, new Date().toISOString(), userId)
      .run();
    await this.createTransaction(userId, amount, "add", description);
    return updatedBalance;
  }

  async getTransactions(userId: string, limit: number = 20): Promise<TokenTransactionRecord[]> {
    const rows = await this.db
      .prepare("SELECT id, user_id, amount, type, description, created_at FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
      .bind(userId, limit)
      .all<TokenTransactionRecord>();
    return rows.results ?? [];
  }

  private async createTransaction(
    userId: string,
    amount: number,
    type: TokenType,
    description: string
  ): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db
      .prepare("INSERT INTO token_transactions (id, user_id, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, userId, amount, type, description, now)
      .run();
  }
}
