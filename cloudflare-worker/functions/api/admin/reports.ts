export async function getReports(env: any, request: Request): Promise<Response> {
  const url     = new URL(request.url);
  const keyword = url.searchParams.get('keyword');
  const level   = url.searchParams.get('level');
  const status  = url.searchParams.get('status');
  const page    = parseInt(url.searchParams.get('page')         || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize')   || '10');
  const offset  = (page - 1) * pageSize;

  try {
    let query = 'SELECT r.id, r.user_id, u.nickname as user_nickname, r.image_url, r.level, r.status, r.created_at, r.face_metrics_json, r.analysis_json FROM beauty_reports r LEFT JOIN users u ON r.user_id = u.id WHERE 1=1';
    const params: any[] = [];
    if (keyword) {
      query += ' AND (u.nickname LIKE ? OR r.id LIKE ?)';
      params.push('%' + keyword + '%', '%' + keyword + '%');
    }
    if (level) { query += ' AND r.level = ?'; params.push(level); }
    if (status) { query += ' AND r.status = ?'; params.push(status); }

    const countQuery = query.replace(
      'SELECT r.id, r.user_id, u.nickname as user_nickname, r.image_url, r.level, r.status, r.created_at, r.face_metrics_json, r.analysis_json',
      'SELECT COUNT(*) as total'
    );
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const result = await env.D1_DB.prepare(query).bind(...params).all();

    const items = (result.results || []).map((row: any) => {
      let faceShape = '', eyeShape = '', skinTone = '', overallScore = 0;
      try { const m = JSON.parse(row.face_metrics_json || '{}'); faceShape = m.faceShape || ''; eyeShape = m.eyeType || ''; skinTone = m.skinTone || ''; overallScore = m.overallScore || 0; } catch {}
      return { id: row.id, userId: row.user_id, userNickname: row.user_nickname || '未知用户', imageUrl: row.image_url || '', faceShape, eyeShape, skinTone, overallScore, level: row.level, createdAt: row.created_at, status: row.status, unlockStatus: row.level === 'beginner' ? 'free' : 'locked' };
    });

    return new Response(JSON.stringify({ success: true, data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/reports] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch reports' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function getReportDetail(env: any, reportId: string): Promise<Response> {
  try {
    const row = await env.D1_DB.prepare('SELECT r.*, u.nickname as user_nickname FROM beauty_reports r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?').bind([reportId]).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, message: 'Report not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    let faceShape = '', eyeShape = '', skinTone = '', overallScore = 0, analysisContent = '';
    try { const m = JSON.parse(row.face_metrics_json || '{}'); faceShape = m.faceShape || ''; eyeShape = m.eyeType || ''; skinTone = m.skinTone || ''; overallScore = m.overallScore || 0; } catch {}
    try { const a = JSON.parse(row.analysis_json || '{}'); analysisContent = a.content || ''; } catch {}
    const detail = { id: row.id, userId: row.user_id, userNickname: row.user_nickname || '未知用户', imageUrl: row.image_url || '', faceShape, eyeShape, skinTone, overallScore, level: row.level, createdAt: row.created_at, status: row.status, unlockStatus: row.level === 'beginner' ? 'free' : 'locked', analysisContent };
    return new Response(JSON.stringify({ success: true, data: detail }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/reports/:id] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch report detail' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function deleteReport(env: any, reportId: string): Promise<Response> {
  try {
    await env.D1_DB.prepare('DELETE FROM beauty_reports WHERE id = ?').bind([reportId]).run();
    return new Response(JSON.stringify({ success: true, message: 'Report deleted' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/reports/:id] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to delete report' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function unlockReport(env: any, reportId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { unlockStatus: string };
    if (!['locked', 'unlocked'].includes(body.unlockStatus)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid unlock status' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const row = await env.D1_DB.prepare('SELECT * FROM beauty_reports WHERE id = ?').bind([reportId]).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, message: 'Report not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    let analysisJson: any = {};
    try { analysisJson = JSON.parse(row.analysis_json || '{}'); } catch {}
    analysisJson.unlockStatus = body.unlockStatus;
    await env.D1_DB.prepare('UPDATE beauty_reports SET analysis_json = ? WHERE id = ?').bind([JSON.stringify(analysisJson), reportId]).run();
    return new Response(JSON.stringify({ success: true, message: 'Unlock status updated' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/reports/:id/unlock] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update unlock status' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
