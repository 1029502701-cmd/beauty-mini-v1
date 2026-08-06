import { apiClient, callOrFallback } from './apiClient';
import type { User, UserFilter, PaginatedResult, ApiResponse } from '@/types';

const API_PATH = '/api/admin/users';

const MOCK_USERS: User[] = [
  { id: 'u001', nickname: '小美', avatar: '', sessionCount: 12, totalAnalyses: 38, totalReports: 35, beautyPro: true, createdAt: '2026-01-15T08:00:00Z', lastActiveAt: '2026-07-30T14:22:00Z', status: 'active' },
  { id: 'u002', nickname: '美妆达人Lisa', avatar: '', sessionCount: 8, totalAnalyses: 20, totalReports: 18, beautyPro: false, createdAt: '2026-02-20T10:00:00Z', lastActiveAt: '2026-07-29T09:15:00Z', status: 'active' },
  { id: 'u003', nickname: '桃子酱', avatar: '', sessionCount: 3, totalAnalyses: 5, totalReports: 5, beautyPro: false, createdAt: '2026-03-10T12:00:00Z', lastActiveAt: '2026-07-25T16:00:00Z', status: 'inactive' },
  { id: 'u004', nickname: '彩妆控Coco', avatar: '', sessionCount: 50, totalAnalyses: 120, totalReports: 115, beautyPro: true, createdAt: '2026-01-01T08:00:00Z', lastActiveAt: '2026-07-31T11:30:00Z', status: 'active' },
  { id: 'u005', nickname: '小白用户', avatar: '', sessionCount: 1, totalAnalyses: 1, totalReports: 1, beautyPro: false, createdAt: '2026-07-01T08:00:00Z', lastActiveAt: '2026-07-01T08:05:00Z', status: 'banned' },
];

export const fetchUsers = async (filter: UserFilter = {}): Promise<PaginatedResult<User>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set('keyword', filter.keyword);
  if (filter.status) params.set('status', filter.status);
  if (filter.beautyPro != null) params.set('beautyPro', String(filter.beautyPro));
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
  const url = API_PATH + '?' + params.toString();
  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: User[]; total: number; page: number; pageSize: number; totalPages: number }>>(url),
    undefined!
  ).then((res) => {
    const data = res?.data;
    if (data) return data as PaginatedResult<User>;
    throw new Error('no data');
  }).catch(() => fallbackMockUsers(filter));
};

export const fetchUserDetail = async (userId: string): Promise<User> => {
  const url = API_PATH + '/' + encodeURIComponent(userId);
  return callOrFallback(
    () => apiClient.get<ApiResponse<User>>(url),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as User;
    throw new Error('no data');
  }).catch(() => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    return found || MOCK_USERS[0];
  });
};

export const updateUserStatus = async (userId: string, status: User['status']): Promise<void> => {
  const url = API_PATH + '/' + encodeURIComponent(userId) + '/status';
  await callOrFallback(
    () => apiClient.patch<void>(url, { status }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

async function fallbackMockUsers(filter: UserFilter = {}): Promise<PaginatedResult<User>> {
  let items = [...MOCK_USERS];
  if (filter.keyword) items = items.filter((u) => u.nickname.includes(filter.keyword!));
  if (filter.status) items = items.filter((u) => u.status === filter.status);
  if (filter.beautyPro != null) items = items.filter((u) => u.beautyPro === filter.beautyPro);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
