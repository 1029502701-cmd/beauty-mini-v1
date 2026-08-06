import { apiClient, callOrFallback } from './apiClient';
import type { BeautyReport, ReportFilter, PaginatedResult, ApiResponse } from '@/types';

const API_PATH = '/api/admin/reports';

const MOCK_REPORTS: BeautyReport[] = [
  { id: 'r001', userId: 'u001', userNickname: '小美', imageUrl: '', faceShape: '椭圆脸', eyeShape: '桃花眼', skinTone: '暖白皮', overallScore: 88, level: 'advanced', createdAt: '2026-07-30T10:00:00Z', status: 'completed', unlockStatus: 'free' },
  { id: 'r002', userId: 'u002', userNickname: '美妆达人Lisa', imageUrl: '', faceShape: '圆脸', eyeShape: '杏眼', skinTone: '自然色', overallScore: 75, level: 'intermediate', createdAt: '2026-07-29T14:00:00Z', status: 'completed', unlockStatus: 'locked' },
  { id: 'r003', userId: 'u003', userNickname: '桃子酱', imageUrl: '', faceShape: '方脸', eyeShape: '丹凤眼', skinTone: '小麦色', overallScore: 70, level: 'beginner', createdAt: '2026-07-25T08:00:00Z', status: 'completed', unlockStatus: 'free' },
  { id: 'r004', userId: 'u004', userNickname: '彩妆控Coco', imageUrl: '', faceShape: '心形脸', eyeShape: '荔枝眼', skinTone: '冷白皮', overallScore: 92, level: 'advanced', createdAt: '2026-07-31T09:00:00Z', status: 'completed', unlockStatus: 'unlocked' },
  { id: 'r005', userId: 'u001', userNickname: '小美', imageUrl: '', faceShape: '椭圆脸', eyeShape: '桃花眼', skinTone: '暖白皮', overallScore: 0, level: 'beginner', createdAt: '2026-07-28T16:00:00Z', status: 'failed', unlockStatus: 'locked' },
];

export const fetchReports = async (filter: ReportFilter = {}): Promise<PaginatedResult<BeautyReport>> => {
  const params = new URLSearchParams();
  if (filter.keyword) params.set('keyword', filter.keyword);
  if (filter.level) params.set('level', filter.level);
  if (filter.status) params.set('status', filter.status);
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
  const url = API_PATH + '?' + params.toString();
  return callOrFallback(
    () => apiClient.get<ApiResponse<{ items: BeautyReport[]; total: number; page: number; pageSize: number; totalPages: number }>>(url),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as PaginatedResult<BeautyReport>;
    throw new Error('no data');
  }).catch(() => fallbackMockReports(filter));
};

export const fetchReportDetail = async (reportId: string): Promise<BeautyReport> => {
  const url = API_PATH + '/' + encodeURIComponent(reportId);
  return callOrFallback(
    () => apiClient.get<ApiResponse<BeautyReport>>(url),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as BeautyReport;
    throw new Error('no data');
  }).catch(() => {
    const found = MOCK_REPORTS.find((r) => r.id === reportId);
    return found || MOCK_REPORTS[0];
  });
};

export const deleteReport = async (reportId: string): Promise<void> => {
  const url = API_PATH + '/' + encodeURIComponent(reportId);
  await callOrFallback(
    () => apiClient.delete<void>(url),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

export const unlockReport = async (reportId: string, status: 'locked' | 'unlocked'): Promise<void> => {
  const url = API_PATH + '/' + encodeURIComponent(reportId) + '/unlock';
  await callOrFallback(
    () => apiClient.patch<void>(url, { unlockStatus: status }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};

async function fallbackMockReports(filter: ReportFilter = {}): Promise<PaginatedResult<BeautyReport>> {
  let items = [...MOCK_REPORTS];
  if (filter.keyword) items = items.filter((r) => r.userNickname.includes(filter.keyword!));
  if (filter.level) items = items.filter((r) => r.level === filter.level);
  if (filter.status) items = items.filter((r) => r.status === filter.status);
  const pageSize = filter.pageSize || 10;
  const page = filter.page || 1;
  const total = items.length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
