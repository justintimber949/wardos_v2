/**
 * WardOS v2 — Room View (Bed Grid)
 */

function renderRoom(roomId) {
  const container = document.getElementById('v-room');
  if (!container) return;
  const room = getRoom(roomId);
  if (!room) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏥</div><div class="empty-text">Ruangan tidak ditemukan</div></div>`;
    return;
  }

  const st = getRoomStats(roomId);
  let html = `<div class="room-view-inner">`;

  for (const kamar of room.kamar) {
    const occupied = kamar.beds.filter(b => b.patient).length;
    html += `
    <div class="kamar-block">
      <div class="kamar-header">
        <div class="kamar-name">${esc(kamar.name)}</div>
        <div class="kamar-count">${occupied}/${kamar.beds.length} terisi</div>
      </div>
      <div class="bed-grid">
        ${kamar.beds.map(bed => renderBedCard(room, kamar, bed)).join('')}
      </div>
    </div>`;
  }
  html += `</div>`;
  container.innerHTML = html;

  // Topbar
  const chipsHtml = `
    <div class="chip"><div class="cdot" style="background:${room.color}"></div>&nbsp;${st.terisi}/${st.total} terisi</div>
    ${st.kritis ? `<div class="chip"><div class="cdot" style="background:var(--kritis)"></div>&nbsp;${st.kritis} kritis</div>` : ''}`;
  updateTopbar(`${room.icon} ${room.name}`, 'Bed grid · kamar per kamar', chipsHtml);
}

function renderBedCard(room, kamar, bed) {
  const p = bed.patient;
  if (!p) {
    return `
    <div class="bed-card empty clickable" title="Klik untuk tambah pasien di bed ini"
         onclick="confirmAddFromBed('${esc(room.id)}','${esc(bed.id)}','${esc(room.name)}','${esc(bed.name)}')">
      <div class="bc-id">${esc(bed.name)}</div>
      ${bedSvgIcon('#1c2e48')}
      <div class="bed-add-hint">+ Tambah pasien</div>
    </div>`;
  }

  const sc = `status-${p.status}`;
  const todayCls = (p._mrsAutoSet && p.tglMRS === getTodayStr()) ? ' today-masuk' : '';
  const nameStyle = ['krs','meninggal','lepas_rawat'].includes(p.status) ? ' bc-strikethrough' : '';
  const dxShort = [p.diagnosisUtama, ...(p.diagnosisSekunder||[])].join(', ');
  const dpjpShort = p.dpjp?.nama || '';

  return `
  <div class="bed-card ${sc}${todayCls}" onclick="openPatientModal('${esc(room.id)}','${esc(bed.id)}')">
    <div class="bc-id">${esc(bed.name)}</div>
    <div class="bc-dot">${statusDotHtml(p.status)}</div>
    ${bedSvgIcon(getBedSvgColor(p.status))}
    <div class="${nameStyle ? 'bc-strikethrough' : ''}">
      <div class="bc-name">${esc(p.nama)}</div>
    </div>
    <div class="bc-dx">${esc(dxShort)}</div>
    <div class="bc-doc">${esc(dpjpShort)}</div>
  </div>`;
}

function getBedSvgColor(status) {
  const m = {
    stabil: '#10b981', perhatian: '#f59e0b', kritis: '#ef4444',
    krs: '#4b5563', meninggal: '#5a1010', lepas_rawat: '#4b5563',
    rencana_rujuk: '#f59e0b',
  };
  return m[status] || '#253655';
}

function bedSvgIcon(color) {
  return `<svg class="bed-svg-icon" width="90" height="36" viewBox="0 0 90 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Frame -->
    <rect x="2" y="14" width="86" height="18" rx="3" fill="${color}22" stroke="${color}55" stroke-width="1.5"/>
    <!-- Headboard -->
    <rect x="2" y="8" width="14" height="24" rx="2" fill="${color}33" stroke="${color}66" stroke-width="1.5"/>
    <!-- Footboard -->
    <rect x="74" y="14" width="14" height="18" rx="2" fill="${color}22" stroke="${color}44" stroke-width="1.5"/>
    <!-- Pillow -->
    <rect x="18" y="10" width="22" height="12" rx="3" fill="${color}44" stroke="${color}66" stroke-width="1"/>
    <!-- Mattress -->
    <rect x="18" y="16" width="54" height="14" rx="2" fill="${color}22" stroke="${color}44" stroke-width="1"/>
    <!-- Legs -->
    <rect x="4" y="30" width="4" height="5" rx="1" fill="${color}44"/>
    <rect x="82" y="30" width="4" height="5" rx="1" fill="${color}44"/>
  </svg>`;
}

function confirmAddFromBed(roomId, bedId, roomName, bedName) {
  showConfirm(
    '➕ Tambah Pasien',
    `Tambah pasien baru di <b>${esc(roomName)} · Bed ${esc(bedName)}</b>?`,
    () => {
      // Buka form dengan room dan bed sudah terpilih
      openFormModal(roomId, bedId, null);
    }
  );
}
