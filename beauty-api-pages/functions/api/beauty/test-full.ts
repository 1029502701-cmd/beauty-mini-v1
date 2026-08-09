export async function onRequestPost(context) {
  const { env } = context;
  try {
    const reportLevel = "first-look";
    const sessionId = "fa4a3a58-54d6-484a-a402-32dad7750c01";
    
    // Step 1: Check session
    const sessionRaw = await env.USER_CACHE.get("session:" + sessionId);
    if (!sessionRaw) return new Response(JSON.stringify({step: "session", error: "NOT FOUND"}), {status: 401});
    const userId = JSON.parse(sessionRaw).userId;
    
    // Step 2: Check daily limit
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const startISO = startOfDay.toISOString();
    const endISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const todayCount = await env.D1_DB.prepare(
      "SELECT COUNT(*) as cnt FROM report_access WHERE user_id = ? AND level = ? AND unlocked_at >= ? AND unlocked_at < ?"
    ).first(userId, reportLevel, startISO, endISO);
    
    // Step 3: Generate report
    const report = { success: true, level: reportLevel };
    
    // Step 4: Insert into beauty_reports
    const id = require("crypto").randomUUID();
    const now = new Date().toISOString();
    const expireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await env.D1_DB.prepare(
      "INSERT INTO beauty_reports (id, user_id, image_id, level, status, face_metrics_json, analysis_json, analysis_version, created_at, expire_at, image_url, thumbnail_url, decision_answers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, "test_" + Date.now(), reportLevel, "completed", "{}", JSON.stringify(report), "v2", now, expireAt, null, null, null).run();
    
    return new Response(JSON.stringify({step: "success", reportId: id, userId, todayCount}), {status: 200});
  } catch (err) {
    return new Response(JSON.stringify({step: "error", error: err.message, stack: err.stack}), {status: 500});
  }
}
