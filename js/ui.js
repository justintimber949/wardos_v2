/**
 * WardOS v2 — UI Helpers
 * Sidebar, Toast, Shared Renders
 */

// ── TOAST ─────────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };
  t.innerHTML = `<span style="font-size:13px;flex-shrink:0">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut .2s ease forwards';
    setTimeout(() => t.remove(), 250);
  }, duration);
}

// ── FORMAT DOCTOR LINE ────────────────────────────────────────────
/**
 * Returns HTML: [DPJP tag biru] · tim teks · [KONSUL tag kuning]
 */
function formatDoctorLine(dpjp, timDokter, konsul) {
  let html = '';
  if (dpjp && dpjp.nama) {
    html += `<span class="dpjp-tag">${esc(dpjp.nama)}</span>`;
  }
  if (timDokter && timDokter.length) {
    const tims = timDokter.map(t => esc(t.nama)).join(' · ');
    html += `<span class="dpjp-tim"> · ${tims}</span>`;
  }
  if (konsul && konsul.length) {
    konsul.forEach(k => {
      html += ` <span class="ktag">KONSUL ${esc(k.spesialis)} ${esc(k.tanggal)}</span>`;
    });
  }
  return html || '<span style="color:var(--mu);font-size:11px">—</span>';
}

// ── STATUS HELPERS ────────────────────────────────────────────────
function statusClass(status) {
  const map = {
    stabil: 's', perhatian: 'p', kritis: 'k',
    krs: 'krs', meninggal: 'mng', lepas_rawat: 'krs', rencana_rujuk: 'p',
  };
  return map[status] || 's';
}

function statusDotHtml(status) {
  return `<span class="sdot ${status}"></span>`;
}

function statusLabel(status) {
  const map = { stabil:'Stabil', perhatian:'Perhatian', kritis:'Kritis', krs:'KRS', meninggal:'Meninggal', lepas_rawat:'Lepas Rawat', rencana_rujuk:'Rencana Rujuk' };
  return map[status] || status;
}

// ── ESCAPE HTML ───────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── VITAL CHIPS ───────────────────────────────────────────────────
function renderVitalChips(vital) {
  if (!vital) return '';
  const chips = [];
  if (vital.spo2) {
    const cls = vital.spo2 < 90 ? 'c' : vital.spo2 < 95 ? 'w' : '';
    chips.push(`<span class="vc ${cls}">SpO₂ ${vital.spo2}%</span>`);
  }
  if (vital.hr) {
    const cls = vital.hr > 150 ? 'c' : vital.hr > 100 ? 'w' : '';
    chips.push(`<span class="vc ${cls}">HR ${vital.hr}</span>`);
  }
  if (vital.rr) {
    const cls = vital.rr > 35 ? 'c' : vital.rr > 25 ? 'w' : '';
    chips.push(`<span class="vc ${cls}">RR ${vital.rr}</span>`);
  }
  if (vital.td) chips.push(`<span class="vc">TD ${vital.td}</span>`);
  if (vital.o2 && vital.o2 !== 'RA') chips.push(`<span class="vc">O₂ ${vital.o2}</span>`);
  return chips.join('');
}

// ── PINDAHAN TRAIL ────────────────────────────────────────────────
function renderTrail(pindahan) {
  if (!pindahan || !pindahan.length) return '';
  const nodes = [];
  if (pindahan.length > 0) nodes.push(`<span class="ptn">${esc(pindahan[0].dari)}</span>`);
  for (const p of pindahan) {
    nodes.push(`<span class="pta">→</span><span class="ptn" style="background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.25);color:#34d399">${esc(p.ke)}${p.tanggal ? ' <span style="color:var(--mu);">'+esc(p.tanggal)+'</span>':''}</span>`);
  }
  return `<div class="ptrl">${nodes.join('')}</div>`;
}

// ── TODAY TAGS ────────────────────────────────────────────────────
/**
 * "Masuk Hari Ini" = tglMRS sama dengan hari ini.
 * Jika tglMRS tidak ada (data lama), fallback ke createdAt hari ini.
 */
function getTodayTags(patient) {
  const tags = [];
  const todayStr = getTodayStr(); // "YYYY-MM-DD" dari data.js

  // Masuk Hari Ini: hanya saat _mrsAutoSet (tidak mengisi MRS, sistem auto-set ke hari ini)
  const isMasukHariIni = !!patient._mrsAutoSet && patient.tglMRS === todayStr;
  if (isMasukHariIni) tags.push(`<span class="today-tag tt-masuk">Masuk Hari Ini</span>`);

  // KRS Hari Ini: utamakan tglKRS, fallback ke updatedAt (data lama)
  const isKrsHariIni = ['krs','lepas_rawat'].includes(patient.status) && (
    patient.tglKRS ? isTodayLocal(patient.tglKRS) : (isTodayLocal(patient.updatedAt) && !isMasukHariIni)
  );
  if (isKrsHariIni) tags.push(`<span class="today-tag tt-krs">KRS Hari Ini</span>`);

  // Meninggal Hari Ini: utamakan tglMeninggal, fallback ke updatedAt (data lama)
  const isMeninggalHariIni = patient.status === 'meninggal' && (
    patient.tglMeninggal ? isTodayLocal(patient.tglMeninggal) : isTodayLocal(patient.updatedAt)
  );
  if (isMeninggalHariIni) tags.push(`<span class="today-tag tt-mng">Meninggal Hari Ini</span>`);

  // Pindah Hari Ini: cek entri pindahan yang tanggalnya hari ini
  const isPindahHariIni = !isMasukHariIni &&
    (patient.pindahan || []).some(p => p.tanggal && isTodayLocal(p.tanggal));
  if (isPindahHariIni) tags.push(`<span class="today-tag tt-pindah">Pindah Hari Ini</span>`);

  return tags.join('');
}

// ── SIDEBAR RENDER ────────────────────────────────────────────────
function renderSidebar() {
  const d = getData();
  // Update hospital name
  const logoEl = document.querySelector('.logo-s');
  if (logoEl) logoEl.textContent = d.hospitalName || 'RSUD Karsa Husada Batu';

  // Update room list
  const sbRooms = document.getElementById('sb-rooms');
  if (!sbRooms) return;
  sbRooms.innerHTML = '';

  for (const room of d.rooms) {
    const st = getRoomStats(room.id);
    const hasKritis = st.kritis > 0;
    const btn = document.createElement('button');
    btn.className = 'ni';
    btn.id = `n-${room.id}`;
    btn.style.fontSize = '11px';
    const countEl = hasKritis
      ? `<span class="kb">${st.kritis}🔴</span>`
      : `<span class="nc">${st.terisi}/${st.total}</span>`;
    btn.innerHTML = `<div class="rd" style="background:${room.color}"></div>${esc(room.name)}${countEl}`;
    btn.onclick = () => navigate('room', room.id);
    sbRooms.appendChild(btn);
  }

  // Render sidebar bottom actions — 2 tombol utama
  const sbb = document.querySelector('.sbb');
  if (sbb) {
    sbb.innerHTML = `
      <button class="sa" onclick="openExportModal()">📤 Export Pasien</button>
      <button class="sa" onclick="openImportModal()">📥 Import Pasien</button>
      <button class="sa" onclick="openSettings()">⚙️ Pengaturan</button>
    `;
  }

  // Update dashboard badge (total kritis)
  const stats = getSummaryStats();
  const dashBtn = document.getElementById('n-dashboard');
  if (dashBtn) {
    const kbEl = dashBtn.querySelector('.kb');
    if (stats.kritis > 0) {
      if (kbEl) kbEl.textContent = `${stats.kritis}🔴`;
      else dashBtn.insertAdjacentHTML('beforeend', `<span class="kb">${stats.kritis}🔴</span>`);
    } else {
      if (kbEl) kbEl.remove();
    }
  }
}

// ── TOPBAR UPDATE ─────────────────────────────────────────────────
function updateTopbar(title, sub, chipsHtml = '') {
  const tt = document.getElementById('topbar-title');
  const ts = document.getElementById('topbar-sub');
  const tr = document.getElementById('topbar-right');
  if (tt) tt.textContent = title;
  if (ts) ts.textContent = sub;
  if (tr) tr.innerHTML = chipsHtml;
}

// ── DOCTOR DROPDOWN DATA ──────────────────────────────────────────
function getAllDoctors() {
  const docs = new Set();
  for (const { patient } of getAllPatients()) {
    if (patient.dpjp?.nama) docs.add(patient.dpjp.nama);
    (patient.timDokter || []).forEach(d => d.nama && docs.add(d.nama));
  }
  return [...docs].sort();
}

// ── FORMAT TANGGAL MRS ────────────────────────────────────────────
/**
 * Format tglMRS ke DD/MM/YYYY untuk tampilan.
 * Menerima YYYY-MM-DD (dari form/parser) atau DD/MM/YYYY (dari teks lama).
 */
function formatTglMRS(tglMRS) {
  if (!tglMRS) return '—';
  // Sudah format DD/MM/YYYY atau DD/MM
  if (/^\d{1,2}\/\d{1,2}/.test(tglMRS)) return tglMRS;
  // Format YYYY-MM-DD → DD/MM/YYYY
  const m = tglMRS.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return tglMRS;
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Disalin ke clipboard', 'success'));
}

// ── LENGTH OF STAY (LOS) ──────────────────────────────────────────
/**
 * Hitung LOS dari tglMRS (YYYY-MM-DD) ke hari ini (local).
 * Returns { days, label, cls }
 *   cls: '' normal | 'los-warn' ≥7 hari | 'los-alert' ≥14 hari
 */
function calcLOS(tglMRS) {
  if (!tglMRS) return null;
  // tglMRS bisa YYYY-MM-DD atau ISO string
  const base = tglMRS.length > 10 ? tglMRS : tglMRS + 'T00:00:00';
  const mrs = new Date(base);
  if (isNaN(mrs.getTime())) return null;

  const now = new Date();
  // Reset ke midnight local agar hitungan per-hari akurat
  const mrsDay = new Date(mrs.getFullYear(), mrs.getMonth(), mrs.getDate());
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - mrsDay) / 86400000);
  if (days < 0) return null;

  const label = days === 0 ? 'Hari ini MRS' : `Hari ke-${days + 1}`;
  const cls   = days >= 14 ? 'los-alert' : days >= 7 ? 'los-warn' : 'los-ok';
  return { days, label, cls };
}

/**
 * Render badge LOS untuk ditempel di card atau modal.
 * Returns HTML string.
 */
function renderLOSBadge(tglMRS) {
  const los = calcLOS(tglMRS);
  if (!los) return '';
  return `<span class="los-badge ${los.cls}" title="Length of Stay">${los.label}</span>`;
}
