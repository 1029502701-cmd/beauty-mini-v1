import { UploadResult, BeautyImage } from "@/types";
import userService from "./user-service";
import { getAPIBase, injectSessionHeader } from "./api-client";

// ─── Dev-only logging ────────────────────────────────────────────────────────────
function _logUploadEvent(event: string, detail?: unknown): void {
  if (typeof wx !== "undefined" && wx.getSystemInfoSync && wx.getSystemInfoSync().environment !== "develop" && wx.getSystemInfoSync().environment !== "test") return;
  if (typeof console === "undefined") return;
  const tag = "[upload]";
  const ts = new Date().toISOString();
  if (detail) {
    console.log(`${tag} ${ts} ${event}`, JSON.stringify(detail));
  } else {
    console.log(`${tag} ${ts} ${event}`);
  }
}

export class UploadService {
  private uploadQueue: BeautyImage[] = [];

  async pickFromGallery(): Promise<string | null> {
    if (typeof wx === "undefined" || !wx.chooseMedia) return null;
    return new Promise<string | null>((resolve) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album"],
        success: (res) => {
          const path = res.tempFiles[0].tempFilePath;
          _logUploadEvent("gallery_pick_success", { path });
          resolve(path);
        },
        fail: (err) => {
          _logUploadEvent("gallery_pick_fail", err);
          wx.showToast({ title: "相册选择失败", icon: "none" });
          resolve(null);
        }
      });
    });
  }

  async pickFromCamera(): Promise<string | null> {
    if (typeof wx === "undefined" || !wx.chooseMedia) return null;
    return new Promise<string | null>((resolve) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["camera"],
        success: (res) => {
          const path = res.tempFiles[0].tempFilePath;
          _logUploadEvent("camera_pick_success", { path });
          resolve(path);
        },
        fail: (err) => {
          _logUploadEvent("camera_pick_fail", err);
          wx.showToast({ title: "拍照失败", icon: "none" });
          resolve(null);
        }
      });
    });
  }

  private validateImage(filePath: string, fileName: string, fileSize: number): { success: boolean; message: string } {
    if (fileSize > 5 * 1024 * 1024) return { success: false, message: "图片大小超过限制，最大5MB" };
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return { success: false, message: "请上传jpg/png格式的图片" };
    return { success: true, message: "验证通过" };
  }

  async uploadImage(filePath: string, fileName: string, fileSize: number): Promise<UploadResult> {
    const validation = this.validateImage(filePath, fileName, fileSize);
    if (!validation.success) return { success: false, message: validation.message } as UploadResult;

    if (typeof wx !== "undefined" && wx.uploadFile) {
      return new Promise((resolve) => {
        const sessionHeaders: Record<string, string> = {};
        injectSessionHeader(sessionHeaders);
        _logUploadEvent("upload_start", { url: getAPIBase() + "/api/upload", filePath, fileName, fileSize });
        wx.uploadFile({
          url: getAPIBase() + "/api/upload",
          filePath,
          name: "image",
          formData: { uploadId: "upload_" + Date.now() },
          header: { ...sessionHeaders, "Content-Type": "multipart/form-data" },
          timeout: 30000,
          success: (wxRes) => {
            _logUploadEvent("upload_success", { statusCode: wxRes.statusCode, raw: wxRes.data });
            if (wxRes.statusCode === 200) {
              try {
                const data = JSON.parse(wxRes.data);
                if (data.success) {
                  const { uploadId, imageKey } = data;
                  this.uploadQueue.push({
                    id: uploadId, url: imageKey || filePath, filename: fileName,
                    size: fileSize, mimeType: "image/jpeg", timestamp: new Date().toISOString(),
                    status: "uploaded", });
                  resolve({ success: true, message: "图片上传成功", uploadId, imageUrl: imageKey });
                  return;
                }
              } catch { /* ignore parse error */ }
            }
            resolve({ success: false, message: "上传失败，请重试" });
          },
          fail: (err) => {
            _logUploadEvent("upload_fail", err);
            resolve({ success: false, message: (err.errMsg || "上传失败").includes("timeout") ? "上传超时" : "上传失败" });
          }
        });
      });
    }

    return { success: false, message: "当前环境不支持图片上传" };
  }

  getUploadQueue() { return [...this.uploadQueue]; }
}

export const uploadService = new UploadService();


