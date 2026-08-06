import { BeautyReport } from "../recommendation/product/types";
import { ShareCardBuilder } from "./ShareCardBuilder";
import { ShareTemplate } from "./ShareTemplate";
import { ShareCardData, ShareCardDisplay, TemplateType } from "./types";

/**
 * ShareService provides high-level operations for creating share cards
 */
export class ShareService {
  /**
   * Create a share card from a BeautyReport
   * @param report The beauty report to share
   * @param templateType Optional template style (default | minimal | premium)
   * @return ShareCardData ready for sharing
   */
  static createShareCard(report: BeautyReport, templateType: TemplateType = "default"): ShareCardData {
    // Generate display data from report
    const display = ShareCardBuilder.generateDisplay(report);
    
    // Generate full share card data
    const cardData = ShareCardBuilder.generateData(report);
    
    // Generate share text using selected template
    const shareText = ShareTemplate.generate(display, templateType);
    
    // Store share text on the data object (for potential use)
    (cardData as any).shareText = shareText;
    
    return cardData;
  }

  /**
   * Generate share text from a BeautyReport
   * @param report The beauty report
   * @param templateType Optional template style
   * @return Formatted share text
   */
  static generateShareText(report: BeautyReport, templateType: TemplateType = "default"): string {
    const display = ShareCardBuilder.generateDisplay(report);
    return ShareTemplate.generate(display, templateType);
  }
}