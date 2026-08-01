import React, { useState, useEffect, useCallback } from "react";
import { navigate, useQueryParams } from "@taro/router";
import "./index.css";
import reportService from "../../services/report";
import permissionService from "../../services/permission-service";
import { recommendService } from "../../services/recommend";

const LEVEL_LABELS: Record<string, string> = {
  "first-look": "初见妆容",
  "style-upgrade": "风格进阶",
  "beauty-pro": "专属美学"
};

const Index = () => {
  const [queryParams] = useQueryParams();
  const [reportId] = useState<string | null>(queryParams.reportId || null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendProducts, setRecommendProducts] = useState<any[]>([]);
  const [recommendCreators, setRecommendCreators] = useState<any[]>([]);
  const [showRecommendLoading, setShowRecommendLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!reportId) {
      setError("无效的报告ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await reportService.queryReport(reportId);
      if (result.success && result.report) {
        setReport(result.report);
      } else {
        setError(result.error || "报告不存在");
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("获取报告失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  const fetchRecommendations = useCallback(async () => {
    if (!report) return;
    setShowRecommendLoading(true);
    try {
      const faceType = report.analysis?.facialFeatures?.faceShape || "Oval";
      const skinType = report.analysis?.skinType || "Normal";
      const makeupStyle = report.analysis?.makeupStyle || "natural";
      const res = await recommendService.getRecommendations({ faceType, skinType, makeupStyle });
      if (res.success) {
        setRecommendProducts(res.products || []);
        setRecommendCreators(res.creators || []);
      }
    } catch (err) {
      console.error("Recommendation error:", err);
    } finally {
      setShowRecommendLoading(false);
    }
  }, [report]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (report) {
      fetchRecommendations();
    }
  }, [report, fetchRecommendations]);

  if (loading) {
    return (
      <div className="result-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="result-page">
        <div className="error-state">
          <p className="error-text">{error || "报告加载失败"}</p>
          <button className="back-btn" onClick={() => navigate("/pages/home")}>返回首页</button>
        </div>
      </div>
    );
  }

  const analysis = report.analysis || {};
  const products = analysis.productRecommendations || recommendProducts;
  const bloggers = analysis.kolRecommendations || recommendCreators;

  return (
    <div className="result-page">
      <div className="result-header">
        <h1 className="result-title">AI 美妆报告</h1>
        <p className="result-subtitle">初见妆容 · 您的专属美妆方案</p>
      </div>

      {/* Face Analysis Section */}
      <div className="section-block">
        <div className="section-anchor">
          <span className="anchor-num">01</span>
          <span className="anchor-label">脸型分析</span>
        </div>
        <div className="face-summary">
          <p>{analysis.facialFeatures?.description || "面部特征分析中..."}</p>
        </div>
      </div>

      {/* Makeup Style Section */}
      <div className="section-block">
        <div className="section-anchor">
          <span className="anchor-num">02</span>
          <span className="anchor-label">妆容建议</span>
        </div>
        <div className="makeup-tips">
          {(analysis.suggestions || ["保持肌肤水润，上妆前做好保湿打底"]).map((tip: string, i: number) => (
            <div key={i} className="tip-item">
              <span className="tip-bullet">•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product Recommendations */}
      {products.length > 0 && (
        <div className="section-block">
          <div className="section-anchor">
            <span className="anchor-num">03</span>
            <span className="anchor-label">产品推荐</span>
          </div>
          <div className="products-grid">
            {products.slice(0, 4).map((p: any) => (
              <div key={p.id} className="product-card">
                <div className="product-name">{p.name || p.productName || "推荐产品"}</div>
                <div className="product-brand">{p.brand || ""}</div>
                <div className="product-reason">{p.reason || p.matchReason || ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KOL Recommendations */}
      {bloggers.length > 0 && (
        <div className="section-block">
          <div className="section-anchor">
            <span className="anchor-num">04</span>
            <span className="anchor-label">达人推荐</span>
          </div>
          <div className="bloggers-grid">
            {bloggers.slice(0, 3).map((b: any) => (
              <div key={b.id} className="blogger-item">
                {b.avatar && <div className="blogger-avatar"><img src={b.avatar} alt={b.name} /></div>}
                <div className="blogger-info">
                  <div className="blogger-name">{b.name || b.creatorName || "达人"}</div>
                  <div className="blogger-intro">{b.description || b.intro || ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="back-btn-large" onClick={() => navigate("/pages/home")}>返回首页</button>
    </div>
  );
};

export default Index;
