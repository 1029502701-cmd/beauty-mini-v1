/**
 * AnalysisTask - tracks async beauty analysis tasks
 * Used by the WeChat mini-program createAnalysisTask / getAnalysisTask flow.
 */

export type AnalysisTaskStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface AnalysisTask {
  /** Internal DB primary key (UUID) */
  id: string;
  /** Display task ID shown to the mini-program client */
  taskId: string;
  /** Reference to the R2 upload object */
  uploadId: string;
  /** User ID (guest or WeChat-bound) */
  userId: string;
  /** Task status */
  status: AnalysisTaskStatus;
  /** Progress percentage 0-100 */
  progress: number;
  /** Report ID (set when status === 'success') */
  reportId?: string;
  /** Error message (set when status === 'failed') */
  errorMessage?: string;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

export interface CreateAnalysisTaskRequest {
  uploadId: string;
  imageUrl?: string;
}

export interface CreateAnalysisTaskResponse {
  taskId: string;
  status: AnalysisTaskStatus;
  progress: number;
}

export interface GetAnalysisTaskResponse {
  taskId: string;
  status: AnalysisTaskStatus;
  progress: number;
  reportId?: string;
  errorMessage?: string;
}

export interface AnalysisTaskError {
  status: 'error';
  message: string;
}
