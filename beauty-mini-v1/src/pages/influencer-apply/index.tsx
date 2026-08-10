import React, { useState } from 'react';
import { navigate } from '@taro/router';
import { Button, Input, Text, View } from '@tarojs/components';
import './index.scss';
import { api } from '@/services/api-client';

const PLATFORMS = [
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'douyin', label: '抖音' },
  { value: 'weibo', label: '微博' },
  { value: 'bilibili', label: 'B站' },
  { value: 'kuaishou', label: '快手' },
  { value: 'others', label: '其他' },
];

const STYLE_DIRECTIONS = [
  '清透自然', '韩系水光', '奶油雾面', '复古妆容',
  '通勤知性', '甜美少女', '酷飒个性', '日系清新',
  '中式古典', '欧美浓妆', '日常淡妆', '派对晚宴',
];

const InfluencerApplyPage = () => {
  const [nickname, setNickname] = useState('');
  const [platform, setPlatform] = useState('xiaohongshu');
  const [account, setAccount] = useState('');
  const [styleDirection, setStyleDirection] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!nickname.trim()) { setError('请填写昵称'); return; }
    if (!account.trim()) { setError('请填写平台账号'); return; }
    if (!styleDirection.trim()) { setError('请选择风格方向'); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/beauty/influencer/apply', {
        nickname: nickname.trim(),
        platform,
        account: account.trim(),
        style_direction: styleDirection.trim(),
        introduction: introduction.trim() || undefined,
        sample_images: [],
      });

      if (response.success) {
        navigate({ url: '/pages/influencer-status' });
      } else {
        setError(response.error || '提交失败，请重试');
      }
    } catch (err) {
      setError('网络异常，请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='influencer-apply-page'>
      <View className='header'>
        <Text className='title'>成为AI美学贡献者</Text>
        <Text className='subtitle'>加入我们的美妆风格社区，分享你的妆容理念</Text>
      </View>

      <View className='form-card'>
        {error && (
          <View className='error-banner'>
            <Text className='error-text'>{error}</Text>
          </View>
        )}

        <View className='form-group'>
          <Text className='label'>昵称 <Text className='required'>*</Text></Text>
          <Input
            className='input'
            value={nickname}
            placeholder='请输入你的昵称'
            maxlength={20}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='label'>平台 <Text className='required'>*</Text></Text>
          <View className='platform-selector'>
            {PLATFORMS.map((p) => (
              <View
                key={p.value}
                className={'platform-tag' + (platform === p.value ? ' active' : '')}
                onClick={() => setPlatform(p.value)}
              >
                {p.label}
              </View>
            ))}
          </View>
        </View>

        <View className='form-group'>
          <Text className='label'>平台账号 <Text className='required'>*</Text></Text>
          <Input
            className='input'
            value={account}
            placeholder='请输入你的平台账号ID'
            onInput={(e) => setAccount(e.detail.value)}
          />
        </View>

        <View className='form-group'>
          <Text className='label'>风格方向 <Text className='required'>*</Text></Text>
          <View className='style-tags'>
            {STYLE_DIRECTIONS.map((s) => (
              <View
                key={s}
                className={'style-tag' + (styleDirection === s ? ' active' : '')}
                onClick={() => setStyleDirection(s)}
              >
                {s}
              </View>
            ))}
          </View>
        </View>

        <View className='form-group'>
          <Text className='label'>个人介绍</Text>
          <Input
            className='input textarea'
            value={introduction}
            placeholder='简单介绍一下自己，50字以内'
            maxlength={50}
            onInput={(e) => setIntroduction(e.detail.value)}
          />
        </View>

        <Button
          className='submit-btn'
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        >
          {loading ? '提交中...' : '提交申请'}
        </Button>
      </View>

      <View className='footer-note'>
        <Text className='note'>AI美学贡献者仅分享妆容风格，不涉及商业推广</Text>
      </View>
    </View>
  );
};

export default InfluencerApplyPage;
