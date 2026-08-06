export async function getUsers(env: any, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const keyword   = url.searchParams.get('keyword');
  const status    = url.searchParams.get('status');
  const beautyPro = url.searchParams.get('beautyPro');
  const page      = parseInt(url.searchParams.get('page')  || '1');
  const pageSize  = parseInt(url.searchParams.get('pageSize') || '10');
  const offset    = (page - 1) * pageSize;

  try {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    if (keyword) {
      query += ' AND (nickname LIKE ? OR id LIKE ?)';
      params.push('%' + keyword + '%', '%' + keyword + '%');
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (beautyPro !== null && beautyPro !== undefined) {
      query += ' AND beauty_pro = ?';
      params.push(beautyPro === 'true' ? 1 : 0);
    }
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const result = await env.D1_DB.prepare(query).bind(...params).all();
    const items = (result.results || []).map((row: any) => ({
      id:             row.id,
      nickname:       row.nickname || '',
      avatar:         row.avatar || '',
      sessionCount:   row.session_count  ?? 0,
      totalAnalyses:  row.total_analyses ?? 0,
      totalReports:   row.total_reports  ?? 0,
      beautyPro:      row.beauty_pro     === 1,
      createdAt:      row.created_at,
      lastActiveAt:   row.last_active_at ?? row.created_at,
      status:         row.status || 'active',
    }));
    return new Response(JSON.stringify({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/users] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch users' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function getUserDetail(env: any, userId: string): Promise<Response> {
  try {
    const row = await env.D1_DB.prepare('SELECT * FROM users WHERE id = ?').bind([userId]).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    const user = {
      id:             row.id,
      nickname:       row.nickname || '',
      avatar:         row.avatar || '',
      sessionCount:   row.session_count  ?? 0,
      totalAnalyses:  row.total_analyses ?? 0,
      totalReports:   row.total_reports  ?? 0,
      beautyPro:      row.beauty_pro     === 1,
      createdAt:      row.created_at,
      lastActiveAt:   row.last_active_at ?? row.created_at,
      status:         row.status || 'active',
    };
    return new Response(JSON.stringify({ success: true, data: user }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin/users/:id] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch user detail' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function updateUserStatus(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { status: string };
    const validStatuses = ['active', 'inactive', 'banned'];
    if (!validStatuses.includes(body.status)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid status' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    await env.D1_DB.prepare(
      'UPDATE users SET status = ?, last_active_at = datetime(new Date().toISOString()) WHERE id = ?'
    ).bind([body.status, userId]).run();
    return new Response(JSON.stringify({ success: true, message: 'Status updated' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[admin/users/:id/status] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update user status' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
