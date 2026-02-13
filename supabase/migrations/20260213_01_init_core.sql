-- Migration: 20260213_init
-- Description: Project Pleasure 初始化資料庫結構
-- Author: Code Architect
-- Date: 2026-02-13

BEGIN;

-- ============================================================================
-- 1. 基礎函數與觸發器
-- ============================================================================

-- 自動更新 updated_at 函數
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. 用戶擴展資料表
-- ============================================================================

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

CREATE INDEX idx_user_profiles_updated ON public.user_profiles(updated_at);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 新用戶自動建立 profile
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

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 3. 伴侶管理
-- ============================================================================

CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  notes TEXT,
  color_tag TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, nickname)
);

CREATE INDEX idx_partners_user ON public.partners(user_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own partners"
  ON public.partners FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 檢查疑似真實姓名
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

-- ============================================================================
-- 4. 活動記錄
-- ============================================================================

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_mode TEXT NOT NULL CHECK (activity_mode IN ('partner', 'solo')),
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL,
  activity_time TIME,
  duration_minutes SMALLINT CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  satisfaction_score SMALLINT NOT NULL CHECK (satisfaction_score BETWEEN 1 AND 10),
  emotion_tags TEXT[] DEFAULT '{}',
  encrypted_note TEXT,
  encryption_key_id TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user_date ON public.activities(user_id, activity_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_activities_user_created ON public.activities(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_activities_active ON public.activities(user_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activities"
  ON public.activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 5. 提醒設定
-- ============================================================================

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  reminder_time TIME NOT NULL DEFAULT '20:00:00',
  reminder_days SMALLINT[] DEFAULT '{1,2,3,4,5,6,7}',
  consecutive_ignores SMALLINT DEFAULT 0,
  paused_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_reminders_enabled ON public.reminders(user_id)
  WHERE enabled = true AND (paused_until IS NULL OR paused_until < NOW());

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 6. 個人目標
-- ============================================================================

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

CREATE INDEX idx_goals_user_active ON public.goals(user_id)
  WHERE is_active = true;

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 7. 里程碑
-- ============================================================================

CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_value NUMERIC NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (user_id, milestone_type, milestone_value)
);

CREATE INDEX idx_milestones_user ON public.milestones(user_id, unlocked_at DESC);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
