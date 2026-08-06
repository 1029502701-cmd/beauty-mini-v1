# AI美妆小程序 V1 上线前审计报告

**任务编号**：Task-Beauty-Mini-012
**审计日期**：2026-08-01
**审计范围**：beauty-mini-v1（小程序端）+ beauty-api-pages（服务端）
**审计结论**：存在 3 项阻塞问题，需修复后方可上线

---

## 一、检查项目总览

| # | 检查项 | 状态 | 严重度 |
|---|--------|------|--------|
| 1 | 小程序基础配置 | 有缺陷 | 阻塞 |
| 2 | API 配置检查 | 正常 | — |
| 3 | Session 系统检查 | 有缺陷 | 非阻塞 |
| 4 | 报告系统检查 | 有缺陷 | 阻塞 |
| 5 | Token 系统检查 | 有缺陷 | 阻塞 |
| 6 | 产品推荐检查 | 基本正常 | — |
| 7 | 隐私合规检查 | 有缺陷 | 非阻塞 |
| 8 | 生产安全检查 | 严重问题 | 阻塞 |
---

## 二、逐项审计详情

### 1. 小程序基础配置

#### 1.1 project.config.json
**文件**：beauty-mini-v1/project.config.json

| 字段 | 当前值 | 判断 |
|------|--------|------|
| appid | 空 | BLOCKER — 无法提交审核/发布 |
| compileType | miniprogram | OK |
| setting.urlCheck | true | OK |

**修复建议**：填入真实微信小程序 AppID，格式为 wx 开头 16 位字符串。

#### 1.2 app.json
**文件**：beauty-mini-v1/app.json

| 字段 | 当前值 | 判断 |
|------|--------|------|
| pages | 8 个页面路由 | OK |
| tabBar | 未定义 | WARN — 需确认是否使用底部导航 |
| requiredPrivateInfos | chooseImage,chooseMedia | OK |
| permission | camera + writePhotosAlbum | OK |
| sitemapLocation | sitemap.json | BLOCKER — 文件不存在 |

**修复建议**：创建 beauty-mini-v1/sitemap.json 或移除 sitemapLocation 配置项。

---

### 2. API 配置检查

**文件**：beauty-mini-v1/src/services/api-client.ts

| 检查项 | 状态 |
|--------|------|
| API_BASE 生产地址 | OK: https://beauty-api-pages.pages.dev |
| 所有请求使用 HTTPS | OK |
| uploadFile 使用 HTTPS | OK |

**结论**：API 配置正确，无问题。

---

### 3. Session 系统检查

**文件**：src/services/user-service.ts、src/services/wechat-auth.ts、beauty-api-pages/functions/lib/session.ts

| 检查项 | 状态 |
|--------|------|
| 创建 Session | OK |
| 保存 Session | OK — 存入 storage |
| 请求携带 X-Session-Id | OK — 正确注入 |
| Session 失效处理 | OK — 服务端 401 后客户端 logout |
| 未登录处理 | OK — 游客模式可用 |
| 登录后状态保持 | OK — 存在 storage，重启后恢复 |

**警告**：app.tsx 在 componentDidShow 中有 console.log 输出（非阻塞）
---

## 三、阻塞问题汇总（必须修复后方可上线）

### 阻塞问题 1：小程序 AppID 为空
- **文件**：beauty-mini-v1/project.config.json
- **影响**：无法提交微信审核和发布
- **修复**：填入真实 AppID

### 阻塞问题 2：debug 端点无鉴权暴露
- **路径**：beauty-api-pages/functions/api/debug/ + api/token/seed.ts
- **影响**：任意用户可查询他人数据、注入 token
- **修复**：删除或禁用这些端点

### 阻塞问题 3：Token 双重系统不同步
- **文件**：src/services/token.ts vs 服务端 TokenService
- **影响**：余额不一致导致报告生成失败或重复扣费
- **修复**：统一使用服务端 TokenService 作为权威来源

---

## 四、非阻塞优化项

| 优先级 | 问题 | 文件 | 建议 |
|--------|------|------|------|
| P1 | SQL 注入 | report/query.ts | 改用 .bind() 参数化查询 |
| P1 | deductQuota 优先扣 freeCount | token.ts:108 | 按等级精确扣减 |
| P1 | mock 数据乱码 | profile.ts, product.ts | 修复编码或移除 mock |
| P1 | sitemap.json 缺失 | app.json | 创建或移除该配置 |
| P1 | 支付未真实对接 | payment.ts | 上线前对接微信支付 |
| P1 | 隐私政策测试邮箱 | privacy/index.tsx | 替换为真实邮箱 |
| P2 | console.log 残留 | app.tsx, api-client.ts | 仅保留 dev 环境日志 |
| P2 | 报告生成无幂等防护 | report.ts | 添加防抖/loading |

---

## 五、上线前建议

1. **立即修复三项阻塞问题**（AppID、debug 端点、Token 同步）
2. **删除** beauty-api-pages/functions/api/debug/ 下所有文件
3. **删除** beauty-api-pages/functions/api/token/seed.ts
4. 创建 beauty-mini-v1/sitemap.json
5. 修复 profile.ts 和 product.ts 的编码问题
6. 将 report/query.ts 的 SQL 改为参数化查询
7. 确认支付功能是否需要在 V1 上线
8. 替换隐私政策中的测试邮箱
9. 移除或条件化 console.log
10. 执行 taro build --type weapp 编译检查

---

## 六、关键文件路径

| 类别 | 文件路径 |
|------|----------|
| 小程序配置 | beauty-mini-v1/project.config.json |
| 小程序配置 | beauty-mini-v1/app.json |
| API 客户端 | beauty-mini-v1/src/services/api-client.ts |
| Session 服务 | beauty-mini-v1/src/services/user-service.ts |
| 微信登录 | beauty-mini-v1/src/services/wechat-auth.ts |
| Token 服务 | beauty-mini-v1/src/services/token.ts |
| 报告服务 | beauty-mini-v1/src/services/report.ts |
| 权限服务 | beauty-mini-v1/src/services/permission-service.ts |
| 支付服务 | beauty-mini-v1/src/services/payment.ts |
| 产品推荐 | beauty-mini-v1/src/services/product.ts |
| 隐私政策 | beauty-mini-v1/src/pages/privacy/index.tsx |
| 用户协议 | beauty-mini-v1/src/pages/agreement/index.tsx |
| 报告查询接口 | beauty-api-pages/functions/api/beauty/report/query.ts |
| Debug 端点 | beauty-api-pages/functions/api/debug/ |
| Token Seed | beauty-api-pages/functions/api/token/seed.ts |
| 服务端 Session | beauty-api-pages/functions/lib/session.ts |
| 报告等级配置 | beauty-mini-v1/src/types/report-level.ts |
---

### 4. 报告系统检查

**三个报告等级定义**：src/types/report-level.ts

| 等级 | 名称 | 是否免费 | Token 消耗 | 保存天数 |
|------|------|----------|-----------|----------|
| first-look | 初见妆容 | 是 | 0 | 7 天 |
| style-upgrade | 风格进阶 | 是 | 0 | 15 天 |
| beauty-pro | 专属美学 | 否 | 3 | 30 天 |

#### 4.1 权限判断
- OK：hasAccess() 调用后端 /api/beauty/access 检查
- OK：后端失败时回退到本地检查

#### 4.2 Token 扣除逻辑
**警告**：deductQuota() 优先扣 freeCount，导致 beauty-pro 可能消耗 1 free + 2 token 而非 3 token
**警告**：createAndQueryReport 无幂等防护，快速点击可能触发多次报告生成

#### 4.3 SQL 注入风险
**阻塞**：beauty-api-pages/functions/api/beauty/report/query.ts 中 reportId 通过字符串拼接
`	ypescript
SELECT ... WHERE id =  escapedId LIMIT 1
`
建议改用 .bind() 参数化查询。

---

### 5. Token 系统检查

#### 5.1 初始 Token
- OK：新用户 getUserQuota() 返回 freeCount:1, tokenCount:0, totalCount:1

#### 5.2 双重 Token 系统（核心阻塞问题）

**小程序端**：src/services/token.ts — 使用本地 storage（beauty_tokens + beauty_user_quota）
**服务端**：beauty-api-pages/modules/token/token-service.ts — 使用 D1 数据库（user_tokens 表）

| 问题 | 影响 |
|------|------|
| 两套系统不同步 | 本地有余额但服务端不足，报告生成失败 |
| 报告查询检查服务端，报告生成检查本地 | 可能出现不一致 |
| 充值只更新服务端，不更新本地 | 充值后需重新登录才能看到余额 |

**修复建议**：统一使用服务端 TokenService 作为权威来源，小程序端只做缓存。

#### 5.3 支付功能未对接
**文件**：src/services/payment.ts
- 警告：WECHAT_CONFIG 硬编码测试值（appId: wx1234567890abcdef）
- 警告：支付流程完全走模拟，prepayId 和 sign 都是随机生成
- 警告：notifyUrl 指向非生产域名 api.beautymini.com
---

### 6. 产品推荐检查

| 检查项 | 状态 |
|--------|------|
| 推荐 API 存在 | OK: GET /api/beauty/recommend |
| 参数校验 | OK: 检查必填参数 |
| 空数据处理 | OK: 返回空数组 |
| 页面展示 | OK: 有长度判断 |

**阻塞**：src/services/product.ts mock 数据含乱码（文件编码问题）
```typescript
name: 乱码, // 应为中文，编码错误
brand: 乱码
```

---

### 7. 隐私合规检查

| 检查项 | 状态 |
|--------|------|
| 隐私政策页面 | OK: 存在，内容完整 |
| 用户协议页面 | OK: 存在，内容完整 |
| AI 分析免责声明 | OK: 用户协议中有说明 |
| 上传照片说明 | OK: 隐私政策第一部分 |

**警告**：联系邮箱为测试域名 support@beauty-mini-example.com
**警告**：首页隐私/协议链接使用 href

---

### 8. 生产安全检查 严重

#### 8.1 调试端点暴露（最高优先级）
**路径**：beauty-api-pages/functions/api/debug/（10 个文件）+ api/token/seed.ts

以下端点无任何鉴权保护，可被任何人访问：

| 端点 | 风险 |
|------|------|
| GET /api/debug/direct-query | 任意 D1 查询 |
| GET /api/debug/balance-direct?userId=xxx | 查询任意用户 token 余额 |
| GET /api/debug/report-direct?id=xxx | 查询任意报告（含分析数据） |
| GET /api/debug/report-full?id=xxx | 查询报告 + 权限检查 |
| POST /api/token/seed | 可任意增加用户 token 余额 |

**修复建议**：上线前删除 api/debug/ 目录下所有文件及 api/token/seed.ts。

#### 8.2 console 日志
- src/app.tsx:18：console.log
- src/services/api-client.ts:283：console.log

#### 8.3 Mock 数据残留
| 文件 | 问题 |
|------|------|
| src/services/profile.ts | getMockProfile() 含硬编码测试数据（乱码） |
| src/services/product.ts | getMockProducts() 含硬编码测试数据（乱码） |
| src/services/share.ts | getMockShare() 返回 mock 数据 |
---

## 三、阻塞问题汇总（必须修复后方可上线）

### 阻塞问题 1：小程序 AppID 为空
- **文件**：beauty-mini-v1/project.config.json
- **影响**：无法提交微信审核和发布
- **修复**：填入真实 AppID

### 阻塞问题 2：debug 端点无鉴权暴露
- **路径**：beauty-api-pages/functions/api/debug/ + api/token/seed.ts
- **影响**：任意用户可查询他人数据、注入 token
- **修复**：删除或禁用这些端点

### 阻塞问题 3：Token 双重系统不同步
- **文件**：src/services/token.ts vs 服务端 TokenService
- **影响**：余额不一致导致报告生成失败或重复扣费
- **修复**：统一使用服务端 TokenService 作为权威来源

---

## 四、非阻塞优化项

| 优先级 | 问题 | 文件 | 建议 |
|--------|------|------|------|
| P1 | SQL 注入 | report/query.ts | 改用 .bind() 参数化查询 |
| P1 | deductQuota 优先扣 freeCount | token.ts:108 | 按等级精确扣减 |
| P1 | mock 数据乱码 | profile.ts, product.ts | 修复编码或移除 mock |
| P1 | sitemap.json 缺失 | app.json | 创建或移除该配置 |
| P1 | 支付未真实对接 | payment.ts | 上线前对接微信支付 |
| P1 | 隐私政策测试邮箱 | privacy/index.tsx | 替换为真实邮箱 |
| P2 | console.log 残留 | app.tsx, api-client.ts | 仅保留 dev 环境日志 |
| P2 | 报告生成无幂等防护 | report.ts | 添加防抖/loading |

---

## 五、上线前建议

1. **立即修复三项阻塞问题**（AppID、debug 端点、Token 同步）
2. **删除** beauty-api-pages/functions/api/debug/ 下所有文件
3. **删除** beauty-api-pages/functions/api/token/seed.ts
4. 创建 beauty-mini-v1/sitemap.json
5. 修复 profile.ts 和 product.ts 的编码问题
6. 将 report/query.ts 的 SQL 改为参数化查询
7. 确认支付功能是否需要在 V1 上线
8. 替换隐私政策中的测试邮箱
9. 移除或条件化 console.log
10. 执行 taro build --type weapp 编译检查

---

## 六、关键文件路径

| 类别 | 文件路径 |
|------|----------|
| 小程序配置 | beauty-mini-v1/project.config.json |
| 小程序配置 | beauty-mini-v1/app.json |
| API 客户端 | beauty-mini-v1/src/services/api-client.ts |
| Session 服务 | beauty-mini-v1/src/services/user-service.ts |
| 微信登录 | beauty-mini-v1/src/services/wechat-auth.ts |
| Token 服务 | beauty-mini-v1/src/services/token.ts |
| 报告服务 | beauty-mini-v1/src/services/report.ts |
| 权限服务 | beauty-mini-v1/src/services/permission-service.ts |
| 支付服务 | beauty-mini-v1/src/services/payment.ts |
| 产品推荐 | beauty-mini-v1/src/services/product.ts |
| 隐私政策 | beauty-mini-v1/src/pages/privacy/index.tsx |
| 用户协议 | beauty-mini-v1/src/pages/agreement/index.tsx |
| 报告查询接口 | beauty-api-pages/functions/api/beauty/report/query.ts |
| Debug 端点 | beauty-api-pages/functions/api/debug/ |
| Token Seed | beauty-api-pages/functions/api/token/seed.ts |
| 服务端 Session | beauty-api-pages/functions/lib/session.ts |
| 报告等级配置 | beauty-mini-v1/src/types/report-level.ts |