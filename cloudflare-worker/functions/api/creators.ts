export interface CreatorResponse {
  id: string;
  name: string;
  avatar: string;
  platform: string;
  description: string;
  style_tags: string[];
  reason: string;
  status: string;
  created_at: string;
}

export async function getApprovedCreators(env: any, limit: number = 10): Promise<CreatorResponse[]> {
  try {
    const query = "SELECT id, name, avatar, platform, description, style_tags, reason, status, created_at FROM beauty_creators WHERE status = ? ORDER BY created_at DESC LIMIT ?";
    
    const prep = env.D1_DB.prepare(query);
    const result = await prep.run(["approved", limit]);
    
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      platform: row.platform,
      description: row.description,
      style_tags: JSON.parse(row.style_tags),
      reason: row.reason,
      status: row.status,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error("Error fetching creators:", error);
    return [];
  }
}


