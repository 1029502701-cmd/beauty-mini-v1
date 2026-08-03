/**
 * Product recommendation record returned by the recommendation engine.
 */
export interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category: string;
  category_cn: string;
  reason: string;
  matchScore: number;
}

/**
 * Creator (influencer) recommendation record returned by the recommendation engine.
 */
export interface CreatorRecommendation {
  id: string;
  creatorName: string;
  style: string;
  description: string;
  reason: string;
  matchScore: number;
}

/**
 * Input parameters for the recommendation engine.
 */
export interface RecommendInput {
  /** Facial shape: oval | heart | round | square | long | diamond */
  faceType: string;
  /** Skin type: dry | oily | normal | combination | sensitive */
  skinType: string;
  /** Preferred makeup style: daily | natural | fresh | formal | evening | special */
  makeupStyle: string;
  /** Optional user preference override (tag-based) */
  userPreference?: string;
}

/**
 * Combined recommendation result.
 */
export interface RecommendResult {
  products: ProductRecommendation[];
  creators: CreatorRecommendation[];
}
