import Taro, { useLoad } from "@tarojs/taro";
import React, { useState, useCallback, useEffect } from "react";
import { Button, Text, View } from '@tarojs/components';
import "./index.css";
import { analyzeService } from "@/services/analyze";
import reportService from "@/services/report";
import { recommendService } from "@/services/recommend";
interface AnalysisStage {
id: string;
title: string;
subtitle: string;
progress: number;
icon: string;
}
const STAGES: AnalysisStage[] = [
{ id: "stage1", title: "确认照片", subtitle: "正在验证上传的图片...", progress: 15, icon: "📷" },
{ id: "stage2", title: "面部检测", subtitle: "正在识别面部特征点...", progress: 30, icon: "👁️" },
{ id: "stage3", title: "脸型分析", subtitle: "正在分析脸型轮廓比例...", progress: 45, icon: "✨" },
{ id: "stage4", title: "五官解读", subtitle: "正在解读眼、眉、唇特征...", progress: 60, icon: "💄" },
{ id: "stage5", title: "妆容匹配", subtitle: "正在匹配最适合您的妆容...", progress: 80, icon: "🎨" },
{ id: "stage6", title: "生成报告", subtitle: "正在为您整理专属美妆方案...", progress: 100, icon: "📊" },
];
const Index = () => {
const [queryParams, setQueryParams] = useState<any>({});

useLoad((options) => {
  setQueryParams(options || {});
});
const [uploadId, setUploadId] = useState<string | null>(null);
const [imageUrl, setImageUrl] = useState<string | null>(null);

useLoad((options) => {
  const params = options || {};
  console.log("[analyzing params]", params);
  setUploadId(params.uploadId || null);
  setImageUrl(params.imageUrl || null);
});
const [currentStage, setCurrentStage] = useState(0);
const [progress, setProgress] = useState(0);
const [isComplete, setIsComplete] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const [analysisError, setAnalysisError] = useState<string | null>(null);
const [reportId, setReportId] = useState<string | null>(null);
const performFullAnalysis = useCallback(async () => {
if (!uploadId) {
setAnalysisError("缺少上传ID");
return;
}
setCurrentStage(0);
setProgress(0);
setIsComplete(false);
setIsProcessing(true);
setAnalysisError(null);
try {
// Animate through stages
for (let i = 0; i < STAGES.length; i++) {
setCurrentStage(i);
setProgress(STAGES[i].progress);
await new Promise(resolve => setTimeout(resolve, 600));
}
// Call real backend analyze endpoint
const imageKey = imageUrl || uploadId;
const analyzeResult = await analyzeService.analyzeImage(uploadId, imageKey);
if (!analyzeResult.success) {
throw new Error(analyzeResult.error || "AI分析失败");
}
// Generate report
const reportResult = await reportService.createAndQueryReport(
uploadId,
imageKey,
"beauty-pro"
);
if (!reportResult.success) {
throw new Error(reportResult.error || "报告生成失败");
}
const generatedReportId = reportResult.reportId || uploadId;
setReportId(generatedReportId);
setIsComplete(true);
setIsProcessing(false);
setTimeout(() => {
navigate({ url: "/pages/decision?uploadId=" + encodeURIComponent(uploadId) + "&imageUrl=" + encodeURIComponent(imageKey) + "&reportLevel=beauty-pro" });
}, 800);
} catch (error) {
console.error("Analysis error:", error);
const errMsg = error instanceof Error ? error.message : "AI分析失败，请重新尝试";
// Handle business status codes
    if (errMsg.includes('DAILY_LIMIT_REACHED') || errMsg.includes('今天次数已用完')) {
      setAnalysisError('今天次数已用完，请明天再试');
    } else if (errMsg.includes('INSUFFICIENT_TOKEN') || errMsg.includes('Token不足')) {
      setAnalysisError('Token不足，请解锁后继续');
    } else {
      setAnalysisError(errMsg);
    }
setIsProcessing(false);
setIsComplete(false);
}
}, [uploadId, imageUrl]);
const handleRetry = useCallback(() => {
setAnalysisError(null);
performFullAnalysis();
}, [performFullAnalysis]);
useEffect(() => {
if (uploadId && !isComplete && !isProcessing && !analysisError) {
performFullAnalysis();
}
}, [uploadId, isComplete, isProcessing, analysisError, performFullAnalysis]);
const stage = STAGES[currentStage] || STAGES[0];
if (analysisError && !isProcessing) {
return (
<View className="analyzing-page analyzing-error">
<View className="error-content">
<View className="error-icon">😔</View>
<Text>分析失败</Text>
<Text className="error-message">{analysisError}</Text>
<View className="error-actions">
<Button className="retry-btn" onClick={handleRetry}>重新分析</Button>
<Button className="back-btn" onClick={() => navigate("/pages/home")}>返回首页</Button>
</View>
</View>
</View>
);
}
return (
<View className="analyzing-page">
<View className="analyzing-header">
<Text className="analyzing-title">AI 美妆分析</Text>
<Text className="analyzing-subtitle">正在为您生成专属美妆方案</Text>
</View>
<View className="scanning-animation">
<View className="face-mask">
<Text className="face-icon">{stage.icon}</Text>
</View>
</View>
<View className="stage-display">
<Text className="stage-title">{stage.title}</Text>
<Text className="stage-subtitle">{stage.subtitle}</Text>
</View>
<View className="progress-container">
<View className="progress-bar">
<View className="progress-fill" style={{ width: progress + "%" }}></View>
</View>
<Text className="progress-text">{Math.round(progress)}% · {stage.subtitle}</Text>
</View>
</View>
);
};
export default Index;
