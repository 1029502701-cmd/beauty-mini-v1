/**
 * GET /api/admin/content - List content items with pagination and filters
 * PATCH /api/admin/content/:id/status - Update content status
 */
export async function getContent(env: any, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword");
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const platform = url.searchParams.get("platform");
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

  try {
    // Note: content table doesn't exist yet, returning mock data
    const mockContent = [
      { id: "ct001", title: "2026夏季必备底妆技巧", type: "article", thumbnail: "", url: "https://example.com/ct1", platform: "小红书", views: 12500, likes: 890, comments: 45, shares: 120, status: "published", createdAt: "2026-07-01T08:00:00Z", updatedAt: "2026-07-15T10:00:00Z" },
      { id: "ct002", title: "新手化妆全套视频教程", type: "video", thumbnail: "", url: "https://example.com/ct2", platform: "B站", views: 56000, likes: 3200, comments: 210, shares: 450, status: "published", createdAt: "2026-06-20T08:00:00Z", updatedAt: "2026-06-20T08:00:00Z" },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: {
        items: mockContent,
        total: mockContent.length,
        page,
        pageSize,
        totalPages: 1,
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin/content] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch content",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function updateContentStatus(env: any, contentId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as { status: string };
    
    // Placeholder - actual update logic
    return new Response(JSON.stringify({
      success: true,
      message: "Content status updated (placeholder)",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin/content/:id/status] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to update content status",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
