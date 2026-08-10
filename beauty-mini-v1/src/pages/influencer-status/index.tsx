import React, { useState, useEffect } from 'react';
import { navigate } from '@taro/router';
import { Button, Text, View } from '@tarojs/components';
import './index.scss';
import { api } from '@/services/api-client';

type AppStatus = 'pending' | 'approved' | 'rejected';

interface Application {
  id: string;
  status: AppStatus;
  created_at: string;
  updated_at: string;
  nickname: string;
  style_direction: string;
  review_message?: string | null;
}

const InfluencerStatusPage = () => {
  const [loading, setLoading] = useState(true);
  const [hasApplication, setHasApplication] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/api/beauty/influencer/status');
      if (response.success && response.data) {
        setHasApplication(response.data.hasApplication);
        setApplication(response.data.application || null);
      } else {
        setError(response.error || '加载失败');
      }
    } catch {
      setError('网络异常，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: AppStatus) => {
    switch (status) {
      case 'pending':
        return { icon: '\u231b', title: '审核中', desc: '管理员正在审核您的申请，预计1-3个工作日', color: '#f5a0b8' };
      case 'approved':
        return { icon: '\u2705', title: '审核通过', desc: '恭喜！您已成为AI美学贡献者', color: '#66bb6a' };
      case 'rejected':
        return { icon: '\u274c', title: '审核未通过', desc: '很遗憾，您的申请未通过审核', color: '#ef5350' };
    }
  };

  if (loading) {
    return (
      <View className='status-page'>
        <View className='loading-state'>
          <Text className='loading-icon'>\u2728</Text>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className='status-page'>
        <View className='error-state'>
          <Text className='error-icon'>\ud83d\ude25</Text>
          <Text className='error-text'>{error}</Text>
          <Button className='retry-btn' onClick={fetchStatus}>重试</Button>
        </View>
      </View>
    );
  }

  if (!hasApplication) {
    return (
      <View className='status-page'>
        <View className='empty-state'>
          <Text className='empty-icon'>\ud83d\udc96</Text>
          <Text className='empty-title'>尚未提交申请</Text>
          <Text className='empty-desc'>成为AI美学贡献者，与更多人分享你的妆容风格</Text>
          <Button className='apply-btn' onClick={() => navigate('/pages/influencer-apply')}>
            立即申请
          </Button>
        </View>
      </View>
    );
  }

  const info = application ? getStatusInfo(application.status) : { icon: '?', title: '', desc: '', color: '#999' };

  return (
    <View className='status-page'>
      <View className='status-card'>
        <View className='status-icon' style={{ color: info.color }}>
          <Text>{info.icon}</Text>
        </View>
        <Text className='status-title'>{info.title}</Text>
        <Text className='status-desc'>{info.desc}</Text>

        {application?.status === 'rejected' && application.review_message && (
          <View className='review-message'>
            <Text className='review-label'>审核意见：</Text>
            <Text className='review-text'>{application.review_message}</Text>
          </View>
        )}

        {application?.status === 'approved' && (
          <View className='approved-badge'>
            <Text className='badge-text'>\ud83c\udf1f AI美学贡献者</Text>
          </View>
        )}

        <View className='status-meta'>
          <Text className='meta-text'>提交时间：{application?.created_at ? new Date(application.created_at).toLocaleDateString('zh-CN') : '--'}</Text>
          {application?.updated_at && application.created_at !== application.updated_at && (
            <Text className='meta-text'>审核时间：{new Date(application.updated_at).toLocaleDateString('zh-CN')}</Text>
          )}
        </View>
      </View>

      <View className='actions'>
        {application?.status === 'pending' && (
          <Button className='back-btn' onClick={() => navigate('/pages/home')}>返回首页</Button>
        )}
        {application?.status === 'rejected' && (
          <Button className='reapply-btn' onClick={() => navigate('/pages/influencer-apply')}>
            重新申请
          </Button>
        )}
        {application?.status === 'approved' && (
          <Button className='home-btn' onClick={() => navigate('/pages/home')}>返回首页</Button>
        )}
      </View>
    </View>
  );
};

export default InfluencerStatusPage;
