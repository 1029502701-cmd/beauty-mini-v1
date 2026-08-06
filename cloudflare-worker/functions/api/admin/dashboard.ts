/**
 * GET /api/admin/dashboard/stats
 * Returns aggregated dashboard statistics.
 */
export async function getDashboardStats(env: any): Promise<Response> {
  try {
    const [usersResult, reportsResult, tasksResult, ordersResult] = await Promise.all([
      env.D1_DB.prepare("SELECT COUNT(*) as total FROM users").first(),
      env.D1_DB.prepare("SELECT COUNT(*) as total FROM beauty_reports WHERE status = ?").all(["completed"]),
      env.D1_DB.prepare("SELECT COUNT(*) as total FROM beauty_tasks WHERE status = ?").all(["completed"]),
      env.D1_DB.prepare("SELECT COUNT(*) as total FROM beauty_orders WHERE status = ?").all(["paid"]),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const todayNewResult = await env.D1_DB.prepare(
      "SELECT COUNT(*) as total FROM users WHERE created_at >= ?"
    ).first([today]);

    return new Response(JSON.stringify({
      success: true,
      data: {
        users: {
          total: Number(usersResult?.total || 0),
          todayNew: Number(todayNewResult?.total || 0),
        },
        ai: {
          totalAnalyses: Number(reportsResult?.results?.length || 0) + Number(tasksResult?.results?.length || 0),
          successfulReports: Number(reportsResult?.results?.length || 0),
          failedTasks: 0,
        },
        commerce: {
          tokenConsumed: 0,
          beautyProCount: 0,
        },
        recommendations: {
          productRecommendations: 0,
          creatorRecommendations: 0,
        },
        orders: {
          total: Number(ordersResult?.results?.length || 0),
          paid: Number(ordersResult?.results?.length || 0),
        },
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin/dashboard] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch dashboard stats",
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
