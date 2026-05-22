const service = window.atlasServices;

const state = {
  commands: [],
  readiness: null,
  tasks: []
};

const els = {
  serviceState: document.querySelector('#service-state'),
  viewTitle: document.querySelector('#view-title'),
  navItems: [...document.querySelectorAll('.nav-item')],
  views: [...document.querySelectorAll('.view')],
  readinessSummary: document.querySelector('#readiness-summary'),
  pathState: document.querySelector('#path-state'),
  readinessMessages: document.querySelector('#readiness-messages'),
  prepareApp: document.querySelector('#prepare-app'),
  refreshReadiness: document.querySelector('#refresh-readiness'),
  refreshTasks: document.querySelector('#refresh-tasks'),
  taskList: document.querySelector('#task-list'),
  loadQueueReport: document.querySelector('#load-queue-report'),
  reportOutput: document.querySelector('#report-output')
};

function assertServiceBridge() {
  if (!service?.list || !service?.invoke) {
    throw new Error('Atlas service bridge is unavailable');
  }
}

async function init() {
  try {
    assertServiceBridge();
    setServiceState('Connecting');
    state.commands = await service.list();
    setServiceState(`${state.commands.length} services`);
    bindEvents();
    await Promise.all([
      loadReadiness(),
      loadTasks(),
      loadQueueReport()
    ]);
  } catch (error) {
    setServiceState('Unavailable');
    renderError(els.readinessMessages, error);
  }
}

function bindEvents() {
  els.navItems.forEach((item) => {
    item.addEventListener('click', () => selectView(item.dataset.view));
  });
  els.refreshReadiness.addEventListener('click', loadReadiness);
  els.prepareApp.addEventListener('click', prepareApp);
  els.refreshTasks.addEventListener('click', loadTasks);
  els.loadQueueReport.addEventListener('click', loadQueueReport);
}

function selectView(name) {
  els.navItems.forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  els.views.forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  els.viewTitle.textContent = titleForView(name);
}

async function loadReadiness() {
  setBusy(els.refreshReadiness, true);
  try {
    state.readiness = await service.invoke('app.readiness');
    renderReadiness(state.readiness);
  } catch (error) {
    renderError(els.readinessMessages, error);
  } finally {
    setBusy(els.refreshReadiness, false);
  }
}

async function prepareApp() {
  setBusy(els.prepareApp, true);
  try {
    await service.invoke('app.prepare');
    await loadReadiness();
  } catch (error) {
    renderError(els.readinessMessages, error);
  } finally {
    setBusy(els.prepareApp, false);
  }
}

async function loadTasks() {
  setBusy(els.refreshTasks, true);
  try {
    state.tasks = await service.invoke('task.list', { limit: 8 });
    renderTasks(state.tasks);
  } catch (error) {
    renderError(els.taskList, error);
  } finally {
    setBusy(els.refreshTasks, false);
  }
}

async function loadQueueReport() {
  setBusy(els.loadQueueReport, true);
  try {
    const report = await service.invoke('report.queue', { limit: 8 });
    els.reportOutput.textContent = String(report || 'No queue report returned.');
  } catch (error) {
    els.reportOutput.textContent = `Report unavailable: ${error.message}`;
  } finally {
    setBusy(els.loadQueueReport, false);
  }
}

function renderReadiness(readiness) {
  els.readinessSummary.innerHTML = '';
  const cards = [
    ['Status', readiness.status],
    ['Live API', readiness.live_api?.state || 'unknown'],
    ['Topology', readiness.checks?.topology_lookup_ready ? 'ready' : 'missing'],
    ['Inventory', readiness.checks?.type_metadata_ready ? 'ready' : 'missing']
  ];
  cards.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = `status-card ${readiness.status}`;
    card.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span>`;
    els.readinessSummary.appendChild(card);
  });

  renderRows(els.pathState, (readiness.path_state || []).map((entry) => [
    entry.key,
    `${entry.exists ? 'exists' : 'missing'}; ${entry.valid ? 'valid' : 'invalid'}; ${entry.path}`
  ]));

  const messages = [
    ...(readiness.blockers || []).map((entry) => ({ ...entry, kind: 'blocker' })),
    ...(readiness.warnings || []).map((entry) => ({ ...entry, kind: 'warning' }))
  ];
  if (!messages.length) {
    els.readinessMessages.textContent = 'No blockers or warnings.';
  } else {
    els.readinessMessages.innerHTML = '';
    messages.forEach((entry) => {
      const row = document.createElement('div');
      row.className = `message ${entry.kind}`;
      row.innerHTML = `<span>${escapeHtml(entry.code)}</span><span>${escapeHtml(entry.message)}</span>`;
      els.readinessMessages.appendChild(row);
    });
  }
  els.prepareApp.hidden = !readiness.warnings?.some((entry) => entry.code === 'RUNTIME_PATHS_MISSING');
}

function renderTasks(tasks) {
  const rows = (tasks || []).map((task) => [
    task.type || task.task_id,
    `${task.status || 'unknown'}; ${task.started_at || 'not started'}`
  ]);
  renderRows(els.taskList, rows.length ? rows : [['Tasks', 'No backend tasks recorded.']]);
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

function renderError(target, error) {
  target.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'message blocker';
  row.innerHTML = `<span>Error</span><span>${escapeHtml(error.message || String(error))}</span>`;
  target.appendChild(row);
}

function setServiceState(text) {
  els.serviceState.textContent = text;
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.textContent = busy ? 'Working...' : button.dataset.originalText;
}

function titleForView(name) {
  return {
    readiness: 'Readiness',
    tasks: 'Tasks',
    reports: 'Reports'
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

init();
