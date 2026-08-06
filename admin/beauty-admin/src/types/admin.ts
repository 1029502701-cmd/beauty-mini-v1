export type AdminRole = "super_admin" | "operator";

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
  createdAt: string;
}

export interface DashboardStats {
  users: {
    total: number;
    todayNew: number;
  };
  ai: {
    totalAnalyses: number;
    successfulReports: number;
    failedTasks: number;
  };
  commerce: {
    tokenConsumed: number;
    beautyProCount: number;
  };
  recommendations: {
    productRecommendations: number;
    creatorRecommendations: number;
  };
  orders: {
    total: number;
    paid: number;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== USER ====================

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  sessionCount: number;
  totalAnalyses: number;
  totalReports: number;
  beautyPro: boolean;
  createdAt: string;
  lastActiveAt: string;
  status: "active" | "inactive" | "banned";
}

export type UserFilter = {
  keyword?: string;
  status?: User["status"];
  beautyPro?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ==================== BEAUTY REPORT ====================

export interface BeautyReport {
  id: string;
  userId: string;
  userNickname: string;
  imageUrl: string;
  faceShape: string;
  eyeShape: string;
  skinTone: string;
  overallScore: number;
  level: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  status: "completed" | "failed";
  unlockStatus: "free" | "locked" | "unlocked";
  analysisContent?: string;
}

export type ReportFilter = {
  keyword?: string;
  level?: BeautyReport["level"];
  status?: BeautyReport["status"];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ==================== AI TASK ====================

export interface AiTask {
  id: string;
  userId: string;
  userNickname: string;
  type: "analysis" | "recommendation";
  status: "pending" | "running" | "completed" | "failed";
  inputUrl: string;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  tokenCost: number;
}

export type TaskFilter = {
  keyword?: string;
  status?: AiTask["status"];
  type?: AiTask["type"];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ==================== CREATOR ====================

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  platform: "小红书" | "抖音" | "B站" | "微博" | "其他";
  followers: number;
  category: string;
  bio: string;
  contactWechat: string;
  contactEmail: string;
  contactPhone: string;
  cooperationStatus: "pending" | "active" | "inactive" | "blacklisted";
  totalCollaborations: number;
  createdAt: string;
  matchTags: string[];
}

export type CreatorFilter = {
  keyword?: string;
  platform?: Creator["platform"];
  category?: string;
  cooperationStatus?: Creator["cooperationStatus"];
  page?: number;
  pageSize?: number;
};

// ==================== PRODUCT ====================

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  platform: string;
  affiliateLink: string;
  stock: number;
  status: "active" | "inactive" | "sold_out";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  recommendedTags: string[];
}

export type ProductFilter = {
  keyword?: string;
  category?: string;
  platform?: string;
  status?: Product["status"];
  featured?: boolean;
  page?: number;
  pageSize?: number;
};

// ==================== CONTENT ====================

export interface ContentItem {
  id: string;
  title: string;
  type: "article" | "video" | "image" | "carousel";
  thumbnail: string;
  url: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export type ContentFilter = {
  keyword?: string;
  type?: ContentItem["type"];
  status?: ContentItem["status"];
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ==================== TOKEN ====================

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  discountRate: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface TokenOrder {
  id: string;
  userId: string;
  userNickname: string;
  packageId: string;
  packageName: string;
  tokenAmount: number;
  amount: number;
  status: "pending" | "paid" | "refunded" | "failed";
  paidAt?: string;
  createdAt: string;
}

export type TokenOrderFilter = {
  keyword?: string;
  status?: TokenOrder["status"];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ==================== OPERATION LOG ====================

export type OperationLogActionType =
  | "report_unlock"
  | "creator_review"
  | "creator_toggle"
  | "product_toggle"
  | "product_tag_update"
  | "package_edit"
  | "package_toggle"
  | "user_status_change";

export interface AdminOperationLog {
  id: string;
  adminId: string;
  adminName: string;
  actionType: OperationLogActionType;
  targetType: string;
  targetId: string;
  targetName: string;
  detail?: string;
  createdAt: string;
}

export type OperationLogFilter = {
  keyword?: string;
  actionType?: OperationLogActionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

// ==================== SETTINGS ====================

export interface SystemSettings {
  aiAnalysis: {
    provider: string;
    model: string;
    enabled: boolean;
    maxConcurrency: number;
    timeoutMs: number;
  };
  beautyPro: {
    enabled: boolean;
    trialDays: number;
    price: number;
    features: string[];
  };
  tokenPackage: {
    defaultPackageId: string;
    autoRenewal: boolean;
    priceAdjustmentRatio: number;
  };
  notification: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    wechatEnabled: boolean;
  };
  platform: {
    wechatAppId: string;
    wechatAppSecret: string;
    domain: string;
    copyright: string;
  };
}


// ==================== D1 RECORD TYPES ====================

/** Raw D1 row shape for beauty_reports */
export interface BeautyReportRecord {
  id: string;
  user_id: string;
  image_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  level: string;
  status: "pending" | "processing" | "completed" | "failed";
  face_metrics_json: string;
  analysis_json: string;
  analysis_version: string;
  created_at: string;
  expire_at: string | null;
}

/** Raw D1 row shape for beauty_tasks */
export interface AITaskRecord {
  id: string;
  user_id: string;
  report_id: string | null;
  status: "pending" | "analyzing" | "completed" | "failed";
  result_json: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Raw D1 row shape for beauty_creators */
export interface CreatorRecord {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  platform: string;
  description: string | null;
  style_tags: string;
  works: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

/** Raw D1 row shape for beauty_orders */
export interface OrderRecord {
  id: string;
  user_id: string;
  report_id: string | null;
  product_type: "report_unlock" | "beauty_pro";
  amount: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
  updated_at: string;
}

/** Admin-side product entity (admin-managed catalog) */
export interface ProductRecord {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  original_price: number | null;
  image_url: string;
  description: string;
  platform: string;
  affiliate_link: string;
  stock: number;
  status: "active" | "inactive" | "sold_out";
  featured: boolean;
  created_at: string;
  updated_at: string;
}

/** Admin-side token package entity */
export interface TokenPackageRecord {
  id: string;
  name: string;
  tokens: number;
  price: number;
  discount_rate: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}
// ==================== PERMISSIONS ====================

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export" | "manage";

export interface AdminPermission {
  resource: string;
  actions: PermissionAction[];
}

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    { resource: "users", actions: ["view", "create", "edit", "delete", "export", "manage"] },
    { resource: "reports", actions: ["view", "create", "edit", "delete", "export"] },
    { resource: "tasks", actions: ["view", "create", "edit", "delete", "export"] },
    { resource: "creators", actions: ["view", "create", "edit", "delete", "export", "manage"] },
    { resource: "products", actions: ["view", "create", "edit", "delete", "export", "manage"] },
    { resource: "content", actions: ["view", "create", "edit", "delete", "export", "manage"] },
    { resource: "tokens", actions: ["view", "create", "edit", "delete", "export"] },
    { resource: "settings", actions: ["view", "edit"] },
    { resource: "logs", actions: ["view", "export"] },
  ],
  operator: [
    { resource: "users", actions: ["view", "edit"] },
    { resource: "reports", actions: ["view"] },
    { resource: "tasks", actions: ["view"] },
    { resource: "creators", actions: ["view", "create", "edit"] },
    { resource: "products", actions: ["view", "create", "edit"] },
    { resource: "content", actions: ["view", "create", "edit"] },
    { resource: "tokens", actions: ["view"] },
    { resource: "settings", actions: [] },
    { resource: "logs", actions: ["view"] },
  ],
};

export const ADMIN_MENU_CONFIG = [
  { label: "运营概览", path: "/admin/dashboard", icon: "📊", resource: "dashboard" as const },
  { label: "用户管理", path: "/admin/users", icon: "👤", resource: "users" as const },
  { label: "美妆报告", path: "/admin/reports", icon: "📝", resource: "reports" as const },
  { label: "AI分析任务", path: "/admin/tasks", icon: "🤖", resource: "tasks" as const },
  { label: "达人管理", path: "/admin/creators", icon: "⭐", resource: "creators" as const },
  { label: "产品推荐", path: "/admin/products", icon: "🛍️", resource: "products" as const },
  { label: "内容管理", path: "/admin/content", icon: "📄", resource: "content" as const },
  { label: "Token / 订单", path: "/admin/tokens", icon: "🪙", resource: "tokens" as const },
  { label: "系统设置", path: "/admin/settings", icon: "⚙️", resource: "settings" as const },
  { label: "操作日志", path: "/admin/logs", icon: "📋", resource: "logs" as const },
] as const;

export type MenuResource = (typeof ADMIN_MENU_CONFIG)[number]["resource"];
