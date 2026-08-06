import { View, Text } from '@tarojs/components'
import React, { useState, useCallback } from "react";
import { navigate } from "@taro/router";
import { uploadService } from "@/services/upload";
import { imageValidator } from "@/services/image-validation/ImageValidator";
import type { UploadResult } from "@/types";
import "./index.css";

type UploadPhase = "idle" | "preview" | "uploading" | "analyzing" | "scanning" | "failed";

const UploadPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ filename: string; size: number; width?: number; height?: number } | null>(null);
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
        // Get image dimensions
        const tempInfo = await new Promise<any>((resolve) => {
          wx.getImageInfo({
            src: file.tempFilePath,
            success: resolve,
            fail: () => resolve({ width: 0, height: 0 }),
          });
        });
        setImageInfo({ filename, size: file.size, width: tempInfo.width, height: tempInfo.height });
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
      console.log("[upload page result]", result);

      if (result.success && result.uploadId) {
        setUploadId(result.uploadId);
        setImageUrl(result.imageUrl || result.uploadId || selectedImage);
        setPhase("analyzing");
        console.log("[set analyzing phase]", result.uploadId, result.imageUrl);
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

  // When analyzing completes, transition to scanning animation
  React.useEffect(() => {
    if (phase === "analyzing" && uploadId) {
      const timer = setTimeout(() => {
        setPhase("scanning");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, uploadId]);

  // When scanning animation completes, navigate to analyzing page
  React.useEffect(() => {
    if (phase === "scanning" && uploadId) {
      const timer = setTimeout(() => {
        const params = "uploadId=" + encodeURIComponent(uploadId) + "&imageUrl=" + encodeURIComponent(imageUrl);
        console.log("[navigate analyzing]", params);
        navigate({ url: "/pages/analyzing/index?" + params });
      }, 2500); // 2.5s scanning animation
      return () => clearTimeout(timer);
    }
  }, [phase, uploadId, imageUrl]);

  if (phase === "idle" || phase === "preview") {
    return (
      <View className="upload-page">
        <View className="upload-header">
          <Text className="upload-title">开始你的美学分析</Text>
          <Text className="upload-subtitle">
            上传一张清晰正面照<br />
            AI 将生成你的专属报告
          </Text>
        </View>

        {phase === "preview" && selectedImage ? (
          <>
            {/* Blurred preview card */}
            <View className="preview-card">
              <View className="preview-image-wrapper">
                <image
                  src={previewUrl!}
                  mode="widthFix"
                  className="preview-image"
                  style={{ maxWidth: "100%" }}
                />
                <View className="preview-blur-overlay"></View>
              </View>
              <View className="preview-info">
                <Text className="preview-status">✓ 已选择照片</Text>
                <Text className="preview-meta">
                  {imageInfo?.width ? imageInfo.width + "×" + imageInfo.height : ""}
                  {imageInfo ? " · " + Math.round(imageInfo.size / 1024) + " KB" : ""}
                </Text>
              </View>
              <button className="btn-reselect" onClick={handleReselect}>
                重新选择
              </button>
            </View>

            {/* Video guide area */}
            <View className="video-guide">
              <Text className="video-guide-title">AI 分析过程预览</Text>
              <View className="video-guide-content">
                <Text className="video-guide-icon">▶</Text>
                <Text className="video-guide-hint">点击播放分析流程说明</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View className="upload-actions">
              <button
                className="btn btn-primary"
                onClick={handleConfirmUpload}
                disabled={phase === "uploading"}
              >
                {phase === "uploading" ? "上传中..." : "开始 AI 分析"}
              </button>
              <button className="btn btn-ghost" onClick={handleCancel}>取消</button>
            </View>
          </>
        ) : (
          <>
            <View className="upload-area" onClick={() => pickImage("album")}>
              <View className="upload-area-inner">
                <View className="upload-avatar-icon">📷</View>
                <Text className="upload-area-text">点击上传照片</Text>
                <Text className="upload-area-hint">或拍摄照片</Text>
              </View>
            </View>

            <View className="photo-spec">
              <View className="spec-group spec-group--good">
                <Text className="spec-label">最佳照片</Text>
                <View className="spec-items">
                  <Text className="spec-item">✓ 正面</Text>
                  <Text className="spec-item">✓ 自然光</Text>
                  <Text className="spec-item">✓ 五官无遮挡</Text>
                </View>
              </View>
              <View className="spec-group spec-group--bad">
                <Text className="spec-label">避免</Text>
                <View className="spec-items">
                  <Text className="spec-item">✗ 侧脸</Text>
                  <Text className="spec-item">✗ 多人</Text>
                  <Text className="spec-item">✗ 强光滤镜</Text>
                </View>
              </View>
            </View>

            <View className="privacy-note">
              <View className="privacy-row">
                <Text className="privacy-check">✓</Text>
                <Text>仅用于 AI 分析</Text>
              </View>
              <View className="privacy-row">
                <Text className="privacy-check">✓</Text>
                <Text>不公开展示</Text>
              </View>
              <View className="privacy-row">
                <Text className="privacy-check">✓</Text>
                <Text>可随时删除</Text>
              </View>
            </View>

            <View className="upload-actions">
              <button className="btn btn-secondary btn-center" onClick={() => pickImage("album")}>
                {String.fromCharCode(0x1F574)} 从相册选择
              </button>
              <button className="btn btn-secondary btn-center" onClick={() => pickImage("camera")}>
                {String.fromCharCode(0x1F4F7)} 拍摄照片
              </button>
            </View>
          </>
        )}

        {error && (
          <View className="error-msg">
            <Text>{error}</Text>
          </View>
        )}
      </View>
    );
  }

  if (phase === "uploading") {
    return (
      <View className="upload-page">
        <View className="confirm-card">
          <View className="confirm-check uploading-check">⚡</View>
          <Text>上传照片中</Text>
          <Text>正在将照片上传至服务器...</Text>
          <View className="loading-dots">
            <Text></Text><Text></Text><Text></Text>
          </View>
        </View>
      </View>
    );
  }

  if (phase === "scanning") {
    return (
      <View className="upload-page">
        <View className="scanning-overlay">
          <View className="scanning-image-wrapper">
            <image
              src={previewUrl!}
              mode="widthFix"
              className="scanning-image"
              style={{ maxWidth: "100%" }}
            />
            <View className="scan-line"></View>
            <View className="face-detection-points">
              <View className="detect-point" style={{ top: "25%", left: "35%" }}></View>
              <View className="detect-point" style={{ top: "25%", left: "65%" }}></View>
              <View className="detect-point" style={{ top: "45%", left: "50%" }}></View>
              <View className="detect-point" style={{ top: "60%", left: "42%" }}></View>
              <View className="detect-point" style={{ top: "60%", left: "58%" }}></View>
            </View>
          </View>
          <View className="scanning-info">
            <Text className="scanning-title">AI 美学分析中</Text>
            <Text className="scanning-subtitle">正在识别你的面部特征...</Text>
            <View className="loading-dots">
              <Text></Text><Text></Text><Text></Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (phase === "failed") {
    return (
      <View className="upload-page">
        <View className="confirm-card">
          <View className="confirm-check failed-check">✗</View>
          <Text>上传失败</Text>
          <Text>{error || "请重试"}</Text>
          <View className="upload-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-primary" onClick={handleRetry}>重新上传</button>
            <button className="btn btn-ghost" onClick={handleCancel}>返回首页</button>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

export default UploadPage;
