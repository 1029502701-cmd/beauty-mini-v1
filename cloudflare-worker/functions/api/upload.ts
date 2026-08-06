export interface UploadRequest {
  imageBase64: string;
  userId?: string;
}

export interface UploadResponse {
  status: "success" | "error";
  message: string;
  fileId?: string;
  imageUrl?: string;
}
