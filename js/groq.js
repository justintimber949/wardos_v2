/**
 * WardOS v2 — Groq AI Integration
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT_SINGLE = `You are a medical data extractor for an Indonesian hospital ward management system (WardOS). Extract patient data from ANY input format and return ONLY valid JSON, no markdown, no explanation.

OUTPUT SCHEMA:
{
  "nama": "string — full name with title (Tn./Ny./An./Sdr.)",
  "usia": number or null,
  "jk": "L" or "P",
  "noRM": "string or null",
  "tglMRS": "DD/MM/YYYY or DD/MM or null — use OB date if no MRS",
  "status": "stabil|perhatian|kritis|krs|meninggal|lepas_rawat|rencana_rujuk",
  "dpjp": {"nama": "string with dr. prefix", "spesialis": "string e.g. PD/PARU/BEDAH/SARAF/JP"},
  "timDokter": [{"nama": "string", "spesialis": "string"}],
  "diagnosisUtama": "string",
  "diagnosisSekunder": ["string"],
  "konsul": [{"spesialis": "string", "tanggal": "string"}],
  "pindahan": [{"dari": "string", "ke": "string", "tanggal": "string or null"}],
  "vital": {"td": "string", "hr": number|null, "rr": number|null, "spo2": number|null, "suhu": number|null, "o2": "RA|NC|RM|NRM|Ventilator|null"},
  "lab": {"hb": "string", "wbc": "string", "gda": "string", "kreatinin": "string", "ureum": "string", "na": "string", "k": "string", "albumin": "string", "extra": []},
  "terapi": ["string"],
  "cppt": "string",
  "_roomId": "string or null — lowercase-dash room id e.g. kemuning/krisan/amarilis/dahlia/edelweis-a/edelweis-b/hcu/icu/cvcu/vip/matahari",
  "_bedId": "string or null — e.g. 3H / ICU-1 / RICU-1 / RK-C / Tulip-2 / VK-3"
}

STATUS RULES:
- "kritis": DOC / syok / sepsis berat / ARF / DOC / kritis / emergency / SpO2<90 / HR>150 / RR>35
- "perhatian": SpO2 90-94 / HR 100-150 / RR 25-35 / perlu perhatian
- "krs": KRS / Keluar / Boleh Pulang
- "meninggal": Meninggal / Almarhum / RIP
- "lepas_rawat": Lepas Rawat / BLPL / Pulang Paksa

DIAGNOSIS RULES:
- First diagnosis mentioned = diagnosisUtama
- Comma-separated rest = diagnosisSekunder array
- "+" separator in post-op context = secondary: "Post SC + IUD H1" → utama="Post SC", sekunder=["IUD H1"]
- ObGyn notation: "G1P0000Ab000 UK 39 minggu dengan KPD" → utama="G1P0000Ab000 UK 39 minggu dengan KPD" (keep intact as one string)
- "dt" = "due to" (karena), bukan pemisah diagnosis
- "dd" = "differential diagnosis" (DD/), bukan pemisah diagnosis  
- "+" in IPD context = additional comorbidity: "COPD AE + Pneumonia + DM" → utama="COPD AE", sekunder=["Pneumonia","DM"]
- "PSI 93" etc after Pneumonia = severity score, keep with diagnosis

DOCTOR RULES:
- Split multiple doctors at "dr." token boundaries
- (DPJP PARU) / (DPJP IPD) / (DPJP NEURO) / (DPJP BEDAH) etc = DPJP marker + spesialis field
- Without DPJP marker: first doctor listed = DPJP
- De-duplicate: if same doctor in DPJP and timDokter, remove from timDokter
- Spesialis abbreviation: Sp.PD→PD, Sp.P→PARU, Sp.JP→JP, Sp.N→NEURO, Sp.B→BEDAH, Sp.OG→OBGYN, Sp.An→ANEST, Sp.U→URO, Sp.OT→ORTHO, Sp.BS→BEDAH SARAF

LOCATION RULES (bed ID normalization):
- "ICU 1" / "ICU-1" → _bedId="ICU-1", _roomId="icu"
- "ICU 12" / "ICU ISO 1" → _bedId="ICU-12" or "ICU-ISO-1"
- "HCU 1" / "HCU-1" / "HCU-ICU 12" → _bedId="HCU-1" or "HCU-ICU-12", _roomId="hcu"
- "RICU 1" / "HCU-RICU 1" → _bedId="RICU-1", _roomId="hcu"  
- "IW IGD" → _bedId="IW-IGD", _roomId="icu"
- "RK C" / "RK-C" → _bedId="RK-C", _roomId="edelweis-b"
- "ISO B" / "ISO-A" → _bedId="ISO-B", _roomId="edelweis-b"
- "VK-3" / "VK 3" → _bedId="VK-3", _roomId="matahari"
- "Tulip 2" / "Tulip-2" → _bedId="Tulip-2", _roomId="vip"
- "Vinolia 4" → _bedId="Vinolia-4", _roomId="vip"
- "VIP-1" → _bedId="VIP-1", _roomId="vip"
- "IGD P1" / "IGD P3.2" → _bedId="IGD-P1", _roomId="igd"
- "3H" in Kemuning context → _bedId="3H", _roomId="kemuning"

PINDAHAN RULES:
- "PINDAHAN HCU" = moved FROM HCU (dari="HCU", ke=current room)
- "PINDAHAN HCU - ICU 15" = trail: HCU then ICU-15
- Multiple PINDAHAN = multiple entries in array
- "PINDAHAN Krisan 3B (06/03/2026) PINDAHAN HCU 10/03/2026" = two entries with dates

GENDER: Tn./Bapak/Sdr./An.(male name) = L | Ny./Ibu/An.(female name)/Sdr.i = P

Return ONLY JSON, no backticks, no explanation.`;

const SYSTEM_PROMPT_BATCH = `You are a medical data extractor for an Indonesian hospital ward system (WardOS). Extract ALL patients from the report and return ONLY a valid JSON array. No markdown, no explanation.

EACH PATIENT SCHEMA:
{"nama":"string","usia":number|null,"jk":"L"|"P","tglMRS":"DD/MM/YYYY or null","status":"stabil|perhatian|kritis|krs|meninggal|lepas_rawat|rencana_rujuk","dpjp":{"nama":"string","spesialis":"string"},"timDokter":[{"nama":"string","spesialis":"string"}],"diagnosisUtama":"string","diagnosisSekunder":["string"],"konsul":[{"spesialis":"string","tanggal":"string"}],"pindahan":[{"dari":"string","ke":"string","tanggal":"string|null"}],"_roomId":"string|null","_bedId":"string|null"}

====== FORMAT RECOGNITION ======

FORMAT 1 — KONRU IPD (emoji-doctor mapping):
Header line: "🍎dr. Ferdi: 3 pasien" → maps emoji 🍎 to dr. Ferdi
Room header: "📌 *KRISAN (7 PASIEN)*"
Patient line: "🍋 Ny. Juni/3C/Syok condition dt hipovolemik, UGIB, Anemia gravis, DM/dr. Abdur, Sp.PD (OB 12/02/2026) PINDAHAN HCU"
→ emoji = DPJP from map | slot 1=nama | slot 2=bed | slot 3=diagnosis (comma-sep) | slot 4=doctor+date
→ "(OB 12/02/2026)" or "MRS 12/03/2026" = tglMRS
→ PINDAHAN [location] = pindahan trail

FORMAT 2 — OBGYN (emoji color + kelas-based):
Color emoji BEFORE name = doctor identifier: "🔵Ny. Ufriza" → doctor is 🔵 mapped doctor
Doctor map header: "🔵 Pasien dr. Benny, Sp.OG (K): 2 pasien"
Patient line: "1. 🔵Ny. Ufriza/17th/VK-3/G1P0000Ab000 UK 39 minggu dengan KPD/dr. Benny, Sp.OG (K)"
ObGyn diagnosis rules:
- "G1P0000Ab000 UK 39 minggu dengan KPD" → diagnosisUtama = ENTIRE string (obstetric notation, never split)
- "P2002Ab000 Post SC + IUD H1" → diagnosisUtama="P2002Ab000 Post SC", diagnosisSekunder=["IUD H1"]
- "P1001Ab100 Post SC + IUD H2" → utama="P1001Ab100 Post SC", sekunder=["IUD H2"]
- "G3P2002Ab000 UK 10-12 minggu dengan Abortus Inkomplit" → utama=entire string
- "P2012Ab000 Post SC + MOW H2" → utama="P2012Ab000 Post SC", sekunder=["MOW H2"]
Section sub-headers "Kelas 1", "Kelas 2", "VK", "IGD" = groupings only, not status

FORMAT 3 — STASE PARU/IPD (color emoji doctor + numbered + status sections):
Doctor map: "🟢dr. Deden: 1 pasien" / "🔵dr. Andy: 0 pasien" / "🟡dr. Mulyati: 0 pasien"
COLOR EMOJI BEFORE patient name = which doctor:
  "🟢dr. Deden" then patients → those patients belong to dr. Deden
  "🔵dr. Andy" then patients → those patients belong to dr. Andy
  "🟡dr. Mulyati" then patients → those patients belong to dr. Mulyati

STATUS SECTIONS — section header overrides status:
- "*PASIEN KRS (N pasien)*" or "*KRS (N)*" → all patients below = status "krs"
- "*MENINGGAL (N pasien)*" → all patients below = status "meninggal"
- "*LEPAS RAWAT (N pasien)*" → all patients below = status "lepas_rawat"
- "*RENCANA RUJUK (N pasien)*" → all patients below = status "rencana_rujuk"
- "*PINDAH RUANGAN (N pasien)*" → status "stabil", extract pindahan info
- "*OB IGD*" / "*OB KONSULAN*" / "*KONSULAN RUANGAN*" / active room headers → status "stabil" or inferred

Patient format: "1. Ny. Basyar/41 th/Kemuning 3H/TB Paru on OAT, Efusi Pleura Sinistra, Pneumonia/dr. Deden, Sp.P (DPJP PARU) MRS 10/03/2026 KONSUL PARU 11/03/2026"
→ slot 1=nama | slot 2=usia | slot 3=room+bed | slot 4=diagnosis | slot 5=doctors+date+konsul
→ (DPJP PARU/IPD/NEURO/BEDAH) = DPJP marker

FORMAT 4 — SIMPLE NUMBERED (mixed surgical/medical):
"*DAHLIA : 3 PASIEN*" or "*KEMUNING : 3 PASIEN*"  
"1. Ny. Surati/A6/abd pain dd sistitis pid, susp fistel.../dr. Zain, Sp.PD, dr. Handy, Sp.JP, dr. Fachri, Sp.U"
🔥 emoji at end = status "kritis"

====== UNIVERSAL RULES ======

DIAGNOSIS PARSING:
- First item in comma list = diagnosisUtama
- Rest = diagnosisSekunder array
- "+" in post-op context = secondary separator: "Post SC + IUD" → utama="Post SC", sekunder=["IUD"]
- "+" in IPD comorbidity = secondary: "COPD AE + Pneumonia + DM" → utama="COPD AE", sekunder=["Pneumonia","DM"]
- "dt" = "due to" — NOT a separator, keep as part of diagnosis string
- "dd" = differential diagnosis — NOT a separator, keep as part of diagnosis string  
- ObGyn G/P/Ab notation (e.g. "G1P0000Ab000", "P2002Ab000") — ALWAYS keep together with what follows until "+"
- Severity scores (PSI 93, Killip III, etc.) = part of diagnosis string, NOT separate
- "on OAT" / "on HD" / "on Chemo" / "on treatment" = part of diagnosis string

DOCTOR PARSING:
- Split at "dr." boundaries: "dr. Ferdi, Sp.PD, dr. Dana, Sp.B" → two doctors
- "(DPJP PARU)" etc. applies to the doctor mentioned BEFORE it
- Without (DPJP) marker: doctor listed after "(OB date)" or first in list = DPJP
- "Sp.OG (K)" = Sp.OG with subspecialty konsultan, keep as "Sp.OG (K)"
- Remove DPJP from timDokter (no duplicates)

BED ID NORMALIZATION:
- "ICU N" → "ICU-N" | "ICU ISO N" → "ICU-ISO-N" | "ICU NN" (2 digit) → "ICU-NN"
- "HCU N" → "HCU-N" | "HCU-ICU N" → "HCU-ICU-N" | "RICU N" → "RICU-N"
- "IW IGD" / "IWIGD" → "IW-IGD" (_roomId="icu")
- "RK C" / "RK D" → "RK-C" / "RK-D" (_roomId="edelweis-b")
- "ISO B" / "ISO-A" → "ISO-B" (_roomId="edelweis-b")
- "VK N" / "VK-N" → "VK-N" (_roomId="matahari")
- "Tulip N" → "Tulip-N" | "Vinolia N" → "Vinolia-N" | "VIP N" → "VIP-N" (_roomId="vip")
- "IGD P1" / "IGD P3.2" → "IGD-P1" (_roomId="igd")
- "NX" where N=digit, X=letter (e.g. "3H","2A","B5","A6") → bedId as-is, roomId from context

PINDAHAN PARSING:
- "PINDAHAN HCU" = {dari:"HCU", ke:"[current room]", tanggal:null}
- "PINDAHAN HCU - ICU 15" = trail entry: {dari:"HCU", ke:"ICU-15", tanggal:null}
- "PINDAHAN Krisan 3B (06/03/2026)" = {dari:"[prev]", ke:"Krisan 3B", tanggal:"06/03/2026"}
- Multiple PINDAHAN = multiple entries
- "PINDAHAN KEMUNING", "PINDAHAN HCU PERPOLIKLINIS" → extract location, ignore "PERPOLIKLINIS"
- "Pindahan EDEL B" → ke:"edelweis-b"

KONSUL PARSING:
- "KONSUL PARU 11/03/2026" → {spesialis:"PARU", tanggal:"11/03/2026"}
- "KONSULAN 10/03/2026" → {spesialis:"", tanggal:"10/03/2026"}
- Multiple KONSUL = multiple entries

STATUS INFERENCE:
- "DOC" / "DOC 325" / "DOC 225" = Decreased/Disorder of Consciousness → status="kritis"
- "Syok condition" / "shock" / "septic condition" / "syok sepsis" → status="kritis"
- "ARF" / "ALO" / "Gagal Napas" / "respiratory failure" → status="kritis"
- "🔥" emoji anywhere in line → status="kritis"
- Otherwise default: "stabil", override by section header

SKIP these lines (not patients):
- Summary lines: "Total pasien: N" / "Pasien dr. X: N pasien" / "🍎dr. Ferdi: 3 pasien"
- Section headers: "*KRISAN (7 PASIEN)*" / "📌 *DAHLIA*" / "===" dividers
- Sub-headers: "Kelas 1 (1 pasien)" / "VK (0 pasien)" / "GEDUNG LAMA" / "GEDUNG BARU"
- Zero-patient rooms: any room listed with "(0 pasien)" or "0 pasien"
- Footer text: salam penutup, nama pelapor, terima kasih

Return ONLY the JSON array. No backticks.`;

const SYSTEM_PROMPT_CPPT = `You are a medical data extractor. Extract vitals, lab values, and CPPT notes from the text. Return ONLY valid JSON:
{"vital":{"td":"string","hr":number|null,"rr":number|null,"spo2":number|null,"suhu":number|null,"o2":"RA|NC|RM|NRM|Ventilator|null"},"lab":{"hb":"string","wbc":"string","gda":"string","kreatinin":"string","ureum":"string","na":"string","k":"string","albumin":"string","extra":[]},"cppt":"string"}
Return ONLY JSON, no markdown.`;

async function groqRequest(systemPrompt, userText, apiKey, model) {
  if (!apiKey) throw new Error('Groq API key belum diatur. Buka Pengaturan untuk menambahkan key.');
  if (!userText || !userText.trim()) throw new Error('Teks input kosong');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content || '';
  // Strip backticks
  content = content.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();
  return content;
}

async function groqParseSingle(text) {
  const d = getData();
  const content = await groqRequest(
    SYSTEM_PROMPT_SINGLE, text,
    d.groqApiKey, d.groqModel
  );
  const obj = JSON.parse(content);
  obj.id        = genId();
  obj.createdAt = nowISO();
  obj.updatedAt = nowISO();
  // Jika AI tidak menemukan tanggal MRS → auto-set ke hari ini, flag mrsAutoSet
  if (!obj.tglMRS) {
    obj.tglMRS    = getTodayStr();
    obj._mrsAutoSet = true;
  } else {
    obj._mrsAutoSet = false;
  }
  if (!obj.vital)    obj.vital    = {};
  if (!obj.lab)      obj.lab      = { extra: [] };
  if (!obj.terapi)   obj.terapi   = [];
  if (!obj.konsul)   obj.konsul   = [];
  if (!obj.pindahan) obj.pindahan = [];
  if (!obj.timDokter) obj.timDokter = [];
  return obj;
}

async function groqParseBatch(text) {
  const d = getData();
  const content = await groqRequest(
    SYSTEM_PROMPT_BATCH, text,
    d.groqApiKey, d.groqModel
  );
  const arr = JSON.parse(content);
  return arr.map(obj => {
    const noMRS = !obj.tglMRS;
    return {
      ...obj,
      id: genId(),
      createdAt:   nowISO(),
      updatedAt:   nowISO(),
      tglMRS:      obj.tglMRS || getTodayStr(),
      _mrsAutoSet: noMRS,
      vital:       obj.vital    || {},
      lab:         obj.lab      || { extra: [] },
      terapi:      obj.terapi   || [],
      konsul:      obj.konsul   || [],
      pindahan:    obj.pindahan || [],
      timDokter:   obj.timDokter || [],
    };
  });
}

async function groqExtractCPPT(text) {
  const d = getData();
  const content = await groqRequest(
    SYSTEM_PROMPT_CPPT, text,
    d.groqApiKey, d.groqModel
  );
  return JSON.parse(content);
}

// ── DISCHARGE SUMMARY + DAILY RECOMMENDATION ─────────────────────

const SYSTEM_PROMPT_DAILY_REC = `Kamu adalah dokter spesialis penyakit dalam yang membantu ko-asisten di bangsal rumah sakit Indonesia. Analisis data klinis pasien dan berikan rekomendasi manajemen spesifik untuk hari ini.

Berikan output dalam format JSON berikut (HANYA JSON, tanpa markdown, tanpa penjelasan):
{
  "asesmen": "string — ringkasan kondisi klinis saat ini dalam 2-3 kalimat",
  "prioritas": "BAIK" | "PERHATIAN" | "KRITIS",
  "targetHariIni": ["string", ...],
  "monitoringKetat": ["string", ...],
  "rencanaTherapy": ["string", ...],
  "rencanaLabImaging": ["string", ...],
  "targetKRS": "string — kapan kira-kira pasien bisa KRS dan syaratnya",
  "warningSign": ["string", ...],
  "catatanKhusus": "string atau null"
}

Aturan:
- targetHariIni: hal-hal yang HARUS dilakukan hari ini (max 5 poin, spesifik dan actionable)
- monitoringKetat: parameter yang perlu dipantau ketat beserta frekuensinya
- rencanaTherapy: saran penyesuaian terapi jika ada (boleh kosong array jika terapi sudah optimal)
- rencanaLabImaging: pemeriksaan penunjang yang disarankan hari ini
- warningSign: tanda bahaya yang perlu diwaspadai
- Jawab dalam Bahasa Indonesia yang ringkas dan klinis`;

const SYSTEM_PROMPT_DISCHARGE = `Kamu adalah dokter spesialis penyakit dalam yang membantu ko-asisten membuat surat ringkasan pulang (discharge summary) di rumah sakit Indonesia. Buat discharge summary berdasarkan data klinis yang diberikan.

Berikan output dalam format JSON berikut (HANYA JSON, tanpa markdown):
{
  "judulSurat": "RINGKASAN PULANG / DISCHARGE SUMMARY",
  "tanggalKeluar": "string",
  "diagnosisAkhir": "string",
  "ringkasanPerawatan": "string — narasi singkat perjalanan penyakit selama dirawat",
  "kondisiPulang": "string — kondisi pasien saat pulang",
  "terapiPulang": ["string", ...],
  "kontrolKembali": "string — kapan dan ke poliklinik apa",
  "instruksiPasien": ["string", ...],
  "tandaBahaya": ["string", ...],
  "catatanDpjp": "string atau null"
}

Buat dalam Bahasa Indonesia yang baik, mudah dimengerti pasien untuk instruksi, namun tetap klinis untuk bagian medis.`;

/**
 * Analisis klinis + rekomendasi harian untuk pasien
 * @param {Object} patient - data pasien lengkap
 * @param {number} losHari - length of stay dalam hari
 */
async function groqDailyRecommendation(patient, losHari) {
  const d = getData();

  // Bangun teks ringkasan pasien sebagai konteks
  const vitStr = patient.vital
    ? `TD ${patient.vital.td||'?'}, HR ${patient.vital.hr||'?'}x/m, RR ${patient.vital.rr||'?'}x/m, SpO2 ${patient.vital.spo2||'?'}%, Suhu ${patient.vital.suhu||'?'}°C, O2: ${patient.vital.o2||'RA'}`
    : 'TTV tidak tercatat';

  const labStr = patient.lab
    ? Object.entries(patient.lab)
        .filter(([k, v]) => k !== 'extra' && v)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ')
    : '';

  const extraLab = (patient.lab?.extra || []).map(e => `${e.nama}: ${e.nilai} ${e.satuan||''}`).join(', ');

  const konteks = `
PASIEN: ${patient.nama}, ${patient.usia||'?'} tahun, ${patient.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
HARI KE RAWAT: ${losHari !== null ? losHari + 1 : '?'} (MRS: ${patient.tglMRS || '?'})
STATUS KLINIS: ${patient.status?.toUpperCase()}
DPJP: ${patient.dpjp?.nama || '?'} ${patient.dpjp?.spesialis ? '('+patient.dpjp.spesialis+')' : ''}

DIAGNOSIS UTAMA: ${patient.diagnosisUtama || '?'}
DIAGNOSIS SEKUNDER: ${(patient.diagnosisSekunder||[]).join(', ') || '-'}

TTV TERAKHIR: ${vitStr}

LABORATORIUM: ${[labStr, extraLab].filter(Boolean).join(' | ') || 'belum tercatat'}

TERAPI AKTIF: ${(patient.terapi||[]).join(' | ') || 'belum tercatat'}

KONSUL: ${(patient.konsul||[]).map(k => `${k.spesialis} (${k.tanggal})`).join(', ') || '-'}

CPPT/CATATAN PERKEMBANGAN:
${patient.cppt || '(belum ada catatan)'}
`.trim();

  const content = await groqRequest(
    SYSTEM_PROMPT_DAILY_REC,
    konteks,
    d.groqApiKey,
    d.groqModel
  );
  return JSON.parse(content);
}

/**
 * Generate discharge summary untuk pasien yang akan KRS
 * @param {Object} patient - data pasien lengkap
 * @param {number} losHari - length of stay dalam hari
 */
async function groqDischargeSummary(patient, losHari) {
  const d = getData();

  const vitStr = patient.vital
    ? `TD ${patient.vital.td||'?'}, HR ${patient.vital.hr||'?'}x/m, RR ${patient.vital.rr||'?'}x/m, SpO2 ${patient.vital.spo2||'?'}%`
    : 'TTV tidak tercatat';

  const konteks = `
PASIEN: ${patient.nama}, ${patient.usia||'?'} tahun, ${patient.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
TANGGAL MRS: ${patient.tglMRS || '?'}
LAMA RAWAT: ${losHari !== null ? losHari + ' hari' : '?'}
DPJP: ${patient.dpjp?.nama || '?'} ${patient.dpjp?.spesialis ? '('+patient.dpjp.spesialis+')' : ''}

DIAGNOSIS UTAMA: ${patient.diagnosisUtama || '?'}
DIAGNOSIS SEKUNDER: ${(patient.diagnosisSekunder||[]).join(', ') || '-'}

KONDISI SAAT INI: ${patient.status?.toUpperCase()}
TTV TERAKHIR: ${vitStr}

TERAPI YANG DIBERIKAN: ${(patient.terapi||[]).join(' | ') || 'belum tercatat'}

PERJALANAN PENYAKIT / CPPT:
${patient.cppt || '(tidak ada catatan)'}
`.trim();

  const content = await groqRequest(
    SYSTEM_PROMPT_DISCHARGE,
    konteks,
    d.groqApiKey,
    d.groqModel
  );
  return JSON.parse(content);
}
