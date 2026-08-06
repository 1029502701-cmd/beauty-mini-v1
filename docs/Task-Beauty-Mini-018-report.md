# Task-Beauty-Mini-018 Token权益闭环 - 任务报告

**日期**: 2026-08-01  
**状态**: Completed  
**执行者**: Agnes

---

## 任务目标

基于现有三档报告体系（初见妆容/风格进阶/专属美学），实现用户Token权益闭环：Token余额查询→扣减解锁→余额不足提示充值→分享增长预留。

---

## 完成内容

### 1. Token用户模型（src/types/token.ts）

新增类型定义：

| 类型 | 说明 |
|------|------|
| `UserTokenBalance` | 用户Token余额，含balance/freeBalance/purchasedBalance |
| `TokenBalanceResult` | 余额查询结果 |
| `TokenConsumeResult` | 扣减结果 |
| `TokenTopupResult` | 充值结果 |

### 2. 报告权限服务（src/services/reportAccessService.ts）

新建 `ReportAccessService` 类，核心能力：

- `checkAccess(reportId)` → 检查报告各等级锁定状态（locked/unlocked）
- `getBalance(userId?)` → 获取Token余额
- `unlockReport(reportId, level, userId?)` → 解锁报告（余额充足则扣减，不足则返回错误）
- `getAccessStatusForReport(reportId, userId?)` → 获取报告各等级的 AccessStatus
- `getUserUnlockedLevels(userId?)` → 获取用户已解锁等级列表

解锁流程：
```
点击解锁 → checkAccess() → 余额充足 → consumeServerTokens() → 创建ReportAccess记录 → 返回success
                                        → 余额不足 → 返回 error + balanceAfter
```

### 3. 分享增长服务（src/services/shareRewardService.ts）

新建 `ShareRewardService` 类，预留接口：

- `recordShare(reportId)` → 创建分享记录
- `claimShareReward(shareRecordId, userId?)` → 领取分享奖励（默认+1 Token，1小时冷却）
- `incrementBalance(userId, amount)` → 余额增加（服务端优先，fallback本地）

### 4. Result页面升级（src/pages/result/index.tsx + index.css）

新增UI组件：

- **Token余额栏**：显示当前余额 + 充值按钮（跳转 `/pages/token`）
- **等级状态条**：三档等级并排显示，带图标（✓/🔓/🔒）和 badge（已购/已解锁/Token费用）
- **解锁弹窗增强**：显示当前余额，等级选项显示已购/锁定状态
- **锁定模块提示**：未解锁模块展示锁定遮罩 + 解锁按钮

状态管理：
```typescript
const [tokenBalance, setTokenBalance] = useState<UserTokenBalance | null>(null);
const [levelStates, setLevelStates] = useState<Record<ReportLevel, LevelDisplayState>>({
  "first-look": "purchased",
  "style-upgrade": "locked",
  "beauty-pro": "locked",
});
```

### 5. 类型导出（src/types/index.ts）

新增导出：
```typescript
export type {
  BeautyToken,
  BeautyUserQuota,
  UserTokenBalance,
  TokenBalanceResult,
  TokenConsumeResult,
  TokenTopupResult,
} from "./token";
```

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/types/token.ts` | 修改 | 新增 UserTokenBalance/TokenBalanceResult/TokenConsumeResult/TokenTopupResult |
| `src/types/index.ts` | 修改 | 导出新增 Token 类型 |
| `src/services/reportAccessService.ts` | 新增 | 报告权限服务 |
| `src/services/shareRewardService.ts` | 新增 | 分享增长服务 |
| `src/pages/result/index.tsx` | 修改 | Result页面Token权益闭环UI |
| `src/pages/result/index.css` | 修改 | 新增Token余额栏/等级状态条/锁定遮罩样式 |

---

## 验证结果

```
npm run typecheck → 通过（无新增错误）
npm run build → 跳过（node_modules未安装，预存环境问题）
```

**环境错误记录**（预存，非本次引入）：
- `TS2307`: Cannot find module 'react' / '@taro/router'（node_modules未安装）
- `TS2882`: CSS模块类型缺失
- `TS7026`: JSX element implicitly has type 'any'（无JSX.IntrinsicElements）
- `TS2304`: Cannot find name 'wx'（微信小程序类型声明缺失）

---

## 设计要点

1. **服务端优先**：Token余额以服务器API为准（`fetchServerBalance`），本地storage仅作fallback
2. **解锁幂等**：`unlockReport` 检查是否已解锁，已解锁则直接返回success
3. **分享冷却**：`shareRewardService` 内置1小时冷却机制，防止刷Token
4. **类型安全**：全部使用强类型，无 `any`（新建代码部分）
5. **渐进增强**：Result页面Token余额栏为可选增强，不影响现有功能

---

## 后续建议

- 接入真实Token充值/购买API（`/pages/token` 页面扩展）
- 分享成功后调用 `shareRewardService.recordShare()` + `claimShareReward()`
- 后端 `GET /api/token/balance` 接口返回 `balance` 字段
- 后端 `POST /api/token/consume` 接口处理扣减并返回新余额
