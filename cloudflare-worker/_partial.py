import { AnalyzeRequest, AnalyzeResponse } from './api/analyze';
import { UploadResponse } from './api/upload';
import { getProfile } from './api/profile';
import { ProductsResponse } from './api/products';
import { applyCreator } from './api/creator/apply';
import { getApprovedCreators } from './api/creators';
import reportRepository from '../lib/reportRepository';
import beautyReportGenerator from '../lib/reportGenerator';
import { SessionService, extractSessionId, resolveUserId } from '../lib/session';
import { wechatLogin } from './api/wechat-login';
import { getDashboardStats } from './api/admin/dashboard';
import { getUsers, getUserDetail, updateUserStatus } from './api/admin/users';
import { getReports, getReportDetail, deleteReport, unlockReport } from './api/admin/reports';
import { getTasks, retryTask } from './api/admin/tasks';
import { getCreators, updateCreator } from './api/admin/creators';
import { getProducts, getProductDetail, updateProduct, updateProductTags } from './api/admin/products';
import { getContent, updateContentStatus } from './api/admin/content';
import { getTokenPackages, getTokenOrders, updatePackageStatus, updatePackage } from './api/admin/tokens';
import { getSettings, updateSettings } from './api/admin/settings';
import { getOperationLogs, createOperationLog } from './api/admin/operation-logs';
import { createProvider } from './api/validate-image';
import { handleCreateAnalysisTask, handleGetAnalysisTask, updateTaskStatus } from './api/beauty/analysis-task';
import { handleProcessAnalysisTasks, handleAnalysisTaskStats, AnalysisTaskWorker } from '../services/tasks/AnalysisTaskWorker';

// ---- Security helpers ----
function safeError(msg: string, code?: string): Record<string, unknown> {
  const out: Record<string, unknown> = { status: "error", message: msg };
  if (code) out["code"] = code;
  return out;
}
function logSecurity(event: string, detail?: string): void {
  const safeDetail = detail
    ? detail.replace(/[^a-zA-Z0-9一-鿿/ _-]/g, "").slice(0, 80)
    : undefined;
  console.log("[security] " + event + (safeDetail ? " detail=" + safeDetail : ""));
}