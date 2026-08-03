import React, { useState } from "react";
import { navigate } from "@taro/router";
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
      <div className="creator-apply-page">
        <div className="step-header">
          <h2>达人申请</h2>
          <p>步骤 1/4：上传素颜照片</p>
        </div>
        <div className="upload-section">
          <div className="upload-area" onClick={() => handleImageUpload("face")}>
            {faceImage ? (
              <img src={faceImage} alt="素颜照" className="uploaded-image" />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>点击上传素颜照片（无化妆）</p>
              </div>
            )}
          </div>
          <button className="next-btn" onClick={handleNext}>
            下一步
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Work upload
  if (step === 2) {
    return (
      <div className="creator-apply-page">
        <div className="step-header">
          <h2>达人申请</h2>
          <p>步骤 2/4：上传作品照片</p>
        </div>
        <div className="upload-section">
          <div className="works-list">
            {workImages.map((img, idx) => (
              <div key={idx} className="work-item">
                <img src={img} alt={`作品${idx + 1}`} />
              </div>
            ))}
          </div>
          <div className="upload-area" onClick={() => handleImageUpload("works")}>
            <div className="upload-placeholder">
              <div className="upload-icon">➕</div>
              <p>添加作品照片</p>
            </div>
          </div>
          <div className="button-group">
            <button className="prev-btn" onClick={() => setStep(step - 1)}>上一步</button>
            <button className="next-btn" onClick={handleNext}>下一步</button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Form
  if (step === 3) {
    return (
      <div className="creator-apply-page">
        <div className="step-header">
          <h2>达人申请</h2>
          <p>步骤 3/4：填写达人资料</p>
        </div>
        <div className="form-section">
          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的昵称"
            />
          </div>
          <div className="form-group">
            <label>头像</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="头像图片URL"
            />
          </div>
          <div className="form-group">
            <label>平台</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              <option value="xiaohongshu">小红书</option>
              <option value="douyin">抖音</option>
              <option value="weibo">微博</option>
              <option value="bilibili">B站</option>
            </select>
          </div>
          <div className="form-group">
            <label>个人简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="请简单介绍您自己"
            />
          </div>
          <div className="form-group">
            <label>擅长风格（逗号分隔）</label>
            <input
              type="text"
              value={styleTags}
              onChange={(e) => setStyleTags(e.target.value)}
              placeholder="例如：清透自然,日系温柔,高级通勤"
            />
          </div>
          <div className="button-group">
            <button className="prev-btn" onClick={() => setStep(step - 1)}>上一步</button>
            <button className="next-btn" onClick={handleNext}>下一步</button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Summary
  return (
    <div className="creator-apply-page">
      <div className="step-header">
        <h2>达人申请</h2>
        <p>步骤 4/4：确认提交</p>
      </div>
      <div className="summary-section">
        <div className="summary-item"><strong>昵称：</strong>{name}</div>
        <div className="summary-item"><strong>平台：</strong>{platform}</div>
        <div className="summary-item"><strong>简介：</strong>{description}</div>
        <div className="summary-item"><strong>风格：</strong>{styleTags}</div>
        <div className="summary-item"><strong>素颜照：</strong>已上传</div>
        <div className="summary-item"><strong>作品：</strong>{workImages.length} 张</div>
      </div>
      <div className="button-group">
        <button className="prev-btn" onClick={() => setStep(step - 1)}>上一步</button>
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "提交中..." : "提交审核"}
        </button>
      </div>
    </div>
  );
};

export default CreatorApplyPage;