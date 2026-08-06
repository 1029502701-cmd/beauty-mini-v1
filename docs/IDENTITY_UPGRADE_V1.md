# 基础可信身份体系升级 V1 - 实现文档

## 审计结果

### 当前机制问题
1. **X-User-Id 完全不信任**: 客户端直接传递 userId，服务端无任何验证
2. **无 Session 机制**: 每次请求需重新验证身份，无持久会话
3. **微信登录仅为预留**: /api/wechat/bind 是空 stub，不调用 code2session
4. **游客与微信身份割裂**: 无 guest → wechat 数据迁移路径

### 改进方案

客户端侧 (beauty-mini-v1)
- wx.login() 获取临时 code
- POST /api/wechat/login 发送 code + guestInfo
- 收到 sessionId 存入 localStorage/wx storage
- 所有后续请求携带 X-Session-Id header

服务端侧 (Cloudflare Worker)
- 接收 code 调用微信 code2session 获得 openid
- D1 查询/创建 users 表获得 userId
- KV 创建 SessionRecord 获得 sessionId
- 返回 sessionId + userId
- 后续请求: X-Session-Id 验证 sessionId 解析 userId

游客模式 (保留)
- 无 session 时自动生成 guestId
- X-User-Id 作为 fallback（不信任，仅用于未登录请求）
- 微信登录后: guest userId 可迁移至 wechat userId

## 修改文件列表

### 服务端 (cloudflare-worker/)
- lib/session.ts [新增] SessionService: KV-based 会话管理
- functions/api/wechat-login.ts [新增] POST /api/wechat/login 端点
- functions/api/wechat-bind.ts [新增] POST /api/wechat/bind 端点
- functions/index.ts [修改] 重写身份解析逻辑
- functions/api/report.ts [修改] 更新接口类型
- wrangler.toml [修改] 增加 WECHAT_APP_ID/WECHAT_APP_SECRET
- migrations/004_add_sessions_table.sql [新增]
- migrations/005_add_report_session_tracking.sql [新增]

### 客户端 (beauty-mini-v1/)
- src/services/wechat-auth.ts [重写] 增加 performServerLogin
- src/services/user-service.ts [修改] 增加 session ID 管理
- src/services/api-client.ts [修改] 自动注入 X-Session-Id header
- src/services/report.ts [修改] 注释更新

## 安全等级变化

维度               | 升级前          | 升级后
身份验证           | X-User-Id 自报  | X-Session-Id KV 验证
Session 有效期     | 无              | 30天自动刷新
微信绑定           | 空 stub         | 真实 code2session
数据隔离           | 仅 userId 字符串 | sessionId + userId 双重
游客模式           | 随机 userId     | guestId + 可迁移
会话泄漏防护       | 无              | 401 自动清除 + KV TTL

## API 变化

新增端点:
- POST /api/wechat/login  微信登录，返回 sessionId + userId
- POST /api/wechat/bind   微信绑定（兼容旧接口）

修改端点:
- GET /api/reports/:id    身份来源改为 X-Session-Id
- GET /api/reports        需要有效 session，无 session 返回 401

请求头变化:
旧: X-User-Id: user_1234567890_1234
新: X-Session-Id: abcdefgh-1234-5678-90ab-cdef12345678

## 测试结果

[+] SessionService.createGuestSession 返回有效 sessionId
[+] SessionService.validate 有效返回记录，过期返回 null
[+] SessionService.updateToWechatSession 正确标记非游客
[+] extractSessionId 正确解析 Authorization 和 X-Session-Id
[+] wechatLogin code 无效时返回 400
[+] wechatLogin code 有效时返回 sessionId + userId
[-] 集成测试: 需部署后验证
[-] 集成测试: 需部署后验证微信 code2session 真实调用

## 部署步骤

1. wrangler secret put WECHAT_APP_ID
2. wrangler secret put WECHAT_APP_SECRET
3. wrangler d1 execute beauty-mini-db --file=migrations/004_add_sessions_table.sql
4. wrangler d1 execute beauty-mini-db --file=migrations/005_add_report_session_tracking.sql
5. wrangler deploy
