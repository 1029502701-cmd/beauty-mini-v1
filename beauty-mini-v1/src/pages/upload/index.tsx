import { View, Text, Image } from "@tarojs/components";
import React, { useState, useCallback, useEffect } from "react";
import { navigate } from "@taro/router";
import { uploadService } from "@/services/upload";
import { imageValidator } from "@/services/image-validation/ImageValidator";
import type { UploadResult } from "@/types";
import "./index.css";

type UploadPhase = "idle" | "preview" | "uploading" | "analyzing";

const STAGES = [
  { id: "s1", icon: "📷", title: "确认照片", subtitle: "正在验证上传的图片..." },
  { id: "s2", icon: "👁️", title: "面部检测", subtitle: "正在识别面部特征点..." },
  { id: "s3", icon: "✨", title: "脸型分析", subtitle: "正在分析脸型轮廓比例..." },
  { id: "s4", icon: "💄", title: "五官解读", subtitle: "正在解读眼、眉、唇特征..." },
  { id: "s5", icon: "🎨", title: "妆容匹配", subtitle: "正在匹配最适合您的妆容..." },
  { id: "s6", icon: "📊", title: "生成报告", subtitle: "正在为您整理专属美妆方案..." },
];

const UploadPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ filename: string; size: number; width?: number; height?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [currentStage, setCurrentStage] = useState(0);

  const pickImage = useCallback(async (sourceType: "album" | "camera") => {
    setError(null);
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ["image"], sourceType: [sourceType] });
      if (res.tempFiles.length > 0) {
        const file = res.tempFiles[0];
        setSelectedImage(file.tempFilePath);
        setPreviewUrl(file.tempFilePath);
        const filename = file.tempFilePath.split("/").pop() || "image.jpg";
        const tempInfo = await new Promise<any>((resolve) => {
          wx.getImageInfo({ src: file.tempFilePath, success: resolve, fail: () => resolve({ width: 0, height: 0 }) });
        });
        setImageInfo({ filename, size: file.size, width: tempInfo.width, height: tempInfo.height });
        setPhase("preview");
      }
    } catch (err) {
      console.error("[Upload] pickImage error:", err);
      setError(sourceType === "camera" ? "拍照失败，请重试" : "相册选择失败，请重试");
    }
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedImage || !imageInfo) return;
    setPhase("uploading");
    setError(null);

    const validation = await imageValidator.validateImage(selectedImage);
    if (!validation.valid) {
      setPhase("preview");
      setError(validation.message || "图片验证失败，请重新选择");
      return;
    }

    const faceResult = await imageValidator.detectFace(selectedImage);
    if (!faceResult.hasFace) {
      setPhase("preview");
      setError("未检测到人脸，请上传正面清晰人像照片");
      return;
    }

    try {
      const result: UploadResult = await uploadService.uploadImage(selectedImage, imageInfo.filename, imageInfo.size);
      if (result.success && result.uploadId) {
        setUploadId(result.uploadId);
        setImageUrl(result.imageUrl || result.uploadId || selectedImage);
        setPhase("analyzing");
        setCurrentStage(0);
      } else {
        setPhase("preview");
        setError(result.message || "上传失败，请重试");
      }
    } catch (err) {
      console.error("[Upload] confirm error:", err);
      setPhase("preview");
      setError("上传过程中发生错误，请检查网络连接后重试");
    }
  }, [selectedImage, imageInfo]);

  const handleCancel = () => {
    navigate({ url: "/pages/home" });
  };

  const handleReselect = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setImageInfo(null);
    setError(null);
    setPhase("idle");
    setUploadId(null);
    setImageUrl("");
  };

  useEffect(() => {
    if (phase !== "analyzing" || !uploadId) return;
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 800);
    const timeout = setTimeout(async () => {
      try {
        const imageKey = imageUrl || uploadId;
        const analyzeResult = await (await import("@/services/analyze")).analyzeService.analyzeImage(uploadId, imageKey);
        if (!analyzeResult.success) throw new Error(analyzeResult.error || "AI分析失败");
        const reportResult = await (await import("@/services/report")).default.createAndQueryReport(uploadId, imageKey, "first-look");
        if (!reportResult.success) throw new Error(reportResult.error || "报告生成失败");
        const reportId = reportResult.reportId || uploadId;
        navigate({ url: "/pages/result?reportId=" + encodeURIComponent(reportId) });
      } catch (err) {
        console.error("[Upload] analysis error:", err);
        setPhase("preview");
        const msg = err instanceof Error ? err.message : "AI分析失败，请重试";
        if (msg.includes("DAILY_LIMIT")) setError("今天次数已用完，请明天再试");
        else if (msg.includes("INSUFFICIENT_TOKEN")) setError("Token不足，请解锁后继续");
        else setError(msg);
      }
    }, STAGES.length * 800 + 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [phase, uploadId, imageUrl]);

  if (phase === "idle") {
    return (
      <View className="upload-page">
        <View className="upload-header">
          <Text className="upload-title">开始你的美学分析</Text>
          <Text className="upload-desc">上传一张清晰正面照，AI 将生成你的专属报告</Text>
        </View>
        <View className="upload-guide">
          <View className="guide-tip">
            <Text className="guide-tip-icon">💡</Text>
            <Text className="guide-tip-text">最佳照片：正面 · 自然光 · 五官无遮挡</Text>
          </View>
          <View className="guide-avoid">
            <Text className="avoid-text">避免：侧脸 · 多人 · 强光滤镜</Text>
          </View>
          <View className="privacy-line">
            <Text className="privacy-check">✓</Text>
            <Text className="privacy-text">仅用于 AI 分析 · 不公开 · 可随时删除</Text>
          </View>
        </View>
        <View className="upload-actions">
          <button className="upload-btn" onClick={() => pickImage("album")}>
            <Text className="upload-btn-icon">🖼️</Text>
            <Text className="upload-btn-text">从相册选择</Text>
          </button>
          <button className="upload-btn" onClick={() => pickImage("camera")}>
            <Text className="upload-btn-icon">📷</Text>
            <Text className="upload-btn-text">拍摄照片</Text>
          </button>
        </View>
      </View>
    );
  }

  if (phase === "preview") {
    return (
      <View className="upload-page">
        <View className="preview-section">
          <View className="preview-thumbnail-wrapper">
            <image src={previewUrl!} mode="widthFix" className="preview-thumbnail" />
            <View className="preview-blur-overlay" />
          </View>
          {error && <Text className="error-text">{error}</Text>}
        </View>
        <View className="preview-actions">
          <button className="analyze-btn" onClick={handleStartAnalysis}>
            <Text>开始 AI 分析</Text>
          </button>
          <button className="cancel-btn" onClick={handleCancel}>取消</button>
        </View>
      </View>
    );
  }

  if (phase === "uploading") {
    return (
      <View className="upload-page uploading-phase">
        <View className="small-preview">
          <image src={previewUrl!} mode="aspectFill" className="small-preview-img" />
        </View>
        <View className="uploading-content">
          <Text className="uploading-title">上传照片中</Text>
          <Text className="uploading-sub">正在将照片上传至服务器...</Text>
          <View className="loading-dots">
            <Text className="dot"></Text>
            <Text className="dot"></Text>
            <Text className="dot"></Text>
          </View>
        </View>
      </View>
    );
  }

  if (phase === "analyzing") {
    const stage = STAGES[currentStage];
    return (
      <View className="upload-page analyzing-phase">
        <View className="small-preview">
          <image src={previewUrl!} mode="aspectFill" className="small-preview-img" />
          <View className="scan-line"></View>
        </View>
        <View className="analysis-stages">
          {STAGES.map((s, i) => (
            <View key={s.id || i} className={`stage-item ${i < currentStage ? "done" : ""} ${i === currentStage ? "active" : ""}`}>
              <Text className="stage-icon">{s.icon}</Text>
              <View className="stage-info">
                <Text className="stage-title">{s.title}</Text>
                <Text className="stage-sub">{s.subtitle}</Text>
              </View>
              {i < currentStage && <Text className="stage-check">✓</Text>}
              {i === currentStage && <View className="stage-spinner"></View>}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
};

export default UploadPage;

