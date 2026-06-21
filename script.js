/* ═══════════════════════════════════════
   บ้านกะเพรา — JavaScript Interactions
   ═══════════════════════════════════════ */

// ─── Navbar scroll effect ───
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ─── Mobile Hamburger Menu ───
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// ─── Smooth scroll for all anchor links ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ─── Order Modal ───
const modal = document.getElementById('orderModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalClose = document.getElementById('modalClose');
const modalOk = document.getElementById('modalOk');

function orderItem(name, price) {
    modalTitle.textContent = 'สั่งซื้อสำเร็จ! 🎉';
    modalDesc.textContent = `เมนู: ${name} — ฿${price}`;
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);
modalOk.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// ─── Guest Counter ───
let guestCount = 2;
const guestCountEl = document.getElementById('guestCount');
const guestMinus = document.getElementById('guestMinus');
const guestPlus = document.getElementById('guestPlus');

guestMinus.addEventListener('click', () => {
    if (guestCount > 1) {
        guestCount--;
        guestCountEl.textContent = guestCount;
        guestCountEl.style.transform = 'scale(1.2)';
        setTimeout(() => guestCountEl.style.transform = 'scale(1)', 150);
    }
});

guestPlus.addEventListener('click', () => {
    if (guestCount < 20) {
        guestCount++;
        guestCountEl.textContent = guestCount;
        guestCountEl.style.transform = 'scale(1.2)';
        setTimeout(() => guestCountEl.style.transform = 'scale(1)', 150);
    }
});

// ─── Set min date to today ───
const bookDate = document.getElementById('bookDate');
const today = new Date().toISOString().split('T')[0];
bookDate.setAttribute('min', today);

// ═══════════════════════════════════════════════════
// Supabase Integration (REST API)
// ═══════════════════════════════════════════════════
const SUPABASE_URL = 'https://ztsxolweesurovyvmebq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0c3hvbHdlZXN1cm92eXZtZWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTQ5NDksImV4cCI6MjA5NzU3MDk0OX0.kHR2QEE-hd9ca1V3BF-TpjHZD57WjgcstaITxr_WZXU';

// ─── Booking Form Submit (Supabase REST API) ───
const bookingForm = document.getElementById('bookingForm');
const submitBtn = bookingForm.querySelector('button[type="submit"]');
const submitBtnText = submitBtn.querySelector('span');

bookingForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('bookName').value.trim();
    const phone = document.getElementById('bookPhone').value.trim();
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;
    const note = document.getElementById('bookNote').value.trim();

    // Basic validation
    if (!name || !phone || !date || !time) {
        modalTitle.textContent = '⚠️ กรุณากรอกข้อมูลให้ครบ';
        modalDesc.innerHTML = 'กรุณากรอก ชื่อ, เบอร์โทร, วันที่ และเวลาให้ครบถ้วน';
        modal.classList.add('active');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtnText.textContent = 'กำลังบันทึก...';

    // Build payload
    const payload = {
        customer_name: name,
        phone: phone,
        booking_date: date,
        booking_time: time,
        guest_count: guestCount,
        note: note || null,
        status: 'pending' // เปลี่ยนจาก 'booked' เป็น 'pending' ตาม Check Constraint
    };

    console.log('📤 Sending to Supabase:', payload);

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📥 Supabase response:', response.status, result);

        if (!response.ok) {
            // Check for RLS error
            if (result.code === '42501' || (result.message && result.message.includes('row-level security'))) {
                throw {
                    isRLS: true,
                    message: result.message
                };
            }
            throw {
                message: result.message || result.error || `HTTP ${response.status}`
            };
        }

        // ✅ Success
        const record = Array.isArray(result) ? result[0] : result;
        const refId = record && record.id ? `BK-${String(record.id).padStart(5, '0')}` : `BK-${Date.now()}`;

        const dateObj = new Date(date);
        const thaiDate = dateObj.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        modalTitle.textContent = 'จองโต๊ะสำเร็จ! 🎉';
        modalDesc.innerHTML = `
            <div style="background:#C5E8D5; color:#1B5E34; padding:10px 16px; border-radius:12px; margin-bottom:12px; font-weight:700; font-size:1.1rem;">
                เลขอ้างอิง: ${refId}
            </div>
            <strong>${name}</strong><br>
            📅 ${thaiDate} เวลา ${time} น.<br>
            👥 ${guestCount} ท่าน<br>
            📞 ${phone}
            ${note ? '<br>📝 ' + note : ''}
            <br><br>
            <span style="font-size:0.82rem; color:#A89E9E;">เราจะติดต่อกลับเพื่อยืนยันการจองค่ะ</span>
        `;
        modal.classList.add('active');

        // Reset form
        bookingForm.reset();
        guestCount = 2;
        guestCountEl.textContent = 2;

    } catch (err) {
        console.error('❌ Booking error:', err);

        if (err.isRLS) {
            // RLS Policy Error — แนะนำวิธีแก้
            modalTitle.textContent = '🔒 ต้องตั้งค่า Supabase ก่อน';
            modalDesc.innerHTML = `
                <p style="color:#D45B52; font-weight:600;">Row Level Security กำลังบล็อกการบันทึก</p>
                <p style="font-size:0.85rem; color:#7A6E6E; margin-top:10px;">
                    ไปที่ <strong>Supabase Dashboard → SQL Editor</strong><br>แล้วรันคำสั่งนี้:
                </p>
                <div style="background:#2C2424; color:#C5E8D5; padding:12px; border-radius:10px; margin-top:10px; font-size:0.75rem; text-align:left; font-family:monospace; overflow-x:auto;">
                    CREATE POLICY "Allow anon insert"<br>
                    &nbsp;&nbsp;ON bookings FOR INSERT<br>
                    &nbsp;&nbsp;TO anon WITH CHECK (true);<br><br>
                    CREATE POLICY "Allow anon select"<br>
                    &nbsp;&nbsp;ON bookings FOR SELECT<br>
                    &nbsp;&nbsp;TO anon USING (true);
                </div>
            `;
        } else {
            // Generic Error
            modalTitle.textContent = '❌ เกิดข้อผิดพลาด';
            modalDesc.innerHTML = `
                <p style="color:#D45B52;">ไม่สามารถบันทึกการจองได้</p>
                <p style="font-size:0.82rem; color:#A89E9E; margin-top:8px;">
                    ${err.message || 'กรุณาลองใหม่อีกครั้ง หรือติดต่อร้านโดยตรง'}
                </p>
                <p style="font-size:0.82rem; color:#A89E9E; margin-top:4px;">
                    📞 โทร 02-xxx-xxxx หรือ LINE: @baankrapao
                </p>
            `;
        }
        modal.classList.add('active');
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = 'ยืนยันการจอง';
    }
});
// ─── Intersection Observer for scroll animations ───
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `all 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.15}s`;
    observer.observe(el);
});
