import type {
  AnalysisTask,
  AnalysisTaskStatus,
  CreateAnalysisTaskRequest,
  CreateAnalysisTaskResponse,
  GetAnalysisTaskResponse,
  AnalysisTaskError,
} from '../../../types/analysisTask';

/**
 * Generate a human-readable task ID (e.g. BM202608020001)
 */
function generateTaskId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return 'BM' + dateStr + seq;
}

/**
 * Create a new analysis task record in D1.
 * Returns the task in 'pending' status.
 */
async function createTaskInDb(
  d1: any,
  uploadId: string,
  userId: string,
): Promise<AnalysisTask> {
  const id = crypto.randomUUID();
  const taskId = generateTaskId();
  const now = new Date().toISOString();

  await d1.prepare(
`INSERT INTO analysis_tasks (id, task_id, upload_id, user_id, status, progress, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', 0, ?, ?)`
  ).execute([id, taskId, uploadId, userId, now, now]);

  return {
    id,
    taskId,
    uploadId,
    userId,
    status: 'pending',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * POST /api/beauty/analysis/task
 * Create a new analysis task. Validates uploadId exists in R2.
 */
export async function handleCreateAnalysisTask(
  request: Request,
  env: any,
  userId: string,
): Promise<Response> {
  try {
    const body = (await request.json()) as CreateAnalysisTaskRequest;

    if (!body?.uploadId) {
      const err: AnalysisTaskError = { status: 'error', message: '缺少 uploadId 参数' };
      return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Validate uploadId format (alphanumeric + underscore, max 64 chars)
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(body.uploadId)) {
      const err: AnalysisTaskError = { status: 'error', message: 'uploadId 格式无效' };
      return new Response(JSON.stringify(err), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate that the uploadId exists in R2
    const object = await env.IMAGE_BUCKET.get(body.uploadId);
    if (!object) {
      const err: AnalysisTaskError = { status: 'error', message: '\u4e0a\u4f20\u56fe\u7247\u4e0d\u5b58\u5728\uff0c\u8bf7\u5148\u91cd\u65b0\u4e0a\u4f20' };
      return new Response(JSON.stringify(err), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const task = await createTaskInDb(env.D1_DB, body.uploadId, userId);

    const res: CreateAnalysisTaskResponse = {
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
    };

    return new Response(JSON.stringify(res), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[analysis-task/create] Error:', error);
    const err: AnalysisTaskError = { status: 'error', message: '\u521b\u5efa\u4efb\u52a1\u5931\u8d25' };
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * GET /api/beauty/analysis/task?taskId=xxx
 * Query a task by its display task ID.
 */
export async function handleGetAnalysisTask(
  taskId: string,
  env: any,
  userId: string,
): Promise<Response> {
  try {
    const result = await env.D1_DB.prepare(
      'SELECT * FROM analysis_tasks WHERE task_id = ? AND user_id = ?'
    ).execute([taskId, userId]);

    if (result.done || !result.results || result.results.length === 0) {
      const err: AnalysisTaskError = { status: 'error', message: '\u4efb\u52a1\u4e0d\u5b58\u5728' };
      return new Response(JSON.stringify(err), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const row: any = result.results[0];
    const task: AnalysisTask = {
      id: row.id,
      taskId: row.task_id,
      uploadId: row.upload_id,
      userId: row.user_id,
      status: row.status as AnalysisTaskStatus,
      progress: row.progress ?? 0,
      reportId: row.report_id || undefined,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const res: GetAnalysisTaskResponse = {
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      reportId: task.reportId,
      errorMessage: task.errorMessage,
    };

    return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[analysis-task/get] Error:', error);
    const err: AnalysisTaskError = { status: 'error', message: '\u67e5\u8be2\u4efb\u52a1\u5931\u8d25' };
    return new Response(JSON.stringify(err), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * Update task status and progress in D1.
 */
export async function updateTaskStatus(
  d1: any,
  taskId: string,
  status: AnalysisTaskStatus,
  progress: number,
  reportId?: string,
  errorMessage?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await d1.prepare(
`UPDATE analysis_tasks
     SET status = ?, progress = ?, updated_at = ?,
         report_id = COALESCE(?, report_id),
         error_message = COALESCE(?, error_message)
     WHERE task_id = ?`
  ).execute([status, progress, now, reportId || null, errorMessage || null, taskId]);
}
