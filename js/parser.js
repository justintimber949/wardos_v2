/**
 * WardOS v2 — Parser Module
 * Slash parser + 4 Batch format parsers
 */

// ── ROOM ALIAS MAP (STATIC) ───────────────────────────────────────
// Variasi penulisan → ID ruangan default. Digunakan sebagai base fallback.
const STATIC_ROOM_ALIASES = {
  // Ruangan default RSUD Karsa Husada Batu
  'amarilis': 'amarilis',
  'edelweis a': 'edelweis-a', 'edelweis-a': 'edelweis-a', 'edelwis a': 'edelweis-a',
  'edelweis b': 'edelweis-b', 'edelweis-b': 'edelweis-b', 'edelwis b': 'edelweis-b',
  'edel a': 'edelweis-a', 'edel b': 'edelweis-b',
  'vip': 'vip', 'tulip': 'vip', 'vinolia': 'vip', 'vip dan vvip': 'vip',
  'cvcu': 'cvcu',
  'hcu': 'hcu',
  'icu': 'icu',
  'krisan': 'krisan',
  'kemuning': 'kemuning',
  'dahlia': 'dahlia',
  // Ruangan umum lain yang sering muncul di laporan
  'matahari': 'matahari',
  'igd': 'igd', 'igdp': 'igd',
  'seruni': 'seruni',
  'perina': 'perina',
  'kaber': 'kaber',
  'vk': 'matahari',  // VK (Verlos Kamer) = kamar bersalin = Matahari ObGyn
  'rk': 'edelweis-b', // RK = Ruang Khusus Edelweis B
  'iso': 'edelweis-b', // ISO bed = Edelweis B
  'ricu': 'hcu', // RICU = bagian dari HCU
};

/**
 * Bangun alias map gabungan: static aliases + semua ruangan dari getData().rooms
 * Dipanggil setiap kali parse agar ruangan custom ikut dikenali.
 */
function buildRoomAliases() {
  const map = { ...STATIC_ROOM_ALIASES };
  try {
    const rooms = getData().rooms || [];
    for (const r of rooms) {
      const key = r.name.toLowerCase().trim();
      if (!map[key]) map[key] = r.id;
      // Juga daftarkan versi tanpa spasi dan dengan dash
      const keyDash = key.replace(/\s+/g, '-');
      if (!map[keyDash]) map[keyDash] = r.id;
    }
  } catch (e) { /* getData mungkin belum siap saat pertama kali load */ }
  return map;
}

function normalizeRoomId(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const aliases = buildRoomAliases();
  return aliases[lower] || lower.replace(/\s+/g, '-');
}

// ── NORMALIZE BED ID ──────────────────────────────────────────────
function normalizeBedId(input) {
  if (!input) return input;
  const s = input.trim();

  // Static exact-match map
  const map = {
    'RK C':'RK-C','RK D':'RK-D','RK-C':'RK-C','RK-D':'RK-D',
    'ISO B':'ISO-B','ISO A':'ISO-A','ISO-B':'ISO-B','ISO-A':'ISO-A',
    'IW IGD':'IW-IGD','IWIGD':'IW-IGD','IW-IGD':'IW-IGD',
  };
  const upper = s.toUpperCase();
  if (map[upper]) return map[upper];

  // ICU N / ICU-N / ICU NN (1-2 digit)
  if (/^ICU[\s-]?(\d+)$/i.test(s)) return 'ICU-' + s.replace(/[^0-9]/g,'');
  // ICU ISO N
  if (/^ICU[\s-]?ISO[\s-]?(\d+)$/i.test(s)) return 'ICU-ISO-' + s.replace(/[^0-9]/g,'');
  // HCU-ICU N
  if (/^HCU[\s-]ICU[\s-]?(\d+)$/i.test(s)) return 'HCU-ICU-' + s.replace(/[^0-9]/g,'');
  // RICU N / HCU-RICU N
  if (/^(HCU[\s-])?RICU[\s-]?(\d+)$/i.test(s)) return 'RICU-' + s.replace(/[^0-9]/g,'');
  // HCU N
  if (/^HCU[\s-]?(\d+)$/i.test(s)) return 'HCU-' + s.replace(/[^0-9]/g,'');
  // VK N / VK-N
  if (/^VK[\s-]?(\d+)$/i.test(s)) return 'VK-' + s.replace(/[^0-9]/g,'');
  // Tulip N
  if (/^tulip[\s-]?\d+$/i.test(s)) return 'Tulip-' + s.replace(/[^0-9]/g,'');
  // Vinolia N
  if (/^vinolia[\s-]?\d+$/i.test(s)) return 'Vinolia-' + s.replace(/[^0-9]/g,'');
  // VIP N
  if (/^vip[\s-]?\d+$/i.test(s)) return 'VIP-' + s.replace(/[^0-9]/g,'');
  // IGD P1 / IGD P3.2
  if (/^igd[\s-]?p[\d.]+$/i.test(s)) return 'IGD-' + s.replace(/^igd[\s-]?/i,'').toUpperCase();

  return s.toUpperCase();
}

/**
 * Extract room + bed from a string like "Kemuning 3D", "ICU 4", "Dahlia B2"
 * Returns { roomId, bedId } or null
 */
function extractRoomBed(segment) {
  if (!segment) return null;
  const s = segment.trim();
  const aliases = buildRoomAliases();

  // Coba: room prefix yang dikenal + bed
  const roomKeys = Object.keys(aliases).sort((a, b) => b.length - a.length);
  for (const key of roomKeys) {
    if (s.toLowerCase().startsWith(key)) {
      const roomId  = aliases[key];
      const bedPart = s.slice(key.length).trim();
      if (bedPart) return { roomId, bedId: normalizeBedId(bedPart) };
    }
  }

  // Special cases dengan regex
  // ICU N / ICU-N / ICU NN (1-2 digit)
  if (/^icu[\s-]?\d+/i.test(s)) {
    const n = s.replace(/[^0-9]/g,'');
    return { roomId: 'icu', bedId: 'ICU-' + n };
  }
  // ICU ISO N
  if (/^icu[\s-]?iso[\s-]?\d+/i.test(s)) {
    const n = s.replace(/[^0-9]/g,'');
    return { roomId: 'icu', bedId: 'ICU-ISO-' + n };
  }
  // HCU-ICU N
  if (/^hcu[\s-]icu[\s-]?\d+/i.test(s)) {
    const n = s.replace(/[^0-9]/g,'');
    return { roomId: 'hcu', bedId: 'HCU-ICU-' + n };
  }
  // RICU N / HCU-RICU N
  if (/^(hcu[\s-])?ricu[\s-]?\d+/i.test(s)) {
    const n = s.replace(/[^0-9]/g,'');
    return { roomId: 'hcu', bedId: 'RICU-' + n };
  }
  // VK N / VK-N
  if (/^vk[\s-]?\d+/i.test(s)) {
    const n = s.replace(/[^0-9]/g,'');
    return { roomId: 'matahari', bedId: 'VK-' + n };
  }
  // IGD P1 / IGD P3.2
  if (/^igd[\s-]?p[\d.]+/i.test(s)) {
    const bed = s.replace(/^igd[\s-]?/i,'').toUpperCase();
    return { roomId: 'igd', bedId: 'IGD-' + bed };
  }
  // IW IGD
  if (/^iw[\s-]?igd$/i.test(s)) {
    return { roomId: 'icu', bedId: 'IW-IGD' };
  }

  return null;
}

// ── PARSE DATE ────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  // DD/MM/YYYY or DD/MM
  const m = str.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (!m) return null;
  const year = m[3] || new Date().getFullYear();
  const month = m[2].padStart(2,'0');
  const day   = m[1].padStart(2,'0');
  return `${year}-${month}-${day}`;
}

// ── DETECT STATUS FROM VITALS (for Groq-like rules) ───────────────
function detectStatusFromVitals(vital) {
  if (!vital) return 'stabil';
  const { spo2, hr, rr } = vital;
  if ((spo2 && spo2 < 90) || (hr && hr > 150) || (rr && rr > 35)) return 'kritis';
  if ((spo2 && spo2 < 95) || (hr && hr > 100) || (rr && rr > 25)) return 'perhatian';
  return 'stabil';
}

// ── SLASH PARSER ──────────────────────────────────────────────────
/**
 * Parse slash-separated patient string
 * Format: Nama / Usia th / Ruangan Bed / Dx1, Dx2 / dr. X, Sp.Y (DPJP SP) / MRS DD/MM / KONSUL SP TGL / PINDAHAN A-B / STATUS
 */
function parseSlash(text) {
  if (!text || !text.trim()) return null;

  const segments = text.split('/').map(s => s.trim());
  let obj = {
    id: genId(),
    nama: '', usia: null, jk: null, noRM: null, tglMRS: null,
    status: 'stabil',
    dpjp: { nama: '', spesialis: '' },
    timDokter: [],
    diagnosisUtama: '', diagnosisSekunder: [],
    konsul: [], pindahan: [], vital: {}, lab: {}, terapi: [], cppt: '',
    createdAt: nowISO(), updatedAt: nowISO(),
  };

  let roomBedSet = false;
  let dxSet = false;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;

    // ── Nama (first segment) ──
    if (i === 0) {
      obj.nama = seg;
      if (/ny\.|ibu|perempuan/i.test(seg)) obj.jk = 'P';
      else if (/tn\.|bapak|laki/i.test(seg)) obj.jk = 'L';
      continue;
    }

    // ── Usia ──
    if (/^\d+\s*(th|thn|tahun)/i.test(seg)) {
      obj.usia = parseInt(seg);
      continue;
    }

    // ── KRS / Status ──
    if (/^(krs|meninggal|lepas rawat|rencana rujuk)$/i.test(seg)) {
      const stMap = { 'krs':'krs', 'meninggal':'meninggal', 'lepas rawat':'lepas_rawat', 'rencana rujuk':'rencana_rujuk' };
      obj.status = stMap[seg.toLowerCase()] || 'krs';
      continue;
    }

    // ── KONSUL ──
    if (/^konsul\s+\w+/i.test(seg)) {
      const parts = seg.replace(/konsul\s+/i,'').trim().split(/\s+/);
      const sp = parts[0];
      const tgl = parts.slice(1).join(' ');
      obj.konsul.push({ spesialis: sp.toUpperCase(), tanggal: tgl });
      continue;
    }

    // ── PINDAHAN ──
    if (/^pindahan/i.test(seg)) {
      const body = seg.replace(/^pindahan\s*/i,'').trim();
      const tglM = body.match(/(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
      const tgl = tglM ? tglM[1] : '';
      const trail = body.replace(tglM?tglM[0]:'','').trim();
      const dashIdx = trail.search(/[-→]/);
      if (dashIdx > 0) {
        obj.pindahan.push({ dari: trail.slice(0, dashIdx).trim(), ke: trail.slice(dashIdx+1).trim(), tanggal: tgl });
      } else {
        obj.pindahan.push({ dari: '', ke: trail, tanggal: tgl });
      }
      continue;
    }

    // ── MRS / OB ──
    if (/^(mrs|ob)\s*\d/i.test(seg)) {
      const m = seg.match(/(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
      if (m) obj.tglMRS = parseDate(m[1]);
      continue;
    }

    // ── Doctor (contains "dr.") ──
    if (/dr\./i.test(seg)) {
      parseDoctors(seg, obj);
      continue;
    }

    // ── Room + Bed (if not set yet and segment doesn't look like dx) ──
    if (!roomBedSet && !dxSet) {
      const rb = extractRoomBed(seg);
      if (rb) {
        obj._roomId = rb.roomId;
        obj._bedId = rb.bedId;
        roomBedSet = true;
        continue;
      }
    }

    // ── Diagnosis ──
    if (!dxSet && !roomBedSet) {
      // skip — might be room
    }
    if (!dxSet) {
      const dxParts = seg.split(',').map(d => d.trim()).filter(Boolean);
      if (dxParts.length) {
        obj.diagnosisUtama = dxParts[0];
        obj.diagnosisSekunder = dxParts.slice(1);
        dxSet = true;
        continue;
      }
    }
  }

  // Tandai apakah tglMRS di-set eksplisit atau tidak
  if (!obj.tglMRS) {
    obj.tglMRS      = getTodayStr();
    obj._mrsAutoSet = true;
  } else {
    obj._mrsAutoSet = false;
  }

  return obj;
}

function parseDoctors(text, obj) {
  // Find (DPJP XX) tag
  const dpjpMatch = text.match(/\(DPJP\s*([A-Z\/\s]+)\)/i);
  const dpjpSpec = dpjpMatch ? dpjpMatch[1].trim() : '';

  // Split by "dr." tokens
  const drParts = text.split(/(?=dr\.)/i).map(s => s.trim()).filter(s => /dr\./i.test(s));

  for (const part of drParts) {
    const isDPJP = dpjpMatch && text.indexOf(part) < text.indexOf(dpjpMatch[0]) + dpjpMatch[0].length && text.indexOf(part) >= text.indexOf(dpjpMatch[0]) - part.length - 10;
    // Extract sp
    const spMatch = part.match(/Sp\.(\w+)/i);
    const sp = spMatch ? spMatch[1].toUpperCase() : '';
    const nameMatch = part.match(/dr\.\s*([^,:(]+)/i);
    const name = nameMatch ? ('dr. ' + nameMatch[1].trim().replace(/,$/,'')) : part;

    if (dpjpSpec && (part.includes('(DPJP') || drParts.length === 1 || !obj.dpjp.nama)) {
      obj.dpjp = { nama: name + (sp ? ', Sp.'+sp : ''), spesialis: dpjpSpec };
    } else {
      const full = name + (sp ? ', Sp.'+sp : '');
      if (!obj.dpjp.nama && drParts.indexOf(part) === 0) {
        obj.dpjp = { nama: full, spesialis: sp };
      } else {
        // De-duplikasi dengan DPJP
        if (obj.dpjp.nama && normalizeDocName(obj.dpjp.nama) === normalizeDocName(full)) {
           // Skip
        } else {
           obj.timDokter.push({ nama: full, spesialis: sp });
        }
      }
    }
  }
}

// ── BATCH: AUTO-DETECT FORMAT ─────────────────────────────────────
function parseBatch(text) {
  if (!text || !text.trim()) return [];

  // Detect format
  if (/📌\s*\*/.test(text) || /\*[A-Z]+\s*\(\d+\s+PASIEN\)\*/i.test(text)) {
    // Format A or C
    if (/\(DPJP\s+\w+\)/i.test(text) || /MRS\s+\d{2}\/\d{2}/i.test(text)) {
      return parseBatchC(text);
    }
    return parseBatchA(text);
  }
  if (/\*\w[\w\s]+:\s*\d+\s+PASIEN\*/i.test(text)) {
    return parseBatchB(text);
  }
  if (/Kelas\s+\d+/i.test(text) || /VK\s*\(/i.test(text)) {
    return parseBatchD(text);
  }
  // Fallback: try C then B
  return parseBatchC(text).length ? parseBatchC(text) : parseBatchB(text);
}

// ── FORMAT A: KONRU IPD (Emoji-Dokter) ───────────────────────────
function parseBatchA(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const emojiMap = {};
  let currentRoom = null;
  const results = [];

  // Build emoji map from summary headers like "🍎dr. Ferdi: 13 pasien"
  for (const line of lines) {
    const m = line.match(/^([\u{1F300}-\u{1FFFF}]|[\u2600-\u27BF])(dr\.\s*[^:]+):\s*\d+/iu);
    if (m) {
      const emoji = m[1];
      const drName = m[2].trim();
      emojiMap[emoji] = drName;
    }
  }

  for (const line of lines) {
    // Room header: 📌 *KRISAN (7 PASIEN)* ...
    const roomM = line.match(/📌\s*\*([A-Z\s]+)\s*\(\d+\s+PASIEN\)\*/i);
    if (roomM) { currentRoom = normalizeRoomId(roomM[1].trim()); continue; }

    // Patient line (starts with emoji)
    const emojiPatM = line.match(/^([\u{1F300}-\u{1FFFF}]|[\u2600-\u27BF])\s*(.+)/iu);
    if (emojiPatM && currentRoom) {
      const emoji = emojiPatM[1];
      const body = emojiPatM[2];
      const p = parseBatchPatientLine(body, currentRoom, emojiMap[emoji] || '');
      if (p) results.push(p);
    }
  }
  return results;
}

// ── FORMAT B: SIMPLE NUMBERED ─────────────────────────────────────
function parseBatchB(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentRoom = null;
  const results = [];

  for (const line of lines) {
    // Header: *KRISAN: 2 PASIEN* or *DAHLIA : 3 PASIEN*
    const roomM = line.match(/\*([A-Z\s]+)\s*:\s*\d+\s+PASIEN\*/i);
    if (roomM) { currentRoom = normalizeRoomId(roomM[1].trim()); continue; }

    // Patient line: 1. Tn./Ny. ...
    const patM = line.match(/^\d+\.\s*(.+)/);
    if (patM && currentRoom) {
      const body = patM[1].replace(/🔥/g, '').trim();
      const isKritis = /🔥/.test(patM[0]);
      const p = parseBatchPatientLine(body, currentRoom, '');
      if (p) {
        if (isKritis) p.status = 'kritis';
        results.push(p);
      }
    }
  }
  return results;
}

// ── FORMAT C: STASE PARU ─────────────────────────────────────────
function parseBatchC(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentRoom = null;
  let defaultStatus = 'stabil';
  const results = [];

  for (const line of lines) {
    // Status section headers
    if (/\*PASIEN KRS/i.test(line)) { defaultStatus = 'krs'; continue; }
    if (/\*MENINGGAL/i.test(line)) { defaultStatus = 'meninggal'; continue; }
    if (/\*LEPAS RAWAT/i.test(line)) { defaultStatus = 'lepas_rawat'; continue; }
    if (/\*RENCANA RUJUK/i.test(line)) { defaultStatus = 'rencana_rujuk'; continue; }
    if (/\*PINDAH RUANGAN/i.test(line)) { defaultStatus = 'stabil'; continue; }
    if (/\*OB\s+(IGD|KONSULAN)/i.test(line)) { defaultStatus = 'stabil'; continue; }

    // Room header: *KEMUNING (7 pasien)*
    const roomM = line.match(/\*([A-Z\s]+)\s*\(\d+\s+pasien\)\*/i);
    if (roomM) {
      currentRoom = normalizeRoomId(roomM[1].trim());
      defaultStatus = 'stabil'; // reset per section
      continue;
    }

    // Patient line
    const patM = line.match(/^\d+\.\s*(.+)/);
    if (patM && currentRoom) {
      const p = parseBatchPatientLineC(patM[1].trim(), currentRoom);
      if (p) {
        if (p.status === 'stabil') p.status = defaultStatus;
        results.push(p);
      }
    }
  }
  return results;
}

// ── FORMAT D: OBGYN KELAS-BASED ───────────────────────────────────
function parseBatchD(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentRoom = null;
  const results = [];

  for (const line of lines) {
    // Room: *Matahari (9 pasien)*
    const roomM = line.match(/\*([A-Za-z\s]+)\s*\(\d+\s+pasien\)\*/i);
    if (roomM) { currentRoom = normalizeRoomId(roomM[1].trim()); continue; }

    // Sub-header (Kelas 1, VK, IGD) — just skip
    if (/^(Kelas|VK|IGD)/i.test(line) && !line.match(/^\d+\./)) continue;

    // Patient
    const patM = line.match(/^\d+\.\s*(.+)/);
    if (patM && currentRoom) {
      // Strip emoji at start
      const body = patM[1].replace(/^[\u{1F300}-\u{1FFFF}\u2600-\u27BF\s]+/iu, '').trim();
      const p = parseBatchPatientLine(body, currentRoom, '');
      if (p) results.push(p);
    }
  }
  return results;
}

// ── PATIENT LINE PARSER ───────────────────────────────────────────
function parseBatchPatientLine(line, roomId, drFromEmoji) {
  // Split by /
  const parts = line.split('/').map(s => s.trim());
  if (parts.length < 2) return null;

  const p = {
    id: genId(),
    nama: '', usia: null, jk: null, noRM: null, tglMRS: null,
    status: 'stabil',
    dpjp: { nama: '', spesialis: '' }, timDokter: [],
    diagnosisUtama: '', diagnosisSekunder: [],
    konsul: [], pindahan: [], vital: {}, lab: {}, terapi: [], cppt: '',
    _roomId: roomId, _bedId: '',
    createdAt: nowISO(), updatedAt: nowISO(),
  };

  // Index heuristic: nama / usia? / bed / dx / dr.
  let idx = 0;
  // Nama
  p.nama = parts[idx++] || '';
  if (/ny\.|ibu/i.test(p.nama)) p.jk = 'P';
  else if (/tn\.|bapak/i.test(p.nama)) p.jk = 'L';

  for (; idx < parts.length; idx++) {
    const seg = parts[idx];
    // Usia
    if (/^\d+\s*(th|thn|tahun)/i.test(seg)) {
      p.usia = parseInt(seg);
      continue;
    }
    // Doctor
    if (/dr\./i.test(seg)) {
      parseDoctors(seg, p);
      continue;
    }
    // OB/MRS date
    if (/\(OB\s*\d/i.test(seg) || /^mrs\s*\d/i.test(seg)) {
      const m = seg.match(/(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
      if (m) p.tglMRS = parseDate(m[1]);
      continue;
    }
    // PINDAHAN
    if (/pindahan/i.test(seg)) {
      const body = seg.replace(/pindahan\s*/i,'').trim();
      p.pindahan.push({ dari:'', ke: body, tanggal:'' });
      continue;
    }
    // KRS/Status keyword
    if (/^(krs|meninggal|lepas rawat)$/i.test(seg)) {
      p.status = seg.toLowerCase().replace(' ','_');
      continue;
    }
    // Room+Bed
    const rb = extractRoomBed(seg);
    if (rb) {
      p._roomId = rb.roomId || roomId;
      p._bedId = rb.bedId;
      continue;
    }
    // Bed only: pola spesifik, jangan tangkap singkatan diagnosis (TB, DM, AKI, HF, dll)
    // Bed ID valid: diawali angka (3D, 2A, 1B) ATAU prefix khusus (ICU-1, HCU-3, RICU-2, VIP-1, dll)
    if (!p._bedId) {
      const su = seg.toUpperCase().trim();
      const isBedCode =
        /^\d[A-Z]$/.test(su) ||                          // "3D", "2A"
        /^\d{1,2}$/.test(su) ||                          // "3", "12" (bed angka saja)
        /^(ICU|HCU|RICU|VK|ISO|RK|IW[-\s]?IGD|IWIGD|TULIP|VINOLIA|VIP)[-\s]?\d*$/i.test(su); // prefix khusus
      if (isBedCode && su.length <= 10) {
        p._bedId = normalizeBedId(seg);
        continue;
      }
    }
    // Diagnosis (fallback)
    if (!p.diagnosisUtama) {
      const dx = seg.split(',').map(d => d.trim()).filter(Boolean);
      p.diagnosisUtama = dx[0] || '';
      p.diagnosisSekunder = dx.slice(1);
    }
  }

  // Assign doctor from emoji map
  if (drFromEmoji && !p.dpjp.nama) {
    p.dpjp = { nama: drFromEmoji, spesialis: '' };
  }

  // Flag _mrsAutoSet
  if (!p.tglMRS) {
    p.tglMRS      = getTodayStr();
    p._mrsAutoSet = true;
  } else {
    p._mrsAutoSet = false;
  }

  return p;
}

function parseBatchPatientLineC(line, roomId) {
  // Format C: "1. Tn. Basyar/41 th/Kemuning 3H/TB Paru/dr. Deden, Sp.P (DPJP PARU) MRS 10/03/2026 KONSUL PARU 09/03"
  // Already stripped the "1." prefix
  const p = parseBatchPatientLine(line, roomId, '');
  if (!p) return null;

  // Extra: parse inline MRS, KONSUL, PINDAHAN not caught by /
  const joined = line;
  const mrsM = joined.match(/MRS\s+(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i);
  if (mrsM && !p.tglMRS) p.tglMRS = parseDate(mrsM[1]);

  const konsulRe = /KONSUL\s+(\w+)\s+(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/gi;
  let km;
  while ((km = konsulRe.exec(joined)) !== null) {
    p.konsul.push({ spesialis: km[1].toUpperCase(), tanggal: km[2] });
  }

  const dpjpM = joined.match(/\(DPJP\s+(\w+)\)/i);
  if (dpjpM && p.dpjp.spesialis === '') {
    p.dpjp.spesialis = dpjpM[1].toUpperCase();
  }

  return p;
}
