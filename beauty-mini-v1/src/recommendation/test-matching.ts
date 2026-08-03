import { BloggerMatcher } from "./BloggerMatcher";
import { SAMPLE_BLOGGERS } from "./bloggers-database";

// V2 Test: User with full FaceMetrics data
const mockUser = {
  faceShape: "¶ìµ°Á³",
  eyeShape: "ÐÓÑÛ",
  lipShape: "±¥Âú´½",
  makeupStyle: "ÇåÍ¸×ÔÈ»ÐÍ",
  colorRecommendation: ["ÄÌ²èÉ«", "¶¹É³É«"],
  skinTone: "Å¯Æ¤",
  // V2: Face metrics from actual analysis
  faceMetrics: {
    faceWidth: 180,
    faceHeight: 220,
    faceRatio: 0.82,
    jawWidth: 160,
    chinLength: 40,
    eyeDistance: 65,
    noseWidth: 30,
    lipWidth: 48
  }
};
const matcher = new BloggerMatcher();
matcher.matchBloggers(mockUser, SAMPLE_BLOGGERS).then(results => {
  console.log("=== V2 Matching Results ===");
  results.slice(0,3).forEach(r => {
    console.log(r.bloggerId + ": " + r.score + "·Ö");
    console.log("  Reasons: " + r.matchReasons.join("; "));
    console.log("  Details: " + JSON.stringify(r.matchDetails));
  });
});
