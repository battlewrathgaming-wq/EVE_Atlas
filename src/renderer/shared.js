// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


function parseIdList(value) {
  return String(value || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function numberOrUndefined(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== '' ? number : undefined;
}

function textOrUndefined(value) {
  const text = String(value || '').trim();
  return text || undefined;
}

function cleanObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => (
    item !== undefined &&
    !(Array.isArray(item) && item.length === 0)
  )));
}

async function toggleAlwaysOnTop() {
  els.pinWindow.disabled = true;
  try {
    state.window = await windowBridge.setAlwaysOnTop(!state.window.alwaysOnTop);
    renderWindowState();
  } finally {
    els.pinWindow.disabled = false;
  }
}

function renderRows(target, rows) {
  target.innerHTML = '';
  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'detail-row';
    row.innerHTML = `<span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span>`;
    target.appendChild(row);
  });
}

function statusBadge(value) {
  const text = String(value || 'unknown');
  const css = text.replaceAll('_', '-').toLowerCase();
  return `<span class="status-badge ${escapeHtml(css)}">${escapeHtml(text)}</span>`;
}

function renderWindowState() {
  els.pinWindow.classList.toggle('active', state.window.alwaysOnTop === true);
  els.pinWindow.textContent = state.window.alwaysOnTop ? 'Pinned' : 'Pin';
}

function renderError(target, error) {
  target.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'message blocker';
  row.innerHTML = `<span>Error</span><span>${escapeHtml(error.message || String(error))}</span>`;
  target.appendChild(row);
}

function setServiceState(text) {
  if (els.serviceState) {
    els.serviceState.textContent = text;
  }
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.setAttribute('aria-busy', busy ? 'true' : 'false');
  button.classList.toggle('is-busy', busy);
}

function titleForView(name) {
  return {
    investigation: 'Discovery',
    readiness: 'Settings / Diagnostics',
    scopes: 'Scope Detail',
    tasks: 'Task History',
    'queue-watch': 'Watch',
    actions: 'Discovery Actions',
    reports: 'Observation / Assessment'
  }[name] || 'AURA Atlas';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
