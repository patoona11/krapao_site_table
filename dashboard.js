/* ═══════════════════════════════════════
   บ้านกะเพรา — Dashboard JavaScript
   ═══════════════════════════════════════ */

// Supabase Configuration
const SUPABASE_URL = 'https://ztsxolweesurovyvmebq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0c3hvbHdlZXN1cm92eXZtZWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTQ5NDksImV4cCI6MjA5NzU3MDk0OX0.kHR2QEE-hd9ca1V3BF-TpjHZD57WjgcstaITxr_WZXU';

const HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation'
};

// ─── Sidebar Navigation ───
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if(this.getAttribute('href') === 'index.html') return;
        
        e.preventDefault();
        
        // Remove active class from all
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // Fetch data if bookings section
        if(targetId === 'bookings-section') {
            fetchBookings();
        }
    });
});

// ─── Toast Notification ───
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `toast show ${type}`;
    toastMessage.textContent = message;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ─── Fetch Bookings ───
let allBookings = []; // เก็บข้อมูลทั้งหมดไว้สำหรับ Filter

async function fetchBookings() {
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">กำลังโหลดข้อมูล...</td></tr>';
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=booking_date.desc,booking_time.desc`, {
            method: 'GET',
            headers: HEADERS
        });
        
        if (!response.ok) throw new Error('Failed to fetch bookings');
        
        allBookings = await response.json();
        applyFilters(); // เรียกใช้ filter ทันทีที่โหลดเสร็จ
    } catch (err) {
        console.error('Error fetching bookings:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:red;">❌ ดึงข้อมูลล้มเหลว: ${err.message}</td></tr>`;
        showToast('ดึงข้อมูลการจองล้มเหลว', 'error');
    }
}

// ─── Filter Logic ───
const searchQuery = document.getElementById('searchQuery');
const filterDate = document.getElementById('filterDate');
const clearFilterBtn = document.getElementById('clearFilterBtn');

function applyFilters() {
    const query = searchQuery.value.toLowerCase().trim();
    const date = filterDate.value;

    const filtered = allBookings.filter(b => {
        // Filter by Search (Name, Phone, or RefID)
        const refId = `bk-${String(b.id).padStart(5, '0')}`;
        const matchSearch = !query || 
            (b.customer_name && b.customer_name.toLowerCase().includes(query)) ||
            (b.phone && b.phone.includes(query)) ||
            refId.includes(query);

        // Filter by Date
        const matchDate = !date || b.booking_date === date;

        return matchSearch && matchDate;
    });

    renderBookings(filtered);
}

// Events for filters
searchQuery.addEventListener('input', applyFilters);
filterDate.addEventListener('change', applyFilters);
clearFilterBtn.addEventListener('click', () => {
    searchQuery.value = '';
    filterDate.value = '';
    applyFilters();
});

function getStatusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    if(s === 'booked' || s === 'confirmed') return `<span class="status-badge status-confirmed">ยืนยันแล้ว</span>`;
    if(s === 'cancelled') return `<span class="status-badge status-cancelled">ยกเลิก</span>`;
    return `<span class="status-badge status-pending">รอดำเนินการ</span>`;
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = '';
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">ยังไม่มีข้อมูลการจองโต๊ะ</td></tr>';
        return;
    }
    
    bookings.forEach(b => {
        const refId = `BK-${String(b.id).padStart(5, '0')}`;
        const dateObj = new Date(b.booking_date);
        const thaiDate = dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        const time = b.booking_time ? b.booking_time.substring(0, 5) : '-'; // format HH:MM
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${refId}</strong></td>
            <td>${b.customer_name}</td>
            <td>${b.phone}</td>
            <td>${thaiDate}</td>
            <td>${time} น.</td>
            <td>${b.guest_count} ท่าน</td>
            <td>${getStatusBadge(b.status)}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('refreshBookingsBtn').addEventListener('click', fetchBookings);

// ─── Add Menu Form Handling ───
const addMenuForm = document.getElementById('addMenuForm');
addMenuForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('button[type="submit"]');
    const span = btn.querySelector('span');
    btn.disabled = true;
    span.textContent = 'กำลังบันทึก...';
    
    const payload = {
        name: document.getElementById('menuName').value.trim(),
        price: parseFloat(document.getElementById('menuPrice').value),
        description: document.getElementById('menuDesc').value.trim() || null,
        category: document.getElementById('menuCategory').value,
        badge: document.getElementById('menuBadge').value.trim() || null,
        image_url: document.getElementById('menuImage').value.trim() || null,
        is_available: true
    };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            if (result.code === '42501' || (result.message && result.message.includes('row-level security'))) {
                throw new Error("RLS Error: ต้องรันคำสั่ง SQL อนุญาตให้เพิ่มเมนูก่อน (ดูในคู่มือ)");
            }
            throw new Error(result.message || 'Error saving menu');
        }
        
        showToast('เพิ่มเมนูสำเร็จ! 🎉');
        addMenuForm.reset();
        
    } catch (err) {
        console.error('Error adding menu:', err);
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        span.textContent = 'บันทึกเมนู';
    }
});

// Initial load
fetchBookings();
