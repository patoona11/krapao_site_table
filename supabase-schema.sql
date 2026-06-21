-- ═══════════════════════════════════════════════════
-- บ้านกะเพรา 🌿 — Supabase SQL Schema
-- สร้างตารางทั้งหมดสำหรับระบบร้านอาหาร
-- ═══════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. ตารางเมนูอาหาร (Menu Items)
-- ─────────────────────────────────────────
CREATE TABLE menu_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL,                          -- ชื่อเมนู เช่น กะเพราหมูสับไข่ดาว
    description TEXT,                                   -- รายละเอียดเมนู
    price       DECIMAL(10,2) NOT NULL DEFAULT 0,       -- ราคา (บาท)
    image_url   TEXT,                                   -- URL รูปภาพเมนู
    category    TEXT DEFAULT 'main',                     -- หมวดหมู่: main, drink, dessert
    badge       TEXT,                                   -- ป้ายติด: ขายดีอันดับ1, เมนูใหม่, พรีเมียม
    is_available BOOLEAN DEFAULT TRUE,                  -- เปิด/ปิดขายเมนูนี้
    sort_order  INT DEFAULT 0,                          -- ลำดับการแสดงผล
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- เพิ่มข้อมูลเมนู 3 รายการ
INSERT INTO menu_items (name, description, price, category, badge, sort_order) VALUES
('กะเพราหมูสับไข่ดาว', 'หมูสับผัดกับกะเพราป่าแท้ๆ ไฟแรงหอมฟุ้ง เสิร์ฟพร้อมไข่ดาวเป็ดทอดกรอบ ข้าวหอมมะลิร้อนๆ', 59, 'main', '🏆 ขายดีอันดับ 1', 1),
('กะเพราไก่สับราดข้าว', 'ไก่สับเนื้อแน่นผัดกระเทียมพริกสด ใส่ใบกะเพราแบบจัดเต็ม ราดบนข้าวสวย ทานกับไข่เจียวฟู', 55, 'main', '✨ เมนูใหม่', 2),
('กะเพราทะเลรวมมิตร', 'กุ้ง ปลาหมึก หมูสับ ผัดรวมกับกะเพราป่า พริกขี้หนู ไฟแรง เสิร์ฟพร้อมไข่ดาวกรอบและข้าวสวย', 89, 'main', '👑 พรีเมียม', 3);


-- ─────────────────────────────────────────
-- 2. ตารางจองโต๊ะ (Bookings)
-- ─────────────────────────────────────────
CREATE TABLE bookings (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name   TEXT NOT NULL,                      -- ชื่อผู้จอง
    phone           TEXT NOT NULL,                      -- เบอร์โทรศัพท์
    booking_date    DATE NOT NULL,                      -- วันที่จอง
    booking_time    TIME NOT NULL,                      -- เวลาที่จอง
    guest_count     INT NOT NULL DEFAULT 2              -- จำนวนท่าน
                    CHECK (guest_count >= 1 AND guest_count <= 20),
    note            TEXT,                               -- หมายเหตุ
    status          TEXT DEFAULT 'pending'              -- สถานะ: pending, confirmed, cancelled, completed
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────
-- 3. ตารางสั่งซื้อ (Orders)
-- ─────────────────────────────────────────
CREATE TABLE orders (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name   TEXT NOT NULL,                      -- ชื่อลูกค้า
    phone           TEXT NOT NULL,                      -- เบอร์โทร
    total_amount    DECIMAL(10,2) DEFAULT 0,            -- ยอดรวม (บาท)
    status          TEXT DEFAULT 'pending'              -- สถานะ: pending, preparing, delivering, completed, cancelled
                    CHECK (status IN ('pending', 'preparing', 'delivering', 'completed', 'cancelled')),
    note            TEXT,                               -- หมายเหตุ
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────
-- 4. ตารางรายการสั่งซื้อ (Order Items)
-- ─────────────────────────────────────────
CREATE TABLE order_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT REFERENCES orders(id) ON DELETE CASCADE,     -- FK ไปที่ orders
    menu_id     BIGINT REFERENCES menu_items(id) ON DELETE SET NULL, -- FK ไปที่ menu_items
    menu_name   TEXT NOT NULL,                          -- ชื่อเมนู (เก็บไว้กันเมนูถูกลบ)
    quantity    INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price  DECIMAL(10,2) NOT NULL,                 -- ราคาต่อชิ้น ณ เวลาสั่ง
    subtotal    DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════
-- 5. Row Level Security (RLS) — ความปลอดภัย
-- ═══════════════════════════════════════════════════

-- เปิด RLS ทุกตาราง
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ทุกคน (anon) อ่านเมนูได้
CREATE POLICY "Anyone can view menu"
    ON menu_items FOR SELECT
    TO anon, authenticated
    USING (true);

-- อนุญาตให้ทุกคน (anon) จองโต๊ะได้
CREATE POLICY "Anyone can create booking"
    ON bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- อนุญาตให้ทุกคน (anon) สั่งซื้อได้
CREATE POLICY "Anyone can create order"
    ON orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- อนุญาตให้ทุกคน (anon) เพิ่มรายการสั่งซื้อได้
CREATE POLICY "Anyone can create order items"
    ON order_items FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin (authenticated) จัดการทุกอย่างได้
CREATE POLICY "Admin full access menu"
    ON menu_items FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access bookings"
    ON bookings FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access orders"
    ON orders FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access order_items"
    ON order_items FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- 6. Indexes — เพิ่มความเร็วในการค้นหา
-- ═══════════════════════════════════════════════════
CREATE INDEX idx_bookings_date      ON bookings(booking_date);
CREATE INDEX idx_bookings_status    ON bookings(status);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created     ON orders(created_at);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_menu_category      ON menu_items(category);


-- ═══════════════════════════════════════════════════
-- 7. Function: อัพเดท updated_at อัตโนมัติ
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger สำหรับทุกตาราง
CREATE TRIGGER trigger_menu_items_updated
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bookings_updated
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
