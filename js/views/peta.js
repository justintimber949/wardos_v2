/**
 * WardOS v2 — Peta Ruangan View
 */

function renderPeta() {
  const container = document.getElementById('v-peta');
  if (!container) return;
  const d = getData();

  const legend = `
  <div class="lg">
    <span><span class="lsq" style="background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3)"></span>Aktif</span>
    <span><span class="lsq" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25)"></span>Perhatian</span>
    <span><span class="lsq" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3)"></span>Kritis</span>
    <span><span class="lsq" style="background:rgba(75,83,99,.08);border:1px solid rgba(75,83,99,.2)"></span>KRS</span>
    <span><span class="lsq" style="background:rgba(75,16,16,.12);border:1px solid rgba(150,40,40,.2)"></span>Meninggal</span>
    <span><span class="lsq" style="background:var(--sf2);border:1px solid var(--bd)"></span>Kosong</span>
    <span style="font-family:var(--mono);font-size:9px;border:1px solid rgba(59,130,246,.4);padding:1px 5px;border-radius:3px;background:rgba(59,130,246,.1);color:#7aa8f8">outline biru = masuk hari ini</span>
    <span style="font-size:10px;color:var(--mu);margin-left:auto;font-family:var(--mono)">klik bed → modal detail</span>
  </div>`;

  const roomCards = d.rooms.map(room => renderRoomMapCard(room)).join('');

  container.innerHTML = legend + `<div class="mapg">${roomCards}</div>`;
  updateTopbar('🗺 Peta Ruangan', 'Semua ruangan sekaligus · klik bed → modal', '');
}

function renderRoomMapCard(room) {
  const st = getRoomStats(room.id);
  const infoStr = `${st.terisi}/${st.total}${st.kritis ? ' · ' + st.kritis + '🔴' : ''}`;

  let bedHtml = '';
  for (const kamar of room.kamar) {
    if (room.kamar.length > 1) {
      bedHtml += `<div class="ksep">${esc(kamar.name)}</div>`;
    }
    for (const bed of kamar.beds) {
      const p = bed.patient;
      if (!p) {
        bedHtml += `<div class="mb"><div class="mb-id" style="color:var(--mu)">${esc(bed.name)}</div></div>`;
      } else {
        const cls = getMiniBeClass(p.status);
        const todayClass = (p._mrsAutoSet && p.tglMRS === getTodayStr()) ? ' today' : '';
        const firstName = (p.nama || '').split(' ').slice(-1)[0];
        bedHtml += `<div class="mb ${cls}${todayClass}" onclick="openPatientModal('${esc(room.id)}','${esc(bed.id)}')" title="${esc(p.nama)}\n${esc(p.diagnosisUtama)}">
          <div class="mb-id">${esc(bed.name)}</div>
          <div class="mb-nm">${esc(firstName)}</div>
        </div>`;
      }
    }
  }

  return `
  <div class="mrc">
    <div class="mrc-head" onclick="navigate('room','${esc(room.id)}')">
      <div class="rd" style="background:${room.color}"></div>
      <div class="mrn">${room.icon} ${esc(room.name)}</div>
      <div class="mro">${infoStr}</div>
    </div>
    <div class="bwrp">${bedHtml}</div>
  </div>`;
}

function getMiniBeClass(status) {
  const map = {
    stabil: 'stabil', perhatian: 'perhatian', kritis: 'kritis',
    krs: 'krs', meninggal: 'meninggal', lepas_rawat: 'krs',
    rencana_rujuk: 'perhatian',
  };
  return map[status] || 'stabil';
}
