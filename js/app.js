/**
 * WardOS v2 — App Entry Point & Router
 */

// ── CURRENT VIEW STATE ────────────────────────────────────────────
let _currentView = 'dashboard';
let _currentRoomId = null;

// ── NAVIGATE ──────────────────────────────────────────────────────
function navigate(view, roomId) {
  _currentView = view;
  _currentRoomId = roomId || null;

  // Hide all views
  document.querySelectorAll('.vw').forEach(el => el.classList.remove('active'));

  // Clear nav active
  document.querySelectorAll('.ni').forEach(el => el.classList.remove('active'));

  if (view === 'dashboard') {
    document.getElementById('v-dashboard')?.classList.add('active');
    document.getElementById('n-dashboard')?.classList.add('active');
    renderDashboard();
  } else if (view === 'input') {
    document.getElementById('v-input')?.classList.add('active');
    document.getElementById('n-input')?.classList.add('active');
    renderInputView();
  } else if (view === 'peta') {
    document.getElementById('v-peta')?.classList.add('active');
    document.getElementById('n-peta')?.classList.add('active');
    renderPeta();
  } else if (view === 'room' && roomId) {
    document.getElementById('v-room')?.classList.add('active');
    document.getElementById(`n-${roomId}`)?.classList.add('active');
    renderRoom(roomId);
  }
}

// Called after data changes to refresh the currently visible view
function refreshCurrentView() {
  navigate(_currentView, _currentRoomId);
}

// ── EXPORT / IMPORT HANDLERS ──────────────────────────────────────
function handleExport() {
  exportJSON();
  showToast('Data diexport', 'success');
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = importJSON(ev.target.result);
      if (ok) {
        showToast('Data berhasil diimport', 'success');
        renderSidebar();
        refreshCurrentView();
      } else {
        showToast('Import gagal — format tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeSettings();
  }
});

// ── INIT ──────────────────────────────────────────────────────────
function init() {
  loadData();
  renderSidebar();
  navigate('dashboard');
}

window.addEventListener('DOMContentLoaded', init);
