export interface Env {
  D1_DB: D1Database;
  USER_CACHE: KVNamespace;
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
  IMAGE_BUCKET?: R2Bucket;
  ENVIRONMENT?: string;
  TOKEN_ADMIN_SECRET?: string;
  DEV_MODE?: string;
}