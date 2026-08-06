# AI 美妆微信小程序 V1 文档

## 项目简介

AI 美妆微信小程序 V1 是一个基于 Taro + React 开发的跨平台小程序，结合 Cloudflare Workers 后端提供 AI 美妆分析功能。

## 技术栈

- **前端**: Taro React (多端框架)
- **后端**: Cloudflare Workers + D1 (SQLite)
- **部署**: Cloudflare Pages/Workers

## 目录结构

`
beauty-mini-v1/          # 微信小程序前端
├── src/
│   ├── app.tsx         # 应用入口
│   ├── pages/
│   │   └── home/       # 首页
│   ├── components/     # 组件库
│   └── utils/          # 工具函数
├── package.json        # 前端依赖
└── .taro.js            # Taro 配置

cloudflare-worker/      # Cloudflare 后端
├── workers/index.js    # Worker 入口
├── package.json        # 后端依赖
└── wrangler.toml       # Wrangler 配置

docs/                   # 文档
└── README.md           # 项目总览

TASK_BOARD.md           # 任务板
d1-schema.sql           # D1 数据库schema
