-- ═══════════════════════════════════════════════════
-- แก้ไข RLS Policy สำหรับตาราง bookings
-- ให้ anon (ผู้ใช้ทั่วไป) สามารถ INSERT ข้อมูลได้
-- ═══════════════════════════════════════════════════

-- ลบ policy เก่าถ้ามี (ป้องกัน error ซ้ำ)
DROP POLICY IF EXISTS "Anyone can create booking" ON bookings;
DROP POLICY IF EXISTS "Anyone can read own booking" ON bookings;
DROP POLICY IF EXISTS "Enable insert for anon" ON bookings;
DROP POLICY IF EXISTS "Enable read for anon" ON bookings;

-- สร้าง Policy ใหม่: อนุญาตให้ทุกคน INSERT ได้
CREATE POLICY "Enable insert for anon"
    ON bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- สร้าง Policy ใหม่: อนุญาตให้ทุกคน SELECT ได้ (จำเป็นสำหรับ .select() หลัง insert)
CREATE POLICY "Enable read for anon"
    ON bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);
