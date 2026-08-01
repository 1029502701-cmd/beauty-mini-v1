import { UploadResult, BeautyImage } from "@/types";
import userService from "./user-service";
import { getAPIBase, injectSessionHeader } from "./api-client";

export class UploadService {
  private uploadQueue: BeautyImage[] = [];

  async pickFromGallery(): Promise<string | null> {
    if (typeof wx === "undefined" || !wx.chooseImage) return null;
    return new Promise<string | null>((resolve) => {
      wx.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album"],
        success: (res) => res.tempFiles.length > 0 ? resolve(res.tempFiles[0].tempFilePath) : resolve(null),
        fail: (err) => {
          wx.showToast({ title: "相册选择失败", icon: "none" });
          resolve(null);
        }
      });
    });
  }

  async pickFromCamera(): Promise<string | null> {
    if (typeof wx === "undefined" || !wx.chooseImage) return null;
    return new Promise<string | null>((resolve) => {
      wx.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["camera"],
        success: (res) => res.tempFiles.length > 0 ? resolve(res.tempFiles[0].tempFilePath) : resolve(null),
        fail: (err) => {
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

  /**
   * Upload image to POST /api/beauty/upload (multipart/form-data)
   * Returns { uploadId, imageKey } from backend response.
   */
  async uploadImage(filePath: string, fileName: string, fileSize: number): Promise<UploadResult> {
    const validation = this.validateImage(filePath, fileName, fileSize);
    if (!validation.success) return { success: false, message: validation.message } as UploadResult;

    if (typeof wx !== "undefined" && wx.uploadFile) {
      return new Promise((resolve) => {
        const sessionHeaders: Record<string, string> = {};
        injectSessionHeader(sessionHeaders);
        wx.uploadFile({
          url: getAPIBase() + "/api/beauty/upload",
          filePath,
          name: "image",
          header: { ...sessionHeaders, "Content-Type": "multipart/form-data" },
          timeout: 30000,
          success: (wxRes) => {
            if (wxRes.statusCode === 200) {
              try {
                const data = JSON.parse(wxRes.data);
                if (data.success) {
                  const { uploadId, imageKey } = data;
                  this.uploadQueue.push({
                    id: uploadId, url: imageKey || filePath, filename: fileName,
                    size: fileSize, mimeType: "image/jpeg", timestamp: new Date().toISOString(),
                    status: "uploaded", imageUrl: imageKey
                  });
                  resolve({ success: true, message: "图片上传成功", uploadId, imageUrl: imageKey });
                  return;
                }
              } catch { /* ignore parse error */ }
            }
            resolve({ success: false, message: "上传失败，请重试" });
          },
          fail: (err) => {
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
