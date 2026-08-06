import { BeautyReport, MakeupStyle } from "../recommendation/product/types";
import { ShareCardData, ShareCardDisplay } from "./types";

/**
 * ShareCardBuilder transforms BeautyReport into share card data
 */
export class ShareCardBuilder {
  static generateDisplay(report: BeautyReport): ShareCardDisplay {
    const subtitle = `${report.faceShape} · ${this.formatMakeupStyle(report.makeupStyle)}`;
    const score = this.calculateScore(report);
    const tags = this.generateTags(report);
    
    return {
      title: "你的专属美妆分析",
      subtitle,
      score,
      tags
    };
  }

  static generateData(report: BeautyReport): ShareCardData {
    return {
      reportId: report.id || "unknown",
      beautyScore: this.calculateScore(report),
      faceShape: report.faceShape,
      makeupStyle: report.makeupStyle,
      topRecommendation: this.getTopRecommendation(report),
      bloggerRecommendation: this.getBloggerRecommendation(report.makeupStyle),
      createdAt: new Date().toISOString()
    };
  }

  private static formatMakeupStyle(style: MakeupStyle): string {
    const styleMap: Record<MakeupStyle, string> = {
      "日常": "日常风",
      "浓妆": "浓妆风格",
      "欧美风": "欧美妆容",
      "日系": "日系清新",
      "韩系": "韩式甜美",
      "复古": "复古优雅"
    };
    return styleMap[style] || style;
  }

  private static calculateScore(report: BeautyReport): number {
    let score = 85;
    const faceShapeScores = {
      "鹅蛋脸": 10,
      "圆脸": 2,
      "方脸": 3,
      "长脸": 2,
      "心形脸": 5
    };
    score += faceShapeScores[report.faceShape] || 0;
    const skinTypeScores = {
      "中性": 5,
      "混合性": 3,
      "干性": 2,
      "油性": 1,
      "敏感性": 1
    };
    score += skinTypeScores[report.skinType] || 0;
    return Math.min(score, 100);
  }

  private static generateTags(report: BeautyReport): string[] {
    const tags: string[] = [];
    if (report.recommendedColors && report.recommendedColors.length > 0) {
      tags.push(`${report.recommendedColors[0]} 适配`);
    }
    tags.push(this.formatMakeupStyle(report.makeupStyle));
    if (report.facialFeatures) {
      if (report.facialFeatures.brows) {
        tags.push("自然眉型");
      }
      if (report.facialFeatures.lips) {
        tags.push("饱满唇形");
      }
    }
    return tags.length > 0 ? tags : ["精致妆容", "完美底妆"];
  }

  private static getTopRecommendation(report: BeautyReport): string {
    const recommendations = {
      "鹅蛋脸": "适合所有妆容风格的黄金脸型",
      "圆脸": "推荐修容与高光的立体打法",
      "方脸": "柔和线条弱化棱角感",
      "长脸": "横向修饰平衡比例",
      "心形脸": "平衡额头与下巴比例"
    };
    return recommendations[report.faceShape] || "定制专属美妆方案";
  }

  private static getBloggerRecommendation(style: MakeupStyle): string {
    const bloggerMap: Record<MakeupStyle, string> = {
      "日常": "小红书美妆达人@清透妆教",
      "浓妆": "专业彩妆师@浓颜女王",
      "欧美风": "欧美美妆博主@ChicLook",
      "日系": "日系美妆教主@樱花少女",
      "韩系": "韩式美颜大师@温柔女神",
      "复古": "复古妆效专家@年代佳人"
    };
    return bloggerMap[style] || "时尚美妆博主推荐";
  }
}