import React, { useState, useEffect } from 'react';
import { navigate } from '@taro/router';
import { Button, Text, View } from '@tarojs/components';
import './index.css';
import type { BeautyProfile, ReportLevel, ReportAccess, BeautyUser } from '@/types';
import { profileService } from '@/services/profile';
import permissionService from '@/services/permission-service';
import { fetchServerBalance, getUnlockRecords } from '@/services/token';
import userService from '@/services/user-service';

const LEVEL_ICONS: Record<ReportLevel, string> = {
  'first-look': '\U0001f331',
  'style-upgrade': '\U0001f33f',
  'beauty-pro': '\U0001f451',
};

const LEVEL_NAMES: Record<ReportLevel, string> = {
  'first-look': '\u521d\u89c1\u5986\u5986',
  'style-upgrade': '\u98ce\u683c\u8fdb\u9636',
  'beauty-pro': '\u4e13\u5c5e\u7f8e\u5b66',
};

const LEVEL_DESCRIPTIONS: Record<ReportLevel, string> = {
  'first-look': '\u57fa\u7840\u9762\u90e8\u5206\u6790',
  'style-upgrade': '\u8272\u5f69\u4e0e\u5986\u5986\u5efa\u8bae',
  'beauty-pro': '\u5b8c\u6574\u7f8e\u5b66\u65b9\u6848',
};

const Index = () => {
  const [profile, setProfile] = useState<BeautyProfile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [unlockRecords, setUnlockRecords] = useState<ReportAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserLevel, setCurrentUserLevel] = useState<ReportLevel>('first-look');
  const [currentUser, setCurrentUser] = useState<BeautyUser | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileData, user] = await Promise.all([
        profileService.getProfile(),
        userService.getCurrentUser() as Promise<BeautyUser>,
      ]);
      setProfile(profileData);
      setCurrentUser(user);
      const userId = user.userId;
      const levelResult = await permissionService.getAvailableLevel(userId);
      setCurrentUserLevel(levelResult);
      const balanceResult = await fetchServerBalance(userId);
      if (balanceResult.success && balanceResult.balance !== undefined) {
        setBalance(balanceResult.balance);
      }
      const records = getUnlockRecords(userId);
      setUnlockRecords(records);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('\u83b7\u53d6\u6863\u6848\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReportClick = (reportId: string) => {
    navigate('/pages/result?reportId=' + reportId);
  };

  const formatRelativeTime = (isoStr: string): string => {
    try {
      const now = new Date();
      const date = new Date(isoStr);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return '\u4eca\u5929';
      if (diffDays === 1) return '\u6628\u5929';
      if (diffDays < 7) return diffDays + '\u5929\u524d';
      if (diffDays < 30) return Math.floor(diffDays / 7) + '\u5468\u524d';
      return Math.floor(diffDays / 30) + '\u4e2a\u6708\u524d';
    } catch { return isoStr; }
  };

  const lastReportTime =
    profile?.reports && profile.reports.length > 0
      ? profile.reports.map((r) => r.createdAt).sort().reverse()[0]
      : null;

  if (loading) {
    return (
      <View className="profile-page profile-loading">
        <View className="loading-content">
          <View className="loading-icon">\u2728</View>
          <Text>\u52a0\u8f7d\u4e2d...</Text>
          <Text>\u6b63\u5728\u83b7\u53d6\u60a8\u7684\u7f8e\u5986\u6863\u6848</Text>
          <View className="loading-dots">
            <Text className="dot" /><Text className="dot" /><Text className="dot" />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="profile-page profile-error">
        <View className="error-content">
          <View className="error-icon">\ud83d\udce1</View>
          <Text>\u52a0\u8f7d\u5931\u8d25</Text>
          <Text className="error-message">{error}</Text>
          <View className="error-actions">
            <Button className="retry-btn btn-center" onClick={fetchData}>\u91cd\u65b0\u5c1d\u8bd5</Button>
            <Button className="back-btn btn-center" onClick={() => navigate('/pages/home')}>\u8fd4\u56de\u9996\u9875</Button>
          </View>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="profile-page profile-empty">
        <View className="empty-content">
          <View className="empty-icon">\ud83e\ude9e</View>
          <Text>\u6682\u65e0\u6863\u6848</Text>
          <Text>\u4e0a\u4f20\u7167\u7247\u8fdb\u884c AI \u7f8e\u5986\u5206\u6790\uff0c\u751f\u6210\u60a8\u7684\u4e13\u5c5e\u7f8e\u5986\u6863\u6848</Text>
          <Button className="start-btn btn-center" onClick={() => navigate('/pages/upload')}>\u5f00\u59cb\u5206\u6790</Button>
        </View>
      </View>
    );
  }

  return (
    <View className="profile-page">
      <View className="user-header">
        <View className="avatar-circle">
          <Text className="avatar-initial">
            {profile.nickname ? profile.nickname[0] : currentUser?.nickname?.[0] || 'U'}
          </Text>
        </View>
        <View className="user-info">
          <Text className="nickname">
            {profile.nickname || currentUser?.nickname || '\u7f8e\u5986\u7231\u597d\u8005'}
          </Text>
          <Text className="ai-style">
            {LEVEL_ICONS[currentUserLevel as ReportLevel]} {LEVEL_NAMES[currentUserLevel]}
          </Text>
          <Text className="level-description">
            {LEVEL_DESCRIPTIONS[currentUserLevel]}
          </Text>
        </View>
        <View className="level-badge-current">
          <Text className="level-dot" style={{ background: currentUserLevel === 'beauty-pro' ? '#c8a2c8' : currentUserLevel === 'style-upgrade' ? '#7c4dff' : '#aaa' }} />
          <Text className="level-text">{LEVEL_NAMES[currentUserLevel]}</Text>
        </View>
      </View>

      <View className="balance-card">
        <View className="balance-header">
          <Text className="balance-label">Token \u4f59\u989d</Text>
          <Text className="balance-value">{balance !== null ? balance : '\u2014'}</Text>
        </View>
        <Text className="balance-hint">Token \u7528\u4e8e\u89e3\u9501\u9ad8\u7ea7\u62a5\u544a\u7b49\u7ea7\uff0c\u6bcf\u65e5\u767b\u5f55\u53ef\u83b7\u53d6\u514d\u8d39 Token</Text>
        <Button className="topup-btn btn-center" onClick={() => navigate('/pages/purchase')}>\u5145\u503c Token</Button>
      </View>

      <View className="stats-card">
        <View className="stat-item">
          <Text className="stat-value">{profile.reports?.length || 0}</Text>
          <Text className="stat-label">\u5206\u6790\u62a5\u544a</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item">
          <Text className="stat-value">{lastReportTime ? formatRelativeTime(lastReportTime) : '\u2014'}</Text>
          <Text className="stat-label">\u6700\u8fd1\u5206\u6790</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item">
          <Text className="stat-value">{LEVEL_ICONS[currentUserLevel as ReportLevel]}</Text>
          <Text className="stat-label">\u5f53\u524d\u7b49\u7ea7</Text>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">\u89e3\u9501\u8bb0\u5f55</Text>
        {unlockRecords.length === 0 ? (
          <View className="empty-state">
            <View className="empty-state-icon">\U0001f513</View>
            <Text>\u6682\u65e0\u89e3\u9501\u8bb0\u5f55</Text>
          </View>
        ) : (
          <View className="unlock-list">
            {unlockRecords.map((record) => (
              <View key={record.reportId + record.level} className="unlock-item">
                <View className="unlock-icon">{LEVEL_ICONS[record.level as ReportLevel]}</View>
                <View className="unlock-info">
                  <Text className="unlock-level">{LEVEL_NAMES[record.level as ReportLevel]}</Text>
                  <Text className="unlock-meta">
                    {record.unlockType === 'free' ? '\u514d\u8d39\u89e3\u9501' : record.unlockType === 'token' ? 'Token \u89e3\u9501' : '\u652f\u4ed8\u89e3\u9501'} \u00b7 {formatRelativeTime(record.createdAt)}
                  </Text>
                </View>
                <Text className="unlock-status">\u5df2\u89e3\u9501</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="section">
        <Text className="section-title">\u6211\u7684\u62a5\u544a</Text>
        {!profile.reports || profile.reports.length === 0 ? (
          <View className="empty-state">
            <View className="empty-state-icon">\ud83d\udccb</View>
            <Text>\u6682\u65e0\u5206\u6790\u62a5\u544a</Text>
            <Button className="empty-state-btn btn-center" onClick={() => navigate('/pages/upload')}>\u4e0a\u4f20\u7167\u7247\u5206\u6790</Button>
          </View>
        ) : (
          <View className="reports-list">
            {profile.reports.map((report) => (
              <View key={report.reportId} className="report-item" onClick={() => handleReportClick(report.reportId)}>
                <View className="report-header">
                  <Text className="report-code">{report.reportCode}</Text>
                  <Text className="report-time">{lastReportTime ? formatRelativeTime(report.createdAt) : report.createdAt}</Text>
                </View>
                <View className="report-meta">
                  <Text className="report-style">
                    {LEVEL_ICONS[currentUserLevel as ReportLevel]} {report.styleName || 'AI\u5b9a\u4f4d\u4e2d'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {currentUserLevel !== 'beauty-pro' && (
        <View className="upgrade-card">
          <View className="upgrade-content">
            <Text className="upgrade-icon">\U0001f451</Text>
            <View className="upgrade-text">
              <Text className="upgrade-title">\u89e3\u9501\u4e13\u5c5e\u7f8e\u5b66</Text>
              <Text className="upgrade-desc">\u4fdd\u5b5830\u5929\u62a5\u544a\uff0c\u4eab\u53d7\u5b8c\u6574\u7f8e\u5986\u65b9\u6848</Text>
            </View>
          </View>
          <Button className="upgrade-btn btn-center" onClick={() => navigate('/pages/purchase')}>\u53bb\u514c\u6362</Button>
        </View>
      )}

      <View className="section explanation">
        <Text className="explanation-text">\u4e0a\u4f20\u6e05\u6670\u7684\u9762\u90e8\u7167\u7247\u8fdb\u884c AI \u7f8e\u5986\u5206\u6790\uff0c\u7cfb\u7edf\u5c06\u8bc6\u522b\u808c\u80a4\u3001\u4e94\u5b98\u7279\u5f81\uff0c\u5e76\u63d0\u4f9b\u4e2a\u6027\u5316\u7684\u5986\u5986\u5efa\u8bae\u548c\u5546\u54c1\u63a8\u8350\u3002\u6570\u636e\u4ec5\u4fdd\u5b58\u5728\u672c\u5730\uff0c\u4fdd\u62a4\u60a8\u7684\u9690\u79c1\u3002</Text>
      </View>
    </View>
  );
};

export default Index;



