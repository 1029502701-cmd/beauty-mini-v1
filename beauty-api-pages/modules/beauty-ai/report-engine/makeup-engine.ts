import type { FaceMetrics } from '../face-types';
import type { ReportSection } from './types';

/**
 * MakeupEngine generates base, eye, and lip makeup recommendations
 * based on facial measurements.
 */
export class MakeupEngine {
  /**
   * Generate makeup style recommendation section.
   */
  analyze(faceMetrics: FaceMetrics): ReportSection {
    const lines: string[] = [];

    // Base makeup
    const baseAdvice = this.getBaseAdvice(faceMetrics);
    lines.push('Base: ' + baseAdvice);

    // Eye makeup
    const eyeAdvice = this.getEyeAdvice(faceMetrics);
    lines.push('Eye makeup: ' + eyeAdvice);

    // Lip makeup
    const lipAdvice = this.getLipAdvice(faceMetrics);
    lines.push('Lip: ' + lipAdvice);

    return {
      title: 'Makeup Style',
      content: lines,
    };
  }

  private getBaseAdvice(metrics: FaceMetrics): string {
    if (metrics.faceRatio > 1.3) {
      return 'Use a matte finish with contour along the jawline to create definition for an elongated face.';
    }
    if (metrics.faceType === 'round') {
      return 'Apply highlighter on the cheekbones and contour the sides of the face for a sculpted look.';
    }
    return 'A dewy finish with light contour will enhance your natural glow.';
  }

  private getEyeAdvice(metrics: FaceMetrics): string {
    if (metrics.eyeDistance > 36) {
      return 'Use inner-corner highlight and tightline the upper lash line to bring attention inward.';
    }
    if (metrics.eyeWidthLeft + metrics.eyeWidthRight < 50) {
      return 'Opt for a soft, blended smoky eye to open up the eye area.';
    }
    return 'A classic cat-eye or subtle shimmer will complement your eye shape.';
  }

  private getLipAdvice(metrics: FaceMetrics): string {
    const lipWidth = metrics.lipWidth;
    if (lipWidth > 32) {
      return 'Define lips with a liner slightly inside the natural border for a polished look.';
    }
    if (lipWidth < 22) {
      return 'Overline subtly and use glossy finishes to add fullness and dimension.';
    }
    return 'Your lip proportion is balanced — try a bold matte shade for impact or a sheer balm for everyday.';
  }
}

/**
 * Generate product recommendations section.
 */
export function generateProductAdvice(
  faceMetrics: FaceMetrics,
  reportLevel: string,
): ReportSection {
  const lines: string[] = [];

  if (reportLevel === 'first-look') {
    lines.push('Essentials: hydrating primer, lightweight foundation, tinted balm.');
    lines.push('Keep it simple — focus on skin prep and a natural flush.');
  } else if (reportLevel === 'style-upgrade') {
    lines.push('Upgrade: color-correcting primer, setting spray, cream blush.');
    lines.push('Invest in a quality eyeshadow palette with warm neutrals.');
  } else {
    lines.push('Pro kit: full coverage foundation, color theory palette, precision brush set.');
    lines.push('Consider a personalized consultation for advanced techniques.');
  }

  // Nose width advice
  if (faceMetrics.noseWidth > 20) {
    lines.push('Nose contouring can create a more refined profile — use a cool-toned contour powder.');
  }

  return {
    title: 'Product Advice',
    content: lines,
  };
}

/**
 * Generate a daily beauty plan section.
 */
export function generateBeautyPlan(
  faceMetrics: FaceMetrics,
  reportLevel: string,
): ReportSection {
  const lines: string[] = [];

  const morningRoutine = reportLevel === 'first-look'
    ? ['Cleanse', 'Moisturize', 'Sunscreen', 'Tinted balm']
    : ['Cleanse', 'Serum', 'Moisturize', 'Primer', 'Foundation', 'Sunscreen'];

  const eveningRoutine = reportLevel === 'first-look'
    ? ['Cleanser', 'Toner', 'Moisturizer']
    : ['Double cleanse', 'Exfoliate (2x/week)', 'Serum', 'Eye cream', 'Night cream'];

  lines.push('Morning: ' + morningRoutine.join(' -> '));
  lines.push('Evening: ' + eveningRoutine.join(' -> '));

  if (reportLevel === 'beauty-pro') {
    lines.push('Weekly: sheet mask + facial massage 2x per week.');
    lines.push('Monthly: schedule a professional skin consultation.');
  }

  return {
    title: 'Beauty Plan',
    content: lines,
  };
}
