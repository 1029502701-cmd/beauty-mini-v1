import type { Env } from '../../types';
import { TokenService } from '../../../modules/token/token-service';

interface SeedRequest {
  userId: string;
  amount: number;
  reason?: string;
}

export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  // Admin auth guard: requires Bearer token matching TOKEN_ADMIN_SECRET
  const authHeader = request.headers.get('Authorization') || '';
  if (!env.TOKEN_ADMIN_SECRET || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== env.TOKEN_ADMIN_SECRET) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body: SeedRequest;
  try {
    body = (await request.json()) as SeedRequest;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Request body must be valid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body.userId || !body.amount) {
    return new Response(
      JSON.stringify({ success: false, error: 'userId and amount are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (body.amount <= 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'amount must be positive' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const tokenService = new TokenService(env.D1_DB);
    const newBalance = await tokenService.add(
      body.userId,
      body.amount,
      body.reason || 'Admin seed'
    );

    return new Response(
      JSON.stringify({ success: true, userId: body.userId, balance: newBalance }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[token/seed] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
