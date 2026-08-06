import { ShareCardBuilder, ShareService } from "./ShareCardBuilder";
import { ShareTemplate } from "./ShareTemplate";
import { BeautyReport } from "../recommendation/product/types";

/**
* Test suite for Share module
*/
function testShareCardBuilder() {
  console.log("=== Testing ShareCardBuilder ===");

  // Create a mock BeautyReport
  const mockReport: BeautyReport = {
    faceShape: "鹅蛋脸",
    makeupStyle: "日系",
    skinType: "中性",
    recommendedColors: ["奶茶色", "豆沙色"],
    facialFeatures: {
      brows: true,
      lips: true,
      eyes: true
    },
    usageContext: "日常出行"
  };

  // Test generateDisplay
  const display = ShareCardBuilder.generateDisplay(mockReport);
  console.log("Display generated:", display);
  if (display.title !== "你的专属美妆分析") throw new Error("Title mismatch");
  if (!display.subtitle.includes("鹅蛋脸") || !display.subtitle.includes("日系")) throw new Error("Subtitle mismatch");
  if (display.score < 85 || display.score > 100) throw new Error("Score out of range");
  if (display.tags.length === 0) throw new Error("Tags empty");
  console.log("? ShareCardBuilder.generateDisplay passed");

  // Test generateData
  const data = ShareCardBuilder.generateData(mockReport);
  console.log("Data generated:", data);
  if (data.beautyScore <= 0) throw new Error("Beauty score invalid");
  if (data.faceShape !== "鹅蛋脸") throw new Error("Face shape mismatch");
  if (data.makeupStyle !== "日系") throw new Error("Makeup style mismatch");
  if (!data.topRecommendation || data.topRecommendation.length === 0) throw new Error("Top recommendation missing");
  if (!data.bloggerRecommendation || data.bloggerRecommendation.length === 0) throw new Error("Blogger recommendation missing");
  if (!data.createdAt) throw new Error("Creation date missing");
  console.log("? ShareCardBuilder.generateData passed");
}

function testShareService() {
  console.log("=== Testing ShareService ===");

  const mockReport: BeautyReport = {
    faceShape: "方脸",
    makeupStyle: "欧美风",
    skinType: "油性",
    recommendedColors: ["深红色", "酒红色"],
    facialFeatures: {
      brows: true,
      lips: false
    }
  };

  // Test createShareCard
  const card = ShareService.createShareCard(mockReport);
  console.log("Share card created:", card);
  if (card.beautyScore <= 0) throw new Error("Service score invalid");
  if (!card.reportId || card.reportId.length === 0) throw new Error("Report ID missing");
  console.log("? ShareService.createShareCard passed");

  // Test generateShareText
  const text = ShareService.generateShareText(mockReport);
  console.log("Share text generated:", text);
  if (text.length < 10) throw new Error("Share text too short");
  console.log("? ShareService.generateShareText passed");
}

function testShareTemplate() {
  console.log("=== Testing ShareTemplate ===");

  const display: ShareCardDisplay = {
    title: "你的专属美妆分析",
    subtitle: "鹅蛋脸 · 日系清新",
    score: 95,
    tags: ["奶茶色适配", "日系妆容", "自然眉型"]
  };

  // Test default template
  const defaultText = ShareTemplate.generate(display, "default");
  console.log("Default template:", defaultText);
  if (!defaultText.includes("你的专属美妆分析")) throw new Error("Default template missing title");
  console.log("? ShareTemplate default passed");

  // Test minimal template
  const minimalText = ShareTemplate.generate(display, "minimal");
  console.log("Minimal template:", minimalText);
  if (!minimalText.includes("鹅蛋脸")) throw new Error("Minimal template missing subtitle");
  console.log("? ShareTemplate minimal passed");

  // Test premium template
  const premiumText = ShareTemplate.generate(display, "premium");
  console.log("Premium template:", premiumText);
  if (!premiumText.includes("?")) throw new Error("Premium template missing emoji");
  console.log("? ShareTemplate premium passed");
}

// Run all tests
try {
  testShareCardBuilder();
  testShareService();
  testShareTemplate();
  console.log("");
  console.log("? All tests passed!");
} catch (error) {
  console.error("");
  console.error("? Test failed:", error.message);
  process.exit(1);
}
