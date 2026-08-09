import os
base = 'C:/Users/yao/Documents/Ai美妆/beauty-api-pages/functions/api/beauty'

lines9 = [
    'import type { Env } from "../../types";',
    'import { extractSessionId } from "../../../lib/session";',
    'export async function onRequestPost(context) {',
    '  const { env, request } = context;',
    '  const sessionId = extractSessionId(request);',
    '  if (!sessionId) return new Response(JSON.stringify({error:"no session"}), {status:401});',
    '  const sessionRaw = await env.USER_CACHE.get("session:" + sessionId);',
    '  if (!sessionRaw) return new Response(JSON.stringify({error:"no session raw"}), {status:401});',
    '  const userId = JSON.parse(sessionRaw).userId;',
    '  try {',
    '    const id = "bind_test_9_" + Date.now();',
    '    const now = new Date().toISOString();',
    '    const expireAt = new Date(Date.now()+365*24*60*60*1000).toISOString();',
    '    await env.D1_DB.prepare(',
    '      "INSERT INTO beauty_reports (id, user_id, image_id, image_url, thumbnail_url, level, status, created_at, expire_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"',
    '    ).bind(id, userId, "test", null, null, "first-look", "completed", now, expireAt).run();',
    '    return new Response(JSON.stringify({success:true, id}), {status:200});',
    '  } catch(err) {',
    '    return new Response(JSON.stringify({success:false, error: err instanceof Error ? err.message : String(err)}), {status:500});',
    '  }',
    '}',
]
with open(base + '/bind-test-9.ts', 'w') as f:
    f.write('\n'.join(lines9))

lines4 = [
    'import type { Env } from "../../types";',
    'import { extractSessionId } from "../../../lib/session";',
    'export async function onRequestPost(context) {',
    '  const { env, request } = context;',
    '  const sessionId = extractSessionId(request);',
    '  if (!sessionId) return new Response(JSON.stringify({error:"no session"}), {status:401});',
    '  const sessionRaw = await env.USER_CACHE.get("session:" + sessionId);',
    '  if (!sessionRaw) return new Response(JSON.stringify({error:"no session raw"}), {status:401});',
    '  const userId = JSON.parse(sessionRaw).userId;',
    '  try {',
    '    const id = "bind_test_4_" + Date.now();',
    '    await env.D1_DB.prepare(',
    '      "UPDATE beauty_reports SET face_metrics_json = ?, analysis_json = ?, decision_answers_json = ? WHERE id = ?"',
    '    ).bind("{}", "{}", null, id).run();',
    '    return new Response(JSON.stringify({success:true, id}), {status:200});',
    '  } catch(err) {',
    '    return new Response(JSON.stringify({success:false, error: err instanceof Error ? err.message : String(err)}), {status:500});',
    '  }',
    '}',
]
with open(base + '/bind-test-4.ts', 'w') as f:
    f.write('\n'.join(lines4))

lines8 = [
    'import type { Env } from "../../types";',
    'import { extractSessionId } from "../../../lib/session";',
    'export async function onRequestPost(context) {',
    '  const { env, request } = context;',
    '  const sessionId = extractSessionId(request);',
    '  if (!sessionId) return new Response(JSON.stringify({error:"no session"}), {status:401});',
    '  const sessionRaw = await env.USER_CACHE.get("session:" + sessionId);',
    '  if (!sessionRaw) return new Response(JSON.stringify({error:"no session raw"}), {status:401});',
    '  const userId = JSON.parse(sessionRaw).userId;',
    '  try {',
    '    const id = "bind_test_8_" + Date.now();',
    '    const now = new Date().toISOString();',
    '    const expireAt = new Date(Date.now()+365*24*60*60*1000).toISOString();',
    '    await env.D1_DB.prepare(',
    '      "INSERT INTO report_access (id, user_id, report_id, level, unlock_type, token_cost, unlocked_at, expire_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"',
    '    ).bind(id, userId, id, "first-look", "free", 0, now, expireAt).run();',
    '    return new Response(JSON.stringify({success:true, id}), {status:200});',
    '  } catch(err) {',
    '    return new Response(JSON.stringify({success:false, error: err instanceof Error ? err.message : String(err)}), {status:500});',
    '  }',
    '}',
]
with open(base + '/bind-test-8.ts', 'w') as f:
    f.write('\n'.join(lines8))

print('Created bind-test-9.ts, bind-test-4.ts, bind-test-8.ts')
