import type { Env } from '../../types';
import { TokenService } from '../../../modules/token/token-service';
import { extractSessionId } from '../../../lib/session';

export async function onRequestGet(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  try {
    const tokenService = new TokenService(env.D1_DB);
    const sessionId = extractSessionId(request);
    const userId = sessionId || 'anonymous';

    const balance = await tokenService.getBalance(userId);

    return new Response(
      JSON.stringify({ success: true, userId, balance }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[token/balance] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
