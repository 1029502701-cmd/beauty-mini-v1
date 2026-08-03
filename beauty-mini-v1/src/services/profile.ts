import type { BeautyProfile } from "@/types/beauty";
import { api } from "@/services/api-client";

export class ProfileService {
  async getProfile(): Promise<BeautyProfile> {
    try {
      const response = await api.get('/profile');
      if (!response.success) {
        throw new Error(response.error || '获取档案失败');
      }
      return response.data as BeautyProfile;
    } catch (error) {
      console.error('Profile fetch failed, using mock data:', error);
      return this.getMockProfile();
    }
  }

  private getMockProfile(): BeautyProfile {
    return {
      userId: 'current_user_id',
      nickname: '用户',
      avatar: 'https://example.com/avatar.jpg',
      styleName: '清透自然型',
      reports: [
        {
          reportId: 'report_001',
          reportCode: 'BM202607300001',
          createdAt: '2026-07-25T10:30:00Z',
          styleName: '日系清新型',
        },
      ],
    };
  }
}

export const profileService = new ProfileService();
