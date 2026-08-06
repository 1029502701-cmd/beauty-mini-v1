// BeautyReportRepository - D1-based persistence layer for beauty reports with enhanced safety

export interface BeautyReport {
  id: string;
  userId: string;
  imageId: string | null; // Legacy: temporary reference during processing
  imageUrl: string | null; // Full URL to original image stored in R2
  thumbnailUrl: string | null; // URL to processed thumbnail image
  level: string;
  status: "pending" | "processing" | "completed" | "failed";
  faceMetricsJson: string;
  analysisJson: string;
  analysisVersion: string;
  createdAt: string;
  expireAt: string | null;
}

export interface ReportCreatePayload {
  userId: string;
  imageId: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  level: string;
  faceMetricsJson: string;
  analysisJson: string;
  expireAt: string | null;
}

class BeautyReportRepository {
  private db: any;

  constructor(d1: any) {
    this.db = d1;
  }

  async create(payload: ReportCreatePayload) {
    const id = "report_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    
    if (!payload.userId || !payload.level || !payload.faceMetricsJson || !payload.analysisJson) {
      throw new Error("Invalid payload: missing required fields");
    }

    await this.db.prepare(
  "INSERT INTO beauty_reports (id, user_id, image_id, image_url, thumbnail_url, level, status, face_metrics_json, analysis_json, analysis_version, created_at, expire_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).execute([
      id,
      payload.userId,
      payload.imageId,
      payload.imageUrl,
      payload.thumbnailUrl,
      payload.level,
      "pending",
      payload.faceMetricsJson,
      payload.analysisJson,
      "v1",
      now,
      payload.expireAt
    ]);

    return {
      id,
      userId: payload.userId,
      imageId: payload.imageId,
      imageUrl: payload.imageUrl,
      thumbnailUrl: payload.thumbnailUrl,
      level: payload.level,
      status: "pending",
      faceMetricsJson: payload.faceMetricsJson,
      analysisJson: payload.analysisJson,
      analysisVersion: "v1",
      createdAt: now,
      expireAt: payload.expireAt,
    };
  }

  async findById(id: string): Promise<BeautyReport | null> {
    try {
      const result = await this.db.prepare("SELECT * FROM beauty_reports WHERE id = ?").execute([id]);
      if (result.done || result.results?.length === 0) {
        return null;
      }
      const row = result.results[0];
      return this.mapRowToReport(row);
    } catch (err) {
      console.error("Error finding report:", err);
      return null;
    }
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<BeautyReport[]> {
    try {
      let sql = "SELECT * FROM beauty_reports WHERE user_id = ? ORDER BY created_at DESC";
      const params: any[] = [userId];
      
      if (limit !== undefined) {
        sql += " LIMIT ?";
        params.push(limit);
      }
      if (offset !== undefined) {
        sql += " OFFSET ?";
        params.push(offset);
      }
      
      const result = await this.db.prepare(sql).execute(params);
      if (result.done || result.results?.length === 0) {
        return [];
      }
      
      return result.results.map((r: any) => this.mapRowToReport(r));
    } catch (err) {
      console.error("Error fetching reports by user:", err);
      return [];
    }
  }

  async updateStatus(id: string, status: "pending" | "processing" | "completed" | "failed"): Promise<BeautyReport | null> {
    try {
      const result = await this.db.prepare("UPDATE beauty_reports SET status = ? WHERE id = ?").execute([status, id]);
      if (result.changes === 0) {
        return null;
      }
      return this.findById(id);
    } catch (err) {
      console.error("Error updating report status:", err);
      return null;
    }
  }

  private mapRowToReport(row: any): BeautyReport {
    const faceMetrics = this.safeParseJSON(row.face_metrics_json, {});
    const analysis = this.safeParseJSON(row.analysis_json, {});
    
    return {
      id: row.id,
      userId: row.user_id,
      imageId: row.image_id || null,
      imageUrl: row.image_url || null,
      thumbnailUrl: row.thumbnail_url || null,
      level: row.level || "basic",
      status: row.status || "pending",
      faceMetricsJson: row.face_metrics_json,
      analysisJson: row.analysis_json,
      analysisVersion: row.analysis_version || "v1",
      createdAt: row.created_at || new Date().toISOString(),
      expireAt: row.expire_at || null,
    };
  }

  private safeParseJSON(str: any, fallback: any): any {
    if (typeof str === "string") {
      try {
        return JSON.parse(str);
      } catch (e) {
        console.warn("JSON parse failed, using fallback:", e);
        return fallback;
      }
    }
    return typeof str === "object" && str !== null ? str : fallback;
  }
}

export default BeautyReportRepository;