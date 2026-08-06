// ============================================
// Task-BeautyMini-059 测试脚本
// ============================================
import beautyReportGenerator from './lib/reportGenerator';
import type { BeautyFaceMetrics, BeautyReportContentV2 } from './types/beauty';

function makeMetrics(shape, faceWidth, faceHeight, jawWidth, chinLength, skinTone) {
  return {
    faceShape: shape,
    faceRatio: parseFloat((faceWidth / faceHeight).toFixed(2)),
    eyeType: ['杏眼', '单眼皮', '不对称眼'][Math.floor(Math.random() * 3)],
    eyeSize: 45 + Math.floor(Math.random() * 20),
    noseRatio: parseFloat((0.35 + Math.random() * 0.15).toFixed(2)),
    lipRatio: parseFloat((0.20 + Math.random() * 0.15).toFixed(2)),
    jawType: ['标准颌型', '宽大颌型'][Math.floor(Math.random() * 2)],
    skinTone: skinTone,
  };
}

const testCases = [
  { name: '圆脸-first-look', metrics: makeMetrics('圆脸', 88, 95, 82, 23, '暖黄皮'), level: 'first-look' },
  { name: '长脸-style-upgrade', metrics: makeMetrics('长脸', 72, 110, 78, 45, '冷白皮'), level: 'style-upgrade' },
  { name: '方脸-beauty-pro', metrics: makeMetrics('方脸', 82, 105, 75, 32, '橄榄皮'), level: 'beauty-pro' },
  { name: '心形脸-first-look', metrics: makeMetrics('心形脸', 78, 100, 62, 22, '中性皮'), level: 'first-look' },
  { name: '鹅蛋脸-beauty-pro', metrics: makeMetrics('鹅蛋脸', 70, 100, 72, 30, '暖黄皮'), level: 'beauty-pro' },
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + message);
  } else {
    failed++;
    console.log('  FAIL: ' + message);
  }
}

console.log('\n=== 字段完整性测试 ===\n');

for (const tc of testCases) {
  console.log('--- ' + tc.name + ' (level=' + tc.level + ') ---');
  const report = beautyReportGenerator.generateV2(tc.metrics, tc.level);
  const r = report;

  // 基础字段（所有level）
  assert(r.version === 'v2', 'version = v2');
  assert(!!r.faceAnalysis, 'faceAnalysis 存在');
  assert(!!r.faceShapeResult, 'faceShapeResult 存在');
  assert(!!r.featureHighlights, 'featureHighlights 存在');
  assert(!!r.makeupStyle, 'makeupStyle 存在');
  assert(!!r.makeupStyleDetail, 'makeupStyleDetail 存在');
  assert(!!r.colorRecommendation, 'colorRecommendation 存在');
  assert(!!r.colorAnalysis, 'colorAnalysis 存在');
  assert(!!r.styleDirection, 'styleDirection 存在');
  assert(!!r.productRecommendation, 'productRecommendation 存在');
  assert(!!r.generatedAt, 'generatedAt 存在');

  // FaceInsight（所有level）
  assert(!!r.faceInsight, 'faceInsight 存在');
  const fi = r.faceInsight;
  assert(fi.summary.length > 10, 'faceInsight.summary 有内容');
  assert(fi.strengths.length > 0, 'faceInsight.strengths 非空');
  assert(fi.concerns.length > 0, 'faceInsight.concerns 非空');
  console.log('  [faceInsight] summary: ' + fi.summary.slice(0, 40) + '...');
  console.log('  [faceInsight] strengths: ' + fi.strengths.slice(0, 2).join(', '));

  // MakeupStyleDetail 增强字段
  const msd = r.makeupStyleDetail;
  assert(msd.keyPoints.length > 0, 'makeupStyleDetail.keyPoints 非空');
  assert(msd.avoidTips !== undefined, 'makeupStyleDetail.avoidTips 存在');
  console.log('  [makeupStyleDetail] style: ' + msd.styleName + ', keyPoints: ' + msd.keyPoints.join(', '));

  // ColorAnalysis 增强字段
  const ca = r.colorAnalysis;
  assert(!!ca.seasonType, 'colorAnalysis.seasonType 存在');
  assert(ca.dailyColors.length > 0, 'colorAnalysis.dailyColors 非空');
  assert(ca.specialColors.length > 0, 'colorAnalysis.specialColors 非空');
  console.log('  [colorAnalysis] season: ' + ca.seasonType + ', daily: ' + ca.dailyColors.slice(0, 2).join(', '));

  // 三档报告区分：first-look 只含基础+faceInsight
  if (tc.level === 'first-look') {
    assert(r.seasonColorAnalysis === undefined, 'first-look 不包含 seasonColorAnalysis');
    assert(r.styleUpgradeContent === undefined, 'first-look 不包含 styleUpgradeContent');
    assert(r.personalPlan === undefined, 'first-look 不包含 personalPlan');
  }
  // style-upgrade: 增加风格建议
  else if (tc.level === 'style-upgrade') {
    assert(!!r.seasonColorAnalysis, 'style-upgrade 包含 seasonColorAnalysis');
    assert(!!r.styleUpgradeContent, 'style-upgrade 包含 styleUpgradeContent');
    const suc = r.styleUpgradeContent;
    assert(suc.styleRecommendations.length > 0, 'styleUpgradeContent.styleRecommendations 非空');
    assert(!!suc.eyeMakeupDirection, 'styleUpgradeContent.eyeMakeupDirection 有内容');
    assert(!!suc.contourDirection, 'styleUpgradeContent.contourDirection 有内容');
    assert(!!suc.lipColorDirection, 'styleUpgradeContent.lipColorDirection 有内容');
    console.log('  [styleUpgrade] eye: ' + suc.eyeMakeupDirection.slice(0, 30));
    assert(r.personalPlan === undefined, 'style-upgrade 不包含 personalPlan');
  }
  // beauty-pro: 增加私人化方案
  else if (tc.level === 'beauty-pro') {
    assert(!!r.seasonColorAnalysis, 'beauty-pro 包含 seasonColorAnalysis');
    assert(!!r.styleUpgradeContent, 'beauty-pro 包含 styleUpgradeContent');
    const pp = r.personalPlan;
    assert(!!pp, 'personalPlan 存在');
    assert(pp.actionItems.length > 0, 'personalPlan.actionItems 非空');
    assert(pp.makeupRoutine.length > 0, 'personalPlan.makeupRoutine 非空');
    assert(pp.beautyTips.length > 0, 'personalPlan.beautyTips 非空');
    assert(pp.signatureLook.length > 5, 'personalPlan.signatureLook 有内容');
    console.log('  [personalPlan] routine: ' + pp.makeupRoutine[0]);
    console.log('  [personalPlan] signature: ' + pp.signatureLook);
  }
  console.log('');
}

// 旧报告兼容测试
console.log('=== 旧报告兼容测试 ===\n');
const legacyReport = {
  faceAnalysis: { faceShape: '圆脸', faceRatio: 0.85, symmetryScore: 0.82, description: 'test', highlightPoints: [] },
  faceShapeResult: { faceShape: '圆脸', confidence: 0.85 },
  featureHighlights: [],
  makeupStyle: { primaryStyle: '显瘦立体型', secondaryStyles: [], occasion: 'daily', confidence: 0.85 },
  makeupStyleDetail: { styleName: '立体修容妆', reason: 'test', suitableOccasion: '日常', keyPoints: [], avoidTips: [] },
  colorRecommendation: { skinToneCategory: 'warm', recommendedPalette: [], avoidColors: [], foundationTip: 'test' },
  colorAnalysis: { skinTone: '暖黄皮', skinToneCategory: 'warm', recommendedColors: [], avoidColors: [], foundationTip: 'test', seasonType: '春季型', dailyColors: [], specialColors: [] },
  styleDirection: { overallDirection: 'test', keyElements: [], avoidPatterns: [], vibeDescription: 'test' },
  productRecommendation: [],
  generatedAt: new Date().toISOString(),
  version: 'v2',
};
try {
  assert(legacyReport.version === 'v2', '旧报告version=v2');
  assert(!!legacyReport.faceAnalysis, '旧报告有faceAnalysis');
  assert(!!legacyReport.colorAnalysis, '旧报告有colorAnalysis');
  assert(!!legacyReport.makeupStyleDetail, '旧报告有makeupStyleDetail');
  console.log('  旧报告兼容测试通过 ✓');
} catch (e) {
  assert(false, '旧报告兼容失败: ' + e);
}

console.log('\n=== 测试结果汇总 ===');
console.log('通过: ' + passed + ', 失败: ' + failed + ', 总计: ' + (passed + failed));
if (failed > 0) {
  console.log('\n❌ 测试未全部通过');
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过');
  process.exit(0);
}
