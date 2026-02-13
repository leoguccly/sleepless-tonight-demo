# Project Pleasure - Next.js 14 + Supabase

台灣首款亲密關係健康追蹤 Web App

## 技術棧

- **前端**: Next.js 14 (App Router) + TypeScript
- **樣式**: Tailwind CSS (暗黑賽博風格)
- **後端**: Supabase (PostgreSQL + Auth + Storage)
- **圖表**: Recharts
- **動畫**: Framer Motion

## 專案結構

```
project-pleasure/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # 認證路由群組
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/         # 儀表板
│   ├── tracker/           # 追蹤器
│   ├── academy/           # 學院
│   ├── community/         # 社群
│   ├── shop/              # 商城
│   ├── settings/          # 設定
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/            # React 元件
│   ├── ui/               # 通用 UI 元件
│   ├── tracker/          # 追蹤器元件
│   ├── academy/          # 學院元件
│   ├── community/        # 社群元件
│   └── shop/             # 商城元件
├── lib/                   # 工具函數
│   ├── supabase/
│   │   ├── client.ts     # Browser Client
│   │   └── server.ts     # Server Client
│   └── utils/
├── types/                 # TypeScript 類型定義
│   └── database.types.ts
├── supabase/             # Supabase 配置
│   └── migrations/       # 資料庫 Migration
│       ├── 20260213_01_init_core.sql
│       └── 20260213_02_shop.sql
└── public/               # 靜態資源
```

## 開始使用

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

創建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 執行 Supabase Migration

```bash
# 使用 Supabase CLI
supabase db push

# 或手動執行 SQL
# 1. supabase/migrations/20260213_01_init_core.sql
# 2. supabase/migrations/20260213_02_shop.sql
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000)

## 資料庫結構

### 核心表
- `user_profiles` - 用戶擴展資料
- `partners` - 伴侶管理（隱私代號）
- `activities` - 活動記錄（支援 partner/solo 模式）
- `reminders` - 提醒設定
- `goals` - 個人目標
- `milestones` - 里程碑

### Shop 商城
- `products` - 商品
- `toy_box` - 玩具箱（個人用品管理）
- `activity_toy_usage` - 活動用品使用記錄
- `product_reviews` - 商品測評（匿名 + 真實使用驗證）
- `orders` - 訂單（加密配送資訊）
- `order_items` - 訂單明細
- `user_points` - 用戶積分

## 設計規範

### 色彩系統（暗黑賽博風格）

```css
--color-primary: #00F0FF;        /* 霓虹藍 */
--color-secondary: #FF006E;      /* 霓虹粉 */
--color-accent: #8338EC;         /* 霓虹紫 */
--color-success: #06FFA5;        /* 霓虹綠 */
--color-warning: #FFB800;        /* 霓虹黃 */
```

### 字體
- 標題: Inter Bold / Noto Sans TC Bold
- 內文: Inter Regular / Noto Sans TC Regular
- 數據: JetBrains Mono

## 開發規範

### TypeScript
- 嚴格模式啟用
- 所有 API 回應必須有類型定義
- 使用 `database.types.ts` 中的類型

### Supabase
- 使用 Server Client (`lib/supabase/server.ts`) 在 Server Components
- 使用 Browser Client (`lib/supabase/client.ts`) 在 Client Components
- 所有資料表啟用 RLS

### 樣式
- 使用 Tailwind CSS
- 遵循 4px Grid 間距系統
- 觸控目標最小 44×44px

## 下一步

1. 實作認證流程 (Login/Signup)
2. 建立 Dashboard 儀表板
3. 開發 Tracker 追蹤器功能
4. 實作 Shop 商城功能

## 文檔

- [README.md](./README.md) - 產品需求文檔
- [DATABASE-DESIGN.md](./DATABASE-DESIGN.md) - 資料庫設計文檔

---

**Version**: 0.1.0  
**Last Updated**: 2026-02-13
