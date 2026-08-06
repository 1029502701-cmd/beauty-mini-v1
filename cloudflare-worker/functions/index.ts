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
    ? detail.replace(/[^a-zA-Z0-9\u4e00-\u9fff/ _-]/g, "").slice(0, 80)
    : undefined;
  console.log("[security] " + event + (safeDetail ? " detail=" + safeDetail : ""));
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const sessionService = new SessionService(env.USER_CACHE);
    let userId = '';
    let isGuest = true;
    let rawGuestId: string | null = null;
    const sessionId = extractSessionId(request);
    if (sessionId) {
      const resolved = await resolveUserId(request, sessionService);
      if (resolved) {
        userId = resolved.userId;
        isGuest = resolved.isGuest;
        rawGuestId = resolved.guestId || null;
      }
    }
    if (!userId) {
      userId = 'guest_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }
    const repo = new reportRepository(env.D1_DB);

    // ---- WeChat Login ----
    if (url.pathname === '/api/wechat/login' && request.method === 'POST') {
      console.log('[wechat-login] received request');
      try {
        const body = await request.json() as { code: string; guestUserId?: string; guestId?: string; sessionId?: string };
        const result = await wechatLogin(body, env, sessionService);
        return result;
      } catch (error) {
        logSecurity('WECHAT_LOGIN_ERROR');
        console.error('[wechat-login] Error:', error);
        return new Response(
          JSON.stringify({ status: 'error', isGuest: false, message: '微信登录失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ---- POST /api/analyze ----
    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      try {
        const data: AnalyzeRequest = await request.json();
        if (!data?.uploadId) {
          return new Response(JSON.stringify(safeError('缺少 uploadId 参数', 'MISSING_PARAM')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(data.uploadId)) {
          return new Response(JSON.stringify(safeError('uploadId 格式无效', 'INVALID_UPLOAD_ID')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        const validateRes = await createProvider(env).detectFaces(
          await env.IMAGE_BUCKET.get(data.uploadId)?.arrayBuffer() ?? new ArrayBuffer(0)
        );
        if (!validateRes.valid) {
          return new Response(
            JSON.stringify({ status: 'error', message: validateRes.message || 'Image validation failed' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (validateRes.faceCount === 0) {
          return new Response(
            JSON.stringify({ status: 'error', message: 'No face detected in image. Please upload a portrait photo.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (validateRes.faceCount > 1) {
          return new Response(
            JSON.stringify({ status: 'error', message: 'Multiple faces detected. Please upload a photo with a single face.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const reportId = 'report_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const reportCode = 'BM' + new Date().toISOString().slice(0, 10) + String(Math.floor(Math.random() * 1000)).padStart(4, '0');
        await env.D1_DB.prepare(
          'INSERT INTO beauty_tasks (id, user_id, report_id, status, created_at) VALUES (?, ?, ?, ?, ?)'
        ).execute([reportId, userId, reportId, 'analyzing', new Date().toISOString()]);
        const imageUrl = data.imageUrl || '';
        let inputFaceMetrics = data.faceMetrics;
        if (!inputFaceMetrics && imageUrl) {
          const h = imageUrl.split('').reduce((a: number, b: string) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
          const shapes = ['椭圆脸', '圆脸', '方脸', '长脸', '心形脸'];
          const eyes = ['单眼皮', '双眼皮', '内双', '眼袋/肿眼'];
          const jaws = ['标准颌型', '偏小颌', '宽颌'];
          const tones = ['黄皮', '白皮', '黑皮'];
          const ratioBase = 0.72 + (Math.abs(h) % 20) / 100;
          inputFaceMetrics = {
            faceShape: shapes[Math.abs(h) % shapes.length],
            faceRatio: parseFloat(ratioBase.toFixed(2)),
            eyeType: eyes[Math.abs(h >> 4) % eyes.length],
            eyeSize: 30 + (Math.abs(h >> 8) % 20),
            noseRatio: parseFloat((0.35 + (Math.abs(h >> 12) % 10) / 100).toFixed(2)),
            lipRatio: parseFloat((0.28 + (Math.abs(h >> 16) % 8) / 100).toFixed(2)),
            jawType: jaws[Math.abs(h >> 20) % jaws.length],
            skinTone: tones[Math.abs(h >> 24) % tones.length],
          };
        }
        const levelMap: Record<string, number> = { 'first-look': 7, 'style-upgrade': 15, 'beauty-pro': 30 };
        const level = (data.reportLevel as string) || 'first-look';
        const expireDays = levelMap[level] || 7;
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + expireDays);
        const faceMetrics = JSON.stringify(inputFaceMetrics || {});
        const levelConfig: Record<string, any> = {
          'first-look': { include: ['face_analysis', 'makeup_suggestion'], level: 'beginner' },
          'style-upgrade': { include: ['face_analysis', 'makeup_suggestion', 'color_analysis'], level: 'intermediate' },
          'beauty-pro': { include: ['face_analysis', 'makeup_suggestion', 'color_analysis', 'product_recommendation', 'creator_recommendation'], level: 'advanced' },
        };
        const config = levelConfig[level] || levelConfig['first-look'];
        const reportData = await beautyReportGenerator.generateReport({
          faceMetrics: inputFaceMetrics,
          config,
          stylePreferences: data.stylePreferences,
        });
        const analysisJson = JSON.stringify({
          content: reportData,
          unlockStatus: level === 'first-look' ? 'free' : 'locked',
          levelConfig: config,
        });
        const imageId = data.uploadId;
        await env.D1_DB.prepare(`
          INSERT INTO beauty_reports (id, user_id, image_id, level, status, face_metrics_json, analysis_json, created_at, expire_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).execute([
          reportId, userId, imageId, config.level, 'completed',
          faceMetrics, analysisJson, new Date().toISOString(),
          expireDate.toISOString(),
        ]);
        await env.D1_DB.prepare(
          'UPDATE users SET total_reports = total_reports + 1, total_analyses = total_analyses + 1, last_active_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).execute([userId]);
        await env.D1_DB.prepare(
          'UPDATE beauty_tasks SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).execute(['completed', JSON.stringify({ imageUrl, reportId }), reportId]);
        return new Response(JSON.stringify({
          status: 'success',
          reportId,
          reportCode,
          level: config.level,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (error) {
        logSecurity('ANALYZE_ERROR');
        console.error('[analyze] Error:', error);
        return new Response(JSON.stringify(safeError('分析失败')), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- POST /api/validate-image ----
    if (url.pathname === '/api/validate-image' && request.method === 'POST') {
      if (!sessionId) {
        logSecurity('VALIDATE_IMAGE_NO_SESSION');
        return new Response(JSON.stringify({ valid: false, code: 'AUTH_REQUIRED', message: '请先登录' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      try {
        const data = await request.json() as { uploadId?: string };
        if (!data.uploadId) {
          return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Missing uploadId' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(data.uploadId)) {
          return new Response(JSON.stringify({ valid: false, code: 'INVALID_UPLOAD_ID', message: 'Invalid uploadId format' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        const head = await env.IMAGE_BUCKET.head(data.uploadId);
        if (!head || !head.httpMetadata?.contentType?.startsWith('image/')) {
          return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Not a valid image' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        const arrayBuffer = await env.IMAGE_BUCKET.get(data.uploadId)?.arrayBuffer();
        if (!arrayBuffer) {
          return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Image not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }
        if (!env.AI || typeof env.AI.run !== 'function') {
          return new Response(JSON.stringify({ valid: false, faceCount: 0, code: 'AI_SERVICE_UNAVAILABLE', message: 'Face detection service is not available' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        let result;
        try {
          result = await createProvider(env).detectFaces(arrayBuffer);
        } catch (aiError) {
          const msg = aiError instanceof Error ? aiError.message : String(aiError);
          if (msg.includes('not configured') || msg.includes('AI binding') || msg.includes('AI_SERVICE_UNAVAILABLE')) {
            logSecurity('AI_FACE_DETECTION_FAILED');
            return new Response(JSON.stringify({ valid: false, faceCount: 0, code: 'AI_SERVICE_UNAVAILABLE', message: 'Face detection service is not available' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          throw aiError;
        }
        return new Response(JSON.stringify(result), {
          status: result.valid ? 200 : 400,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logSecurity('VALIDATE_IMAGE_ERROR');
        console.error('[validate-image] Error:', error);
        return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Validation failed' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- GET /api/report/:id ----
    if (url.pathname.match(/^\/api\/report\/[^/]+$/) && request.method === 'GET') {
      try {
        const reportId = url.pathname.split('/').pop();
        const report = await repo.findById(reportId);
        if (!report) {
          return new Response(JSON.stringify({ status: 'error', message: '报告不存在' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }
        if (report.userId !== userId) {
          logSecurity('REPORT_ACCESS_DENIED', 'reportId=' + reportId + ' requestedBy=' + userId);
          return new Response(JSON.stringify(safeError('无权访问此报告', 'REPORT_ACCESS_DENIED')), {
            status: 403, headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ status: 'success', report }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logSecurity('REPORT_QUERY_ERROR');
        console.error('[report] Error:', error);
        return new Response(JSON.stringify(safeError('获取报告失败')), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- GET /api/reports ----
    if (url.pathname === '/api/reports' && request.method === 'GET') {
      try {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const reports = await repo.findByUserId(userId, limit, offset);
        return new Response(JSON.stringify({ status: 'success', reports }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logSecurity('REPORTS_LIST_ERROR');
        console.error('[reports] Error:', error);
        return new Response(JSON.stringify(safeError('获取报告列表失败')), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- POST /api/upload ----
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      if (!sessionId) {
        logSecurity('UPLOAD_NO_SESSION');
        console.error('[upload] 401 no sessionId');
        return new Response(JSON.stringify(safeError('请先登录', 'AUTH_REQUIRED')), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      try {
        const formData = await request.formData();
        console.log('[upload] formData keys:', [...formData.keys()]);
        const file = formData.get("file") as File | null;
        console.log('[upload] file:', file ? file.size + 'bytes' : 'MISSING');
        if (!file) {
          return new Response(JSON.stringify(safeError('缺少图片文件', 'MISSING_FILE')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        if (file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify(safeError('图片大小不能超过 10MB', 'FILE_TOO_LARGE')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (!allowedTypes.includes(file.type)) {
          return new Response(JSON.stringify(safeError('仅支持 JPEG/PNG/WebP 格式', 'INVALID_FILE_TYPE')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        const arrayBuffer = await file.arrayBuffer();
        const uploadId = 'upload_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        await env.IMAGE_BUCKET.put(uploadId, arrayBuffer, {
          contentType: file.type,
          httpMetadata: { cacheControl: 'public, max-age=31536000' },
        });
        const presignedUrl = 'https://' + env.IMAGE_BUCKET.name + '.d1.dev/' + uploadId;
        return new Response(JSON.stringify({ status: 'success', uploadId, url: presignedUrl }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logSecurity('UPLOAD_ERROR');
        console.error('[upload] Error:', error);
        return new Response(JSON.stringify(safeError('上传失败')), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- GET /api/profile ----
    if (url.pathname === '/api/profile' && request.method === 'GET') {
      try {
        const profile = await getProfile(env, userId);
        return new Response(JSON.stringify(profile), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logSecurity('PROFILE_ERROR');
        console.error('[profile] Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: '获取用户信息失败' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- GET /api/products ----
    if (url.pathname === '/api/products' && request.method === 'GET') {
      try {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const products = await getApprovedCreators(env, limit);
        return new Response(JSON.stringify({ products }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logSecurity('PRODUCTS_ERROR');
        console.error('[products] Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: '获取产品列表失败' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- POST /api/wechat/bind ----
    if (url.pathname === '/api/wechat/bind' && request.method === 'POST') {
      try {
        const body = await request.json() as { code: string };
        const result = await wechatLogin({ code: body.code, guestUserId: userId, guestId: rawGuestId }, env, sessionService);
        return result;
      } catch (error) {
        logSecurity('WECHAT_BIND_ERROR');
        console.error('[wechat-bind] Error:', error);
        return new Response(
          JSON.stringify({ status: 'error', message: '微信绑定失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ---- POST /api/creator/apply ----
    if (url.pathname === '/api/creator/apply' && request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await applyCreator(body, env, userId);
        return result;
      } catch (error) {
        logSecurity('CREATOR_APPLY_ERROR');
        console.error('[creator-apply] Error:', error);
        return new Response(
          JSON.stringify({ status: 'error', message: '申请失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ---- Admin APIs ----
    if (url.pathname.startsWith('/api/admin')) {
      const adminPath = url.pathname.replace(/^\/api\/admin/, '');
      if (adminPath === '/dashboard' && request.method === 'GET') {
        return await getDashboardStats(env);
      }
      if (adminPath.startsWith('/users')) {
        const userIdMatch = adminPath.match(/^\/users\/([^\/]+)$/);
        if (userIdMatch) {
          if (request.method === 'GET') return await getUserDetail(env, userIdMatch[1]);
          if (request.method === 'PATCH') return await updateUserStatus(env, userIdMatch[1], request);
        }
        if (request.method === 'GET') return await getUsers(env, request);
      }
      if (adminPath.startsWith('/reports')) {
        const unlockMatch = adminPath.match(/^\/reports\/([^\/]+)\/unlock$/);
        if (unlockMatch && request.method === 'PATCH') return await unlockReport(env, unlockMatch[1], request);
        const reportIdMatch = adminPath.match(/^\/reports\/([^\/]+)$/);
        if (reportIdMatch) {
          if (request.method === 'DELETE') return await deleteReport(env, reportIdMatch[1]);
          return await getReportDetail(env, reportIdMatch[1]);
        }
        return await getReports(env, request);
      }
      if (adminPath.startsWith('/tasks')) {
        const taskIdMatch = adminPath.match(/^\/tasks\/([^\/]+)\/retry$/);
        if (taskIdMatch && request.method === 'POST') return await retryTask(env, taskIdMatch[1]);
        return await getTasks(env, request);
      }
      if (adminPath.startsWith('/creators')) {
        const creatorIdMatch = adminPath.match(/^\/creators\/([^\/]+)$/);
        if (creatorIdMatch) {
          if (request.method === 'PATCH') return await updateCreator(env, creatorIdMatch[1], request);
          return await getCreators(env, request);
        }
      }
      if (adminPath.startsWith('/products')) {
        const tagsMatch = adminPath.match(/^\/products\/([^\/]+)\/tags$/);
        if (tagsMatch && request.method === 'PATCH') return await updateProductTags(env, tagsMatch[1], request);
        const productIdMatch = adminPath.match(/^\/products\/([^\/]+)$/);
        if (productIdMatch) {
          if (request.method === 'PATCH') return await updateProduct(env, productIdMatch[1], request);
          return await getProductDetail(env, productIdMatch[1]);
        }
        return await getProducts(env, request);
      }
      if (adminPath.startsWith('/content')) {
        const contentIdMatch = adminPath.match(/^\/content\/([^\/]+)\/status$/);
        if (contentIdMatch && request.method === 'PATCH') return await updateContentStatus(env, contentIdMatch[1], request);
        return await getContent(env, request);
      }
      if (adminPath.startsWith('/tokens')) {
        if (adminPath === '/tokens/packages' && request.method === 'GET') return await getTokenPackages(env, request);
        if (adminPath === '/tokens/orders' && request.method === 'GET') return await getTokenOrders(env, request);
        const pkgStatusMatch = adminPath.match(/^\/tokens\/packages\/([^\/]+)\/status$/);
        if (pkgStatusMatch && request.method === 'PATCH') return await updatePackageStatus(env, pkgStatusMatch[1], request);
        const pkgEditMatch = adminPath.match(/^\/tokens\/packages\/([^\/]+)$/);
        if (pkgEditMatch && request.method === 'PATCH') return await updatePackage(env, pkgEditMatch[1], request);
      }
      if (adminPath === '/operation-logs') {
        if (request.method === 'POST') return await createOperationLog(env, request);
        return await getOperationLogs(env, request);
      }
      if (adminPath === '/settings') {
        if (request.method === 'PATCH') return await updateSettings(env, request);
        return await getSettings(env);
      }
      return new Response(
        JSON.stringify({ success: false, message: 'Admin route not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ---- POST /api/beauty/analysis/task ----
    if (url.pathname === '/api/beauty/analysis/task' && request.method === 'POST') {
      if (!sessionId) {
        logSecurity('ANALYSIS_TASK_NO_SESSION', 'path=/api/beauty/analysis/task');
        return new Response(JSON.stringify(safeError('请先登录', 'AUTH_REQUIRED')), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      const result = await handleCreateAnalysisTask(request, env, userId);
      return result;
    }

    // ---- GET /api/beauty/analysis/task?taskId=xxx ----
    if (url.pathname === '/api/beauty/analysis/task' && request.method === 'GET') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId) {
        return new Response(JSON.stringify(safeError('缺少 taskId 参数', 'MISSING_PARAM')), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!/^[A-Za-z0-9_-]{1,24}$/.test(taskId)) {
        return new Response(JSON.stringify(safeError('taskId 格式无效', 'INVALID_TASK_ID')), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      logSecurity('ANALYSIS_TASK_QUERY_NO_SESSION', 'taskId=' + taskId);
      const result = await handleGetAnalysisTask(taskId, env, userId);
      return result;
    }

    // ---- POST /api/analysis/worker/process ----
    if (url.pathname === '/api/analysis/worker/process' && request.method === 'POST') {
      const result = await handleProcessAnalysisTasks(request, env);
      return result;
    }

    // ---- GET /api/analysis/worker/stats ----
    if (url.pathname === '/api/analysis/worker/stats' && request.method === 'GET') {
      const result = await handleAnalysisTaskStats(request, env);
      return result;
    }

    return new Response('Welcome to AI Beauty Mini API', {
      status: 200, headers: { 'Content-Type': 'text/plain' },
    });
  },

  async queueAnalysisTasks(batch: MessageBatch, env: any): Promise<void> {
    const worker = new AnalysisTaskWorker(env.D1_DB, env.IMAGE_BUCKET, env.AI);
    const results = await worker.processBatch(10);
    const ok = results.filter(r => r.success).length;
    console.log("[queue] analysis_tasks processed:", results.length, "ok:", ok);
  },

  async scheduledAnalysisTasks(_controller: ScheduledController, env: any): Promise<void> {
    const worker = new AnalysisTaskWorker(env.D1_DB, env.IMAGE_BUCKET, env.AI);
    const results = await worker.processBatch(10);
    if (results.length > 0) {
      const ok = results.filter(r => r.success).length;
      console.log("[scheduled] analysis_tasks:", results.length, "ok:", ok);
    }
  },
};
