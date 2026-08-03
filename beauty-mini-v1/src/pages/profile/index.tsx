import React, { useState, useEffect } from 'react';
import { navigate } from '@taro/router';
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
      <div className="profile-page profile-loading">
        <div className="loading-content">
          <div className="loading-icon">\u2728</div>
          <h2>\u52a0\u8f7d\u4e2d...</h2>
          <p>\u6b63\u5728\u83b7\u53d6\u60a8\u7684\u7f8e\u5986\u6863\u6848</p>
          <div className="loading-dots">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page profile-error">
        <div className="error-content">
          <div className="error-icon">\ud83d\udce1</div>
          <h2>\u52a0\u8f7d\u5931\u8d25</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button className="retry-btn btn-center" onClick={fetchData}>\u91cd\u65b0\u5c1d\u8bd5</button>
            <button className="back-btn btn-center" onClick={() => navigate('/pages/home')}>\u8fd4\u56de\u9996\u9875</button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page profile-empty">
        <div className="empty-content">
          <div className="empty-icon">\ud83e\ude9e</div>
          <h2>\u6682\u65e0\u6863\u6848</h2>
          <p>\u4e0a\u4f20\u7167\u7247\u8fdb\u884c AI \u7f8e\u5986\u5206\u6790\uff0c\u751f\u6210\u60a8\u7684\u4e13\u5c5e\u7f8e\u5986\u6863\u6848</p>
          <button className="start-btn btn-center" onClick={() => navigate('/pages/upload')}>\u5f00\u59cb\u5206\u6790</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="user-header">
        <div className="avatar-circle">
          <span className="avatar-initial">
            {profile.nickname ? profile.nickname[0] : currentUser?.nickname?.[0] || 'U'}
          </span>
        </div>
        <div className="user-info">
          <h2 className="nickname">
            {profile.nickname || currentUser?.nickname || '\u7f8e\u5986\u7231\u597d\u8005'}
          </h2>
          <p className="ai-style">
            {LEVEL_ICONS[currentUserLevel as ReportLevel]} {LEVEL_NAMES[currentUserLevel]}
          </p>
          <p className="level-description">
            {LEVEL_DESCRIPTIONS[currentUserLevel]}
          </p>
        </div>
        <div className="level-badge-current">
          <span className="level-dot" style={{ background: currentUserLevel === 'beauty-pro' ? '#c8a2c8' : currentUserLevel === 'style-upgrade' ? '#7c4dff' : '#aaa' }} />
          <span className="level-text">{LEVEL_NAMES[currentUserLevel]}</span>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-header">
          <span className="balance-label">Token \u4f59\u989d</span>
          <span className="balance-value">{balance !== null ? balance : '\u2014'}</span>
        </div>
        <p className="balance-hint">Token \u7528\u4e8e\u89e3\u9501\u9ad8\u7ea7\u62a5\u544a\u7b49\u7ea7\uff0c\u6bcf\u65e5\u767b\u5f55\u53ef\u83b7\u53d6\u514d\u8d39 Token</p>
        <button className="topup-btn btn-center" onClick={() => navigate('/pages/purchase')}>\u5145\u503c Token</button>
      </div>

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-value">{profile.reports?.length || 0}</span>
          <span className="stat-label">\u5206\u6790\u62a5\u544a</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{lastReportTime ? formatRelativeTime(lastReportTime) : '\u2014'}</span>
          <span className="stat-label">\u6700\u8fd1\u5206\u6790</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{LEVEL_ICONS[currentUserLevel as ReportLevel]}</span>
          <span className="stat-label">\u5f53\u524d\u7b49\u7ea7</span>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">\u89e3\u9501\u8bb0\u5f55</h3>
        {unlockRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">\U0001f513</div>
            <p>\u6682\u65e0\u89e3\u9501\u8bb0\u5f55</p>
          </div>
        ) : (
          <div className="unlock-list">
            {unlockRecords.map((record) => (
              <div key={record.reportId + record.level} className="unlock-item">
                <div className="unlock-icon">{LEVEL_ICONS[record.level as ReportLevel]}</div>
                <div className="unlock-info">
                  <span className="unlock-level">{LEVEL_NAMES[record.level as ReportLevel]}</span>
                  <span className="unlock-meta">
                    {record.unlockType === 'free' ? '\u514d\u8d39\u89e3\u9501' : record.unlockType === 'token' ? 'Token \u89e3\u9501' : '\u652f\u4ed8\u89e3\u9501'} \u00b7 {formatRelativeTime(record.createdAt)}
                  </span>
                </div>
                <span className="unlock-status">\u5df2\u89e3\u9501</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">\u6211\u7684\u62a5\u544a</h3>
        {!profile.reports || profile.reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">\ud83d\udccb</div>
            <p>\u6682\u65e0\u5206\u6790\u62a5\u544a</p>
            <button className="empty-state-btn btn-center" onClick={() => navigate('/pages/upload')}>\u4e0a\u4f20\u7167\u7247\u5206\u6790</button>
          </div>
        ) : (
          <div className="reports-list">
            {profile.reports.map((report) => (
              <div key={report.reportId} className="report-item" onClick={() => handleReportClick(report.reportId)}>
                <div className="report-header">
                  <span className="report-code">{report.reportCode}</span>
                  <span className="report-time">{lastReportTime ? formatRelativeTime(report.createdAt) : report.createdAt}</span>
                </div>
                <div className="report-meta">
                  <span className="report-style">
                    {LEVEL_ICONS[currentUserLevel as ReportLevel]} {report.styleName || 'AI\u5b9a\u4f4d\u4e2d'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentUserLevel !== 'beauty-pro' && (
        <div className="upgrade-card">
          <div className="upgrade-content">
            <span className="upgrade-icon">\U0001f451</span>
            <div className="upgrade-text">
              <span className="upgrade-title">\u89e3\u9501\u4e13\u5c5e\u7f8e\u5b66</span>
              <span className="upgrade-desc">\u4fdd\u5b5830\u5929\u62a5\u544a\uff0c\u4eab\u53d7\u5b8c\u6574\u7f8e\u5986\u65b9\u6848</span>
            </div>
          </div>
          <button className="upgrade-btn btn-center" onClick={() => navigate('/pages/purchase')}>\u53bb\u514c\u6362</button>
        </div>
      )}

      <div className="section explanation">
        <p className="explanation-text">\u4e0a\u4f20\u6e05\u6670\u7684\u9762\u90e8\u7167\u7247\u8fdb\u884c AI \u7f8e\u5986\u5206\u6790\uff0c\u7cfb\u7edf\u5c06\u8bc6\u522b\u808c\u80a4\u3001\u4e94\u5b98\u7279\u5f81\uff0c\u5e76\u63d0\u4f9b\u4e2a\u6027\u5316\u7684\u5986\u5986\u5efa\u8bae\u548c\u5546\u54c1\u63a8\u8350\u3002\u6570\u636e\u4ec5\u4fdd\u5b58\u5728\u672c\u5730\uff0c\u4fdd\u62a4\u60a8\u7684\u9690\u79c1\u3002</p>
      </div>
    </div>
  );
};

export default Index;



