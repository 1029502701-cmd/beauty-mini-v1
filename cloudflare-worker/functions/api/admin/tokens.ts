export async function getTokenPackages(env: any, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  try {
    let query = 'SELECT * FROM token_packages WHERE 1=1';
    const params: any[] = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at ASC';
    const result = await env.D1_DB.prepare(query).bind(...params).all();
    const items = (result.results || []).map((row: any) => ({
      id: row.id, name: row.name, tokens: row.tokens, price: row.price,
      discountRate: row.discount_rate, status: row.status,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }));
    return new Response(JSON.stringify({ success: true, data: items }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/tokens/packages] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch token packages' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function getTokenOrders(env: any, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword');
  const status  = url.searchParams.get('status');
  const page    = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  try {
    const pt = 'token_purchase';
    let query = 'SELECT o.*, u.nickname as user_nickname, p.name as package_name FROM beauty_orders o LEFT JOIN users u ON o.user_id = u.id LEFT JOIN token_packages p ON o.package_id = p.id WHERE o.product_type = ? AND 1=1';
    const params: any[] = [pt];
    if (keyword) { query += ' AND (u.nickname LIKE ? OR o.id LIKE ?)'; params.push('%' + keyword + '%', '%' + keyword + '%'); }
    if (status) { query += ' AND o.status = ?'; params.push(status); }
    const countQuery = query.replace('SELECT o.*, u.nickname as user_nickname, p.name as package_name', 'SELECT COUNT(*) as total');
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page-1)*pageSize);
    const result = await env.D1_DB.prepare(query).bind(...params).all();
    const items = (result.results || []).map((row: any) => ({
      id: row.id, userId: row.user_id, userNickname: row.user_nickname || '未知用户',
      packageId: row.package_id || '', packageName: row.package_name || '',
      tokenAmount: row.token_amount || 0, amount: row.amount, status: row.status,
      paidAt: row.paid_at || undefined, createdAt: row.created_at,
    }));
    return new Response(JSON.stringify({ success: true, data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/tokens/orders] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch token orders' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function updatePackageStatus(env: any, packageId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { status: string };
    if (!['active', 'inactive'].includes(body.status)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid status' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const now = new Date().toISOString();
    await env.D1_DB.prepare('UPDATE token_packages SET status = ?, updated_at = ? WHERE id = ?').bind([body.status, now, packageId]).run();
    return new Response(JSON.stringify({ success: true, message: 'Package status updated' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/tokens/packages/:id/status] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update package status' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function updatePackage(env: any, packageId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { name?: string; tokens?: number; price?: number; discountRate?: number };
    const updates: string[] = [];
    const params: any[] = [];
    if (body.name !== undefined)    { updates.push('name = ?');            params.push(body.name); }
    if (body.tokens !== undefined)  { updates.push('tokens = ?');          params.push(body.tokens); }
    if (body.price !== undefined)   { updates.push('price = ?');           params.push(body.price); }
    if (body.discountRate !== undefined) { updates.push('discount_rate = ?'); params.push(body.discountRate); }
    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    params.push(now, packageId);
    await env.D1_DB.prepare('UPDATE token_packages SET ' + updates.join(', ') + ' WHERE id = ?').bind(...params).run();
    const row = await env.D1_DB.prepare('SELECT * FROM token_packages WHERE id = ?').bind([packageId]).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, message: 'Package not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const pkg = { id: row.id, name: row.name, tokens: row.tokens, price: row.price, discountRate: row.discount_rate, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
    return new Response(JSON.stringify({ success: true, data: pkg }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/tokens/packages/:id] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update package' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
