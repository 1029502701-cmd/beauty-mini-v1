/** Session stored in KV */
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

/** Token validity: 30 days */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_KEY_PREFIX = "session:";

/** Generate a cryptographically random session token */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/** Build the KV key for a session */
function sessionKey(sessionId: string): string {
  return SESSION_KEY_PREFIX + sessionId;
}

export class SessionService {
  constructor(private kv: KVNamespace) {}

  /**
   * Create a new session for a guest user.
   * Returns the sessionId and full session record.
   */
  async createGuestSession(guestId: string, userId: string): Promise<SessionRecord> {
    const sessionId = generateSessionToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const record: SessionRecord = {
      sessionId,
      userId,
      guestId,
      wechatOpenId: null,
      isGuest: true,
      createdAt: now,
      expiresAt,
      lastActiveAt: now,
    };
    await this.kv.put(sessionKey(sessionId), JSON.stringify(record), {
      expirationTtl: Math.floor(SESSION_TTL_MS / 1000) + 60,
    });
    return record;
  }

  /**
   * Create a new session bound to a WeChat openid.
   * Merges any existing guest session data if guestId is provided.
   */
  async createAuthSession(
    userId: string,
    wechatOpenId: string,
    guestId?: string | null,
  ): Promise<SessionRecord> {
    const sessionId = generateSessionToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const record: SessionRecord = {
      sessionId,
      userId,
      guestId: guestId || null,
      wechatOpenId,
      isGuest: false,
      createdAt: now,
      expiresAt,
      lastActiveAt: now,
    };
    await this.kv.put(sessionKey(sessionId), JSON.stringify(record), {
      expirationTtl: Math.floor(SESSION_TTL_MS / 1000) + 60,
    });
    return record;
  }

  /**
   * Validate a sessionId and return the session record.
   * Returns null if invalid or expired.
   */
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
      // Refresh expiry on each valid use
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

  /**
   * Look up session by wechatOpenId (for guest merge during bind).
   */
  async findByOpenId(openId: string): Promise<SessionRecord | null> {
    const sessionId = await this.kv.get("openid:" + openId);
    if (!sessionId) return null;
    return this.validate(sessionId);
  }

  /**
   * Update session: replace openId, mark as non-guest, preserve guestId.
   */
  async updateToWechatSession(
    sessionId: string,
    userId: string,
    wechatOpenId: string,
  ): Promise<SessionRecord | null> {
    const record = await this.validate(sessionId);
    if (!record) return null;
    const updated: SessionRecord = {
      ...record,
      userId,
      wechatOpenId,
      isGuest: false,
      lastActiveAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
    await this.kv.put(sessionKey(sessionId), JSON.stringify(updated), {
      expirationTtl: Math.floor(SESSION_TTL_MS / 1000) + 60,
    });
    // Index by openId
    await this.kv.put("openid:" + wechatOpenId, sessionId, {
      expirationTtl: Math.floor(SESSION_TTL_MS / 1000) + 60,
    });
    return updated;
  }

  /**
   * Destroy a session (logout).
   */
  async destroy(sessionId: string): Promise<void> {
    await this.kv.delete(sessionKey(sessionId));
  }
}

/** Extract sessionId from Authorization header or custom X-Session-Id header */
export function extractSessionId(request: Request): string {
  const authHeader = request.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return request.headers.get("X-Session-Id") || "";
}

/** Extract userId from sessionId. Returns null if session is invalid. */
export async function resolveUserId(
  request: Request,
  sessionService: SessionService,
): Promise<{ userId: string; isGuest: boolean; guestId?: string | null } | null> {
  const sessionId = extractSessionId(request);
  if (!sessionId) return null;
  const session = await sessionService.validate(sessionId);
  if (!session) return null;
  return {
    userId: session.userId,
    isGuest: session.isGuest,
    guestId: session.guestId,
  };
}
