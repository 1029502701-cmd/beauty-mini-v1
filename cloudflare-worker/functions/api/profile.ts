export interface ProfileResponse {
  userId: string;
  nickname: string;
  avatar: string;
  styleName: string;
  reports: Array<{
    reportId: string;
    reportCode: string;
    createdAt: string;
    styleName: string;
  }>;
}

export async function getProfile(env: any): Promise<Response> {
  try {
    // In production, query the database for user profile
    // const prep = env.D1_DB.prepare(
    //   "SELECT user_id, nickname, avatar_url, style_name FROM beauty_user_profiles WHERE user_id = ?"
    // );
    // const profile = await prep.run([env.USER_ID]);
    
    // For now, return mock data
    const response: ProfileResponse = {
      userId: "current_user_id",
      nickname: "张三",
      avatar: "https://example.com/avatar.jpg",
      styleName: "清透自然型",
      reports: [
        {
          reportId: "report_001",
          reportCode: "BM202607300001",
          createdAt: "2026-07-25T10:30:00Z",
          styleName: "清透自然型"
        },
        {
          reportId: "report_002",
          reportCode: "BM202607200002",
          createdAt: "2026-07-20T14:15:00Z",
          styleName: "日系清新型"
        },
        {
          reportId: "report_003",
          reportCode: "BM202607100003",
          createdAt: "2026-07-10T09:45:00Z",
          styleName: "欧美浓妆型"
        }
      ]
    };
    
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Profile error:", err);
    return new Response(JSON.stringify({
      error: "Failed to fetch profile"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}