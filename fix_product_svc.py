path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\productService.ts"
content = r'''import { apiClient, callOrFallback } from "./apiClient";
import type { Product, ProductFilter, PaginatedResult, ApiResponse } from "@/types";

const API_PATH = "/api/admin/products";

const MOCK_PRODUCTS: Product[] = [
  { id: "p001", name: "丝绒哑光唇釉", brand: "完美日记", category: "唇妆", price: 79, originalPrice: 99, image: "", description: "丝绒触感，持久不掉色", platform: "淘宝", affiliateLink: "https://example.com/p1", stock: 1200, status: "active", featured: true, createdAt: "2026-01-01T08:00:00Z", updatedAt: "2026-07-20T10:00:00Z", recommendedTags: ["显白", "日常"] },
  { id: "p002", name: "水光眼影盘", brand: "花西子", category: "眼妆", price: 159, originalPrice: 199, image: "", description: "四色珠光，日常百搭", platform: "天猫", affiliateLink: "https://example.com/p2", stock: 800, status: "active", featured: true, createdAt: "2026-02-15T08:00:00Z", updatedAt: "2026-07-15T10:00:00Z", recommendedTags: ["珠光", "百搭"] },
  { id: "p003", name: "控油散粉", brand: "NARS", category: "底妆", price: 280, image: "", description: "长效持妆，清爽不脱妆", platform: "京东", affiliateLink: "https://example.com/p3", stock: 0, status: "sold_out", featured: false, createdAt: "2026-03-01T08:00:00Z", updatedAt: "2026-07-10T10:00:00Z", recommendedTags: ["持妆", "控油"] },
  { id: "p004", name: "修容高光盘", brand: "彩棠", category: "修容", price: 128, image: "", description: "立体轮廓，自然提亮", platform: "小红书", affiliateLink: "https://example.com/p4", stock: 500, status: "active", featured: false, createdAt: "2026-04-01T08:00:00Z", updatedAt: "2026-06-01T10:00:00Z", recommendedTags: ["立体", "自然"] },
];

export const fetchProducts = async (filter: ProductFilter = {}): Promise<PaginatedResult<Product>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set("keyword", filter.keyword);
  if (filter.category) params.set("category", filter.category);
  if (filter.platform) params.set("platform", filter.platform);
  if (filter.status) params.set("status", filter.status);
  if (filter.featured != null) params.set("featured", String(filter.featured));
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));

  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: Product[]; total: number; page: number; pageSize: number; totalPages: number }>>(`${API_PATH}?${params.toString()}`),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<Product>;
    throw new Error("no data");
  }).catch(() => fallbackMockProducts(filter));
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(id)}`, data),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

export const updateProductTags = async (id: string, recommendedTags: string[]): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(id)}/tags`, { recommendedTags }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

async function fallbackMockProducts(filter: ProductFilter = {}): Promise<PaginatedResult<Product>> {
  let items = [...MOCK_PRODUCTS];
  if (filter.keyword) items = items.filter((p) => p.name.includes(filter.keyword!) || p.brand.includes(filter.keyword!));
  if (filter.category) items = items.filter((p) => p.category === filter.category);
  if (filter.platform) items = items.filter((p) => p.platform === filter.platform);
  if (filter.status) items = items.filter((p) => p.status === filter.status);
  if (filter.featured != null) items = items.filter((p) => p.featured === filter.featured);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
'''
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("productService.ts fixed")
