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
    return \u1F48E \n\n\n\u2728 得分: /100\n\n推荐标签: \n\n快来查看你的专属美妆分析！;
  }

  private static generateMinimal(display: ShareCardDisplay): string {
    return ${display.title}\n\n得分: ;
  }

  private static generatePremium(display: ShareCardDisplay): string {
    return \u1F31F  \u1F31F\n\n--- 你的专属美妆分析 ---\n\n风格: \n得分: /100\n\n🎯 推荐: \n\n✨ 发现你的独特魅力，点击查看详情！;
  }
}