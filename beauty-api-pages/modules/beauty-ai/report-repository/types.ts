/**
 * Database record for a beauty report, matching the beauty_reports D1 table.
 */
export interface BeautyReportRecord {
  id: string;
  userId: string;
  uploadId: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  reportLevel: string;
  status: string;
  reportJson: unknown;
  createdAt: string;
  analysisVersion?: string;
  decisionAnswers?: unknown;
}

/**
 * Input for creating a report via D1.
 */
export interface CreateReportInput {
  userId: string;
  uploadId: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  reportLevel: string;
  reportJson: unknown;
  decisionAnswersJson?: string | null;
}

/**
 * Result of a report creation.
 */
export interface CreateReportResult {
  id: string;
  createdAt: string;
}

/**
 * User decision answers stored alongside a report.
 */
export interface ReportDecisionAnswers {
  style: "natural" | "refined" | "charismatic" | "individual";
  occasion: "daily" | "date" | "workplace" | "photo";
  tolerance: "conservative" | "normal" | "bold";
  submittedAt: string;
}
