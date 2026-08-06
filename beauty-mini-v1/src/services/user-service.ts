import type { BeautyUserProfile, GuestSession } from "@/types/beauty";
import { getStorage, setStorage, removeStorage, isWeChatMiniProgram } from "@/utils/storage";
import wechatAuthService from "./wechat-auth";

/** Session token stored in storage (set by wechat-login server response) */
const SESSION_ID_KEY = "sessionId";

class UserService {
  private readonly STORAGE_KEY = "beauty_user_session";

  /**
   * Initialize user on app start:
   * 1. Check local session (wechat + guest combined)
   * 2. If no session, create guest
   * 3. Ensure a server-side KV session exists for authenticated API calls
   * 4. Guest users can use the app without logging in
   */
  async initializeGuestUser(): Promise<BeautyUserProfile> {
    console.log("[UserService] initializeGuestUser START");
    const stored = this.getStoredSession();
    console.log("[UserService] stored session:", !!stored, stored ? "guestId=" + stored.guestId : "null");
    if (stored) {
      await this.updateLastActive(stored.guestId);
      // Ensure server session exists (create if missing)
      console.log("[UserService] calling tryRestoreServerSession");
      await this.tryRestoreServerSession(stored);
      return this.mapToUserProfile(stored);
    }
    // No session exists — create guest user
    const session = this.createGuestUser();
    console.log("[UserService] created guest:", session.guestId, session.userId);
    // Create server session so uploads and API calls are authenticated
    if (isWeChatMiniProgram()) {
      try {
        const loginResult = await wechatAuthService.performServerLogin(session.userId, session.guestId);
        console.log("[UserService] performServerLogin result:", loginResult.success, loginResult.sessionId ? "sid=" + loginResult.sessionId.slice(0,8) + "..." : "none", loginResult.error);
      } catch (e) {
        console.warn("[UserService] Server session creation failed (non-fatal):", e);
      }
    }
    return this.mapToUserProfile(session);
  }

  async getCurrentUser(): Promise<BeautyUserProfile> {
    const stored = this.getStoredSession();
    console.log("[UserService] stored session:", !!stored, stored ? "guestId=" + stored.guestId : "null");
    if (stored) {
      await this.updateLastActive(stored.guestId);
      return this.mapToUserProfile(stored);
    }
    return this.createGuestUser().then(s => this.mapToUserProfile(s));
  }

  /**
   * Ensure a server-side session exists. Creates one if missing.
   */
  private async tryRestoreServerSession(session: GuestSession): Promise<void> {
    const existingSid = getStorage<string>(SESSION_ID_KEY, null);
    if (existingSid) return;
    if (!isWeChatMiniProgram()) return;
    try {
      await wechatAuthService.performServerLogin(session.userId, session.guestId);
    } catch (e) {
      console.warn("[UserService] Server session restoration failed (non-fatal):", e);
    }
  }
  /**
   * Perform WeChat login and bind to current guest user.
   * Returns the updated profile, or the existing guest profile if login fails.
   */
  async bindWechat(): Promise<BeautyUserProfile> {
    if (!isWeChatMiniProgram()) {
      return this.getCurrentUser();
    }
    const stored = this.getStoredSession();
    const guestUserId = stored?.userId;
    const guestId = stored?.guestId;

    const result = await wechatAuthService.performServerLogin(guestUserId, guestId);
    if (!result.success) {
      console.warn("[UserService] WeChat server login failed:", result.error);
      return this.getCurrentUser();
    }

    // Update stored session with wechat info
    if (stored) {
      const updated: GuestSession = {
        ...stored,
        wechatOpenId: result.userId, // Store userId as proxy for openId binding
      };
      setStorage(this.STORAGE_KEY, updated);
      if (result.merged) {
        // Guest user merged
      }
      return this.mapToUserProfile(updated);
    }
    return this.getCurrentUser();
  }

  private createGuestUser(): GuestSession {
    const guestId = this.generateGuestId();
    const userId = "user_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    const session: GuestSession = {
      guestId,
      userId,
      wechatOpenId: null,
      createdAt: now,
      lastActiveAt: now,
    };
    setStorage(this.STORAGE_KEY, session);
    return session;
  }

  private getStoredSession(): GuestSession | null {
    return getStorage<GuestSession>(this.STORAGE_KEY, null);
  }

  private saveSession(session: GuestSession): void {
    setStorage(this.STORAGE_KEY, session);
  }

  private async updateLastActive(guestId: string): Promise<void> {
    const session = this.getStoredSession();
    if (session) {
      session.lastActiveAt = new Date().toISOString();
      setStorage(this.STORAGE_KEY, session);
    }
  }

  private generateGuestId(): string {
    return "guest_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  }

  private mapToUserProfile(session: GuestSession): BeautyUserProfile {
    return {
      userId: session.userId,
      guestId: session.guestId,
      wechatOpenId: session.wechatOpenId,
      nickname: null,
      avatarUrl: null,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
    };
  }

  getCurrentUserId(): string {
    const user = this.getCurrentUserInternal();
    return user ? user.userId : "dummy_guest_user";
  }

  getGuestId(): string | null {
    const session = this.getStoredSession();
    return session ? session.guestId : null;
  }

  getCurrentUserIdSync(): string {
    const session = this.getStoredSession();
    return session ? session.userId : "dummy_guest_user";
  }

  private getCurrentUserInternal(): BeautyUserProfile | null {
    const session = this.getStoredSession();
    if (!session) return null;
    return this.mapToUserProfile(session);
  }

  /**
   * Get the current server session ID to attach to API requests.
   */
  getServerSessionId(): string | null {
    return getStorage<string>(SESSION_ID_KEY, null);
  }

  /**
   * Store server session ID after successful wechat login.
   */
  setServerSessionId(sessionId: string): void {
    setStorage(SESSION_ID_KEY, sessionId);
  }

  logout(): void {
    removeStorage(this.STORAGE_KEY);
    removeStorage(SESSION_ID_KEY);
    wechatAuthService.clearLoginState();
  }

  isGuest(): boolean {
    const session = this.getStoredSession();
    return !!session && !session.wechatOpenId;
  }

  isWechatBound(): boolean {
    const session = this.getStoredSession();
    return !!session && !!session.wechatOpenId;
  }
}

const userService = new UserService();
export default userService;
export { userService };
