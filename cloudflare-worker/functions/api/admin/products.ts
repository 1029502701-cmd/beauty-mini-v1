function parseJsonArray(raw: string | null, fallback: any[]): any[] {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export async function getProducts(env: any, request: Request): Promise<Response> {
  const url      = new URL(request.url);
  const keyword  = url.searchParams.get('keyword');
  const category = url.searchParams.get('category');
  const platform = url.searchParams.get('platform');
  const status   = url.searchParams.get('status');
  const featured = url.searchParams.get('featured');
  const page     = parseInt(url.searchParams.get('page')         || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize')    || '10');
  const offset   = (page - 1) * pageSize;
  try {
    let query = 'SELECT * FROM admin_products WHERE 1=1';
    const params: any[] = [];
    if (keyword) { query += ' AND (name LIKE ? OR brand LIKE ?)'; params.push('%' + keyword + '%', '%' + keyword + '%'); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (platform) { query += ' AND platform = ?'; params.push(platform); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (featured !== null && featured !== undefined) { query += ' AND featured = ?'; params.push(featured === 'true' ? 1 : 0); }
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const result = await env.D1_DB.prepare(query).bind(...params).all();
    const items = (result.results || []).map((row: any) => ({
      id: row.id, name: row.name, brand: row.brand, category: row.category,
      price: row.price, originalPrice: row.original_price, image: row.image_url,
      description: row.description, platform: row.platform,
      affiliateLink: row.affiliate_link, stock: row.stock, status: row.status,
      featured: row.featured === 1, createdAt: row.created_at, updatedAt: row.updated_at,
      recommendedTags: parseJsonArray(row.recommended_tags, []),
    }));
    return new Response(JSON.stringify({ success: true, data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/products] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch products' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function getProductDetail(env: any, productId: string): Promise<Response> {
  try {
    const row = await env.D1_DB.prepare('SELECT * FROM admin_products WHERE id = ?').bind([productId]).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, message: 'Product not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const product = { id: row.id, name: row.name, brand: row.brand, category: row.category, price: row.price, originalPrice: row.original_price, image: row.image_url, description: row.description, platform: row.platform, affiliateLink: row.affiliate_link, stock: row.stock, status: row.status, featured: row.featured === 1, createdAt: row.created_at, updatedAt: row.updated_at, recommendedTags: parseJsonArray(row.recommended_tags, []) };
    return new Response(JSON.stringify({ success: true, data: product }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/products/:id] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to fetch product' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function updateProduct(env: any, productId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as Record<string, any>;
    const fieldMap: Record<string, string> = { name:'name', brand:'brand', category:'category', price:'price', originalPrice:'original_price', image:'image_url', description:'description', platform:'platform', affiliateLink:'affiliate_link', stock:'stock', status:'status', featured:'featured' };
    const updates: string[] = [];
    const params: any[] = [];
    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) { updates.push(col + ' = ?'); params.push(body[key]); }
    }
    updates.push('updated_at = datetime(new Date().toISOString())');
    params.push(productId);
    await env.D1_DB.prepare('UPDATE admin_products SET ' + updates.join(', ') + ' WHERE id = ?').bind(...params).run();
    return new Response(JSON.stringify({ success: true, message: 'Product updated' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/products/:id] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update product' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function updateProductTags(env: any, productId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { recommendedTags: string[] };
    const tagsJson = JSON.stringify(body.recommendedTags || []);
    await env.D1_DB.prepare('UPDATE admin_products SET recommended_tags = ?, updated_at = datetime(new Date().toISOString()) WHERE id = ?').bind([tagsJson, productId]).run();
    return new Response(JSON.stringify({ success: true, message: 'Tags updated' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[admin/products/:id/tags] Error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update tags' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
