/**
 * WardOS v2 — QR Code Sync
 *
 * EXPORT : QRCode.js (CDN) + kode teks yang bisa disalin
 * IMPORT : (1) Paste kode teks — zero library, semua browser
 *           (2) Upload gambar QR — jsQR dari jsDelivr CDN
 *           (3) Scan kamera      — jsQR dari jsDelivr CDN
 *
 * jsQR di-load lazy (hanya saat modal import dibuka) agar tidak blokir
 * app startup. Foto lab tidak disertakan dalam QR.
 */

// ── ENCODE / DECODE ───────────────────────────────────────────────

function encodePatientQR(patient, roomId, bedId) {
  const { fotoLab, ...clean } = patient;
  const payload = { v: 2, p: { ...clean, _roomId: roomId, _bedId: bedId } };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodePatientQR(encoded) {
  try {
    const clean   = encoded.trim().replace(/\s/g, '');
    const json    = decodeURIComponent(escape(atob(clean)));
    const payload = JSON.parse(json);
    if (payload.v !== 2 || !payload.p) throw new Error('Format tidak dikenal');
    return payload.p;
  } catch (e) {
    throw new Error('Kode tidak valid: ' + e.message);
  }
}

// ── LAZY LOAD jsQR ────────────────────────────────────────────────
// Hanya dimuat saat user benar-benar butuh upload/scan kamera

let _jsqrLoading = false;

function loadJsQR(onReady, onFail) {
  if (typeof jsQR !== 'undefined') { onReady(); return; }
  if (_jsqrLoading) {
    // Tunggu load selesai
    const wait = setInterval(() => {
      if (typeof jsQR !== 'undefined') { clearInterval(wait); onReady(); }
    }, 100);
    setTimeout(() => { clearInterval(wait); onFail('Timeout'); }, 10000);
    return;
  }
  _jsqrLoading = true;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  script.onload  = () => { _jsqrLoading = false; onReady(); };
  script.onerror = () => { _jsqrLoading = false; onFail('Gagal memuat jsQR — pastikan ada koneksi internet'); };
  document.head.appendChild(script);
}

// ── EXPORT QR MODAL ───────────────────────────────────────────────

function showPatientQR(roomId, bedId) {
  const patient = getPatient(roomId, bedId);
  if (!patient) return;
  const room    = getRoom(roomId);
  const encoded = encodePatientQR(patient, roomId, bedId);
  closeModal();

  const dataSizeKB = (Math.ceil(encoded.length * 0.75) / 1024).toFixed(2);

  const html = `
<div class="modal-overlay" id="qr-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box" style="max-width:440px">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">📱 Bagikan Pasien</div>
        <div class="modal-sub">${esc(patient.nama)} · ${esc(room?.name||roomId)} · Bed ${esc(bedId)}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;align-items:center;gap:16px">

      <!-- QR Code -->
      <div style="text-align:center">
        <div style="font-size:10px;color:var(--mu);margin-bottom:8px;font-family:var(--mono);
                    text-transform:uppercase;letter-spacing:.08em">
          Scan QR dengan kamera HP
        </div>
        <div id="qr-render-area"
             style="background:#fff;padding:20px;border-radius:8px;border:1px solid #e5e7eb;display:inline-block">
          <div style="font-size:11px;color:#9ca3af;text-align:center;padding:20px 10px">Membuat QR...</div>
        </div>
        <div style="margin-top:8px">
          <button class="bu bgh" style="font-size:11px" onclick="downloadQRWithBorder()">
            💾 Download QR
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div style="width:100%;display:flex;align-items:center;gap:10px">
        <div style="flex:1;height:1px;background:var(--bd)"></div>
        <span style="font-size:10px;color:var(--mu);white-space:nowrap">atau salin kode teks</span>
        <div style="flex:1;height:1px;background:var(--bd)"></div>
      </div>

      <!-- Kode teks -->
      <div style="width:100%">
        <div style="font-size:10px;color:var(--mu);margin-bottom:5px;font-family:var(--mono);
                    text-transform:uppercase;letter-spacing:.08em">
          Kode Pasien — paste ke Import di perangkat tujuan
        </div>
        <div style="position:relative">
          <textarea id="qr-code-text" readonly
            style="width:100%;background:var(--sf2);border:1px solid var(--bd2);border-radius:6px;
                   padding:8px 36px 8px 8px;font-size:10px;font-family:var(--mono);color:var(--tx2);
                   resize:none;height:64px;line-height:1.5;word-break:break-all"
          >${encoded}</textarea>
          <button onclick="copyQRCode()" title="Salin kode"
            style="position:absolute;top:6px;right:6px;background:var(--sf3);border:1px solid var(--bd2);
                   color:var(--tx2);border-radius:4px;padding:3px 6px;font-size:11px;cursor:pointer"
            id="qr-copy-btn">📋</button>
        </div>
      </div>

      <div style="font-size:10px;color:var(--mu);text-align:center;line-height:1.7">
        ⚠️ Foto lab tidak ikut — gunakan Export JSON untuk backup lengkap.
      </div>
    </div>
    <div class="modal-footer">
      <button class="bu bgh" onclick="closeModal()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => renderQRCode(encoded), 80);
}

function copyQRCode() {
  const ta  = document.getElementById('qr-code-text');
  const btn = document.getElementById('qr-copy-btn');
  if (!ta) return;
  const doFallback = () => { ta.select(); document.execCommand('copy'); };
  try {
    navigator.clipboard.writeText(ta.value).then(() => {
      if (btn) { btn.textContent = '✓'; setTimeout(() => btn.textContent = '📋', 1500); }
      showToast('Kode disalin', 'success');
    }).catch(doFallback);
  } catch (_) { doFallback(); }
}

function renderQRCode(encoded) {
  const area = document.getElementById('qr-render-area');
  if (!area) return;
  if (typeof QRCode !== 'undefined') {
    area.innerHTML = '';
    new QRCode(area, {
      text: encoded, width: 400, height: 400,
      colorDark: '#000000', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    return;
  }
  area.innerHTML = `
    <div style="text-align:center;padding:16px;max-width:180px;color:#6b7280">
      <div style="font-size:20px;margin-bottom:6px">⚠️</div>
      <div style="font-size:10px;line-height:1.6">
        QR library tidak termuat (butuh internet sekali).<br>
        Gunakan <b>kode teks</b> di bawah.
      </div>
    </div>`;
}

function downloadQRWithBorder() {
  const area = document.getElementById('qr-render-area');
  if (!area) return;
  const src = area.querySelector('canvas') || area.querySelector('img');
  if (!src) { showToast('QR belum siap', 'warn'); return; }
  const BORDER = 20;
  const isImg  = src.tagName === 'IMG';
  const w = isImg ? src.naturalWidth  : src.width;
  const h = isImg ? src.naturalHeight : src.height;
  const out = document.createElement('canvas');
  out.width  = w + BORDER * 2;
  out.height = h + BORDER * 2;
  const ctx  = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, BORDER, BORDER, w, h);
  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = `wardos-qr-${Date.now()}.png`;
  a.click();
  showToast('QR didownload', 'success');
}

// ── IMPORT QR MODAL ───────────────────────────────────────────────

function openQRImportModal() {
  const html = `
<div class="modal-overlay" id="qr-import-modal" onclick="if(event.target===this)closeQRImport()">
  <div class="modal-box" style="max-width:480px">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">📥 Import Pasien</div>
        <div class="modal-sub">Via kode teks, upload gambar QR, atau scan kamera</div>
      </div>
      <button class="modal-close" onclick="closeQRImport()">✕</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">

      <!-- Tab -->
      <div style="display:flex;gap:4px;background:var(--sf2);border-radius:7px;padding:3px">
        <button class="mto active" id="qr-tab-code" onclick="qrSwitchTab('code')">⌨️ Kode Teks</button>
        <button class="mto" id="qr-tab-file" onclick="qrSwitchTab('file')">🖼 Upload Gambar</button>
        <button class="mto" id="qr-tab-cam"  onclick="qrSwitchTab('cam')">📸 Kamera</button>
      </div>

      <!-- Panel: Kode teks -->
      <div id="qr-panel-code">
        <div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);
                    border-radius:8px;padding:11px;font-size:11px;color:var(--tx2);line-height:1.9;
                    margin-bottom:10px">
          <b style="color:var(--tx)">Cara pakai:</b><br>
          Di perangkat asal → modal pasien → 📱 <b>Bagikan</b> → salin Kode Pasien → paste di sini
        </div>
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);
                      text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:5px">
          Kode Pasien
        </label>
        <textarea id="qr-paste-input" placeholder="Paste kode di sini..."
          style="width:100%;background:var(--sf2);border:1px solid var(--bd2);border-radius:6px;
                 padding:8px;font-size:11px;font-family:var(--mono);color:var(--tx);
                 resize:vertical;height:80px;line-height:1.5;outline:none"
          oninput="qrLiveValidate(this)"
          onfocus="this.style.borderColor='var(--room)'"
          onblur="this.style.borderColor='var(--bd2)'"></textarea>
        <div id="qr-validate-msg" style="font-size:10px;margin-top:4px;min-height:16px"></div>
      </div>

      <!-- Panel: Upload file -->
      <div id="qr-panel-file" style="display:none">
        <div id="qr-drop-zone"
             style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px;
                    border:2px dashed var(--bd2);border-radius:8px;cursor:pointer;transition:border-color .15s">
          <span style="font-size:28px">🖼️</span>
          <span style="font-size:12px;color:var(--tx2)">Klik atau drop gambar QR di sini</span>
          <span style="font-size:10px;color:var(--mu)">JPG · PNG · WebP — butuh internet untuk decode</span>
          <input type="file" accept="image/*" id="qr-file-input" style="display:none"
                 onchange="handleQRFile(this)">
          <button class="bu bp" id="qr-file-btn" onclick="qrPickFile()">Pilih Gambar</button>
        </div>
        <div id="qr-file-status"
             style="display:none;font-size:11px;color:var(--mu);text-align:center;
                    margin-top:8px;padding:8px;background:var(--sf2);border-radius:5px"></div>
        <canvas id="qr-hidden-canvas" style="display:none"></canvas>
      </div>

      <!-- Panel: Kamera -->
      <div id="qr-panel-cam" style="display:none;flex-direction:column;align-items:center;gap:10px">
        <video id="qr-video"
               style="width:100%;border-radius:8px;background:#000;max-height:280px" playsinline></video>
        <canvas id="qr-cam-canvas" style="display:none"></canvas>
        <div id="qr-cam-status" style="font-size:11px;color:var(--mu)">
          Klik mulai — butuh internet untuk decode QR
        </div>
        <div style="display:flex;gap:6px">
          <button class="bu bp"  id="qr-cam-start" onclick="startQRCamera()">▶ Mulai Scan</button>
          <button class="bu bgh" id="qr-cam-stop"  onclick="stopQRCamera()" style="display:none">■ Stop</button>
        </div>
      </div>

      <!-- Preview hasil decode -->
      <div id="qr-result"
           style="display:none;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);
                  border-radius:8px;padding:12px">
        <div style="font-size:11px;font-weight:600;color:#34d399;margin-bottom:6px">✓ QR terdeteksi!</div>
        <div id="qr-result-preview" style="font-size:12px;color:var(--tx2)"></div>
      </div>

    </div>
    <div class="modal-footer">
      <button class="bu bp" id="qr-import-btn" onclick="confirmQRImport()" style="display:none">
        📥 Import Pasien Ini
      </button>
      <button class="bu bgh" onclick="closeQRImport()">Batal</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // Drag-drop setup
  const zone = document.getElementById('qr-drop-zone');
  if (zone) {
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.style.borderColor = 'var(--room)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = 'var(--bd2)'; });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.style.borderColor = 'var(--bd2)';
      const file = e.dataTransfer.files[0];
      if (file) processQRImageFile(file);
    });
    zone.addEventListener('click', e => {
      if (e.target.id !== 'qr-file-btn') qrPickFile();
    });
  }

  setTimeout(() => document.getElementById('qr-paste-input')?.focus(), 100);
}

function qrPickFile() {
  document.getElementById('qr-file-input')?.click();
}

let _qrStream        = null;
let _qrScanInterval  = null;
let _qrImportData    = null;
let _qrValidateTimer = null;

function qrSwitchTab(tab) {
  ['code','file','cam'].forEach(t => {
    document.getElementById(`qr-tab-${t}`)?.classList.toggle('active', t === tab);
    const panel = document.getElementById(`qr-panel-${t}`);
    if (panel) panel.style.display = t === tab ? (t === 'cam' ? 'flex' : 'block') : 'none';
  });
  if (tab !== 'cam') stopQRCamera();
  // Reset result
  const resultEl  = document.getElementById('qr-result');
  const importBtn = document.getElementById('qr-import-btn');
  if (resultEl)  resultEl.style.display  = 'none';
  if (importBtn) importBtn.style.display = 'none';
}

// ── TAB: KODE TEKS ────────────────────────────────────────────────

function qrLiveValidate(el) {
  clearTimeout(_qrValidateTimer);
  _qrValidateTimer = setTimeout(() => {
    const val     = el.value.trim();
    const msg     = document.getElementById('qr-validate-msg');
    const resultEl = document.getElementById('qr-result');
    const preview  = document.getElementById('qr-result-preview');
    const importBtn = document.getElementById('qr-import-btn');

    if (!val) {
      if (msg) msg.textContent = '';
      if (resultEl) resultEl.style.display = 'none';
      if (importBtn) importBtn.style.display = 'none';
      _qrImportData = null;
      return;
    }
    try {
      const patient = decodePatientQR(val);
      _qrImportData = patient;
      if (msg) { msg.style.color = '#34d399'; msg.textContent = '✓ Format valid'; }
      _showQRResult(patient);
    } catch (_) {
      _qrImportData = null;
      if (msg) { msg.style.color = 'var(--kritis)'; msg.textContent = '✗ Kode tidak valid'; }
      if (resultEl) resultEl.style.display = 'none';
      if (importBtn) importBtn.style.display = 'none';
    }
  }, 300);
}

// ── TAB: UPLOAD FILE ──────────────────────────────────────────────

function handleQRFile(input) {
  const file = input.files[0];
  if (file) processQRImageFile(file);
  input.value = '';
}

function processQRImageFile(file) {
  const statusEl = document.getElementById('qr-file-status');
  const show = (txt, isError) => {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.style.color   = isError ? 'var(--kritis)' : 'var(--mu)';
    statusEl.textContent   = txt;
  };

  show('Memuat decoder QR...');

  loadJsQR(() => {
    // jsQR siap
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('qr-hidden-canvas');
        if (!canvas) return;

        // Scale ke minimal 600px agar jsQR bisa decode dengan akurat
        const MIN_SIZE = 600;
        const scale    = Math.max(1, MIN_SIZE / Math.max(img.width, img.height));
        canvas.width   = Math.round(img.width  * scale);
        canvas.height  = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false; // pixel-crisp untuk QR
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code    = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code) {
          statusEl && (statusEl.style.display = 'none');
          tryParseQRData(code.data);
        } else {
          show('QR tidak terdeteksi. Pastikan gambar jelas dan tidak terpotong.', true);
        }
      };
      img.onerror = () => show('Gagal memuat gambar', true);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, err => show('Gagal memuat decoder: ' + err, true));
}

// ── TAB: KAMERA ───────────────────────────────────────────────────

function startQRCamera() {
  const status   = document.getElementById('qr-cam-status');
  const startBtn = document.getElementById('qr-cam-start');
  const stopBtn  = document.getElementById('qr-cam-stop');

  if (startBtn) startBtn.style.display = 'none';
  if (status)   status.textContent     = 'Memuat decoder QR...';

  loadJsQR(() => {
    // jsQR siap — akses kamera
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
    }).then(stream => {
      _qrStream = stream;
      const video  = document.getElementById('qr-video');
      const canvas = document.getElementById('qr-cam-canvas');
      if (!video) return;

      video.srcObject = stream;
      video.play();
      if (stopBtn)  stopBtn.style.display  = 'inline-block';
      if (status)   status.textContent     = 'Scanning... arahkan kamera ke QR';

      _qrScanInterval = setInterval(() => {
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx     = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code    = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) {
          stopQRCamera();
          tryParseQRData(code.data);
        }
      }, 300);

    }).catch(e => {
      if (startBtn) startBtn.style.display = 'inline-block';
      if (status)   status.textContent     = 'Gagal akses kamera: ' + e.message;
      showToast('Tidak bisa akses kamera', 'error');
    });

  }, err => {
    if (startBtn) startBtn.style.display = 'inline-block';
    if (status)   status.textContent     = 'Gagal memuat decoder: ' + err;
  });
}

function stopQRCamera() {
  if (_qrScanInterval) { clearInterval(_qrScanInterval); _qrScanInterval = null; }
  if (_qrStream)       { _qrStream.getTracks().forEach(t => t.stop()); _qrStream = null; }
  const startBtn = document.getElementById('qr-cam-start');
  const stopBtn  = document.getElementById('qr-cam-stop');
  const status   = document.getElementById('qr-cam-status');
  if (startBtn) startBtn.style.display = 'inline-block';
  if (stopBtn)  stopBtn.style.display  = 'none';
  if (status)   status.textContent     = 'Kamera dimatikan.';
}

// ── SHARED RESULT ─────────────────────────────────────────────────

function tryParseQRData(rawData) {
  try {
    const patient = decodePatientQR(rawData);
    _qrImportData = patient;
    _showQRResult(patient);
    showToast('QR berhasil dibaca', 'success');
  } catch (e) {
    showToast('Bukan QR WardOS yang valid', 'error');
  }
}

function _showQRResult(patient) {
  const resultEl  = document.getElementById('qr-result');
  const previewEl = document.getElementById('qr-result-preview');
  const importBtn = document.getElementById('qr-import-btn');
  const room      = getRoom(patient._roomId);
  if (resultEl)  resultEl.style.display  = 'block';
  if (importBtn) importBtn.style.display = 'inline-block';
  if (previewEl) previewEl.innerHTML = `
    <strong>${esc(patient.nama)}</strong> · ${patient.usia||'?'} th · ${patient.jk||'?'}<br>
    <span style="color:var(--tx)">${esc(patient.diagnosisUtama || '—')}</span><br>
    <span style="font-size:10px;color:var(--mu)">
      Lokasi asal: ${esc(room?.name || patient._roomId || '—')} · Bed ${esc(patient._bedId || '—')}
    </span>`;
}

function confirmQRImport() {
  if (!_qrImportData) return;
  const data = _qrImportData;
  _qrImportData = null;
  closeQRImport();
  openFormWithData(data, data._roomId, data._bedId);
  showToast('Form diisi — pilih bed tujuan dan simpan', 'info', 5000);
}

function closeQRImport() {
  stopQRCamera();
  clearTimeout(_qrValidateTimer);
  _qrImportData = null;
  document.getElementById('qr-import-modal')?.remove();
}

// ── EXPORT / IMPORT SEMUA PASIEN VIA KODE ────────────────────────

/**
 * Encode semua pasien (tanpa foto) ke satu kode teks.
 * Format: { v:3, type:"all", rooms:[...] } tanpa fotoLab
 */
function encodeAllPatientsCode() {
  const d = getData();
  // Deep clone rooms, strip fotoLab dari setiap pasien
  const roomsClean = JSON.parse(JSON.stringify(d.rooms)).map(room => {
    for (const kamar of room.kamar) {
      for (const bed of kamar.beds) {
        if (bed.patient) {
          delete bed.patient.fotoLab;
        }
      }
    }
    return room;
  });
  const payload = {
    v: 3,
    type: 'all',
    hospitalName: d.hospitalName || '',
    exportedAt: new Date().toISOString(),
    rooms: roomsClean,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeAllPatientsCode(encoded) {
  try {
    const clean = encoded.trim().replace(/\s/g, '');
    const json = decodeURIComponent(escape(atob(clean)));
    const payload = JSON.parse(json);
    if (payload.v !== 3 || payload.type !== 'all' || !payload.rooms) {
      throw new Error('Bukan kode export semua pasien');
    }
    return payload;
  } catch (e) {
    throw new Error('Kode tidak valid: ' + e.message);
  }
}

// ── MODAL EXPORT SEMUA ────────────────────────────────────────────

function openExportCodeModal() {
  const allP = getAllPatients();
  const encoded = encodeAllPatientsCode();
  const sizeKB = (Math.ceil(encoded.length * 0.75) / 1024).toFixed(1);

  const html = `
<div class="modal-overlay" id="export-all-modal" onclick="if(event.target===this)closeExportAllModal()">
  <div class="modal-box" style="max-width:480px">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">📤 Export via Kode</div>
        <div class="modal-sub">${allP.length} pasien · ${sizeKB} KB · tanpa foto lab</div>
      </div>
      <button class="modal-close" onclick="closeExportAllModal()">✕</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">

      <div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);
                  border-radius:8px;padding:11px;font-size:11px;color:var(--tx2);line-height:1.9">
        <b style="color:var(--tx)">Cara transfer ke perangkat lain:</b><br>
        1. Salin kode di bawah (tombol 📋)<br>
        2. Di perangkat tujuan → Sidebar → <b>📥 Import via Kode (Semua)</b><br>
        3. Paste kode → pilih mode merge/replace → Import<br>
        <span style="color:var(--mu);font-size:10px">⚠️ Foto lab tidak ikut — gunakan Export JSON untuk backup lengkap dengan foto</span>
      </div>

      <div>
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);
                      text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:5px">
          Kode Export Semua Pasien
        </label>
        <div style="position:relative">
          <textarea id="export-all-code" readonly
            style="width:100%;background:var(--sf2);border:1px solid var(--bd2);border-radius:6px;
                   padding:8px 36px 8px 8px;font-size:10px;font-family:var(--mono);color:var(--tx2);
                   resize:none;height:80px;line-height:1.5;word-break:break-all"
          >${encoded}</textarea>
          <button onclick="copyExportAllCode()" title="Salin kode"
            id="export-all-copy-btn"
            style="position:absolute;top:6px;right:6px;background:var(--sf3);border:1px solid var(--bd2);
                   color:var(--tx2);border-radius:4px;padding:3px 6px;font-size:11px;cursor:pointer">📋</button>
        </div>
      </div>

      <div style="font-size:11px;color:var(--mu);text-align:center">
        Atau gunakan <b>Export JSON</b> di sidebar untuk file lengkap termasuk foto lab dan pengaturan.
      </div>

    </div>
    <div class="modal-footer">
      <button class="bu bgh" onclick="closeExportAllModal()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function copyExportAllCode() {
  const ta  = document.getElementById('export-all-code');
  const btn = document.getElementById('export-all-copy-btn');
  if (!ta) return;
  const doFallback = () => { ta.select(); document.execCommand('copy'); };
  try {
    navigator.clipboard.writeText(ta.value).then(() => {
      if (btn) { btn.textContent = '✓'; setTimeout(() => btn.textContent = '📋', 1500); }
      showToast('Kode disalin', 'success');
    }).catch(doFallback);
  } catch (_) { doFallback(); }
}

function closeExportAllModal() {
  document.getElementById('export-all-modal')?.remove();
}

// ── MODAL IMPORT SEMUA ────────────────────────────────────────────

function openImportCodeModal() {
  const html = `
<div class="modal-overlay" id="import-all-modal" onclick="if(event.target===this)closeImportAllModal()">
  <div class="modal-box" style="max-width:480px">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">📥 Import via Kode (Semua Pasien)</div>
        <div class="modal-sub">Paste kode dari Export via Kode di perangkat lain</div>
      </div>
      <button class="modal-close" onclick="closeImportAllModal()">✕</button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">

      <!-- Input kode -->
      <div>
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);
                      text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:5px">
          Kode Export Semua Pasien
        </label>
        <textarea id="import-all-input" placeholder="Paste kode di sini..."
          style="width:100%;background:var(--sf2);border:1px solid var(--bd2);border-radius:6px;
                 padding:8px;font-size:11px;font-family:var(--mono);color:var(--tx);
                 resize:vertical;height:80px;line-height:1.5;outline:none"
          oninput="importAllLiveValidate(this)"
          onfocus="this.style.borderColor='var(--room)'"
          onblur="this.style.borderColor='var(--bd2)'"></textarea>
        <div id="import-all-msg" style="font-size:10px;margin-top:4px;min-height:16px"></div>
      </div>

      <!-- Preview -->
      <div id="import-all-preview" style="display:none;background:rgba(16,185,129,.08);
           border:1px solid rgba(16,185,129,.25);border-radius:8px;padding:12px">
        <div style="font-size:11px;font-weight:600;color:#34d399;margin-bottom:8px">✓ Kode valid</div>
        <div id="import-all-preview-content" style="font-size:12px;color:var(--tx2)"></div>
      </div>

      <!-- Mode import -->
      <div id="import-all-mode" style="display:none;background:var(--sf2);border:1px solid var(--bd2);
           border-radius:8px;padding:12px">
        <div style="font-size:11px;font-weight:600;color:var(--tx);margin-bottom:10px">Mode Import</div>
        <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:10px">
          <input type="radio" name="import-mode" value="merge" checked style="margin-top:2px;flex-shrink:0">
          <div>
            <div style="font-size:12px;font-weight:500;color:var(--tx)">🔀 Merge — Gabungkan</div>
            <div style="font-size:10px;color:var(--mu);margin-top:2px">
              Pasien dari kode ditambahkan ke data yang ada. Bed sudah terisi akan dilewati.
            </div>
          </div>
        </label>
        <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">
          <input type="radio" name="import-mode" value="replace" style="margin-top:2px;flex-shrink:0">
          <div>
            <div style="font-size:12px;font-weight:500;color:var(--kritis)">🔄 Replace — Timpa Semua</div>
            <div style="font-size:10px;color:var(--mu);margin-top:2px">
              Semua data pasien yang ada akan dihapus dan diganti. Tidak bisa dikembalikan.
            </div>
          </div>
        </label>
      </div>

    </div>
    <div class="modal-footer">
      <button class="bu bp" id="import-all-btn" onclick="confirmImportAll()" style="display:none">
        📥 Import Sekarang
      </button>
      <button class="bu bgh" onclick="closeImportAllModal()">Batal</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => document.getElementById('import-all-input')?.focus(), 100);
}

let _importAllData = null;
let _importAllTimer = null;

function importAllLiveValidate(el) {
  clearTimeout(_importAllTimer);
  _importAllTimer = setTimeout(() => {
    const val = el.value.trim();
    const msg      = document.getElementById('import-all-msg');
    const preview  = document.getElementById('import-all-preview');
    const previewC = document.getElementById('import-all-preview-content');
    const modeDiv  = document.getElementById('import-all-mode');
    const importBtn = document.getElementById('import-all-btn');

    const reset = () => {
      _importAllData = null;
      if (preview) preview.style.display = 'none';
      if (modeDiv) modeDiv.style.display = 'none';
      if (importBtn) importBtn.style.display = 'none';
    };

    if (!val) { if (msg) msg.textContent = ''; reset(); return; }

    try {
      const payload = decodeAllPatientsCode(val);
      _importAllData = payload;

      // Hitung jumlah pasien
      let count = 0;
      for (const room of payload.rooms) {
        for (const kamar of room.kamar) {
          for (const bed of kamar.beds) {
            if (bed.patient) count++;
          }
        }
      }

      const expDate = payload.exportedAt
        ? new Date(payload.exportedAt).toLocaleString('id-ID', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
        : '—';

      if (msg) { msg.style.color = '#34d399'; msg.textContent = '✓ Format valid'; }
      if (preview) preview.style.display = 'block';
      if (modeDiv) modeDiv.style.display = 'block';
      if (importBtn) importBtn.style.display = 'inline-block';
      if (previewC) previewC.innerHTML = `
        <b>${count} pasien</b> dari ${esc(payload.hospitalName || '—')}<br>
        <span style="font-size:10px;color:var(--mu)">Diekspor: ${expDate}</span>`;
    } catch (_) {
      _importAllData = null;
      if (msg) { msg.style.color = 'var(--kritis)'; msg.textContent = '✗ Kode tidak valid'; }
      reset();
    }
  }, 300);
}

function confirmImportAll() {
  if (!_importAllData) return;
  const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';

  if (mode === 'replace') {
    showConfirm(
      '⚠️ Konfirmasi Replace',
      'Semua data pasien yang ada akan <strong>dihapus</strong> dan diganti dengan data dari kode ini. Tidak bisa dikembalikan!',
      () => _doImportAll(_importAllData, 'replace')
    );
  } else {
    _doImportAll(_importAllData, 'merge');
  }
}

function _doImportAll(payload, mode) {
  const d = getData();
  let saved = 0;
  let skipped = 0;

  if (mode === 'replace') {
    // Hapus semua pasien dari room yang ada, lalu isi dengan data baru
    // Pertahankan struktur room user (custom rooms tetap ada)
    for (const room of d.rooms) {
      for (const kamar of room.kamar) {
        for (const bed of kamar.beds) {
          bed.patient = null;
        }
      }
    }
    // Pasang pasien dari payload ke room yang match
    for (const srcRoom of payload.rooms) {
      const destRoom = d.rooms.find(r => r.id === srcRoom.id);
      if (!destRoom) continue;
      for (const srcKamar of srcRoom.kamar) {
        const destKamar = destRoom.kamar.find(k => k.id === srcKamar.id);
        if (!destKamar) continue;
        for (const srcBed of srcKamar.beds) {
          if (!srcBed.patient) continue;
          const destBed = destKamar.beds.find(b => b.id === srcBed.id);
          if (!destBed) { skipped++; continue; }
          destBed.patient = srcBed.patient;
          saved++;
        }
      }
    }
  } else {
    // Merge: hanya isi bed yang kosong
    for (const srcRoom of payload.rooms) {
      const destRoom = d.rooms.find(r => r.id === srcRoom.id);
      if (!destRoom) continue;
      for (const srcKamar of srcRoom.kamar) {
        const destKamar = destRoom.kamar.find(k => k.id === srcKamar.id);
        if (!destKamar) continue;
        for (const srcBed of srcKamar.beds) {
          if (!srcBed.patient) continue;
          const destBed = destKamar.beds.find(b => b.id === srcBed.id);
          if (!destBed) { skipped++; continue; }
          if (destBed.patient) { skipped++; continue; } // bed sudah terisi, skip
          destBed.patient = srcBed.patient;
          saved++;
        }
      }
    }
  }

  saveData();
  closeImportAllModal();
  renderSidebar();
  refreshCurrentView();

  const msg = skipped > 0 ? ` (${skipped} dilewati)` : '';
  showToast(`${saved} pasien berhasil diimport${msg}`, 'success', 5000);
  _importAllData = null;
}

function closeImportAllModal() {
  clearTimeout(_importAllTimer);
  _importAllData = null;
  document.getElementById('import-all-modal')?.remove();
}
