/**
 * Upload result returned after a successful R2 upload.
 */
export interface UploadResult {
  uploadId: string;
  imageKey: string;
  imageUrl?: string;
}
