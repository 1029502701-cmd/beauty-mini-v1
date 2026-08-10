import React, { useState, useEffect, useCallback } from 'react';
import { navigate } from '@taro/router';
import { useLoad } from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import './index.css';
import { getReport } from '../../services/api';
import { generateAllRecommendations } from '../../recommendation/engine';
import reportAccessService from '../../services/reportAccessService';
import { shareRewardService } from '../../services/shareRewardService';
import { request } from '../../services/api';
import { getStorage } from '../../utils/storage';
import type { BeautyReport, ReportLevel, CreatorRecommendation, ProductRecommendation, UserTokenBalance } from '../../types';
import { REPORT_LEVELS } from '../../types/report-level';
import ReportHeader from '../../components/report/ReportHeader';
import FaceAnalysisCard from '../../components/report/FaceAnalysisCard';
import MakeupSuggestionCard from '../../components/report/MakeupSuggestionCard';
import ColorAnalysisCard from '../../components/report/ColorAnalysisCard';
import ProductCard from '../../components/report/ProductCard';
import CreatorCard from '../../components/report/CreatorCard';import ProductPopup from '../../components/report/ProductPopup';
import CreatorPopup from '../../components/report/BloggerPopup';


const LEVEL_ORDER: ReportLevel[] = ['first-look', 'style-upgrade', 'beauty-pro'];
const LEVEL_LABELS: Record<ReportLevel, string> = {
  'first-look': '初见妆容',
  'style-upgrade': '风格进阶',
  'beauty-pro': '专属美学'
};

type LevelDisplayState = 'purchased' | 'unlocked' | 'locked';

const LOCAL_REPORT_KEY = 'last_beauty_report';

const Index = () => {
  const [queryParams, setQueryParams] = useState<any>({});
  useLoad((options) => {
    setQueryParams(options || {});
  });
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

  const [shareLoading, setShareLoading] = useState(false);
  const [shareRewardGranted, setShareRewardGranted] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);


  const handleShareReward = useCallback(async () => {
    setShareLoading(true);
    try {
      const res = await request('/api/beauty/share/reward', 'POST');
      if (res.success && res.data && res.data.status === 'SHARE_REWARD_GRANTED') {
        wx.showToast({ title: res.data.message || '已获得一次进阶风格分析', icon: 'success' });
      } else if (res.data && res.data.status === 'SHARE_REWARD_USED') {
        wx.showToast({ title: res.data.error || '今天已领取分享奖励', icon: 'none' });
      } else {
        wx.showToast({ title: '分享奖励获取失败', icon: 'none' });
      }

    } catch (err) { console.error('[Result] share reward error:', err); wx.showToast({ title: '分享奖励获取失败', icon: 'none' }); }
    finally { setShareLoading(false); }
  }, []);

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
      // balance query failed, leave tokenBalance as null
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
      <View className='result-page'>
        <View className='loading-state'>
          <View className='loading-spinner' />
          <Text>正在加载报告...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className='result-page result-error'>
        <View className='error-content'>
          <View className='error-icon'>❌</View>
          <Text>报告暂不可用</Text>
          <Text className='error-message'>{error}</Text>
          <View className='error-actions'>
            <Button className='retry-btn' onClick={() => fetchReport()}>重新加载</Button>
            <Button className='back-btn' onClick={() => navigate('/pages/home')}>返回首页</Button>
          </View>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View className='result-page result-empty'>
        <View className='empty-content'>
          <View className='empty-icon'>🔍</View>
          <Text>报告暂不可用</Text>
          <Text className='empty-message'>报告数据尚未生成，请稍后查看或重新分析</Text>
          <View className='empty-actions'>
            <Button className='start-btn' onClick={() => navigate('/pages/upload')}>重新分析</Button>
            <Button className='back-btn' onClick={() => navigate('/pages/home')}>返回首页</Button>
          </View>
        </View>
      </View>
    );
  }

  const isUpgradeLocked = !accessibleLevels.includes('style-upgrade');

  return (
    <View className='result-page'>
      {/*
 Token Balance Bar - Task 2 */}
      <View className='token-balance-bar'>
        <View className='token-balance-left'>
          <Text className='token-icon'>🎫</Text>
          <Text className='token-amount'>{currentBalance} Token</Text>
        </View>
        <Button className='token-topup-btn' onClick={() => navigate('/pages/token')}>充值</Button>
      </View>
*/

      {/* Report Level Badge - Task 1 */}
      <View className='report-level-badge'>
        <Text className='level-badge-icon'>{REPORT_LEVELS[reportLevel].icon}</Text>
        <View className='level-badge-text'>
          <Text className='level-badge-name'>{REPORT_LEVELS[reportLevel].name}</Text>
          <Text className='level-badge-tag'>
            {reportLevel === 'first-look' ? '免费体验' : reportLevel === 'style-upgrade' ? '进阶分析' : '专属美学'}
          </Text>
        </View>
        {isProLocked && (
          <Button className='upgrade-cta-btn btn-center' onClick={() => navigate("/pages/purchase")}>解锁专属美学
          </Button>
        )}
      </View>

      {/* Level Status Bar - Task 1 */}
      <View className='level-status-bar'>
        {LEVEL_ORDER.map((level) => {
          const cfg = REPORT_LEVELS[level];
          const state = levelStates[level];
          return (
            <View key={level} className={'level-status-item ' + state}>
              <Text className='level-status-icon'>{cfg.icon}</Text>
              <Text className='level-status-name'>{cfg.name}</Text>
              <Text className='level-status-badge'>
                {state === 'purchased' ? '已购' : state === 'unlocked' ? '已解锁' : '🔒'}
              </Text>
              {!cfg.isFree && (
                <Text className='level-status-cost'>{cfg.tokenCost} Token</Text>
              )}
            </View>
          );
        })}
      </View>

      <ReportHeader report={report} />

      {accessibleLevels.includes('first-look') && (
        <View className='section-block'>
          <View className='section-anchor'>
            <Text className='anchor-num'>01</Text>
            <Text className='anchor-label'>面部分析</Text>
          </View>
          {levelContent?.faceAnalysis ? (
            <FaceAnalysisCard
              content={levelContent.faceAnalysis}
              faceShape={report.profile.faceShape}
              skinType={report.analysis?.skinType}
              oilLevel={report.analysis?.oilLevel}
              hydrationLevel={report.analysis?.hydrationLevel}
            />
          ) : (
            <View className='empty-module'><Text>暂无内容</Text></View>
          )}
        </View>
      )}

      {accessibleLevels.includes('style-upgrade') && (
        <View className='section-block'>
          <View className='section-anchor'>
            <Text className='anchor-num'>02</Text>
            <Text className='anchor-label'>妆容建议</Text>
          </View>
          {levelContent?.makeupStyle ? (
            <MakeupSuggestionCard
              content={levelContent.makeupStyle}
              suggestions={report.analysis?.suggestions}
            />
          ) : (
            <View className='empty-module'><Text>暂无内容</Text></View>
          )}
        </View>
      )}

      {accessibleLevels.includes('style-upgrade') && (
        <View className='section-block'>
          <View className='section-anchor'>
            <Text className='anchor-num'>03</Text>
            <Text className='anchor-label'>色彩分析</Text>
          </View>
          {levelContent?.colorAnalysis ? (
            <ColorAnalysisCard content={levelContent.colorAnalysis} />
          ) : (
            <View className='empty-module'><Text>暂无内容</Text></View>
          )}
        </View>
      )}

      {accessibleLevels.includes('beauty-pro') && (
        <View className='section-block'>
          <View className='section-anchor'>
            <Text className='anchor-num'>04</Text>
            <Text className='anchor-label'>产品推荐</Text>
          </View>
          {levelContent?.productRecommendation && levelContent.productRecommendation.length > 0 ? (
            <View className='product-list'>
              {levelContent.productRecommendation.map((p) => (
                <ProductCard key={p.id} product={p as any} onClick={() => setSelectedProduct(p as any)} />
              ))}
            </View>
          ) : (
            <View className='empty-module'><Text>暂无内容</Text></View>
          )}
        </View>
      )}

      {accessibleLevels.includes('beauty-pro') && (
        <View className='section-block'>
          <View className='section-anchor'>
            <Text className='anchor-num'>05</Text>
            <Text className='anchor-label'>达人推荐</Text>
          </View>
          {recommendLoading ? (
            <View className='loading-state' style={{ padding: '20px 0' }}>
              <View className='loading-spinner' />
              <Text>AI 匹配达人中...</Text>
            </View>
          ) : (levelContent?.creators && levelContent.creators.length > 0) || recommendedCreators.length > 0 ? (
            <View className='bloggers-grid'>
              {(levelContent?.creators || recommendedCreators).map((c) => (
                <CreatorCard key={c.id} creator={c as CreatorRecommendation} onClick={() => setSelectedCreator(c as CreatorRecommendation)} />
              ))}
            </View>
          ) : (
            <View className='empty-module'><Text>暂无内容</Text></View>
          )}
        </View>
      )}

      {/* Locked: style-upgrade */}
      {isUpgradeLocked && (
        <View className='section-block locked-section'>
          <View className='section-anchor'>
            <Text className='anchor-num'>03</Text>
            <Text className='anchor-label'>色彩分析</Text>
            <Text className='lock-badge'>🔒</Text>
          </View>
          <View className='locked-content'>
            <Text>升级至风格进阶解锁色彩分析</Text>
            <Button className='unlock-btn btn-center' onClick={() => navigate("/pages/purchase")}>
              解锁 ({REPORT_LEVELS['style-upgrade'].tokenCost} Token)
            </Button>
          </View>
        </View>
      )}

      {/* Locked: beauty-pro - Task 3 */}
      {isProLocked && (
        <View className='section-block locked-section'>
          <View className='section-anchor'>
            <Text className='anchor-num'>04</Text>
            <Text className='anchor-label'>产品推荐</Text>
            <Text className='lock-badge'>🔒</Text>
          </View>
          <View className='locked-content'>
            <Text>升级至专属美学解锁完整推荐</Text>
            <Button className='unlock-btn unlock-btn--pro btn-center' onClick={() => navigate("/pages/purchase")}>解锁专属美学 ({REPORT_LEVELS['beauty-pro'].tokenCost} Token)
            </Button>
          </View>
        </View>
      )}

      {/* Unlock Dialog */}
      {showUnlockDialog && (
        <View className='unlock-dialog-overlay' onClick={handleCloseUnlock}>
          <View className='unlock-dialog' onClick={(e) => e.stopPropagation()}>
            <View className='unlock-header'>
              <Text>解锁 {LEVEL_LABELS[unlockTarget as ReportLevel]}</Text>
              <Button className='close-btn btn-center' onClick={handleCloseUnlock}>×</Button>
            </View>
            <View className='unlock-content'>
              <Text className='unlock-message'>
                {unlockTarget === 'beauty-pro'
                  ? '升级至专属美学，解锁完整妆容方案、产品推荐和达人匹配'
                  : '升级至 ' + LEVEL_LABELS[unlockTarget as ReportLevel] + '，解锁更多内容'}
              </Text>
              <View className='token-balance-preview'>
                <Text>当前余额：{currentBalance} Token</Text>
                {unlockTarget && (
                  <Text className='token-required'>需要 {REPORT_LEVELS[unlockTarget].tokenCost} Token</Text>
                )}
              </View>
              <View className='level-options'>
                {LEVEL_ORDER.map((level) => {
                  const cfg = REPORT_LEVELS[level];
                  const isAccessible = accessibleLevels.includes(level);
                  const state = levelStates[level];
                  return (
                    <View
                      key={level}
                      className={'level-option ' + (cfg.isFree ? 'free' : '') + ' ' + (state === 'purchased' ? 'purchased' : !isAccessible ? 'locked' : '')}
                    >
                      <Text className='level-name'>
                        {cfg.icon} {cfg.name}
                        {state === 'purchased' && <Text className='purchased-tag'>已购</Text>}
                        {state === 'unlocked' && <Text className='purchased-tag'>已解锁</Text>}
                        {!isAccessible && state === 'locked' && ' 🔒'}
                      </Text>
                      <Text className='level-desc'>
                        {cfg.isFree ? '免费' : cfg.tokenCost + ' Token'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Button className='unlock-btn confirm-btn btn-center' onClick={() => navigate('/pages/purchase')}>
                前往解锁
              </Button>
            </View>
          </View>
        </View>
      )}


      <View className='upgrade-cta-section'>
        <View className='upgrade-cta-title'>分享获得一次进阶风格分析</View>
        <View className='upgrade-cta-desc'>每天分享一次，免费解锁更详细的妆容风格建议</View>
        <Button className='upgrade-cta-btn btn-center' onClick={handleShareReward} disabled={shareLoading}>
          {shareLoading ? '处理中...' : '分享解锁二层报告'}
        </Button>
      </View>
      {accessibleLevels.includes('style-upgrade') && !isProLocked ? (
        <View className='upgrade-cta-section'>
          <View className='upgrade-cta-title'>探索你的专属美学</View>
          <View className='upgrade-cta-desc'>解锁更多场景妆容推荐</View>
          <View className='upgrade-features'>
            <Text className='upgrade-feature'>日常妆推荐</Text>
            <Text className='upgrade-feature'>通勤妆推荐</Text>
            <Text className='upgrade-feature'>约会妆推荐</Text>
            <Text className='upgrade-feature'>职场妆推荐</Text>
            <Text className='upgrade-feature'>气质提升方案</Text>
            <Text className='upgrade-feature'>产品搭配建议</Text>
            <Text className='upgrade-feature'>创作者风格推荐</Text>
          </View>
          <Button className='upgrade-cta-btn upgrade-cta-btn--pro btn-center' onClick={() => navigate('/pages/purchase')}>
            生成三层专属报告
          </Button>
        </View>
      ) : null}
      
      {/* Product Detail Popup */}
      <ProductPopup
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          image: '',
          matchScore: selectedProduct.priority === 'high' ? 92 : selectedProduct.priority === 'medium' ? 78 : 65,
          reason: selectedProduct.reason,
        } : null}
      />
      {/* Creator Detail Popup */}
      <CreatorPopup
        isOpen={!!selectedCreator}
        onClose={() => setSelectedCreator(null)}
        blogger={selectedCreator ? {
          id: selectedCreator.id,
          name: selectedCreator.name,
          avatar: selectedCreator.avatar || '',
          platform: selectedCreator.platform || 'xiaohongshu',
          style: selectedCreator.suitableStyle || '',
          matchScore: selectedCreator.matchScore || 0,
          reason: selectedCreator.matchReasons?.join('；') || '',
          representativeStyle: selectedCreator.styleTags?.[0] || '',
        } : null}
      />
<Button className='back-btn-large btn-center' onClick={() => navigate('/pages/home')}>返回首页</Button>
    </View>
  );
};

export default Index;







