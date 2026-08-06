# AI美妆小程序 微信配置说明

## 小程序配置

**AppID（小程序ID）**: wxb11f679ad6bc945a

> 此值已填入 project.config.json 的 appid 字段。

## 微信登录配置（服务端）

微信登录凭据需通过 Cloudflare Pages Secrets 设置，**不可硬编码在代码中**：

`ash
# 登录 Cloudflare 后执行
wrangler pages secret put WECHAT_APP_ID
wrangler pages secret put WECHAT_APP_SECRET
`

**注意**：AppSecret 是敏感凭据，请勿提交到代码仓库或写入任何文档。

## 配置验证

部署后微信登录应正常工作。如遇到登录失败，检查：
1. WECHAT_APP_ID 和 WECHAT_APP_SECRET 是否已正确配置
2. 小程序后台是否已配置合法域名（beauty-api-pages.pages.dev）
3. 回调地址是否在小程序后台白名单中
