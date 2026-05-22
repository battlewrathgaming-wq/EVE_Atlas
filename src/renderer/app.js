const service = window.atlasServices;
const atlasWindow = window.atlasWindow;

const state = {
  commands: [],
  readiness: null,
  tasks: [],
  selectedTaskId: null,
  selectedTask: null,
  window: {
    alwaysOnTop: false
  }
};

const els = {
  serviceState: document.querySelector('#service-state'),
  viewTitle: document.querySelector('#view-title'),
  navItems: [...document.querySelectorAll('.nav-item')],
  views: [...document.querySelectorAll('.view')],
  readinessSummary: document.querySelector('#readiness-summary'),
  nextAction: document.querySelector('#next-action'),
  apiState: document.querySelector('#api-state'),
  pathState: document.querySelector('#path-state'),
  topologyState: document.querySelector('#topology-state'),
  inventoryState: document.querySelector('#inventory-state'),
  readinessMessages: document.querySelector('#readiness-messages'),
  prepareApp: document.querySelector('#prepare-app'),
  refreshReadiness: document.querySelector('#refresh-readiness'),
  refreshTasks: document.querySelector('#refresh-tasks'),
  taskList: document.querySelector('#task-list'),
  taskDetail: document.querySelector('#task-detail'),
  taskProgress: document.querySelector('#task-progress'),
  taskOutput: document.querySelector('#task-output'),
  cancelTask: document.querySelector('#cancel-task'),
  loadQueueReport: document.querySelector('#load-queue-report'),
  reportOutput: document.querySelector('#report-output'),
  pinWindow: document.querySelector('#pin-window'),
  minimizeWindow: document.querySelector('#minimize-window'),
  closeWindow: document.querySelector('#close-window')
};

function assertServiceBridge() {
  if (!service?.list || !service?.invoke) {
    throw new Error('Atlas service bridge is unavailable');
  }
  if (!atlasWindow?.getState || !atlasWindow?.setAlwaysOnTop) {
    throw new Error('Atlas window bridge is unavailable');
  }
}

async function init() {
  try {
    assertServiceBridge();
    setServiceState('Connecting');
    state.commands = await service.list();
    state.window = await atlasWindow.getState();
    renderWindowState();
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
  els.cancelTask.addEventListener('click', cancelSelectedTask);
  els.loadQueueReport.addEventListener('click', loadQueueReport);
  els.pinWindow.addEventListener('click', toggleAlwaysOnTop);
  els.minimizeWindow.addEventListener('click', () => atlasWindow.minimize());
  els.closeWindow.addEventListener('click', () => atlasWindow.close());
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
    if (state.selectedTaskId) {
      await loadTaskDetail(state.selectedTaskId);
    } else if (state.tasks[0]) {
      await loadTaskDetail(state.tasks[0].task_id);
    } else {
      renderTaskDetail(null);
    }
  } catch (error) {
    renderError(els.taskList, error);
  } finally {
    setBusy(els.refreshTasks, false);
  }
}

async function loadTaskDetail(taskId) {
  state.selectedTaskId = taskId;
  state.selectedTask = await service.invoke('task.get', { task_id: taskId });
  renderTasks(state.tasks);
  renderTaskDetail(state.selectedTask);
}

async function cancelSelectedTask() {
  if (!state.selectedTaskId) {
    return;
  }
  setBusy(els.cancelTask, true);
  try {
    state.selectedTask = await service.invoke('task.cancel', {
      task_id: state.selectedTaskId,
      reason: 'Cancelled from renderer task view'
    });
    await loadTasks();
  } catch (error) {
    renderError(els.taskDetail, error);
  } finally {
    setBusy(els.cancelTask, false);
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

async function toggleAlwaysOnTop() {
  els.pinWindow.disabled = true;
  try {
    state.window = await atlasWindow.setAlwaysOnTop(!state.window.alwaysOnTop);
    renderWindowState();
  } finally {
    els.pinWindow.disabled = false;
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
    `${pathStateLabel(entry)}; ${entry.path}`
  ]));

  renderRows(els.apiState, [
    ['Live API', `${readiness.live_api?.state || 'unknown'}; ${readiness.live_api?.rule || ''}`],
    ['User-Agent', readiness.app?.user_agent || 'missing'],
    ['Generated', readiness.generated_at || 'unknown'],
    ['Mode', readiness.app?.mode || 'unknown']
  ]);

  renderRows(els.topologyState, [
    ['Status', readiness.checks?.topology_lookup_ready ? 'ready' : 'missing'],
    ['Imported', readiness.sde?.topology?.imported ? 'yes' : 'no'],
    ['Build', readiness.sde?.topology?.build_number || 'unknown'],
    ['Imported At', readiness.sde?.topology?.imported_at || 'unknown'],
    ['Regions', readiness.lookup_counts?.regions ?? 0],
    ['Constellations', readiness.lookup_counts?.constellations ?? 0],
    ['Systems', readiness.lookup_counts?.solar_systems ?? 0],
    ['Adjacency', readiness.lookup_counts?.system_adjacency ?? 0]
  ]);

  renderRows(els.inventoryState, [
    ['Status', readiness.checks?.type_metadata_ready ? 'ready' : 'missing'],
    ['Imported', readiness.sde?.inventory?.imported ? 'yes' : 'no'],
    ['Build', readiness.sde?.inventory?.build_number || 'unknown'],
    ['Imported At', readiness.sde?.inventory?.imported_at || 'unknown'],
    ['Type Metadata', readiness.lookup_counts?.type_metadata ?? 0],
    ['Entities', readiness.lookup_counts?.entities ?? 0],
    ['Fetch Runs', readiness.lookup_counts?.fetch_runs ?? 0],
    ['Metadata Runs', readiness.lookup_counts?.metadata_runs ?? 0]
  ]);

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
  renderNextAction(readiness);
}

function renderTasks(tasks) {
  els.taskList.innerHTML = '';
  if (!tasks?.length) {
    els.taskList.textContent = 'No backend tasks recorded.';
    return;
  }
  tasks.forEach((task) => {
    const item = document.createElement('button');
    item.className = `task-item ${task.status || 'unknown'}`;
    item.classList.toggle('active', task.task_id === state.selectedTaskId);
    item.type = 'button';
    item.innerHTML = [
      `<strong>${escapeHtml(task.type || task.task_id)}</strong>`,
      `<span>${escapeHtml(task.status || 'unknown')} · ${escapeHtml(task.classification || 'unknown')}</span>`,
      `<small>${escapeHtml(task.scope_key || 'unscoped')}</small>`
    ].join('');
    item.addEventListener('click', () => loadTaskDetail(task.task_id));
    els.taskList.appendChild(item);
  });
}

function renderTaskDetail(task) {
  if (!task) {
    renderRows(els.taskDetail, [['Task', 'No task selected.']]);
    els.taskProgress.textContent = 'No progress events.';
    els.taskOutput.textContent = 'Select a task to inspect details.';
    els.cancelTask.hidden = true;
    return;
  }

  renderRows(els.taskDetail, [
    ['Task ID', task.task_id],
    ['Type', task.type || 'unknown'],
    ['Status', task.status || 'unknown'],
    ['Classification', task.classification || 'unknown'],
    ['Scope', task.scope_key || 'unscoped'],
    ['Queued', task.queued_at || 'unknown'],
    ['Started', task.started_at || 'not started'],
    ['Finished', task.finished_at || 'not finished'],
    ['Cancel Requested', task.cancel_requested_at || 'no']
  ]);

  renderProgress(task.progress || []);
  renderTaskOutput(task);
  els.cancelTask.hidden = !isCancellable(task);
}

function renderProgress(progress) {
  els.taskProgress.innerHTML = '';
  if (!progress.length) {
    els.taskProgress.textContent = 'No progress events.';
    return;
  }
  progress.forEach((event) => {
    const row = document.createElement('div');
    row.className = 'timeline-row';
    const count = event.total ? ` (${event.current || 0}/${event.total})` : '';
    row.innerHTML = `<span>${escapeHtml(event.at || '')}</span><strong>${escapeHtml(event.stage || 'progress')}</strong><p>${escapeHtml((event.message || '') + count)}</p>`;
    els.taskProgress.appendChild(row);
  });
}

function renderTaskOutput(task) {
  const payload = {
    warnings: task.warnings || [],
    error: task.error || null,
    result: task.result || null,
    cancel_reason: task.cancel_reason || null
  };
  els.taskOutput.textContent = JSON.stringify(payload, null, 2);
}

function isCancellable(task) {
  return ['queued', 'running'].includes(task.status);
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

function renderNextAction(readiness) {
  const action = nextActionFor(readiness);
  els.nextAction.className = `callout ${action.kind}`;
  els.nextAction.innerHTML = `<strong>${escapeHtml(action.title)}</strong><span>${escapeHtml(action.body)}</span>`;
}

function nextActionFor(readiness) {
  if (readiness.blockers?.length) {
    return {
      kind: 'blocked',
      title: 'Resolve readiness blockers',
      body: readiness.blockers[0].message
    };
  }
  if (readiness.warnings?.some((entry) => entry.code === 'RUNTIME_PATHS_MISSING')) {
    return {
      kind: 'warning',
      title: 'Prepare runtime paths',
      body: 'Create the approved local runtime, cache, and SDE folders.'
    };
  }
  if (!readiness.checks?.topology_lookup_ready) {
    return {
      kind: 'warning',
      title: 'Import SDE topology',
      body: 'Topology-dependent system and radius actions need local SDE topology.'
    };
  }
  if (!readiness.checks?.type_metadata_ready) {
    return {
      kind: 'warning',
      title: 'Import SDE inventory',
      body: 'Ship and type labels need local SDE inventory metadata.'
    };
  }
  if (!readiness.live_api?.enabled) {
    return {
      kind: 'warning',
      title: 'Live API disabled',
      body: 'Local reports are available. Live zKill/ESI actions require explicit enablement.'
    };
  }
  return {
    kind: 'ready',
    title: 'Atlas is ready',
    body: 'Local readiness checks are clear for available actions.'
  };
}

function pathStateLabel(entry) {
  const parts = [];
  parts.push(entry.exists ? 'exists' : 'missing');
  parts.push(entry.valid ? 'valid' : 'invalid');
  if (entry.is_directory) {
    parts.push('directory');
  }
  if (entry.is_file) {
    parts.push('file');
  }
  return parts.join('; ');
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
