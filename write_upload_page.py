content = '''import React, { useState, useCallback, useEffect } from "react";
import { navigate } from "@taro/router";
import { uploadService } from "@/services/upload";
import "./index.css";

const UploadPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{filename: string; size: number} | null>(null);
  const [confirmState, setConfirmState] = useState<"idle"|"confirmed">("idle");
  const [uploadIdForNavigate, setUploadIdForNavigate] = useState<string | null>(null);
  const [imageUrlForNavigate, setImageUrlForNavigate] = useState<string>("");

  const handleGallerySelect = useCallback(async () => {
    setError(null);
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album"],
      });
      if (res.tempFiles.length > 0) {
        handleImageSelected(res.tempFiles[0].tempFilePath, res.tempFiles[0].size);
      } else {
        setError("未选择图片");
      }
    } catch (err) {
      console.error("Gallery selection error:", err);
      setError("相册选择失败，请重试");
    }
  }, []);

  const handleCameraSelect = useCallback(async () => {
    setError(null);
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["camera"],
      });
      if (res.tempFiles.length > 0) {
        handleImageSelected(res.tempFiles[0].tempFilePath, res.tempFiles[0].size);
      } else {
        setError("未选择图片");
      }
    } catch (err) {
      console.error("Camera selection error:", err);
      setError("拍照失败，请重试");
    }
  }, []);

  const handleImageSelected = (filePath: string, fileSize: number) => {
    setSelectedImage(filePath);
    setPreviewUrl(filePath);
    const filename = filePath.split("/").pop() || "image.jpg";
    setImageInfo({ filename, size: fileSize });
    setError(null);
    setConfirmState("idle");
  };

  const handleConfirmUpload = useCallback(async () => {
    if (!selectedImage || !imageInfo) {
      setError("请选择一张图片");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await uploadService.uploadImage(
        selectedImage,
        imageInfo.filename,
        imageInfo.size
      );

      if (result.success) {
        const newUploadId = result.uploadId || "upload_" + Date.now();
        setConfirmState("confirmed");
        setUploadIdForNavigate(newUploadId);
        setImageUrlForNavigate(result.imageUrl || "");
      } else {
        setError(result.message || "上传失败");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("上传过程中发生错误，请检查网络连接后重试");
    } finally {
      setLoading(false);
    }
  }, [selectedImage, imageInfo]);

  const handleReselect = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setImageInfo(null);
    setError(null);
    setConfirmState("idle");
    setUploadIdForNavigate(null);
  };

  const handleCancel = () => {
    navigate({ url: "/pages/home" });
  };

  useEffect(() => {
    if (confirmState === "confirmed" && uploadIdForNavigate) {
      if (!imageUrlForNavigate) {
        setError("图片上传失败，请重新上传");
        setConfirmState("idle");
        return;
      }
      const timer = setTimeout(() => {
        const params = "uploadId=" + uploadIdForNavigate + "\u0026imageUrl=" + encodeURIComponent(imageUrlForNavigate);
        navigate({ url: "/pages/analyzing?" + params });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [confirmState, uploadIdForNavigate, imageUrlForNavigate]);

  if (confirmState === "confirmed") {
    return (
      <div className="upload-page">
        <div className="confirm-card">
          <div className="confirm-check">✓</div>
          <h2>照片已确认</h2>
          <p>正在启动 AI 美学分析...</p>
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="upload-page">
        <div className="upload-header">
          <h1 className="upload-title">开始你的美学分析</h1>
          <p className="upload-subtitle">
            上传一张清晰正脸照<br />
            AI将生成你的专属报告
          </p>
        </div>

        <div className="upload-area" onClick={handleGallerySelect}>
          <div className="upload-area-inner">
            <div className="upload-avatar-icon">👤</div>
            <p className="upload-area-text">点击上传照片</p>
            <p className="upload-area-hint">或拍摄照片</p>
          </div>
        </div>

        <div className="photo-spec">
          <div className="spec-group spec-group--good">
            <span className="spec-label">最佳照片</span>
            <div className="spec-items">
              <span className="spec-item">✓ 正脸</span>
              <span className="spec-item">✓ 自然光</span>
              <span className="spec-item">✓ 五官无遮挡</span>
            </div>
          </div>
          <div className="spec-group spec-group--bad">
            <span className="spec-label">避免</span>
            <div className="spec-items">
              <span className="spec-item">❌ 侧脸</span>
              <span className="spec-item">❌ 多人</span>
              <span className="spec-item">❌ 强滤镜</span>
            </div>
          </div>
        </div>

        <div className="privacy-note">
          <div className="privacy-row">
            <span className="privacy-check">✓</span>
            <span>仅用于 AI 分析</span>
          </div>
          <div className="privacy-row">
            <span className="privacy-check">✓</span>
            <span>不公开展示</span>
          </div>
          <div className="privacy-row">
            <span className="privacy-check">✓</span>
            <span>可随时删除</span>
          </div>
        </div>

        <div className="upload-actions">
          <button className="btn btn-secondary" onClick={handleGallerySelect}>
            📷 从相册选择
          </button>
          <button className="btn btn-secondary" onClick={handleCameraSelect}>
            📸 拍摄照片
          </button>
        </div>

        {error && (
          <div className="error-msg">
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1 className="upload-title">照片预览</h1>
        <p className="upload-subtitle">确认照片后开始 AI 美学分析</p>
      </div>

      <div className="preview-card">
        <img src={previewUrl} alt="预览" className="preview-image" />
        <button className="btn-reselect" onClick={handleReselect}>重新选择</button>
      </div>

      {imageInfo && (
        <div className="image-meta">
          <span>{Math.round(imageInfo.size / 1024)} KB</span>
        </div>
      )}

      {error && (
        <div className="error-msg">
          <p>{error}</p>
        </div>
      )}

      <div className="upload-actions">
        <button className="btn btn-ghost" onClick={handleCancel}>取消</button>
        <button
          className={"btn btn-primary " + (loading ? "loading" : "")}
          onClick={handleConfirmUpload}
          disabled={!selectedImage || loading}
        >
          {loading ? "分析中..." : "开始 AI 分析"}
        </button>
      </div>

      <div className="privacy-note">
        <div className="privacy-row">
          <span className="privacy-check">✓</span>
          <span>仅用于 AI 分析</span>
        </div>
        <div className="privacy-row">
          <span className="privacy-check">✓</span>
          <span>可随时删除</span>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
'''
with open(r'C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\pages\upload\index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
