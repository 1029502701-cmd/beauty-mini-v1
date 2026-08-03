import type { FaceMetrics, SkinTone } from '../face-types';
import type { ReportSection } from './types';

/**
 * StyleEngine determines facial style recommendations from face metrics
 * and optionally from a skin-tone hint in the user profile.
 */
export class StyleEngine {
  /**
   * Analyze face metrics and produce a style recommendation section.
   */
  analyze(faceMetrics: FaceMetrics, skinTone?: SkinTone): ReportSection {
    const faceRatio = faceMetrics.faceRatio;
    const eyeDistance = faceMetrics.eyeDistance;
    const faceType = faceMetrics.faceType;

    const lines: string[] = [];

    // Face shape recommendation
    if (faceRatio > 1.4) {
      lines.push('Your face shape is elongated. Soft, rounded hairstyles and side-swept bangs will balance your proportions.');
    } else if (faceRatio < 1.1) {
      lines.push('Your face shape is broad. Voluminous hairstyles on top and vertical lines will add elegance.');
    } else {
      lines.push('Your face ratio is well-balanced. Most hairstyles and makeup styles will complement your features.');
    }

    // Eye distance
    if (eyeDistance > 40) {
      lines.push('Wider-set eyes: focus eyeliner on the inner corners and use contouring to create depth.');
    } else if (eyeDistance < 24) {
      lines.push('Close-set eyes: widen the outer corner with winged liner and highlight the brow bone.');
    } else {
      lines.push('Your eye spacing is ideal. Balanced eyeliner and eyeshadow techniques will enhance your look.');
    }

    // Skin tone color advice
    if (skinTone) {
      const toneAdvice = this.getColorAdviceForSkinTone(skinTone);
      lines.push(toneAdvice);
    }

    return {
      title: 'Style Analysis',
      content: lines,
    };
  }

  private getColorAdviceForSkinTone(skinTone: SkinTone): string {
    const advice: Record<SkinTone, string> = {
      fair: 'Fair skin pairs beautifully with cool-toned pinks, mauves, and rose-gold eyeshadows.',
      medium: 'Medium skin shines with warm earth tones, bronze, and coral lip colors.',
      warm: 'Warm skin tones are enhanced by golden bronzes, terracotta, and olive-green eyeshadows.',
      olive: 'Olive skin looks stunning with jewel tones — emerald, sapphire, and deep plum.',
      dark: 'Dark skin glows with rich metallics, bold berries, and vivid orange-red lips.',
    };
    return advice[skinTone];
  }
}
