import type { FaceMetrics, FaceMetricsRange } from "./types";

/**
 * FaceMetricMatcher - Numerical face metrics matching for V2 algorithm
 */
export class FaceMetricMatcher {

  /** Calculate score based on face metrics range matching */
  static match(userFaceMetrics: FaceMetrics, bloggerFaceRange?: FaceMetricsRange): number {
    if (!bloggerFaceRange) return 50; // default partial match when no range specified
    let totalScore = 0;
    const fields = [
      { key: "ratio", value: userFaceMetrics.faceRatio, range: bloggerFaceRange.faceRatioRange },
      { key: "jaw", value: userFaceMetrics.jawWidth, range: bloggerFaceRange.jawWidthRange },
      { key: "eyes", value: userFaceMetrics.eyeDistance, range: bloggerFaceRange.eyeDistanceRange },
      { key: "lips", value: userFaceMetrics.lipWidth, range: bloggerFaceRange.lipWidthRange },
      { key: "chin", value: userFaceMetrics.chinLength, range: bloggerFaceRange.chinLengthRange },
      { key: "nose", value: userFaceMetrics.noseWidth, range: bloggerFaceRange.noseWidthRange }
    ];
    for (const field of fields) {
      if (field.range && Array.isArray(field.range) && field.range.length === 2) {
        const [min, max] = field.range;
        if (field.value >= min && field.value <= max) {
          totalScore += 100 / fields.length; // full match on this field
        } else {
          // Partial match: closer to center = higher score
          const center = (min + max) / 2;
          const diff = Math.abs(field.value - center);
          const maxDiff = (max - min) / 2;
          const score = Math.max(0, Math.round((1 - diff / maxDiff) * 50));
          totalScore += score;
        }
      } else {
        totalScore += 25; // partial match when range not fully specified
      }
    }
    return Math.min(100, totalScore);
  }

  /** Generate reasons for face metric matching */
  static generateFaceReasons(userFace: FaceMetrics, bloggerFaceRange?: FaceMetricsRange): string[] {
    const reasons: string[] = [];
    if (!bloggerFaceRange) return [];
    const checks = [
      { key: "面宽", val: userFaceMetrics.jawWidth, range: bloggerFaceRange.jawWidthRange, label: "颌部宽度" },
      { key: "眼距", val: userFaceMetrics.eyeDistance, range: bloggerFaceRange.eyeDistanceRange, label: "眼距" },
      { key: "唇宽", val: userFaceMetrics.lipWidth, range: bloggerFaceRange.lipWidthRange, label: "唇部宽度" },
      { key: "鼻宽", val: userFaceMetrics.noseWidth, range: bloggerFaceRange.noseWidthRange, label: "鼻翼宽度" },
      { key: "下巴", val: userFaceMetrics.chinLength, range: bloggerFaceRange.chinLengthRange, label: "下巴长度" }
    ];
    for (const check of checks) {
      if (check.range && check.range.length === 2) {
        const [min, max] = check.range;
        if (check.val >= min && check.val <= max) {
          reasons.push(`你的${check.label}在理想范围${min}-${max}px内`);
        }
      }
    }
    return reasons.length > 0 ? reasons : ["面部数据比例协调"];
  }
}
