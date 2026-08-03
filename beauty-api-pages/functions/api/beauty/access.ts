import type { Env } from '../../types';
import { PermissionService } from '../../../modules/beauty-ai/permission/permission-service';
import { TokenService } from '../../../modules/token/token-service';
import { extractSessionId } from '../../../lib/session';

export async function onRequestGet(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  const url = new URL(request.url);
  const reportLevel = url.searchParams.get('reportLevel');

  if (!reportLevel) {
    return new Response(
      JSON.stringify({ success: false, error: "Query param 'reportLevel' is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validLevels = ['first-look', 'style-upgrade', 'beauty-pro'];
  if (!validLevels.includes(reportLevel)) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid reportLevel: " + reportLevel }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const tokenService = new TokenService(env.D1_DB);
    const permissionService = new PermissionService();

    const sessionId = extractSessionId(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
    if (!sessionRaw) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const userId = JSON.parse(sessionRaw).userId;

    const balance = await tokenService.getBalance(userId);

    const result = permissionService.canAccessReport({
      userId,
      reportLevel: reportLevel as 'first-look' | 'style-upgrade' | 'beauty-pro',
      tokenBalance: balance,
    });

    return new Response(
      JSON.stringify({
        success: true,
        allowed: result.allowed,
        reason: result.reason,
        tokenRequired: result.tokenRequired ?? 0,
        balance,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[beauty/access] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
