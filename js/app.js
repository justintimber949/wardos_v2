/**
 * WardOS v2 — App Entry Point & Router
 */

// ── CURRENT VIEW STATE ────────────────────────────────────────────
let _currentView = 'dashboard';
let _currentRoomId = null;

// ── NAVIGATE ──────────────────────────────────────────────────────
function navigate(view, roomId) {
  _currentView = view;
  _currentRoomId = roomId || null;

  // Hide all views
  document.querySelectorAll('.vw').forEach(el => el.classList.remove('active'));

  // Clear nav active
  document.querySelectorAll('.ni').forEach(el => el.classList.remove('active'));

  if (view === 'dashboard') {
    document.getElementById('v-dashboard')?.classList.add('active');
    document.getElementById('n-dashboard')?.classList.add('active');
    renderDashboard();
  } else if (view === 'input') {
    document.getElementById('v-input')?.classList.add('active');
    document.getElementById('n-input')?.classList.add('active');
    renderInputView();
  } else if (view === 'peta') {
    document.getElementById('v-peta')?.classList.add('active');
    document.getElementById('n-peta')?.classList.add('active');
    renderPeta();
  } else if (view === 'room' && roomId) {
    document.getElementById('v-room')?.classList.add('active');
    document.getElementById(`n-${roomId}`)?.classList.add('active');
    renderRoom(roomId);
  }
}

// Called after data changes to refresh the currently visible view
function refreshCurrentView() {
  navigate(_currentView, _currentRoomId);
}

// ── EXPORT / IMPORT HANDLERS ──────────────────────────────────────

// Strip fotoLab dari semua pasien sebelum export/encode
function getDataWithoutFoto() {
  const d = getData();
  const clean = JSON.parse(JSON.stringify(d));
  for (const room of clean.rooms) {
    for (const kamar of room.kamar) {
      for (const bed of kamar.beds) {
        if (bed.patient?.fotoLab) delete bed.patient.fotoLab;
      }
    }
  }
  return clean;
}

// ── EXPORT MODAL ─────────────────────────────────────────────────
function openExportModal() {
  const all = getAllPatients();
  const aktif = all.filter(p => ['stabil','perhatian','kritis','rencana_rujuk'].includes(p.patient.status)).length;

  const html = `
<div class="confirm-overlay" id="export-modal">
  <div class="confirm-box" style="max-width:400px">
    <div class="confirm-title">📤 Export Pasien</div>
    <div class="confirm-msg" style="margin-bottom:12px">
      ${all.length} pasien · ${aktif} aktif
      <span style="font-size:10px;color:var(--mu);display:block;margin-top:2px">Foto lab tidak disertakan dalam semua format export</span>
    </div>

    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="exp-opt" onclick="handleExport()">
        <span style="font-size:16px">📁</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">File JSON</div>
          <div style="font-size:10px;color:var(--mu)">Download file — bisa diimport kembali</div>
        </div>
      </button>
      <button class="exp-opt" onclick="document.getElementById('export-modal').remove();openExportCodeModal()">
        <span style="font-size:16px">📋</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">Kode Teks</div>
          <div style="font-size:10px;color:var(--mu)">Salin kode — paste di perangkat lain</div>
        </div>
      </button>
      <button class="exp-opt" onclick="document.getElementById('export-modal').remove();openExportQRBatchModal()">
        <span style="font-size:16px">📱</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">QR Batch</div>
          <div style="font-size:10px;color:var(--mu)">Tampilkan QR semua pasien — cocok untuk data kecil</div>
        </div>
      </button>
    </div>

    <div class="confirm-actions" style="margin-top:14px">
      <button class="bu bgh" onclick="document.getElementById('export-modal').remove()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ── IMPORT MODAL ─────────────────────────────────────────────────
function openImportModal() {
  const html = `
<div class="confirm-overlay" id="import-modal">
  <div class="confirm-box" style="max-width:400px">
    <div class="confirm-title">📥 Import Pasien</div>
    <div class="confirm-msg" style="margin-bottom:12px">Pilih sumber data yang akan diimport</div>

    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="exp-opt" onclick="document.getElementById('import-modal').remove();handleImport()">
        <span style="font-size:16px">📁</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">File JSON</div>
          <div style="font-size:10px;color:var(--mu)">Dari file backup yang didownload</div>
        </div>
      </button>
      <button class="exp-opt" onclick="document.getElementById('import-modal').remove();openImportCodeModal()">
        <span style="font-size:16px">📋</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">Kode Teks — Semua Pasien</div>
          <div style="font-size:10px;color:var(--mu)">Paste kode dari Export via Kode Teks</div>
        </div>
      </button>
      <button class="exp-opt" onclick="document.getElementById('import-modal').remove();openQRImportModal()">
        <span style="font-size:16px">📷</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">Kode / QR — Satuan atau Batch</div>
          <div style="font-size:10px;color:var(--mu)">Paste kode atau scan QR (satu atau semua pasien)</div>
        </div>
      </button>
    </div>

    <div class="confirm-actions" style="margin-top:14px">
      <button class="bu bgh" onclick="document.getElementById('import-modal').remove()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ── EXPORT JSON (tanpa foto) ──────────────────────────────────────
function handleExport() {
  document.getElementById('export-modal')?.remove();
  const clean = getDataWithoutFoto();
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `wardos_backup_${getTodayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data diexport (tanpa foto lab)', 'success');
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = importJSON(ev.target.result);
      if (ok) {
        showToast('Data berhasil diimport', 'success');
        renderSidebar();
        refreshCurrentView();
      } else {
        showToast('Import gagal — format tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── EXPORT KODE TEKS ─────────────────────────────────────────────
function encodeAllDataCode() {
  const clean = getDataWithoutFoto();
  const payload = {
    v: 3,
    hospitalName: clean.hospitalName,
    koasName:     clean.koasName,
    rooms:        clean.rooms,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeAllDataCode(encoded) {
  try {
    const clean   = encoded.trim().replace(/\s/g, '');
    const json    = decodeURIComponent(escape(atob(clean)));
    const payload = JSON.parse(json);
    if (payload.v !== 3 || !payload.rooms) throw new Error('Format tidak dikenal (bukan kode WardOS v3)');
    return payload;
  } catch (e) {
    throw new Error('Kode tidak valid: ' + e.message);
  }
}

function openExportCodeModal() {
  const encoded = encodeAllDataCode();
  const all = getAllPatients();
  const sizeKB = (Math.ceil(encoded.length * 0.75) / 1024).toFixed(1);

  const html = `
<div class="confirm-overlay" id="export-code-modal">
  <div class="confirm-box" style="max-width:520px">
    <div class="confirm-title">📋 Export via Kode Teks</div>
    <div class="confirm-msg" style="margin-bottom:10px">
      ${all.length} pasien · ${sizeKB} KB · Foto lab tidak disertakan
    </div>
    <div style="position:relative;margin-bottom:12px">
      <textarea id="export-code-text" readonly
        style="width:100%;background:var(--sf2);border:1px solid var(--bd2);border-radius:6px;
               padding:8px 36px 8px 8px;font-size:10px;font-family:var(--mono);color:var(--tx2);
               resize:none;height:90px;line-height:1.5;word-break:break-all;outline:none"
      >${encoded}</textarea>
      <button onclick="copyExportCode()"
        style="position:absolute;top:6px;right:6px;background:var(--sf3);border:1px solid var(--bd2);
               color:var(--tx2);border-radius:4px;padding:3px 7px;font-size:11px;cursor:pointer"
        id="export-copy-btn">📋 Salin</button>
    </div>
    <div class="confirm-actions">
      <button class="bu bgh" onclick="document.getElementById('export-code-modal').remove()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('export-code-text')?.addEventListener('click', function(){ this.select(); });
}

function copyExportCode() {
  const ta  = document.getElementById('export-code-text');
  const btn = document.getElementById('export-copy-btn');
  if (!ta) return;
  navigator.clipboard.writeText(ta.value).then(() => {
    if (btn) { btn.textContent = '✓ Disalin'; setTimeout(() => btn.textContent = '📋 Salin', 2000); }
    showToast('Kode disalin', 'success');
  }).catch(() => { ta.select(); document.execCommand('copy'); showToast('Kode disalin', 'success'); });
}

// ── EXPORT QR BATCH ──────────────────────────────────────────────
function openExportQRBatchModal() {
  const encoded = encodeAllDataCode();
  const sizeKB  = (Math.ceil(encoded.length * 0.75) / 1024).toFixed(1);
  const tooLarge = encoded.length > 3000; // QR max ~3000 alphanumeric chars untuk L correction

  const html = `
<div class="confirm-overlay" id="export-qr-batch-modal">
  <div class="confirm-box" style="max-width:460px">
    <div class="confirm-title">📱 QR Batch</div>
    <div class="confirm-msg" style="margin-bottom:12px">
      Ukuran data: ${sizeKB} KB
      ${tooLarge ? '<br><span style="color:var(--kritis);font-size:11px">⚠ Data terlalu besar untuk QR. Gunakan Kode Teks sebagai gantinya.</span>' : ''}
    </div>
    ${tooLarge
      ? `<div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:12px;font-size:11px;color:var(--tx2);line-height:1.7;margin-bottom:12px">
           QR code memiliki kapasitas maksimal ~3KB. Data pasien saat ini melebihi batas tersebut.<br>
           Gunakan <b>Kode Teks</b> untuk transfer ke perangkat lain — cara kerjanya sama, hanya di-paste bukan di-scan.
         </div>`
      : `<div style="background:white;padding:14px;border-radius:8px;border:1px solid #e5e7eb;text-align:center;margin-bottom:12px">
           <div id="qr-batch-area"><div style="font-size:11px;color:#9ca3af;padding:20px">Membuat QR...</div></div>
         </div>`
    }
    <div class="confirm-actions">
      ${tooLarge
        ? `<button class="bu bp" onclick="document.getElementById('export-qr-batch-modal').remove();openExportCodeModal()">📋 Gunakan Kode Teks</button>`
        : `<button class="bu bgh" onclick="downloadBatchQR()">💾 Download QR</button>`
      }
      <button class="bu bgh" onclick="document.getElementById('export-qr-batch-modal').remove()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  if (!tooLarge) {
    setTimeout(() => {
      const area = document.getElementById('qr-batch-area');
      if (!area) return;
      if (typeof QRCode !== 'undefined') {
        area.innerHTML = '';
        new QRCode(area, { text: encoded, width: 240, height: 240, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.L });
      } else {
        area.innerHTML = '<div style="font-size:11px;color:#6b7280;padding:16px">QR library tidak termuat. Gunakan Kode Teks.</div>';
      }
    }, 100);
  }
}

function downloadBatchQR() {
  const area = document.getElementById('qr-batch-area');
  if (!area) return;
  const src = area.querySelector('canvas') || area.querySelector('img');
  if (!src) { showToast('QR belum siap', 'warn'); return; }
  const BORDER = 20;
  const isImg  = src.tagName === 'IMG';
  const w = isImg ? src.naturalWidth  : src.width;
  const h = isImg ? src.naturalHeight : src.height;
  const out = document.createElement('canvas');
  out.width = w + BORDER * 2; out.height = h + BORDER * 2;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, BORDER, BORDER, w, h);
  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = `wardos-qr-batch-${getTodayStr()}.png`;
  a.click();
  showToast('QR Batch didownload', 'success');
}

// ── IMPORT KODE TEKS (SEMUA) ─────────────────────────────────────
let _importCodeDecoded = null;
let _importCodeValidateTimer = null;

function openImportCodeModal() {
  const html = `
<div class="confirm-overlay" id="import-code-modal">
  <div class="confirm-box" style="max-width:520px">
    <div class="confirm-title">📋 Import via Kode Teks</div>
    <div class="confirm-msg" style="margin-bottom:10px">
      Paste kode dari <b>Export via Kode Teks</b> di perangkat lain.<br>
      <span style="font-size:10px;color:var(--kritis)">⚠️ Data pasien yang ada akan ditimpa.</span>
    </div>
    <label style="font-size:10px;color:var(--mu);font-family:var(--mono);text-transform:uppercase;
                  letter-spacing:.08em;display:block;margin-bottom:5px">Kode Data</label>
    <textarea id="import-code-input" placeholder="Paste kode di sini..."
      style="width:100%;background:var(--sf2);border:1px solid var(--bd2);border-radius:6px;
             padding:8px;font-size:10px;font-family:var(--mono);color:var(--tx);
             resize:vertical;height:90px;line-height:1.5;outline:none;margin-bottom:6px"
      oninput="importCodeValidate(this)"
      onfocus="this.style.borderColor='var(--room)'"
      onblur="this.style.borderColor='var(--bd2)'"></textarea>
    <div id="import-code-msg" style="font-size:10px;min-height:16px;margin-bottom:10px"></div>
    <div id="import-code-preview" style="display:none;background:rgba(16,185,129,.07);
         border:1px solid rgba(16,185,129,.2);border-radius:6px;padding:10px;margin-bottom:12px;
         font-size:11px;color:var(--tx2);line-height:1.8"></div>
    <div class="confirm-actions">
      <button class="bu bgh" onclick="closeImportCodeModal()">Batal</button>
      <button class="bu bp" id="import-code-btn" onclick="confirmImportCode()" style="display:none">📥 Import</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => document.getElementById('import-code-input')?.focus(), 100);
}

function importCodeValidate(el) {
  clearTimeout(_importCodeValidateTimer);
  _importCodeValidateTimer = setTimeout(() => {
    const val = el.value.trim();
    const msg = document.getElementById('import-code-msg');
    const preview = document.getElementById('import-code-preview');
    const btn = document.getElementById('import-code-btn');
    const setMsg = (txt, ok) => { if (msg) { msg.style.color = ok ? '#34d399' : 'var(--kritis)'; msg.textContent = txt; } };

    if (!val) { setMsg('', true); if (preview) preview.style.display = 'none'; if (btn) btn.style.display = 'none'; _importCodeDecoded = null; return; }
    try {
      const data = decodeAllDataCode(val);
      _importCodeDecoded = data;
      let total = 0, aktif = 0;
      for (const room of data.rooms) for (const k of room.kamar) for (const b of k.beds) if (b.patient) { total++; if (['stabil','perhatian','kritis','rencana_rujuk'].includes(b.patient.status)) aktif++; }
      setMsg('✓ Kode valid', true);
      if (preview) { preview.style.display = 'block'; preview.innerHTML = `<b style="color:var(--tx)">${esc(data.hospitalName||'—')}</b> · ${data.rooms.length} ruangan · ${total} pasien (${aktif} aktif)<br><span style="color:var(--mu);font-size:10px">Foto lab tidak disertakan dalam kode ini</span>`; }
      if (btn) btn.style.display = 'inline-block';
    } catch (e) {
      _importCodeDecoded = null; setMsg('✗ ' + e.message, false);
      if (preview) preview.style.display = 'none'; if (btn) btn.style.display = 'none';
    }
  }, 300);
}

function confirmImportCode() {
  if (!_importCodeDecoded) return;
  const data = _importCodeDecoded;
  showConfirm('📥 Konfirmasi Import', 'Data akan menimpa semua pasien dan konfigurasi ruangan yang ada. Lanjutkan?', () => {
    const d = getData();
    d.hospitalName = data.hospitalName || d.hospitalName;
    d.koasName     = data.koasName     || d.koasName;
    d.rooms        = data.rooms;
    saveData();
    closeImportCodeModal();
    showToast('Data berhasil diimport via kode', 'success');
    renderSidebar();
    refreshCurrentView();
  });
}

function closeImportCodeModal() {
  clearTimeout(_importCodeValidateTimer);
  _importCodeDecoded = null;
  document.getElementById('import-code-modal')?.remove();
}

// ── EXPORT KODE TEKS (alias lama, dipakai di qr.js) ─────────────
// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeSettings();
  }
});

// ── INIT ──────────────────────────────────────────────────────────
function init() {
  loadData();
  renderSidebar();
  navigate('dashboard');
}

window.addEventListener('DOMContentLoaded', init);
