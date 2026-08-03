import type { Env } from '../../types';
import { TokenService } from '../../../modules/token/token-service';
import { extractSessionId } from '../../../lib/session';

interface ConsumeRequest {
  amount?: number;
  reason?: string;
}

export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  let body: ConsumeRequest;
  try {
    body = (await request.json()) as ConsumeRequest;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Request body must be valid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const amount = body.amount ?? 3;
  const reason = body.reason ?? 'Token consumed';

  if (amount <= 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'amount must be positive' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const tokenService = new TokenService(env.D1_DB);
    const sessionId = extractSessionId(request);
    const userId = sessionId || 'anonymous';

    const newBalance = await tokenService.consume({
      userId,
      amount,
      description: reason,
    });

    return new Response(
      JSON.stringify({ success: true, userId, balance: newBalance }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

