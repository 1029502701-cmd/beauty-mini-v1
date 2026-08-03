/**
 * BeautyReportRepository - D1-based persistence layer for beauty reports.
 * Supports decision_answers_json for beauty-pro personalization (Task-010).
 */
import type { Env } from "../../../../functions/types";
import type {
  BeautyReportRecord,
  CreateReportInput,
  CreateReportResult,
} from "./types";

export class BeautyReportRepository {
  constructor(private db: Env["D1_DB"]) {}

  async createReport(input: CreateReportInput): Promise<CreateReportResult> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      "INSERT INTO beauty_reports (id,user_id,image_id,image_url,thumbnail_url,level,status,face_metrics_json,analysis_json,analysis_version,created_at,decision_answers_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(
      id,
      input.userId,
      input.uploadId,
      input.imageUrl ?? null,
      input.thumbnailUrl ?? null,
      input.reportLevel,
      "completed",
      "{}",
      JSON.stringify(input.reportJson),
      "v2",
      now,
      input.decisionAnswersJson ?? null
    ).run();
    return { id, createdAt: now };
  }

  async getReport(reportId: string): Promise<BeautyReportRecord | null> {
    const row = await this.db.prepare(
      "SELECT id,user_id,image_id,image_url,thumbnail_url,level,status,analysis_json,analysis_version,created_at,decision_answers_json FROM beauty_reports WHERE id=?"
    ).first<any>(reportId);
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      uploadId: row.image_id,
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
      reportLevel: row.level,
      status: row.status,
      reportJson: this.safeParse(row.analysis_json),
      createdAt: row.created_at,
      analysisVersion: row.analysis_version,
      decisionAnswers: row.decision_answers_json
        ? this.safeParse(row.decision_answers_json)
        : undefined,
    };
  }

  async listUserReports(userId: string): Promise<BeautyReportRecord[]> {
    const rows = await this.db.prepare(
      "SELECT id,user_id,image_id,image_url,thumbnail_url,level,status,analysis_json,analysis_version,created_at,decision_answers_json FROM beauty_reports WHERE user_id=? ORDER BY created_at DESC"
    ).all<any>({ params: [userId] });
    return (rows.results ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      uploadId: r.image_id,
      imageUrl: r.image_url,
      thumbnailUrl: r.thumbnail_url,
      reportLevel: r.level,
      status: r.status,
      reportJson: this.safeParse(r.analysis_json),
      createdAt: r.created_at,
      analysisVersion: r.analysis_version,
      decisionAnswers: r.decision_answers_json
        ? this.safeParse(r.decision_answers_json)
        : undefined,
    }));
  }

  async updateStatus(id: string, status: string): Promise<BeautyReportRecord | null> {
    const result = await this.db.prepare("UPDATE beauty_reports SET status=? WHERE id=?").bind(status, id).run();
    if (result.success && result.meta?.changes === 0) return null;
    return this.getReport(id);
  }

  private safeParse(str: string): unknown {
    try { return JSON.parse(str); } catch { return { raw: str }; }
  }
}
