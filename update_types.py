path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\types\admin.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add unlockStatus and analysisContent to BeautyReport
content = content.replace(
    '  status: "completed" | "failed";\n}',
    '  status: "completed" | "failed";\n  unlockStatus: "free" | "locked" | "unlocked";\n  analysisContent?: string;\n}',
    1
)

# 2. Add matchTags to Creator
content = content.replace(
    '  totalCollaborations: number;\n  createdAt: string;\n}\n\nexport type CreatorFilter',
    '  totalCollaborations: number;\n  createdAt: string;\n  matchTags: string[];\n}\n\nexport type CreatorFilter',
    1
)

# 3. Add recommendedTags to Product
content = content.replace(
    '  updatedAt: string;\n}\n\n// ==================== CONTENT',
    '  updatedAt: string;\n  recommendedTags: string[];\n}\n\n// ==================== CONTENT',
    1
)

# 4. Add OperationLog types before SETTINGS
content = content.replace(
    '// ==================== SETTINGS ====================\n\nexport interface SystemSettings',
    '''// ==================== OPERATION LOG ====================

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

export interface SystemSettings''',
    1
)

# 5. Add logs to super_admin permissions
content = content.replace(
    '{ resource: "settings", actions: ["view", "edit"] },\n  ],\n  operator: [',
    '{ resource: "settings", actions: ["view", "edit"] },\n    { resource: "logs", actions: ["view", "export"] },\n  ],\n  operator: [',
    1
)

# 6. Add logs to operator permissions
content = content.replace(
    '{ resource: "settings", actions: [] },\n  ],\n};',
    '{ resource: "settings", actions: [] },\n    { resource: "logs", actions: ["view"] },\n  ],\n};',
    1
)

# 7. Add logs menu item
content = content.replace(
    '{ label: "系统设置", path: "/admin/settings", icon: "⚙️", resource: "settings" as const },\n] as const;',
    '{ label: "系统设置", path: "/admin/settings", icon: "⚙️", resource: "settings" as const },\n  { label: "操作日志", path: "/admin/logs", icon: "📋", resource: "logs" as const },\n] as const;',
    1
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done, length:", len(content))
