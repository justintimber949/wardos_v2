/**
 * WardOS v2 — Settings Panel
 */

function openSettings() {
  const d = getData();
  const html = `
<div class="settings-overlay" id="settings-modal" onclick="if(event.target===this)closeSettings()">
  <div class="settings-box">
    <div class="settings-header">
      <span>⚙️</span>
      <div class="settings-title">Pengaturan</div>
      <button class="modal-close" onclick="closeSettings()">✕</button>
    </div>
    <div class="settings-body">

      <!-- Info RS -->
      <div class="settings-section">
        <div class="settings-section-title">Informasi Umum</div>
        <div class="g2" style="margin-bottom:8px">
          <div class="fg"><label>Nama Rumah Sakit</label><input class="ifp" id="cfg-rs" value="${esc(d.hospitalName||'')}"></div>
          <div class="fg"><label>Nama Koas</label><input class="ifp" id="cfg-koas" value="${esc(d.koasName||'')}"></div>
        </div>
        <button class="bu bp" onclick="saveInfoSettings()">Simpan Info</button>
      </div>

      <!-- Groq AI -->
      <div class="settings-section">
        <div class="settings-section-title">Groq AI</div>
        <div class="g2" style="margin-bottom:8px">
          <div class="fg"><label>API Key</label><input class="ifp" id="cfg-key" type="password" placeholder="gsk_..." value="${esc(d.groqApiKey||'')}"></div>
          <div class="fg"><label>Model <span style="font-size:10px;color:var(--mu)">ketik nama model Groq</span></label><input class="ifp" id="cfg-model" placeholder="llama-3.1-8b-instant" value="${esc(d.groqModel||'llama-3.1-8b-instant')}" style="font-family:var(--mono);font-size:12px"></div>
        </div>
        <button class="bu bp" onclick="saveGroqSettings()">Simpan Groq</button>
        ${d.groqApiKey ? '<span style="font-size:11px;color:var(--stabil);margin-left:8px">✓ Key tersimpan</span>' : ''}
      </div>

      <!-- Room Config -->
      <div class="settings-section">
        <div class="settings-section-title">Konfigurasi Ruangan</div>
        <div style="font-size:11px;color:var(--mu);margin-bottom:8px">Nama ruangan dan warna. Perubahan hanya mempengaruhi tampilan, data pasien tetap aman.</div>
        <div id="room-cfg-list">
          ${d.rooms.map(r => `
          <div class="room-cfg-row" data-room-id="${r.id}">
            <span style="font-size:16px">${r.icon}</span>
            <input type="color" class="color-swatch" value="${r.color}" title="Ubah warna" onchange="updateRoomColor('${r.id}',this.value)">
            <input class="ifp" value="${esc(r.name)}" style="font-size:12px" onchange="updateRoomName('${r.id}',this.value)">
            <input class="ifp" type="number" min="1" value="${r.kamar.length}" style="font-size:11px" title="Jumlah kamar" readonly>
            <span style="font-size:10px;color:var(--mu);padding:0 4px;white-space:nowrap">${r.kamar.reduce((s,k)=>s+k.beds.length,0)} bed</span>
            <button class="bu bgh" style="font-size:11px;white-space:nowrap" onclick="editBedConfig('${r.id}')">🛏 Bed</button>
            <button class="bu brd" style="font-size:11px" onclick="deleteRoom('${r.id}')" title="Hapus ruangan">✕</button>
          </div>`).join('')}
        </div>
        <button class="bu bgh" style="margin-top:8px;font-size:11px" onclick="addRoom()">＋ Tambah Ruangan</button>
      </div>

      <!-- Reset -->
      <div class="settings-section">
        <div class="settings-section-title">Reset Data</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="bu brd" onclick="resetAllPatients()">🗑 Hapus Semua Pasien</button>
          <button class="bu brd" onclick="resetTotal()">⚠️ Reset Total (hapus semua data)</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeSettings() {
  document.getElementById('settings-modal')?.remove();
  document.getElementById('bed-config-modal')?.remove();
}

function saveInfoSettings() {
  setSetting('hospitalName', document.getElementById('cfg-rs')?.value?.trim() || '');
  setSetting('koasName', document.getElementById('cfg-koas')?.value?.trim() || '');
  renderSidebar();
  showToast('Info RS disimpan', 'success');
}

function saveGroqSettings() {
  setSetting('groqApiKey', document.getElementById('cfg-key')?.value?.trim() || '');
  const modelVal = document.getElementById('cfg-model')?.value?.trim() || 'llama-3.1-8b-instant';
  setSetting('groqModel', modelVal);
  showToast('Pengaturan Groq disimpan', 'success');
}

function updateRoomColor(roomId, color) {
  const room = getRoom(roomId);
  if (room) { room.color = color; saveData(); renderSidebar(); }
}

function updateRoomName(roomId, name) {
  const room = getRoom(roomId);
  if (room) { room.name = name.trim(); saveData(); renderSidebar(); }
}

function deleteRoom(roomId) {
  showConfirm('Hapus Ruangan', 'Yakin hapus ruangan ini? Semua data bed dan pasien di ruangan ini akan hilang.', () => {
    getData().rooms = getData().rooms.filter(r => r.id !== roomId);
    saveData();
    renderSidebar();
    closeSettings();
    openSettings();
    showToast('Ruangan dihapus', 'warn');
  });
}

function addRoom() {
  const old = document.getElementById('add-room-modal');
  if (old) old.remove();
  const html = `
<div class="confirm-overlay" id="add-room-modal">
  <div class="confirm-box" style="max-width:420px">
    <div class="confirm-title">🏥 Tambah Ruangan Baru</div>
    <div class="confirm-msg" style="margin-bottom:10px">Isi detail ruangan baru yang akan ditambahkan.</div>
    <div class="g2" style="margin-bottom:8px">
      <div class="fg"><label>Nama Ruangan *</label><input class="ifp" id="nr-name" placeholder="Mawar, Teratai, dll" autofocus></div>
      <div class="fg"><label>Icon (emoji)</label><input class="ifp" id="nr-icon" placeholder="🏥" maxlength="4" value="🏥"></div>
    </div>
    <div class="fg" style="margin-bottom:10px">
      <label>Warna</label>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="color" id="nr-color" value="#8b5cf6" style="width:40px;height:32px;border:none;background:none;cursor:pointer;padding:0">
        <span id="nr-color-val" style="font-family:var(--mono);font-size:11px;color:var(--mu)">#8b5cf6</span>
      </div>
    </div>
    <div class="confirm-actions">
      <button class="bu bgh" onclick="document.getElementById('add-room-modal').remove()">Batal</button>
      <button class="bu bp" onclick="confirmAddRoom()">Tambah Ruangan</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  // live preview color label
  const colorInput = document.getElementById('nr-color');
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      const lbl = document.getElementById('nr-color-val');
      if (lbl) lbl.textContent = colorInput.value;
    });
  }
}

function confirmAddRoom() {
  const name = document.getElementById('nr-name')?.value?.trim();
  const icon = document.getElementById('nr-icon')?.value?.trim() || '🏥';
  const color = document.getElementById('nr-color')?.value || '#8b5cf6';
  if (!name) { showToast('Nama ruangan wajib diisi', 'error'); return; }
  const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
  getData().rooms.push({
    id, name, color, icon,
    kamar: [{ id:'k1', name:'Kamar 1', beds:[{id:'1A',name:'1A'},{id:'1B',name:'1B'},{id:'1C',name:'1C'},{id:'1D',name:'1D'}] }]
  });
  saveData();
  renderSidebar();
  document.getElementById('add-room-modal')?.remove();
  closeSettings();
  openSettings();
  showToast(`Ruangan "${name}" ditambahkan`, 'success');
}

// ── ROOM STRUCTURE EDITOR ─────────────────────────────────────────
let _editingRoomId = null;

function editBedConfig(roomId) {
  _editingRoomId = roomId;
  openRoomStructureEditor(roomId);
}

function openRoomStructureEditor(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  const old = document.getElementById('bed-config-modal');
  if (old) old.remove();

  const html = `
<div class="confirm-overlay" id="bed-config-modal">
  <div class="confirm-box" style="max-width:520px;max-height:85vh;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-shrink:0">
      <div style="font-size:16px">${room.icon}</div>
      <div style="font-weight:700;font-size:14px;color:var(--tx)">Struktur Ruangan — ${esc(room.name)}</div>
      <button class="bu bgh" style="margin-left:auto;font-size:11px" onclick="document.getElementById('bed-config-modal').remove()">✕ Tutup</button>
    </div>
    <div style="overflow-y:auto;flex:1;padding-right:4px" id="rse-list"></div>
    <div style="margin-top:10px;display:flex;gap:8px;flex-shrink:0;border-top:1px solid var(--bd);padding-top:10px">
      <button class="bu bgh" onclick="rseAddKamar('${roomId}')">＋ Tambah Kamar</button>
      <button class="bu bp" onclick="rseSave('${roomId}')">💾 Simpan Semua</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  rseRender(roomId);
}

function rseRender(roomId) {
  const room = getRoom(roomId);
  const list = document.getElementById('rse-list');
  if (!room || !list) return;

  list.innerHTML = room.kamar.map((kamar, ki) => {
    const bedCount = kamar.beds.length;
    const activeCount = kamar.beds.filter(b => b.patient && !['krs','meninggal','lepas_rawat'].includes(b.patient.status)).length;

    const bedsHtml = kamar.beds.map((bed, bi) => {
      const hasActivePatient = bed.patient && !['krs','meninggal','lepas_rawat'].includes(bed.patient.status);
      const hasAnyPatient = !!bed.patient;
      return `
      <div class="rse-bed" id="rse-bed-${ki}-${bi}">
        <span class="rse-bed-dot" style="background:${hasActivePatient?'var(--perhatian)':hasAnyPatient?'#4b5563':'var(--su)'}"></span>
        <input class="rse-bed-input ifp" value="${esc(bed.name)}" data-ki="${ki}" data-bi="${bi}" style="font-size:11px;font-family:var(--mono)">
        ${hasAnyPatient ? `<span style="font-size:9px;color:var(--mu);white-space:nowrap" title="${esc(bed.patient.nama)}">${esc(bed.patient.nama.split(' ').slice(-1)[0])}</span>` : ''}
        <button class="rse-delbtn" onclick="rseDeleteBed('${roomId}',${ki},${bi})" title="Hapus bed" ${hasActivePatient?'disabled':''} style="${hasActivePatient?'opacity:.3;cursor:not-allowed':''}">✕</button>
      </div>`;
    }).join('');

    return `
    <div class="rse-kamar" id="rse-kamar-${ki}">
      <div class="rse-kamar-head">
        <span style="font-size:11px;font-weight:600;color:var(--mu)">KAMAR</span>
        <input class="ifp rse-kamar-name" value="${esc(kamar.name)}" data-ki="${ki}" style="font-size:12px;font-weight:600;flex:1;max-width:180px">
        <span style="font-size:10px;color:var(--mu);margin:0 6px">${bedCount} bed${activeCount ? ' · '+activeCount+' terisi' : ''}</span>
        <button class="bu bgh" style="font-size:10px;padding:2px 6px;margin-left:auto" onclick="rseAddBed('${roomId}',${ki})">＋ Bed</button>
        <button class="rse-delbtn" onclick="rseDeleteKamar('${roomId}',${ki})" title="Hapus kamar" ${activeCount>0?'disabled':''} style="${activeCount>0?'opacity:.3;cursor:not-allowed':''}">✕</button>
      </div>
      <div class="rse-beds">${bedsHtml}</div>
    </div>`;
  }).join('') || `<div style="text-align:center;padding:20px;color:var(--mu);font-size:12px">Belum ada kamar — klik "Tambah Kamar"</div>`;
}

function rseFlushToMemory(roomId) {
  // Commit semua perubahan nama kamar & bed dari DOM ke memory (tanpa saveData)
  // Dipanggil sebelum re-render agar input yang sudah diubah user tidak hilang
  const room = getRoom(roomId);
  if (!room) return;
  document.querySelectorAll('.rse-kamar-name').forEach(el => {
    const ki = parseInt(el.dataset.ki);
    if (!isNaN(ki) && room.kamar[ki]) {
      room.kamar[ki].name = el.value.trim() || room.kamar[ki].name;
    }
  });
  document.querySelectorAll('.rse-bed-input').forEach(el => {
    const ki = parseInt(el.dataset.ki);
    const bi = parseInt(el.dataset.bi);
    if (!isNaN(ki) && !isNaN(bi) && room.kamar[ki]?.beds[bi]) {
      const newName = el.value.trim();
      if (newName) {
        room.kamar[ki].beds[bi].name = newName;
        room.kamar[ki].beds[bi].id = newName.toUpperCase().replace(/\s+/g, '-');
      }
    }
  });
}

function rseAddKamar(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  // Flush dulu sebelum re-render agar nama yang sudah diedit tidak hilang
  rseFlushToMemory(roomId);
  const idx = room.kamar.length + 1;
  room.kamar.push({
    id: `k${idx}-${Date.now().toString(36)}`,
    name: `Kamar ${idx}`,
    beds: [
      {id:`${idx}A`,name:`${idx}A`},
      {id:`${idx}B`,name:`${idx}B`},
      {id:`${idx}C`,name:`${idx}C`},
      {id:`${idx}D`,name:`${idx}D`},
    ]
  });
  rseRender(roomId);
}

function rseDeleteKamar(roomId, kamarIdx) {
  const room = getRoom(roomId);
  if (!room) return;
  const kamar = room.kamar[kamarIdx];
  if (!kamar) return;
  const active = kamar.beds.filter(b => b.patient && !['krs','meninggal','lepas_rawat'].includes(b.patient.status)).length;
  if (active > 0) { showToast('Kamar ini masih ada pasien aktif, tidak bisa dihapus', 'error'); return; }
  const hasAny = kamar.beds.some(b => b.patient);
  const doDelete = () => {
    rseFlushToMemory(roomId);
    room.kamar.splice(kamarIdx, 1);
    rseRender(roomId);
  };
  if (hasAny) {
    showConfirm('Hapus Kamar', `Masih ada data KRS/Meninggal di kamar ini. Hapus kamar "${esc(kamar.name)}"?`, doDelete);
  } else {
    doDelete();
  }
}

function rseAddBed(roomId, kamarIdx) {
  const room = getRoom(roomId);
  if (!room) return;
  const kamar = room.kamar[kamarIdx];
  if (!kamar) return;
  // Flush dulu agar nama kamar/bed yang sudah diedit tidak hilang
  rseFlushToMemory(roomId);
  const suffix = ['A','B','C','D','E','F','G','H'][kamar.beds.length % 8];
  const baseName = kamarIdx + 1;
  const newName = `${baseName}${suffix}`;
  const newId = newName.toUpperCase().replace(/\s+/g, '-');
  kamar.beds.push({ id: newId, name: newName });
  rseRender(roomId);
  setTimeout(() => {
    const inputs = document.querySelectorAll(`#rse-kamar-${kamarIdx} .rse-bed-input`);
    if (inputs.length) inputs[inputs.length - 1].select();
  }, 50);
}

function rseDeleteBed(roomId, kamarIdx, bedIdx) {
  const room = getRoom(roomId);
  if (!room) return;
  const kamar = room.kamar[kamarIdx];
  if (!kamar) return;
  const bed = kamar.beds[bedIdx];
  if (!bed) return;
  if (bed.patient && !['krs','meninggal','lepas_rawat'].includes(bed.patient.status)) {
    showToast('Bed ini masih terisi pasien aktif', 'error'); return;
  }
  const doDelete = () => {
    rseFlushToMemory(roomId);
    kamar.beds.splice(bedIdx, 1);
    rseRender(roomId);
  };
  if (bed.patient) {
    showConfirm('Hapus Bed', `Data KRS/Meninggal di bed "${esc(bed.name)}" akan turut terhapus. Lanjutkan?`, doDelete);
  } else {
    doDelete();
  }
}

function rseSave(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  // Commit nama kamar dari DOM
  document.querySelectorAll('.rse-kamar-name').forEach(el => {
    const ki = parseInt(el.dataset.ki);
    if (!isNaN(ki) && room.kamar[ki]) {
      room.kamar[ki].name = el.value.trim() || room.kamar[ki].name;
    }
  });
  // Commit nama bed dari DOM
  document.querySelectorAll('.rse-bed-input').forEach(el => {
    const ki = parseInt(el.dataset.ki);
    const bi = parseInt(el.dataset.bi);
    if (!isNaN(ki) && !isNaN(bi) && room.kamar[ki]?.beds[bi]) {
      const newName = el.value.trim();
      if (newName) {
        room.kamar[ki].beds[bi].name = newName;
        room.kamar[ki].beds[bi].id = newName.toUpperCase().replace(/\s+/g, '-');
      }
    }
  });
  saveData();
  renderSidebar();
  document.getElementById('bed-config-modal')?.remove();

  // Refresh jumlah kamar & bed di room-cfg-list tanpa tutup settings
  const cfgList = document.getElementById('room-cfg-list');
  if (cfgList) {
    const d = getData();
    cfgList.innerHTML = d.rooms.map(r => `
    <div class="room-cfg-row" data-room-id="${r.id}">
      <span style="font-size:16px">${r.icon}</span>
      <input type="color" class="color-swatch" value="${r.color}" title="Ubah warna" onchange="updateRoomColor('${r.id}',this.value)">
      <input class="ifp" value="${esc(r.name)}" style="font-size:12px" onchange="updateRoomName('${r.id}',this.value)">
      <input class="ifp" type="number" min="1" value="${r.kamar.length}" style="font-size:11px" title="Jumlah kamar" readonly>
      <span style="font-size:10px;color:var(--mu);padding:0 4px;white-space:nowrap">${r.kamar.reduce((s,k)=>s+k.beds.length,0)} bed</span>
      <button class="bu bgh" style="font-size:11px;white-space:nowrap" onclick="editBedConfig('${r.id}')">🛏 Bed</button>
      <button class="bu brd" style="font-size:11px" onclick="deleteRoom('${r.id}')" title="Hapus ruangan">✕</button>
    </div>`).join('');
  }

  showToast(`Struktur ${room.name} disimpan`, 'success');
}


function resetAllPatients() {
  showConfirm('Hapus Semua Pasien', 'Semua data pasien di semua bed akan dihapus. Data TIDAK BISA dikembalikan.', () => {
    for (const room of getData().rooms) {
      for (const kamar of room.kamar) {
        for (const bed of kamar.beds) { bed.patient = null; }
      }
    }
    saveData();
    renderSidebar();
    refreshCurrentView();
    showToast('Semua pasien dihapus', 'warn');
  });
}

function resetTotal() {
  showConfirm('⚠️ Reset Total', 'Ini akan menghapus SEMUA data termasuk pengaturan dan konfigurasi. Tidak bisa dikembalikan!', () => {
    showConfirm('Konfirmasi Akhir', 'Yakin reset total? Halaman akan di-reload.', () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
  });
}
