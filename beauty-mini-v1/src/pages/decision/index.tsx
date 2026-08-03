import React, { useState } from "react";
import { navigate } from "@taro/router";
import "./index.css";
import reportService from "@/services/report";
import { setStorage } from "@/utils/storage";

const STYLE_OPTIONS = [
  { value: "natural", label: "自然清透", desc: "强调原生质感，清新淡雅" },
  { value: "refined", label: "精致高级", desc: "注重细节，质感至上" },
  { value: "charismatic", label: "气场增强", desc: "突出整体气场，自信大方" },
  { value: "individual", label: "个性风格", desc: "大胆展现个人特色" },
];

const OCCASION_OPTIONS = [
  { value: "daily", label: "日常通勤", desc: "简洁高效，适合工作日" },
  { value: "date", label: "约会", desc: "温柔动人，展现魅力" },
  { value: "workplace", label: "职场", desc: "干练得体，专业形象" },
  { value: "photo", label: "拍照", desc: "妆面精致，出片效果佳" },
];

const TOLERANCE_OPTIONS = [
  { value: "conservative", label: "保守调整", desc: "小范围调整，自然提升" },
  { value: "normal", label: "明显改变", desc: "适度改变，效果可见" },
  { value: "bold", label: "大胆突破", desc: "大胆尝试，焕然一新" },
];

const Index = () => {
  const [style, setStyle] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const uploadId = params.get("uploadId") || "";
  const imageUrl = params.get("imageUrl") || "";
  const reportLevel = params.get("reportLevel") || "beauty-pro";

  const canProceed = style && occasion && tolerance;

  const handleGenerate = async () => {
    if (!canProceed || !uploadId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const decisions = {
        style: style as "natural" | "refined" | "charismatic" | "individual",
        occasion: occasion as "daily" | "date" | "workplace" | "photo",
        tolerance: tolerance as "conservative" | "normal" | "bold",
      };
      setStorage("last_decision_answers", decisions);
      const result = await reportService.createAndQueryReport(
        uploadId,
        imageUrl || uploadId,
        reportLevel as "first-look" | "style-upgrade" | "beauty-pro",
        decisions,
      );
      if (result.success && result.reportId) {
        navigate({ url: `/pages/result?reportId=${encodeURIComponent(result.reportId)}` });
      } else {
        setError(result.error || "报告生成失败，请重试");
      }
    } catch {
      setError("报告生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="decision-page">
      <div className="decision-header">
        <h1 className="decision-title">专属美学定制</h1>
        <p className="decision-subtitle">回答3个问题，生成更懂你的美妆报告</p>
      </div>
      {error && (
        <div className="decision-error">
          <p>{error}</p>
        </div>
      )}
      <div className="decision-section">
        <h2 className="section-label">01 妆容风格偏好</h2>
        <p className="section-desc">你平时更喜欢哪种妆容风格？</p>
        <div className="option-grid">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={"option-card " + (style === opt.value ? "selected" : "")}
              onClick={() => setStyle(opt.value)}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="decision-section">
        <h2 className="section-label">02 主要使用场景</h2>
        <p className="section-desc">这份报告主要适用于什么场合？</p>
        <div className="option-grid">
          {OCCASION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={"option-card " + (style === opt.value ? "selected" : "")}
              onClick={() => setOccasion(opt.value)}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="decision-section">
        <h2 className="section-label">03 妆容改变接受度</h2>
        <p className="section-desc">你希望妆容带来多大的改变？</p>
        <div className="option-grid">
          {TOLERANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={"option-card " + (style === opt.value ? "selected" : "")}
              onClick={() => setTolerance(opt.value)}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="decision-footer">
        <button
          className={"generate-btn " + (canProceed ? "active" : "disabled")}
          onClick={handleGenerate}
          disabled={!canProceed || isGenerating}
        >
          {isGenerating ? "生成中..." : "生成专属报告"}
        </button>
        <p className="footer-hint">
          {canProceed ? "将消耗 1 Token 生成专属美学报告" : "请选择以上所有选项以继续"}
        </p>
      </div>
    </div>
  );
};

export default Index;
