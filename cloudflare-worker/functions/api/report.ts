export interface ReportQuery {
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface ReportItem {
  id: string;
  userId: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  level: string;
  status: "pending" | "processing" | "completed" | "failed";
  faceMetricsJson: string;
  analysisJson: string;
  createdAt: string;
  expireAt: string | null;
}

export interface GetReportResponse {
  status: "success" | "error";
  report?: ReportItem;
  message?: string;
}

export interface GetReportsResponse {
  status: "success" | "error";
  reports?: ReportItem[];
  total?: number;
  message?: string;
}
