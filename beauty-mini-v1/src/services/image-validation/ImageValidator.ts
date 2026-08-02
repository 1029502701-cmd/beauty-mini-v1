import type { ValidationResult } from '@/types/beauty-validation';

export class ImageValidator {
  private static readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  private static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly MIN_SHORT_EDGE_PX = 200;
  // Skin-tone range in HSV: hue 0-25 (reddish-orange), sat 20-140, val 50-255
  private static readonly SKIN_HUE_MIN = 0;
  private static readonly SKIN_HUE_MAX = 25;
  private static readonly SKIN_SAT_MIN = 20;
  private static readonly SKIN_SAT_MAX = 140;
  private static readonly SKIN_VAL_MIN = 50;
  private static readonly SKIN_VAL_MAX = 255;
  // Require at least this fraction of center-region pixels to be skin-tone
  private static readonly FACE_SKIN_RATIO_THRESHOLD = 0.08;

  async validateImage(filePath: string): Promise<ValidationResult> {
    if (!filePath || typeof filePath !== 'string' || filePath.length === 0) {
      return { valid: false, code: 'IMAGE_EMPTY', message: '图片读取失败，请重新选择' };
    }

    const ext = this.getExtension(filePath);
    if (!ImageValidator.ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
      return { valid: false, code: 'INVALID_FORMAT', message: '请上传 jpg、png 或 webp 图片' };
    }

    try {
      const sizeResult = await this.getFileSize(filePath);
      if (sizeResult.size > ImageValidator.MAX_SIZE_BYTES) {
        return { valid: false, code: 'IMAGE_TOO_LARGE', message: '图片大小不能超过5MB' };
      }

      const sizeInfo = await this.getImageDimensions(filePath);
      const shortEdge = Math.min(sizeInfo.width, sizeInfo.height);
      if (shortEdge < ImageValidator.MIN_SHORT_EDGE_PX) {
        return { valid: false, code: 'IMAGE_TOO_SMALL', message: '图片分辨率过低，请选择更清晰的照片' };
      }

      return { valid: true };
    } catch (_err) {
      return { valid: false, code: 'IMAGE_EMPTY', message: '图片读取失败，请重新选择' };
    }
  }

  /**
   * Detect whether a face is present in the image using canvas pixel analysis.
   * Looks for skin-tone pixels concentrated in the center region of the image.
   * Falls back to always-true if canvas is unavailable.
   */
  async detectFace(filePath: string): Promise<{ hasFace: boolean; confidence: number }> {
    try {
      const bitmap = await wx.createImageBitmap(filePath);
      const imgWidth = bitmap.width;
      const imgHeight = bitmap.height;

      const canvas = wx.createCanvas();
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, imgWidth, imgHeight);
      const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
      const data = imageData.data;

      // Define center region: middle 60% width, upper 70% height (where a face typically sits)
      const centerX = Math.floor(imgWidth * 0.2);
      const centerY = Math.floor(imgHeight * 0.3);
      const regionW = Math.floor(imgWidth * 0.6);
      const regionH = Math.floor(imgHeight * 0.7);

      let skinPixelCount = 0;
      let totalPixelCount = 0;

      for (let y = centerY; y < Math.min(centerY + regionH, imgHeight); y++) {
        for (let x = centerX; x < Math.min(centerX + regionW, imgWidth); x++) {
          const idx = (y * imgWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Skip very dark or very bright pixels (noise / shadows)
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          if (maxC - minC < 15) continue; // grayscale / noise
          if (maxC < 50) continue; // too dark
          if (maxC > 230 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10) continue; // overexposed white

          // Convert RGB to HSV for skin-tone detection
          const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const delta = max - min;
          let h = 0;
          if (delta > 0) {
            if (max === rNorm) h = 60 * (((gNorm - bNorm) / delta) % 6);
            else if (max === gNorm) h = 60 * ((bNorm - rNorm) / delta + 2);
            else h = 60 * ((rNorm - gNorm) / delta + 4);
            if (h < 0) h += 360;
          }
          const s = max === 0 ? 0 : delta / max;
          const v = max;

          // Check skin-tone HSV range
          if (
            h >= ImageValidator.SKIN_HUE_MIN && h <= ImageValidator.SKIN_HUE_MAX &&
            s >= ImageValidator.SKIN_SAT_MIN / 255 && s <= ImageValidator.SKIN_SAT_MAX / 255 &&
            v >= ImageValidator.SKIN_VAL_MIN / 255 && v <= ImageValidator.SKIN_VAL_MAX / 255
          ) {
            skinPixelCount++;
          }
          totalPixelCount++;
        }
      }

      // Release bitmap to free memory
      if (bitmap.close) bitmap.close();

      const skinRatio = totalPixelCount > 0 ? skinPixelCount / totalPixelCount : 0;
      const confidence = Math.min(1, skinRatio / ImageValidator.FACE_SKIN_RATIO_THRESHOLD);
      const hasFace = skinRatio >= ImageValidator.FACE_SKIN_RATIO_THRESHOLD;

      return { hasFace, confidence: Math.round(confidence * 100) / 100 };
    } catch (err) {
      // Canvas unavailable (e.g. server-side render, or wx.createImageBitmap not supported)
      // Fall back to lenient check — allow upload, backend will do real detection
      console.warn('[ImageValidator] detectFace fallback (canvas unavailable):', err);
      return { hasFace: true, confidence: 0.5 };
    }
  }

  private getExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  private getFileSize(filePath: string): Promise<{ size: number }> {
    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined' || !wx.getFileSystemManager) {
        resolve({ size: 0 });
        return;
      }
      wx.getFileSystemManager().getFileInfo({
        filePath,
        success: (res) => resolve(res),
        fail: () => reject(new Error('getFileInfo failed')),
      });
    });
  }

  private getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined' || !wx.getImageInfo) {
        resolve({ width: 0, height: 0 });
        return;
      }
      wx.getImageInfo({
        src: filePath,
        success: (res) => resolve({ width: res.width, height: res.height }),
        fail: () => reject(new Error('getImageInfo failed')),
      });
    });
  }
}

export const imageValidator = new ImageValidator();
