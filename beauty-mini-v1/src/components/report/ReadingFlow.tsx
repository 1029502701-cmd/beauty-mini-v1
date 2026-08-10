import React from "react";
import "./ReadingFlow.css";
import { ReportLevel } from "@/types/report-level";

interface ReadingFlowProps {
  currentLevel: ReportLevel;
}

const FLOW_STEPS: Record<ReportLevel, { label: string; desc: string }[]> = {
  "first-look": [
    { label: "基础结论", desc: "脸型与五官速览" },
    { label: "详细分析", desc: "五官细节解读" },
    { label: "改善方案", desc: "快速建议" },
    { label: "下一步建议", desc: "升级解锁完整方案" },
  ],
  "style-upgrade": [
    { label: "基础结论", desc: "脸型与风格定位" },
    { label: "详细分析", desc: "色彩与妆容解读" },
    { label: "改善方案", desc: "风格方向建议" },
    { label: "下一步建议", desc: "解锁专属美学方案" },
  ],
  "beauty-pro": [
    { label: "基础结论", desc: "完整面部分析" },
    { label: "详细分析", desc: "色彩/风格/五官深度解读" },
    { label: "改善方案", desc: "专属美学计划" },
    { label: "下一步建议", desc: "个性化产品推荐" },
  ],
};

const ReadingFlow: React.FC<ReadingFlowProps> = ({ currentLevel }) => {
  const steps = FLOW_STEPS[currentLevel] || FLOW_STEPS["first-look"];
  const maxStep = steps.length - 1;

  return (
    <div className="reading-flow">
      {steps.map((step, i) => (
        <div key={i} className="flow-step">
          <div className={low-step-header }>
            <span className="flow-step-num">{i + 1}</span>
            <span className="flow-step-label">{step.label}</span>
          </div>
          <div className={low-step-body }>
            <p className="flow-step-desc">{step.desc}</p>
          </div>
          {i < maxStep && <div className="flow-connector" />}
        </div>
      ))}
    </div>
  );
};

export default ReadingFlow;
