import { apiClient, callOrFallback } from './apiClient';
import type { TokenPackage, TokenOrder, TokenOrderFilter, PaginatedResult, ApiResponse } from '@/types';

const API_PATH = '/api/admin/tokens';

const MOCK_PACKAGES: TokenPackage[] = [
  { id: 'pkg001', name: '新手包', tokens: 10, price: 9.9, discountRate: 1.0, status: 'active', createdAt: '2025-01-01T08:00:00Z', updatedAt: '2025-01-01T08:00:00Z' },
  { id: 'pkg002', name: '进阶包', tokens: 50, price: 39.9, discountRate: 0.9, status: 'active', createdAt: '2025-01-01T08:00:00Z', updatedAt: '2026-06-01T08:00:00Z' },
  { id: 'pkg003', name: '专业包', tokens: 200, price: 139.9, discountRate: 0.85, status: 'active', createdAt: '2025-01-01T08:00:00Z', updatedAt: '2026-06-01T08:00:00Z' },
  { id: 'pkg004', name: '年度会员', tokens: 1000, price: 499, discountRate: 0.75, status: 'inactive', createdAt: '2025-01-01T08:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
];

const MOCK_ORDERS: TokenOrder[] = [
  { id: 'o001', userId: 'u001', userNickname: '小美', packageId: 'pkg002', packageName: '进阶包', tokenAmount: 50, amount: 39.9, status: 'paid', paidAt: '2026-07-29T14:00:00Z', createdAt: '2026-07-29T13:58:00Z' },
  { id: 'o002', userId: 'u004', userNickname: '彩妆控Coco', packageId: 'pkg003', packageName: '专业包', tokenAmount: 200, amount: 139.9, status: 'paid', paidAt: '2026-07-30T09:00:00Z', createdAt: '2026-07-30T08:55:00Z' },
  { id: 'o003', userId: 'u002', userNickname: '美妆达人Lisa', packageId: 'pkg001', packageName: '新手包', tokenAmount: 10, amount: 9.9, status: 'pending', createdAt: '2026-07-31T10:00:00Z' },
  { id: 'o004', userId: 'u003', userNickname: '桃子酱', packageId: 'pkg002', packageName: '进阶包', tokenAmount: 50, amount: 39.9, status: 'refunded', paidAt: '2026-07-20T08:00:00Z', createdAt: '2026-07-15T10:00:00Z' },
];

export const fetchTokenPackages = async (): Promise<TokenPackage[]> => {
  return callOrFallback(
    () => apiClient.get<ApiResponse<TokenPackage[]>>(API_PATH + '/packages'),
    undefined!
  ).then((res) => res?.data ?? MOCK_PACKAGES).catch(() => MOCK_PACKAGES);
};

export const fetchTokenOrders = async (filter: TokenOrderFilter = {}): Promise<PaginatedResult<TokenOrder>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set('keyword', filter.keyword);
  if (filter.status) params.set('status', filter.status);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
  const url = API_PATH + '/orders?' + params.toString();
  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: TokenOrder[]; total: number; page: number; pageSize: number; totalPages: number }>>(url),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<TokenOrder>;
    throw new Error('no data');
  }).catch(() => fallbackMockOrders(filter));
};

export const updatePackageStatus = async (id: string, status: TokenPackage['status']): Promise<void> => {
  const url = API_PATH + '/packages/' + encodeURIComponent(id) + '/status';
  await callOrFallback(
    () => apiClient.patch<void>(url, { status }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

export const updatePackage = async (id: string, data: Partial<TokenPackage>): Promise<TokenPackage> => {
  try {
    const url = API_PATH + '/packages/' + encodeURIComponent(id);
    const res = await apiClient.patch<ApiResponse<TokenPackage>>(url, data);
    if (res?.data) return res.data;
  } catch {}
  return {
    id, name: data.name || '', tokens: data.tokens || 0, price: data.price || 0,
    discountRate: data.discountRate || 1, status: data.status || 'active',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  } as TokenPackage;
};

async function fallbackMockOrders(filter: TokenOrderFilter = {}): Promise<PaginatedResult<TokenOrder>> {
  let items = [...MOCK_ORDERS];
  if (filter.keyword) items = items.filter((o) => o.userNickname.includes(filter.keyword!));
  if (filter.status) items = items.filter((o) => o.status === filter.status);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
