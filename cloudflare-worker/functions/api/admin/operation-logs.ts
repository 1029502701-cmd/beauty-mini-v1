export async function getOperationLogs(env: any, request: Request): Promise<Response> {
  const url       = new URL(request.url);
  const keyword   = url.searchParams.get('keyword');
  const actionType = url.searchParams.get('actionType');
  const dateFrom  = url.searchParams.get('dateFrom');
  const dateTo    = url.searchParams.get('dateTo');
  const page      = parseInt(url.searchParams.get('page')         || '1');
  const pageSize  = parseInt(url.searchParams.get('pageSize')    || '10');
  const offset    = (page - 1) * pageSize;
  try {
    let query = 'SELECT * FROM admin_operation_logs WHERE 1=1';
    const params: any[] = [];
    if (keyword) { query += ' AND (admin_name LIKE ? OR target_name LIKE ? OR detail LIKE ?)'; params.push('%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%'); }
    if (actionType) { query += ' AND action_type = ?'; params.push(actionType); }
    if (dateFrom) { query += ' AND created_at >= ?'; params.push(dateFrom); }
    if (dateTo) { query += ' AND created_at <= ?'; params.push(dateTo + 'T23:59:59'); }
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const result = await env.D1_DB.prepare(query).bind(...params).all();
    const items = (result.results || []).map((row: any) => ({
      id: row.id, adminId: row.admin_id, adminName: row.admin_name,
      actionType: row.action_type, targetType: row.target_type,
      targetId: row.target_id, targetName: row.target_name,
      detail: row.detail, createdAt: row.created_at,
    }));
    return new Response(JSON.stringify({ success: true, data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/operation-logs] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch operation logs' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function createOperationLog(env: any, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { adminId: string; adminName: string; actionType: string; targetType: string; targetId: string; targetName?: string; detail?: string };
    if (!body.adminId || !body.actionType || !body.targetType || !body.targetId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const id = 'log_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    await env.D1_DB.prepare('INSERT INTO admin_operation_logs (id, admin_id, admin_name, action_type, target_type, target_id, target_name, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(new Date().toISOString()))').bind([
      id, body.adminId, body.adminName || '', body.actionType, body.targetType, body.targetId, body.targetName || '', body.detail || '',
    ]).run();
    return new Response(JSON.stringify({ success: true, data: { id } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/operation-logs POST] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to create operation log' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
