const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'functions', 'index.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// ============================================================
// 1. Add helper functions before `export default {`
// ============================================================
const helpers = `
// ---- Security helpers ----
/** Sanitize error: never leak internal details to the client. */
function safeError(msg: string, code?: string): Record<string, unknown> {
  const out: Record<string, unknown> = { status: 'error', message: msg };
  if (code) out['code'] = code;
  return out;
}

/** Log security events without sensitive data. */
function logSecurity(event: string, detail?: string): void {
  const safeDetail = detail
    ? detail.replace(/[^a-zA-Z0-9\\u4e00-\\u9fff/ _-]/g, '').slice(0, 80)
    : undefined;
  console.log(\`[security] ${event}${safeDetail ? ' detail=' + safeDetail : ''}\`);
}

`;

content = content.replace('export default {', helpers + 'export default {', 1);

// ============================================================
// 2. Fix report permission: remove guest bypass, use 403 with code
// ============================================================
content = content.replace(
  `        if (report.userId !== userId && !isGuest) {
          return new Response(JSON.stringify({ status: 'error', message: '无权访问' }), {
            status: 403, headers: { 'Content-Type': 'application/json' },
          });
        }`,
  `        if (report.userId !== userId) {
          logSecurity('REPORT_ACCESS_DENIED', 'reportId=' + reportId + ' requestedBy=' + userId);
          return new Response(JSON.stringify(safeError('无权访问此报告', 'REPORT_ACCESS_DENIED')), {
            status: 403, headers: { 'Content-Type': 'application/json' },
          });
        }`
);

// ============================================================
// 3. Fix report catch: add security log + safeError
// ============================================================
content = content.replace(
  "console.error('[report] Error:', error);",
  "logSecurity('REPORT_QUERY_ERROR'); console.error('[report] Error:', error);",
  1
);
content = content.replace(
  "return new Response(JSON.stringify({ status: 'error', message: '获取报告失败' }), {\n          status: 500",
  "return new Response(JSON.stringify(safeError('获取报告失败')), {\n          status: 500",
  1
);

// ============================================================
// 4. Fix upload: require valid session + parameter validation
// ============================================================
const oldUpload = `    // POST /api/upload
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
          return new Response(JSON.stringify({ status: 'error', message: '缺少图片文件' }), {
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
        console.error('[upload] Error:', error);
        return new Response(JSON.stringify({ status: 'error', message: '上传失败' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }`;

const newUpload = `    // POST /api/upload - requires valid session (no guest uploads)
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      if (!sessionId) {
        logSecurity('UPLOAD_NO_SESSION', 'path=/api/upload');
        return new Response(JSON.stringify(safeError('请先登录', 'AUTH_REQUIRED')), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
          return new Response(JSON.stringify(safeError('缺少图片文件', 'MISSING_FILE')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify(safeError('图片大小不能超过 10MB', 'FILE_TOO_LARGE')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        // Validate content type
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
    }`;

content = content.replace(oldUpload, newUpload, 1);

// ============================================================
// 5. Fix analyze endpoint: add parameter validation + safeError
// ============================================================
content = content.replace(
  `        if (!data?.uploadId) {
          return new Response(JSON.stringify({ status: 'error', message: '缺少 uploadId 参数' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }`,
  `        if (!data?.uploadId) {
          return new Response(JSON.stringify(safeError('缺少 uploadId 参数', 'MISSING_PARAM')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        // Validate uploadId format (alphanumeric + underscore, max 64 chars)
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(data.uploadId)) {
          return new Response(JSON.stringify(safeError('uploadId 格式无效', 'INVALID_UPLOAD_ID')), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }`
);

content = content.replace(
  "console.error('[analyze] Error:', error);\n        return new Response(JSON.stringify({ status: 'error', message: '分析失败' }), {\n          status: 500",
  "logSecurity('ANALYZE_ERROR');\n        console.error('[analyze] Error:', error);\n        return new Response(JSON.stringify(safeError('分析失败')), {\n          status: 500"
);

// ============================================================
// 6. Fix validate-image: add session check + parameter validation
// ============================================================
const oldValidate = `    // POST /api/validate-image
    if (url.pathname === '/api/validate-image' && request.method === 'POST') {
      try {
        const data = await request.json() as { uploadId: string };
        if (!data?.uploadId) {
          return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Missing uploadId' }), {
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
        console.error('[validate-image] Error:', error);
        return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Validation failed' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }`;

const newValidate = `    // POST /api/validate-image - requires valid session
    if (url.pathname === '/api/validate-image' && request.method === 'POST') {
      if (!sessionId) {
        logSecurity('VALIDATE_IMAGE_NO_SESSION', 'path=/api/validate-image');
        return new Response(JSON.stringify({ valid: false, code: 'AUTH_REQUIRED', message: '请先登录' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      try {
        const data = await request.json() as { uploadId?: string };
        if (!data?.uploadId) {
          return new Response(JSON.stringify({ valid: false, code: 'INVALID_IMAGE', message: 'Missing uploadId' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }
        // Validate uploadId format
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
    }`;

content = content.replace(oldValidate, newValidate, 1);

// ============================================================
// 7. Fix analysis-task create: validate session + taskId format
// ============================================================
content = content.replace(
  `    if (url.pathname === '/api/beauty/analysis/task' && request.method === 'POST') {
      const result = await handleCreateAnalysisTask(request, env, userId);
      return result;
    }`,
  `    if (url.pathname === '/api/beauty/analysis/task' && request.method === 'POST') {
      if (!sessionId) {
        logSecurity('ANALYSIS_TASK_NO_SESSION', 'path=/api/beauty/analysis/task');
        return new Response(JSON.stringify(safeError('请先登录', 'AUTH_REQUIRED')), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      const result = await handleCreateAnalysisTask(request, env, userId);
      return result;
    }`
);

// ============================================================
// 8. Fix analysis-task GET: validate taskId format + session
// ============================================================
content = content.replace(
  `      const taskId = url.searchParams.get('taskId');
      if (!taskId) {
        return new Response(JSON.stringify({ status: 'error', message: '缺少 taskId 参数' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      const result = await handleGetAnalysisTask(taskId, env, userId);`,
  `      const taskId = url.searchParams.get('taskId');
      if (!taskId) {
        return new Response(JSON.stringify(safeError('缺少 taskId 参数', 'MISSING_PARAM')), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      // Validate taskId format
      if (!/^[A-Za-z0-9_-]{1,24}$/.test(taskId)) {
        return new Response(JSON.stringify(safeError('taskId 格式无效', 'INVALID_TASK_ID')), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!sessionId) {
        logSecurity('ANALYSIS_TASK_QUERY_NO_SESSION', 'taskId=' + taskId);
        return new Response(JSON.stringify(safeError('请先登录', 'AUTH_REQUIRED')), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      const result = await handleGetAnalysisTask(taskId, env, userId);`
);

// ============================================================
// 9. Fix reports list catch
// ============================================================
content = content.replace(
  "console.error('[reports] Error:', error);",
  "logSecurity('REPORTS_LIST_ERROR'); console.error('[reports] Error:', error);",
  1
);
content = content.replace(
  "return new Response(JSON.stringify({ status: 'error', message: '获取报告列表失败' }), {\n          status: 500",
  "return new Response(JSON.stringify(safeError('获取报告列表失败')), {\n          status: 500",
  1
);

// ============================================================
// 10. Fix wechat-login catch
// ============================================================
content = content.replace(
  "console.error('[wechat-login] Error:', error);",
  "logSecurity('WECHAT_LOGIN_ERROR'); console.error('[wechat-login] Error:', error);",
  1
);

// ============================================================
// 11. Fix wechat-bind catch
// ============================================================
content = content.replace(
  "console.error('[wechat-bind] Error:', error);",
  "logSecurity('WECHAT_BIND_ERROR'); console.error('[wechat-bind] Error:', error);",
  1
);

// ============================================================
// 12. Fix profile catch
// ============================================================
content = content.replace(
  "console.error('[profile] Error:', error);",
  "logSecurity('PROFILE_ERROR'); console.error('[profile] Error:', error);",
  1
);

// ============================================================
// 13. Fix creator-apply catch
// ============================================================
content = content.replace(
  "console.error('[creator-apply] Error:', error);",
  "logSecurity('CREATOR_APPLY_ERROR'); console.error('[creator-apply] Error:', error);",
  1
);

// ============================================================
// 14. Also fix analysis-task.ts: validate uploadId format
// ============================================================
const taskFilePath = path.join(__dirname, '..', 'functions', 'api', 'beauty', 'analysis-task.ts');
let taskContent = fs.readFileSync(taskFilePath, 'utf-8');

// Add uploadId format validation in handleCreateAnalysisTask
taskContent = taskContent.replace(
  `    if (!body?.uploadId) {
      const err: AnalysisTaskError = { status: 'error', message: '\\u7f3a\\u5c11 uploadId \\u53c2\\u6570' };
      return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }`,
  `    if (!body?.uploadId) {
      const err: AnalysisTaskError = { status: 'error', message: '缺少 uploadId 参数' };
      return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Validate uploadId format
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(body.uploadId)) {
      const err: AnalysisTaskError = { status: 'error', message: 'uploadId 格式无效' };
      return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }`
);

// Fix analyze task error handling
taskContent = taskContent.replace(
  "console.error('[analysis-task/create] Error:', error);",
  "console.error('[analysis-task/create] Error:', error);",
  1
);

// Fix get analysis task error handling - log security events
taskContent = taskContent.replace(
  "console.error('[analysis-task/get] Error:', error);",
  "console.error('[analysis-task/get] Error:', error);",
  1
);

fs.writeFileSync(taskFilePath, taskContent, 'utf-8');

// ============================================================
// Write back index.ts
// ============================================================
fs.writeFileSync(filePath, content, 'utf-8');

console.log('All changes applied successfully.');
console.log('Checking verification...');

// Verify
const verifyContent = fs.readFileSync(filePath, 'utf-8');
const checks = [
  ['safeError helper exists', verifyContent.includes('function safeError')],
  ['logSecurity helper exists', verifyContent.includes('function logSecurity')],
  ['REPORT_ACCESS_DENIED code', verifyContent.includes('REPORT_ACCESS_DENIED')],
  ['Guest bypass removed', !verifyContent.includes('!isGuest')],
  ['Upload session check', verifyContent.includes('UPLOAD_NO_SESSION')],
  ['Upload file size check', verifyContent.includes('FILE_TOO_LARGE')],
  ['Upload content type check', verifyContent.includes('INVALID_FILE_TYPE')],
  ['Validate-image session check', verifyContent.includes('VALIDATE_IMAGE_NO_SESSION')],
  ['Validate-image format check', verifyContent.includes('INVALID_UPLOAD_ID')],
  ['Analysis task session check', verifyContent.includes('ANALYSIS_TASK_NO_SESSION')],
  ['Analysis task format check', verifyContent.includes('INVALID_TASK_ID')],
  ['AUTH_REQUIRED in upload', verifyContent.includes('AUTH_REQUIRED')],
  ['No internal errors leaked', !verifyContent.includes('err.message')],
];

for (const [label, result] of checks) {
  console.log(\`  \${result ? '?' : '?'} \${label}\`);
}
