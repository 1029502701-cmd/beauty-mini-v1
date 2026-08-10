import React, { useState } from "react";
import { navigate } from "@taro/router";
import { Button, Text, View } from '@tarojs/components';
import "./index.css";
import type { CreatorApplyRequest } from "@/types";
import { creatorService } from "@/services/creator";

const CreatorApplyPage = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [platform, setPlatform] = useState<"xiaohongshu" | "douyin" | "weibo" | "bilibili">("xiaohongshu");
  const [description, setDescription] = useState("");
  const [styleTags, setStyleTags] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [workImages, setWorkImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1 && !faceImage) {
      alert("请上传素颜照片");
      return;
    }
    if (step === 3 && (!name || !description)) {
      alert("请填写完整信息");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    
    const applyData: CreatorApplyRequest = {
      name,
      avatar,
      platform,
      description,
      styleTags: styleTags.split(",").map(s => s.trim()),
      faceImageUrl: faceImage || "",
      workImages: workImages,
    };

    try {
      const result = await creatorService.submitCreatorApply(applyData);
      alert("申请提交成功！Creator ID: " + result.creatorId + ", 状态: " + result.status);
      navigate("/pages/home");
    } catch (err) {
      alert("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (type: "face" | "works") => {
    const placeholder = "https://example.com/placeholder.jpg";
    if (type === "face") {
      setFaceImage(placeholder);
    } else {
      setWorkImages(prev => [...prev, placeholder]);
    }
  };

  // Step 1: Face upload
  if (step === 1) {
    return (
      <View className="creator-apply-page">
        <View className="step-header">
          <Text>达人申请</Text>
          <Text>步骤 1/4：上传素颜照片</Text>
        </View>
        <View className="upload-section">
          <View className="upload-area" onClick={() => handleImageUpload("face")}>
            {faceImage ? (
              <Image src={faceImage} alt="素颜照" className="uploaded-image" />
            ) : (
              <View className="upload-placeholder">
                <View className="upload-icon">📷</View>
                <Text>点击上传素颜照片（无化妆）</Text>
              </View>
            )}
          </View>
          <Button className="next-btn" onClick={handleNext}>
            下一步
          </Button>
        </View>
      </View>
    );
  }

  // Step 2: Work upload
  if (step === 2) {
    return (
      <View className="creator-apply-page">
        <View className="step-header">
          <Text>达人申请</Text>
          <Text>步骤 2/4：上传作品照片</Text>
        </View>
        <View className="upload-section">
          <View className="works-list">
            {workImages.map((img, idx) => (
              <View key={idx} className="work-item">
                <Image src={img} alt={`作品${idx + 1}`} />
              </View>
            ))}
          </View>
          <View className="upload-area" onClick={() => handleImageUpload("works")}>
            <View className="upload-placeholder">
              <View className="upload-icon">➕</View>
              <Text>添加作品照片</Text>
            </View>
          </View>
          <View className="button-group">
            <Button className="prev-btn" onClick={() => setStep(step - 1)}>上一步</Button>
            <Button className="next-btn" onClick={handleNext}>下一步</Button>
          </View>
        </View>
      </View>
    );
  }

  // Step 3: Form
  if (step === 3) {
    return (
      <View className="creator-apply-page">
        <View className="step-header">
          <Text>达人申请</Text>
          <Text>步骤 3/4：填写达人资料</Text>
        </View>
        <View className="form-section">
          <View className="form-group">
            <Text>昵称</Text>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的昵称"
            />
          </View>
          <View className="form-group">
            <Text>头像</Text>
            <Input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="头像图片URL"
            />
          </View>
          <View className="form-group">
            <Text>平台</Text>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              <option value="xiaohongshu">小红书</option>
              <option value="douyin">抖音</option>
              <option value="weibo">微博</option>
              <option value="bilibili">B站</option>
            </select>
          </View>
          <View className="form-group">
            <Text>个人简介</Text>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="请简单介绍您自己"
            />
          </View>
          <View className="form-group">
            <Text>擅长风格（逗号分隔）</Text>
            <Input
              type="text"
              value={styleTags}
              onChange={(e) => setStyleTags(e.target.value)}
              placeholder="例如：清透自然,日系温柔,高级通勤"
            />
          </View>
          <View className="button-group">
            <Button className="prev-btn" onClick={() => setStep(step - 1)}>上一步</Button>
            <Button className="next-btn" onClick={handleNext}>下一步</Button>
          </View>
        </View>
      </View>
    );
  }

  // Step 4: Summary
  return (
    <View className="creator-apply-page">
      <View className="step-header">
        <Text>达人申请</Text>
        <Text>步骤 4/4：确认提交</Text>
      </View>
      <View className="summary-section">
        <View className="summary-item"><strong>昵称：</strong>{name}</View>
        <View className="summary-item"><strong>平台：</strong>{platform}</View>
        <View className="summary-item"><strong>简介：</strong>{description}</View>
        <View className="summary-item"><strong>风格：</strong>{styleTags}</View>
        <View className="summary-item"><strong>素颜照：</strong>已上传</View>
        <View className="summary-item"><strong>作品：</strong>{workImages.length} 张</View>
      </View>
      <View className="button-group">
        <Button className="prev-btn" onClick={() => setStep(step - 1)}>上一步</Button>
        <Button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "提交中..." : "提交审核"}
        </Button>
      </View>
    </View>
  );
};

export default CreatorApplyPage;