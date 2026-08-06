import { ProductMatcher, MatchingScore } from "./index";

console.log("\n=== Testing Product Matching System ===\n");

const matcher = new ProductMatcher();

const report1 = {
  faceShape: "圆脸",
  makeupStyle: "日常",
  skinType: "干性",
  recommendedColors: ["象牙白", "裸色"],
  facialFeatures: { eyeSize: "medium" },
  usageContext: "日常"
};

matcher.match(report1).then(results => {
  console.log("Test 1 - Round face, Dry skin, Daily style");
  console.log("Total products:", results.length);
  console.log("Top score:", results[0].score);
});

const report2 = {
  faceShape: "方脸",
  makeupStyle: "浓妆",
  skinType: "油性",
  recommendedColors: ["正红"],
  facialFeatures: {}
};

matcher.match(report2).then(results => {
  console.log("\nTest 2 - Square face, Oily skin, Heavy makeup");
  console.log("Top score:", results[0].score);
});

console.log("\n--- MatchingScore tests ---");
console.log("Style match same:", MatchingScore.calculateMakeupStyleMatch("日常", "日常"));
console.log("Skin match:", MatchingScore.calculateSkinTypeMatch("干性", ["干性", "混合性"]));
console.log("Color match:", MatchingScore.calculateColorMatch(["red"], ["red", "blue"]));
console.log("Face shape match:", MatchingScore.calculateFaceShapeMatch("圆脸", ["圆脸", "鹅蛋脸"]));

console.log("\nAll tests completed!");
