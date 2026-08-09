/**
 * Session stored in KV */
export interface SessionRecord {
  sessionId: string;
  userId: string;
  guestId?: string | null;
  wechatOpenId?: string | null;
  isGuest: boolean;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_KEY_PREFIX = "session:";

function generateSessionToken(): string {
  return crypto.randomUUID();
}

function sessionKey(sessionId: string): string {
  return SESSION_KEY_PREFIX + sessionId;
}

export class SessionService {
  constructor(private kv: KVNamespace) {}

  async createGuestSession(guestId: string, userId: string): Promise<SessionRecord> {
    const sessionId = generateSessionToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const record: SessionRecord = {
      sessionId, userId, guestId, wechatOpenId: null,
      isGuest: true, createdAt: now, expiresAt, lastActiveAt: now,
    };
    await this.kv.put(sessionKey(sessionId), JSON.stringify(record), {
      expirationTtl: Math.floor(SESSION_TTL_MS / 1000) + 60,
    });
    return record;
  }

  async validate(sessionId: string): Promise<SessionRecord | null> {
    if (!sessionId) return null;
    const raw = await this.kv.get(sessionKey(sessionId));
    if (!raw) return null;
    try {
      const record: SessionRecord = JSON.parse(raw);
      if (new Date(record.expiresAt) < new Date()) {
        await this.kv.delete(sessionKey(sessionId));
        return null;
      }
      record.lastActiveAt = new Date().toISOString();
      record.expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
      await this.kv.put(sessionKey(sessionId), JSON.stringify(record), {
        expirationTtl: Math.floor(SESSION_TTL_MS / 1000) + 60,
      });
      return record;
    } catch {
      return null;
    }
  }
}

export function extractSessionId(request: Request): string {
  return request.headers.get("X-Session-Id") || "";
}