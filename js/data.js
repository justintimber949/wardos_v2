/**
 * WardOS v2 — Data Layer
 * localStorage key: wardos_v1
 */

const STORAGE_KEY = 'wardos_v1';

// ── DEFAULT ROOM CONFIG ──────────────────────────────────────────
const DEFAULT_ROOMS = [
  {
    id: 'amarilis', name: 'Amarilis', color: '#f59e0b', icon: '🌼',
    kamar: [
      { id:'k1', name:'Kamar 1', beds:[{id:'1A',name:'1A'},{id:'1B',name:'1B'},{id:'1C',name:'1C'},{id:'1D',name:'1D'}] },
      { id:'k2', name:'Kamar 2', beds:[{id:'2A',name:'2A'},{id:'2B',name:'2B'},{id:'2C',name:'2C'},{id:'2D',name:'2D'}] },
      { id:'k3', name:'Kamar 3', beds:[{id:'3A',name:'3A'},{id:'3B',name:'3B'},{id:'3C',name:'3C'},{id:'3D',name:'3D'}] },
      { id:'k4', name:'Kamar 4', beds:[{id:'4A',name:'4A'},{id:'4B',name:'4B'},{id:'4C',name:'4C'},{id:'4D',name:'4D'}] },
    ]
  },
  {
    id: 'edelweis-a', name: 'Edelweis A', color: '#3b82f6', icon: '❄️',
    kamar: [
      { id:'k1', name:'Kamar 1', beds:[{id:'1A',name:'1A'},{id:'1B',name:'1B'},{id:'1C',name:'1C'},{id:'1D',name:'1D'}] },
      { id:'k2', name:'Kamar 2', beds:[{id:'2A',name:'2A'},{id:'2B',name:'2B'},{id:'2C',name:'2C'},{id:'2D',name:'2D'}] },
      { id:'k3', name:'Kamar 3', beds:[{id:'3A',name:'3A'},{id:'3B',name:'3B'},{id:'3C',name:'3C'},{id:'3D',name:'3D'}] },
    ]
  },
  {
    id: 'edelweis-b', name: 'Edelweis B', color: '#60a5fa', icon: '❄️',
    kamar: [
      { id:'k1', name:'Bed RK', beds:[{id:'RK-C',name:'RK C'},{id:'RK-D',name:'RK D'}] },
      { id:'k2', name:'Bed ISO', beds:[{id:'ISO-B',name:'ISO B'}] },
      { id:'k3', name:'Kamar 2', beds:[{id:'2A',name:'2A'},{id:'2B',name:'2B'},{id:'2D',name:'2D'}] },
      { id:'k4', name:'Kamar 3', beds:[{id:'3A',name:'3A'},{id:'3C',name:'3C'},{id:'3F',name:'3F'}] },
    ]
  },
  {
    id: 'vip', name: 'VIP / Tulip / Vinolia', color: '#f97316', icon: '⭐',
    kamar: [
      { id:'k1', name:'VIP', beds:[{id:'VIP-1',name:'VIP 1'},{id:'VIP-2',name:'VIP 2'}] },
      { id:'k2', name:'Tulip', beds:[{id:'Tulip-1',name:'Tulip 1'},{id:'Tulip-2',name:'Tulip 2'},{id:'Tulip-3',name:'Tulip 3'}] },
      { id:'k3', name:'Vinolia', beds:[{id:'Vinolia-1',name:'Vinolia 1'},{id:'Vinolia-2',name:'Vinolia 2'},{id:'Vinolia-3',name:'Vinolia 3'}] },
    ]
  },
  {
    id: 'cvcu', name: 'CVCU', color: '#ef4444', icon: '❤️',
    kamar: [
      { id:'k1', name:'CVCU', beds:[
        {id:'A1',name:'A1'},{id:'A2',name:'A2'},{id:'B1',name:'B1'},
        {id:'B3',name:'B3'},{id:'B4',name:'B4'},{id:'C3',name:'C3'}
      ]}
    ]
  },
  {
    id: 'hcu', name: 'HCU', color: '#ec4899', icon: '🩺',
    kamar: [
      { id:'k1', name:'HCU', beds:[
        {id:'HCU-1',name:'HCU 1'},{id:'HCU-2',name:'HCU 2'},{id:'HCU-3',name:'HCU 3'},
        {id:'HCU-4',name:'HCU 4'},{id:'HCU-5',name:'HCU 5'},{id:'HCU-6',name:'HCU 6'},
        {id:'HCU-7',name:'HCU 7'},{id:'HCU-8',name:'HCU 8'},
      ]},
      { id:'k2', name:'RICU', beds:[{id:'RICU-1',name:'RICU 1'},{id:'RICU-2',name:'RICU 2'}] },
    ]
  },
  {
    id: 'icu', name: 'ICU', color: '#dc2626', icon: '🚨',
    kamar: [
      { id:'k1', name:'ICU', beds:[
        {id:'ICU-1',name:'ICU 1'},{id:'ICU-2',name:'ICU 2'},{id:'ICU-3',name:'ICU 3'},
        {id:'ICU-4',name:'ICU 4'},{id:'ICU-5',name:'ICU 5'},{id:'ICU-6',name:'ICU 6'},
        {id:'ICU-7',name:'ICU 7'},
      ]},
      { id:'k2', name:'ISO', beds:[{id:'ISO-1',name:'ISO 1'},{id:'ISO-2',name:'ISO 2'}] },
      { id:'k3', name:'IW IGD', beds:[{id:'IW-IGD',name:'IW IGD'}] },
    ]
  },
  {
    id: 'krisan', name: 'Krisan', color: '#10b981', icon: '🌿',
    kamar: [
      { id:'k1', name:'Kamar 1', beds:[{id:'1A',name:'1A'},{id:'1B',name:'1B'},{id:'1C',name:'1C'},{id:'1D',name:'1D'}] },
      { id:'k2', name:'Kamar 2', beds:[{id:'2A',name:'2A'},{id:'2B',name:'2B'},{id:'2C',name:'2C'},{id:'2D',name:'2D'}] },
      { id:'k3', name:'Kamar 3', beds:[{id:'3A',name:'3A'},{id:'3B',name:'3B'},{id:'3C',name:'3C'},{id:'3D',name:'3D'}] },
      { id:'k4', name:'Kamar 4', beds:[{id:'4A',name:'4A'},{id:'4B',name:'4B'},{id:'4C',name:'4C'},{id:'4D',name:'4D'}] },
    ]
  },
  {
    id: 'kemuning', name: 'Kemuning', color: '#06b6d4', icon: '💙',
    kamar: [
      { id:'k1', name:'Kamar 1', beds:[{id:'1A',name:'1A'},{id:'1B',name:'1B'},{id:'1C',name:'1C'},{id:'1D',name:'1D'}] },
      { id:'k2', name:'Kamar 2', beds:[{id:'2A',name:'2A'},{id:'2B',name:'2B'},{id:'2C',name:'2C'},{id:'2D',name:'2D'}] },
      { id:'k3', name:'Kamar 3', beds:[{id:'3A',name:'3A'},{id:'3B',name:'3B'},{id:'3C',name:'3C'},{id:'3D',name:'3D'},{id:'3E',name:'3E'},{id:'3F',name:'3F'},{id:'3G',name:'3G'},{id:'3H',name:'3H'}] },
    ]
  },
  {
    id: 'dahlia', name: 'Dahlia', color: '#a855f7', icon: '🌺',
    kamar: [
      { id:'k1', name:'Kamar 1', beds:[{id:'1A',name:'1A'},{id:'1B',name:'1B'},{id:'1C',name:'1C'},{id:'1D',name:'1D'}] },
      { id:'k2', name:'Kamar 2', beds:[{id:'2A',name:'2A'},{id:'2B',name:'2B'},{id:'2C',name:'2C'},{id:'2D',name:'2D'}] },
      { id:'k3', name:'Kamar 3', beds:[{id:'3A',name:'3A'},{id:'3B',name:'3B'},{id:'3C',name:'3C'},{id:'3D',name:'3D'}] },
    ]
  },
];

// ── STATE ───────────────────────────────────────────────────────
let _data = null;

function getDefaultData() {
  return {
    hospitalName: 'RSUD Karsa Husada Batu',
    koasName: '',
    groqApiKey: '',
    groqModel: 'llama-3.1-8b-instant',
    rooms: JSON.parse(JSON.stringify(DEFAULT_ROOMS)),
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _data = JSON.parse(raw);
      // Ensure rooms exist (migration safety)
      if (!_data.rooms || !_data.rooms.length) {
        _data.rooms = JSON.parse(JSON.stringify(DEFAULT_ROOMS));
      }
    } else {
      _data = getDefaultData();
    }
  } catch(e) {
    console.error('WardOS: loadData error', e);
    _data = getDefaultData();
  }
  return _data;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
  } catch(e) {
    console.error('WardOS: saveData error', e);
  }
}

function getData() {
  if (!_data) loadData();
  return _data;
}

// ── ROOM / BED HELPERS ───────────────────────────────────────────
function getRoom(roomId) {
  return getData().rooms.find(r => r.id === roomId) || null;
}

function findBed(roomId, bedId) {
  const room = getRoom(roomId);
  if (!room) return null;
  for (const kamar of room.kamar) {
    const bed = kamar.beds.find(b => b.id === bedId);
    if (bed) return { room, kamar, bed };
  }
  return null;
}

function getPatient(roomId, bedId) {
  const found = findBed(roomId, bedId);
  return found ? (found.bed.patient || null) : null;
}

function setPatient(roomId, bedId, patientObj) {
  const found = findBed(roomId, bedId);
  if (!found) return false;
  found.bed.patient = patientObj;
  saveData();
  return true;
}

function clearBed(roomId, bedId) {
  const found = findBed(roomId, bedId);
  if (!found) return false;
  found.bed.patient = null;
  saveData();
  return true;
}

// ── PATIENT QUERIES ──────────────────────────────────────────────
/**
 * Returns flat list: [{patient, roomId, roomName, bedId, bedName, kamarName}]
 */
function getAllPatients() {
  const result = [];
  for (const room of getData().rooms) {
    for (const kamar of room.kamar) {
      for (const bed of kamar.beds) {
        if (bed.patient) {
          result.push({
            patient: bed.patient,
            roomId: room.id,
            roomName: room.name,
            roomColor: room.color,
            roomIcon: room.icon,
            bedId: bed.id,
            bedName: bed.name,
            kamarName: kamar.name,
          });
        }
      }
    }
  }
  return result;
}

function getPatientsByRoom(roomId) {
  return getAllPatients().filter(p => p.roomId === roomId);
}

function getEmptyBeds(roomId) {
  const room = getRoom(roomId);
  if (!room) return [];
  const result = [];
  for (const kamar of room.kamar) {
    for (const bed of kamar.beds) {
      if (!bed.patient) result.push({ kamarName: kamar.name, kamarId: kamar.id, bed });
    }
  }
  return result;
}

// ── STATS ────────────────────────────────────────────────────────
function getSummaryStats() {
  const all = getAllPatients();
  const today = getTodayStr();
  let aktif = 0, kritis = 0, krsToday = 0, masukToday = 0;
  const kritisRooms = {};

  for (const { patient, roomName } of all) {
    const st = patient.status;
    if (['stabil','perhatian','kritis','rencana_rujuk'].includes(st)) aktif++;
    if (st === 'kritis') {
      kritis++;
      kritisRooms[roomName] = (kritisRooms[roomName] || 0) + 1;
    }
    // KRS Hari Ini: utamakan tglKRS, fallback ke updatedAt (data lama tanpa tglKRS)
    if (['krs','lepas_rawat'].includes(st)) {
      const tglRef = patient.tglKRS || patient.updatedAt;
      if (tglRef && isTodayLocal(tglRef)) krsToday++;
    }
    // Masuk Hari Ini: hanya saat user tidak mengisi MRS (auto-set hari ini)
    if (patient._mrsAutoSet && patient.tglMRS === today) masukToday++;
  }

  const kritisBreakdown = Object.entries(kritisRooms).map(([r,n]) => `${r} ${n}`).join(' · ');
  return { aktif, kritis, krsToday, masukToday, kritisBreakdown };
}

function getRoomStats(roomId) {
  const room = getRoom(roomId);
  if (!room) return { total: 0, terisi: 0, kritis: 0 };
  let total = 0, terisi = 0, kritis = 0;
  for (const kamar of room.kamar) {
    for (const bed of kamar.beds) {
      total++;
      if (bed.patient) {
        terisi++;
        if (bed.patient.status === 'kritis') kritis++;
      }
    }
  }
  return { total, terisi, kritis };
}

// ── DATE HELPERS ─────────────────────────────────────────────────
function getTodayStr() {
  // Gunakan local time (bukan UTC) agar tidak salah di timezone Indonesia (UTC+7)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}

function isTodayLocal(isoStr) {
  if (!isoStr) return false;
  const d = new Date(isoStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

function genId() {
  return Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}

function nowISO() {
  return new Date().toISOString();
}

// ── EXPORT / IMPORT ──────────────────────────────────────────────
function exportJSON() {
  const d = getData();
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wardos_backup_${getTodayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.rooms) throw new Error('Invalid format');
    // Merge: keep settings, replace rooms
    _data = {
      hospitalName: parsed.hospitalName || _data.hospitalName,
      koasName: parsed.koasName || _data.koasName,
      groqApiKey: parsed.groqApiKey || _data.groqApiKey,
      groqModel: parsed.groqModel || _data.groqModel,
      rooms: parsed.rooms,
    };
    saveData();
    return true;
  } catch(e) {
    console.error('WardOS: importJSON error', e);
    return false;
  }
}

// ── SETTINGS HELPERS ─────────────────────────────────────────────
function getSetting(key) {
  return getData()[key] || '';
}

function setSetting(key, value) {
  getData()[key] = value;
  saveData();
}

// ── MOVE BED ─────────────────────────────────────────────────────
function moveBed(fromRoomId, fromBedId, toRoomId, toBedId) {
  const fromFound = findBed(fromRoomId, fromBedId);
  const toFound   = findBed(toRoomId, toBedId);
  if (!fromFound?.bed?.patient) return false;
  const patient = fromFound.bed.patient;
  // Record trail
  if (!patient.pindahan) patient.pindahan = [];
  patient.pindahan.push({ dari: `${fromRoomId}/${fromBedId}`, ke: `${toRoomId}/${toBedId}`, tanggal: getTodayStr() });
  // Update lokasi internal agar tidak stale saat edit selanjutnya
  patient._roomId   = toRoomId;
  patient._bedId    = toBedId;
  patient.updatedAt = nowISO();
  // Mutasi langsung ke memory, satu kali saveData di akhir
  fromFound.bed.patient = null;
  if (toFound) toFound.bed.patient = patient;
  saveData();
  return !!toFound;
}
// ── FOTO LAB ─────────────────────────────────────────────────────
/**
 * Struktur foto: { id, nama, tanggal, dataUrl, size }
 * Disimpan di bed.patient.fotoLab[] — bagian dari data pasien biasa.
 */

function getFotoLab(roomId, bedId) {
  const p = getPatient(roomId, bedId);
  return p ? (p.fotoLab || []) : [];
}

function addFotoLab(roomId, bedId, fotoObj) {
  const p = getPatient(roomId, bedId);
  if (!p) return false;
  if (!p.fotoLab) p.fotoLab = [];
  p.fotoLab.push(fotoObj);
  p.updatedAt = nowISO();
  setPatient(roomId, bedId, p);
  return true;
}

function deleteFotoLab(roomId, bedId, fotoId) {
  const p = getPatient(roomId, bedId);
  if (!p || !p.fotoLab) return false;
  p.fotoLab = p.fotoLab.filter(f => f.id !== fotoId);
  p.updatedAt = nowISO();
  setPatient(roomId, bedId, p);
  return true;
}

/**
 * Estimasi total ukuran foto semua pasien (untuk info storage)
 * Returns ukuran dalam KB
 */
function getTotalFotoSize() {
  let total = 0;
  for (const { patient } of getAllPatients()) {
    for (const f of (patient.fotoLab || [])) {
      total += f.size || 0;
    }
  }
  return Math.round(total / 1024);
}
function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase();
  n = n.replace(/^(tn|ny|nn|an|by|sdr|sdri)\.?\s+/g, '');
  n = n.replace(/[^a-z0-9]/g, '');
  return n;
}

function normalizeDocName(name) {
  if (!name) return '';
  let n = name.toLowerCase();
  n = n.replace(/^(dr|dokter)\.?\s+/g, '');
  n = n.replace(/,?\s*sp\.?\s*\w+/g, ''); // hapus spesialis
  n = n.replace(/[^a-z0-9]/g, '');
  return n;
}


