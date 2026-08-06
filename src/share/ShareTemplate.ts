import { ShareCardDisplay } from "./types";

/**
 * ShareTemplate system for different sharing styles
 */
export class ShareTemplate {
  static generate(display: ShareCardDisplay, templateType: TemplateType = "default"): string {
    switch (templateType) {
      case "minimal":
        return this.generateMinimal(display);
      case "premium":
        return this.generatePremium(display);
      default:
        return this.generateDefault(display);
    }
  }

  private static generateDefault(display: ShareCardDisplay): string {
    return `?? ${display.title}\n\n${display.subtitle}\n? 得分: ${display.score}/100\n\n推荐标签: ${display.tags.join(", ")}\n\n快来查看你的专属美妆分析！`;
  }

  private static generateMinimal(display: ShareCardDisplay): string {
    return `${display.title}\n${display.subtitle}\n得分: ${display.score}`;
  }

  private static generatePremium(display: ShareCardDisplay): string {
    return `?? ${display.title} ??\n\n--- 你的专属美妆分析 ---\n\n风格: ${display.subtitle}\n得分: ${display.score}/100\n\n?? 推荐: ${display.tags.join(" | ")}\n\n? 发现你的独特魅力，点击查看详情！`;
  }
}
