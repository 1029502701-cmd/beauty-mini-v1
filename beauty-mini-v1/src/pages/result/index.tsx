import React, { useState, useEffect, useCallback } from 'react';
import { navigate, useQueryParams } from '@taro/router';
import './index.css';
import { getReport } from '../../services/api';
import { generateAllRecommendations } from '../../recommendation/engine';
import reportAccessService from '../../services/reportAccessService';
import { getStorage } from '../../utils/storage';
import type { BeautyReport, ReportLevel, CreatorRecommendation, ProductRecommendation, UserTokenBalance } from '../../types';
import { REPORT_LEVELS } from '../../types/report-level';

import ReportHeader from '../../components/report/ReportHeader';
import FaceAnalysisCard from '../../components/report/FaceAnalysisCard';
import MakeupSuggestionCard from '../../components/report/MakeupSuggestionCard';
import ColorAnalysisCard from '../../components/report/ColorAnalysisCard';
import ProductCard from '../../components/report/ProductCard';
import CreatorCard from '../../components/report/CreatorCard';

const LEVEL_ORDER: ReportLevel[] = ['first-look', 'style-upgrade', 'beauty-pro'];
const LEVEL_LABELS: Record<ReportLevel, string> = {
  'first-look': '初见妆容',
  'style-upgrade': '风格进阶',
  'beauty-pro': '专属美学'
};

type LevelDisplayState = 'purchased' | 'unlocked' | 'locked';

const LOCAL_REPORT_KEY = 'last_beauty_report';

const Index = () => {
  const [queryParams] = useQueryParams();
  const reportId = (queryParams.reportId as string) || null;
  const [report, setReport] = useState<BeautyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<ReportLevel | null>(null);
  const [recommendedCreators, setRecommendedCreators] = useState<CreatorRecommendation[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductRecommendation[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<UserTokenBalance | null>(null);
  const [levelStates, setLevelStates] = useState<Record<ReportLevel, LevelDisplayState>>({
    'first-look': 'purchased',
    'style-upgrade': 'locked',
    'beauty-pro': 'locked',
  });

  const fetchReport = useCallback(async () => {
    if (!reportId) {
      const localReport = getStorage<BeautyReport>(LOCAL_REPORT_KEY);
      if (localReport) {
        setReport(localReport);
        setLoading(false);
        return;
      }
      setError('无效的报告ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getReport(reportId);
      if (result.success && result.report) {
        setReport(result.report);
      } else {
        const localReport = getStorage<BeautyReport>(LOCAL_REPORT_KEY);
        if (localReport) {
          setReport(localReport);
        } else {
          setError(result.error || '报告暂不可用');
        }
      }
    } catch (err) {
      console.error('[Result] fetchReport error:', err);
      const localReport = getStorage<BeautyReport>(LOCAL_REPORT_KEY);
      if (localReport) {
        setReport(localReport);
      } else {
        setError('报告暂不可用');
      }
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  const fetchLocalRecommendations = useCallback(async () => {
    if (!report) return;
    setRecommendLoading(true);
    try {
      const result = await generateAllRecommendations(report);
      setRecommendedCreators(result.creators);
      setRecommendedProducts(result.products);
    } catch (err) {
      console.error('[Result] local recommendations error:', err);
    } finally {
      setRecommendLoading(false);
    }
  }, [report]);

  const fetchTokenBalance = useCallback(async () => {
    try {
      const balance = await reportAccessService.getBalance();
      setTokenBalance(balance);
    } catch {
      setTokenBalance({
        userId: 'unknown',
        balance: 0,
        freeBalance: 0,
        purchasedBalance: 0,
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  const fetchAccessStatus = useCallback(async () => {
    if (!reportId) return;
    try {
      const statuses = await reportAccessService.getAccessStatusForReport(reportId);
      const reportLevel = report?.level || 'first-look';
      const idx = LEVEL_ORDER.indexOf(reportLevel as ReportLevel);
      const newStates: Record<ReportLevel, LevelDisplayState> = {
        'first-look': 'purchased',
        'style-upgrade': 'locked',
        'beauty-pro': 'locked',
      };
      for (const level of LEVEL_ORDER) {
        const levelIdx = LEVEL_ORDER.indexOf(level);
        if (levelIdx <= idx) {
          newStates[level] = statuses[level] === 'unlocked' ? 'purchased' : 'locked';
        } else {
          newStates[level] = statuses[level] === 'unlocked' ? 'unlocked' : 'locked';
        }
      }
      setLevelStates(newStates);
    } catch {
      // keep defaults
    }
  }, [reportId, report]);

  useEffect(() => {
    fetchReport();
    fetchTokenBalance();
  }, [fetchReport, fetchTokenBalance]);

  useEffect(() => {
    if (report) {
      fetchLocalRecommendations();
    }
  }, [report, fetchLocalRecommendations]);

  useEffect(() => {
    if (reportId) {
      fetchAccessStatus();
    }
  }, [reportId, fetchAccessStatus]);

  const handleUnlock = useCallback((level: ReportLevel) => {
    setUnlockTarget(level);
    setShowUnlockDialog(true);
  }, []);

  const handleCloseUnlock = useCallback(() => {
    setShowUnlockDialog(false);
    setUnlockTarget(null);
  }, []);

  const handleConfirmUnlock = useCallback(async () => {
    if (!unlockTarget || !reportId) return;
    try {
      await reportAccessService.unlockReport(reportId, unlockTarget);
      setShowUnlockDialog(false);
      setUnlockTarget(null);
      const newStates = { ...levelStates };
      newStates[unlockTarget] = 'unlocked';
      setLevelStates(newStates);
    } catch (err) {
      console.error('[Result] unlock error:', err);
    }
  }, [unlockTarget, reportId, levelStates]);

  const currentBalance = tokenBalance?.balance ?? 0;
  const accessibleLevels = LEVEL_ORDER.filter((level) => levelStates[level] !== 'locked');
  const levelContent = report?.content;
  const reportLevel = report?.level || 'first-look';
  const isProLocked = !accessibleLevels.includes('beauty-pro');

  if (loading) {
    return (
      <div className='result-page'>
        <div className='loading-state'>
          <div className='loading-spinner' />
          <p>正在加载报告...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='result-page result-error'>
        <div className='error-content'>
          <div className='error-icon'>❌</div>
          <h2>报告暂不可用</h2>
          <p className='error-message'>{error}</p>
          <div className='error-actions'>
            <button className='retry-btn' onClick={() => fetchReport()}>重新加载</button>
            <button className='back-btn' onClick={() => navigate('/pages/home')}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className='result-page result-empty'>
        <div className='empty-content'>
          <div className='empty-icon'>🔍</div>
          <h2>报告暂不可用</h2>
          <p className='empty-message'>报告数据尚未生成，请稍后查看或重新分析</p>
          <div className='empty-actions'>
            <button className='start-btn' onClick={() => navigate('/pages/upload')}>重新分析</button>
            <button className='back-btn' onClick={() => navigate('/pages/home')}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  const isUpgradeLocked = !accessibleLevels.includes('style-upgrade');

  return (
    <div className='result-page'>
      {/* Token Balance Bar - Task 2 */}
      <div className='token-balance-bar'>
        <div className='token-balance-left'>
          <span className='token-icon'>🎫</span>
          <span className='token-amount'>{currentBalance} Token</span>
        </div>
        <button className='token-topup-btn' onClick={() => navigate('/pages/token')}>充值</button>
      </div>

      {/* Report Level Badge - Task 1 */}
      <div className='report-level-badge'>
        <span className='level-badge-icon'>{REPORT_LEVELS[reportLevel].icon}</span>
        <div className='level-badge-text'>
          <span className='level-badge-name'>{REPORT_LEVELS[reportLevel].name}</span>
          <span className='level-badge-tag'>
            {reportLevel === 'first-look' ? '免费体验' : reportLevel === 'style-upgrade' ? '进阶分析' : '专属美学'}
          </span>
        </div>
        {isProLocked && (
          <button className='upgrade-cta-btn btn-center' onClick={() => navigate("/pages/purchase")}>解锁专属美学
          </button>
        )}
      </div>

      {/* Level Status Bar - Task 1 */}
      <div className='level-status-bar'>
        {LEVEL_ORDER.map((level) => {
          const cfg = REPORT_LEVELS[level];
          const state = levelStates[level];
          return (
            <div key={level} className={'level-status-item ' + state}>
              <span className='level-status-icon'>{cfg.icon}</span>
              <span className='level-status-name'>{cfg.name}</span>
              <span className='level-status-badge'>
                {state === 'purchased' ? '已购' : state === 'unlocked' ? '已解锁' : '🔒'}
              </span>
              {!cfg.isFree && (
                <span className='level-status-cost'>{cfg.tokenCost} Token</span>
              )}
            </div>
          );
        })}
      </div>

      <ReportHeader report={report} />

      {accessibleLevels.includes('first-look') && (
        <div className='section-block'>
          <div className='section-anchor'>
            <span className='anchor-num'>01</span>
            <span className='anchor-label'>面部分析</span>
          </div>
          {levelContent?.faceAnalysis ? (
            <FaceAnalysisCard
              content={levelContent.faceAnalysis}
              faceShape={report.profile.faceShape}
              skinType={report.analysis?.skinType}
              oilLevel={report.analysis?.oilLevel}
              hydrationLevel={report.analysis?.hydrationLevel}
            />
          ) : (
            <div className='empty-module'><p>暂无内容</p></div>
          )}
        </div>
      )}

      {accessibleLevels.includes('style-upgrade') && (
        <div className='section-block'>
          <div className='section-anchor'>
            <span className='anchor-num'>02</span>
            <span className='anchor-label'>妆容建议</span>
          </div>
          {levelContent?.makeupStyle ? (
            <MakeupSuggestionCard
              content={levelContent.makeupStyle}
              suggestions={report.analysis?.suggestions}
            />
          ) : (
            <div className='empty-module'><p>暂无内容</p></div>
          )}
        </div>
      )}

      {accessibleLevels.includes('style-upgrade') && (
        <div className='section-block'>
          <div className='section-anchor'>
            <span className='anchor-num'>03</span>
            <span className='anchor-label'>色彩分析</span>
          </div>
          {levelContent?.colorAnalysis ? (
            <ColorAnalysisCard content={levelContent.colorAnalysis} />
          ) : (
            <div className='empty-module'><p>暂无内容</p></div>
          )}
        </div>
      )}

      {accessibleLevels.includes('beauty-pro') && (
        <div className='section-block'>
          <div className='section-anchor'>
            <span className='anchor-num'>04</span>
            <span className='anchor-label'>产品推荐</span>
          </div>
          {levelContent?.productRecommendation && levelContent.productRecommendation.length > 0 ? (
            <div className='product-list'>
              {levelContent.productRecommendation.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          ) : (
            <div className='empty-module'><p>暂无内容</p></div>
          )}
        </div>
      )}

      {accessibleLevels.includes('beauty-pro') && (
        <div className='section-block'>
          <div className='section-anchor'>
            <span className='anchor-num'>05</span>
            <span className='anchor-label'>达人推荐</span>
          </div>
          {recommendLoading ? (
            <div className='loading-state' style={{ padding: '20px 0' }}>
              <div className='loading-spinner' />
              <p>AI 匹配达人中...</p>
            </div>
          ) : (levelContent?.creators && levelContent.creators.length > 0) || recommendedCreators.length > 0 ? (
            <div className='bloggers-grid'>
              {(levelContent?.creators || recommendedCreators).map((c) => (
                <CreatorCard key={c.id} creator={c as CreatorRecommendation} />
              ))}
            </div>
          ) : (
            <div className='empty-module'><p>暂无内容</p></div>
          )}
        </div>
      )}

      {/* Locked: style-upgrade */}
      {isUpgradeLocked && (
        <div className='section-block locked-section'>
          <div className='section-anchor'>
            <span className='anchor-num'>03</span>
            <span className='anchor-label'>色彩分析</span>
            <span className='lock-badge'>🔒</span>
          </div>
          <div className='locked-content'>
            <p>升级至风格进阶解锁色彩分析</p>
            <button className='unlock-btn btn-center' onClick={() => navigate("/pages/purchase")}>
              解锁 ({REPORT_LEVELS['style-upgrade'].tokenCost} Token)
            </button>
          </div>
        </div>
      )}

      {/* Locked: beauty-pro - Task 3 */}
      {isProLocked && (
        <div className='section-block locked-section'>
          <div className='section-anchor'>
            <span className='anchor-num'>04</span>
            <span className='anchor-label'>产品推荐</span>
            <span className='lock-badge'>🔒</span>
          </div>
          <div className='locked-content'>
            <p>升级至专属美学解锁完整推荐</p>
            <button className='unlock-btn unlock-btn--pro btn-center' onClick={() => navigate("/pages/purchase")}>解锁专属美学 ({REPORT_LEVELS['beauty-pro'].tokenCost} Token)
            </button>
          </div>
        </div>
      )}

      {/* Unlock Dialog */}
      {showUnlockDialog && (
        <div className='unlock-dialog-overlay' onClick={handleCloseUnlock}>
          <div className='unlock-dialog' onClick={(e) => e.stopPropagation()}>
            <div className='unlock-header'>
              <h3>解锁 {LEVEL_LABELS[unlockTarget as ReportLevel]}</h3>
              <button className='close-btn btn-center' onClick={handleCloseUnlock}>×</button>
            </div>
            <div className='unlock-content'>
              <p className='unlock-message'>
                {unlockTarget === 'beauty-pro'
                  ? '升级至专属美学，解锁完整妆容方案、产品推荐和达人匹配'
                  : '升级至 ' + LEVEL_LABELS[unlockTarget as ReportLevel] + '，解锁更多内容'}
              </p>
              <div className='token-balance-preview'>
                <span>当前余额：<strong>{currentBalance} Token</strong></span>
                {unlockTarget && (
                  <span className='token-required'>需要 {REPORT_LEVELS[unlockTarget].tokenCost} Token</span>
                )}
              </div>
              <div className='level-options'>
                {LEVEL_ORDER.map((level) => {
                  const cfg = REPORT_LEVELS[level];
                  const isAccessible = accessibleLevels.includes(level);
                  const state = levelStates[level];
                  return (
                    <div
                      key={level}
                      className={'level-option ' + (cfg.isFree ? 'free' : '') + ' ' + (state === 'purchased' ? 'purchased' : !isAccessible ? 'locked' : '')}
                    >
                      <span className='level-name'>
                        {cfg.icon} {cfg.name}
                        {state === 'purchased' && <span className='purchased-tag'>已购</span>}
                        {state === 'unlocked' && <span className='purchased-tag'>已解锁</span>}
                        {!isAccessible && state === 'locked' && ' 🔒'}
                      </span>
                      <span className='level-desc'>
                        {cfg.isFree ? '免费' : cfg.tokenCost + ' Token'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button className='unlock-btn confirm-btn btn-center' onClick={() => navigate('/pages/purchase')}>
                前往解锁
              </button>
            </div>
          </div>
        </div>
      )}

      <button className='back-btn-large btn-center' onClick={() => navigate('/pages/home')}>返回首页</button>
    </div>
  );
};

export default Index;







