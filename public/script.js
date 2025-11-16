// =============== Firebase + Vercel ===============
const FB_URL = "https://led2-a60fb-default-rtdb.firebaseio.com";
const VERCEL_API_UPDATE = "https://led17-d8nx1d016-abdulhaieljabry-gmailcoms-projects.vercel.app//api/update-status";

let currentStatus = { led1: 'OFF', led2: 'OFF' };
let isUpdating  = false;
let updateInterval;

// =============== واجهة المستخدم ===============
function updateUIStatus(ledNumber, status) {
  const el = document.getElementById(`led${ledNumber}-status`);
  if (status === 'ON') {
    el.textContent = '🟢 مضاء';
    el.className = 'status-badge status-on';
  } else {
    el.textContent = '🔴 مطفأ';
    el.className = 'status-badge status-off';
  }
  el.classList.add('status-change');
  setTimeout(() => el.classList.remove('status-change'), 500);
}

function updateConnectionStatus(st, msg) {
  const el = document.getElementById('connection-status');
  switch (st) {
    case 'connected':    el.textContent = '🟢 متصل'; el.className = 'connected'; break;
    case 'disconnected': el.textContent = '🔴 غير متصل'; el.className = 'disconnected'; break;
    case 'connecting':   el.textContent = '🔄 جاري الاتصال...'; el.className = 'connecting'; break;
    default: el.textContent = msg || '❓ حالة غير معروفة';
  }
}

function updateLastUpdateTime() {
  const now = new Date();
  document.getElementById('last-update').textContent =
    now.toLocaleString('ar-EG', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

function showLoading(show = true) {
  document.getElementById('loading-overlay').classList.toggle('show', show);
}

function toggleButtons(disabled = false) {
  document.querySelectorAll('button').forEach(b => b.disabled = disabled);
}

// =============== Firebase REST ===============
async function fetchLEDStatus() {
  try {
    updateConnectionStatus('connecting');
    const [r1, r2] = await Promise.all([
      fetch(`${FB_URL}/leds/1/status.json`),
      fetch(`${FB_URL}/leds/2/status.json`)
    ]);
    if (!r1.ok || !r2.ok) throw new Error('FB read error');
    const s1 = await r1.json();
    const s2 = await r2.json();
    currentStatus.led1 = s1;
    currentStatus.led2 = s2;
    updateUIStatus(1, s1);
    updateUIStatus(2, s2);
    updateConnectionStatus('connected');
    updateLastUpdateTime();
  } catch (err) {
    console.error(err);
    updateConnectionStatus('disconnected');
  }
}

// =============== تحديث LED عبر Vercel ===============
async function updateLED(ledNumber, status) {
  if (isUpdating) return;
  isUpdating = true;
  showLoading(true);
  toggleButtons(true);

  try {
    const resp = await fetch(VERCEL_API_UPDATE, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ led: ledNumber, status: status })
    });
    if (!resp.ok) throw new Error('Vercel write error');

    currentStatus[`led${ledNumber}`] = status;
    updateUIStatus(ledNumber, status);
    updateLastUpdateTime();
    setTimeout(fetchLEDStatus, 1000);
  } catch (err) {
    alert('خطأ في التحديث: ' + err.message);
  } finally {
    isUpdating = false;
    showLoading(false);
    toggleButtons(false);
  }
}

// =============== مسح logs من Firebase ===============
async function clearLogs() {
  if (!confirm("هل أنت متأكد من مسح جميع السجلات؟")) return;
  showLoading(true);
  try {
    const resp = await fetch(`${FB_URL}/logs.json`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('Failed to clear logs');
    alert("تم مسح السجلات بنجاح ✅");
  } catch (err) {
    alert("خطأ: " + err.message);
  } finally {
    showLoading(false);
  }
}

// =============== التحديث التلقائي ===============
function startAutoUpdate() {
  fetchLEDStatus();
  updateInterval = setInterval(fetchLEDStatus, 3000);
}
function stopAutoUpdate() {
  clearInterval(updateInterval);
}
function handleVisibilityChange() {
  document.hidden ? stopAutoUpdate() : startAutoUpdate();
}
function handleOnline() {
  updateConnectionStatus('connecting');
  startAutoUpdate();
}
function handleOffline() {
  updateConnectionStatus('disconnected', '📵 لا يوجد اتصال');
  stopAutoUpdate();
}

// =============== التشغيل ===============
document.addEventListener('DOMContentLoaded', () => {
  startAutoUpdate();
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('beforeunload', stopAutoUpdate);
});


