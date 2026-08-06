/**
 * GET /api/admin/tasks - List AI tasks with pagination and filters
 * POST /api/admin/tasks/:id/retry - Retry a failed task
 */
export async function getTasks(env: any, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const offset = (page - 1) * pageSize;

  try {
    let query = `
      SELECT t.*, u.nickname as user_nickname
      FROM beauty_tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (keyword) {
      query += " AND u.nickname LIKE ?";
      params.push(`%${keyword}%`);
    }
    if (status) {
      query += " AND t.status = ?";
      params.push(status);
    }

    const countQuery = query.replace(/SELECT t\.\*, u\.nickname as user_nickname/, "SELECT COUNT(*) as total");
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);

    query += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
    params.push(pageSize, offset);
    const result = await env.D1_DB.prepare(query).bind(...params).all();

    const items = (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userNickname: row.user_nickname || "未知用户",
      type: "analysis",
      status: row.status === "analyzing" ? "running" : row.status,
      inputUrl: "",
      outputUrl: row.result_json ? JSON.parse(row.result_json).imageUrl : undefined,
      errorMessage: row.result_json ? JSON.parse(row.result_json).error : undefined,
      createdAt: row.created_at,
      completedAt: row.updated_at || undefined,
      tokenCost: 2,
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin/tasks] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch tasks",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function retryTask(env: any, taskId: string): Promise<Response> {
  try {
    // Placeholder - actual retry logic would re-trigger the analysis
    return new Response(JSON.stringify({
      success: true,
      message: "Task retry triggered (placeholder)",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin/tasks/:id/retry] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to retry task",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
