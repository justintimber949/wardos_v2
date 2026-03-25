/**
 * WardOS v2 — Dashboard View
 */

let _dashFilters = { search: '', room: '', status: '', dokter: '', today: '' };

function renderDashboard() {
  const stats = getSummaryStats();
  const allPatients = getAllPatients();
  const doctors = getAllDoctors();
  const d = getData();

  // Build stat cards
  const cards = `
  <div class="srow">
    <div class="sc"><div class="slbl">Total Aktif</div><div class="sval" style="color:var(--tx)">${stats.aktif}</div><div class="ssub">dari ${d.rooms.length} ruangan</div></div>
    <div class="sc"><div class="slbl">Kritis</div><div class="sval" style="color:var(--kritis)">${stats.kritis}</div><div class="ssub"><span class="sdot kritis" style="width:6px;height:6px"></span>${stats.kritisBreakdown||'—'}</div></div>
    <div class="sc"><div class="slbl">KRS Hari Ini</div><div class="sval" style="color:var(--krs)">${stats.krsToday}</div><div class="ssub">riwayat tersimpan</div></div>
    <div class="sc"><div class="slbl">Masuk Hari Ini</div><div class="sval" style="color:#7aa8f8">${stats.masukToday}</div><div class="ssub">pasien baru hari ini</div></div>
  </div>`;

  // Today filter pills
  const pills = `
  <div class="today-filter-row">
    <span style="font-size:11px;color:var(--mu)">Filter hari ini:</span>
    <button class="tf-pill ${_dashFilters.today==='masuk'?'f-masuk':''}" onclick="setTodayFilter('masuk',this)"><div class="tf-dot" style="background:#5878e8"></div><span class="today-tag tt-masuk">Masuk Hari Ini</span>&nbsp;(${stats.masukToday})</button>
    <button class="tf-pill ${_dashFilters.today==='krs'?'f-krs':''}" onclick="setTodayFilter('krs',this)"><div class="tf-dot" style="background:var(--krs)"></div><span class="today-tag tt-krs">KRS Hari Ini</span>&nbsp;(${stats.krsToday})</button>
    <button class="tf-pill ${_dashFilters.today==='mng'?'f-mng':''}" onclick="setTodayFilter('mng',this)"><div class="tf-dot" style="background:#7f1d1d"></div><span class="today-tag tt-mng">Meninggal Hari Ini</span>&nbsp;(${allPatients.filter(p=>p.patient.status==='meninggal'&&(p.patient.tglMeninggal?isTodayLocal(p.patient.tglMeninggal):isTodayLocal(p.patient.updatedAt))).length})</button>
    <button class="tf-pill ${_dashFilters.today==='pindah'?'f-pindah':''}" onclick="setTodayFilter('pindah',this)"><div class="tf-dot" style="background:#f59e0b"></div><span class="today-tag tt-pindah">Pindah Hari Ini</span></button>
  </div>`;

  // Filter row
  const doctorOpts = doctors.map(doc => `<option ${_dashFilters.dokter===doc?'selected':''}>${esc(doc)}</option>`).join('');
  const filterRow = `
  <div class="frow">
    <input class="fsrch" placeholder="🔍  Cari nama, Dx, bed, dokter..." id="dash-search" value="${esc(_dashFilters.search)}" oninput="applyDashFilters()">
    <select class="fsel" id="dash-room" onchange="applyDashFilters()">
      <option value="">Semua Ruangan</option>
      ${d.rooms.map(r=>`<option value="${r.id}" ${_dashFilters.room===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}
    </select>
    <select class="fsel" id="dash-status" onchange="applyDashFilters()">
      <option value="">Semua Status</option>
      <option value="kritis" ${_dashFilters.status==='kritis'?'selected':''}>🔴 Kritis</option>
      <option value="perhatian" ${_dashFilters.status==='perhatian'?'selected':''}>🟡 Perhatian</option>
      <option value="stabil" ${_dashFilters.status==='stabil'?'selected':''}>🟢 Stabil</option>
      <option value="krs" ${_dashFilters.status==='krs'?'selected':''}>⚫ KRS</option>
      <option value="meninggal" ${_dashFilters.status==='meninggal'?'selected':''}>⚫ Meninggal</option>
      <option value="lepas_rawat" ${_dashFilters.status==='lepas_rawat'?'selected':''}>✅ Lepas Rawat</option>
      <option value="rencana_rujuk" ${_dashFilters.status==='rencana_rujuk'?'selected':''}>➡️ Rencana Rujuk</option>
    </select>
    <select class="fsel" id="dash-dokter" onchange="applyDashFilters()">
      <option value="">Semua Dokter</option>
      ${doctorOpts}
    </select>
    <button class="badd" onclick="navigate('input')">+ Input Pasien</button>
  </div>`;

  // Patient list per room
  const listHtml = renderPatientList(allPatients);

  const container = document.getElementById('v-dashboard');
  if (container) {
    container.innerHTML = cards + pills + filterRow + '<div id="dash-patient-list">' + listHtml + '</div>';
  }

  // Update topbar
  const chipsHtml = `
    <div class="chip"><div class="cdot" style="background:var(--tx2)"></div>&nbsp;${stats.aktif} aktif</div>
    ${stats.kritis > 0 ? `<div class="chip"><div class="cdot" style="background:var(--kritis)"></div>&nbsp;${stats.kritis} kritis</div>` : ''}
    ${stats.krsToday > 0 ? `<div class="chip"><div class="cdot" style="background:var(--krs)"></div>&nbsp;${stats.krsToday} KRS</div>` : ''}`;
  updateTopbar('📊 Dashboard', 'Ikhtisar semua pasien · filter · dokter · hari ini', chipsHtml);
}

function renderPatientList(allPatients) {
  const { search, room: roomFilter, status: statusFilter, dokter: dokterFilter, today: todayFilter } = _dashFilters;

  // Apply filters
  let filtered = allPatients.filter(({ patient, roomId }) => {
    if (roomFilter && roomId !== roomFilter) return false;
    if (statusFilter && patient.status !== statusFilter) return false;
    if (dokterFilter) {
      const hasDr = patient.dpjp?.nama?.toLowerCase().includes(dokterFilter.toLowerCase()) ||
                    (patient.timDokter||[]).some(t=>t.nama?.toLowerCase().includes(dokterFilter.toLowerCase()));
      if (!hasDr) return false;
    }
    if (todayFilter === 'masuk') {
      if (!patient._mrsAutoSet || patient.tglMRS !== getTodayStr()) return false;
    }
    if (todayFilter === 'krs') {
      if (!['krs','lepas_rawat'].includes(patient.status)) return false;
      const tglRef = patient.tglKRS || patient.updatedAt;
      if (!isTodayLocal(tglRef)) return false;
    }
        if (todayFilter === 'mng') {
      if (patient.status !== 'meninggal') return false;
      const tglRef = patient.tglMeninggal || patient.updatedAt;
      if (!isTodayLocal(tglRef)) return false;
    }
    if (todayFilter === 'pindah') {
      const hasPindahToday = (patient.pindahan||[]).some(p => p.tanggal && isTodayLocal(p.tanggal));
      if (!hasPindahToday) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        patient.nama, patient.diagnosisUtama,
        ...(patient.diagnosisSekunder||[]),
        patient.dpjp?.nama, patient._bedId,
        ...(patient.timDokter||[]).map(t=>t.nama),
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    return `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Tidak ada pasien ditemukan</div><div class="empty-sub">Coba ubah filter atau tambah pasien baru</div></div>`;
  }

  // Group by room
  const byRoom = {};
  for (const item of filtered) {
    if (!byRoom[item.roomId]) byRoom[item.roomId] = { ...item, patients: [] };
    byRoom[item.roomId].patients.push(item);
  }

  let html = '';
  for (const [roomId, group] of Object.entries(byRoom)) {
    const aktif = group.patients.filter(p => ['stabil','perhatian','kritis','rencana_rujuk'].includes(p.patient.status)).length;
    const kritis = group.patients.filter(p => p.patient.status === 'kritis').length;
    const krs = group.patients.filter(p => ['krs','lepas_rawat','meninggal'].includes(p.patient.status)).length;
    const statusStr = [aktif?`${aktif} aktif`:'', kritis?`${kritis} kritis`:'', krs?`${krs} KRS`:''].filter(Boolean).join(' · ');
    html += `
    <div class="rsec">
      <div class="rshd">
        <div class="rd" style="background:${group.roomColor}"></div>
        <div class="rsn" style="color:${group.roomColor}">${esc(group.roomName)}</div>
        <div class="rsl"></div>
        <div class="rsc">${statusStr}</div>
      </div>
      ${group.patients.map(item => renderPatientCard(item)).join('')}
    </div>`;
  }
  return html;
}

function renderPatientCard({ patient, roomId, bedId, bedName }) {
  const sc = statusClass(patient.status);
  const todayTags = getTodayTags(patient);
  const vitals = renderVitalChips(patient.vital);
  const trail = patient.pindahan?.length ? renderTrail(patient.pindahan) : '';
  const nameStyle = ['krs','meninggal','lepas_rawat'].includes(patient.status) ? 'text-decoration:line-through;color:var(--tx2)' : '';

  return `
  <div class="ptc ${sc}" onclick="openPatientModal('${esc(roomId)}','${esc(bedId)}')">
    <div class="btag" style="${getBedTagStyle(patient.status)}">${esc(bedName||bedId).replaceAll('-','\n')}</div>
    <div class="pi">
      <div class="pn">
        <span style="${nameStyle}">${esc(patient.nama)}</span>
        <span style="font-weight:400;font-size:10px;color:var(--mu)">${patient.usia?patient.usia+'th':''}${patient.jk?' · '+patient.jk:''}</span>
        ${renderLOSBadge(patient.tglMRS)}
        ${todayTags}
      </div>
      <div class="pd">${esc(patient.diagnosisUtama)}${patient.diagnosisSekunder?.length ? ', ' + patient.diagnosisSekunder.slice(0,2).map(esc).join(', ') : ''}</div>
      <div class="pm">${formatDoctorLine(patient.dpjp, patient.timDokter, patient.konsul)}</div>
      ${vitals ? `<div class="pv">${vitals}</div>` : ''}
      ${trail}
    </div>
    <div class="sdot ${patient.status}"></div>
  </div>`;
}

function getBedTagStyle(status) {
  const styles = {
    kritis: 'background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.3);color:#f87171',
    perhatian: 'background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.2);color:#fbbf24',
    stabil: 'background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.2);color:#60a5fa',
    krs: 'background:rgba(75,83,99,.1);border-color:rgba(75,83,99,.2);color:#9ca3af',
    meninggal: 'background:rgba(75,16,16,.15);border-color:rgba(150,40,40,.2);color:#fca5a5',
    lepas_rawat: 'background:rgba(75,83,99,.1);border-color:rgba(75,83,99,.2);color:#9ca3af',
  };
  return styles[status] || styles.stabil;
}

function applyDashFilters() {
  _dashFilters.search = document.getElementById('dash-search')?.value || '';
  _dashFilters.room = document.getElementById('dash-room')?.value || '';
  _dashFilters.status = document.getElementById('dash-status')?.value || '';
  _dashFilters.dokter = document.getElementById('dash-dokter')?.value || '';
  const listEl = document.getElementById('dash-patient-list');
  if (listEl) listEl.innerHTML = renderPatientList(getAllPatients());
}

function setTodayFilter(type, btn) {
  if (_dashFilters.today === type) {
    _dashFilters.today = '';
    btn.className = 'tf-pill';
  } else {
    _dashFilters.today = type;
    document.querySelectorAll('.tf-pill').forEach(el => el.className = 'tf-pill');
    btn.className = `tf-pill f-${type}`;
  }
  const listEl = document.getElementById('dash-patient-list');
  if (listEl) listEl.innerHTML = renderPatientList(getAllPatients());
}
