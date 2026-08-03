import { BloggerMatcher } from "./BloggerMatcher";
import creatorsData from "../datasets/creators.json";
import type { CreatorProfile, UserAestheticProfile } from "@/types/beauty";

const creators = creatorsData as CreatorProfile[];
const matcher = new BloggerMatcher();

// ─── Test 1: 鹅蛋脸 + 清透自然型 + 暖皮 ───────────────────────────────────────
console.log("=== Test 1: 鹅蛋脸 + 清透自然型 + 暖皮 ===");
const profile1: UserAestheticProfile = {
  faceShape: "鹅蛋脸",
  skinTone: "暖皮",
  makeupPreference: "奶茶色",
  stylePreference: "清透自然型"
};
const result1 = matcher.getTop3Creators(profile1, creators);
console.log(`Found ${result1.length} matches (expected 3)`);
result1.forEach((r, i) => {
  console.log(`  #${i + 1}: ${r.name} — totalScore=${r.matchScore.totalScore} (style=${r.matchScore.styleScore}, face=${r.matchScore.faceScore}, color=${r.matchScore.colorScore})`);
  console.log(`    styleTags: [${r.styleTags.join(", ")}]`);
  console.log(`    reasons: [${r.matchReasons.join(", ")}]`);
});

// ─── Test 2: 方脸 + 欧美浓妆型 + 冷皮 ────────────────────────────────────────
console.log("\n=== Test 2: 方脸 + 欧美浓妆型 + 冷皮 ===");
const profile2: UserAestheticProfile = {
  faceShape: "方脸",
  skinTone: "冷皮",
  makeupPreference: "橘棕色",
  stylePreference: "欧美浓妆型"
};
const result2 = matcher.getTop3Creators(profile2, creators);
console.log(`Found ${result2.length} matches (expected 3)`);
result2.forEach((r, i) => {
  console.log(`  #${i + 1}: ${r.name} — totalScore=${r.matchScore.totalScore} (style=${r.matchScore.styleScore}, face=${r.matchScore.faceScore}, color=${r.matchScore.colorScore})`);
  console.log(`    styleTags: [${r.styleTags.join(", ")}]`);
  console.log(`    reasons: [${r.matchReasons.join(", ")}]`);
});

// ─── Test 3: 圆脸 + 韩系甜妹型 + 中性皮 ──────────────────────────────────────
console.log("\n=== Test 3: 圆脸 + 韩系甜妹型 + 中性皮 ===");
const profile3: UserAestheticProfile = {
  faceShape: "圆脸",
  skinTone: "中性皮",
  makeupPreference: "裸粉色",
  stylePreference: "韩系甜妹型"
};
const result3 = matcher.getTop3Creators(profile3, creators);
console.log(`Found ${result3.length} matches (expected 3)`);
result3.forEach((r, i) => {
  console.log(`  #${i + 1}: ${r.name} — totalScore=${r.matchScore.totalScore} (style=${r.matchScore.styleScore}, face=${r.matchScore.faceScore}, color=${r.matchScore.colorScore})`);
  console.log(`    styleTags: [${r.styleTags.join(", ")}]`);
  console.log(`    reasons: [${r.matchReasons.join(", ")}]`);
});

// ─── Test 4: Verify sorting (descending totalScore) ──────────────────────────
console.log("\n=== Test 4: Sorting verification ===");
let sorted = true;
[result1, result2, result3].forEach((result, idx) => {
  for (let i = 1; i < result.length; i++) {
    if (result[i - 1].matchScore.totalScore < result[i].matchScore.totalScore) {
      sorted = false;
      console.log(`  FAIL: Test ${idx + 1} not sorted at index ${i}`);
    }
  }
});
if (sorted) console.log("  PASS: All results sorted descending by totalScore");

// ─── Test 5: Verify no commercial data used ──────────────────────────────────
console.log("\n=== Test 5: No commercial metrics ===");
const hasCommercialFields = result1.some(r =>
  "followersCount" in r || "popularity" in r || "likesCount" in r
);
if (!hasCommercialFields) {
  console.log("  PASS: No commercial metrics (followersCount/popularity) in results");
} else {
  console.log("  FAIL: Commercial metrics found in results");
}

// ─── Test 6: 长脸 + 成熟御姐型 + 中性皮 ──────────────────────────────────────
console.log("\n=== Test 6: 长脸 + 成熟御姐型 + 中性皮 ===");
const profile6: UserAestheticProfile = {
  faceShape: "长脸",
  skinTone: "中性皮",
  makeupPreference: "豆沙色",
  stylePreference: "成熟御姐型"
};
const result6 = matcher.getTop3Creators(profile6, creators);
console.log(`Found ${result6.length} matches (expected 3)`);
result6.forEach((r, i) => {
  console.log(`  #${i + 1}: ${r.name} — totalScore=${r.matchScore.totalScore}`);
});

console.log("\n=== All tests completed ===");
