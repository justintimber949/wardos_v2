/**
 * WardOS v2 — Modal: Patient Detail + Form Input
 */

let _batchEditIdx = -1;
let _batchEditCallback = null; // callback(idx, patient) setelah edit batch row

// ── PATIENT DETAIL MODAL ──────────────────────────────────────────
function openPatientModal(roomId, bedId) {
  const patient = getPatient(roomId, bedId);
  if (!patient) return;
  const room = getRoom(roomId);
  const found = findBed(roomId, bedId);
  const bedName = found ? found.bed.name : bedId;
  const todayTags = getTodayTags(patient);
  const isInactive = ['krs','meninggal','lepas_rawat'].includes(patient.status);

  const html = `
<div class="modal-overlay" id="patient-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title" style="${isInactive?'text-decoration:line-through;color:var(--tx2)':''}">${esc(patient.nama)} <span style="font-weight:400;font-size:13px;color:var(--mu)">${patient.usia?patient.usia+'th':''}${patient.jk?' · '+patient.jk:''}</span></div>
        <div class="modal-sub">${esc(room?.name||roomId)} · Bed ${esc(bedName)} ${renderLOSBadge(patient.tglMRS)} ${todayTags}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${statusDotHtml(patient.status)}
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
    </div>
    <div class="modal-body">

      <!-- Identitas -->
      <div class="msec">
        <div class="msec-title">Identitas</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Status Klinis</div><div class="info-value">${statusLabel(patient.status)}</div></div>
          <div class="info-item"><div class="info-label">No. RM</div><div class="info-value">${esc(patient.noRM)||'—'}</div></div>
          <div class="info-item"><div class="info-label">Tgl MRS</div><div class="info-value">${formatTglMRS(patient.tglMRS)}${patient._mrsAutoSet ? ' <span style="font-size:9px;color:var(--mu);font-family:var(--mono)">(auto)</span>' : ''}</div></div>
          <div class="info-item"><div class="info-label">Lokasi</div><div class="info-value">${esc(room?.name||roomId)} / ${esc(bedName)}</div></div>
        </div>
      </div>

      <!-- Tim Dokter -->
      <div class="msec">
        <div class="msec-title">Tim Dokter</div>
        <div style="font-size:12px;line-height:2">${formatDoctorLine(patient.dpjp, patient.timDokter, patient.konsul)}</div>
      </div>

      <!-- Diagnosis -->
      <div class="msec">
        <div class="msec-title">Diagnosis</div>
        <div style="font-size:13px;font-weight:600;color:var(--tx);margin-bottom:4px">${esc(patient.diagnosisUtama)}</div>
        ${patient.diagnosisSekunder?.length ? `<div style="font-size:11px;color:var(--tx2)">${patient.diagnosisSekunder.map(esc).join(', ')}</div>` : ''}
      </div>

      <!-- Pindahan Trail -->
      ${patient.pindahan?.length ? `
      <div class="msec">
        <div class="msec-title">Riwayat Pindahan</div>
        ${renderTrail(patient.pindahan)}
      </div>` : ''}

      <!-- Vital Signs -->
      ${patient.vital && Object.values(patient.vital).some(v=>v) ? `
      <div class="msec">
        <div class="msec-title">Tanda-Tanda Vital</div>
        <div class="vitals-row">
          ${patient.vital.td ? `<div class="vital-chip"><div class="v-label">TD</div><div class="v-value">${esc(patient.vital.td)}</div></div>` : ''}
          ${patient.vital.hr ? `<div class="vital-chip ${patient.vital.hr>150?'abn':patient.vital.hr>100?'warn':''}"><div class="v-label">HR</div><div class="v-value">${patient.vital.hr}</div></div>` : ''}
          ${patient.vital.rr ? `<div class="vital-chip ${patient.vital.rr>35?'abn':patient.vital.rr>25?'warn':''}"><div class="v-label">RR</div><div class="v-value">${patient.vital.rr}</div></div>` : ''}
          ${patient.vital.spo2 ? `<div class="vital-chip ${patient.vital.spo2<90?'abn':patient.vital.spo2<95?'warn':''}"><div class="v-label">SpO₂</div><div class="v-value">${patient.vital.spo2}%</div></div>` : ''}
          ${patient.vital.suhu ? `<div class="vital-chip ${patient.vital.suhu>38?'warn':''}"><div class="v-label">Suhu</div><div class="v-value">${patient.vital.suhu}°</div></div>` : ''}
          ${patient.vital.o2 ? `<div class="vital-chip"><div class="v-label">O₂</div><div class="v-value" style="font-size:11px">${esc(patient.vital.o2)}</div></div>` : ''}
        </div>
      </div>` : ''}

      <!-- Lab -->
      ${patient.lab && Object.entries(patient.lab).some(([k,v])=>k!=='extra'&&v) ? `
      <div class="msec">
        <div class="msec-title">Laboratorium</div>
        <div class="lab-grid">
          ${renderLabItem('Hb',patient.lab.hb)}
          ${renderLabItem('WBC',patient.lab.wbc)}
          ${renderLabItem('GDA',patient.lab.gda)}
          ${renderLabItem('Kreatinin',patient.lab.kreatinin)}
          ${renderLabItem('Ureum',patient.lab.ureum)}
          ${renderLabItem('Na',patient.lab.na)}
          ${renderLabItem('K',patient.lab.k)}
          ${renderLabItem('Albumin',patient.lab.albumin)}
          ${(patient.lab.extra||[]).map(e=>`<div class="lab-item"><div class="lab-label">${esc(e.nama)}</div><div class="lab-value ${e.flag||''}">${esc(e.nilai)}<span style="font-size:9px;color:var(--mu)"> ${esc(e.satuan||'')}</span></div></div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Terapi -->
      ${patient.terapi?.length ? `
      <div class="msec">
        <div class="msec-title">Terapi Aktif</div>
        <div class="terapi-list">${patient.terapi.map(t=>`<span class="terapi-item">${esc(t)}</span>`).join('')}</div>
      </div>` : ''}

      <!-- CPPT -->
      ${patient.cppt ? `
      <div class="msec">
        <div class="msec-title">CPPT / Catatan Perkembangan</div>
        <div class="cppt-box">${esc(patient.cppt)}</div>
      </div>` : ''}

      <!-- Catatan Status Klinis (KRS / Meninggal / LOS) -->
      ${(patient.tglKRS || patient.tglMeninggal || patient.tglMRS) ? `
      <div class="msec">
        <div class="msec-title">Riwayat Status</div>
        <div class="info-grid">
          ${patient.tglMRS ? `
          <div class="info-item">
            <div class="info-label">Tanggal MRS</div>
            <div class="info-value">${formatTglMRS(patient.tglMRS)}
              ${patient._mrsAutoSet ? '<span style="font-size:9px;color:var(--mu);font-family:var(--mono)"> (auto)</span>' : ''}
              ${(() => { const los = calcLOS(patient.tglMRS); return los ? ` <span class="los-badge ${los.cls}">${los.label}</span>` : ''; })()}
            </div>
          </div>` : ''}
          ${patient.tglKRS ? `
          <div class="info-item" style="border-left:2px solid var(--krs)">
            <div class="info-label">✅ Tanggal KRS</div>
            <div class="info-value" style="color:#9ca3af">${formatDateTimeLocal(patient.tglKRS)}</div>
          </div>` : ''}
          ${patient.tglMeninggal ? `
          <div class="info-item" style="border-left:2px solid #5a1010">
            <div class="info-label">🖤 Waktu Meninggal</div>
            <div class="info-value" style="color:#fca5a5">${formatDateTimeLocal(patient.tglMeninggal)}</div>
          </div>` : ''}
        </div>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="bu bgh" onclick="openDetailModal('${esc(roomId)}','${esc(bedId)}')">👁 Lihat Detail</button>
      <button class="bu bp" onclick="openFormModal('${esc(roomId)}','${esc(bedId)}')">✏️ Edit</button>
      <button class="bu bgh" style="color:var(--phat);border-color:rgba(245,158,11,.3)" onclick="initMoveBed('${esc(roomId)}','${esc(bedId)}')">🔄 Pindah Bed</button>
      ${!isInactive ? `<button class="bu bgh" style="color:#9ca3af;border-color:rgba(75,83,99,.4)" onclick="initSetKRS('${esc(roomId)}','${esc(bedId)}')">✅ KRS</button>` : ''}
      ${!isInactive ? `<button class="bu brd" style="color:#fca5a5;background:rgba(127,29,29,.15);border-color:rgba(150,40,40,.3)" onclick="initSetMeninggal('${esc(roomId)}','${esc(bedId)}')">🖤 Meninggal</button>` : ''}
      ${isInactive ? `<button class="bu brd" onclick="initCleanBed('${esc(roomId)}','${esc(bedId)}')">🧹 Bersihkan Bed</button>` : ''}
      <div style="flex:1"></div>
      <button class="bu bw" style="font-size:11px" onclick="openAIPanel('${esc(roomId)}','${esc(bedId)}','rec')">✦ AI Hari Ini</button>
      ${isInactive ? `<button class="bu bw" style="font-size:11px" onclick="openAIPanel('${esc(roomId)}','${esc(bedId)}','discharge')">✦ Discharge Summary</button>` : ''}
      <button class="bu bgh" style="font-size:11px" onclick="openFotoModal('${esc(roomId)}','${esc(bedId)}')">🖼 Foto Lab</button>
      <button class="bu bgh" style="font-size:11px" onclick="showPatientQR('${esc(roomId)}','${esc(bedId)}')">📱 Bagikan</button>
      <button class="bu bgh" onclick="closeModal()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function renderLabItem(label, value) {
  if (!value) return '';
  return `<div class="lab-item"><div class="lab-label">${label}</div><div class="lab-value">${esc(value)}</div></div>`;
}

function closeModal() {
  ['patient-modal','form-modal','confirm-modal','move-modal','foto-modal','qr-modal','ai-panel-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

// ── HELPER: Format tanggal lokal yang readable ────────────────────
function formatDateTimeLocal(isoStr) {
  const d = isoStr ? new Date(isoStr) : new Date();
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const dayName = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${dayName}, ${date} ${month} ${year} pukul ${hh}:${mm}`;
}

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────
function showConfirm(title, msg, onConfirm, onCancel) {
  const old = document.getElementById('confirm-modal');
  if (old) old.remove();
  const html = `
<div class="confirm-overlay" id="confirm-modal">
  <div class="confirm-box">
    <div class="confirm-title">${esc(title)}</div>
    <div class="confirm-msg">${msg}</div>
    <div class="confirm-actions">
      <button class="bu bgh" id="confirm-cancel">Batal</button>
      <button class="bu brd" id="confirm-ok">Lanjut</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('confirm-ok').onclick = () => {
    document.getElementById('confirm-modal')?.remove();
    onConfirm && onConfirm();
  };
  document.getElementById('confirm-cancel').onclick = () => {
    document.getElementById('confirm-modal')?.remove();
    onCancel && onCancel();
  };
}

// ── SET STATUS KRS ────────────────────────────────────────────────
function initSetKRS(roomId, bedId) {
  closeModal();
  const patient = getPatient(roomId, bedId);
  if (!patient) return;
  const now = new Date();
  const dtStr = formatDateTimeLocal(now.toISOString());
  const todayStr = getTodayStr();

  showConfirm(
    '✅ Konfirmasi KRS',
    `Pasien <strong>${esc(patient.nama)}</strong> akan ditandai <strong>KRS</strong>.<br><br>Tanggal KRS akan otomatis dicatat:<br><span style="font-family:var(--mono);font-size:11px;color:#34d399">${dtStr}</span>`,
    () => {
      showConfirm(
        '✅ Konfirmasi Akhir KRS',
        `Yakin pasien <strong>${esc(patient.nama)}</strong> KRS hari ini (${todayStr})?<br><br><span style="font-size:11px;color:var(--mu)">Status akan berubah ke KRS dan tanggal tersimpan otomatis.</span>`,
        () => {
          patient.status = 'krs';
          patient.tglKRS = now.toISOString();
          patient.updatedAt = now.toISOString();
          setPatient(roomId, bedId, patient);
          showToast(`KRS dicatat — ${formatDateTimeLocal(now.toISOString())}`, 'success', 4000);
          renderSidebar();
          refreshCurrentView();
        }
      );
    }
  );
}

// ── SET STATUS MENINGGAL ──────────────────────────────────────────
function initSetMeninggal(roomId, bedId) {
  closeModal();
  const patient = getPatient(roomId, bedId);
  if (!patient) return;
  const now = new Date();
  const dtStr = formatDateTimeLocal(now.toISOString());
  const todayStr = getTodayStr();

  showConfirm(
    '🖤 Konfirmasi Meninggal',
    `Pasien <strong>${esc(patient.nama)}</strong> akan ditandai <strong>Meninggal</strong>.<br><br>Tanggal & waktu akan otomatis dicatat:<br><span style="font-family:var(--mono);font-size:11px;color:#fca5a5">${dtStr}</span>`,
    () => {
      showConfirm(
        '🖤 Konfirmasi Akhir',
        `Yakin pasien <strong>${esc(patient.nama)}</strong> meninggal pada ${dtStr}?<br><br><span style="font-size:11px;color:var(--mu)">Status akan berubah ke Meninggal dan waktu tersimpan otomatis.</span>`,
        () => {
          patient.status = 'meninggal';
          patient.tglMeninggal = now.toISOString();
          patient.updatedAt = now.toISOString();
          setPatient(roomId, bedId, patient);
          showToast(`Meninggal dicatat — ${formatDateTimeLocal(now.toISOString())}`, 'warn', 5000);
          renderSidebar();
          refreshCurrentView();
        }
      );
    }
  );
}

// ── CLEAN BED (2x confirm) ────────────────────────────────────────
function initCleanBed(roomId, bedId) {
  closeModal();
  showConfirm(
    '🧹 Bersihkan Bed',
    'Hapus data pasien dan kosongkan bed ini? Data riwayat akan hilang.',
    () => {
      showConfirm(
        '⚠️ Konfirmasi Akhir',
        'Data <strong>TIDAK BISA dikembalikan</strong> setelah ini. Yakin ingin menghapus?',
        () => {
          clearBed(roomId, bedId);
          saveData();
          showToast('Bed dikosongkan', 'success');
          renderSidebar();
          refreshCurrentView();
        }
      );
    }
  );
}

// ── MOVE BED ──────────────────────────────────────────────────────
function initMoveBed(fromRoomId, fromBedId) {
  closeModal();
  const d = getData();
  const roomOptions = d.rooms.map(r =>
    `<option value="${r.id}">${esc(r.name)}</option>`
  ).join('');

  const html = `
<div class="confirm-overlay" id="move-modal">
  <div class="confirm-box" style="max-width:440px">
    <div class="confirm-title">🔄 Pindah Bed</div>
    <div class="confirm-msg">Pilih ruangan dan bed tujuan untuk pasien ini.</div>
    <div class="g2" style="margin-bottom:10px">
      <div class="fg">
        <label>Ruangan Tujuan</label>
        <select class="ifp" id="move-room" onchange="updateMoveBedSelect()">${roomOptions}</select>
      </div>
      <div class="fg">
        <label>Bed Tujuan</label>
        <select class="ifp" id="move-bed"><option>— pilih ruangan dulu —</option></select>
      </div>
    </div>
    <div class="confirm-actions">
      <button class="bu bgh" onclick="document.getElementById('move-modal').remove()">Batal</button>
      <button class="bu bp" onclick="confirmMoveBed('${fromRoomId}','${fromBedId}')">Pindahkan</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  updateMoveBedSelect();
}

function updateMoveBedSelect() {
  const roomId = document.getElementById('move-room')?.value;
  const bedSel = document.getElementById('move-bed');
  if (!bedSel || !roomId) return;
  const emptyBeds = getEmptyBeds(roomId);
  const room = getRoom(roomId);
  if (!emptyBeds.length) {
    bedSel.innerHTML = '<option value="">— tidak ada bed kosong —</option>';
    return;
  }
  bedSel.innerHTML = emptyBeds.map(eb =>
    `<option value="${eb.bed.id}">${esc(eb.kamarName)} · ${esc(eb.bed.name)}</option>`
  ).join('');
}

function confirmMoveBed(fromRoomId, fromBedId) {
  const toRoomId = document.getElementById('move-room')?.value;
  const toBedId = document.getElementById('move-bed')?.value;
  if (!toRoomId || !toBedId || toBedId === '') {
    showToast('Pilih bed tujuan yang valid', 'error'); return;
  }
  // Check if target bed is occupied
  const existing = getPatient(toRoomId, toBedId);
  if (existing) {
    // Show dialog 2: where to move existing patient
    document.getElementById('move-modal')?.remove();
    showConfirm(
      '⚠️ Bed Tujuan Terisi',
      `Bed ini sudah diisi oleh <strong>${esc(existing.nama)}</strong>. Tidak bisa pindah ke bed yang sudah terisi.<br><br>Pilih bed kosong lain.`,
      () => initMoveBed(fromRoomId, fromBedId)
    );
    return;
  }
  const ok = moveBed(fromRoomId, fromBedId, toRoomId, toBedId);
  document.getElementById('move-modal')?.remove();
  if (ok) {
    const room = getRoom(toRoomId);
    showToast(`Pasien dipindahkan ke ${room?.name} · ${toBedId}`, 'success');
    renderSidebar();
    refreshCurrentView();
  } else {
    showToast('Gagal memindahkan pasien', 'error');
  }
}

// ── FORM MODAL ────────────────────────────────────────────────────
let _formRoomId = null, _formBedId = null, _formPatient = null;

// ── DETAIL MODAL (READ-ONLY) ──────────────────────────────────────
/**
 * Tampilkan semua data pasien dalam layout form-like tapi 100% read-only.
 * Tidak ada input yang bisa diubah, tidak ada tombol Simpan.
 */
function openDetailModal(roomId, bedId) {
  const patient = getPatient(roomId, bedId);
  if (!patient) return;
  const room  = getRoom(roomId);
  const found = findBed(roomId, bedId);
  const bedName = found?.bed?.name || bedId;
  const p = patient;
  closeModal();

  // Helper: render field value sebagai teks dengan styling konsisten
  const field = (label, value, opts = {}) => {
    if (!value && value !== 0) return '';
    const style = opts.mono ? 'font-family:var(--mono);font-size:11px' : 'font-size:12px';
    const color = opts.color ? `color:${opts.color}` : '';
    return `<div class="fg">
      <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">${label}</label>
      <div class="detail-val" style="${style};${color}">${value}</div>
    </div>`;
  };

  // Helper: chips read-only
  const chips = (items, cls = '') => items.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${items.map(i => `<span class="tp ${cls}" style="cursor:default">${esc(i)}</span>`).join('')}</div>`
    : '<span style="color:var(--mu);font-size:11px">—</span>';

  // TTV chips dengan warna abnormal
  const vitalRow = () => {
    if (!p.vital || !Object.values(p.vital).some(Boolean)) return '<span style="color:var(--mu);font-size:11px">Belum ada data</span>';
    const items = [];
    const v = p.vital;
    if (v.td)   items.push(`<div class="vital-chip"><div class="v-label">TD</div><div class="v-value">${esc(v.td)}</div></div>`);
    if (v.hr)   items.push(`<div class="vital-chip ${v.hr>150?'abn':v.hr>100?'warn':''}"><div class="v-label">HR</div><div class="v-value">${v.hr}</div></div>`);
    if (v.rr)   items.push(`<div class="vital-chip ${v.rr>35?'abn':v.rr>25?'warn':''}"><div class="v-label">RR</div><div class="v-value">${v.rr}</div></div>`);
    if (v.spo2) items.push(`<div class="vital-chip ${v.spo2<90?'abn':v.spo2<95?'warn':''}"><div class="v-label">SpO₂</div><div class="v-value">${v.spo2}%</div></div>`);
    if (v.suhu) items.push(`<div class="vital-chip ${v.suhu>38?'warn':''}"><div class="v-label">Suhu</div><div class="v-value">${v.suhu}°</div></div>`);
    if (v.o2)   items.push(`<div class="vital-chip"><div class="v-label">O₂</div><div class="v-value" style="font-size:11px">${esc(v.o2)}</div></div>`);
    return `<div class="vitals-row">${items.join('')}</div>`;
  };

  // Lab grid read-only
  const labGrid = () => {
    const keys = ['hb','wbc','gda','kreatinin','ureum','na','k','albumin'];
    const main = keys.filter(k => p.lab?.[k]).map(k =>
      `<div class="lab-item"><div class="lab-label">${k.toUpperCase()}</div><div class="lab-value">${esc(p.lab[k])}</div></div>`
    ).join('');
    const extra = (p.lab?.extra || []).map(e =>
      `<div class="lab-item"><div class="lab-label">${esc(e.nama)}</div><div class="lab-value ${e.flag||''}">${esc(e.nilai)}<span style="font-size:9px;color:var(--mu)"> ${esc(e.satuan||'')}</span></div></div>`
    ).join('');
    return (main || extra)
      ? `<div class="lab-grid">${main}${extra}</div>`
      : '<span style="color:var(--mu);font-size:11px">Belum ada data</span>';
  };

  const los = calcLOS(p.tglMRS);

  const html = `
<div class="modal-overlay" id="form-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box form-modal-box">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">👁 Detail Lengkap Pasien</div>
        <div class="modal-sub">${esc(p.nama)} · ${esc(room?.name||roomId)} · Bed ${esc(bedName)}
          ${los ? `<span class="los-badge ${los.cls}" style="margin-left:6px">${los.label}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${statusDotHtml(p.status)}
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
    </div>
    <div class="modal-body">

      <!-- LOKASI -->
      <div class="fst" style="color:var(--room)">Lokasi Bed</div>
      <div class="g2" style="margin-bottom:10px">
        ${field('Ruangan', esc(room?.name || roomId))}
        ${field('Bed', esc(bedName), {mono:true})}
      </div>

      <!-- IDENTITAS -->
      <div class="fst">Identitas Pasien</div>
      <div class="g3" style="margin-bottom:7px">
        ${field('Nama Lengkap', esc(p.nama))}
        ${field('Usia', p.usia ? p.usia + ' tahun' : null)}
        ${field('Jenis Kelamin', p.jk === 'L' ? 'Laki-laki' : p.jk === 'P' ? 'Perempuan' : null)}
      </div>
      <div class="g3">
        ${field('No. Rekam Medis', esc(p.noRM) || '—')}
        ${field('Tanggal MRS', formatTglMRS(p.tglMRS) + (p._mrsAutoSet ? ' (auto)' : ''))}
        ${field('Status Klinis', statusLabel(p.status))}
      </div>

      <!-- TIM DOKTER -->
      <div class="fst">Tim Dokter</div>
      <div class="g2" style="margin-bottom:7px">
        ${field('DPJP Utama', p.dpjp?.nama ? `<span class="dpjp-tag">${esc(p.dpjp.nama)}</span>` : null)}
        ${field('Spesialis DPJP', esc(p.dpjp?.spesialis) || '—')}
      </div>
      ${(p.timDokter||[]).length ? `
      <div class="fg" style="margin-bottom:7px">
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">Tim Dokter Lain</label>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${p.timDokter.map(t=>`<span class="tp" style="cursor:default">${esc(t.nama)}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- DIAGNOSIS -->
      <div class="fst">Diagnosis</div>
      ${field('Diagnosis Utama', `<span style="font-weight:600;color:var(--tx)">${esc(p.diagnosisUtama)}</span>`)}
      ${(p.diagnosisSekunder||[]).length ? `
      <div class="fg" style="margin-top:7px">
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">Diagnosis Sekunder</label>
        ${chips(p.diagnosisSekunder)}
      </div>` : ''}

      <!-- KONSUL -->
      ${(p.konsul||[]).length ? `
      <div class="fg" style="margin-top:7px;margin-bottom:7px">
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">Konsul</label>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${p.konsul.map(k=>`<span class="tp k" style="cursor:default">KONSUL ${esc(k.spesialis)} ${esc(k.tanggal)}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- PINDAHAN -->
      ${(p.pindahan||[]).length ? `
      <div class="fg" style="margin-bottom:10px">
        <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">Riwayat Pindahan</label>
        <div style="margin-top:6px">${renderTrail(p.pindahan)}</div>
      </div>` : ''}

      <!-- TTV -->
      <div class="fst">Tanda-Tanda Vital</div>
      <div style="margin-bottom:10px">${vitalRow()}</div>

      <!-- TERAPI -->
      ${(p.terapi||[]).length ? `
      <div class="fst">Terapi Aktif</div>
      <div class="terapi-list" style="margin-bottom:10px">
        ${p.terapi.map(t=>`<span class="terapi-item">${esc(t)}</span>`).join('')}
      </div>` : ''}

      <!-- LAB -->
      <div class="fst">Laboratorium</div>
      <div style="margin-bottom:10px">${labGrid()}</div>

      <!-- CPPT -->
      ${p.cppt ? `
      <div class="fst">CPPT / Catatan Perkembangan</div>
      <div class="cppt-box" style="margin-bottom:10px">${esc(p.cppt)}</div>` : ''}

      <!-- RIWAYAT STATUS -->
      ${(p.tglKRS || p.tglMeninggal) ? `
      <div class="fst">Riwayat Status</div>
      <div class="g2">
        ${p.tglKRS ? `<div class="fg">
          <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">✅ Tanggal KRS</label>
          <div class="detail-val" style="color:#9ca3af">${formatDateTimeLocal(p.tglKRS)}</div>
        </div>` : ''}
        ${p.tglMeninggal ? `<div class="fg">
          <label style="font-size:10px;color:var(--mu);font-family:var(--mono);letter-spacing:.04em">🖤 Waktu Meninggal</label>
          <div class="detail-val" style="color:#fca5a5">${formatDateTimeLocal(p.tglMeninggal)}</div>
        </div>` : ''}
      </div>` : ''}

    </div>
    <div class="modal-footer">
      <button class="bu bp" onclick="closeModal();openFormModal('${esc(roomId)}','${esc(bedId)}')">✏️ Edit</button>
      <button class="bu bgh" onclick="closeModal()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function openFormModal(roomId, bedId, prefilledData, batchIdx = -1) {
  closeModal();
  _batchEditIdx = batchIdx;
  _formRoomId = roomId;
  _formBedId = bedId;
  _formPatient = prefilledData || getPatient(roomId, bedId) || null;
  const p = _formPatient;
  const d = getData();
  const isEdit = !!p?.id;

  // Gunakan roomId/bedId aktual (dari lokasi di storage) sebagai acuan utama
  // p._roomId/_bedId bisa stale — jangan dipakai untuk pre-fill room select
  const activeRoomId = roomId || p?._roomId || null;
  const activeBedId  = bedId  || p?._bedId  || null;

  const roomOptions = d.rooms.map(r =>
    `<option value="${r.id}" ${activeRoomId === r.id ? 'selected' : ''}>${esc(r.name)}</option>`
  ).join('');

  const html = `
<div class="modal-overlay" id="form-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box form-modal-box">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">${isEdit ? '✏️ Edit Pasien' : '➕ Input Pasien Baru'}</div>
        <div class="modal-sub">Lengkapi data pasien</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">

      <!-- LOKASI BED -->
      <div class="fst" style="color:var(--room)">Lokasi Bed <span class="ntag">WAJIB</span></div>
      <div class="rb-grid">
        <div class="fg"><label>Ruangan *</label>
          <select class="ifp" id="f-room" onchange="updateFormBeds()">${roomOptions}</select>
        </div>
        <div class="fg"><label>Bed *</label>
          <select class="ifp" id="f-bed"></select>
        </div>
      </div>
      <div id="f-bed-status" class="rbed-sel" style="display:none">
        <div class="rbed-sel-label">Bed terpilih:</div>
        <div class="rbed-badge" id="f-bed-badge">—</div>
        <div id="f-bed-ok" style="font-size:10px;font-family:var(--mono)"></div>
      </div>

      <!-- IDENTITAS -->
      <div class="fst">Identitas Pasien</div>
      <div class="g3" style="margin-bottom:7px">
        <div class="fg"><label>Nama Lengkap *</label><input class="ifp" id="f-nama" placeholder="Tn./Ny./An." value="${esc(p?.nama||'')}"></div>
        <div class="fg"><label>Usia (tahun)</label><input class="ifp" id="f-usia" type="number" placeholder="45" value="${p?.usia||''}"></div>
        <div class="fg"><label>Jenis Kelamin</label>
          <select class="ifp" id="f-jk">
            <option value="" ${!p?.jk?'selected':''}>—</option>
            <option value="L" ${p?.jk==='L'?'selected':''}>Laki-laki</option>
            <option value="P" ${p?.jk==='P'?'selected':''}>Perempuan</option>
          </select>
        </div>
      </div>
      <div class="g3">
        <div class="fg"><label>No. Rekam Medis</label><input class="ifp" id="f-rm" placeholder="123456" value="${esc(p?.noRM||'')}"></div>
        <div class="fg"><label>Tanggal MRS</label><input class="ifp" id="f-mrs" type="date" value="${p?.tglMRS||''}"></div>
        <div class="fg"><label>Status Klinis</label>
          <select class="ifp" id="f-status">
            <option value="stabil" ${(p?.status||'stabil')==='stabil'?'selected':''}>🟢 Stabil</option>
            <option value="perhatian" ${p?.status==='perhatian'?'selected':''}>🟡 Perlu Perhatian</option>
            <option value="kritis" ${p?.status==='kritis'?'selected':''}>🔴 Kritis</option>
            <option value="krs" ${p?.status==='krs'?'selected':''}>⚫ KRS</option>
            <option value="meninggal" ${p?.status==='meninggal'?'selected':''}>⚫ Meninggal</option>
            <option value="lepas_rawat" ${p?.status==='lepas_rawat'?'selected':''}>✅ Lepas Rawat</option>
            <option value="rencana_rujuk" ${p?.status==='rencana_rujuk'?'selected':''}>➡️ Rencana Rujuk</option>
          </select>
        </div>
      </div>

      <!-- TIM DOKTER -->
      <div class="fst">Tim Dokter <span class="ntag">BARU</span></div>
      <div class="g2" style="margin-bottom:7px">
        <div class="fg"><label>DPJP Utama</label><input class="ifp" id="f-dpjp" placeholder="dr. Deden, Sp.P" value="${esc(p?.dpjp?.nama||'')}"></div>
        <div class="fg"><label>Spesialis DPJP</label><input class="ifp" id="f-dpjp-sp" placeholder="PARU / IPD / BEDAH" value="${esc(p?.dpjp?.spesialis||'')}"></div>
      </div>
      <div class="fg"><label>Tim Dokter Lain (Enter untuk tambah)</label>
        <div class="tmk" id="f-tim-box">
          ${(p?.timDokter||[]).map(t=>`<span class="tp" data-val="${esc(t.nama)}">${esc(t.nama)}<span class="tp-x" onclick="removeTag(this)">✕</span></span>`).join('')}
          <input class="ti" id="f-tim-input" placeholder="dr. Nama, Sp.X — Enter...">
        </div>
      </div>

      <!-- DIAGNOSIS -->
      <div class="fst">Diagnosis</div>
      <div class="fg" style="margin-bottom:7px"><label>Diagnosis Utama *</label><input class="ifp" id="f-dx" placeholder="CVA Infark, TB Paru, COPD AE..." value="${esc(p?.diagnosisUtama||'')}"></div>
      <div class="fg" style="margin-bottom:7px"><label>Diagnosis Sekunder (Enter)</label>
        <div class="tmk" id="f-dxs-box">
          ${(p?.diagnosisSekunder||[]).map(d=>`<span class="tp" data-val="${esc(d)}">${esc(d)}<span class="tp-x" onclick="removeTag(this)">✕</span></span>`).join('')}
          <input class="ti" id="f-dxs-input" placeholder="Tambah — Enter...">
        </div>
      </div>

      <!-- KONSUL -->
      <div class="fg" style="margin-bottom:7px"><label>Konsul (format: PARU 09/03 — Enter) <span class="ntag">BARU</span></label>
        <div class="tmk" id="f-konsul-box">
          ${(p?.konsul||[]).map(k=>`<span class="tp k" data-val="${esc(k.spesialis+' '+k.tanggal)}">${esc(k.spesialis)} ${esc(k.tanggal)}<span class="tp-x" onclick="removeTag(this)">✕</span></span>`).join('')}
          <input class="ti" id="f-konsul-input" placeholder="NEURO 12/03 — Enter...">
        </div>
      </div>

      <!-- PINDAHAN -->
      <div class="fg" style="margin-bottom:7px"><label>Riwayat Pindahan <span class="ntag">BARU</span></label>
        <div class="tmk" id="f-pindahan-box">
          ${(p?.pindahan||[]).map(pind=>`<span class="tp d" data-val="${esc(pind.dari+'→'+pind.ke+(pind.tanggal?' '+pind.tanggal:''))}">${esc(pind.dari)} → ${esc(pind.ke)}<span class="tp-x" onclick="removeTag(this)">✕</span></span>`).join('')}
          <input class="ti" id="f-pindahan-input" placeholder="HCU → ICU 3 (09/03) — Enter...">
        </div>
      </div>

      <!-- TTV -->
      <div class="fst">Tanda-Tanda Vital</div>
      <div class="g3" style="margin-bottom:7px">
        <div class="fg"><label>TD (mmHg)</label><input class="ifp" id="f-td" placeholder="120/80" value="${esc(p?.vital?.td||'')}"></div>
        <div class="fg"><label>HR (/mnt)</label><input class="ifp" id="f-hr" type="number" placeholder="80" value="${p?.vital?.hr||''}"></div>
        <div class="fg"><label>RR (/mnt)</label><input class="ifp" id="f-rr" type="number" placeholder="18" value="${p?.vital?.rr||''}"></div>
        <div class="fg"><label>SpO₂ (%)</label><input class="ifp" id="f-spo2" type="number" placeholder="98" value="${p?.vital?.spo2||''}"></div>
        <div class="fg"><label>Suhu (°C)</label><input class="ifp" id="f-suhu" placeholder="36.5" value="${esc(p?.vital?.suhu||'')}"></div>
        <div class="fg"><label>O₂ Device <span class="ntag">BARU</span></label>
          <select class="ifp" id="f-o2">
            ${['RA','NC','RM','NRM','Ventilator'].map(o=>`<option ${p?.vital?.o2===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- TERAPI -->
      <div class="fst">Terapi Aktif</div>
      <div class="tmk" id="f-terapi-box" style="margin-bottom:10px">
        ${(p?.terapi||[]).map(t=>`<span class="tp" data-val="${esc(t)}">${esc(t)}<span class="tp-x" onclick="removeTag(this)">✕</span></span>`).join('')}
        <input class="ti" id="f-terapi-input" placeholder="Obat dosis rute — Enter...">
      </div>

      <!-- LAB -->
      <div class="fst">Laboratorium</div>
      <div class="g4" style="margin-bottom:7px">
        ${['hb','wbc','gda','kreatinin','ureum','na','k','albumin'].map(k=>`<div class="fg"><label>${k.toUpperCase()}</label><input class="ifp" id="f-lab-${k}" placeholder="—" value="${esc(p?.lab?.[k]||'')}"></div>`).join('')}
      </div>
      <div id="f-lab-extra"></div>
      <button class="bu bgh" style="font-size:11px;margin-bottom:10px" onclick="addLabRow()">＋ Tambah Lab Lain</button>

      <!-- CPPT -->
      <div class="fst">CPPT / Catatan Perkembangan</div>
      <textarea class="ifl" id="f-cppt" rows="4" placeholder="S: ...\nO: KU sedang, GCS 456, TTV...\nA: ...\nP: ...">${esc(p?.cppt||'')}</textarea>
    </div>
    <div class="modal-footer">
      <button class="bu bp" onclick="saveFormPatient()">💾 Simpan</button>
      <button class="bu bgh" onclick="closeModal()">Batal</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setupFormTagInputs();
  updateFormBeds();

  // Pre-select bed berdasarkan lokasi aktual, bukan p._bedId yang mungkin stale
  if (activeBedId && document.getElementById('f-bed')) {
    setTimeout(() => {
      const sel = document.getElementById('f-bed');
      const opt = Array.from(sel.options).find(o => o.value === activeBedId);
      if (opt) {
        opt.disabled = false; // pastikan bed saat ini tidak ter-disable
        sel.value = activeBedId;
      } else {
        // Bed ada di storage tapi tidak ada di select (edge case) → tambahkan
        sel.innerHTML += `<option value="${activeBedId}" selected>${activeBedId}</option>`;
      }
      updateBedStatusDisplay();
    }, 50);
  }
}

function updateFormBeds() {
  const roomId = document.getElementById('f-room')?.value;
  const bedSel = document.getElementById('f-bed');
  if (!bedSel || !roomId) return;
  const room = getRoom(roomId);
  if (!room) return;
  // Bed aktual yang sedang diedit — pakai _formBedId sebagai acuan utama
  const currentBedId = _formBedId;
  bedSel.innerHTML = '<option value="">— Pilih Bed —</option>';
  for (const kamar of room.kamar) {
    const sep = document.createElement('option');
    sep.disabled = true;
    sep.textContent = `── ${kamar.name} ──`;
    bedSel.appendChild(sep);
    for (const bed of kamar.beds) {
      const occ = !!bed.patient;
      const opt = document.createElement('option');
      opt.value = bed.id;
      opt.textContent = bed.name + (occ ? ' (terisi)' : '');
      // Disable bed terisi KECUALI bed yang sedang diedit
      if (occ && bed.id !== currentBedId) opt.disabled = true;
      bedSel.appendChild(opt);
    }
  }
  bedSel.onchange = updateBedStatusDisplay;
  updateBedStatusDisplay();
}

function updateBedStatusDisplay() {
  const roomId   = document.getElementById('f-room')?.value;
  const bedId    = document.getElementById('f-bed')?.value;
  const statusEl = document.getElementById('f-bed-status');
  const badgeEl  = document.getElementById('f-bed-badge');
  const okEl     = document.getElementById('f-bed-ok');
  if (!bedId) { if (statusEl) statusEl.style.display = 'none'; return; }
  if (statusEl) statusEl.style.display = 'flex';
  const room  = getRoom(roomId);
  const found = findBed(roomId, bedId);
  if (badgeEl) badgeEl.textContent = `${room?.name} · ${found?.bed.name || bedId}`;
  // Terisi = ada patient DAN bukan bed yang sedang diedit
  const occ = found?.bed.patient && found.bed.id !== _formBedId;
  if (okEl) {
    okEl.textContent  = occ ? '✗ Bed terisi' : '✓ Bed kosong';
    okEl.style.color  = occ ? 'var(--kritis)' : 'var(--stabil)';
  }
}

function setupFormTagInputs() {
  const tagInputs = [
    { input: 'f-tim-input', box: 'f-tim-box', cls: '' },
    { input: 'f-dxs-input', box: 'f-dxs-box', cls: '' },
    { input: 'f-konsul-input', box: 'f-konsul-box', cls: 'k' },
    { input: 'f-pindahan-input', box: 'f-pindahan-box', cls: 'd' },
    { input: 'f-terapi-input', box: 'f-terapi-box', cls: '' },
  ];
  tagInputs.forEach(({ input, box, cls }) => {
    const el = document.getElementById(input);
    if (!el) return;
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const val = el.value.trim();
      if (!val) return;
      const boxEl = document.getElementById(box);
      const tag = document.createElement('span');
      tag.className = `tp ${cls}`;
      tag.dataset.val = val;
      tag.innerHTML = `${esc(val)}<span class="tp-x" onclick="removeTag(this)">✕</span>`;
      boxEl.insertBefore(tag, el);
      el.value = '';
    });
  });
}

function removeTag(btn) {
  btn.parentElement.remove();
}

function addLabRow() {
  const container = document.getElementById('f-lab-extra');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'lr';
  row.innerHTML = `<input class="ifp" placeholder="Nama" style="font-size:11px"><input class="ifp" placeholder="Nilai" style="font-size:11px"><input class="ifp" placeholder="Satuan" style="font-size:11px"><select class="ifp" style="font-size:11px"><option>—</option><option>N</option><option>H</option><option>L</option></select><button class="bu bgh" onclick="this.parentNode.remove()" style="padding:3px 6px;font-size:11px">✕</button>`;
  container.appendChild(row);
}

function collectFormData() {
  const getVal = id => document.getElementById(id)?.value?.trim() || '';
  const getTags = boxId => {
    const box = document.getElementById(boxId);
    if (!box) return [];
    return Array.from(box.querySelectorAll('.tp')).map(el => el.dataset.val).filter(Boolean);
  };

  const roomId = getVal('f-room');
  const bedId = getVal('f-bed');
  const dpjpNama = getVal('f-dpjp');
  const dpjpSp = getVal('f-dpjp-sp');
  const timRaw = getTags('f-tim-box');
  const konsulRaw = getTags('f-konsul-box');
  const pindahanRaw = getTags('f-pindahan-box');

  // Lab extra rows
  const labExtra = [];
  const labRows = document.querySelectorAll('#f-lab-extra .lr');
  labRows.forEach(row => {
    const inputs = row.querySelectorAll('input, select');
    const nama = inputs[0]?.value?.trim();
    const nilai = inputs[1]?.value?.trim();
    const satuan = inputs[2]?.value?.trim();
    const flag = inputs[3]?.value?.trim();
    if (nama) labExtra.push({ nama, nilai, satuan, flag: flag === '—' ? '' : flag });
  });

  const patient = {
    id: _formPatient?.id || genId(),
    nama: getVal('f-nama'),
    usia: parseInt(getVal('f-usia')) || null,
    jk: getVal('f-jk') || null,
    noRM: getVal('f-rm') || null,
    tglMRS: getVal('f-mrs') || null, // null jika tidak diisi — jangan auto-set
    _mrsAutoSet: false, // form: user yang tentukan, tidak pernah auto
    status: getVal('f-status') || 'stabil',
    dpjp: { nama: dpjpNama, spesialis: dpjpSp },
    timDokter: timRaw
      .filter(v => normalizeDocName(v) !== normalizeDocName(dpjpNama)) // De-duplikasi
      .map(v => ({ nama: v, spesialis: '' })),
    diagnosisUtama: getVal('f-dx'),
    diagnosisSekunder: getTags('f-dxs-box'),
    konsul: konsulRaw.map(v => { const parts = v.split(/\s+/); return { spesialis: parts[0]||'', tanggal: parts.slice(1).join(' ') }; }),
    pindahan: pindahanRaw.map(v => {
      const m = v.match(/^(.+?)→(.+?)(?:\s*\((.+)\))?$/);
      return m ? { dari: m[1].trim(), ke: m[2].trim(), tanggal: m[3]||'' } : { dari: '', ke: v, tanggal: '' };
    }),
    vital: {
      td: getVal('f-td'), hr: parseInt(getVal('f-hr'))||null,
      rr: parseInt(getVal('f-rr'))||null, spo2: parseInt(getVal('f-spo2'))||null,
      suhu: parseFloat(getVal('f-suhu'))||null, o2: getVal('f-o2')||'RA',
    },
    lab: {
      hb: getVal('f-lab-hb'), wbc: getVal('f-lab-wbc'), gda: getVal('f-lab-gda'),
      kreatinin: getVal('f-lab-kreatinin'), ureum: getVal('f-lab-ureum'),
      na: getVal('f-lab-na'), k: getVal('f-lab-k'), albumin: getVal('f-lab-albumin'),
      extra: labExtra,
    },
    terapi: getTags('f-terapi-box'),
    cppt: getVal('f-cppt'),
    _roomId: roomId,
    _bedId: bedId,
    createdAt: _formPatient?.createdAt || nowISO(),
    updatedAt: nowISO(),
  };
  return { patient, roomId, bedId };
}

// Cari dan clear bed berdasarkan patient.id — single pass, early exit
function findAndClearPatientById(patientId) {
  for (const room of getData().rooms) {
    for (const k of room.kamar) {
      for (const b of k.beds) {
        if (b.patient?.id === patientId) {
          b.patient = null;
          saveData();
          return true;
        }
      }
    }
  }
  return false;
}


// Cari pasien aktif dengan nama+usia sama (untuk conflict detection)
// Definisi lokal agar modal.js tidak coupling ke input.js
function findExistingActivePatient(p) {
  const norm = normalizeName(p.nama);
  const age  = parseInt(p.usia);
  if (!norm || !age) return null;
  for (const room of getData().rooms) {
    for (const k of room.kamar) {
      for (const b of k.beds) {
        const occ = b.patient;
        if (occ && !['krs','meninggal','lepas_rawat'].includes(occ.status)) {
          if (normalizeName(occ.nama) === norm && parseInt(occ.usia) === age) {
            return { room, bed: b, patient: occ };
          }
        }
      }
    }
  }
  return null;
}

function saveFormPatient() {
  const { patient, roomId, bedId } = collectFormData();
  if (!patient.nama) { showToast('Nama pasien wajib diisi', 'error'); return; }
  if (!roomId || !bedId) { showToast('Pilih ruangan dan bed terlebih dahulu', 'error'); return; }

  // Mode EDIT BATCH PREVIEW — delegasikan ke caller via callback
  if (_batchEditIdx >= 0 && typeof _batchEditCallback === 'function') {
    const idx = _batchEditIdx;
    _batchEditIdx = -1;
    const cb = _batchEditCallback;
    _batchEditCallback = null;
    closeModal();
    showToast('Data preview diperbarui', 'success');
    cb(idx, patient);
    return;
  }

  // Jika editing: cek apakah patient yang ada di target bed adalah patient yang sama
  // Ini lebih robust daripada string comparison _formRoomId/_formBedId
  const existingAtTarget = getPatient(roomId, bedId);
  const isEditSameBed    = !!(_formPatient?.id && existingAtTarget?.id === _formPatient.id);

  if (isEditSameBed) {
    _doSavePatient(patient, roomId, bedId);
    return;
  }

  // ── CONFLICT DETECTION ─────────────────────────────────────────
  const conflicts = [];

  // 1. Cek duplikat nama+usia (kecuali pasien yang sedang diedit)
  const existing = findExistingActivePatient(patient);
  if (existing && existing.patient.id !== _formPatient?.id) {
    conflicts.push({
      type: 'DUPLICATE',
      bp: patient,
      ep: existing,
    });
  }

  // 2. Cek bed sudah terisi (kecuali oleh pasien yang sedang diedit)
  if (!conflicts.length) {
    const found   = findBed(roomId, bedId);
    const occupant = found?.bed?.patient;
    if (occupant && occupant.id !== _formPatient?.id &&
        !['krs','meninggal','lepas_rawat'].includes(occupant.status)) {
      const room = getRoom(roomId);
      conflicts.push({
        type: 'OCCUPIED',
        bp: patient,
        ep: { room, bed: found.bed, patient: occupant },
      });
    }
  }

  if (conflicts.length) {
    // Tutup form, buka resolve modal (sama persis dengan batch)
    closeModal();
    // Clear old bed SETELAH modal selesai
    const fromRoomId = _formRoomId;
    const fromBedId  = _formBedId;
    const wasEditing = !!_formPatient;

    startResolvingBatch(
      [],          // belum ada yang ready
      conflicts,
      (resolvedList) => {
        // onFinish
        if (wasEditing && fromRoomId && fromBedId) {
          clearBed(fromRoomId, fromBedId);
        }
        if (resolvedList.length) {
          const { patient: p, roomId: r, bedId: b } = resolvedList[0];
          setPatient(r, b, p);
          showToast(`Pasien disimpan ke ${getRoom(r)?.name} · ${b}`, 'success');
          renderSidebar();
          refreshCurrentView();
        }
      },
      null // onCancel — tidak perlu re-show form
    );
    return;
  }

  // Tidak ada konflik — clear bed lama jika patient dipindah ke bed berbeda
  // Cari lokasi fisik patient saat ini berdasarkan id (bukan _formRoomId/_formBedId yang bisa stale)
  if (_formPatient?.id && !isEditSameBed) {
    // Cari lokasi fisik patient saat ini, clear hanya sekali
    findAndClearPatientById(_formPatient.id);
  }
  _doSavePatient(patient, roomId, bedId);
}

function _doSavePatient(patient, roomId, bedId) {
  setPatient(roomId, bedId, patient);
  closeModal();
  showToast(`Pasien disimpan ke ${getRoom(roomId)?.name} · ${bedId}`, 'success');
  renderSidebar();
  refreshCurrentView();
}

// ── AUTOFILL FORM FROM PARSED DATA ───────────────────────────────
/**
 * @param {Object}   parsedPatient  - data pasien hasil parse
 * @param {string}   targetRoomId
 * @param {string}   targetBedId
 * @param {number}   batchIdx       - index di array batch (-1 jika bukan batch)
 * @param {Function} onBatchEdit    - callback(idx, patient) setelah edit batch row
 */
function openFormWithData(parsedPatient, targetRoomId, targetBedId, batchIdx = -1, onBatchEdit = null) {
  _formRoomId = parsedPatient._roomId || targetRoomId || null;
  _formBedId = parsedPatient._bedId || targetBedId || null;
  _batchEditCallback = typeof onBatchEdit === 'function' ? onBatchEdit : null;
  openFormModal(_formRoomId, _formBedId, parsedPatient, batchIdx);
}

// ── BATCH SAVE ────────────────────────────────────────────────────
function saveBatchPatients(patients) {
  let saved = 0;
  // Mutasi langsung ke memory, satu kali saveData di akhir (hindari N+1 writes)
  for (const { patient, roomId, bedId } of patients) {
    if (!roomId || !bedId) continue;
    const found = findBed(roomId, bedId);
    if (found) {
      found.bed.patient = patient;
      saved++;
    }
  }
  if (saved > 0) saveData();
  showToast(`${saved} pasien disimpan`, 'success');
  renderSidebar();
  refreshCurrentView();
}

// ── BATCH RESOLVER (Unresolved Locations) ─────────────────────────
let _batchResolved = [];
let _batchUnresolved = [];
let _isBatchResolving = false;
let _batchOnFinish = null;   // callback(resolvedList) setelah semua resolved
let _batchOnCancel = null;   // callback() jika user batal

/**
 * @param {Array}    selected   - pasien siap simpan
 * @param {Array}    unresolved - pasien dengan konflik
 * @param {Function} onFinish   - dipanggil dengan (resolvedList) saat selesai
 * @param {Function} onCancel   - dipanggil tanpa argumen jika dibatalkan
 */
function startResolvingBatch(selected, unresolved, onFinish, onCancel) {
  _isBatchResolving = true;
  _batchResolved = selected;
  _batchUnresolved = unresolved;
  _batchOnFinish = onFinish || null;
  _batchOnCancel = onCancel || null;
  renderResolveBatchModal();
}

function renderResolveBatchModal() {
  const old = document.getElementById('resolve-modal');
  if (old) old.remove();

  if (_batchUnresolved.length === 0) {
    // Semua sudah resolved — panggil callback finish
    _isBatchResolving = false;
    if (typeof _batchOnFinish === 'function') {
      const cb = _batchOnFinish;
      _batchOnFinish = null;
      _batchOnCancel = null;
      cb(_batchResolved);
    }
    return;
  }

  const d = getData();
  const roomOptions = `<option value="">— Pilih Ruang —</option>` + 
    d.rooms.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('');

  const listHtml = _batchUnresolved.map((item, index) => {
    const bp = item.bp; // batch patient
    const type = item.type;
    let titleHtml = `<span>${esc(bp.nama)} <span style="font-weight:400;color:var(--mu);margin-left:4px">${bp.usia?bp.usia+'th':''}</span></span>`;
    let reason = '';
    let reasonCls = 'color:var(--perhatian)';
    let subHtml = '';
    let bodyHtml = '';

    if (type === 'DUPLICATE') {
      const ep = item.ep; // existing patient {room, bed, patient}
      reason = `Nama Sama (${esc(ep.room.name)} · ${esc(ep.bed.name)})`;
      subHtml = `
      <div style="font-size:11px;color:var(--mu);margin-bottom:8px">
        Input: <strong>${esc(bp._roomId||'—')} / ${esc(bp._bedId||'—')}</strong>
      </div>
      <div style="background:rgba(59,130,246,.05);padding:8px;border-radius:5px;border:1px solid rgba(59,130,246,.1);margin-bottom:10px;display:flex;align-items:center;gap:15px;flex-wrap:wrap">
        <label style="font-size:11px;display:flex;align-items:center;gap:5px;cursor:pointer">
          <input type="radio" name="res-dup-act-${index}" value="update" checked onchange="updateResDuplicateUI(${index}, 'update')"> <b>Update Data</b>
        </label>
        <label style="font-size:11px;display:flex;align-items:center;gap:5px;cursor:pointer">
          <input type="radio" name="res-dup-act-${index}" value="new" onchange="updateResDuplicateUI(${index}, 'new')"> <b>Tambah Baru</b>
        </label>
        <label style="font-size:11px;display:flex;align-items:center;gap:5px;cursor:pointer;color:var(--mu)">
          <input type="radio" name="res-dup-act-${index}" value="ignore" onchange="updateResDuplicateUI(${index}, 'ignore')"> <b>Abaikan</b>
        </label>
      </div>`;
      bodyHtml = `
      <div id="res-dup-fields-${index}" style="display:none">
        <div class="g2">
          <div class="fg"><select class="ifp res-room-sel" data-idx="${index}" onchange="updateResBedSel(${index}, this.value)" style="font-size:12px">${roomOptions}</select></div>
          <div class="fg"><select class="ifp res-bed-sel" id="res-bed-${index}" style="font-size:12px"><option value="">— Pilih Bed —</option></select></div>
        </div>
      </div>
      <div id="res-dup-msg-${index}" style="font-size:10px;color:rgba(59,130,246,.8)">Pasien lama akan diperbarui dengan data baru dari batch.</div>`;
    } else if (type === 'OCCUPIED' || type === 'INVALID') {
      const isOccupied = type === 'OCCUPIED';
      const ep = item.ep; // if occupied
      reason = isOccupied ? `Bed terisi (${esc(ep.patient.nama.split(' ').slice(-1)[0])})` : (item.reason || 'Lokasi tidak valid');
      
      const actionBtn = isOccupied && !['krs','meninggal','lepas_rawat'].includes(ep.patient.status)
        ? `<button class="bu bgh" style="font-size:10px;padding:3px 6px" onclick="moveFromResolve('${ep.room.id}','${ep.bed.id}')">🔄 Pindah ${esc(ep.patient.nama.split(' ').slice(-1)[0])}</button>`
        : '';

      subHtml = `
      <div style="font-size:11px;color:var(--mu);margin-bottom:10px;margin-top:4px">
        Input asal: <strong>${esc(bp._roomId||'—')} / ${esc(bp._bedId||'—')}</strong>
      </div>`;
      bodyHtml = `
      <div class="g2">
        <div class="fg"><select class="ifp res-room-sel" data-idx="${index}" onchange="updateResBedSel(${index}, this.value)" style="font-size:12px">${roomOptions}</select></div>
        <div class="fg"><select class="ifp res-bed-sel" id="res-bed-${index}" style="font-size:12px"><option value="">— Pilih Bed —</option></select></div>
      </div>
      ${actionBtn ? `<div style="margin-top:8px;display:flex;align-items:center;gap:6px">${actionBtn} <span style="font-size:9px;color:var(--mu)">kosongkan bed ini dulu</span></div>` : ''}`;
    }

    return `
    <div class="msec" style="padding:10px;background:var(--sfb);margin-bottom:8px;border-radius:6px;border:1px solid rgba(245,158,11,.15)">
      <div style="font-weight:600;font-size:13px;display:flex;justify-content:space-between;align-items:center">
        ${titleHtml}
        <span style="${reasonCls};font-size:10px;padding:2px 6px;background:rgba(245,158,11,.1);border-radius:4px">${reason}</span>
      </div>
      ${subHtml}
      ${bodyHtml}
    </div>`;
  }).join('');

  const html = `
<div class="confirm-overlay" id="resolve-modal" style="display:flex">
  <div class="confirm-box" style="max-width:580px;max-height:85vh;display:flex;flex-direction:column;padding:20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-shrink:0">
      <div style="font-size:20px">⚠️</div>
      <div style="font-weight:700;font-size:15px;color:var(--tx)">${_batchUnresolved.length} Konflik Data Batch</div>
    </div>
    <div style="font-size:12px;color:var(--tx2);margin-bottom:15px;line-height:1.5;flex-shrink:0">
      Beberapa pasien memiliki konflik (nama duplikat atau bed terisi). Gunakan opsi di bawah untuk memperbarui data yang sudah ada atau menempatkan di bed lain.
      <div style="margin-top:8px">
        <button class="bu bgh" style="font-size:11px" onclick="rseFromResolve()">⚙️ Buka Pengaturan Kamar & Bed</button>
      </div>
    </div>
    
    <div style="overflow-y:auto;flex:1;padding-right:4px">
      ${listHtml}
    </div>

    <div class="confirm-actions" style="margin-top:15px;border-top:1px solid var(--bd);padding-top:15px;flex-shrink:0">
      <button class="bu bgh" onclick="cancelResolveBatch()">Batal Simpan Batch</button>
      <button class="bu bp" onclick="confirmResolveBatch()">💾 Lanjut Simpan</button>
    </div>
  </div>
</div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  // Auto-select room if it exists (for non-duplicate or when "new" is preset)
  _batchUnresolved.forEach((item, index) => {
    const p = item.bp;
    if (item.type !== 'DUPLICATE' && p._roomId && getRoom(p._roomId)) {
      const sel = document.querySelector(`.res-room-sel[data-idx="${index}"]`);
      if (sel) {
        sel.value = p._roomId;
        updateResBedSel(index, p._roomId);
      }
    }
  });
}

function updateResDuplicateUI(index, act) {
  const fields = document.getElementById(`res-dup-fields-${index}`);
  const msg = document.getElementById(`res-dup-msg-${index}`);
  if (!fields || !msg) return;
  if (act === 'update') {
    fields.style.display = 'none';
    msg.style.display = 'block';
    msg.textContent = 'Pasien lama akan diperbarui dengan data baru dari batch.';
  } else if (act === 'ignore') {
    fields.style.display = 'none';
    msg.style.display = 'block';
    msg.textContent = 'Data ini akan diabaikan (tidak diproses dalam batch ini).';
  } else {
    fields.style.display = 'block';
    msg.style.display = 'none';
    // Reset room/bed for new
    const item = _batchUnresolved[index];
    if (item && item.bp._roomId && getRoom(item.bp._roomId)) {
       const sel = document.querySelector(`.res-room-sel[data-idx="${index}"]`);
       if (sel) {
         sel.value = item.bp._roomId;
         updateResBedSel(index, item.bp._roomId);
       }
    }
  }
}

function updateResBedSel(index, roomId) {
  const bSel = document.getElementById(`res-bed-${index}`);
  if (!bSel) return;
  if (!roomId) { bSel.innerHTML = '<option value="">— Pilih Bed —</option>'; return; }
  
  const emptyBeds = getEmptyBeds(roomId);
  if (emptyBeds.length === 0) {
    bSel.innerHTML = '<option value="">— Tidak ada bed kosong —</option>';
  } else {
    bSel.innerHTML = '<option value="">— Pilih Bed Kosong —</option>' + 
      emptyBeds.map(eb => `<option value="${eb.bed.id}">${esc(eb.kamarName)} · Bed ${esc(eb.bed.name)}</option>`).join('');
  }
}

function cancelResolveBatch() {
  document.getElementById('resolve-modal')?.remove();
  _batchResolved = [];
  _batchUnresolved = [];
  _isBatchResolving = false;
  showToast('Penyimpanan batch dibatalkan', 'warn');

  // Kembalikan kontrol ke caller (input.js) via callback
  if (typeof _batchOnCancel === 'function') {
    _batchOnCancel();
    _batchOnCancel = null;
  }
  _batchOnFinish = null;
}

function confirmResolveBatch() {
  let allValid = true;
  const claimedObj = new Set();
  
  // Bed yang sudah di-resolve otomatis tidak boleh ditimpa
  _batchResolved.forEach(r => claimedObj.add(`${r.roomId}|${r.bedId}`));

  const mergedList = []; // list of finally resolved items
  const stillUnresolved = []; // for the next loop

  _batchUnresolved.forEach((item, index) => {
    const bp = item.bp;
    let resolved = false;

    if (item.type === 'DUPLICATE') {
      const act = document.querySelector(`input[name="res-dup-act-${index}"]:checked`)?.value;
      if (act === 'ignore') {
        resolved = true; // Ignored is considered "done"
      } else if (act === 'update') {
        const ep = item.ep;
        const pOld = ep.patient;
        const pNew = bp;
        
        if (pNew.usia) pOld.usia = pNew.usia;
        if (pNew.diagnosisUtama) pOld.diagnosisUtama = pNew.diagnosisUtama;
        if (pNew.diagnosisSekunder && pNew.diagnosisSekunder.length) pOld.diagnosisSekunder = pNew.diagnosisSekunder;
        if (pNew.terapi && pNew.terapi.length) pOld.terapi = pNew.terapi;
        if (pNew.cppt) pOld.cppt = pNew.cppt;
        if (pNew.dpjp) pOld.dpjp = pNew.dpjp;
        if (pNew.timDokter && pNew.timDokter.length) pOld.timDokter = pNew.timDokter;
        if (pNew.konsul && pNew.konsul.length) pOld.konsul = pNew.konsul;
        if (pNew.vital) pOld.vital = pNew.vital;
        if (pNew.lab) pOld.lab = pNew.lab;
        
        pOld.updatedAt = nowISO();
        setPatient(ep.room.id, ep.bed.id, pOld);
        resolved = true;
      } else {
        // Tambah Baru
        const rSel = document.querySelector(`.res-room-sel[data-idx="${index}"]`)?.value;
        const bSel = document.getElementById(`res-bed-${index}`)?.value;
        if (rSel && bSel) {
          const key = `${rSel}|${bSel}`;
          if (claimedObj.has(key)) {
            showToast(`Bed ${bSel} dipilih ganda!`, 'error');
            allValid = false;
          } else {
            claimedObj.add(key);
            mergedList.push({ patient: bp, roomId: rSel, bedId: bSel });
            resolved = true;
          }
        } else {
          allValid = false;
        }
      }
    } else {
      // OCCUPIED or INVALID
      const rSel = document.querySelector(`.res-room-sel[data-idx="${index}"]`)?.value;
      const bSel = document.getElementById(`res-bed-${index}`)?.value;
      if (rSel && bSel) {
        const key = `${rSel}|${bSel}`;
        if (claimedObj.has(key)) {
          showToast(`Bed ${bSel} dipilih ganda!`, 'error');
          allValid = false;
        } else {
          claimedObj.add(key);
          mergedList.push({ patient: bp, roomId: rSel, bedId: bSel });
          resolved = true;
        }
      } else {
        allValid = false;
      }
    }

    if (!resolved) stillUnresolved.push(item);
  });

  // Update the valid ones into _batchResolved for persistence across loops
  _batchResolved = [..._batchResolved, ...mergedList];

  if (stillUnresolved.length > 0) {
    _batchUnresolved = stillUnresolved;
    if (!allValid) {
       showToast(`Tersisa ${stillUnresolved.length} item konflik`, 'info');
    }
    renderResolveBatchModal(); // Re-render focusing only on what's left
    return;
  }

  document.getElementById('resolve-modal')?.remove();
  _isBatchResolving = false;

  if (typeof _batchOnFinish === 'function') {
    _batchOnFinish(_batchResolved);
    _batchOnFinish = null;
  }
  _batchOnCancel = null;
}

// Buka Pindah Bed untuk pasien lama supaya bed-nya jadi kosong
function moveFromResolve(roomId, bedId) {
  document.getElementById('resolve-modal').style.display = 'none';

  // Simpan referensi asli SEBELUM override
  const origConfirmMoveBed = window.confirmMoveBed;
  const origCloseModal = window.closeModal;

  const restoreAll = () => {
    window.confirmMoveBed = origConfirmMoveBed;
    window.closeModal = origCloseModal;
  };

  window.confirmMoveBed = function(fromR, fromB) {
    try {
      origConfirmMoveBed(fromR, fromB);
      // Setelah bed dikosongkan, re-render resolve modal agar bed baru muncul sebagai opsi
      if (_isBatchResolving) {
        setTimeout(() => renderResolveBatchModal(), 300);
      }
    } finally {
      restoreAll();
    }
  };

  window.closeModal = function() {
    try {
      origCloseModal();
      if (_isBatchResolving) {
        const rm = document.getElementById('resolve-modal');
        if (rm) rm.style.display = 'flex';
      }
    } finally {
      restoreAll();
    }
  };

  initMoveBed(roomId, bedId);
}

// Buka Settings -> config ruangan, lalu pas ditutup kembali ke resolve modal
function rseFromResolve() {
  document.getElementById('resolve-modal').style.display = 'none';

  const origCloseSettings = window.closeSettings;

  const restoreAll = () => {
    window.closeSettings = origCloseSettings;
  };

  window.closeSettings = function() {
    try {
      origCloseSettings();
      // Re-render resolve modal agar opsi ruangan & bed terupdate
      renderResolveBatchModal();
    } finally {
      restoreAll();
    }
  };

  openSettings();
}

// ── AI PANEL (DAILY REC + DISCHARGE SUMMARY) ─────────────────────
async function openAIPanel(roomId, bedId, mode) {
  const patient = getPatient(roomId, bedId);
  if (!patient) return;

  const los = calcLOS(patient.tglMRS);
  const losHari = los ? los.days : null;

  const isDischarge = mode === 'discharge';
  const title = isDischarge ? '✦ Discharge Summary' : '✦ Rekomendasi Manajemen Hari Ini';

  // Tutup modal utama, buka panel AI
  closeModal();

  const html = `
<div class="modal-overlay" id="ai-panel-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box" style="max-width:660px">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">${title}</div>
        <div class="modal-sub">${esc(patient.nama)} · ${esc(patient.diagnosisUtama||'—')}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body" id="ai-panel-body">
      <div class="ai-loading">
        <div class="ai-spinner"></div>
        <div class="ai-loading-text">Groq AI sedang menganalisis data klinis...</div>
        <div style="font-size:10px;color:var(--mu);margin-top:4px">Menggunakan model ${esc(getData().groqModel)}</div>
      </div>
    </div>
    <div class="modal-footer" id="ai-panel-footer" style="display:none">
      <button class="bu bp" onclick="copyAIResult()">📋 Copy Teks</button>
      <button class="bu bgh" onclick="closeModal()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  try {
    let result;
    if (isDischarge) {
      result = await groqDischargeSummary(patient, losHari);
      renderDischargeResult(result, patient, losHari);
    } else {
      result = await groqDailyRecommendation(patient, losHari);
      renderDailyRecResult(result, patient, losHari);
    }
    document.getElementById('ai-panel-footer').style.display = 'flex';
  } catch (e) {
    const body = document.getElementById('ai-panel-body');
    if (body) body.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--kritis)">
        <div style="font-size:24px;margin-bottom:10px">⚠️</div>
        <div style="font-size:13px;margin-bottom:6px">Groq AI Error</div>
        <div style="font-size:11px;color:var(--tx2)">${esc(e.message)}</div>
        ${!getData().groqApiKey ? '<div style="margin-top:12px;font-size:11px;color:var(--mu)">Pastikan Groq API Key sudah diatur di Pengaturan.</div>' : ''}
      </div>`;
  }
}

function renderDailyRecResult(r, patient, losHari) {
  const body = document.getElementById('ai-panel-body');
  if (!body) return;

  const prioColor = { BAIK: 'var(--stabil)', PERHATIAN: 'var(--phat)', KRITIS: 'var(--kritis)' }[r.prioritas] || 'var(--tx2)';
  const prioIcon  = { BAIK: '🟢', PERHATIAN: '🟡', KRITIS: '🔴' }[r.prioritas] || '⚪';

  const listHtml = (items, icon = '•') =>
    (items||[]).length
      ? `<ul class="ai-list">${items.map(i => `<li>${icon} ${esc(i)}</li>`).join('')}</ul>`
      : '<span style="color:var(--mu);font-size:11px">—</span>';

  body.innerHTML = `
  <div class="ai-result" id="ai-result-text">

    <!-- Header asesmen -->
    <div class="ai-sec ai-asesmen">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:18px">${prioIcon}</span>
        <span style="font-weight:700;font-size:14px;color:${prioColor}">${esc(r.prioritas)}</span>
        ${losHari !== null ? `<span class="los-badge ${calcLOS(patient.tglMRS)?.cls||''}" style="margin-left:4px">${calcLOS(patient.tglMRS)?.label||''}</span>` : ''}
      </div>
      <div style="font-size:12px;color:var(--tx2);line-height:1.7">${esc(r.asesmen)}</div>
    </div>

    <!-- Target hari ini -->
    <div class="ai-sec">
      <div class="ai-sec-title">🎯 Target Hari Ini</div>
      ${listHtml(r.targetHariIni, '→')}
    </div>

    <!-- Monitoring -->
    <div class="ai-sec">
      <div class="ai-sec-title">👁 Monitoring Ketat</div>
      ${listHtml(r.monitoringKetat, '📊')}
    </div>

    ${(r.rencanaTherapy||[]).length ? `
    <div class="ai-sec">
      <div class="ai-sec-title">💊 Saran Penyesuaian Terapi</div>
      ${listHtml(r.rencanaTherapy, '💊')}
    </div>` : ''}

    ${(r.rencanaLabImaging||[]).length ? `
    <div class="ai-sec">
      <div class="ai-sec-title">🧪 Lab / Imaging Hari Ini</div>
      ${listHtml(r.rencanaLabImaging, '🔬')}
    </div>` : ''}

    <div class="ai-sec">
      <div class="ai-sec-title">📅 Estimasi KRS</div>
      <div style="font-size:12px;color:var(--tx2)">${esc(r.targetKRS||'—')}</div>
    </div>

    <div class="ai-sec ai-warning">
      <div class="ai-sec-title" style="color:#fca5a5">⚠️ Warning Sign</div>
      ${listHtml(r.warningSign, '🚨')}
    </div>

    ${r.catatanKhusus ? `
    <div class="ai-sec">
      <div class="ai-sec-title">📝 Catatan Khusus</div>
      <div style="font-size:12px;color:var(--tx2)">${esc(r.catatanKhusus)}</div>
    </div>` : ''}

    <div class="ai-disclaimer">✦ Dihasilkan oleh Groq AI — Selalu verifikasi dengan klinis dan supervisi DPJP</div>
  </div>`;
}

function renderDischargeResult(r, patient, losHari) {
  const body = document.getElementById('ai-panel-body');
  if (!body) return;

  const listHtml = (items) =>
    (items||[]).length
      ? `<ul class="ai-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`
      : '<span style="color:var(--mu);font-size:11px">—</span>';

  body.innerHTML = `
  <div class="ai-result" id="ai-result-text">

    <div class="ai-sec" style="text-align:center;padding:12px;border-bottom:1px solid var(--bd);margin-bottom:12px">
      <div style="font-weight:700;font-size:14px;letter-spacing:.05em;color:var(--tx)">${esc(r.judulSurat)}</div>
      <div style="font-size:11px;color:var(--mu);margin-top:3px">${esc(patient.nama)} · Lama Rawat: ${losHari !== null ? losHari+' hari' : '?'}</div>
    </div>

    <div class="ai-sec">
      <div class="ai-sec-title">Diagnosis Akhir</div>
      <div style="font-size:13px;font-weight:600;color:var(--tx)">${esc(r.diagnosisAkhir||patient.diagnosisUtama)}</div>
    </div>

    <div class="ai-sec">
      <div class="ai-sec-title">Ringkasan Perawatan</div>
      <div style="font-size:12px;color:var(--tx2);line-height:1.7">${esc(r.ringkasanPerawatan)}</div>
    </div>

    <div class="ai-sec">
      <div class="ai-sec-title">Kondisi Saat Pulang</div>
      <div style="font-size:12px;color:var(--tx2)">${esc(r.kondisiPulang)}</div>
    </div>

    <div class="ai-sec">
      <div class="ai-sec-title">💊 Obat Pulang</div>
      ${listHtml(r.terapiPulang)}
    </div>

    <div class="ai-sec">
      <div class="ai-sec-title">📅 Kontrol Kembali</div>
      <div style="font-size:12px;color:var(--tx2)">${esc(r.kontrolKembali||'—')}</div>
    </div>

    <div class="ai-sec">
      <div class="ai-sec-title">📋 Instruksi untuk Pasien</div>
      ${listHtml(r.instruksiPasien)}
    </div>

    <div class="ai-sec ai-warning">
      <div class="ai-sec-title" style="color:#fca5a5">⚠️ Segera ke IGD Jika</div>
      ${listHtml(r.tandaBahaya)}
    </div>

    ${r.catatanDpjp ? `
    <div class="ai-sec">
      <div class="ai-sec-title">Catatan DPJP</div>
      <div style="font-size:12px;color:var(--tx2)">${esc(r.catatanDpjp)}</div>
    </div>` : ''}

    <div class="ai-disclaimer">✦ Draft oleh Groq AI — Wajib direview dan ditandatangani DPJP sebelum diberikan ke pasien</div>
  </div>`;
}

function copyAIResult() {
  const el = document.getElementById('ai-result-text');
  if (!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => showToast('Disalin ke clipboard', 'success'));
}

// ── FOTO LAB MODAL ────────────────────────────────────────────────
function openFotoModal(roomId, bedId) {
  const patient = getPatient(roomId, bedId);
  if (!patient) return;
  const room = getRoom(roomId);
  const fotos = patient.fotoLab || [];
  const totalKB = getTotalFotoSize();

  closeModal();

  const html = `
<div class="modal-overlay" id="foto-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box" style="max-width:680px">
    <div class="modal-header">
      <div class="modal-header-info">
        <div class="modal-title">🖼 Foto Hasil Lab</div>
        <div class="modal-sub">${esc(patient.nama)} · ${esc(room?.name||roomId)} · ${fotos.length} foto tersimpan</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">

      <!-- Upload Area -->
      <div class="foto-upload-zone" id="foto-drop-zone"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="handleFotoDrop(event,'${esc(roomId)}','${esc(bedId)}')">
        <input type="file" id="foto-file-input" accept="image/*" multiple style="display:none"
          onchange="handleFotoFileInput(this,'${esc(roomId)}','${esc(bedId)}')">
        <div class="foto-upload-icon">📷</div>
        <div class="foto-upload-text">Klik atau drop foto di sini</div>
        <div class="foto-upload-sub">JPG · PNG · WebP · HEIC — otomatis dikompres &lt;200KB/foto</div>
        <button class="bu bp" style="margin-top:8px" onclick="document.getElementById('foto-file-input').click()">
          Pilih Foto
        </button>
      </div>

      <!-- Storage info -->
      <div class="foto-storage-info">
        <span>💾 Total foto semua pasien: <b>${totalKB} KB</b></span>
        <span style="color:var(--mu)">/ ~5.000 KB tersedia di browser</span>
        <div class="foto-storage-bar">
          <div class="foto-storage-fill" style="width:${Math.min(100, totalKB/50)}%"></div>
        </div>
      </div>

      <!-- Progress bar saat upload -->
      <div id="foto-progress" style="display:none;margin-bottom:10px">
        <div style="font-size:11px;color:var(--mu);margin-bottom:4px" id="foto-progress-text">Memproses...</div>
        <div style="background:var(--sf2);border-radius:4px;height:4px;overflow:hidden">
          <div id="foto-progress-bar" style="background:var(--room);height:100%;width:0%;transition:width .2s"></div>
        </div>
      </div>

      <!-- Gallery -->
      <div id="foto-gallery">
        ${renderFotoGallery(fotos, roomId, bedId)}
      </div>

    </div>
    <div class="modal-footer">
      <button class="bu bgh" onclick="closeModal()">Tutup</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // Klik di zona upload (bukan tombol) juga buka file picker
  const zone = document.getElementById('foto-drop-zone');
  if (zone) {
    zone.addEventListener('click', e => {
      if (e.target.tagName !== 'BUTTON') {
        document.getElementById('foto-file-input')?.click();
      }
    });
  }
}

function renderFotoGallery(fotos, roomId, bedId) {
  if (!fotos.length) {
    return `<div class="foto-empty">
      <div style="font-size:28px;opacity:.3">🖼</div>
      <div style="font-size:12px;color:var(--mu);margin-top:8px">Belum ada foto lab tersimpan</div>
    </div>`;
  }

  return `<div class="foto-grid">
    ${fotos.map(f => `
    <div class="foto-card" id="foto-card-${f.id}">
      <div class="foto-img-wrap" onclick="openFotoLightbox('${esc(f.id)}','${esc(roomId)}','${esc(bedId)}')">
        <img class="foto-thumb" src="${f.dataUrl}" alt="${esc(f.nama)}" loading="lazy">
        <div class="foto-overlay">🔍 Lihat</div>
      </div>
      <div class="foto-meta">
        <div class="foto-nama">${esc(f.nama)}</div>
        <div class="foto-tgl">${esc(f.tanggal)} · ${Math.round(f.size/1024)} KB</div>
      </div>
      <button class="foto-del-btn" onclick="confirmDeleteFoto('${esc(roomId)}','${esc(bedId)}','${esc(f.id)}')" title="Hapus foto">✕</button>
    </div>`).join('')}
  </div>`;
}

// ── KOMPRES & SIMPAN FOTO ─────────────────────────────────────────
const FOTO_MAX_PX  = 1200;   // max lebar/tinggi setelah resize
const FOTO_QUALITY = 0.75;   // kualitas JPEG
const FOTO_MAX_KB  = 250;    // batas akhir per foto (KB)

/**
 * Kompres gambar via Canvas, return { dataUrl, size }
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ev => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down jika terlalu besar
        if (width > FOTO_MAX_PX || height > FOTO_MAX_PX) {
          const ratio = Math.min(FOTO_MAX_PX / width, FOTO_MAX_PX / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Background putih (penting untuk foto dengan transparency)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Coba kompres bertahap sampai di bawah FOTO_MAX_KB
        let quality = FOTO_QUALITY;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length * 0.75 > FOTO_MAX_KB * 1024 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({
          dataUrl,
          size: Math.round(dataUrl.length * 0.75), // approx bytes
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Proses array file, upload satu per satu dengan progress
 */
async function processAndSaveFotos(files, roomId, bedId) {
  const progressEl  = document.getElementById('foto-progress');
  const progressBar = document.getElementById('foto-progress-bar');
  const progressTxt = document.getElementById('foto-progress-text');

  if (progressEl) progressEl.style.display = 'block';

  let saved = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    if (progressTxt) progressTxt.textContent = `Memproses ${i+1}/${files.length}: ${file.name}`;
    if (progressBar) progressBar.style.width = `${((i+1)/files.length)*100}%`;

    try {
      // Cek sisa storage (estimasi kasar)
      const used = JSON.stringify(getData()).length;
      if (used > 4.5 * 1024 * 1024) { // >4.5MB
        showToast('Storage hampir penuh — hapus foto lama dulu', 'error', 5000);
        failed++;
        continue;
      }

      const { dataUrl, size } = await compressImage(file);

      // Nama otomatis dari nama file, strip extension
      const namaFile = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      const today = getTodayStr();

      const fotoObj = {
        id: genId(),
        nama: namaFile || 'Foto Lab',
        tanggal: today,
        dataUrl,
        size,
      };

      addFotoLab(roomId, bedId, fotoObj);
      saved++;
    } catch (e) {
      console.error('Gagal proses foto:', file.name, e);
      failed++;
    }
  }

  if (progressEl) progressEl.style.display = 'none';
  if (progressBar) progressBar.style.width = '0%';

  // Refresh gallery
  const patient = getPatient(roomId, bedId);
  const gallery = document.getElementById('foto-gallery');
  if (gallery && patient) {
    gallery.innerHTML = renderFotoGallery(patient.fotoLab || [], roomId, bedId);
  }

  // Update subtitle
  const sub = document.querySelector('#foto-modal .modal-sub');
  if (sub && patient) {
    const room = getRoom(roomId);
    sub.textContent = `${patient.nama} · ${room?.name||roomId} · ${(patient.fotoLab||[]).length} foto tersimpan`;
  }

  // Update storage info
  const storageEl = document.querySelector('.foto-storage-info b');
  const storageBar = document.querySelector('.foto-storage-fill');
  const totalKB = getTotalFotoSize();
  if (storageEl) storageEl.textContent = `${totalKB} KB`;
  if (storageBar) storageBar.style.width = `${Math.min(100, totalKB/50)}%`;

  if (saved > 0) showToast(`${saved} foto berhasil disimpan`, 'success');
  if (failed > 0) showToast(`${failed} foto gagal diproses`, 'error');
}

function handleFotoFileInput(input, roomId, bedId) {
  const files = Array.from(input.files);
  if (!files.length) return;
  processAndSaveFotos(files, roomId, bedId);
  input.value = ''; // reset agar bisa upload file sama lagi
}

function handleFotoDrop(event, roomId, bedId) {
  event.preventDefault();
  document.getElementById('foto-drop-zone')?.classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (!files.length) { showToast('Bukan file gambar', 'warn'); return; }
  processAndSaveFotos(files, roomId, bedId);
}

// ── DELETE FOTO ───────────────────────────────────────────────────
function confirmDeleteFoto(roomId, bedId, fotoId) {
  showConfirm(
    '🗑 Hapus Foto',
    'Yakin hapus foto ini? Tidak bisa dikembalikan.',
    () => {
      deleteFotoLab(roomId, bedId, fotoId);
      // Hapus dari gallery tanpa re-render seluruh modal
      document.getElementById(`foto-card-${fotoId}`)?.remove();
      // Jika gallery kosong, tampilkan empty state
      const grid = document.querySelector('.foto-grid');
      if (grid && !grid.children.length) {
        document.getElementById('foto-gallery').innerHTML = renderFotoGallery([], roomId, bedId);
      }
      const totalKB = getTotalFotoSize();
      const storageEl = document.querySelector('.foto-storage-info b');
      const storageBar = document.querySelector('.foto-storage-fill');
      if (storageEl) storageEl.textContent = `${totalKB} KB`;
      if (storageBar) storageBar.style.width = `${Math.min(100, totalKB/50)}%`;
      showToast('Foto dihapus', 'success');
    }
  );
}

// ── LIGHTBOX ──────────────────────────────────────────────────────
function openFotoLightbox(fotoId, roomId, bedId) {
  const fotos = getFotoLab(roomId, bedId);
  let idx = fotos.findIndex(f => f.id === fotoId);
  if (idx < 0) return;

  function renderLightbox() {
    const f = fotos[idx];
    const existing = document.getElementById('foto-lightbox');
    const html = `
<div class="foto-lightbox" id="foto-lightbox" onclick="if(event.target===this||event.target.id==='foto-lightbox')closeFotoLightbox()">
  <div class="foto-lb-inner">
    <button class="foto-lb-close" onclick="closeFotoLightbox()">✕</button>
    ${idx > 0 ? `<button class="foto-lb-nav foto-lb-prev" onclick="lbNav(-1,'${esc(roomId)}','${esc(bedId)}')">‹</button>` : ''}
    ${idx < fotos.length-1 ? `<button class="foto-lb-nav foto-lb-next" onclick="lbNav(1,'${esc(roomId)}','${esc(bedId)}')">›</button>` : ''}
    <img class="foto-lb-img" src="${f.dataUrl}" alt="${esc(f.nama)}">
    <div class="foto-lb-caption">
      <div class="foto-lb-nama">${esc(f.nama)}</div>
      <div class="foto-lb-meta">${esc(f.tanggal)} · ${Math.round(f.size/1024)} KB · ${idx+1}/${fotos.length}</div>
      <a href="${f.dataUrl}" download="lab-${esc(f.nama)}-${esc(f.tanggal)}.jpg" class="bu bgh" style="font-size:11px;margin-top:6px;text-decoration:none;display:inline-block">⬇ Download</a>
    </div>
  </div>
</div>`;

    if (existing) {
      existing.outerHTML = html;
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }

    // Keyboard navigation
    document.onkeydown = e => {
      if (e.key === 'ArrowLeft' && idx > 0) { idx--; renderLightbox(); }
      else if (e.key === 'ArrowRight' && idx < fotos.length-1) { idx++; renderLightbox(); }
      else if (e.key === 'Escape') closeFotoLightbox();
    };
  }

  renderLightbox();
}

// Helper dipanggil dari inline onclick di lightbox
function lbNav(dir, roomId, bedId) {
  const fotos = getFotoLab(roomId, bedId);
  const lb = document.getElementById('foto-lightbox');
  const img = lb?.querySelector('.foto-lb-img');
  if (!img) return;
  const curSrc = img.src;
  let idx = fotos.findIndex(f => f.dataUrl === curSrc);
  idx = Math.max(0, Math.min(fotos.length-1, idx + dir));
  openFotoLightbox(fotos[idx].id, roomId, bedId);
}

function closeFotoLightbox() {
  document.getElementById('foto-lightbox')?.remove();
  document.onkeydown = null;
}
