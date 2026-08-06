/**
 * GET /api/admin/creators - List creators with pagination and filters
 * PATCH /api/admin/creators/:id - Update creator
 */
export async function getCreators(env: any, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword");
  const platform = url.searchParams.get("platform");
  const cooperationStatus = url.searchParams.get("cooperationStatus");
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const offset = (page - 1) * pageSize;

  try {
    let query = "SELECT * FROM beauty_creators WHERE 1=1";
    const params: any[] = [];

    if (keyword) {
      query += " AND name LIKE ?";
      params.push(`%${keyword}%`);
    }
    if (platform) {
      query += " AND platform = ?";
      params.push(platform);
    }
    if (cooperationStatus) {
      query += " AND status = ?";
      params.push(cooperationStatus);
    }

    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const countResult = await env.D1_DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(pageSize, offset);
    const result = await env.D1_DB.prepare(query).bind(...params).all();

    const items = (result.results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar || "",
      platform: mapPlatform(row.platform),
      followers: 0,
      category: "",
      bio: row.description || "",
      contactWechat: "",
      contactEmail: "",
      contactPhone: "",
      cooperationStatus: mapCooperationStatus(row.status),
      totalCollaborations: 0,
      createdAt: row.created_at,
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
    console.error("[admin/creators] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch creators",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function updateCreator(env: any, creatorId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as Record<string, any>;
    
    // Placeholder - actual update logic
    return new Response(JSON.stringify({
      success: true,
      message: "Creator updated (placeholder)",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin/creators/:id] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to update creator",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

function mapPlatform(platform: string): "小红书" | "抖音" | "B站" | "微博" | "其他" {
  const map: Record<string, "小红书" | "抖音" | "B站" | "微博" | "其他"> = {
    "xiaohongshu": "小红书",
    "douyin": "抖音",
    "bilibili": "B站",
    "weibo": "微博",
  };
  return map[platform] || "其他";
}

function mapCooperationStatus(status: string): "pending" | "active" | "inactive" | "blacklisted" {
  const map: Record<string, "pending" | "active" | "inactive" | "blacklisted"> = {
    "pending": "pending",
    "approved": "active",
    "rejected": "inactive",
  };
  return map[status] || "pending";
}
