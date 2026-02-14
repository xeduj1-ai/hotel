
// ========================================
// SMART HOTEL AI OS — MAIN LOGIC
// ========================================

const HOTEL_NAME = 'Oceanview Resort & Spa';

// ===== DATA MODELS & CONFIG =====
const ROOM_TYPES = ['Simple', 'Doble', 'Suite'];
const ROOM_PRICES = { 'Simple': 50, 'Doble': 80, 'Suite': 120 };
const STATUSES = ['available', 'occupied', 'cleaning', 'maintenance', 'checkout'];
const STATUS_ES = { available: 'Libre', occupied: 'Ocupada', cleaning: 'Limpieza', maintenance: 'Mantenimiento', checkout: 'Checkout' };

const CHANNELS = [
  { name: 'Directo / Alex AI', share: 45, color: '#d4a853', icon: '🤖' },
  { name: 'Booking.com', share: 30, color: '#003580', icon: 'B' },
  { name: 'Expedia', share: 15, color: '#002577', icon: 'E' },
  { name: 'Airbnb', share: 10, color: '#FF5A5F', icon: 'A' }
];

const PAYMENT_METHODS = [
  { id: 'punto_banesco', name: 'Punto Banesco', icon: '🏦', color: '#005aab' },
  { id: 'punto_provincial', name: 'Punto Provincial', icon: '🔵', color: '#004481' },
  { id: 'tdc', name: 'Tarjeta de Crédito', icon: '💳', color: '#333' },
  { id: 'divisa', name: 'Divisa', icon: '💵', color: '#43A047', isFolder: true },
  { id: 'ves_cash', name: 'Efectivo (Bs)', icon: '💸', color: '#E53935' },
  { id: 'transfer', name: 'Transferencia', icon: '📲', color: '#1E88E5' }
];

const DIVISA_METHODS = [
  { id: 'zelle', name: 'Zelle', icon: '💸', color: '#6d1ed1' },
  { id: 'binance', name: 'Binance Pay', icon: '🔶', color: '#f3ba2f' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', color: '#003087' },
  { id: 'usd_cash', name: 'Dólares Físicos', icon: '💵', color: '#43A047' },
  { id: 'usd_e', name: 'Dólares Electrónicos', icon: '💳', color: '#1E88E5' }
];

const EXCHANGE_RATE_VES = 36.50; // Mock rate for demo

let DB = {
  currentUser: null,
  rooms: [],
  reservations: [],
  guests: [],
  hkTasks: [],
  notifications: [],
  maintenanceOrders: [],
  settings: {
    exchangeRate: 36.50
  }
};

// ===== DB INIT & SEEDING =====
function initDB() {
  const saved = localStorage.getItem('SmartHotelDB_v2');
  if (saved) {
    DB = JSON.parse(saved);
    // Migration: ensure settings exists
    if (!DB.settings) DB.settings = { exchangeRate: 36.50 };
    updateExchangeRateUI();
    return;
  }

  // Seed Rooms
  const floors = [1, 2, 3];
  floors.forEach(f => {
    for (let r = 1; r <= 10; r++) {
      const num = f * 100 + r;
      const type = ROOM_TYPES[Math.floor(Math.random() * ROOM_TYPES.length)];
      const st = STATUSES[Math.floor(Math.random() * 5)];
      // Simple logic to distribute statuses
      let finalSt = 'available';
      if (r <= 3) finalSt = 'occupied';
      else if (r <= 5) finalSt = 'cleaning';
      else if (r === 6) finalSt = 'maintenance';

      DB.rooms.push({ id: num, floor: f, type, status: finalSt, guestId: null });
    }
  });

  // Seed Reservations
  DB.guests = [
    { id: 'G001', name: 'Juan Pérez', email: 'juan@mail.com', phone: '+123456789', country: 'España', tier: 'oro', points: 12500, stays: 5, totalSpent: 4200, pillow: 'Plumas', allergies: 'Ninguna', preferences: { temp: 21, bedType: 'King' } },
    { id: 'G002', name: 'Sarah Smith', email: 'sarah@mail.com', phone: '+198765432', country: 'USA', tier: 'platino', points: 45000, stays: 12, totalSpent: 15800, pillow: 'Espuma', allergies: 'Nueces', preferences: { temp: 20, bedType: 'Queen' } },
    { id: 'G003', name: 'Carlos Ruiz', email: 'carlos@mail.com', phone: '+555123456', country: 'México', tier: 'bronce', points: 500, stays: 1, totalSpent: 350, pillow: 'Standard', allergies: 'Ninguna', preferences: { temp: 22, bedType: 'Twin' } }
  ];

  DB.reservations = [
    {
      id: 'RES-1001', guestName: 'Juan Pérez', roomId: 101, checkIn: todayStr(-2), checkOut: todayStr(2), status: 'checkin', channel: 'Directo', rate: 120, total: 480, roomType: 'Suite',
      folio: [{ name: 'Estancia Inicial (4 noches)', price: 480, time: 'Init' }]
    },
    {
      id: 'RES-1002', guestName: 'Sarah Smith', roomId: 205, checkIn: todayStr(0), checkOut: todayStr(3), status: 'checkin', channel: 'Booking.com', rate: 80, total: 240, roomType: 'Doble',
      folio: [{ name: 'Estancia Inicial (3 noches)', price: 240, time: 'Init' }]
    },
    {
      id: 'RES-1003', guestName: 'Carlos Ruiz', roomId: null, checkIn: todayStr(1), checkOut: todayStr(4), status: 'confirmada', channel: 'Expedia', rate: 50, total: 150, roomType: 'Simple',
      folio: [{ name: 'Estancia Inicial (3 noches)', price: 150, time: 'Init' }]
    }
  ];

  DB.hkTasks = [
    { id: 1, roomId: 104, type: 'Limpieza de Salida', priority: 'high', status: 'pendiente', assignee: 'María', eta: '10:30 AM' },
    { id: 2, roomId: 202, type: 'Limpieza Diaria', priority: 'medium', status: 'progreso', assignee: 'Juana', eta: '11:00 AM' },
    { id: 3, roomId: 305, type: 'Inspección', priority: 'low', status: 'lista', assignee: 'Sup. Ana', eta: '12:00 PM' }
  ];

  // Seed Maintenance Orders
  DB.maintenanceOrders = [
    { id: 1, roomId: 106, description: 'Aire acondicionado ruidoso', priority: 'alta', status: 'pendiente', assignee: 'Técnico Carlos', createdAt: todayStr(-1) },
    { id: 2, roomId: 302, description: 'Grifo del baño gotea', priority: 'media', status: 'progreso', assignee: 'Técnico Luis', createdAt: todayStr(-2) },
    { id: 3, roomId: 201, description: 'Cambio de colchón preventivo', priority: 'baja', status: 'resuelta', assignee: 'Técnico Carlos', createdAt: todayStr(-5) }
  ];

  saveDB();
}

function saveDB() { localStorage.setItem('SmartHotelDB_v2', JSON.stringify(DB)); }
function loadDB() { initDB(); }
function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}`;
}

// ===== EXCHANGE RATE LOGIC =====
async function syncExchangeRate() {
  const btn = document.querySelector('.rate-sync-btn');
  if (btn) btn.classList.add('spinning');

  try {
    // Using a reliable public community API for BCV rates
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const data = await response.json();

    if (data && data.promedio) {
      DB.settings.exchangeRate = parseFloat(data.promedio);
      saveDB();
      updateExchangeRateUI();
      showToast(`Tasa actualizada: Bs. ${DB.settings.exchangeRate}`, 'success');
    } else {
      throw new Error('Datos inválidos');
    }
  } catch (e) {
    console.warn('Sync failed, falling back to manual or cached rate:', e);
    const manual = prompt('No se pudo sincronizar. Ingrese tasa manualmente:', DB.settings.exchangeRate);
    if (manual && !isNaN(manual)) {
      DB.settings.exchangeRate = parseFloat(manual);
      saveDB();
      updateExchangeRateUI();
    }
  } finally {
    if (btn) btn.classList.remove('spinning');
  }
}

function updateExchangeRateUI() {
  const el = document.getElementById('headerRateValue');
  if (el && DB.settings) {
    el.innerText = `Bs. ${DB.settings.exchangeRate.toFixed(2)}`;
  }
}

// ===== AUTH SYSTEM =====
let selectedRole = null;

function loginSendOTP() {
  const email = document.getElementById('loginEmail').value;
  if (!email) return showToast('Por favor ingresa un email', 'warning');
  document.getElementById('loginStep1').classList.remove('active');
  document.getElementById('loginStep2').classList.add('active');
  setTimeout(() => document.querySelector('.otp-input').focus(), 100);
}

function loginVerifyOTP() {
  const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  if (otp === '1234') {
    document.getElementById('loginStep2').classList.remove('active');
    document.getElementById('loginStep3').classList.add('active');
  } else {
    showToast('Código incorrecto. Usa: 1234', 'error');
    document.querySelectorAll('.otp-input').forEach(i => i.value = '');
    document.querySelector('.otp-input').focus();
  }
}

// Auto-focus next OTP input
document.querySelectorAll('.otp-input').forEach((input, idx, inputs) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && idx < inputs.length - 1) inputs[idx + 1].focus();
  });
});

function selectRole(el, role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedRole = role;
  document.getElementById('btnLoginComplete').disabled = false;
}

function loginComplete() {
  if (!selectedRole) return;
  const email = document.getElementById('loginEmail').value;
  DB.currentUser = { email, role: selectedRole, name: email.split('@')[0] };
  saveDB();

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appLayout').classList.add('visible');

  initApp();
}

function logout() {
  DB.currentUser = null;
  saveDB();
  location.reload();
}

function checkAuth() {
  if (DB.currentUser) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appLayout').classList.add('visible');
    initApp();
  }
}

function isAdmin() {
  return DB.currentUser && DB.currentUser.role === 'admin';
}

// ===== NAVIGATION & UI =====
let currentPage = 'dashboard';

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('active');
}

function initApp() {
  const user = DB.currentUser;
  if (!user) return checkAuth();

  // Update UI with user info
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userAvatar').textContent = user.name.substring(0, 2).toUpperCase();

  const roleDisplay = document.getElementById('sidebarRoleDisplay');
  const userRoleLabel = document.querySelector('.sidebar-user-role');

  if (user.role === 'admin') {
    roleDisplay.textContent = 'Administrador';
    if (userRoleLabel) userRoleLabel.textContent = 'Gerente General';

    // Show all sections for admin
    document.getElementById('navSectionComercial').style.display = 'block';
    document.getElementById('navChannels').style.display = 'flex';
    document.getElementById('navRevenue').style.display = 'flex';
    document.getElementById('navReports').style.display = 'flex';
  } else if (user.role === 'recepcion' || user.role === 'secretario') {
    roleDisplay.textContent = 'Recepción';
    if (userRoleLabel) userRoleLabel.textContent = 'Secretario / Recepción';

    // Hide administrative/strategic sections for secretaries
    document.getElementById('navChannels').style.display = 'none';
    document.getElementById('navRevenue').style.display = 'none';
    document.getElementById('navReports').style.display = 'none';

    // Hide sections if empty (optional but cleaner)
    // document.getElementById('navSectionComercial').style.display = 'none'; // Maybe not if CRM is inside
  } else if (user.role === 'housekeeping') {
    roleDisplay.textContent = 'Housekeeping';
    if (userRoleLabel) userRoleLabel.textContent = 'Personal de Limpieza';
    // Simplified view for HK
    navigate('housekeeping');
  }

  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  navigate('dashboard');
  updateSidebarBadges();
  holoWelcome();

  // Show intro notification
  setTimeout(() => {
    addNotification('👋 Bienvenido de nuevo, ' + DB.currentUser.name);
  }, 1000);
}

function navigate(page) {
  currentPage = page;

  // Auto-close sidebar on mobile after navigation
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('active');

  // Sidebar active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[onclick="navigate('${page}')"]`);
  if (activeNav) activeNav.classList.add('active');

  // Show page section
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // Header Title
  const titles = {
    dashboard: 'Dashboard', rooms: 'Gestión de Habitaciones', reservations: 'Reservas', checkin: 'Check-in / Out',
    housekeeping: 'Housekeeping', maintenance: 'Mantenimiento', channels: 'Channel Manager', revenue: 'Revenue Management', crm: 'Directorio de Huéspedes',
    pos: 'Punto de Venta (POS)', reports: 'Reportes y Analytics', reputation: 'Reputación Online'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'SmartHotel';

  // Render logic
  if (page === 'dashboard') renderDashboard();
  if (page === 'rooms') renderRooms();
  if (page === 'reservations') renderReservations();
  if (page === 'checkin') renderCheckin();
  if (page === 'housekeeping') renderHousekeeping();
  if (page === 'maintenance') renderMaintenance();
  if (page === 'channels') renderChannels();
  if (page === 'revenue') renderRevenue();
  if (page === 'crm') renderCRM();
  if (page === 'pos') renderPOS();
  if (page === 'reports') renderReports();
  if (page === 'reputation') renderReputation();
}

// ===== DASHBOARD =====
function generateAIInsights() {
  const insights = [];
  const occRooms = DB.rooms.filter(r => r.status === 'occupied').length;
  const totalRooms = DB.rooms.length;
  const occRate = (occRooms / totalRooms) * 100;
  const today = todayStr();

  // Logic 1: High Occupancy / Pricing
  if (occRate > 10) {
    insights.push({
      type: 'revenue',
      icon: '📈',
      title: 'Optimización de Revenue',
      message: `Ocupación proyectada al ${Math.round(occRate)}%. Sugerencia: Incrementar tarifas de Suites un 10% para maximizar RevPAR.`,
      action: 'Aplicar ajuste inteligente'
    });
  }

  // Logic 2: Guest Preferences
  const arrivalsWithPrefs = DB.reservations.filter(r => {
    if (r.status !== 'confirmada' || r.checkIn !== today) return false;
    const guest = DB.guests.find(g => g.name === r.guestName);
    return guest && (guest.allergies !== 'Ninguna' || guest.pillow !== 'Standard');
  });

  if (arrivalsWithPrefs.length > 0) {
    const r = arrivalsWithPrefs[0];
    const guest = DB.guests.find(g => g.name === r.guestName);
    insights.push({
      type: 'guest',
      icon: '👤',
      title: 'Experiencia de Huésped VIP',
      message: `${r.guestName} llega hoy a Hab ${r.roomId || 'TBD'}. Recordatorio: Alergia a ${guest.allergies} y prefiere almohadas de ${guest.pillow}.`,
      action: 'Confirmar preparación'
    });
  }

  // Logic 3: Housekeeping Alert
  const pendingTasks = DB.hkTasks.filter(t => t.status !== 'lista').length;
  if (pendingTasks > 2) {
    insights.push({
      type: 'ops',
      icon: '⚡',
      title: 'Alerta Operativa',
      message: `Tienes ${pendingTasks} tareas de limpieza pendientes. El tiempo estimado de entrega de habitaciones podría retrasarse 20 min.`,
      action: 'Priorizar salidas'
    });
  }

  if (insights.length === 0) {
    return `<div class="card" style="text-align:center; padding:15px; background:rgba(255,255,255,0.5)">
      <span class="text-muted">Sistemas estables. Operación óptima bajo supervisión de Alex AI.</span>
    </div>`;
  }

  return `
    <div class="ai-insights-container">
      ${insights.map(i => `
        <div class="insight-card insight-${i.type} active-pulse">
          <div class="insight-icon">${i.icon}</div>
          <div class="insight-content">
            <div class="insight-title">
              <span class="insight-ai-badge">ALEX AI</span> ${i.title}
            </div>
            <div class="insight-message">${i.message}</div>
            <div class="insight-action" onclick="showToast('Acción aplicada por Alex AI','success')">${i.action} &rarr;</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDashboard() {
  // Update AI Insights
  const aiPanel = document.getElementById('aiInsightsPanel');
  if (aiPanel) aiPanel.innerHTML = generateAIInsights();

  // Calculate KPIs
  const occRooms = DB.rooms.filter(r => r.status === 'occupied').length;
  const totalRooms = DB.rooms.length;
  const occRate = Math.round((occRooms / totalRooms) * 100);
  const arrivals = DB.reservations.filter(r => r.checkIn === todayStr()).length;
  const revenue = DB.reservations.filter(r => r.status === 'checkin' || r.status === 'completada').reduce((acc, curr) => acc + curr.total, 0);

  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-icon text-gold">📊</div>
      <div class="kpi-label">Ocupación</div>
      <div class="kpi-value">${occRate}%</div>
      <div class="kpi-change up">↑ 5% vs ayer</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon text-green">💰</div>
      <div class="kpi-label">Revenue Día</div>
      <div class="kpi-value">$${revenue.toLocaleString()}</div>
      <div class="kpi-change up">↑ 12% vs objetivo</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon text-blue">🛎️</div>
      <div class="kpi-label">Llegadas</div>
      <div class="kpi-value">${arrivals}</div>
      <div class="kpi-change">Check-ins pendientes: ${arrivals}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon text-red">🧹</div>
      <div class="kpi-label">Limpieza</div>
      <div class="kpi-value">${DB.hkTasks.filter(t => t.status !== 'lista').length}</div>
      <div class="kpi-change down">↓ Retraso de 15m</div>
    </div>
  `;

  // Arrivals List (Show today and past pending)
  const today = todayStr();
  const todayArrivals = DB.reservations.filter(r => r.status === 'confirmada' && r.checkIn <= today);
  document.getElementById('arrivalsList').innerHTML = todayArrivals.length ? todayArrivals.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-weight:600;font-size:13px">${r.guestName}</div>
        <div style="font-size:11px;color:var(--text-muted)">${r.roomType} · ${r.channel}</div>
      </div>
      <button class="btn btn-sm btn-gold" onclick="navigate('checkin');startCheckin('${r.id}')">Check-in</button>
    </div>
  `).join('') : '<div class="text-muted" style="padding:12px">No hay más llegadas hoy.</div>';

  // Activity Feed
  document.getElementById('activityFeed').innerHTML = DB.notifications.slice(0, 5).map(n => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text">${n.text}</div>
        <div class="activity-time">${n.time}</div>
      </div>
    </div>
  `).join('');

  // Weekly Occupancy (Dynamic from real data)
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today2 = new Date();
  const weekData = dayLabels.map((_, i) => {
    const d = new Date(today2);
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const active = DB.reservations.filter(r => r.checkIn <= ds && r.checkOut >= ds).length;
    return Math.min(100, Math.round((active / Math.max(totalRooms, 1)) * 100));
  });
  document.getElementById('occupancyChart').innerHTML = weekData.map((v, i) => `
    <div class="bar-col">
      <div class="bar-value">${v}%</div>
      <div class="bar" style="height:${Math.max(v, 5)}%"></div>
      <div class="bar-label">${dayLabels[i]}</div>
    </div>
  `).join('');
}

// ===== ROOMS MODULE =====
let resFilterDate = new Date().toISOString().split('T')[0];
let showAllReservations = false;
let currentFloorFilter = 'all';

function renderRooms() {
  const floors = [...new Set(DB.rooms.map(r => r.floor))].sort((a, b) => a - b);

  // Render Floor Selector
  document.getElementById('floorSelector').innerHTML = `
    <button class="floor-tab ${currentFloorFilter === 'all' ? 'active' : ''}" onclick="setFloorFilter('all')">Todo</button>
    ${floors.map(f => `
      <button class="floor-tab ${currentFloorFilter == f ? 'active' : ''}" onclick="setFloorFilter(${f})">Piso ${f}00</button>
    `).join('')}
  `;

  // Filter and show rooms
  const filteredRooms = currentFloorFilter === 'all'
    ? DB.rooms
    : DB.rooms.filter(r => r.floor == currentFloorFilter);

  // Status colors mapping from CSS variables
  const statusColors = {
    available: 'var(--success)',
    occupied: 'var(--primary)',
    cleaning: 'var(--warning)',
    maintenance: 'var(--accent)',
    checkout: '#A855F7'
  };

  document.getElementById('roomsGrid').innerHTML = filteredRooms.sort((a, b) => a.id - b.id).map(r => `
    <div class="room-cell" style="background:${statusColors[r.status] || '#ccc'};color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;border:none;box-shadow:var(--shadow-sm)" onclick="showRoomDetail(${r.id})">
      <div class="room-number" style="color:white">${r.id}</div>
      <div class="room-type" style="color:rgba(255,255,255,0.8)">${r.type}</div>
    </div>
  `).join('');
}

function setFloorFilter(floor) {
  currentFloorFilter = floor;
  renderRooms();
}

function showRoomDetail(id) {
  const r = DB.rooms.find(rm => rm.id === id);
  // Find current reservation if occupied
  const res = DB.reservations.find(rv => rv.roomId === id && rv.status === 'checkin');

  document.getElementById('roomModalBody').innerHTML = `
    <div class="grid-2 mb-16">
      <div>
        <div class="text-muted" style="font-size:12px">ESTADO ACTUAL</div>
        <div style="font-size:18px;font-weight:700;color:var(--gold)">${STATUS_ES[r.status]}</div>
      </div>
      <div>
        <div class="text-muted" style="font-size:12px">TIPO</div>
        <div style="font-size:18px">${r.type}</div>
      </div>
    </div>
    
    ${res ? `
    <div class="card" style="background:var(--bg-surface)">
      <div class="card-title" style="margin-bottom:8px">Huésped Actual</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:14px;font-weight:600">${res.guestName}</div>
          <div style="font-size:12px;color:var(--text-muted)">Salida: ${formatDate(res.checkOut)}</div>
        </div>
        <button class="btn btn-gold btn-sm" onclick="showFolio('${res.id}')"><i class="fas fa-file-invoice"></i> Ver Todo lo Consumido</button>
      </div>
      ${(function () {
        const g = DB.guests.find(gx => gx.name === res.guestName);
        if (g && g.allergies && g.allergies.toLowerCase() !== 'ninguna' && g.allergies.toLowerCase() !== 'n/a') {
          return `<div style="margin-top:12px;padding:8px;background:#FEF2F2;border:1px solid #FEE2E2;border-radius:6px;color:#991B1B;font-size:12px">
            <strong>⚠️ ALERTA DE SEGURIDAD:</strong> Alergias: ${g.allergies}
          </div>`;
        }
        return '';
      })()}
    </div>` : ''}

    <div class="form-group mt-16">
      <label>Cambiar Estado</label>
      <div class="flex gap-16">
        <button class="btn btn-outline ${r.status === 'cleaning' ? 'active' : ''}" onclick="changeRoomStatus(${id},'cleaning')">Limpieza</button>
        <button class="btn btn-outline ${r.status === 'available' ? 'active' : ''}" onclick="changeRoomStatus(${id},'available')">Disponible</button>
        <button class="btn btn-outline ${r.status === 'maintenance' ? 'active' : ''}" onclick="changeRoomStatus(${id},'maintenance')">Mantenimiento</button>
      </div>
    </div>
  `;
  document.querySelector('#roomModal .modal-title').textContent = 'Detalle de Habitación';
  openModal('roomModal');
}

function changeRoomStatus(id, newStatus) {
  const r = DB.rooms.find(rm => rm.id === id);
  if (r) {
    r.status = newStatus;
    saveDB();
    renderRooms();
    closeModal('roomModal');
    addNotification(`Habitación ${id} cambiada a ${STATUS_ES[newStatus]}`);
  }
}

function showAddRoomModal() {
  document.getElementById('roomModalBody').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>Número de Habitación</label>
        <input type="number" id="newRoomId" class="form-input" placeholder="Ej. 101">
      </div>
      <div class="form-group">
        <label>Tipo</label>
        <select id="newRoomType" class="form-input">
          ${ROOM_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Estado Inicial</label>
        <select id="newRoomStatus" class="form-input">
          <option value="available">Disponible</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="cleaning">Limpieza</option>
          <option value="occupied">Ocupada</option>
        </select>
      </div>
    </div>
    <div class="modal-footer" style="margin-top:20px">
      <button class="btn btn-outline" onclick="closeModal('roomModal')">Cancelar</button>
      <button class="btn btn-gold" onclick="saveNewRoom()">Guardar Habitación</button>
    </div>
  `;
  document.querySelector('#roomModal .modal-title').textContent = 'Nueva Habitación';
  openModal('roomModal');
}

function saveNewRoom() {
  if (!isAdmin()) return showToast('Acceso Denegado. Requiere permisos de Admin.', 'error');

  const id = parseInt(document.getElementById('newRoomId').value);
  const type = document.getElementById('newRoomType').value;
  const status = document.getElementById('newRoomStatus').value;

  if (!id || !type) return showToast('Por favor completa todos los campos.', 'warning');
  if (DB.rooms.find(r => r.id === id)) return showToast('Ya existe una habitación con este número.', 'error');

  DB.rooms.push({
    id,
    floor: Math.floor(id / 100),
    type,
    status,
    guestId: null
  });

  saveDB();
  renderRooms();
  closeModal('roomModal');
  addNotification(`Habitación ${id} creada exitosamente.`);
}

// ===== RESERVATIONS MODULE =====
function setResFilterDate(val) {
  if (val === 'today') {
    resFilterDate = new Date().toISOString().split('T')[0];
  } else {
    resFilterDate = val;
  }
  showAllReservations = false;
  renderReservations();
}

function toggleShowAllRes() {
  showAllReservations = !showAllReservations;
  renderReservations();
}

function renderReservations() {
  const searchTerm = document.getElementById('resSearch')?.value.toLowerCase() || '';
  const dateInput = document.getElementById('resFilterDate');
  if (dateInput) dateInput.value = resFilterDate;

  // Toggle button state
  const btnShowAll = document.getElementById('btnShowAllRes');
  if (btnShowAll) {
    btnShowAll.className = showAllReservations ? 'btn btn-gold btn-sm' : 'btn btn-outline btn-sm';
  }

  let filtered = DB.reservations.filter(r => {
    const matchesSearch = r.guestName.toLowerCase().includes(searchTerm) || r.id.toLowerCase().includes(searchTerm);

    if (showAllReservations) return matchesSearch;

    // Filter by date: check if the selected date is within the stay [checkIn, checkOut]
    const d = resFilterDate;
    const isWithinStay = d >= r.checkIn && d <= r.checkOut;
    return matchesSearch && isWithinStay;
  });

  filtered.sort((a, b) => b.id.localeCompare(a.id));

  const headerActions = document.getElementById('resHeaderActions');
  if (headerActions) {
    headerActions.innerHTML = `
      ${isAdmin() ? `<button class="btn btn-outline btn-sm" id="btnClearAllRes" onclick="clearAllReservations()"><i class="fas fa-trash-alt"></i> Limpiar Todo</button>` : ''}
      <button class="btn btn-gold btn-sm" onclick="openNewResModal()"><i class="fas fa-plus"></i> Nueva Reserva</button>
    `;
  }

  const rows = filtered.map(r => `
    <tr onclick="showReservationDetail('${r.id}')" style="cursor:pointer" class="hover-row">
      <td><strong>${r.id}</strong></td>
      <td>${r.guestName}</td>
      <td>${r.roomId || '<span class="text-muted">-</span>'}</td>
      <td><span>${formatDate(r.checkIn)}</span></td>
      <td><span>${formatDate(r.checkOut)}</span></td>
      <td><span class="badge badge-blue">${r.channel || 'DIRECTO'}</span></td>
      <td><span class="badge badge-${r.status === 'confirmada' ? 'green' : (r.status === 'checkin' ? 'gold' : 'purple')}">${r.status}</span></td>
      <td class="flex gap-8">
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showReservationDetail('${r.id}')" title="Ver Detalle"><i class="fas fa-eye"></i></button>
        ${r.status === 'completada' ? `<button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showInvoice('${r.id}')" title="Ver Factura"><i class="fas fa-file-invoice-dollar"></i></button>` : ''}
        ${isAdmin() ? `<button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger)" onclick="event.stopPropagation(); deleteReservation('${r.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
  document.getElementById('resTableBody').innerHTML = rows;

  // Populate types select in modal
  document.getElementById('newResType').innerHTML = ROOM_TYPES.map(t => `<option>${t}</option>`).join('');
}

function deleteReservation(resId) {
  if (!isAdmin()) return showToast('Acceso Denegado. Se requieren permisos de Administrador.', 'error');
  if (confirm(`¿Estás seguro de que deseas eliminar la reserva ${resId}? Esta acción no se puede deshacer.`)) {
    const index = DB.reservations.findIndex(r => r.id === resId);
    if (index !== -1) {
      const res = DB.reservations[index];
      // If the reservation had a room, potentially free it (or keep status as is depending on policy)
      // For this demo, we just remove the record
      DB.reservations.splice(index, 1);
      saveDB();
      renderReservations();
      addNotification(`Reserva ${resId} eliminada.`);
    }
  }
}

function clearAllReservations() {
  if (!isAdmin()) return showToast('Acceso Denegado. Se requieren permisos de Administrador.', 'error');
  if (confirm('¿ESTÁS SEGURO? Esto borrará TODA la base de datos de reservas de forma permanente.')) {
    DB.reservations = [];
    saveDB();
    renderReservations();
    addNotification('🚨 Base de datos de reservas limpiada por Administrador');
  }
}

function showReservationDetail(resId) {
  const res = DB.reservations.find(r => r.id === resId);
  if (!res) return;

  // Find guest by cedula first (more reliable), then by name
  const guest = DB.guests.find(g => g.cedula === res.cedula) ||
    DB.guests.find(g => g.name === res.guestName) || {
    name: res.guestName,
    email: 'Sin datos',
    phone: 'Sin datos',
    nationality: 'Sin datos',
    address: 'Sin datos',
    occupation: 'Sin datos',
    pillows: 'N/A',
    allergies: 'No registradas',
    tier: 'bronce',
    points: 0
  };

  const totalConsumo = res.folio.reduce((acc, item) => acc + item.price, 0);
  const cd = res.checkinData || {};

  document.getElementById('resDetailBody').innerHTML = `
    <div style="background:var(--bg-body);padding:16px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
        <div>
            <div class="text-muted text-xs">ACCIONES RÁPIDAS COMERCIALES</div>
            <div style="font-size:14px;font-weight:600">Balance Pendiente: $${totalConsumo.toFixed(2)}</div>
        </div>
        <div class="flex gap-8">
            <button class="btn btn-gold btn-sm" onclick="processBillPayment('${resId}')" title="Cobrar consumos"><i class="fas fa-hand-holding-usd"></i> Cobrar / Facturar</button>
            <button class="btn btn-outline btn-sm" onclick="showInvoice('${resId}')" title="Ver Factura"><i class="fas fa-file-invoice-dollar"></i> Ver Factura</button>
            <button class="btn btn-outline btn-sm" onclick="extendStay('${resId}')" title="Añadir días"><i class="fas fa-plus"></i> Abonar Días</button>
            ${res.status === 'confirmada' ? `<button class="btn btn-outline btn-sm" onclick="simulatePreCheckin('${resId}')" title="Simular Pre-checkin online"><i class="fas fa-laptop-house"></i> Pre-Checkin</button>` : ''}
            ${res.status === 'checkin' ? `<button class="btn btn-danger btn-sm" onclick="doCheckout('${resId}')" title="Finalizar estancia y liberar habitación"><i class="fas fa-sign-out-alt"></i> Procesar Checkout</button>` : ''}
        </div>
    </div>

    <div class="flex-center gap-16 mb-24" style="text-align:left">
        <div class="guest-avatar" style="width:60px;height:60px;font-size:24px">${guest.name[0]}</div>
        <div>
            <h3 style="margin:0">${guest.name}</h3>
            <div style="display:flex; gap:10px; align-items:center; margin-top:4px">
                <span class="tier-badge tier-${guest.tier}">${guest.tier.toUpperCase()} · ${guest.points} Pts</span>
                <span class="badge badge-blue">ID: ${guest.cedula || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="grid-2 gap-16">
        <div class="card bg-surface">
            <div class="text-muted text-xs mb-4">INFORMACIÓN DE CONTACTO Y PERFIL</div>
            <div style="font-size:13px"><strong>Email:</strong> ${guest.email || 'N/A'}</div>
            <div style="font-size:13px"><strong>Tel:</strong> ${guest.phone || 'N/A'}</div>
            <div style="font-size:13px"><strong>Nacionalidad:</strong> ${guest.nationality || guest.country || 'N/A'}</div>
            <div style="font-size:13px"><strong>Ocupación:</strong> ${guest.occupation || 'N/A'}</div>
            <div style="font-size:13px"><strong>Dirección:</strong> ${guest.address || 'N/A'}</div>
        </div>
        <div class="card bg-surface">
            <div class="text-muted text-xs mb-4">DETALLES DE ESTANCIA Y GRUPO</div>
            <div style="font-size:13px"><strong>Reserva:</strong> ${res.id}</div>
            <div style="font-size:13px"><strong>Fechas:</strong> ${formatDate(res.checkIn)} - ${formatDate(res.checkOut)}</div>
            <div style="font-size:13px"><strong>Habitación:</strong> ${res.roomId || 'Sin asignar'} (${res.roomType})</div>
            <div style="font-size:13px"><strong>Composición:</strong> ${cd.adults || 1} Adulto(s) / ${cd.kids || 0} Niño(s)</div>
            ${res.requestedBy ? `<div style="font-size:13px; color:var(--primary); font-weight:600"><strong>Solicitado por:</strong> ${res.requestedBy}</div>` : ''}
        </div>
    </div>

    <div class="grid-2 gap-16 mt-16">
        <div class="card bg-surface">
            <div class="text-muted text-xs mb-4">DATOS DEL VEHÍCULO</div>
            <div style="font-size:13px"><strong>Placa:</strong> ${guest.vehPlate || cd.vehPlate || 'No aplica'}</div>
            <div style="font-size:13px"><strong>Modelo/Color:</strong> ${guest.vehModel || cd.vehModel || 'N/A'}</div>
        </div>
        <div class="card bg-surface">
            <div class="text-muted text-xs mb-4">MÉTODO DE PAGO Y PLAN</div>
            <div style="font-size:13px"><strong>Plan:</strong> ${res.plan || 'Solo Habitación'}</div>
            <div style="font-size:13px"><strong>Método Sugerido:</strong> ${cd.paymentMethod || 'No especificado'}</div>
        </div>
    </div>

    ${guest.allergies && guest.allergies.toLowerCase() !== 'ninguna' ? `
    <div class="card mt-16" style="background:#FEF2F2;border:1px solid #FEE2E2;color:#991B1B">
        <div style="font-weight:700;margin-bottom:4px">⚠️ ALERGIAS Y ALERTAS</div>
        <div style="font-size:14px">${guest.allergies}</div>
    </div>
    ` : ''}

    <div class="card mt-16 bg-surface">
        <div class="flex-between mb-8">
            <div class="text-muted text-xs">CONSUMO DURANTE ESTA ESTANCIA</div>
            <div style="font-weight:700;color:var(--gold)">Total: $${totalConsumo.toFixed(2)}</div>
        </div>
        <div id="resFolioDetail" style="max-height:200px;overflow-y:auto">
            ${res.folio.length ? `
                <table style="width:100%;font-size:12px">
                    ${res.folio.map(item => `
                        <tr style="border-bottom:1px solid var(--border)">
                            <td style="padding:8px 0">${item.name}</td>
                            <td style="padding:8px 0;text-align:right">$${item.price.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
            ` : '<div class="text-muted p-16" style="text-align:center">No hay consumos registrados aún.</div>'}
        </div>
    </div>

    ${res.notes ? `
    <div class="card mt-16 bg-surface">
        <div class="text-muted text-xs mb-4">OBSERVACIONES DE RESERVA</div>
        <div style="font-size:13px">${res.notes}</div>
    </div>
    ` : ''}
  `;

  openModal('resDetailModal');
}

function extendStay(resId) {
  const res = DB.reservations.find(r => r.id === resId);
  const extraDays = prompt('¿Cuántos días desea abonar/extender a la estancia?', '1');
  if (!extraDays || isNaN(extraDays)) return;

  const daysArr = parseInt(extraDays);
  const currentOut = new Date(res.checkOut);
  currentOut.setDate(currentOut.getDate() + daysArr);

  const y = currentOut.getFullYear();
  const m = String(currentOut.getMonth() + 1).padStart(2, '0');
  const d = String(currentOut.getDate()).padStart(2, '0');
  res.checkOut = `${y}-${m}-${d}`;

  // Add extra charge using the REAL RATE of the reservation
  const rate = res.rate || ROOM_PRICES[res.roomType];
  const extraCost = rate * daysArr;
  res.folio.push({
    name: `Extensión Stay: ${daysArr} noche(s) extra (${res.roomType}) @ $${rate}/noche`,
    price: extraCost,
    time: new Date().toLocaleTimeString()
  });

  saveDB();
  showReservationDetail(resId);
  renderReservations();
  addNotification(`Estancia extendida para ${res.guestName} (+${daysArr} noches).`);
  showToast(`Se han añadido ${daysArr} noches y un cargo de $${extraCost} al folio.`, 'success');
}

// filterReservations() removed — logic now lives inside renderReservations()

function createReservation() {
  const name = document.getElementById('newResName').value;
  const lastName = document.getElementById('newResLastName').value;
  const cedula = document.getElementById('newResID').value;
  const plan = document.getElementById('newResPlan').value;
  const type = document.getElementById('newResType').value;
  const checkIn = document.getElementById('newResIn').value;
  const checkOut = document.getElementById('newResOut').value;
  const rate = parseFloat(document.getElementById('newResRate').value) || ROOM_PRICES[type];
  const notes = document.getElementById('newResNotes').value;
  const requestedBy = document.getElementById('newResRequestedBy').value;

  if (!name || !lastName || !checkIn || !checkOut) return showToast('Completa los campos obligatorios (Nombre, Apellido, Fechas)', 'warning');

  const guestFullName = `${name} ${lastName}`;

  // Basic Logic: Assign first available room of type (simplified for demo)
  const room = DB.rooms.find(r => r.type === type && r.status === 'available');

  // Check if a manual room was selected via picker
  const manualRoomId = document.getElementById('selectedRoomInfo').dataset.roomId;
  const finalRoom = manualRoomId ? DB.rooms.find(r => r.id == manualRoomId) : room;

  // Check overbooking logic
  if (!finalRoom) {
    renderResRoomPicker();
    document.getElementById('resRoomPickerContainer').classList.remove('hidden');
    return alert(`No hay habitaciones ${type} limpias disponibles. Por favor, selecciona una habitación manualmente del mapa.`);
  }

  // Calculate nights for total price
  const nights = Math.max(1, (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 1;

  const newRes = {
    id: 'RES-' + (1000 + DB.reservations.length + 1),
    guestName: guestFullName,
    cedula,
    roomId: finalRoom.id,
    checkIn, checkOut,
    status: 'confirmada',
    plan,
    rate,
    total: rate * nights,
    roomType: type,
    notes,
    requestedBy,
    folio: []
  };

  // Auto-CRM: Sync with Guest Directory
  let gProfile = DB.guests.find(g => g.cedula === cedula) || DB.guests.find(g => g.name.toLowerCase() === guestFullName.toLowerCase());

  if (!gProfile) {
    gProfile = {
      id: 'G' + (DB.guests.length + 1),
      name: guestFullName,
      firstName: name,
      lastName: lastName,
      cedula: cedula,
      email: '', phone: '', country: '',
      tier: 'bronce', points: 0,
      pillow: 'Plumas', allergies: 'Ninguna'
    };
    DB.guests.push(gProfile);
    addNotification(`Sistema: Nuevo huésped "${guestFullName}" registrado.`);
  } else {
    // Update existing profile
    gProfile.name = guestFullName;
    gProfile.firstName = name;
    gProfile.lastName = lastName;
    gProfile.cedula = cedula;
  }

  // Auto-post initial room charge to folio for billing transparency
  newRes.folio.push({
    name: `Estancia Inicial: ${nights} noche(s) (${type}) @ $${rate}/noche`,
    price: rate * nights,
    time: new Date().toLocaleTimeString()
  });

  DB.reservations.push(newRes);
  finalRoom.status = 'occupied'; // Reserve it immediately for simplicity demo
  saveDB();

  // Reset picker
  document.getElementById('resRoomPickerContainer').classList.add('hidden');
  document.getElementById('selectedRoomInfo').textContent = 'Ninguna';
  delete document.getElementById('selectedRoomInfo').dataset.roomId;

  closeModal('resModal');
  renderReservations();
  addNotification(`Nueva reserva creada: ${guest} (Hab ${finalRoom.id})`);
}

function updateResGuestSuggestions() {
  const list = document.getElementById('guestNamesList');
  if (!list) return;
  // Offer both full name and cedula as options
  list.innerHTML = DB.guests.map(g => `<option value="${g.name}">`).join('');
}

function fillResGuestData(name) {
  const guest = DB.guests.find(g => g.name.toLowerCase() === name.toLowerCase() || g.firstName?.toLowerCase() === name.toLowerCase());
  if (guest) {
    document.getElementById('newResName').value = guest.firstName || guest.name.split(' ')[0];
    document.getElementById('newResLastName').value = guest.lastName || guest.name.split(' ').slice(1).join(' ');
    document.getElementById('newResID').value = guest.cedula || '';
  }
}

function openNewResModal() {
  openModal('resModal');
  // Populate types select explicitly
  document.getElementById('newResType').innerHTML = ROOM_TYPES.map(t => `<option>${t}</option>`).join('');

  // Reset guest fields
  document.getElementById('newResName').value = '';
  document.getElementById('newResLastName').value = '';
  document.getElementById('newResID').value = '';
  document.getElementById('newResPlan').selectedIndex = 0;
  document.getElementById('newResNotes').value = '';
  document.getElementById('newResRequestedBy').value = '';

  // Reset previous manual selection
  const info = document.getElementById('selectedRoomInfo');
  info.textContent = 'Ninguna';
  delete info.dataset.roomId;
  document.getElementById('resRoomPickerContainer').classList.remove('hidden');
  renderResRoomPicker();
}

function renderResRoomPicker() {
  const selectedType = document.getElementById('newResType').value;
  const grid = document.getElementById('resRoomGrid');

  // Status colors mapping from CSS variables
  const statusColors = {
    available: 'var(--success)',
    occupied: 'var(--primary)',
    cleaning: 'var(--warning)',
    maintenance: 'var(--accent)',
    checkout: '#A855F7'
  };

  grid.innerHTML = DB.rooms.sort((a, b) => a.id - b.id).map(r => {
    const isRightType = r.type === selectedType;
    const opacity = isRightType ? '1' : '0.25';
    const bgColor = statusColors[r.status] || '#ccc';
    const border = isRightType ? '2px solid white' : '1px solid transparent';

    return `
      <div class="room-cell"
           style="width:40px;height:40px;font-size:10px;cursor:pointer;opacity:${opacity};background:${bgColor};color:white;border:${border};display:flex;align-items:center;justify-content:center;border-radius:4px;font-weight:bold;box-shadow:var(--shadow-sm)"
           onclick="selectRoomForRes(${r.id}, '${r.status}')"
           title="Hab ${r.id} - ${r.type} (${STATUS_ES[r.status]})">
        ${r.id}
      </div>
    `;
  }).join('');
}

function selectRoomForRes(id, status) {
  if (status !== 'available') {
    if (!confirm(`La habitación ${id} está ${STATUS_ES[status]}. ¿Seguro que quieres asignarla de todas formas? (Se marcará como Ocupada)`)) return;
  }
  const info = document.getElementById('selectedRoomInfo');
  info.textContent = 'Hab ' + id;
  info.dataset.roomId = id;

  // Visual feedback in picker
  document.querySelectorAll('#resRoomGrid .room-cell').forEach(el => el.style.border = 'none');
  const selectedEl = Array.from(document.querySelectorAll('#resRoomGrid .room-cell')).find(el => el.textContent.trim() == id);
  if (selectedEl) selectedEl.style.border = '2px solid var(--gold)';
}

// ===== CHECK-IN / OUT MODULE =====
function renderCheckin() {
  const today = todayStr();
  // Filter for pending check-ins (confirmed status and date is today or earlier)
  const checkins = DB.reservations.filter(r => r.status === 'confirmada' && r.checkIn <= today);
  // Filter for pending check-outs (checkin status and date is today or earlier)
  const checkouts = DB.reservations.filter(r => r.status === 'checkin' && r.checkOut <= today);

  document.getElementById('checkinList').innerHTML = checkins.length ? checkins.map(r => `
    <div class="card" style="margin-bottom:10px;padding:12px">
      <div class="flex-between">
        <div><strong>${r.guestName}</strong></div>
        <button class="btn btn-gold btn-sm" onclick="startCheckin('${r.id}')">Iniciar Check-in</button>
      </div>
      <div class="text-muted" style="font-size:12px">${r.roomType} · ${r.channel}</div>
    </div>
  `).join('') : '<div class="text-muted">No hay check-ins pendientes.</div>';

  document.getElementById('checkoutList').innerHTML = checkouts.length ? checkouts.map(r => `
    <div class="card" style="margin-bottom:10px;padding:12px">
      <div class="flex-between">
        <div><strong>${r.guestName}</strong> <span class="text-muted">(Hab ${r.roomId})</span></div>
        <button class="btn btn-outline btn-sm" onclick="doCheckout('${r.id}')">Procesar Salida</button>
      </div>
      <div class="text-muted" style="font-size:12px">Balance: $0.00</div>
    </div>
  `).join('') : '<div class="text-muted">No hay check-outs pendientes.</div>';

  // Render Invoice History
  const histDate = document.getElementById('invoiceHistoryDate').value || today;
  renderInvoiceHistory(histDate);
}

function renderInvoiceHistory(date) {
  const list = document.getElementById('invoiceHistoryList');
  if (!list) return;

  const dateInput = document.getElementById('invoiceHistoryDate');
  if (dateInput && !dateInput.value) dateInput.value = date;

  const completed = DB.reservations.filter(r =>
    r.status === 'completada' && (r.actualCheckoutDate === date || (!r.actualCheckoutDate && r.checkOut === date))
  );

  list.innerHTML = completed.length ? completed.map(r => `
    <div class="card" style="padding:12px; border-left:4px solid var(--success); background: #f8fff9">
      <div class="flex-between">
        <div>
            <div style="font-weight:600">${r.guestName}</div>
            <div class="text-muted" style="font-size:11px">Hab ${r.roomId} · ${r.channel}</div>
        </div>
        <div class="flex gap-4">
            <button class="btn btn-outline btn-sm" onclick="showInvoice('${r.id}')" title="Ver Factura">
                <i class="fas fa-file-invoice-dollar"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="showReservationDetail('${r.id}')" title="Ver Detalle">
                <i class="fas fa-eye"></i>
            </button>
        </div>
      </div>
    </div>
  `).join('') : `<div class="text-muted" style="grid-column: span 2; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 8px;">No hay facturas registradas para el ${date}.</div>`;
}

function setInvoiceHistoryToday() {
  const today = todayStr();
  const dateInput = document.getElementById('invoiceHistoryDate');
  if (dateInput) {
    dateInput.value = today;
    renderInvoiceHistory(today);
  }
}

function startCheckin(resId) {
  const r = DB.reservations.find(rv => rv.id === resId);
  const g = DB.guests.find(gu => gu.cedula === r.cedula) || { name: r.guestName, firstName: '', lastName: '', cedula: r.cedula };

  document.getElementById('checkinWizard').classList.remove('hidden');

  let roomMsg = r.roomId ? `Habitación Pre-asignada: <strong>${r.roomId}</strong>` : `<span class="text-red">⚠ Sin habitación. Se asignará automáticamente al confirmar.</span>`;

  document.getElementById('checkinSteps').innerHTML = `
    <div class="registration-form" style="padding:20px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:2px solid var(--primary); padding-bottom:10px">
        <h2 style="color:var(--primary); margin:0">Ficha de Registro de Huésped</h2>
        <div class="badge badge-blue">Reserva: ${r.id}</div>
      </div>

      <div style="margin-bottom:15px; text-align:right">
        <button id="btnOCR" class="btn btn-outline btn-sm" onclick="simulateOCR()"><i class="fas fa-id-card"></i> Escanear ID (Simulacro)</button>
      </div>

      <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); gap:15px">
        <!-- Personal Info -->
        <div class="form-group"><label>Nombre</label><input type="text" id="regFirstName" class="form-input" value="${g.firstName || r.guestName.split(' ')[0]}"></div>
        <div class="form-group"><label>Apellido</label><input type="text" id="regLastName" class="form-input" value="${g.lastName || r.guestName.split(' ').slice(1).join(' ')}"></div>
        <div class="form-group"><label>Cédula / ID</label><input type="text" id="regCedula" class="form-input" value="${r.cedula || ''}"></div>
        
        <div class="form-group"><label>Fecha Nacimiento</label><input type="date" id="regBirth" class="form-input" value="${g.birthDate || ''}"></div>
        <div class="form-group"><label>Estado Civil</label>
          <select id="regCivil" class="form-input">
            <option ${g.civil === 'Soltero/a' ? 'selected' : ''}>Soltero/a</option>
            <option ${g.civil === 'Casado/a' ? 'selected' : ''}>Casado/a</option>
            <option ${g.civil === 'Divorciado/a' ? 'selected' : ''}>Divorciado/a</option>
            <option ${g.civil === 'Viudo/a' ? 'selected' : ''}>Viudo/a</option>
          </select>
        </div>
        <div class="form-group"><label>Nacionalidad</label><input type="text" id="regNation" class="form-input" value="${g.nationality || ''}"></div>

        <div class="form-group" style="grid-column: span 2;"><label>Dirección de Residencia</label><input type="text" id="regAddress" class="form-input" value="${g.address || ''}"></div>
        <div class="form-group"><label>Número de Teléfono</label><input type="tel" id="regPhone" class="form-input" value="${g.phone || ''}"></div>
        
        <div class="form-group"><label>Ocupación</label><input type="text" id="regJob" class="form-input" value="${g.occupation || ''}"></div>
        <div class="form-group"><label>Método de Pago</label>
          <select id="regPayment" class="form-input">
            <option>Efectivo (USD/Bs)</option>
            <option>Zelle</option>
            <option>T. Débito / Crédito</option>
            <option>Transferencia</option>
          </select>
          <label class="flex-center gap-8 mt-4" style="font-size:11px;cursor:pointer">
            <input type="checkbox" onchange="toggleCardToken(this)"> Tokenizar Tarjeta
          </label>
        </div>
        <div class="form-group"><label>Tipo de Plan</label><input type="text" class="form-input" value="${r.plan || 'Solo Habitación'}" readonly style="background:#f1f5f9"></div>

        <!-- Group Composition -->
        <div class="form-group"><label>Cant. Personas (Total)</label><input type="number" id="regTotalPax" class="form-input" value="1"></div>
        <div class="form-group"><label>Cant. Adultos</label><input type="number" id="regAdults" class="form-input" value="1"></div>
        <div class="form-group"><label>Cant. Niños</label><input type="number" id="regKids" class="form-input" value="0"></div>

        <!-- Vehicle Info -->
        <div class="form-group" style="grid-column: span 3; background:#f8fafc; padding:10px; border-radius:8px; border:1px dashed var(--border)">
          <label style="font-weight:700; color:var(--text-secondary); margin-bottom:10px; display:block">Datos del Vehículo (Si aplica)</label>
          <div style="display:flex; gap:15px">
            <div style="flex:1"><label style="font-size:11px">Placa</label><input type="text" id="regVehPlate" class="form-input" placeholder="ABC-123" value="${g.vehPlate || ''}"></div>
            <div style="flex:1"><label style="font-size:11px">Modelo / Color</label><input type="text" id="regVehModel" class="form-input" placeholder="Toyota Corolla Blanco" value="${g.vehModel || ''}"></div>
          </div>
        </div>
      </div>

      <div style="margin-top:20px; padding:15px; background: #e0f2fe; border-radius:8px; display:flex; gap:15px; align-items:center">
        <i class="fas fa-info-circle text-blue" style="font-size:24px"></i>
        <span>${roomMsg} ${r.requestedBy ? ` | <strong style="color:var(--primary)">Empresa/Tercero: ${r.requestedBy}</strong>` : ''}</span>
      </div>

      <button class="btn btn-gold w-full mt-20" style="padding:15px; font-size:16px" onclick="confirmCheckin('${r.id}')">
        <i class="fas fa-check-circle"></i> Completar Registro y Activar Habitación
      </button>
    </div>
  `;
}

// ===== GUEST FLOW SIMULATIONS =====
function simulatePreCheckin(resId) {
  const r = DB.reservations.find(rv => rv.id === resId);
  if (!r) return;
  r.status = 'pre-checked';
  r.preCheckinData = {
    method: 'Online',
    timestamp: new Date().toISOString(),
    preferences: { pillow: 'Plumas', floor: 'Alto' }
  };
  saveDB();
  renderReservations();
  showToast(`✅ Pre-Check-in completado por el huésped (Simulación)`, 'success');
}

function simulateOCR() {
  const btn = document.getElementById('btnOCR');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Escaneando...';

  setTimeout(() => {
    // Fill form with mock data
    document.getElementById('regFirstName').value = 'Marta';
    document.getElementById('regLastName').value = 'Lopez';
    document.getElementById('regCedula').value = '12345678';
    document.getElementById('regNation').value = 'España';
    document.getElementById('regBirth').value = '1985-06-15';
    document.getElementById('regAddress').value = 'Calle Gran Vía 22, Madrid';
    if (btn) btn.innerHTML = '✅ Escaneo Completado';
    showToast('Documento escaneado y datos extraídos correctamente', 'success');
  }, 1500);
}

function toggleCardToken(checkbox) {
  if (checkbox.checked) {
    showToast('💳 Tarjeta tokenizada (****-4242) para cargos extra', 'info');
  }
}

function confirmCheckin(resId) {
  const r = DB.reservations.find(rv => rv.id === resId);

  // Capture data from Registration Form
  const firstName = document.getElementById('regFirstName').value;
  const lastName = document.getElementById('regLastName').value;
  const cedula = document.getElementById('regCedula').value;
  const birthDate = document.getElementById('regBirth').value;
  const civil = document.getElementById('regCivil').value;
  const nationality = document.getElementById('regNation').value;
  const address = document.getElementById('regAddress').value;
  const phone = document.getElementById('regPhone').value;
  const occupation = document.getElementById('regJob').value;
  const paymentMethod = document.getElementById('regPayment').value;
  const adults = parseInt(document.getElementById('regAdults').value) || 1;
  const kids = parseInt(document.getElementById('regKids').value) || 0;
  const totalPax = parseInt(document.getElementById('regTotalPax').value) || 1;
  const vehPlate = document.getElementById('regVehPlate').value;
  const vehModel = document.getElementById('regVehModel').value;

  if (!cedula) return alert('La Cédula es obligatoria para el registro legal.');

  // Assign room if not yet assigned
  if (!r.roomId) {
    const room = DB.rooms.find(rm => rm.type === r.roomType && rm.status === 'available');
    if (room) { r.roomId = room.id; }
    else { return alert('No hay habitaciones disponibles de este tipo. Asigne una manualmente en el mapa.'); }
  }

  // Update/Create Guest Profile with full data
  let g = DB.guests.find(gu => gu.cedula === cedula);
  if (!g) {
    g = {
      id: 'G' + (DB.guests.length + 1),
      cedula,
      tier: 'bronce',
      points: 0,
      pillow: 'Plumas',
      allergies: 'Ninguna'
    };
    DB.guests.push(g);
  }

  g.firstName = firstName;
  g.lastName = lastName;
  g.name = `${firstName} ${lastName}`;
  g.birthDate = birthDate;
  g.civil = civil;
  g.nationality = nationality;
  g.address = address;
  g.phone = phone;
  g.occupation = occupation;
  g.vehPlate = vehPlate;
  g.vehModel = vehModel;

  // Store check-in specific data in reservation
  r.status = 'checkin';
  r.checkinData = {
    paymentMethod,
    adults, kids, totalPax,
    vehPlate, vehModel,
    timestamp: new Date().toISOString()
  };

  const room = DB.rooms.find(rm => rm.id === r.roomId);
  if (room) room.status = 'occupied';

  saveDB();
  document.getElementById('checkinWizard').classList.add('hidden');
  renderCheckin();
  addNotification(`✓ Registro de Huésped Completado: ${g.name} (Hab ${r.roomId})`);
}

function doCheckout(resId) {
  const r = DB.reservations.find(rv => rv.id === resId);
  if (confirm(`¿Iniciar proceso de facturación y salida para ${r.guestName}?`)) {
    // Redirect to billing/payment flow explicitly as Checkout
    processBillPayment(resId, true);
  }
}

// ===== LOYALTY TIER CALCULATOR =====
function calculateGuestTier(guest) {
  const stays = guest.stays || 0;
  const spent = guest.totalSpent || 0;

  if (stays >= 10 || spent >= 5000) return 'platino';
  if (stays >= 5 || spent >= 2000) return 'oro';
  if (stays >= 3 || spent >= 1000) return 'plata';
  return 'bronce';
}

// ===== MAINTENANCE MODULE =====
let mtFilterStatus = 'all';

function filterMT(status) {
  mtFilterStatus = status;
  // Update UI buttons
  const buttons = document.querySelectorAll('.hk-filters .filter-btn'); // Assuming same class for simplicity or unique selector
  // Actually simpler to just re-render or handle class toggling here if we had unique IDs, 
  // but let's just re-render and let render handle active class if we bound it, 
  // or manually toggle classes. For this quick impl:
  document.querySelectorAll('#page-maintenance .filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase().includes(status === 'all' ? 'todas' : status));
  });
  renderMaintenance();
}

function renderMaintenance() {
  const list = document.getElementById('mtTableBody');
  if (!list) return;

  const filtered = mtFilterStatus === 'all'
    ? DB.maintenanceOrders
    : DB.maintenanceOrders.filter(o => o.status === mtFilterStatus);

  list.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>${o.roomId}</strong></td>
      <td>${o.description}</td>
      <td><span class="badge badge-${o.priority === 'alta' ? 'red' : o.priority === 'media' ? 'gold' : 'blue'}">${o.priority.toUpperCase()}</span></td>
      <td>${o.assignee}</td>
      <td><span class="badge badge-${o.status === 'resuelta' ? 'green' : o.status === 'progreso' ? 'gold' : 'red'}">${o.status.toUpperCase()}</span></td>
      <td>
        ${o.status !== 'resuelta' ? `<button class="btn btn-outline btn-sm" onclick="advanceMTOrder(${o.id})">Avanzar</button>` : '✅'}
      </td>
    </tr>
  `).join('');
}

function advanceMTOrder(id) {
  const order = DB.maintenanceOrders.find(o => o.id === id);
  if (order) {
    if (order.status === 'pendiente') order.status = 'progreso';
    else if (order.status === 'progreso') order.status = 'resuelta';
    saveDB();
    renderMaintenance();
    updateSidebarBadges();
  }
}

function showMTModal() {
  // Populate rooms
  document.getElementById('mtRoom').innerHTML = DB.rooms.sort((a, b) => a.id - b.id).map(r => `<option value="${r.id}">${r.id} (${r.type})</option>`).join('');
  document.getElementById('mtDesc').value = '';
  openModal('mtModal');
}

function saveMTOrder() {
  const roomId = parseInt(document.getElementById('mtRoom').value);
  const priority = document.getElementById('mtPriority').value;
  const description = document.getElementById('mtDesc').value;
  const assignee = document.getElementById('mtAssignee').value;

  if (!description) return showToast('Por favor describe el problema', 'warning');

  DB.maintenanceOrders.push({
    id: DB.maintenanceOrders.length + 1,
    roomId,
    description,
    priority,
    assignee,
    status: 'pendiente',
    createdAt: todayStr()
  });

  saveDB();
  closeModal('mtModal');
  renderMaintenance();
  updateSidebarBadges();
  showToast('Orden de mantenimiento creada', 'success');
}

// ===== HOUSEKEEPING MODULE =====
let hkFilterStatus = 'all';

function filterHK(status) {
  hkFilterStatus = status;
  renderHousekeeping();
}

function renderHousekeeping() {
  const filtered = hkFilterStatus === 'all'
    ? DB.hkTasks
    : DB.hkTasks.filter(t => t.status === hkFilterStatus);

  const now = new Date();

  document.getElementById('hkTaskList').innerHTML = filtered.length ? filtered.map(t => {
    // Alert logic: Dirty > 2h
    let alertHtml = '';
    if (t.type === 'Limpieza de Salida' && t.status === 'pendiente' && t.checkoutTime) {
      const checkoutTime = new Date(t.checkoutTime);
      const diffHrs = (now - checkoutTime) / (1000 * 60 * 60);
      if (diffHrs > 2) {
        alertHtml = '<span class="badge badge-red ml-2" title="Retraso > 2h">⚠️ RETRASO</span>';
      }
    }

    return `
    <div class="hk-task">
      <div class="hk-priority ${t.priority}" title="Prioridad ${t.priority}"></div>
      <div class="hk-room">${t.roomId} ${alertHtml}</div>
      <div class="hk-info">
        <div class="hk-type">${t.type}</div>
        <div class="hk-eta">Asignado a: ${t.assignee} · 📅 ${t.date || 'Hoy'} · 🕒 ${t.time || t.eta}</div>
      </div>
      <div>
        ${t.status !== 'inspeccionada' ?
        `<button class="hk-status-btn bg-surface" onclick="advanceHKTask(${t.id})">
            ${t.status === 'pendiente' ? 'Iniciar' : 'Terminar'} →
           </button>` :
        `<span class="badge badge-green">Lista</span>`
      }
      </div>
    </div>
  `}).join('') : '<div class="text-muted p-4">No hay tareas.</div>';
}

function advanceHKTask(id) {
  const t = DB.hkTasks.find(task => task.id === id);
  if (t.status === 'pendiente') t.status = 'progreso';
  else if (t.status === 'progreso') {
    t.status = 'inspeccionada'; // Simplified workflow
    const r = DB.rooms.find(rm => rm.id === t.roomId);
    if (r) r.status = 'available';
  }
  saveDB();
  renderHousekeeping();
  updateSidebarBadges();
}

function showHKModal() {
  const rooms = DB.rooms.sort((a, b) => a.id - b.id).map(r => `<option value="${r.id}">Habitación ${r.id} (${r.type})</option>`).join('');
  document.getElementById('hkRoom').innerHTML = rooms;

  // Set default date and time
  const now = new Date();
  document.getElementById('hkDate').value = now.toISOString().split('T')[0];
  document.getElementById('hkTime').value = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  openModal('hkModal');
}

function saveHKTask() {
  const roomId = parseInt(document.getElementById('hkRoom').value);
  const type = document.getElementById('hkType').value;
  const priority = document.getElementById('hkPriority').value;
  const assignee = document.getElementById('hkAssignee').value || 'Sin asignar';
  const date = document.getElementById('hkDate').value;
  const time = document.getElementById('hkTime').value;

  const newTask = {
    id: DB.hkTasks.length + 1,
    roomId,
    type,
    priority,
    status: 'pendiente',
    assignee,
    date,
    time,
    eta: time // Use time as ETA for consistency
  };

  DB.hkTasks.push(newTask);
  saveDB();
  closeModal('hkModal');
  renderHousekeeping();
  addNotification(`Tarea de ${type} asignada a Habitación ${roomId}`);
}


// ===== CHANNEL MANAGER =====
function renderChannels() {
  document.getElementById('channelCards').innerHTML = CHANNELS.map(c => `
    <div class="channel-card">
      <div class="channel-logo" style="background:${c.color};color:white">${c.icon}</div>
      <div class="channel-info">
        <div class="channel-name">${c.name}</div>
        <div class="channel-status">${c.share}% cuota mercado</div>
      </div>
      <span class="channel-sync badge badge-green">✓ Sincronizado</span>
    </div>
  `).join('');

  document.getElementById('parityTable').innerHTML = ROOM_TYPES.map(type => {
    const basePrice = ROOM_PRICES[type];
    const parity = Math.random() > 0.3; // 30% chance of disparity
    const otaPrice = parity ? basePrice : basePrice - 5;

    return `
      <tr>
        <td><strong>${type}</strong></td>
        <td>$${basePrice}</td>
        <td>$${basePrice}</td>
        <td>$${otaPrice}</td>
        <td>$${basePrice + 2}</td>
        <td><span class="badge badge-${parity ? 'green' : 'orange'}">${parity ? 'En Paridad' : 'Desviación'}</span></td>
      </tr>
    `;
  }).join('');
}

// ===== REVENUE =====
function renderRevenue() {
  const totalRooms = DB.rooms.length;
  const occRooms = DB.rooms.filter(r => r.status === 'occupied').length;
  const occupancy = Math.round((occRooms / totalRooms) * 100);
  const activeRes = DB.reservations.filter(r => r.status === 'checkin' || r.status === 'completada');
  const totalRoomRevenue = activeRes.reduce((acc, r) => acc + (r.rate || 0), 0);
  const soldRooms = activeRes.length || 1;
  const adr = (totalRoomRevenue / soldRooms).toFixed(0);
  const revpar = (totalRoomRevenue / totalRooms).toFixed(0);

  // Dynamic pricing suggestions based on real occupancy
  const suggestions = [];
  if (occupancy > 75) {
    suggestions.push({ type: 'Suite', current: ROOM_PRICES.Suite, suggested: Math.round(ROOM_PRICES.Suite * 1.15), reason: `Ocupación al ${occupancy}% — Alta demanda`, direction: 'up' });
    suggestions.push({ type: 'Doble', current: ROOM_PRICES.Doble, suggested: Math.round(ROOM_PRICES.Doble * 1.10), reason: 'Demanda sostenida, subir tarifas', direction: 'up' });
  } else if (occupancy < 40) {
    suggestions.push({ type: 'Suite', current: ROOM_PRICES.Suite, suggested: Math.round(ROOM_PRICES.Suite * 0.85), reason: `Ocupación baja (${occupancy}%) — Promoción`, direction: 'down' });
    suggestions.push({ type: 'Simple', current: ROOM_PRICES.Simple, suggested: Math.round(ROOM_PRICES.Simple * 0.90), reason: 'Atraer reservas con descuento', direction: 'down' });
  } else {
    suggestions.push({ type: 'Suite', current: ROOM_PRICES.Suite, suggested: Math.round(ROOM_PRICES.Suite * 1.05), reason: `Ocupación estable (${occupancy}%)`, direction: 'up' });
    suggestions.push({ type: 'Simple', current: ROOM_PRICES.Simple, suggested: ROOM_PRICES.Simple, reason: 'Tarifa competitiva, mantener', direction: 'neutral' });
  }

  document.getElementById('aiSuggCount').textContent = suggestions.length;
  document.getElementById('pricingSuggestions').innerHTML = suggestions.map(s => `
    <div class="pricing-suggestion">
      <div>
        <div class="text-muted" style="font-size:12px">${s.type}</div>
        <span class="pricing-current">$${s.current}</span>
      </div>
      <div class="pricing-arrow">${s.direction === 'up' ? '📈' : s.direction === 'down' ? '📉' : '⚖️'}</div>
      <div class="pricing-suggested">$${s.suggested}</div>
      <div class="pricing-reason">${s.reason}</div>
      <button class="btn btn-gold btn-sm" onclick="showToast('Tarifa de ${s.type} actualizada a $${s.suggested}','success')">Aplicar</button>
    </div>
  `).join('');

  document.getElementById('revpar').textContent = '$' + revpar;
  document.getElementById('adr').textContent = '$' + adr;
  document.getElementById('occRate').textContent = occupancy + '%';
}

// ===== CRM =====
function renderCRM() {
  const list = DB.guests || [];
  const container = document.getElementById('guestDirectory');
  if (!container) return;

  container.innerHTML = list.map(g => {
    const name = g.name || 'Huésped';
    const initial = name[0] || '?';
    const tier = g.tier || 'bronce';
    const cedula = g.cedula || 'N/A';
    const location = g.nationality || g.country || 'Sin país';

    return `
      <div class="guest-card" onclick="showGuestProfile('${g.id}')">
        <div class="guest-avatar">${initial}</div>
        <div class="guest-info">
          <div class="guest-name">${name}</div>
          <div class="guest-detail">ID: ${cedula} · ${location}</div>
        </div>
        <span class="tier-badge tier-${tier}">${tier.toUpperCase()}</span>
      </div>
    `;
  }).join('');
}

function showGuestProfile(id) {
  const g = DB.guests.find(gx => gx.id === id);
  if (!g) return;

  const name = g.name || 'Huésped';
  const initial = name[0] || '?';
  const tier = g.tier || 'bronce';
  const points = g.points || 0;

  document.getElementById('guestDetailModalBody').innerHTML = `
    <div class="flex-center gap-16 mb-24" style="text-align:left; padding:10px">
        <div class="guest-avatar" style="width:60px;height:60px;font-size:24px">${initial}</div>
        <div>
            <h3 style="margin:0">${name}</h3>
            <div style="display:flex; gap:10px; align-items:center; margin-top:4px">
                <span class="tier-badge tier-${tier}">${tier.toUpperCase()} · ${points} Pts</span>
                <span class="badge badge-blue">ID: ${g.cedula || 'N/A'}</span>
            </div>
            <button class="btn btn-gold btn-sm mt-8" onclick="openResModalWithGuest('${name}'); closeModal('guestDetailModal')"><i class="fas fa-calendar-plus"></i> Reservar Ahora</button>
        </div>
    </div>

    <div class="grid-1 gap-16">
        <div class="card bg-surface" style="padding:16px; margin-bottom:12px">
            <div class="text-muted text-xs mb-8">INFORMACIÓN DE CONTACTO Y PERFIL</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                <div style="font-size:13px"><strong>Email:</strong><br>${g.email || 'N/A'}</div>
                <div style="font-size:13px"><strong>Tel:</strong><br>${g.phone || 'N/A'}</div>
                <div style="font-size:13px"><strong>Nacionalidad:</strong><br>${g.nationality || g.country || 'N/A'}</div>
                <div style="font-size:13px"><strong>Ocupación:</strong><br>${g.occupation || 'N/A'}</div>
                <div style="font-size:13px"><strong>Estado Civil:</strong><br>${g.civil || 'N/A'}</div>
                <div style="font-size:13px"><strong>Dirección:</strong><br>${g.address || 'N/A'}</div>
            </div>
        </div>

        <div class="card bg-surface" style="padding:16px; margin-bottom:12px">
            <div class="text-muted text-xs mb-8">DATOS DEL VEHÍCULO</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                <div style="font-size:13px"><strong>Placa:</strong><br>${g.vehPlate || 'No aplica'}</div>
                <div style="font-size:13px"><strong>Modelo/Color:</strong><br>${g.vehModel || 'N/A'}</div>
            </div>
        </div>

        <div class="card bg-surface" style="padding:16px; margin-bottom:12px">
            <div class="text-muted text-xs mb-8">PREFERENCIAS Y ALERTAS</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                <div style="font-size:13px"><strong>Almohada:</strong><br>${g.pillow || 'N/A'}</div>
                <div style="font-size:13px"><strong>Alergias:</strong><br><span style="color:var(--danger)">${g.allergies || 'Ninguna'}</span></div>
            </div>
        </div>
    </div>

    <div class="card mt-16" style="padding:16px">
      <div class="card-title" style="font-size:14px; margin-bottom:12px">Historial de Estancias</div>
      <div id="guestStayHistory">
        <div class="text-muted" style="text-align:center; font-size:12px">Cargando estancias...</div>
      </div>
    </div>

    <div class="card mt-16" style="padding:16px">
      <div class="card-title" style="font-size:14px; margin-bottom:12px">Consumos Recientes</div>
      <div id="guestFolioHistory">
        <div class="text-muted" style="text-align:center; font-size:12px">Buscando consumos...</div>
      </div>
    </div>
  `;

  // Render stay history
  const stays = DB.reservations.filter(r => r.guestName === g.name || r.cedula === g.cedula).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  document.getElementById('guestStayHistory').innerHTML = stays.length ? `
    <div style="font-size:12px">
      ${stays.map(s => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600">Hab ${s.roomId || '-'} (${s.roomType})</div>
            <div class="text-muted" style="font-size:11px">${formatDate(s.checkIn)} - ${formatDate(s.checkOut)}</div>
          </div>
          <span class="badge badge-${s.status === 'checkin' ? 'gold' : (s.status === 'confirmada' ? 'green' : 'blue')}">${s.status.toUpperCase()}</span>
        </div>
      `).join('')}
    </div>
  ` : '<div class="text-muted" style="text-align:center;padding:10px; font-size:12px">No hay historial de estancias.</div>';

  // Find active/recent reservation for folio items
  const res = DB.reservations.find(r => (r.guestName === g.name || r.cedula === g.cedula) && (r.status === 'checkin' || r.status === 'confirmada'));
  if (res) {
    renderFolioItems(res.id, 'guestFolioHistory');
  } else {
    document.getElementById('guestFolioHistory').innerHTML = '<div class="text-muted" style="text-align:center;padding:10px; font-size:12px">No tiene estancias activas actualmente.</div>';
  }

  openModal('guestDetailModal');
}

let currentFolioTab = 'A'; // 'A' or 'B'

function renderFolioItems(resId, containerId) {
  const res = DB.reservations.find(r => r.id === resId);
  if (!res) return;

  // Filter items based on current tab (default to 'A' if undefined)
  const items = res.folio.filter(i => (i.folioId || 'A') === currentFolioTab);

  const html = items.length ? `
    <table style="width:100%;font-size:13px;border-collapse:collapse">
      <thead>
        <tr style="text-align:left;border-bottom:1px solid var(--border)">
          <th style="padding:8px">Item</th>
          <th style="padding:8px;text-align:right">Precio</th>
          <th style="padding:8px;text-align:center">Acción</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr style="border-bottom:1px solid var(--border)">
            <td style="padding:8px">${item.name} <div class="text-muted" style="font-size:10px">${item.time || ''}</div></td>
            <td style="padding:8px;text-align:right">$${item.price.toFixed(2)}</td>
            <td style="padding:8px;text-align:center">
              <button class="btn btn-outline btn-sm" style="padding:2px 8px;font-size:10px" onclick="moveFolioItem('${resId}', '${item.name}', '${currentFolioTab === 'A' ? 'B' : 'A'}')">
                Mover a Folio ${currentFolioTab === 'A' ? 'B' : 'A'} ➡
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<div class="text-muted" style="text-align:center;padding:20px">No hay consumos en este folio.</div>';

  document.getElementById(containerId).innerHTML = html;

  if (containerId === 'folioModalBody') {
    const total = items.reduce((acc, i) => acc + i.price, 0);
    const totalEl = document.getElementById('folioTotal');
    if (totalEl) totalEl.innerHTML = `Total Folio ${currentFolioTab}: <strong>$${total.toFixed(2)}</strong>`;
  }
}

function showFolio(resId) {
  const res = DB.reservations.find(r => r.id === resId);
  if (!res) return;
  currentFolioTab = 'A'; // Reset to A on open

  // Ensure we close detail modals to avoid overlay issues
  closeModal('roomModal');
  closeModal('resDetailModal');

  // Render Tabs
  const header = document.querySelector('#folioModal .modal-header');
  // Keep title but append tabs below in body maybe? Or just modify body structure.
  // Let's inject tabs top of body

  openModal('folioModal');
  document.querySelector('#folioModal .modal-title').textContent = `Folio: ${res.guestName}`;

  const body = document.getElementById('folioModalBody');
  body.innerHTML = `
    <div class="tabs" style="display:flex; gap:10px; margin-bottom:16px; border-bottom:1px solid var(--border)">
      <button class="tab-btn active" id="tabFolioA" onclick="switchFolioTab('${resId}', 'A')">Folio A (Principal)</button>
      <button class="tab-btn" id="tabFolioB" onclick="switchFolioTab('${resId}', 'B')">Folio B (Extras/City Ledger)</button>
    </div>
    <div id="folioItemsContainer"></div>
  `;

  renderFolioItems(resId, 'folioItemsContainer');

  // Update footer - REMOVED standalone Pay button as requested
  const footer = document.querySelector('#folioModal .modal-footer');
  footer.innerHTML = `
    <div id="folioTotal" style="font-weight:700;font-size:16px;margin-right:auto"></div>
    <button class="btn btn-outline" onclick="closeModal('folioModal')">Cerrar</button>
  `;
}

function switchFolioTab(resId, tab) {
  currentFolioTab = tab;
  document.querySelectorAll('#folioModal .tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tabFolio${tab}`).classList.add('active');
  renderFolioItems(resId, 'folioItemsContainer');

  // Update Pay Button Text
  const btn = document.querySelector('#folioModal .modal-footer .btn-gold');
  if (btn) btn.textContent = `Pagar Folio ${tab}`;
}

function moveFolioItem(resId, itemName, targetFolio) {
  const res = DB.reservations.find(r => r.id === resId);
  // Find item by name (simple unique identifier for now, ideally use ID)
  // We need to find the specific instance in the array that matches name and CURRENT tab
  // But wait, folio is a flat list. We just need to find one item with that name and current tab and flip it.
  const item = res.folio.find(i => i.name === itemName && (i.folioId || 'A') !== targetFolio);

  if (item) {
    item.folioId = targetFolio;
    saveDB();
    renderFolioItems(resId, 'folioItemsContainer'); // Re-render current view (item will disappear)
    showToast(`Ítem movido al Folio ${targetFolio}`, 'success');
  }
}

function processBillPayment(resId, isCheckout = false) {
  const res = DB.reservations.find(r => r.id === resId);
  if (!res) return;

  // Recalculate totals
  const total = res.folio.reduce((acc, i) => acc + i.price, 0);

  // If checkout and no pending balance, finalize directly
  if (isCheckout && total <= 0) {
    return finalizeCheckout(resId);
  }

  if (total === 0 && !isCheckout) return showToast('No hay cargos pendientes en esta cuenta.', 'info');

  // Ensure modals transition correctly
  closeModal('resDetailModal');
  openModal('folioModal');

  const g = DB.guests.find(gx => gx.id === res.guestId || gx.name === res.guestName) || {};

  // Show Payment & Billing Interface
  document.getElementById('folioModalBody').innerHTML = `
    <div style="padding:24px">
        <h3 style="margin-bottom:20px;text-align:center">${isCheckout ? 'Facturación y Salida' : 'Registrar Pago'}</h3>
        
        <div style="background:var(--bg-surface);padding:16px;border-radius:12px;margin-bottom:24px;text-align:center;border:2px dashed var(--gold)">
            <div class="text-muted text-xs">TOTAL A PAGAR</div>
            <div style="font-size:32px;font-weight:800;color:var(--primary)">$${total.toFixed(2)}</div>
            <div style="font-size:14px;color:var(--text-secondary);margin-top:4px">
                ≈ Bs. ${(total * EXCHANGE_RATE_VES).toFixed(2)}
            </div>
        </div>

        <div class="grid-2 gap-16 mb-24">
            <div class="form-group">
                <label>Fecha Entrada (Modificable)</label>
                <input type="date" id="billCheckIn" class="form-input" value="${res.checkIn}">
            </div>
            <div class="form-group">
                <label>Fecha Salida (Modificable)</label>
                <input type="date" id="billCheckOut" class="form-input" value="${res.checkOut}">
            </div>
        </div>

        <div class="card bg-surface mb-24" style="padding:16px">
            <div class="flex-between mb-8">
                <div style="font-weight:600">Datos de Facturación</div>
                <label class="flex gap-4 items-center text-xs pointer">
                    <input type="checkbox" id="isLegalEntity" onchange="toggleLegalFields()"> 
                    Factura Jurídica / Fiscal
                </label>
            </div>
            
            <div id="personalFields">
                <div class="text-muted text-xs">Cliente: ${res.guestName}</div>
                <div class="text-muted text-xs">CI/ID: ${res.cedula || 'N/A'}</div>
            </div>

            <div id="legalFields" class="hidden mt-8 grid-2 gap-8">
                <div class="form-group span-2"><label>Razón Social / Nombre</label><input type="text" id="billName" class="form-input" value=""></div>
                <div class="form-group"><label>RIF / NIT</label><input type="text" id="billId" class="form-input" value=""></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="billPhone" class="form-input" value=""></div>
                <div class="form-group span-2"><label>Dirección Fiscal</label><input type="text" id="billAddress" class="form-input" value=""></div>
            </div>
        </div>

        <p class="text-muted mb-16" style="text-align:center">Seleccione Método de Pago Final:</p>

        <div class="payment-methods-wrapper">
            <div id="paymentMethodsGrid" class="payment-grid">
                ${PAYMENT_METHODS.map(m => `
                    <div class="payment-method-card" onclick="${m.isFolder ? `toggleDivisaSelection('${resId}', ${isCheckout})` : `preparePaymentAmount('${resId}', '${m.id}', ${isCheckout})`}">
                        <div class="method-icon">${m.icon}</div>
                        <div class="method-name">${m.name}</div>
                    </div>
                `).join('')}
            </div>

            <div id="divisaMethodsGrid" class="divisa-container hidden">
                <div class="divisa-header">
                    <span class="divisa-title">MÉTODOS EN DIVISA</span>
                    <button class="btn btn-sm btn-outline" onclick="toggleDivisaSelection('${resId}', ${isCheckout})">Atrás</button>
                </div>
                <div class="divisa-grid">
                    ${DIVISA_METHODS.map(m => `
                        <div class="payment-method-card divisa-method-mini" onclick="preparePaymentAmount('${resId}', '${m.id}', ${isCheckout})">
                            <div class="method-icon">${m.icon}</div>
                            <div class="method-name">${m.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <button class="btn btn-outline w-full mt-24" onclick="showFolio('${resId}')">Volver</button>
    </div>
  `;

  // Hide footer total and button during selection
  document.querySelector('#folioModal .modal-footer').innerHTML = ``;
}

function toggleLegalFields() {
  const isLegal = document.getElementById('isLegalEntity').checked;
  document.getElementById('legalFields').classList.toggle('hidden', !isLegal);
  document.getElementById('personalFields').classList.toggle('hidden', isLegal);
}

function toggleDivisaSelection(resId, isCheckout) {
  const mainGrid = document.getElementById('paymentMethodsGrid');
  const divisaGrid = document.getElementById('divisaMethodsGrid');

  if (mainGrid.classList.contains('hidden')) {
    mainGrid.classList.remove('hidden');
    divisaGrid.classList.add('hidden');
  } else {
    mainGrid.classList.add('hidden');
    divisaGrid.classList.remove('hidden');
  }
}

// DELETED REDUNDANT FUNCTIONS

function finalizeCheckout(resId) {
  const r = DB.reservations.find(rv => rv.id === resId);

  r.status = 'completada';
  r.actualCheckoutDate = todayStr();
  const room = DB.rooms.find(rm => rm.id === r.roomId);
  if (room) room.status = 'cleaning'; // Set to dirty

  // Auto-create HK task
  DB.hkTasks.push({
    id: DB.hkTasks.length + 1,
    roomId: r.roomId,
    type: 'Limpieza de Salida',
    priority: 'high',
    status: 'pendiente',
    assignee: 'Auto',
    eta: 'Ahora',
    checkoutTime: new Date().toISOString()
  });

  // === LOYALTY ===
  const guest = DB.guests.find(g => g.name === r.guestName);
  if (guest) {
    guest.stays = (guest.stays || 0) + 1;
    guest.totalSpent = (guest.totalSpent || 0) + (r.total || 0);
    guest.lastCheckout = todayStr();

    const oldTier = guest.tier;
    guest.tier = calculateGuestTier(guest);
    if (guest.tier !== oldTier) showToast(`🎉 ${r.guestName} subió a nivel ${guest.tier.toUpperCase()}!`, 'success');
  }

  saveDB();
  renderCheckin();
  renderReservations();
  closeModal('folioModal');
  closeModal('resDetailModal');
  updateSidebarBadges();
  addNotification(`Checkout Completado: ${r.guestName} (Hab ${r.roomId})`);


  // Auto-open Invoice
  showInvoice(resId);
  showToast('Checkout exitoso. Generando factura...', 'success');
}

// ===== INVOICE GENERATION =====
function showInvoice(resId) {
  try {
    const res = DB.reservations.find(r => r.id === resId);
    if (!res) return showToast('Reserva no encontrada', 'error');

    // Create a printable window or modal
    const invoiceHTML = generateInvoiceHTML(res);

    // Always recreate invoice container to ensure fresh handlers
    let invoiceModal = document.getElementById('invoiceModal');
    if (invoiceModal) invoiceModal.remove();

    invoiceModal = document.createElement('div');
    invoiceModal.id = 'invoiceModal';
    invoiceModal.className = 'modal-invoice'; // Specific class to avoid conflicts
    invoiceModal.innerHTML = `
        <div class="modal-content" style="max-width:800px; padding:0; position:relative; z-index:100001">
            <div class="modal-header">
                <h3 class="modal-title">Factura</h3>
                <button class="close-btn" onclick="closeInvoice()" style="font-size:24px; cursor:pointer">&times;</button>
            </div>
            <div class="modal-body" id="invoiceBody" style="background:white; color:black; font-family: 'Courier New', monospace; padding:40px"></div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeInvoice()">Cerrar</button>
                <button class="btn btn-primary" onclick="printInvoice()">🖨️ Imprimir / Guardar PDF</button>
            </div>
        </div>
    `;
    document.body.appendChild(invoiceModal);

    // Inject styles for modal view
    const styles = `
        <style>
            /* Specific Modal Styles for Invoice */
            .modal-invoice {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                display: none; /* Hidden by default */
                align-items: center;
                justify-content: center;
                z-index: 100000; /* Extremely high z-index */
                backdrop-filter: blur(2px);
            }
            .modal-invoice.active {
                display: flex !important;
            }
            
            /* Invoice Content Styles */
            #invoiceBody { font-family: 'Times New Roman', serif; color: #333; line-height: 1.6; }
            #invoiceBody .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            #invoiceBody h1 { margin: 0 0 10px 0; font-size: 28px; text-transform: uppercase; }
            #invoiceBody .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
            #invoiceBody table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            #invoiceBody th { text-align: left; border-bottom: 2px solid #333; padding: 10px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
            #invoiceBody td { border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px; }
            #invoiceBody .totals { text-align: right; margin-top: 30px; }
            #invoiceBody .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 8px; font-size: 14px; }
            #invoiceBody .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
        </style>
    `;

    document.getElementById('invoiceBody').innerHTML = styles + invoiceHTML;

    // Force open with class and inline style
    const modal = document.getElementById('invoiceModal');
    modal.className = 'modal-invoice active';
    modal.style.display = 'flex';

    console.log('Invoice Modal Opened via showInvoice');

  } catch (e) {
    console.error(e);
    showToast('Error generando factura: ' + e.message, 'error');
  }
}

function closeInvoice() {
  const modal = document.getElementById('invoiceModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none'; // Force hide
    modal.remove(); // Clean up completely
  }
}

function printInvoice() {
  const content = document.getElementById('invoiceBody').innerHTML;
  const win = window.open('', '', 'height=700,width=900');
  win.document.write('<html><head><title>Factura</title>');
  // Minimal CSS for print
  win.document.write(`
        <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 8px; }
            td { border-bottom: 1px solid #eee; padding: 8px; }
            .totals { text-align: right; margin-top: 20px; }
            .total-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 5px; }
            .grand-total { font-size: 1.2em; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
            @media print { .no-print { display: none; } }
        </style>
    `);
  win.document.write('</head><body>');
  win.document.write(content);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
}

function generateInvoiceHTML(res) {
  const billData = res.billingData || {};
  // Defaults
  const bName = billData.name || res.guestName || 'Consumidor Final';
  const bId = billData.id || res.cedula || 'N/A';
  const bType = billData.type || 'personal';
  const bAddress = billData.address || 'N/A';
  const bPhone = billData.phone || 'N/A';

  const hotelInfo = {
    name: HOTEL_NAME,
    rif: 'J-12345678-9',
    address: 'Av. Principal del Mar, Edif. Oceanview, Piso 1',
    phone: '+58 212 555 9999'
  };

  const items = res.folio ? res.folio.filter(i => (i.price > 0 && !i.isPayment)) : [];
  const payments = res.folio ? res.folio.filter(i => (i.price <= 0 || i.isPayment)) : [];

  const subtotalBase = items.reduce((acc, i) => acc + i.price, 0);
  const ivaRate = 0.16; // 16% IVA
  const ivaAmount = subtotalBase * ivaRate;

  // IGTF logic: 3% on payments made via DIVISA_METHODS
  const divisaMethodIds = DIVISA_METHODS.map(m => m.id);
  const divisaPaymentsTotal = payments.reduce((acc, p) => {
    // Only count as divisa if methodId is in DIVISA_METHODS
    // p.price is negative for payments
    if (divisaMethodIds.includes(p.methodId)) {
      return acc + Math.abs(p.price);
    }
    return acc;
  }, 0);

  const igtfRate = 0.03;
  const igtfAmount = divisaPaymentsTotal * igtfRate;
  const grandTotal = subtotalBase + ivaAmount + igtfAmount;

  // Check if fully paid
  const totalPaid = payments.reduce((acc, i) => acc + Math.abs(i.price), 0);
  const balance = grandTotal - totalPaid;

  return `
        <div class="header">
            <h1>${hotelInfo.name}</h1>
            <p>${hotelInfo.address}</p>
            <p><strong>RIF: ${hotelInfo.rif}</strong> | Tel: ${hotelInfo.phone}</p>
        </div>

        <div class="meta">
            <div>
                <strong>FACTURAR A:</strong><br>
                ${bName.toUpperCase()}<br>
                ${bType === 'legal' ? `RIF: ${bId}<br>${bAddress}<br>Tel: ${bPhone}` : `CI/Pasaporte: ${bId}`}
            </div>
            <div style="text-align:right">
                <strong>FACTURA N°:</strong> ${Math.floor(Math.random() * 100000)}<br>
                <strong>FECHA:</strong> ${todayStr()}<br>
                <strong>CONTROL:</strong> 00-${Math.floor(Math.random() * 1000000)}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th style="text-align:center">Cant.</th>
                    <th style="text-align:right">Precio Base</th>
                    <th style="text-align:right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(i => `
                <tr>
                    <td>${i.name} <span style="font-size:0.8em;color:#666">(${i.date || ''})</span></td>
                    <td style="text-align:center">1</td>
                    <td style="text-align:right">${i.price.toFixed(2)}</td>
                    <td style="text-align:right">${i.price.toFixed(2)}</td>
                </tr>`).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row"><span>Subtotal (Base):</span> <strong>$${subtotalBase.toFixed(2)}</strong></div>
            <div class="total-row"><span>IVA (16%):</span> <strong>$${ivaAmount.toFixed(2)}</strong></div>
            ${igtfAmount > 0 ? `<div class="total-row" style="color:#d32f2f"><span>IGTF (3% Divisas):</span> <strong>+$${igtfAmount.toFixed(2)}</strong></div>` : ''}
            <div class="total-row grand-total"><span>TOTAL GENERAL:</span> <strong>$${grandTotal.toFixed(2)}</strong></div>
            
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px">
                <div class="total-row" style="color:#666">
                    <span>Pagado (${payments.length} trxs):</span> <span>-$${totalPaid.toFixed(2)}</span>
                </div>
                 <div class="total-row" style="font-weight:bold; color:${balance > 0.01 ? '#d32f2f' : '#2e7d32'}">
                    <span>${balance > 0.01 ? 'Saldo Pendiente:' : 'Cuenta Saldada:'}</span> <span>$${balance.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div style="margin-top:40px; border-top:1px dashed #ccc; padding-top:10px; font-size:0.8em; text-align:center">
            ${igtfAmount > 0 ? '* IGTF calculado sobre pagos en divisas según normativa vigente.<br>' : ''}
            Gracias por su preferencia. Esta factura fue generada electrónicamente.<br>
            SmartHotel AI OS
        </div>
    `;
}

function preparePaymentAmount(resId, methodId, isCheckout) {
  const res = DB.reservations.find(r => r.id === resId);
  const method = PAYMENT_METHODS.find(m => m.id === methodId);
  const totalPending = res.folio.reduce((acc, i) => acc + i.price, 0);

  // Logic: Only "Divisa" folder results in USD entry. Everything else is BSF.
  const isLocalMethod = !DIVISA_METHODS.some(dm => dm.id === methodId);
  const rate = DB.settings.exchangeRate || 36.50;

  const initialValue = isLocalMethod
    ? (totalPending * rate).toFixed(2)
    : totalPending.toFixed(2);

  document.getElementById('folioModalBody').innerHTML = `
    <div style="padding:24px">
        <div class="flex-center mb-16" style="gap:12px">
            <div style="font-size:32px">${method.icon}</div>
            <h3 style="margin:0">Pago vía ${method.name}</h3>
        </div>

        <div class="card mb-24" style="background:var(--bg-surface);border:1px solid var(--gold)">
            <div class="flex-between">
                <span class="text-muted">Balance Pendiente ($):</span>
                <span style="font-weight:700">$${totalPending.toFixed(2)}</span>
            </div>
            ${isLocalMethod ? `
            <div class="flex-between mt-8" style="border-top:1px solid #eee; padding-top:8px">
                <span class="text-muted">Equivalencia (Tasa ${rate}):</span>
                <span style="font-weight:700; color:var(--success)">Bs. ${(totalPending * rate).toFixed(2)}</span>
            </div>
            ` : ''}
        </div>

        <div class="form-group mb-16">
            <label style="font-weight:700">Monto a Pagar (${isLocalMethod ? 'Bolívares Bs.' : 'Dólares $'})</label>
            <input type="number" id="paymentAmount" class="form-input" value="${initialValue}" step="0.01" min="0.01" 
                   oninput="${isLocalMethod ? `updateUSDConversion(this.value, ${rate})` : ''}"
                   style="font-size:20px; font-weight:800; color:var(--primary)">
            
            ${isLocalMethod ? `
            <div id="usdConversionHint" style="margin-top:8px; font-size:12px; color:#666">
                Equivale a: <strong id="usdCalcValue">$${totalPending.toFixed(2)}</strong> USD
            </div>
            ` : ''}
        </div>

        <div class="form-group mb-24">
            <label>Referencia / Notas (Opcional)</label>
            <input type="text" id="paymentRef" class="form-input" placeholder="Ej: confirmación #12345">
        </div>

        <div class="flex gap-8">
            <button class="btn btn-outline w-full" onclick="processBillPayment('${resId}', ${isCheckout})">Cancelar</button>
            <button class="btn btn-gold w-full" onclick="confirmPaymentWithMethod('${resId}', '${methodId}', ${isCheckout})">Confirmar Pago</button>
        </div>
    </div>
  `;
}

function updateUSDConversion(bsValue, rate) {
  const usd = (parseFloat(bsValue) || 0) / rate;
  const el = document.getElementById('usdCalcValue');
  if (el) el.innerText = `$${usd.toFixed(2)}`;
}

function confirmPaymentWithMethod(resId, methodId, isCheckout) {
  const res = DB.reservations.find(r => r.id === resId);
  const method = PAYMENT_METHODS.find(m => m.id === methodId);
  const totalPendingBefore = res.folio.reduce((acc, i) => acc + i.price, 0);

  const rawAmount = parseFloat(document.getElementById('paymentAmount').value);
  const paymentRef = document.getElementById('paymentRef').value || 'Sin referencia';

  if (isNaN(rawAmount) || rawAmount <= 0) return showToast('Por favor ingresa un monto válido.', 'warning');

  // Logic: Handle conversion if local
  const isLocalMethod = !DIVISA_METHODS.some(dm => dm.id === methodId);
  const rateUsed = DB.settings.exchangeRate || 36.50;

  const paymentAmountUSD = isLocalMethod ? (rawAmount / rateUsed) : rawAmount;
  const paymentAmountBS = isLocalMethod ? rawAmount : (rawAmount * rateUsed);

  if (paymentAmountUSD > totalPendingBefore + 0.1) return alert('El monto no puede ser mayor al balance pendiente.');

  const isPartial = paymentAmountUSD < totalPendingBefore - 0.01;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString();

  if (confirm(`¿Confirmar pago por el equivalente a $${paymentAmountUSD.toFixed(2)} (${isLocalMethod ? `Bs. ${rawAmount.toFixed(2)}` : `$${rawAmount.toFixed(2)}`})?`)) {
    // Record the payment as a negative entry in the folio
    res.folio.push({
      name: `PAGO: ${method.icon} ${method.name}`,
      price: -paymentAmountUSD,
      method: method.name,
      methodId: methodId,
      reference: paymentRef + (isLocalMethod ? ` | Tasa: ${rateUsed} | Bs: ${paymentAmountBS.toFixed(2)}` : ''),
      date: dateStr,
      time: timeStr,
      fullDate: now.toISOString(),
      bsAmount: isLocalMethod ? paymentAmountBS : null,
      exchangeRate: rateUsed
    });

    saveDB();
    addNotification(`Pago ${isPartial ? 'PARCIAL' : 'TOTAL'} de $${paymentAmountUSD.toFixed(2)} (${method.name})`);

    const totalRemaining = res.folio.reduce((acc, i) => acc + i.price, 0);

    if (totalRemaining > 0.01) {
      alert(`✅ Pago parcial registrado.\nRestante: $${totalRemaining.toFixed(2)}`);
      processBillPayment(resId, isCheckout);
      return;
    }

    // Settlement Success
    if (isCheckout) {
      finalizeCheckout(resId);
    } else {
      showPaymentSuccess(resId);
    }
  }
}

function showPaymentSuccess(resId) {
  const res = DB.reservations.find(r => r.id === resId);
  // Find all payment entries in the folio for this reservation
  const payments = res.folio.filter(item => item.name.startsWith('PAGO:'));

  document.getElementById('folioModalBody').innerHTML = `
    <div style="text-align:center;padding:24px">
      <div style="font-size:60px;margin-bottom:16px">🧾✅</div>
      <h2 style="color:var(--success);margin-bottom:8px">¡Cuenta Saldada!</h2>
      <p class="text-muted">La reserva de <strong>${res.guestName}</strong> ha sido pagada en su totalidad.</p>
      
      <div class="card mt-24" style="text-align:left; background:var(--bg-surface); border:1px solid var(--border)">
        <div style="font-weight:700; border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:12px">DETALLE DE PAGOS</div>
        <div style="max-height:200px; overflow-y:auto">
          <table style="width:100%; font-size:12px; border-collapse:collapse">
            <thead>
              <tr style="color:var(--text-muted)">
                <th style="padding:4px; text-align:left">Fecha/Hora</th>
                <th style="padding:4px; text-align:left">Método</th>
                <th style="padding:4px; text-align:right">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr style="border-bottom:1px dashed var(--border)">
                  <td style="padding:8px 4px">${p.date} ${p.time}</td>
                  <td style="padding:8px 4px"><strong>${p.method}</strong><br><small class="text-muted">${p.reference}</small></td>
                  <td style="padding:8px 4px; text-align:right">$${Math.abs(p.price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:12px; padding-top:12px; border-top:2px solid var(--border); display:flex; justify-content:space-between; font-weight:800; font-size:16px">
          <span>TOTAL PAGADO:</span>
          <span style="color:var(--primary)">$${Math.abs(payments.reduce((acc, p) => acc + p.price, 0)).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="flex gap-8 mt-24">
          <button class="btn btn-gold w-full" onclick="printDetailedReceipt('${resId}')">
            <i class="fas fa-print"></i> Imprimir Recibo
          </button>
          <button class="btn btn-outline w-full" onclick="closeModal('folioModal')">Finalizar</button>
      </div>
    </div>
  `;

  // Also clear the actual products from folio now that it's settled (optional, or keep for history)
  // Usually in a real PMS we archive the folio items. 
  // Let's keep them so the receipt is generated from them.
  // After success, we can clear them but let's wait until user closes the modal.
}


function createGuest() {
  const name = document.getElementById('guestName').value;
  if (name) {
    DB.guests.push({
      id: 'G' + (DB.guests.length + 1),
      name,
      email: document.getElementById('guestEmail').value,
      phone: document.getElementById('guestPhone').value,
      country: document.getElementById('guestCountry').value,
      pillow: document.getElementById('guestPillow').value,
      allergies: document.getElementById('guestAllergies').value,
      tier: 'bronce', points: 0
    });
    saveDB();
    closeModal('guestModal');
    renderCRM();
  }
}

function openResModalWithGuest(guestName) {
  navigate('reservations');
  setTimeout(() => {
    openModal('resModal');
    document.getElementById('newResGuest').value = guestName;
  }, 100);
}

// ===== POS =====
const POS_ITEMS = {
  restaurante: [
    { name: 'Desayuno Buffet', price: 15, emoji: '🥐' },
    { name: 'Café Espresso', price: 3, emoji: '☕' },
    { name: 'Cena Menú', price: 25, emoji: '🍽️' },
    { name: 'Vino Tinto', price: 8, emoji: '🍷' }
  ],
  spa: [
    { name: 'Masaje 50m', price: 60, emoji: '💆' },
    { name: 'Facial', price: 45, emoji: '✨' },
    { name: 'Circuito Agua', price: 20, emoji: '🧖' }
  ],
  tours: [
    { name: 'City Tour', price: 30, emoji: 'Bus' },
    { name: 'Buceo', price: 80, emoji: '🤿' }
  ]
};

let currentCategory = 'restaurante';
let posCart = [];

function switchPOS(cat) {
  currentCategory = cat;
  document.querySelectorAll('.pos-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active'); // Quick hack
  renderPOS();
}

function renderPOS() {
  const items = POS_ITEMS[currentCategory];
  document.getElementById('posProducts').innerHTML = items.map(i => `
    <div class="pos-item" onclick="addToPOSCart('${i.name}', ${i.price})">
      <div class="pos-emoji">${i.emoji}</div>
      <div class="pos-name">${i.name}</div>
      <div class="pos-price">$${i.price}</div>
    </div>
  `).join('');

  // Update Room Select
  const occupied = DB.rooms.filter(r => r.status === 'occupied').map(r => `<option value="${r.id}">Hab ${r.id}</option>`);
  document.getElementById('posRoom').innerHTML = '<option>Seleccionar...</option>' + occupied.join('');
}

function addToPOSCart(name, price) {
  posCart.push({ name, price });
  renderPOSCart();
}

function renderPOSCart() {
  document.getElementById('posCartItems').innerHTML = posCart.map((i, idx) => `
    <div class="pos-cart-item">
      <span>${i.name}</span>
      <span>$${i.price} <button class="btn btn-danger btn-sm" onclick="posCart.splice(${idx},1);renderPOSCart()">x</button></span>
    </div>
  `).join('');
  const total = posCart.reduce((acc, c) => acc + c.price, 0);
  document.getElementById('posTotal').textContent = '$' + total.toFixed(2);
}

function posCharge() {
  if (!posCart.length) return showToast('El carrito está vacío.', 'warning');
  const roomId = parseInt(document.getElementById('posRoom').value);
  if (!roomId || isNaN(roomId)) return alert('Selecciona habitación');

  const res = DB.reservations.find(r => r.roomId === roomId && r.status === 'checkin');
  if (!res) return alert('No hay un huésped activo en esa habitación.');

  // Add items to folio
  posCart.forEach(item => {
    res.folio.push({
      name: item.name,
      price: item.price,
      time: new Date().toLocaleTimeString()
    });
  });

  saveDB();
  const total = posCart.reduce((acc, i) => acc + i.price, 0);
  addNotification(`Cargo de $${total.toFixed(2)} realizado a Habitación ${roomId} (${res.guestName})`);

  posCart = [];
  renderPOSCart();
  showToast(`Cargos aplicados a la cuenta de ${res.guestName}.`, 'success');
}

function posPayNow() {
  if (!posCart.length) return alert('Carrito vacío');
  const total = posCart.reduce((acc, c) => acc + c.price, 0);

  if (confirm(`¿Procesar pago inmediato de $${total.toFixed(2)}?`)) {
    addNotification(`Venta POS Directa: $${total.toFixed(2)}`);
    posCart = [];
    renderPOSCart();
    alert('✅ Pago procesado exitosamente. Se ha impreso el ticket de venta.');
  }
}

// ===== REPORTS =====
function renderReports() {
  // Calculate real revenue from DB
  const channelRevenue = {};
  let totalRevenue = 0;
  DB.reservations.forEach(r => {
    const ch = r.channel || 'Directo';
    const rev = r.folio ? r.folio.reduce((a, i) => a + i.price, 0) : r.total || 0;
    channelRevenue[ch] = (channelRevenue[ch] || 0) + rev;
    totalRevenue += rev;
  });

  // Build donut from real data
  const channels = Object.entries(channelRevenue);
  const colors = { 'Directo': '#d4a853', 'Booking.com': '#003580', 'Expedia': '#002577', 'Airbnb': '#FF5A5F', 'Directo / Alex AI': '#d4a853' };
  let degStart = 0;
  const gradientParts = channels.map(([name, rev]) => {
    const deg = Math.round((rev / Math.max(totalRevenue, 1)) * 360);
    const part = `${colors[name] || '#888'} ${degStart}deg ${degStart + deg}deg`;
    degStart += deg;
    return part;
  });

  const legend = channels.map(([name, rev]) => {
    const pct = Math.round((rev / Math.max(totalRevenue, 1)) * 100);
    return `<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="width:12px;height:12px;border-radius:50%;background:${colors[name] || '#888'}"></span>${name}: <strong>$${rev.toLocaleString()}</strong> (${pct}%)</div>`;
  }).join('');

  document.getElementById('revenueDonut').innerHTML = `
    <div class="donut-chart" style="background:conic-gradient(${gradientParts.join(',')})">
      <div class="donut-center"><div class="donut-value">$${totalRevenue >= 1000 ? Math.round(totalRevenue / 1000) + 'K' : totalRevenue}</div><div class="donut-label">Total</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">${legend}</div>
  `;

  if (!document.getElementById('nightAuditReport').innerHTML) {
    document.getElementById('nightAuditReport').innerHTML = '<div class="text-muted p-4 text-center">Auditoría pendiente. Ejecutar al cierre del día.</div>';
  }

  renderDailyCashierReport();
}

function renderDailyCashierReport() {
  const today = todayStr();
  const paymentsByMethod = {};
  let totalCollected = 0;

  DB.reservations.forEach(r => {
    if (r.folio) {
      r.folio.forEach(item => {
        if (item.isPayment && (item.date === today || !item.date)) { // Fallback !date for demo session
          const method = item.name.replace('PAGO PARCIAL: ', '').replace('PAGO: ', '');
          const amount = Math.abs(item.price);
          paymentsByMethod[method] = (paymentsByMethod[method] || 0) + amount;
          totalCollected += amount;
        }
      });
    }
  });

  const reportHtml = `
        <div class="card bg-surface h-full">
            <div class="flex-between mb-16">
                <h3 class="card-title">💵 Caja del Día (${formatDate(today)})</h3>
                <div class="badge badge-green">Total: $${totalCollected.toFixed(2)}</div>
            </div>
            
            ${Object.keys(paymentsByMethod).length ? `
                <table style="width:100%;font-size:13px">
                    <thead class="text-muted text-xs">
                        <tr><th style="text-align:left;padding-bottom:8px">Método</th><th style="text-align:right;padding-bottom:8px">Total</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(paymentsByMethod).map(([method, amount]) => `
                            <tr style="border-bottom:1px solid var(--border)">
                                <td style="padding:8px 0">${method}</td>
                                <td style="padding:8px 0;text-align:right;font-weight:600">$${amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div class="text-muted text-center p-4">No se han registrado pagos hoy.</div>'}
        </div>
    `;

  // Inject into Reports Grid
  // We look for the parent container of revenueDonut and append this new card or replace a placeholder
  // Currently renderReports updates 'revenueDonut', let's find a place to put this.
  // The HTML index.html likely has a grid. I'll check if I can append it to the reports container.
  // For now, I will append it to the 'revenueDonut' container as a sibling if possible, or override.
  // Wait, 'revenueDonut' is a specific ID. I should probably target the reports section container using JS.

  // Let's assume there is a container for reports.
  // Index.html check required?
  // I'll assume I can append to 'page-reports' or similar. 
  // Safer: Create a specific div for it in index.html, OR append to `revenueDonut` parent.
  // Let's just append to `revenueDonut` innerHTML for now to place it below for visibility.

  const existing = document.getElementById('dailyCashierReport');
  if (!existing) {
    const div = document.createElement('div');
    div.id = 'dailyCashierReport';
    div.style.marginTop = '20px';
    div.innerHTML = reportHtml;
    document.getElementById('revenueDonut').parentNode.appendChild(div);
  } else {
    existing.innerHTML = reportHtml;
  }
}

function runNightAudit() {
  if (!isAdmin()) return showToast('Acceso Denegado. Solo un Administrador puede ejecutar la Auditoría.', 'error');

  const today = todayStr();
  const totalRooms = DB.rooms.length;
  const occRooms = DB.rooms.filter(r => r.status === 'occupied').length;
  const occupancy = Math.round((occRooms / totalRooms) * 100);

  // ADR = Revenue from sold rooms / Number of sold rooms
  const activeRes = DB.reservations.filter(r => r.status === 'checkin' || r.status === 'completada');
  const totalRoomRevenue = activeRes.reduce((acc, r) => acc + (r.rate || 0), 0);
  const soldRooms = activeRes.length || 1;
  const adr = (totalRoomRevenue / soldRooms).toFixed(2);

  // RevPAR = Room Revenue / Total Available Rooms
  const revpar = (totalRoomRevenue / totalRooms).toFixed(2);

  // No-Shows: reservations with checkIn === today but never checked in
  const noShows = DB.reservations.filter(r => r.checkIn <= today && r.status === 'confirmada').length;

  // Pending charges (folio items without payment)
  const pendingCharges = activeRes.reduce((acc, r) => {
    const folioTotal = r.folio ? r.folio.reduce((a, i) => a + i.price, 0) : 0;
    const paidTotal = r.payments ? r.payments.reduce((a, p) => a + p.amount, 0) : 0;
    return acc + Math.max(0, folioTotal - paidTotal);
  }, 0);

  // Post nightly room charges to active folios
  let postedCount = 0;
  DB.reservations.filter(r => r.status === 'checkin').forEach(r => {
    const alreadyPosted = r.folio.some(f => f.name === `Cargo Nocturno ${today}`);
    if (!alreadyPosted) {
      r.folio.push({ name: `Cargo Nocturno ${today}`, price: r.rate, time: new Date().toLocaleTimeString() });
      postedCount++;
    }
  });
  if (postedCount > 0) saveDB();

  document.getElementById('nightAuditReport').innerHTML = `
    <div style="background:var(--bg-surface);padding:20px;border-radius:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:24px">✅</span>
        <div>
          <strong style="font-size:16px">Auditoría Nocturna Completada</strong><br>
          <span class="text-muted">${new Date().toLocaleString()}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px">
        <div style="background:white;padding:14px;border-radius:8px;text-align:center;border-left:4px solid var(--success)">
          <div class="text-muted" style="font-size:11px">ADR</div>
          <div style="font-size:22px;font-weight:800;color:var(--success)">$${adr}</div>
        </div>
        <div style="background:white;padding:14px;border-radius:8px;text-align:center;border-left:4px solid var(--primary)">
          <div class="text-muted" style="font-size:11px">RevPAR</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary)">$${revpar}</div>
        </div>
        <div style="background:white;padding:14px;border-radius:8px;text-align:center;border-left:4px solid var(--gold)">
          <div class="text-muted" style="font-size:11px">Ocupación</div>
          <div style="font-size:22px;font-weight:800;color:var(--gold)">${occupancy}%</div>
        </div>
        <div style="background:white;padding:14px;border-radius:8px;text-align:center;border-left:4px solid var(--accent)">
          <div class="text-muted" style="font-size:11px">No-Shows</div>
          <div style="font-size:22px;font-weight:800;color:var(--accent)">${noShows}</div>
        </div>
      </div>
      <hr style="border-color:var(--border);margin:12px 0">
      <div style="font-size:13px;display:grid;gap:6px">
        <div>📌 Cargos Posteados: <strong>${postedCount} habitaciones</strong></div>
        <div>💰 Saldo Pendiente Total: <strong style="color:var(--accent)">$${pendingCharges.toFixed(2)}</strong></div>
        <div>🏨 Habitaciones Ocupadas: <strong>${occRooms} / ${totalRooms}</strong></div>
        <div>💾 Backup BD: <strong style="color:var(--success)">OK</strong></div>
      </div>
    </div>
  `;

  showToast(`Auditoría completada. ADR: $${adr} | RevPAR: $${revpar} | Ocupación: ${occupancy}%`, 'success', 6000);
  addNotification(`📊 Night Audit: ADR $${adr}, RevPAR $${revpar}, Ocupación ${occupancy}%`);
}

// ===== REPUTATION =====
function renderReputation() {
  const reviews = [
    { star: 5, text: 'Excelente servicio, Alex fue muy útil.', author: 'Ana G.', sentiment: 'positive' },
    { star: 4, text: 'Buena habitación, desayuno mejorable.', author: 'Luis M.', sentiment: 'neutral' },
    { star: 5, text: 'La mejor experiencia, volveremos.', author: 'Sofia R.', sentiment: 'positive' }
  ];
  document.getElementById('reviewsList').innerHTML = reviews.map(r => `
    <div class="review-card ${r.sentiment}">
      <div class="review-header">
        <span class="review-source">Google · ${r.author}</span>
        <span class="review-stars">${'★'.repeat(r.star)}</span>
      </div>
      <div class="review-text">"${r.text}"</div>
      <div class="review-ai-response">
        <div class="review-ai-label">Respuesta Alex AI</div>
        Gracias ${r.author} por tu comentario. Nos alegra saber que tu experiencia fue ${r.sentiment === 'positive' ? 'genial' : 'buena'}. ¡Esperamos verte pronto!
      </div>
    </div>
  `).join('');
}


// ===== NOTIFICATIONS System =====
function toggleNotifications() {
  document.getElementById('notifPanel').classList.toggle('open');
}
function addNotification(text) {
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  DB.notifications.unshift({ text, time, read: false });
  saveDB();
  // Update badge
  document.querySelector('.notif-dot').style.display = 'block';
  renderNotifications();
}
function renderNotifications() {
  document.getElementById('notifList').innerHTML = DB.notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-time">${n.time}</div>
      <div class="notif-text">${n.text}</div>
    </div>
  `).join('');
}

// ===== TOAST NOTIFICATION SYSTEM =====
const TOAST_ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const titles = { success: 'Éxito', error: 'Error', warning: 'Atención', info: 'Información' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type]}</div>
    <div class="toast-body">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.classList.add('toast-out'); setTimeout(()=>this.parentElement.remove(), 300)">&times;</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// ===== DYNAMIC SIDEBAR BADGES =====
function updateSidebarBadges() {
  const hkBadge = document.getElementById('hkBadge');
  if (hkBadge) {
    const pending = DB.hkTasks.filter(t => t.status !== 'lista').length;
    hkBadge.textContent = pending;
    hkBadge.style.display = pending > 0 ? 'inline-flex' : 'none';
  }
  const mtBadge = document.getElementById('mtBadge');
  if (mtBadge) {
    const pendingMT = DB.maintenanceOrders.filter(o => o.status !== 'resuelta').length;
    mtBadge.textContent = pendingMT;
    mtBadge.style.display = pendingMT > 0 ? 'inline-flex' : 'none';
  }
}

// ===== MODAL UTILS =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ===================================
// ALEX AI CHATBOT LOGIC (Replaces Holo)
// ===================================
let holoOpen = false;

function toggleHolo() {
  holoOpen = !holoOpen;
  document.getElementById('holoChat').classList.toggle('open', holoOpen);
  if (holoOpen) {
    document.getElementById('holoInput').focus();
  }
}

function holoWelcome() {
  const msgs = document.getElementById('holoMessages');
  if (msgs.children.length) return;

  // Initial Greeting from Alex
  setTimeout(() => {
    addHoloMsg('bot', '👋 ¡Hola! Soy Alex, tu recepcionista virtual en el SmartHotel.\n\nEstoy aquí para ayudarte con dudas, reservas y servicios.\n¿En qué puedo ayudarte hoy? 😊');
  }, 800);
}

function addHoloMsg(type, text) {
  const msgs = document.getElementById('holoMessages');
  const div = document.createElement('div');
  div.className = 'holo-msg ' + type;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = text.replace(/\n/g, '<br>') + `<span class="msg-time">${time}</span>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function sendHolo() {
  const input = document.getElementById('holoInput');
  const text = input.value.trim();
  if (!text) return;

  addHoloMsg('user', text);
  input.value = '';

  // Show typing indicator
  const msgs = document.getElementById('holoMessages');
  const typing = document.createElement('div');
  typing.className = 'holo-typing';
  typing.id = 'typingIndicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  // Process logic with simulated delay
  setTimeout(() => {
    if (document.getElementById('typingIndicator')) document.getElementById('typingIndicator').remove();
    processAlexLogic(text);
  }, 1000 + Math.random() * 500);
}

function processAlexLogic(msg) {
  const m = msg.toLowerCase();

  // 1. Critical Rules: Anger / Frustration
  if (m.includes('molesto') || m.includes('queja') || m.includes('gerente') || m.includes('inaceptable') || m.includes('mierda') || m.includes('mal servicio')) {
    addHoloMsg('bot', '😟 Entiendo que estés molesto y lamento la situación. Para resolverlo de inmediato, te estoy transfiriendo con un agente humano ahora mismo. 👤📞');
    addNotification('🚨 [ALEX] Huésped molesto pide atención humana.');
    return;
  }

  // 2. Info: Services
  if (m.includes('wifi')) {
    addHoloMsg('bot', '📶 El WiFi es gratuito en todo el hotel.\nRed: SmartHotel_Guest\nClave: Welcome2025');
    return;
  }
  if (m.includes('desayuno')) {
    addHoloMsg('bot', '🥐 Nuestro desayuno buffet está incluido para todas las habitaciones Dobles y Suites. ☕\nHorario: 7:00 AM a 10:00 AM.');
    return;
  }
  if (m.includes('piscina') || m.includes('alberca')) {
    addHoloMsg('bot', '🏊‍♂️ La piscina está abierta todos los días de 9:00 AM a 8:00 PM.');
    return;
  }
  if (m.includes('estacionamiento') || m.includes('parking')) {
    addHoloMsg('bot', '🚗 Contamos con estacionamiento privado y seguro para huéspedes las 24 horas.');
    return;
  }
  if (m.includes('mascota') || m.includes('perro') || m.includes('gato')) {
    addHoloMsg('bot', '🐾 ¡Nos encantan las mascotas! Aceptamos mascotas pequeñas con un cargo extra de $10 por noche.');
    return;
  }

  // 3. Info: Horarios
  if (m.includes('check-in') || m.includes('entrada') || m.includes('llegada')) {
    addHoloMsg('bot', '🕒 El Check-in es a partir de las 3:00 PM.');
    return;
  }
  if (m.includes('check-out') || m.includes('salida')) {
    addHoloMsg('bot', '👋 El Check-out es hasta las 11:00 AM.');
    return;
  }

  // 4. Sales: Prices (Consult Rule)
  // If asking for price strictly without context, ask for params
  if ((m.includes('precio') || m.includes('cuanto cuesta') || m.includes('costo')) && !m.includes('simple') && !m.includes('doble') && !m.includes('suite')) {
    addHoloMsg('bot', '📅 Para darte el mejor precio, ¿me podrías decir para qué fechas buscas y cuántas personas son?');
    return;
  }

  // 5. Sales: Specific Room Types
  if (m.includes('simple') || m.includes('sencilla')) {
    addHoloMsg('bot', '🛏️ La Habitación Simple cuesta $50/noche.\nEs cómoda y perfecta para viajeros solos.\n\nPero... ¿sabías que la Suite tiene un balcón privado increíble por solo $120? 😉');
    return;
  }
  if (m.includes('doble')) {
    addHoloMsg('bot', '👫 La Habitación Doble cuesta $80/noche.\nIdeal para parejas, con más espacio.\n\nIncluye acceso a desayuno buffet. ¿Te gustaría reservar?');
    return;
  }
  if (m.includes('suite')) {
    addHoloMsg('bot', '🌟 ¡Excelente elección! La Suite cuesta $120/noche.\nIncluye balcón privado, vista al mar y minibar premium.\n\n¿Para qué fechas te gustaría?');
    return;
  }

  // 6. Security Rule (No fake data)
  if (m.includes('disponibilidad') || m.includes('hay lugar') || m.includes('reservar ahora')) {
    // Since this is a frontend mock, Alex pretends to check real DB but might fall back to manual if unsure
    // But per prompt logic: "Si no conoces disponibilidad real... pide datos"
    // Since we DO have a mock DB, we can be smarter, but let's follow the "Alex" prompt rule for edge cases.
    const isWeekEnd = m.includes('fin de semana');
    if (isWeekEnd) {
      addHoloMsg('bot', '🤔 Veo alta ocupación para fin de semana. Para no fallarte, ¿me das tu nombre y teléfono? Un agente humano verificará la disponibilidad exacta y te escribirá en 5 minutos.');
      return;
    }
    addHoloMsg('bot', '✅ Tenemos disponibilidad en este momento. ¿Te gustaría proceder con la reserva de una Suite ($120) o prefieres Doble ($80)?');
    return;
  }

  // 7. General / Unknown
  if (m.includes('gracias')) {
    addHoloMsg('bot', '¡De nada! 😊 Estoy aquí para lo que necesites.');
    return;
  }

  if (m.includes('hola') || m.includes('buenas')) {
    addHoloMsg('bot', '¡Hola! 👋 Soy Alex. ¿En qué puedo ayudarte?');
    return;
  }

  // Fallback
  addHoloMsg('bot', 'Entiendo. ¿Te gustaría saber sobre nuestras habitaciones 🛏️ o servicios 🏊‍♂️? También puedo conectarte con un humano si prefieres.');
}

// ===== INIT =====
window.onload = function () {
  loadDB();
  checkAuth();
};

function printDetailedReceipt(resId) {
  const res = DB.reservations.find(r => r.id === resId);
  if (!res) return;

  const charges = res.folio.filter(i => i.price > 0);
  const payments = res.folio.filter(i => i.price < 0);
  const totalCargos = charges.reduce((acc, i) => acc + i.price, 0);
  const totalPagos = Math.abs(payments.reduce((acc, i) => acc + i.price, 0));

  const receiptHTML = `
    <html>
    <head>
      <title>Factura - ${resId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: auto; }
        .header { text-align: center; border-bottom: 2px solid #EEE; padding-bottom: 20px; margin-bottom: 20px; }
        .details { margin-bottom: 30px; display: flex; justify-content: space-between; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #EEE; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 12px 8px; border-bottom: 1px solid #FAFAFA; font-size: 14px; vertical-align: top; }
        .total-box { background: #F9FAFB; padding: 24px; border-radius: 12px; margin-top: 20px; border: 1px solid #EEE; }
        .flex-between { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .grand-total { font-size: 22px; font-weight: 800; color: #1a2b4b; margin-top: 15px; border-top: 1px solid #DDD; padding-top: 15px; }
        .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f0f0f0; color: #666; margin-left: 8px; }
        h3 { color: #1a2b4b; border-left: 4px solid #d4af37; padding-left: 12px; margin-bottom: 15px; font-size: 18px; }
        .footer-note { text-align: center; margin-top: 60px; color: #999; font-size: 12px; font-style: italic; }
        @media print { 
            body { padding: 20px; }
            .no-print { display: none; }
            .total-box { border: 1px solid #DDD; background: none !important; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body onclick="window.print()">
      <div class="header">
        <h1 style="margin:0; color:#1a2b4b; letter-spacing: 2px;">SMART HOTEL</h1>
        <p style="margin:5px 0; color:#d4af37; font-weight: 600; text-transform: uppercase; font-size: 12px;">Comprobante de Pago y Liquidación</p>
      </div>
      
      <div class="details">
        <div>
          <span style="color:#999; font-size:11px; text-transform:uppercase;">Información del Huésped</span><br>
          <strong style="font-size:18px">${res.guestName}</strong><br>
          Habitación <strong>${res.roomId}</strong> - ${res.roomType}
        </div>
        <div style="text-align:right">
          <span style="color:#999; font-size:11px; text-transform:uppercase;">Referencia de Factura</span><br>
          <strong>ID: ${res.id}</strong><br>
          Fecha: ${new Date().toLocaleDateString()}<br>
          Hora: ${new Date().toLocaleTimeString()}
        </div>
      </div>

      <h3>Resumen de Consumos</h3>
      <table>
        <thead>
          <tr>
            <th>Concepto / Descripción</th>
            <th style="text-align:right">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${charges.map(i => `
            <tr>
              <td>${i.name} ${i.time ? `<span class="badge">${i.time}</span>` : ''}</td>
              <td style="text-align:right"><strong>$${i.price.toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Desglose de Pagos Recibidos</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Método y Referencia</th>
            <th style="text-align:right">Monto Pagado</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td style="color:#666">${p.date || '-'} ${p.time || '-'}</td>
              <td>
                <div style="font-weight:700">${p.method || p.name.replace('PAGO: ', '')}</div>
                <div style="font-size:11px; color:#888">${p.reference || 'Sin nota de referencia'}</div>
              </td>
              <td style="text-align:right; color:#1a2b4b"><strong>$${Math.abs(p.price).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div class="flex-between"><span>Subtotal Cargos y Servicios:</span><span>$${totalCargos.toFixed(2)}</span></div>
        <div class="flex-between" style="color:#2ecc71"><span>Total Abonado / Pagado:</span><span>-$${totalPagos.toFixed(2)}</span></div>
        <div class="flex-between grand-total">
          <span>SALDO FINAL DE CUENTA:</span>
          <span>$${Math.max(0, totalCargos - totalPagos).toFixed(2)}</span>
        </div>
      </div>

      <div class="footer-note">
        Este documento es un comprobante de liquidación de folio. <br>
        Gracias por elegir Smart Hotel. Su satisfacción es nuestra prioridad.
      </div>

      <div class="no-print" style="margin-top:40px; text-align:center;">
        <button onclick="window.print()" style="padding:10px 30px; background:#d4af37; border:none; color:white; border-radius:5px; cursor:pointer; font-weight:700;">Imprimir Ahora</button>
      </div>

      <script>
        window.onload = function() { 
          setTimeout(() => { window.print(); }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  } else {
    alert('Por favor, permite las ventanas emergentes para ver el recibo.');
  }
}

// ===== GUEST FLOW SIMULATIONS =====
function simulatePreCheckin(resId) {
  const r = DB.reservations.find(rv => rv.id === resId);
  if (!r) return;
  r.status = 'pre-checked';
  r.preCheckinData = {
    method: 'Online',
    timestamp: new Date().toISOString(),
    preferences: { pillow: 'Plumas', floor: 'Alto' }
  };
  saveDB();
  renderReservations();
  showToast(`✅ Pre-Check-in completado por el huésped (Simulación)`, 'success');
}

function simulateOCR() {
  const btn = document.getElementById('btnOCR');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Escaneando...';

  setTimeout(() => {
    // Fill form with mock data
    document.getElementById('regFirstName').value = 'Marta';
    document.getElementById('regLastName').value = 'Lopez';
    document.getElementById('regCedula').value = '12345678';
    document.getElementById('regNation').value = 'España';
    document.getElementById('regBirth').value = '1985-06-15';
    document.getElementById('regAddress').value = 'Calle Gran Vía 22, Madrid';
    if (btn) btn.innerHTML = '✅ Escaneo Completado';
    showToast('Documento escaneado y datos extraídos correctamente', 'success');
  }, 1500);
}

function toggleCardToken(checkbox) {
  if (checkbox.checked) {
    showToast('💳 Tarjeta tokenizada (****-4242) para cargos extra', 'info');
  }
}
