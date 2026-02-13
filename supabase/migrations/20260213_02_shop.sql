-- Migration: 20260213_02_shop
-- Description: Shop 商城功能（商品、玩具箱、測評、訂單）
-- Author: Code Architect
-- Date: 2026-02-13

BEGIN;

-- ============================================================================
-- 1. 商品
-- ============================================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('toy', 'lubricant', 'wellness', 'book', 'other')),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  image_urls TEXT[] DEFAULT '{}',
  external_url TEXT,
  average_rating NUMERIC(3, 2) DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 10),
  reviews_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_published ON public.products(category, average_rating DESC)
  WHERE is_published = true;

CREATE INDEX idx_products_rating ON public.products(average_rating DESC)
  WHERE is_published = true;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products"
  ON public.products FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 2. 玩具箱
-- ============================================================================

CREATE TABLE public.toy_box (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  custom_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('toy', 'lubricant', 'wellness', 'other')),
  purchase_date DATE,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_toy_box_user ON public.toy_box(user_id, last_used_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_toy_box_active ON public.toy_box(user_id)
  WHERE deleted_at IS NULL AND is_hidden = false;

ALTER TABLE public.toy_box ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own toy box items"
  ON public.toy_box FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_toy_box_updated_at
  BEFORE UPDATE ON public.toy_box
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 3. 活動用品使用記錄
-- ============================================================================

CREATE TABLE public.activity_toy_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  toy_box_id UUID NOT NULL REFERENCES public.toy_box(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (activity_id, toy_box_id)
);

CREATE INDEX idx_activity_toy_activity ON public.activity_toy_usage(activity_id);
CREATE INDEX idx_activity_toy_toy_box ON public.activity_toy_usage(toy_box_id);

ALTER TABLE public.activity_toy_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activity toy usage"
  ON public.activity_toy_usage FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 更新玩具箱使用次數
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

-- ============================================================================
-- 4. 商品測評
-- ============================================================================

CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  toy_box_id UUID REFERENCES public.toy_box(id) ON DELETE SET NULL,
  anonymous_id UUID NOT NULL DEFAULT gen_random_uuid(),
  anonymous_avatar_seed TEXT NOT NULL,
  comfort_rating SMALLINT CHECK (comfort_rating BETWEEN 1 AND 10),
  effectiveness_rating SMALLINT CHECK (effectiveness_rating BETWEEN 1 AND 10),
  quietness_rating SMALLINT CHECK (quietness_rating BETWEEN 1 AND 10),
  material_rating SMALLINT CHECK (material_rating BETWEEN 1 AND 10),
  value_rating SMALLINT CHECK (value_rating BETWEEN 1 AND 10),
  overall_rating NUMERIC(3, 2) NOT NULL CHECK (overall_rating BETWEEN 1 AND 10),
  review_text TEXT CHECK (char_length(review_text) BETWEEN 10 AND 1000),
  verified_purchase BOOLEAN DEFAULT false,
  usage_count_at_review INT DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_reviews_product ON public.product_reviews(product_id, created_at DESC)
  WHERE moderation_status = 'approved';

CREATE INDEX idx_reviews_user ON public.product_reviews(user_id, created_at DESC);

CREATE INDEX idx_reviews_verified ON public.product_reviews(product_id, overall_rating DESC)
  WHERE moderation_status = 'approved' AND verified_purchase = true;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON public.product_reviews FOR SELECT
  USING (moderation_status = 'approved');

CREATE POLICY "Users can insert own reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can moderate reviews"
  ON public.product_reviews FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 更新商品平均評分
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

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 5. 訂單
-- ============================================================================

CREATE SEQUENCE order_number_seq;

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  encrypted_shipping_info TEXT NOT NULL,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN (
    'home_delivery', 'convenience_store', 'post_office'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
  )),
  payment_method TEXT CHECK (payment_method IN (
    'credit_card', 'atm', 'convenience_store', 'line_pay'
  )),
  paid_at TIMESTAMPTZ,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX idx_orders_number ON public.orders(order_number);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update orders"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 自動生成訂單編號
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'PP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 6. 訂單明細
-- ============================================================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_price NUMERIC(10, 2) NOT NULL,
  quantity SMALLINT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. 用戶積分
-- ============================================================================

CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INT NOT NULL,
  points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'review', 'order', 'referral', 'event', 'admin'
  )),
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_points_user ON public.user_points(user_id, created_at DESC);
CREATE INDEX idx_user_points_balance ON public.user_points(user_id, points_balance DESC);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage points"
  ON public.user_points FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
