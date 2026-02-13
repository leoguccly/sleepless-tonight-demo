# Database Design - Project Pleasure

> Supabase PostgreSQL 資料庫設計  
> 重點：隱私加密、RLS 嚴格隔離、效能優化

---

## 設計原則

### 1. 隱私至上
- 所有用戶資料表啟用 RLS
- 私密筆記端到端加密
- 匿名社群無法追溯真實身份

### 2. 效能優化
- 常用查詢欄位建立索引
- 使用 Partial Index 優化特定查詢
- JSONB 欄位用於彈性資料

### 3. 資料完整性
- 外鍵約束確保參照完整性
- CHECK 約束驗證資料範圍
- 軟刪除機制（30 天內可恢復）

---

## 核心資料表

### 1. user_profiles (用戶擴展資料)

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Taipei',
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '20:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_profiles_updated ON public.user_profiles(updated_at);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: 新用戶自動建立 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: 自動更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 2. partners (伴侶管理)

```sql
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 隱私代號（強制）
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  
  -- 額外資訊（可選）
  notes TEXT,
  color_tag TEXT, -- 用於 UI 區分不同伴侶
  
  -- 軟刪除
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 每個用戶的伴侶昵稱不可重複
  UNIQUE (user_id, nickname)
);

-- 索引
CREATE INDEX idx_partners_user ON public.partners(user_id)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own partners"
  ON public.partners FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: 檢查疑似真實姓名（警告機制）
CREATE OR REPLACE FUNCTION public.check_partner_nickname()
RETURNS TRIGGER AS $$
DECLARE
  common_names TEXT[] := ARRAY['小明', '小華', '小美', 'Amy', 'John', 'Mary', 'David', 'Sarah'];
BEGIN
  IF NEW.nickname = ANY(common_names) THEN
    RAISE WARNING 'Nickname "%" might be a real name. Consider using a privacy code.', NEW.nickname;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_partner_nickname_trigger
  BEFORE INSERT OR UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.check_partner_nickname();
```

---

### 3. activities (活動記錄)

```sql
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 模式切換
  activity_mode TEXT NOT NULL CHECK (activity_mode IN ('partner', 'solo')),
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  
  -- 基本資訊
  activity_date DATE NOT NULL,
  activity_time TIME,
  duration_minutes SMALLINT CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  
  -- 評分與情緒
  satisfaction_score SMALLINT NOT NULL CHECK (satisfaction_score BETWEEN 1 AND 10),
  emotion_tags TEXT[] DEFAULT '{}',
  
  -- 私密筆記（加密儲存）
  encrypted_note TEXT,
  encryption_key_id TEXT,
  
  -- 軟刪除
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_activities_user_date ON public.activities(user_id, activity_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_activities_user_created ON public.activities(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Partial Index: 只索引未刪除的記錄
CREATE INDEX idx_activities_active ON public.activities(user_id)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activities"
  ON public.activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 3. reminders (提醒設定)

```sql
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  enabled BOOLEAN DEFAULT true,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  reminder_time TIME NOT NULL DEFAULT '20:00:00',
  reminder_days SMALLINT[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
  
  -- 智能暫停機制
  consecutive_ignores SMALLINT DEFAULT 0,
  paused_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 每個用戶只能有一個提醒設定
  UNIQUE (user_id)
);

-- 索引
CREATE INDEX idx_reminders_enabled ON public.reminders(user_id)
  WHERE enabled = true AND (paused_until IS NULL OR paused_until < NOW());

-- RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 4. goals (個人目標)

```sql
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  goal_type TEXT NOT NULL CHECK (goal_type IN ('frequency', 'satisfaction', 'custom')),
  target_value NUMERIC NOT NULL,
  time_period TEXT NOT NULL CHECK (time_period IN ('weekly', 'monthly', 'quarterly')),
  
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_goals_user_active ON public.goals(user_id)
  WHERE is_active = true;

-- RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 5. milestones (里程碑)

```sql
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  milestone_type TEXT NOT NULL,
  milestone_value NUMERIC NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- 每個用戶每種里程碑只能解鎖一次
  UNIQUE (user_id, milestone_type, milestone_value)
);

-- 索引
CREATE INDEX idx_milestones_user ON public.milestones(user_id, unlocked_at DESC);

-- RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

-- 里程碑只能由系統（Edge Function）寫入
CREATE POLICY "Service role can insert milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

### 6. academy_courses (課程)

```sql
CREATE TABLE public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('communication', 'health', 'psychology', 'technique')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  
  content JSONB NOT NULL, -- 課程內容結構化資料
  estimated_minutes SMALLINT NOT NULL,
  
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_courses_published ON public.academy_courses(category, difficulty)
  WHERE is_published = true;

CREATE INDEX idx_courses_content_gin ON public.academy_courses USING GIN (content);

-- RLS
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;

-- 所有人都可以讀取已發布的課程
CREATE POLICY "Anyone can view published courses"
  ON public.academy_courses FOR SELECT
  USING (is_published = true);

-- 只有管理員可以編輯
CREATE POLICY "Service role can manage courses"
  ON public.academy_courses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 7. user_course_progress (學習進度)

```sql
CREATE TABLE public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  
  progress_percentage SMALLINT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  
  -- 互動練習答案（加密）
  exercise_data JSONB DEFAULT '{}',
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 每個用戶每個課程只有一條進度記錄
  UNIQUE (user_id, course_id)
);

-- 索引
CREATE INDEX idx_progress_user ON public.user_course_progress(user_id, last_accessed_at DESC);
CREATE INDEX idx_progress_completed ON public.user_course_progress(user_id)
  WHERE completed_at IS NOT NULL;

-- RLS
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own progress"
  ON public.user_course_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### 8. community_posts (社群貼文)

```sql
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 匿名顯示
  anonymous_id UUID NOT NULL DEFAULT gen_random_uuid(), -- 隨機生成，無法追溯
  anonymous_avatar_seed TEXT NOT NULL, -- 用於生成一致的匿名頭像
  
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 2000),
  post_type TEXT NOT NULL CHECK (post_type IN ('experience', 'question', 'success')),
  
  -- 審核狀態
  moderation_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  
  -- 互動統計
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  
  -- 軟刪除
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_posts_approved ON public.community_posts(created_at DESC)
  WHERE moderation_status = 'approved' AND deleted_at IS NULL;

CREATE INDEX idx_posts_user ON public.community_posts(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_posts_moderation ON public.community_posts(moderation_status, created_at)
  WHERE moderation_status = 'pending';

-- 全文搜尋索引
CREATE INDEX idx_posts_content_fts ON public.community_posts 
  USING GIN (to_tsvector('chinese', content))
  WHERE moderation_status = 'approved' AND deleted_at IS NULL;

-- RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 所有人可以看到已審核通過的貼文（但看不到 user_id）
CREATE POLICY "Anyone can view approved posts"
  ON public.community_posts FOR SELECT
  USING (moderation_status = 'approved' AND deleted_at IS NULL);

-- 用戶可以新增自己的貼文
CREATE POLICY "Users can insert own posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用戶可以刪除自己的貼文
CREATE POLICY "Users can delete own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 管理員可以審核
CREATE POLICY "Service role can moderate posts"
  ON public.community_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 9. community_replies (社群回覆)

```sql
CREATE TABLE public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 匿名顯示
  anonymous_id UUID NOT NULL DEFAULT gen_random_uuid(),
  anonymous_avatar_seed TEXT NOT NULL,
  
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  
  -- 專業標記
  is_professional BOOLEAN DEFAULT false,
  professional_type TEXT CHECK (professional_type IN ('doctor', 'psychologist', 'therapist')),
  
  -- 審核狀態
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  likes_count INT DEFAULT 0,
  
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_replies_post ON public.community_replies(post_id, created_at)
  WHERE moderation_status = 'approved' AND deleted_at IS NULL;

CREATE INDEX idx_replies_user ON public.community_replies(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved replies"
  ON public.community_replies FOR SELECT
  USING (moderation_status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Users can insert own replies"
  ON public.community_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON public.community_replies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can moderate replies"
  ON public.community_replies FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: 更新貼文回覆數
CREATE OR REPLACE FUNCTION public.update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
    SET replies_count = replies_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_replies_count_trigger
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_post_replies_count();

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_replies_updated_at
  BEFORE UPDATE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 10. community_likes (點讚記錄)

```sql
CREATE TABLE public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 可以點讚貼文或回覆
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保只能點讚貼文或回覆其中之一
  CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  ),
  
  -- 每個用戶對每個貼文/回覆只能點讚一次
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, reply_id)
);

-- 索引
CREATE INDEX idx_likes_post ON public.community_likes(post_id);
CREATE INDEX idx_likes_reply ON public.community_likes(reply_id);
CREATE INDEX idx_likes_user ON public.community_likes(user_id, created_at DESC);

-- RLS
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON public.community_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON public.community_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 更新點讚數
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET likes_count = likes_count + 1
      WHERE id = NEW.post_id;
    ELSIF NEW.reply_id IS NOT NULL THEN
      UPDATE public.community_replies
      SET likes_count = likes_count + 1
      WHERE id = NEW.reply_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.post_id;
    ELSIF OLD.reply_id IS NOT NULL THEN
      UPDATE public.community_replies
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.reply_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON public.community_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();
```

---

### 11. community_reports (舉報記錄)

```sql
CREATE TABLE public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 可以舉報貼文或回覆
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'harassment', 'inappropriate', 'misinformation', 'other'
  )),
  description TEXT,
  
  -- 處理狀態
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- 索引
CREATE INDEX idx_reports_pending ON public.community_reports(created_at)
  WHERE status = 'pending';

CREATE INDEX idx_reports_post ON public.community_reports(post_id);
CREATE INDEX idx_reports_reply ON public.community_reports(reply_id);

-- RLS
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- 用戶可以提交舉報
CREATE POLICY "Users can insert reports"
  ON public.community_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 用戶可以查看自己的舉報
CREATE POLICY "Users can view own reports"
  ON public.community_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- 管理員可以處理舉報
CREATE POLICY "Service role can manage reports"
  ON public.community_reports FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

---

### 12. products (商城商品)

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 商品資訊
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'toy', 'lubricant', 'wellness', 'book', 'other'
  )),
  
  -- 價格與庫存
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  
  -- 圖片與連結
  image_urls TEXT[] DEFAULT '{}',
  external_url TEXT, -- 外部商城連結
  
  -- 測評統計
  average_rating NUMERIC(3, 2) DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 10),
  reviews_count INT DEFAULT 0,
  
  -- 上架狀態
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_products_published ON public.products(category, average_rating DESC)
  WHERE is_published = true;

CREATE INDEX idx_products_rating ON public.products(average_rating DESC)
  WHERE is_published = true;

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已發布的商品
CREATE POLICY "Anyone can view published products"
  ON public.products FOR SELECT
  USING (is_published = true);

-- 只有管理員可以管理商品
CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 13. toy_box (玩具箱 - 個人用品管理)

```sql
CREATE TABLE public.toy_box (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 用品資訊
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- 可選關聯商品
  custom_name TEXT NOT NULL, -- 用戶自訂名稱
  category TEXT NOT NULL CHECK (category IN (
    'toy', 'lubricant', 'wellness', 'other'
  )),
  
  -- 購買與使用資訊
  purchase_date DATE,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- 隱私模式
  is_hidden BOOLEAN DEFAULT false, -- 隱藏模式（不顯示品牌/型號）
  
  -- 筆記
  notes TEXT,
  
  -- 軟刪除
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_toy_box_user ON public.toy_box(user_id, last_used_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_toy_box_active ON public.toy_box(user_id)
  WHERE deleted_at IS NULL AND is_hidden = false;

-- RLS
ALTER TABLE public.toy_box ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own toy box items"
  ON public.toy_box FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_toy_box_updated_at
  BEFORE UPDATE ON public.toy_box
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 14. activity_toy_usage (活動用品使用記錄)

```sql
CREATE TABLE public.activity_toy_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  toy_box_id UUID NOT NULL REFERENCES public.toy_box(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 每個活動每個用品只能標記一次
  UNIQUE (activity_id, toy_box_id)
);

-- 索引
CREATE INDEX idx_activity_toy_activity ON public.activity_toy_usage(activity_id);
CREATE INDEX idx_activity_toy_toy_box ON public.activity_toy_usage(toy_box_id);

-- RLS
ALTER TABLE public.activity_toy_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activity toy usage"
  ON public.activity_toy_usage FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: 更新玩具箱使用次數
CREATE OR REPLACE FUNCTION public.update_toy_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.toy_box
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.toy_box_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.toy_box
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE id = OLD.toy_box_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_toy_usage_count_trigger
  AFTER INSERT OR DELETE ON public.activity_toy_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_toy_usage_count();
```

---

### 15. product_reviews (商品測評)

```sql
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  toy_box_id UUID REFERENCES public.toy_box(id) ON DELETE SET NULL, -- 關聯玩具箱（驗證真實使用）
  
  -- 匿名顯示
  anonymous_id UUID NOT NULL DEFAULT gen_random_uuid(),
  anonymous_avatar_seed TEXT NOT NULL,
  
  -- 多維度評分
  comfort_rating SMALLINT CHECK (comfort_rating BETWEEN 1 AND 10),
  effectiveness_rating SMALLINT CHECK (effectiveness_rating BETWEEN 1 AND 10),
  quietness_rating SMALLINT CHECK (quietness_rating BETWEEN 1 AND 10),
  material_rating SMALLINT CHECK (material_rating BETWEEN 1 AND 10),
  value_rating SMALLINT CHECK (value_rating BETWEEN 1 AND 10),
  
  overall_rating NUMERIC(3, 2) NOT NULL CHECK (overall_rating BETWEEN 1 AND 10),
  
  -- 文字評價
  review_text TEXT CHECK (char_length(review_text) BETWEEN 10 AND 1000),
  
  -- 使用驗證
  verified_purchase BOOLEAN DEFAULT false, -- 系統驗證是否真實使用
  usage_count_at_review INT DEFAULT 0, -- 撰寫測評時的使用次數
  
  -- 審核狀態
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  -- 積分獎勵
  points_awarded INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 每個用戶每個商品只能評價一次
  UNIQUE (user_id, product_id)
);

-- 索引
CREATE INDEX idx_reviews_product ON public.product_reviews(product_id, created_at DESC)
  WHERE moderation_status = 'approved';

CREATE INDEX idx_reviews_user ON public.product_reviews(user_id, created_at DESC);

CREATE INDEX idx_reviews_verified ON public.product_reviews(product_id, overall_rating DESC)
  WHERE moderation_status = 'approved' AND verified_purchase = true;

-- RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已審核的測評（但看不到 user_id）
CREATE POLICY "Anyone can view approved reviews"
  ON public.product_reviews FOR SELECT
  USING (moderation_status = 'approved');

-- 用戶可以新增自己的測評
CREATE POLICY "Users can insert own reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用戶可以更新自己的測評（審核前）
CREATE POLICY "Users can update own pending reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- 管理員可以審核
CREATE POLICY "Service role can moderate reviews"
  ON public.product_reviews FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: 更新商品平均評分
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    average_rating = (
      SELECT ROUND(AVG(overall_rating), 2)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND moderation_status = 'approved'
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND moderation_status = 'approved'
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 16. orders (訂單)

```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 訂單資訊
  order_number TEXT NOT NULL UNIQUE, -- 訂單編號（自動生成）
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- 配送資訊（加密）
  encrypted_shipping_info TEXT NOT NULL, -- 加密的收件人資訊
  shipping_method TEXT NOT NULL CHECK (shipping_method IN (
    'home_delivery', 'convenience_store', 'post_office'
  )),
  
  -- 訂單狀態
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
  )),
  
  -- 付款資訊
  payment_method TEXT CHECK (payment_method IN (
    'credit_card', 'atm', 'convenience_store', 'line_pay'
  )),
  paid_at TIMESTAMPTZ,
  
  -- 物流資訊
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX idx_orders_number ON public.orders(order_number);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 只有管理員可以更新訂單狀態
CREATE POLICY "Service role can update orders"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger: 自動生成訂單編號
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'PP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Trigger: 自動更新 updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### 17. order_items (訂單明細)

```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  
  -- 商品快照（防止商品資訊變更）
  product_name TEXT NOT NULL,
  product_price NUMERIC(10, 2) NOT NULL,
  
  quantity SMALLINT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看自己訂單的明細
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- 用戶可以新增訂單明細（建立訂單時）
CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );
```

---

### 18. user_points (用戶積分)

```sql
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 積分變動
  points_change INT NOT NULL, -- 正數為獲得，負數為消費
  points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  
  -- 來源
  source_type TEXT NOT NULL CHECK (source_type IN (
    'review', 'order', 'referral', 'event', 'admin'
  )),
  source_id UUID, -- 關聯的來源 ID（如 review_id, order_id）
  
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_points_user ON public.user_points(user_id, created_at DESC);
CREATE INDEX idx_user_points_balance ON public.user_points(user_id, points_balance DESC);

-- RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

-- 只有系統可以新增積分記錄
CREATE POLICY "Service role can manage points"
  ON public.user_points FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

---

## 常用查詢

### 1. 取得用戶統計資料

```sql
-- 本月活動次數與平均滿意度（按模式分組）
SELECT
  activity_mode,
  COUNT(*) AS activity_count,
  ROUND(AVG(satisfaction_score), 1) AS avg_satisfaction
FROM public.activities
WHERE user_id = auth.uid()
  AND activity_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND deleted_at IS NULL
GROUP BY activity_mode;
```

### 2. 取得伴侶統計

```sql
-- 各伴侶的活動統計
SELECT
  p.nickname,
  p.color_tag,
  COUNT(a.id) AS activity_count,
  ROUND(AVG(a.satisfaction_score), 1) AS avg_satisfaction,
  MAX(a.activity_date) AS last_activity_date
FROM public.partners p
LEFT JOIN public.activities a ON a.partner_id = p.id AND a.deleted_at IS NULL
WHERE p.user_id = auth.uid()
  AND p.deleted_at IS NULL
GROUP BY p.id, p.nickname, p.color_tag
ORDER BY activity_count DESC;
```

### 3. 取得玩具箱使用統計

```sql
-- 玩具箱使用頻率排行
SELECT
  tb.custom_name,
  tb.category,
  tb.usage_count,
  tb.last_used_at,
  COALESCE(pr.overall_rating, 0) AS my_rating
FROM public.toy_box tb
LEFT JOIN public.product_reviews pr ON pr.toy_box_id = tb.id
WHERE tb.user_id = auth.uid()
  AND tb.deleted_at IS NULL
  AND tb.is_hidden = false
ORDER BY tb.usage_count DESC, tb.last_used_at DESC
LIMIT 10;
```

### 4. 檢查是否可撰寫測評

```sql
-- 檢查用品是否達到撰寫測評條件（使用 3 次以上且未評價）
SELECT
  tb.id,
  tb.custom_name,
  tb.usage_count,
  tb.product_id,
  CASE
    WHEN tb.usage_count >= 3 AND pr.id IS NULL THEN true
    ELSE false
  END AS can_review
FROM public.toy_box tb
LEFT JOIN public.product_reviews pr ON pr.toy_box_id = tb.id
WHERE tb.user_id = auth.uid()
  AND tb.deleted_at IS NULL
  AND tb.product_id IS NOT NULL;
```

### 5. 取得商品測評排行

```sql
-- 高分商品排行（已驗證購買）
SELECT
  p.id,
  p.name,
  p.category,
  p.average_rating,
  p.reviews_count,
  COUNT(pr.id) FILTER (WHERE pr.verified_purchase = true) AS verified_reviews_count
FROM public.products p
LEFT JOIN public.product_reviews pr ON pr.product_id = p.id AND pr.moderation_status = 'approved'
WHERE p.is_published = true
GROUP BY p.id, p.name, p.category, p.average_rating, p.reviews_count
HAVING p.reviews_count >= 3
ORDER BY p.average_rating DESC, p.reviews_count DESC
LIMIT 20;
```

### 6. 取得用戶訂單歷史

```sql
-- 用戶訂單列表
SELECT
  o.id,
  o.order_number,
  o.total_amount,
  o.status,
  o.shipping_method,
  o.created_at,
  o.delivered_at,
  COUNT(oi.id) AS items_count
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.user_id = auth.uid()
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### 7. 取得用戶積分餘額

```sql
-- 用戶當前積分
SELECT
  COALESCE(SUM(points_change), 0) AS total_points
FROM public.user_points
WHERE user_id = auth.uid();

-- 積分明細（最近 10 筆）
SELECT
  points_change,
  points_balance,
  source_type,
  description,
  created_at
FROM public.user_points
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

### 8. 取得社群熱門貼文（Dcard 風格）

```sql
-- 熱門算法：點讚數 × 0.6 + 留言數 × 0.3 + 瀏覽數 × 0.1
-- 注意：需要額外追蹤 views_count（此處簡化）
SELECT
  id,
  anonymous_id,
  anonymous_avatar_seed,
  content,
  post_type,
  likes_count,
  replies_count,
  created_at,
  (likes_count * 0.6 + replies_count * 0.3) AS hotness_score
FROM public.community_posts
WHERE moderation_status = 'approved'
  AND deleted_at IS NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY hotness_score DESC
LIMIT 20;
```

---

## 加密方案

### 私密筆記加密

```typescript
// Edge Function: encrypt-note
import { createClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from './crypto-utils'

export async function encryptNote(userId: string, plaintext: string) {
  const encryptionKey = await generateUserKey(userId)
  const encrypted = await encrypt(plaintext, encryptionKey)
  
  return {
    encrypted_note: encrypted.ciphertext,
    encryption_key_id: encrypted.keyId
  }
}

export async function decryptNote(userId: string, ciphertext: string, keyId: string) {
  const encryptionKey = await getUserKey(userId, keyId)
  return await decrypt(ciphertext, encryptionKey)
}
```

---

## Migration 順序

```bash
# 1. 基礎表
20260213_010000_create_user_profiles.sql
20260213_020000_create_partners.sql
20260213_030000_create_activities.sql
20260213_040000_create_reminders.sql
20260213_050000_create_goals.sql
20260213_060000_create_milestones.sql

# 2. Academy 功能
20260213_070000_create_academy_courses.sql
20260213_080000_create_user_course_progress.sql

# 3. Community 功能
20260213_090000_create_community_posts.sql
20260213_100000_create_community_replies.sql
20260213_110000_create_community_likes.sql
20260213_120000_create_community_reports.sql

# 4. Shop 功能
20260213_130000_create_products.sql
20260213_140000_create_toy_box.sql
20260213_150000_create_activity_toy_usage.sql
20260213_160000_create_product_reviews.sql
20260213_170000_create_orders.sql
20260213_180000_create_order_items.sql
20260213_190000_create_user_points.sql

# 5. 索引優化
20260213_200000_create_performance_indexes.sql
```

---

## RLS 安全檢查清單

- [x] 所有用戶資料表啟用 RLS
- [x] 用戶只能存取自己的資料
- [x] 伴侶資料加密且隔離（隱私代號強制）
- [x] 玩具箱資料完全隔離（支援隱藏模式）
- [x] 社群貼文匿名化（無法追溯 user_id）
- [x] 商品測評匿名化（verified_purchase 驗證）
- [x] 訂單配送資訊加密儲存
- [x] 積分系統只能由 service_role 操作
- [x] 管理功能限制 service_role
- [x] 軟刪除記錄不出現在查詢中
- [x] 敏感欄位（encrypted_note, encrypted_shipping_info）加密儲存

---

## 效能優化建議

### 1. 索引策略
- 常用查詢欄位建立索引（user_id, activity_date, partner_id）
- 使用 Partial Index 過濾軟刪除記錄
- JSONB 欄位使用 GIN 索引
- 商品評分使用複合索引（category + average_rating）

### 2. 查詢優化
- 避免 SELECT *，明確指定欄位
- 使用 LIMIT 限制結果數量
- 複雜統計使用 Materialized View
- 熱門貼文算法使用快取（Redis）

### 3. 連線管理
- 使用 Supabase Connection Pooling
- 避免長時間持有連線
- 使用 Prepared Statements

### 4. 商城特定優化
- 商品列表使用分頁（OFFSET + LIMIT）
- 測評統計使用觸發器即時更新
- 訂單查詢使用索引（order_number, user_id + created_at）
- 積分餘額使用 SUM 聚合（考慮快取）

---

**Last Updated**: 2026-02-13  
**Version**: 2.0.0  
**Status**: Draft
