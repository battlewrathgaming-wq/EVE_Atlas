const service = window.atlasServices;
const windowBridge = window.atlasWindow;

const state = {
  commands: [],
  readiness: null,
  scopeDefaults: null,
  queueSelection: null,
  watchSchedule: null,
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
  validateScope: document.querySelector('#validate-scope'),
  scopeKind: document.querySelector('#scope-kind'),
  scopeDiscoveryType: document.querySelector('#scope-discovery-type'),
  scopeActorType: document.querySelector('#scope-actor-type'),
  scopeActorId: document.querySelector('#scope-actor-id'),
  scopeActorName: document.querySelector('#scope-actor-name'),
  scopeSystemId: document.querySelector('#scope-system-id'),
  scopeSystemName: document.querySelector('#scope-system-name'),
  scopeRadius: document.querySelector('#scope-radius'),
  scopeLookback: document.querySelector('#scope-lookback'),
  scopeMaxRefs: document.querySelector('#scope-max-refs'),
  scopeMaxSystems: document.querySelector('#scope-max-systems'),
  scopeMaxExpansions: document.querySelector('#scope-max-expansions'),
  scopeDiscoveredByType: document.querySelector('#scope-discovered-by-type'),
  scopeDiscoveredById: document.querySelector('#scope-discovered-by-id'),
  scopeKillmailIds: document.querySelector('#scope-killmail-ids'),
  scopeDefaults: document.querySelector('#scope-defaults'),
  scopeValidation: document.querySelector('#scope-validation'),
  scopeNormalized: document.querySelector('#scope-normalized'),
  refreshTasks: document.querySelector('#refresh-tasks'),
  taskList: document.querySelector('#task-list'),
  taskDetail: document.querySelector('#task-detail'),
  taskProgress: document.querySelector('#task-progress'),
  taskOutput: document.querySelector('#task-output'),
  cancelTask: document.querySelector('#cancel-task'),
  previewQueueSelection: document.querySelector('#preview-queue-selection'),
  queueDiscoveredByType: document.querySelector('#queue-discovered-by-type'),
  queueDiscoveredById: document.querySelector('#queue-discovered-by-id'),
  queueSelectionMode: document.querySelector('#queue-selection-mode'),
  queueMaxExpansions: document.querySelector('#queue-max-expansions'),
  queueKillmailIds: document.querySelector('#queue-killmail-ids'),
  queueSelectionSummary: document.querySelector('#queue-selection-summary'),
  queueRefList: document.querySelector('#queue-ref-list'),
  refreshWatchStatus: document.querySelector('#refresh-watch-status'),
  watchSessionArmed: document.querySelector('#watch-session-armed'),
  watchLiveApiEnabled: document.querySelector('#watch-live-api-enabled'),
  watchSummary: document.querySelector('#watch-summary'),
  watchList: document.querySelector('#watch-list'),
  preflightManualDiscovery: document.querySelector('#preflight-manual-discovery'),
  runManualDiscovery: document.querySelector('#run-manual-discovery'),
  actionDiscoveryScope: document.querySelector('#action-discovery-scope'),
  actionActorType: document.querySelector('#action-actor-type'),
  actionActorId: document.querySelector('#action-actor-id'),
  actionActorName: document.querySelector('#action-actor-name'),
  actionSystemId: document.querySelector('#action-system-id'),
  actionRadius: document.querySelector('#action-radius'),
  actionLookback: document.querySelector('#action-lookback'),
  actionMaxRefs: document.querySelector('#action-max-refs'),
  actionMaxSystems: document.querySelector('#action-max-systems'),
  actionMaxRefsPerSystem: document.querySelector('#action-max-refs-per-system'),
  actionConfirmLive: document.querySelector('#action-confirm-live'),
  manualDiscoveryPreflight: document.querySelector('#manual-discovery-preflight'),
  manualDiscoveryTask: document.querySelector('#manual-discovery-task'),
  manualDiscoveryNormalized: document.querySelector('#manual-discovery-normalized'),
  loadActorReport: document.querySelector('#load-actor-report'),
  actorReportType: document.querySelector('#actor-report-type'),
  actorReportId: document.querySelector('#actor-report-id'),
  actorReportName: document.querySelector('#actor-report-name'),
  actorReportLookback: document.querySelector('#actor-report-lookback'),
  actorEvidence: document.querySelector('#actor-evidence'),
  actorProvenance: document.querySelector('#actor-provenance'),
  actorObservations: document.querySelector('#actor-observations'),
  actorWarnings: document.querySelector('#actor-warnings'),
  actorRawIds: document.querySelector('#actor-raw-ids'),
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
  if (!windowBridge?.getState || !windowBridge?.setAlwaysOnTop) {
    throw new Error('Atlas window bridge is unavailable');
  }
}

async function init() {
  try {
    assertServiceBridge();
    setServiceState('Connecting');
    state.commands = await service.list();
    state.window = await windowBridge.getState();
    renderWindowState();
    setServiceState(`${state.commands.length} services`);
    bindEvents();
    await Promise.all([
      loadReadiness(),
      loadScopeDefaults(),
      loadQueueSelection(),
      loadWatchSchedule(),
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
  els.validateScope.addEventListener('click', validateScopeInput);
  els.refreshTasks.addEventListener('click', loadTasks);
  els.cancelTask.addEventListener('click', cancelSelectedTask);
  els.previewQueueSelection.addEventListener('click', loadQueueSelection);
  els.refreshWatchStatus.addEventListener('click', loadWatchSchedule);
  els.preflightManualDiscovery.addEventListener('click', preflightManualDiscovery);
  els.runManualDiscovery.addEventListener('click', runManualDiscovery);
  els.loadActorReport.addEventListener('click', loadActorReport);
  els.loadQueueReport.addEventListener('click', loadQueueReport);
  els.pinWindow.addEventListener('click', toggleAlwaysOnTop);
  els.minimizeWindow.addEventListener('click', () => windowBridge.minimize());
  els.closeWindow.addEventListener('click', () => windowBridge.close());
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

async function loadScopeDefaults() {
  state.scopeDefaults = await service.invoke('scope.defaults');
  renderRows(els.scopeDefaults, Object.entries(state.scopeDefaults).map(([key, value]) => [
    key,
    defaultSummary(value)
  ]));
}

async function validateScopeInput() {
  setBusy(els.validateScope, true);
  try {
    const payload = {
      kind: els.scopeKind.value,
      input: scopeInputPayload()
    };
    const result = await service.invoke('scope.validate', payload);
    renderRows(els.scopeValidation, [
      ['Kind', result.kind],
      ['Valid', result.valid ? 'yes' : 'no']
    ]);
    els.scopeNormalized.textContent = JSON.stringify(result.normalized, null, 2);
  } catch (error) {
    renderError(els.scopeValidation, error);
    els.scopeNormalized.textContent = `Scope validation failed: ${error.message}`;
  } finally {
    setBusy(els.validateScope, false);
  }
}

function scopeInputPayload() {
  const kind = els.scopeKind.value;
  if (kind === 'manual_discovery') {
    return cleanObject({
      scope: els.scopeDiscoveryType.value,
      entityType: els.scopeActorType.value,
      entityId: numberOrUndefined(els.scopeActorId.value),
      entityName: textOrUndefined(els.scopeActorName.value),
      centerSystemId: numberOrUndefined(els.scopeSystemId.value),
      centerSystemName: textOrUndefined(els.scopeSystemName.value),
      radiusJumps: numberOrUndefined(els.scopeRadius.value),
      lookbackSeconds: numberOrUndefined(els.scopeLookback.value),
      maxRefs: numberOrUndefined(els.scopeMaxRefs.value),
      maxRefsPerSystem: numberOrUndefined(els.scopeMaxRefs.value),
      maxSystems: numberOrUndefined(els.scopeMaxSystems.value)
    });
  }
  if (kind === 'manual_expansion') {
    return cleanObject({
      discoveredByType: textOrUndefined(els.scopeDiscoveredByType.value),
      discoveredById: textOrUndefined(els.scopeDiscoveredById.value),
      killmailIds: killmailIds(),
      maxExpansions: numberOrUndefined(els.scopeMaxExpansions.value)
    });
  }
  if (kind === 'actor_watch') {
    return cleanObject({
      entityType: els.scopeActorType.value,
      entityId: numberOrUndefined(els.scopeActorId.value),
      entityName: textOrUndefined(els.scopeActorName.value),
      lookbackSeconds: numberOrUndefined(els.scopeLookback.value),
      maxRefs: numberOrUndefined(els.scopeMaxRefs.value),
      maxExpansions: numberOrUndefined(els.scopeMaxExpansions.value)
    });
  }
  return cleanObject({
    centerSystemId: numberOrUndefined(els.scopeSystemId.value),
    centerSystemName: textOrUndefined(els.scopeSystemName.value),
    radiusJumps: numberOrUndefined(els.scopeRadius.value),
    lookbackSeconds: numberOrUndefined(els.scopeLookback.value),
    maxSystems: numberOrUndefined(els.scopeMaxSystems.value),
    maxRefsPerSystem: numberOrUndefined(els.scopeMaxRefs.value),
    maxExpansions: numberOrUndefined(els.scopeMaxExpansions.value)
  });
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

async function loadQueueSelection() {
  setBusy(els.previewQueueSelection, true);
  try {
    state.queueSelection = await service.invoke('queue.selection', queueSelectionPayload());
    renderQueueSelection(state.queueSelection);
  } catch (error) {
    renderError(els.queueSelectionSummary, error);
    els.queueRefList.textContent = 'Queue selection unavailable.';
  } finally {
    setBusy(els.previewQueueSelection, false);
  }
}

function queueSelectionPayload() {
  return cleanObject({
    discoveredByType: textOrUndefined(els.queueDiscoveredByType.value),
    discoveredById: textOrUndefined(els.queueDiscoveredById.value),
    mode: els.queueSelectionMode.value,
    maxExpansions: numberOrUndefined(els.queueMaxExpansions.value) || 2,
    killmailIds: parseIdList(els.queueKillmailIds.value)
  });
}

function renderQueueSelection(selection) {
  const counts = selection.counts || {};
  renderRows(els.queueSelectionSummary, [
    ['Classification', selection.classification || 'queue-selection-preview'],
    ['Boundary', selection.evidence_boundary || 'Queued refs are not evidence.'],
    ['Mode', selection.selection?.mode || 'next'],
    ['Candidates', counts.candidates_considered ?? 0],
    ['Selectable', counts.selectable ?? 0],
    ['Selected For Expansion', counts.selected_for_expansion ?? 0],
    ['Expected ESI Calls', counts.expected_esi_calls ?? 0],
    ['Pending', counts.pending ?? 0],
    ['Failed', counts.failed ?? 0],
    ['Cached', counts.cached ?? 0],
    ['Expanded', counts.expanded ?? 0],
    ['Superseded', counts.superseded ?? 0]
  ]);

  els.queueRefList.innerHTML = '';
  const refs = selection.refs || [];
  if (!refs.length) {
    els.queueRefList.textContent = 'No queued refs matched this preview scope.';
    return;
  }
  refs.forEach((ref) => {
    const row = document.createElement('article');
    row.className = `queue-ref ${ref.selected_for_expansion ? 'selected' : ''}`;
    row.innerHTML = [
      `<div><strong>${escapeHtml(ref.killmail_id)}</strong><span>${escapeHtml(ref.source?.label || ref.source?.id || ref.discovered_by_id || 'unknown source')}</span></div>`,
      `<div>${statusBadge(ref.status)}${ref.selected_for_expansion ? statusBadge('selected') : ''}${ref.skip_reason ? statusBadge(ref.skip_reason) : ''}</div>`,
      `<dl>${queuePreviewRows(ref).map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`
    ].join('');
    els.queueRefList.appendChild(row);
  });
}

function queuePreviewRows(ref) {
  const preview = ref.preview || {};
  return [
    ['Discovery Type', ref.discovered_by_type || 'unknown'],
    ['Discovered', ref.discovered_at || 'unknown'],
    ['Last Seen', ref.last_seen_at || 'unknown'],
    ['Killmail Time', preview.killmail_time || '[Resolve with ESI]'],
    ['Victim Ship Type', preview.victim_ship_type_id || '[Resolve with ESI]'],
    ['Attackers', preview.attacker_count ?? '[Resolve with ESI]'],
    ['zKill Value', preview.zkill_total_value ?? '[Resolve with ESI]']
  ];
}

async function loadWatchSchedule() {
  setBusy(els.refreshWatchStatus, true);
  try {
    state.watchSchedule = await service.invoke('watch.schedule', {
      sessionArmed: els.watchSessionArmed.checked,
      liveApiEnabled: els.watchLiveApiEnabled.checked
    });
    renderWatchSchedule(state.watchSchedule);
  } catch (error) {
    renderError(els.watchSummary, error);
    els.watchList.textContent = 'Watch schedule unavailable.';
  } finally {
    setBusy(els.refreshWatchStatus, false);
  }
}

function renderWatchSchedule(schedule) {
  renderRows(els.watchSummary, [
    ['Generated', schedule.now || 'unknown'],
    ['Session Armed', schedule.session_armed ? 'yes' : 'no'],
    ['Live API Enabled', schedule.live_api_enabled ? 'yes' : 'no'],
    ['Due Watches', schedule.due?.length ?? 0],
    ['Blocked Watches', schedule.blocked?.length ?? 0],
    ['Total Watches', schedule.watches?.length ?? 0]
  ]);

  els.watchList.innerHTML = '';
  const watches = schedule.watches || [];
  if (!watches.length) {
    els.watchList.textContent = 'No actor or system/radius watches are configured.';
    return;
  }
  watches.forEach((watch) => {
    const row = document.createElement('article');
    row.className = `watch-row ${watch.scheduler_state || 'unknown'}`;
    const reasons = watch.blocked_reasons?.length ? watch.blocked_reasons : ['ready'];
    row.innerHTML = [
      `<div><strong>${escapeHtml(watchSourceLabel(watch))}</strong><span>${escapeHtml(watch.scope_key || '')}</span></div>`,
      `<div>${statusBadge(watch.scheduler_state || 'unknown')}${reasons.map(statusBadge).join('')}</div>`,
      `<dl>${watchRows(watch).map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`
    ].join('');
    els.watchList.appendChild(row);
  });
}

function watchSourceLabel(watch) {
  const source = watch.source || {};
  if (watch.watch_type === 'actor') {
    const label = source.entity_name || '[Resolve with ESI]';
    return `${label} [${source.entity_type}: ${source.entity_id}]`;
  }
  return `${source.center_system_name || '[Resolve with ESI]'} [system: ${source.center_system_id}; radius ${source.radius_jumps}]`;
}

function watchRows(watch) {
  const source = watch.source || {};
  return [
    ['Watch Type', watch.watch_type || 'unknown'],
    ['Watch ID', watch.watch_id || 'unknown'],
    ['Next Poll', watch.next_poll_at || 'not scheduled'],
    ['Backoff Until', watch.backoff_until || 'none'],
    ['Poll Interval', watch.poll_interval_minutes ? `${watch.poll_interval_minutes} minutes` : 'unknown'],
    ['Last Polled', watch.last_polled_at || 'never'],
    ['Last Success', watch.last_success_at || 'none'],
    ['Last Error', watch.last_error_at || 'none'],
    ['Lookback', source.lookback_days ? `${source.lookback_days} days` : source.lookback_hours ? `${source.lookback_hours} hours` : 'unknown'],
    ['Run Cap', source.max_killmails_per_run || 'unknown'],
    ['System Cap', source.max_systems_per_run || 'n/a']
  ];
}

async function preflightManualDiscovery() {
  setBusy(els.preflightManualDiscovery, true);
  try {
    const result = await manualDiscoveryPreflight();
    renderManualDiscoveryPreflight(result);
  } catch (error) {
    renderError(els.manualDiscoveryPreflight, error);
    els.manualDiscoveryNormalized.textContent = `Manual discovery preflight failed: ${error.message}`;
  } finally {
    setBusy(els.preflightManualDiscovery, false);
  }
}

async function manualDiscoveryPreflight() {
  const validation = await service.invoke('scope.validate', {
    kind: 'manual_discovery',
    input: manualDiscoveryInput()
  });
  const gate = await service.invoke('live.gate', {
    action: 'manual.discovery',
    input: validation.normalized
  });
  return { validation, gate };
}

function manualDiscoveryInput() {
  const scope = els.actionDiscoveryScope.value;
  if (scope === 'actor') {
    return cleanObject({
      scope,
      entityType: els.actionActorType.value,
      entityId: numberOrUndefined(els.actionActorId.value),
      entityName: textOrUndefined(els.actionActorName.value),
      lookbackSeconds: numberOrUndefined(els.actionLookback.value),
      maxRefs: numberOrUndefined(els.actionMaxRefs.value)
    });
  }
  return cleanObject({
    scope,
    centerSystemId: numberOrUndefined(els.actionSystemId.value),
    radiusJumps: numberOrUndefined(els.actionRadius.value),
    lookbackSeconds: numberOrUndefined(els.actionLookback.value),
    maxSystems: numberOrUndefined(els.actionMaxSystems.value),
    maxRefsPerSystem: numberOrUndefined(els.actionMaxRefsPerSystem.value)
  });
}

function renderManualDiscoveryPreflight(result) {
  const { validation, gate } = result;
  renderRows(els.manualDiscoveryPreflight, [
    ['Scope Valid', validation.valid ? 'yes' : 'no'],
    ['Live Gate', gate.display?.label || gate.state || 'unknown'],
    ['Allowed', gate.allowed ? 'yes' : 'no'],
    ['Providers', gate.providers?.join(', ') || 'none'],
    ['Estimated zKill Calls', gate.estimated_api_calls?.zkill ?? 0],
    ['Estimated ESI Calls', gate.estimated_api_calls?.esi ?? 0],
    ['Expected Effect', 'Queue zKill refs only; zero ESI expansion'],
    ['Confirmation Required', gate.display?.requires_confirmation ? 'yes' : 'no']
  ]);
  els.manualDiscoveryNormalized.textContent = JSON.stringify({
    normalized: validation.normalized,
    live_gate: {
      state: gate.state,
      allowed: gate.allowed,
      blockers: gate.blockers || [],
      warnings: gate.warnings || []
    }
  }, null, 2);
}

async function runManualDiscovery() {
  setBusy(els.runManualDiscovery, true);
  try {
    if (!els.actionConfirmLive.checked) {
      throw new Error('Manual discovery requires the live zKill confirmation checkbox');
    }
    const preflight = await manualDiscoveryPreflight();
    renderManualDiscoveryPreflight(preflight);
    if (!preflight.gate.allowed) {
      throw new Error(preflight.gate.blockers?.[0]?.message || 'Manual discovery is blocked by live API gate');
    }
    const task = await service.invoke('manual.discovery', preflight.validation.normalized, {
      asTask: true,
      detachedTask: true
    });
    renderRows(els.manualDiscoveryTask, [
      ['Task ID', task.task_id],
      ['Status', task.status],
      ['Classification', task.classification],
      ['Scope', task.scope_key || 'manual.discovery']
    ]);
    state.selectedTaskId = task.task_id;
    await loadTasks();
    selectView('tasks');
  } catch (error) {
    renderError(els.manualDiscoveryTask, error);
  } finally {
    setBusy(els.runManualDiscovery, false);
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

async function loadActorReport() {
  setBusy(els.loadActorReport, true);
  try {
    const report = await service.invoke('report.actor', actorReportRequest());
    renderActorReport(report);
  } catch (error) {
    renderError(els.actorEvidence, error);
    els.reportOutput.textContent = `Actor report unavailable: ${error.message}`;
  } finally {
    setBusy(els.loadActorReport, false);
  }
}

function actorReportRequest() {
  const entityType = els.actorReportType.value;
  const entityId = Number(els.actorReportId.value);
  if (!Number.isInteger(entityId) || entityId <= 0) {
    throw new Error('Actor report requires a positive actor ID');
  }
  const entityName = els.actorReportName.value.trim();
  const lookbackSeconds = Number(els.actorReportLookback.value);
  const options = Number.isInteger(lookbackSeconds) && lookbackSeconds > 0
    ? { lookbackSeconds }
    : {};
  return {
    params: {
      entityType,
      entityId,
      entityName: entityName || undefined
    },
    options
  };
}

function renderActorReport(report) {
  els.reportOutput.textContent = report.text || 'No text export returned.';
  renderRows(els.actorEvidence, [
    ['Report Type', report.report_type || 'actor'],
    ['Mode', report.response_mode || 'unknown'],
    ['Sample Status', report.evidence_basis?.sample_status || 'unknown'],
    ['Evidence Window', report.scope?.evidence_window?.label || 'unknown'],
    ['Actor', actorLabel(report)],
    ['Killmails', report.evidence_basis?.evidence_range?.killmail_count ?? 0],
    ['Activity Events', report.evidence_basis?.evidence_range?.activity_event_count ?? 0],
    ['Source', report.evidence_basis?.source || 'unknown']
  ]);
  renderRows(els.actorProvenance, linesAsRows(report.collection_provenance?.lines || []));
  renderObservationSections(report.observations?.sections || []);
  renderWarnings(report.warnings || []);
  renderRawIds(report.raw_ids || {});
}

function actorLabel(report) {
  const actor = report.scope?.actor;
  if (!actor) {
    return 'unknown';
  }
  const label = actor.entity_name || '[Resolve with ESI]';
  return `${label} [${actor.entity_type}: ${actor.entity_id}]`;
}

function linesAsRows(lines) {
  return lines.map((line) => {
    const [label, ...rest] = String(line).split(':');
    return rest.length ? [label.trim(), rest.join(':').trim()] : ['Note', line];
  });
}

function renderObservationSections(sections) {
  els.actorObservations.innerHTML = '';
  if (!sections.length) {
    els.actorObservations.textContent = 'No observation sections returned.';
    return;
  }
  sections.forEach((section) => {
    const article = document.createElement('article');
    article.className = 'observation-section';
    article.innerHTML = `<h5>${escapeHtml(section.title || section.name)}</h5>`;
    if (!section.rows?.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'No rows in this evidence scope.';
      article.appendChild(empty);
    } else {
      article.appendChild(observationTable(section.columns || [], section.rows));
    }
    els.actorObservations.appendChild(article);
  });
}

function observationTable(columns, rows) {
  const table = document.createElement('table');
  table.className = 'observation-table';
  const thead = document.createElement('thead');
  const header = document.createElement('tr');
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column;
    header.appendChild(th);
  });
  thead.appendChild(header);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.slice(0, 20).forEach((row) => {
    const tr = document.createElement('tr');
    columns.forEach((column) => {
      const td = document.createElement('td');
      td.textContent = row.values?.[column] ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function renderWarnings(warnings) {
  els.actorWarnings.innerHTML = '';
  if (!warnings.length) {
    els.actorWarnings.textContent = 'No warnings returned.';
    return;
  }
  warnings.forEach((warning) => {
    const row = document.createElement('div');
    row.className = 'message warning';
    row.innerHTML = `<span>${escapeHtml(warning.code || 'WARNING')}</span><span>${escapeHtml(warning.message || '')}</span>`;
    els.actorWarnings.appendChild(row);
  });
}

function renderRawIds(rawIds) {
  renderRows(els.actorRawIds, Object.entries(rawIds).map(([key, values]) => [
    key,
    Array.isArray(values) && values.length ? values.join(', ') : 'none'
  ]));
}

function defaultSummary(value) {
  return Object.entries(value || {})
    .map(([key, item]) => `${key}: ${item}`)
    .join('; ');
}

function killmailIds() {
  return parseIdList(els.scopeKillmailIds.value);
}

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
      `<span>${escapeHtml(task.status || 'unknown')} - ${escapeHtml(task.classification || 'unknown')}</span>`,
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

function statusBadge(value) {
  const text = String(value || 'unknown');
  const css = text.replaceAll('_', '-').toLowerCase();
  return `<span class="status-badge ${escapeHtml(css)}">${escapeHtml(text)}</span>`;
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
    scopes: 'Scopes',
    tasks: 'Tasks',
    'queue-watch': 'Queue / Watches',
    actions: 'Actions',
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
