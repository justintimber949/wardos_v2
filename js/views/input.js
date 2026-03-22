/**
 * WardOS v2 — Input View (Single + Batch)
 */

let _batchParsed = []; // parsed batch results

function renderInputView() {
  const container = document.getElementById('v-input');
  if (!container) return;
  container.innerHTML = `
  <div class="mr">
    <div class="mtw">
      <button class="mto active" id="ms" onclick="switchMode('s')">Single</button>
      <button class="mto" id="mb" onclick="switchMode('b')">Batch / Laporan</button>
    </div>
    <div class="mh" id="mh">Satu pasien · teks cepat atau form lengkap</div>
  </div>

  <!-- SINGLE -->
  <div id="sv-s" class="tcol">
    <div>
      <!-- Step 1: Text Input -->
      <div class="cb">
        <div class="cbt"><span class="step-num">1</span>Input Teks <span class="ntag">BARU</span></div>
        <textarea class="ifl" id="single-text" rows="3" placeholder="Format slash (/ separator):\u000ANy. Lanita / 71 th / Kemuning 3D / DOC, Tumor Liver, Pneumonia / dr. Zain, Sp.PD, dr. Mulyati, Sp.P (DPJP IPD) / MRS 09/03 / KONSUL PARU 09/03 / PINDAHAN HCU-ICU 15\u000A\u000Aatau paste teks bebas — CPPT, resume IGD, laporan jaga, ERM export..."></textarea>
        <div class="ar">
          <button class="bu bp" onclick="doParseSlash()">⚡ Parse Slash</button>
          <span style="color:var(--mu);font-size:11px">|</span>
          <button class="bu bw" onclick="doGroqSingle()">✦ Groq AI Parse</button>
          <button class="bu bgh" onclick="document.getElementById('single-text').value=''">Hapus</button>
          <span style="font-size:10px;color:var(--mu)">→ auto-fill form di bawah</span>
        </div>
      </div>

      <!-- Step 2: Full Form -->
      <div class="cb">
        <div class="stg" onclick="toggleSection('input-form','cc-fm')">
          <div class="stg-t">🗂 Form Lengkap <span class="mtag">DIPERLUAS</span></div>
          <div class="stg-c" id="cc-fm">▲</div>
        </div>
        <div id="input-form" style="margin-top:10px">
          <div id="single-form-placeholder" style="text-align:center;padding:20px;color:var(--mu);font-size:12px">
            Parse teks di atas, atau <button class="bu bgh" style="font-size:11px;margin-left:5px" onclick="openFormModal(null,null,null)">Buka Form Kosong</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Guide -->
    <div>
      <div class="cb">
        <div class="cbt">📋 Format Slash</div>
        <div style="background:var(--sf2);border-radius:5px;padding:8px;font-family:var(--mono);font-size:10px;color:var(--tx2);line-height:2;border:1px solid var(--bd);margin-bottom:7px">
          Nama / Usia / <b style="color:#60a5fa">Ruangan Bed</b> / Dx1, Dx2 / dr. X Sp.Y (DPJP SP) / MRS DD/MM / KONSUL SP TGL / PINDAHAN A-B / STATUS
        </div>
        <div style="font-size:11px;color:var(--mu);line-height:2">
          <span style="font-family:var(--mono);background:var(--sf2);padding:0 4px;border-radius:3px;font-size:10px">Kemuning 3D</span> → Room + Bed<br>
          <span style="font-family:var(--mono);background:var(--sf2);padding:0 4px;border-radius:3px;font-size:10px">(DPJP IPD)</span> → primary dok + bid.<br>
          <span style="font-family:var(--mono);background:var(--sf2);padding:0 4px;border-radius:3px;font-size:10px">KONSUL PARU 09/03</span> → tag konsul<br>
          <span style="font-family:var(--mono);background:var(--sf2);padding:0 4px;border-radius:3px;font-size:10px">PINDAHAN HCU-ICU 15</span> → trail<br>
          <span style="font-family:var(--mono);background:var(--sf2);padding:0 4px;border-radius:3px;font-size:10px">KRS / MENINGGAL</span> → set status
        </div>
      </div>
      <div class="cb">
        <div class="cbt" style="color:#fbbf24">🔄 Pindah Bed <span class="ntag">BARU</span></div>
        <div style="font-size:11px;color:var(--tx2);line-height:1.9">
          <strong>Konfirmasi 1:</strong> Pilih bed tujuan<br>
          ↳ Jika kosong → langsung pindah ✓<br>
          ↳ Jika terisi → Konfirmasi 2<br>
          → trail dicatat di kedua pasien
        </div>
      </div>
      <div class="cb">
        <div class="cbt" style="color:#60a5fa;font-size:11px">⬤ Status Warna</div>
        <div style="display:flex;flex-direction:column;gap:7px;font-size:11px">
          <div style="display:flex;align-items:center;gap:8px"><span class="sdot stabil"></span><span style="color:var(--tx2)">🟢 Stabil — hijau solid</span></div>
          <div style="display:flex;align-items:center;gap:8px"><span class="sdot perhatian"></span><span style="color:var(--tx2)">🟡 Perhatian — kuning kedip pelan</span></div>
          <div style="display:flex;align-items:center;gap:8px"><span class="sdot kritis"></span><span style="color:var(--tx2)">🔴 Kritis — merah kedip cepat</span></div>
          <div style="display:flex;align-items:center;gap:8px"><span class="sdot krs"></span><span style="color:var(--tx2)">⚫ KRS — abu solid</span></div>
          <div style="display:flex;align-items:center;gap:8px"><span class="sdot meninggal"></span><span style="color:var(--tx2)">⚫ Meninggal — hitam solid</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- BATCH -->
  <div id="sv-b" class="tcol" style="display:none">
    <div>
      <div class="cb">
        <div class="cbt">📋 Paste Laporan Operan / KONRU <span class="mtag">4 FORMAT</span></div>
        <textarea class="ifl" id="batch-text" style="min-height:130px" placeholder="Paste laporan apapun — semua format dikenali:\u000AFormat A: 📌 *KRISAN (7 PASIEN)* · 🍎 Nama/Bed/Dx/dr. X (OB 12/02)\u000AFormat B: *KRISAN: 2 PASIEN* · 1. Nama/usia/Bed/Dx/dr. X 🔥\u000AFormat C: *PINDAH RUANGAN (1 pasien)* · *KEMUNING (7 pasien)* (stase Paru)\u000AFormat D: Kelas 1 (1 pasien) · 1. 🔴Nama/usia/VK-3/Dx/dr. X (ObGyn)\u000A\u000AParser manual auto-detect · Groq fallback · Tips: paste langsung dari WhatsApp"></textarea>
        <div class="ar">
          <button class="bu bp" onclick="doParseBatch()">⚡ Parse Manual (auto-detect)</button>
          <button class="bu bw" onclick="doGroqBatch()">✦ Groq + Parse</button>
          <button class="bu bgh" onclick="document.getElementById('batch-text').value=''">Hapus</button>
        </div>
      </div>
      <div class="cb" id="batch-preview" style="display:none">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
          <div style="font-size:12px;font-weight:600;color:var(--tx2);flex:1">Preview — pilih pasien yang ingin disimpan</div>
          <label style="font-size:11px;color:var(--mu);cursor:pointer;display:flex;align-items:center;gap:4px">
            <input type="checkbox" id="batch-select-all" onchange="batchToggleAll(this.checked)"> Pilih semua aktif
          </label>
        </div>
        <div style="overflow-x:auto">
          <table class="btt">
            <thead><tr><th></th><th>Nama</th><th>Ruangan</th><th>Bed</th><th>Diagnosa</th><th>Tim Dokter</th><th>Status</th><th></th></tr></thead>
            <tbody id="batch-table-body"></tbody>
          </table>
        </div>
        <div class="ar" style="margin-top:9px">
          <button class="bu bp" onclick="saveBatchSelected()">💾 Simpan Terpilih (<span id="batch-count">0</span>)</button>
          <button class="bu bgh" onclick="document.getElementById('batch-preview').style.display='none';_batchConflicts={}">Batal</button>
          <span style="font-size:11px;color:var(--mu)">KRS/Meninggal tidak dicentang otomatis</span>
        </div>
      </div>
    </div>

    <!-- Right: Guide -->
    <div>
      <div class="cb">
        <div class="cbt">📚 Panduan Batch</div>
        <div style="font-size:11px;color:var(--tx2);line-height:1.6">
          Paste laporan operan dari WA. Sistem akan otomatis mendeteksi format:
          <ul style="margin:8px 10px;padding-left:15px;color:var(--mu)">
            <li style="margin-bottom:5px"><b>Format A:</b> Emoji (🍎, 🍏) untuk pemetaan DPJP otomatis.</li>
            <li style="margin-bottom:5px"><b>Format B:</b> Nomor urut (1. 2.) + emoji 🔥 untuk status Kritis.</li>
            <li style="margin-bottom:5px"><b>Format C:</b> Header khusus (KEMUNING) & tag (DPJP PARU).</li>
            <li style="margin-bottom:5px"><b>Format D:</b> Berbasis Kelas/VK (ObGyn).</li>
          </ul>
          <p style="margin-top:10px;padding:8px;background:rgba(96,165,250,0.1);border-radius:5px;border:1px solid rgba(96,165,250,0.2)">
            <b>Tips:</b> Jika format tidak rapi, gunakan <b>Groq AI</b> untuk hasil ekstraksi yang lebih akurat.
          </p>
        </div>
      </div>
      <div class="cb">
        <div class="cbt" style="color:#10b981;font-size:11px">⬤ Smart Mapping</div>
        <div style="font-size:11px;color:var(--mu);line-height:1.6">
          Nama dokter yang muncul ganda di DPJP dan Tim Dokter akan otomatis dibersihkan (de-duplikasi).
        </div>
      </div>
    </div>
  </div>`;

  updateTopbar('➕ Input Pasien', 'Single atau Batch laporan operan', '');
}

function switchMode(m) {
  document.getElementById('ms').classList.toggle('active', m === 's');
  document.getElementById('mb').classList.toggle('active', m === 'b');
  document.getElementById('sv-s').style.display = m === 's' ? 'grid' : 'none';
  document.getElementById('sv-b').style.display = m === 'b' ? 'grid' : 'none';
  document.getElementById('mh').textContent = m === 's'
    ? 'Satu pasien · teks cepat atau form lengkap'
    : 'Paste laporan operan → extract semua pasien sekaligus';
}

function toggleSection(contentId, chevronId) {
  const el = document.getElementById(contentId);
  const c = document.getElementById(chevronId);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (c) c.textContent = open ? '▼' : '▲';
}

// ── SINGLE PARSE ─────────────────────────────────────────────────
function doParseSlash() {
  const text = document.getElementById('single-text')?.value?.trim();
  if (!text) { showToast('Input teks dulu', 'warn'); return; }
  try {
    const result = parseSlash(text);
    if (!result) { showToast('Gagal parse — cek format slash', 'error'); return; }
    showToast('Parse berhasil — buka form', 'success');
    openFormWithData(result, result._roomId, result._bedId);
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
  }
}

async function doGroqSingle() {
  const text = document.getElementById('single-text')?.value?.trim();
  if (!text) { showToast('Input teks dulu', 'warn'); return; }
  showToast('Menghubungi Groq AI...', 'info', 8000);
  try {
    const result = await groqParseSingle(text);
    showToast('Groq parse berhasil', 'success');
    openFormWithData(result, result._roomId, result._bedId);
  } catch(e) {
    showToast('Groq error: ' + e.message, 'error', 5000);
  }
}

// ── BATCH PARSE ───────────────────────────────────────────────────
function doParseBatch() {
  const text = document.getElementById('batch-text')?.value?.trim();
  if (!text) { showToast('Paste laporan dulu', 'warn'); return; }
  try {
    _batchParsed = parseBatch(text);
    if (!_batchParsed.length) { showToast('Tidak ada pasien terdeteksi', 'warn'); return; }
    renderBatchPreview();
    showToast(`${_batchParsed.length} pasien terdeteksi`, 'success');
  } catch(e) {
    showToast('Error parse: ' + e.message, 'error');
  }
}

async function doGroqBatch() {
  const text = document.getElementById('batch-text')?.value?.trim();
  if (!text) { showToast('Paste laporan dulu', 'warn'); return; }
  showToast('Groq memproses batch...', 'info', 15000);
  try {
    _batchParsed = await groqParseBatch(text);
    renderBatchPreview();
    showToast(`${_batchParsed.length} pasien diekstrak via Groq`, 'success');
  } catch(e) {
    showToast('Groq batch error: ' + e.message, 'error', 5000);
  }
}

function renderBatchPreview() {
  const preview = document.getElementById('batch-preview');
  const tbody   = document.getElementById('batch-table-body');
  if (!preview || !tbody) return;

  tbody.innerHTML = _batchParsed.map((p, i) => {
    const conflict   = _batchConflicts[i];
    const isInactive = ['krs','meninggal','lepas_rawat'].includes(p.status);
    let rowCls = p.status === 'kritis' ? 'rk' : p.status === 'perhatian' ? 'rp' : isInactive ? 'rkrs' : '';
    if (conflict) rowCls = 'rkonfl';

    const checked  = !isInactive && !conflict ? 'checked' : '';
    const roomName = p._roomId ? (getRoom(p._roomId)?.name || `⚠ ${p._roomId}`) : '—';

    // Conflict badge
    let conflictBadge = '';
    if (conflict) {
      const reasonMap = {
        INVALID:   conflict.reason || 'Lokasi tidak valid',
        OCCUPIED:  `Bed terisi (${esc(conflict.ep?.patient?.nama?.split(' ').slice(-1)[0] || '?')})`,
        DUPLICATE: `Nama sama sudah aktif di ${esc(conflict.ep?.room?.name || '?')} · ${esc(conflict.ep?.bed?.name || '?')}`,
      };
      const reason = reasonMap[conflict.type] || 'Konflik';
      conflictBadge = `<div style="font-size:9px;color:var(--kritis);font-family:var(--mono);
        margin-top:2px;line-height:1.5">⚠ ${reason}<br>
        <span style="color:var(--mu)">Edit bed di sini atau klik ✏️</span></div>`;
    }

    const roomCell = (conflict?.type === 'INVALID' && !getRoom(p._roomId))
      ? `<span style="color:var(--kritis);font-size:11px">⚠ ${esc(p._roomId || '—')}</span>`
      : `<span style="font-size:11px">${esc(roomName)}</span>`;

    return `
    <tr class="${rowCls}" data-idx="${i}">
      <td><input type="checkbox" class="batch-cb" data-idx="${i}" ${checked}
          ${conflict ? 'disabled title="Perbaiki konflik dulu"' : ''}
          onchange="updateBatchCount()"></td>
      <td>${esc(p.nama)} <span style="font-size:10px;color:var(--mu)">${p.usia||''}${p.jk?' · '+p.jk:''}</span>
          ${conflictBadge}</td>
      <td>${roomCell}</td>
      <td><input class="ifp" value="${esc(p._bedId||'')}" placeholder="bed"
          style="width:64px;font-size:11px;${conflict ? 'border-color:rgba(239,68,68,.5);background:rgba(239,68,68,.05)' : ''}"
          onchange="_batchParsed[${i}]._bedId=this.value.trim();delete _batchConflicts[${i}];renderBatchPreview()"></td>
      <td style="max-width:180px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.diagnosisUtama)}</div></td>
      <td style="max-width:140px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.dpjp?.nama||'—')}</div></td>
      <td><div style="display:flex;align-items:center;gap:4px"><span class="sdot ${p.status}"></span>
          <span style="font-size:10px;font-family:var(--mono);color:${getStatusColor(p.status)}">${statusLabel(p.status).toUpperCase()}</span></div></td>
      <td><button class="bu bgh" style="font-size:10px;padding:2px 5px" onclick="editBatchRow(${i})">✏️</button></td>
    </tr>`;
  }).join('');

  // Banner konflik
  let bannerEl = document.getElementById('batch-conflict-banner');
  const conflictCount = Object.keys(_batchConflicts).length;
  if (conflictCount > 0) {
    if (!bannerEl) {
      bannerEl = document.createElement('div');
      bannerEl.id = 'batch-conflict-banner';
      const table = preview.querySelector('.btt');
      if (table) table.parentNode.insertBefore(bannerEl, table);
    }
    bannerEl.innerHTML = `
    <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:6px;
                padding:10px 12px;margin-bottom:10px;font-size:11px;color:var(--tx2);line-height:1.8">
      <b style="color:var(--kritis)">⚠ ${conflictCount} baris perlu diperbaiki</b> — ubah bed di kolom merah, atau klik ✏️ edit lengkap, lalu klik Simpan Terpilih lagi.
    </div>`;
  } else if (bannerEl) {
    bannerEl.remove();
  }

  preview.style.display = 'block';
  updateBatchCount();
}

function getStatusColor(status) {
  const m = { kritis:'#f87171', perhatian:'#fbbf24', stabil:'#34d399', krs:'#9ca3af', meninggal:'#fca5a5' };
  return m[status] || m.stabil;
}

function updateBatchCount() {
  const count = document.querySelectorAll('.batch-cb:checked').length;
  const el = document.getElementById('batch-count');
  if (el) el.textContent = count;
}

function batchToggleAll(checked) {
  document.querySelectorAll('.batch-cb').forEach(cb => {
    const idx = parseInt(cb.dataset.idx);
    const p = _batchParsed[idx];
    const isInactive = ['krs','meninggal','lepas_rawat'].includes(p?.status);
    cb.checked = checked && !isInactive;
  });
  updateBatchCount();
}

function editBatchRow(idx) {
  const p = _batchParsed[idx];
  openFormWithData(p, p._roomId, p._bedId, idx, (editedIdx, updatedPatient) => {
    _batchParsed[editedIdx] = updatedPatient;
    renderBatchPreview();
  });
}



function findExistingActivePatient(batchP) {
  const norm = normalizeName(batchP.nama);
  const age = parseInt(batchP.usia);
  if (!norm || !age) return null; // Harus ada nama dan umur untuk deteksi duplikat strict
  
  for (const room of getData().rooms) {
    for (const k of room.kamar) {
      for (const b of k.beds) {
        const occ = b.patient;
        if (occ && !['krs','meninggal','lepas_rawat'].includes(occ.status)) {
          const occNorm = normalizeName(occ.nama);
          const occAge = parseInt(occ.usia);
          if (occNorm === norm && occAge === age) {
            return { room, bed: b, patient: occ };
          }
        }
      }
    }
  }
  return null;
}

// Map idx → conflict info, dipakai renderBatchPreview untuk tampilkan warning
let _batchConflicts = {};

function saveBatchSelected() {
  const readyToSave = [];
  const conflicts   = [];
  const claimedBeds = new Set();

  document.querySelectorAll('.batch-cb:checked').forEach(cb => {
    const idx = parseInt(cb.dataset.idx);
    const p   = _batchParsed[idx];
    if (!p) return;

    // 1. Duplikat nama+usia
    const existing = findExistingActivePatient(p);
    if (existing) {
      conflicts.push({ type: 'DUPLICATE', bp: p, ep: existing, idx });
      return;
    }

    // 2. Ruangan/bed tidak valid di konfigurasi
    const room  = getRoom(p._roomId);
    const found = room && p._bedId ? findBed(p._roomId, p._bedId) : null;
    if (!room) {
      conflicts.push({ type: 'INVALID', bp: p, idx,
        reason: p._roomId
          ? `Ruangan "${p._roomId}" tidak ada di konfigurasi`
          : 'Ruangan belum diisi' });
      return;
    }
    if (!p._bedId) {
      conflicts.push({ type: 'INVALID', bp: p, idx, reason: 'Bed belum diisi' });
      return;
    }
    if (!found) {
      conflicts.push({ type: 'INVALID', bp: p, idx,
        reason: `Bed "${p._bedId}" tidak ada di ${room.name}` });
      return;
    }

    // 3. Bed terisi pasien aktif
    const occ    = found.bed.patient;
    const isEmpty = !occ || ['krs','meninggal','lepas_rawat'].includes(occ.status);
    if (!isEmpty) {
      conflicts.push({ type: 'OCCUPIED', bp: p,
        ep: { room, bed: found.bed, patient: occ }, idx });
      return;
    }

    // 4. Klaim ganda dalam satu batch
    const locKey = `${p._roomId}|${p._bedId}`;
    if (claimedBeds.has(locKey)) {
      conflicts.push({ type: 'INVALID', bp: p, idx, reason: 'Bed dipilih ganda' });
      return;
    }

    claimedBeds.add(locKey);
    readyToSave.push({ patient: p, roomId: p._roomId, bedId: p._bedId });
  });

  if (!readyToSave.length && !conflicts.length) {
    showToast('Pilih minimal 1 pasien', 'warn'); return;
  }

  if (conflicts.length > 0) {
    // Tandai baris konflik di preview (visual hint)
    _batchConflicts = {};
    conflicts.forEach(c => { _batchConflicts[c.idx] = c; });
    renderBatchPreview();

    // Buka resolve modal dengan callback
    startResolvingBatch(
      readyToSave,
      conflicts,
      // onFinish — semua konflik diselesaikan, simpan semua
      (resolvedList) => {
        _batchConflicts = {};
        document.getElementById('batch-preview').style.display = 'none';
        document.getElementById('batch-text').value = '';
        finishSaveBatch(resolvedList);
      },
      // onCancel — kembali ke preview dengan indikator konflik
      () => {
        const preview = document.getElementById('batch-preview');
        if (preview) preview.style.display = 'block';
        showToast('Penyimpanan dibatalkan — perbaiki konflik di preview', 'warn');
      }
    );
    return;
  }

  // Tidak ada konflik → langsung simpan
  _batchConflicts = {};
  document.getElementById('batch-preview').style.display = 'none';
  document.getElementById('batch-text').value = '';
  finishSaveBatch(readyToSave);
}

function finishSaveBatch(resolvedList) {
  saveBatchPatients(resolvedList);
  _batchParsed = [];
  _batchConflicts = {};
}

function finishSaveBatch(resolvedList) {
  saveBatchPatients(resolvedList);
  _batchParsed = [];
}
