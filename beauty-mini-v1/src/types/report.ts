export interface Profile {
  faceShape: string;
  style: string;
  description: string;
}

export interface Features {
  eyes: string;
  brows: string;
  nose: string;
  lips: string;
}

export interface MakeupReport {
  styles: string[];
}

export interface ColorReport {
  recommendations: string[];
}

export interface ProductPlaceholder {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: "brow" | "eye" | "lip" | "skincare";
  price: number;
  reason: string;
}

export interface BloggerPlaceholder {
  id: string;
  name: string;
  avatar: string;
  platform?: "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  description: string;
  styleTags: string[];
}

export interface BeautyReport {
  id: string;
  reportCode: string;
  createdAt: string;
  profile: Profile;
  features: Features;
  makeup: MakeupReport;
  colors: ColorReport;
  products: ProductPlaceholder[];
  bloggers: BloggerPlaceholder[];
}

export interface ReportSummary {
  id: string;
  reportCode: string;
  createdAt: string;
  styleName: string;
}
