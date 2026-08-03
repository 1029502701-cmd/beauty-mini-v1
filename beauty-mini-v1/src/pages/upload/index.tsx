import React, { useState, useCallback } from "react";
import { navigate } from "@taro/router";
import { uploadService } from "@/services/upload";
import { imageValidator } from "@/services/image-validation/ImageValidator";
import type { UploadResult } from "@/types";
import "./index.css";

type UploadPhase = "idle" | "preview" | "uploading" | "analyzing" | "failed";

const UploadPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ filename: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  const pickImage = useCallback(async (sourceType: "album" | "camera") => {
    setError(null);
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: [sourceType],
      });
      if (res.tempFiles.length > 0) {
        const file = res.tempFiles[0];
        setSelectedImage(file.tempFilePath);
        setPreviewUrl(file.tempFilePath);
        const filename = file.tempFilePath.split("/").pop() || "image.jpg";
        setImageInfo({ filename, size: file.size });
        setPhase("preview");
      } else {
        setError("未选择图片");
      }
    } catch (err) {
      console.error("[Upload] pickImage error:", err);
      setError(sourceType === "camera" ? "拍照失败，请重试" : "相册选择失败，请重试");
    }
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!selectedImage || !imageInfo) {
      setError("请选择一张图片");
      return;
    }

    setPhase("uploading");
    setError(null);

    // Step 1: Image format/size validation
    const validation = await imageValidator.validateImage(selectedImage);
    if (!validation.valid) {
      console.error("[Upload] validation failed:", validation.message);
      setPhase("failed");
      setError(validation.message || "图片验证失败，请重新选择");
      return;
    }

    // Step 2: Face presence detection
    const faceResult = await imageValidator.detectFace(selectedImage);
    if (!faceResult.hasFace) {
      console.warn("[Upload] No face detected, blocking upload");
      setPhase("failed");
      setError("未检测到人脸，请上传正面清晰人像照片");
      return;
    }

    try {
      const result: UploadResult = await uploadService.uploadImage(
        selectedImage,
        imageInfo.filename,
        imageInfo.size
      );

      if (result.success && result.uploadId) {
        setUploadId(result.uploadId);
        setImageUrl(result.imageUrl || result.uploadId || selectedImage);
        setPhase("analyzing");
      } else {
        setPhase("failed");
        setError(result.message || "上传失败，请重试");
      }
    } catch (err) {
      console.error("[Upload] confirm error:", err);
      setPhase("failed");
      setError("上传过程中发生错误，请检查网络连接后重试");
    }
  }, [selectedImage, imageInfo]);

  const handleReselect = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setImageInfo(null);
    setError(null);
    setPhase("idle");
    setUploadId(null);
    setImageUrl("");
  };

  const handleCancel = () => {
    navigate({ url: "/pages/home" });
  };

  const handleRetry = () => {
    setPhase("preview");
    setError(null);
  };

  React.useEffect(() => {
    if (phase === "analyzing" && uploadId) {
      const timer = setTimeout(() => {
        // Fixed: added "&" separator between uploadId and imageUrl params
        const params = "uploadId=" + encodeURIComponent(uploadId) + "&imageUrl=" + encodeURIComponent(imageUrl);
        navigate({ url: "/pages/analyzing?" + params });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, uploadId, imageUrl]);

  if (phase === "idle" || phase === "preview") {
    return (
      <div className="upload-page">
        <div className="upload-header">
          <h1 className="upload-title">开始你的美学分析</h1>
          <p className="upload-subtitle">
            上传一张清晰正脸照<br />
            AI将生成你的专属报告
          </p>
        </div>

        {phase === "preview" && previewUrl ? (
          <>
            <div className="preview-card">
              <img src={previewUrl} alt="预览" className="preview-image" />
              <button className="btn-reselect" onClick={handleReselect}>重新选择</button>
            </div>
            {imageInfo && (
              <div className="image-meta">
                <span>{Math.round(imageInfo.size / 1024)} KB</span>
              </div>
            )}
            <div className="upload-actions">
              <button className="btn btn-ghost" onClick={handleCancel}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmUpload}
                disabled={phase === "uploading"}
              >
                {phase === "uploading" ? "上传中.." : "开始AI分析"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="upload-area" onClick={() => pickImage("album")}>
              <div className="upload-area-inner">
                <div className="upload-avatar-icon">&#x1F574;</div>
                <p className="upload-area-text">点击上传照片</p>
                <p className="upload-area-hint">或拍摄照片</p>
              </div>
            </div>

            <div className="photo-spec">
              <div className="spec-group spec-group--good">
                <span className="spec-label">最佳照片</span>
                <div className="spec-items">
                  <span className="spec-item">&#x2714; 正脸</span>
                  <span className="spec-item">&#x2714; 自然光</span>
                  <span className="spec-item">&#x2714; 五官无遮挡</span>
                </div>
              </div>
              <div className="spec-group spec-group--bad">
                <span className="spec-label">避免</span>
                <div className="spec-items">
                  <span className="spec-item">&#x2718; 侧脸</span>
                  <span className="spec-item">&#x2718; 多人</span>
                  <span className="spec-item">&#x2718; 强光滤镜</span>
                </div>
              </div>
            </div>

            <div className="privacy-note">
              <div className="privacy-row">
                <span className="privacy-check">&#x2714;</span>
                <span>仅用于AI分析</span>
              </div>
              <div className="privacy-row">
                <span className="privacy-check">&#x2714;</span>
                <span>不公开展示</span>
              </div>
              <div className="privacy-row">
                <span className="privacy-check">&#x2714;</span>
                <span>可随时删除</span>
              </div>
            </div>

            <div className="upload-actions">
              <button className="btn btn-secondary btn-center" onClick={() => pickImage("album")}>
                {String.fromCharCode(0x1F574)} 从相册选择
              </button>
              <button className="btn btn-secondary btn-center" onClick={() => pickImage("camera")}>
                {String.fromCharCode(0x1F4F7)} 拍摄照片
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="error-msg">
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="upload-page">
        <div className="confirm-card">
          <div className="confirm-check uploading-check">&#x2B61;</div>
          <h2>上传图片中</h2>
          <p>正在将照片上传至服务器..</p>
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="upload-page">
        <div className="confirm-card">
          <div className="confirm-check">&#x2714;</div>
          <h2>照片已确认</h2>
          <p>正在启动 AI 美学分析...</p>
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="upload-page">
        <div className="confirm-card">
          <div className="confirm-check failed-check">&#x2718;</div>
          <h2>上传失败</h2>
          <p>{error || "请重试"}</p>
          <div className="upload-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-primary" onClick={handleRetry}>重新上传</button>
            <button className="btn btn-ghost" onClick={handleCancel}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UploadPage;