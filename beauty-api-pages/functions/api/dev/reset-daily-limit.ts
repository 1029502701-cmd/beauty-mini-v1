import type { Env } from '../../types';
import { extractSessionId } from '../../../lib/session';

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  // DEV_MODE 环境保护：生产环境禁止执行
  if (env.DEV_MODE !== 'true') {
    return json({ error: 'DEV_MODE is not enabled. Set DEV_MODE=true to use this endpoint.' }, 403);
  }

  const { env, request } = context;
  const db = env.D1_DB;

  const sessionId = extractSessionId(request);
  if (!sessionId) {
    return json({ error: 'Missing X-Session-Id header' }, 401);
  }

  const raw = await env.USER_CACHE.get('session:' + sessionId);
  if (!raw) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  const { userId } = JSON.parse(raw);

  // 计算今天 UTC 时间范围
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startISO = startOfToday.toISOString();
  const endISO = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // 删除今天 beauty_reports 记录
  const reportsDel = await db.prepare(
    'DELETE FROM beauty_reports WHERE user_id = ? AND created_at >= ? AND created_at < ?'
  ).bind(userId, startISO, endISO).run();
  const reportsDeleted = reportsDel.success ? reportsDel.meta?.changes ?? 0 : 0;

  // 删除今天 report_access 记录
  const accessDel = await db.prepare(
    'DELETE FROM report_access WHERE user_id = ? AND unlocked_at >= ? AND unlocked_at < ?'
  ).bind(userId, startISO, endISO).run();
  const accessDeleted = accessDel.success ? accessDel.meta?.changes ?? 0 : 0;

  return json({
    success: true,
    userId,
    reset: {
      beauty_reports_deleted: reportsDeleted,
      report_access_deleted: accessDeleted,
    },
    message: 'Daily limit records reset successfully',
  });
}
