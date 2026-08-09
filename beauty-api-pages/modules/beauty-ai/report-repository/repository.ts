import type { Env } from "../../../../functions/types";
import type { BeautyReportRecord, CreateReportInput, CreateReportResult } from "./types";

export class BeautyReportRepository {
  constructor(private db: Env["D1_DB"]) {}

  async createReport(input: CreateReportInput): Promise<CreateReportResult> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const expireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const sql = "INSERT INTO beauty_reports (id, user_id, image_id, level, status, face_metrics_json, analysis_json, analysis_version, created_at, expire_at, decision_answers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    await this.db.prepare(sql)
      .bind(id, input.userId, input.uploadId, input.reportLevel, "completed", "{}", JSON.stringify(input.reportJson), "v2", now, expireAt, input.imageUrl ?? null, input.thumbnailUrl ?? null, input.decisionAnswersJson ?? null)
      .run();
    return { id, createdAt: now };
  }

  private safeParse(str: string): unknown {
    try { return JSON.parse(str); } catch { return { raw: str }; }
  }
}