# 今晚吃什么

AI 帮你决定今晚吃什么的极简 Web 应用。

## 快速启动

```bash
# 1. 安装依赖并初始化数据库
./init.sh

# 2. 配置 API Key
# 编辑 .env，填写 DEEPSEEK_API_KEY

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key | 必填 |
| `DATABASE_URL` | SQLite 路径 | `file:./dev.db` |
| `ADMIN_SECRET` | 管理后台密码 | `admin123` |

## 管理后台

访问 `/admin`，输入 `ADMIN_SECRET` 密码。

功能：
- 总访问次数、推荐次数、平均停留时长、回访用户
- 最近 100 条用户输入
- 最近 100 条 AI 输出
- 导出 CSV（访问记录、推荐记录、停留时长）

## Docker 部署

```bash
docker build -t tonight-dinner .
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=your_key \
  -e ADMIN_SECRET=your_password \
  -v $(pwd)/data:/app/prisma \
  tonight-dinner
```

## 目录结构

```
├── app/
│   ├── page.tsx              # 首页（表单 + 结果）
│   ├── admin/page.tsx        # 管理后台
│   ├── api/
│   │   ├── recommend/        # DeepSeek API 调用
│   │   ├── track/
│   │   │   ├── visit/        # 访问记录
│   │   │   ├── duration/     # 停留时长
│   │   │   └── visitor/      # 回访统计
│   │   └── admin/
│   │       ├── stats/        # 统计数据
│   │       └── export/       # CSV 导出
├── lib/
│   ├── prisma.ts             # Prisma 客户端
│   └── tracker.ts            # 前端埋点 Hook
├── prisma/
│   └── schema.prisma         # 数据库 Schema
└── .env.example
```

## 数据库 Schema

- `visits` - 访问记录（session_id, user_agent）
- `recommendations` - 推荐记录（人数、预算、偏好、AI 响应）
- `page_durations` - 停留时长（心跳上报）
- `visitor_stats` - 回访统计（localStorage visitor_id）
