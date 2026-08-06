export interface ShareCardData {
  reportId: string;
  beautyScore: number;
  faceShape: string;
  makeupStyle: string;
  topRecommendation: string;
  bloggerRecommendation: string;
  createdAt: string;
}

export interface ShareCardDisplay {
  title: string;
  subtitle: string;
  score: number;
  tags: string[];
}

export type TemplateType = "default" | "minimal" | "premium";
