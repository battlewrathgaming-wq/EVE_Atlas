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
  actorReport: null,
  actorReportRequest: null,
  assessmentArtifacts: [],
  selectedAssessmentArtifact: null,
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
  queueConfirmExpansion: document.querySelector('#queue-confirm-expansion'),
  preflightManualExpansion: document.querySelector('#preflight-manual-expansion'),
  runManualExpansion: document.querySelector('#run-manual-expansion'),
  queueSelectionSummary: document.querySelector('#queue-selection-summary'),
  manualExpansionPreflight: document.querySelector('#manual-expansion-preflight'),
  manualExpansionNormalized: document.querySelector('#manual-expansion-normalized'),
  manualExpansionTask: document.querySelector('#manual-expansion-task'),
  queueRefList: document.querySelector('#queue-ref-list'),
  refreshWatchStatus: document.querySelector('#refresh-watch-status'),
  watchSessionArmed: document.querySelector('#watch-session-armed'),
  watchLiveApiEnabled: document.querySelector('#watch-live-api-enabled'),
  armWatchSession: document.querySelector('#arm-watch-session'),
  disarmWatchSession: document.querySelector('#disarm-watch-session'),
  watchSummary: document.querySelector('#watch-summary'),
  watchExecutorState: document.querySelector('#watch-executor-state'),
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
  reportStatus: document.querySelector('#report-status'),
  actorEvidence: document.querySelector('#actor-evidence'),
  actorProvenance: document.querySelector('#actor-provenance'),
  actorObservations: document.querySelector('#actor-observations'),
  actorWarnings: document.querySelector('#actor-warnings'),
  actorRawIds: document.querySelector('#actor-raw-ids'),
  metadataHydrationCandidates: document.querySelector('#metadata-hydration-candidates'),
  metadataHydrationConfirm: document.querySelector('#metadata-hydration-confirm'),
  preflightMetadataHydration: document.querySelector('#preflight-metadata-hydration'),
  runMetadataHydration: document.querySelector('#run-metadata-hydration'),
  metadataHydrationStatus: document.querySelector('#metadata-hydration-status'),
  metadataHydrationNormalized: document.querySelector('#metadata-hydration-normalized'),
  assessmentBoundary: document.querySelector('#assessment-boundary'),
  assessmentReason: document.querySelector('#assessment-reason'),
  assessmentSummary: document.querySelector('#assessment-summary'),
  assessmentInterestScore: document.querySelector('#assessment-interest-score'),
  assessmentPriorityScore: document.querySelector('#assessment-priority-score'),
  assessmentImpactScore: document.querySelector('#assessment-impact-score'),
  assessmentConfidence: document.querySelector('#assessment-confidence'),
  assessmentConfirm: document.querySelector('#assessment-confirm'),
  saveAssessmentArtifact: document.querySelector('#save-assessment-artifact'),
  refreshAssessmentArtifacts: document.querySelector('#refresh-assessment-artifacts'),
  assessmentContext: document.querySelector('#assessment-context'),
  assessmentStatus: document.querySelector('#assessment-status'),
  assessmentArtifactList: document.querySelector('#assessment-artifact-list'),
  assessmentArtifactDetail: document.querySelector('#assessment-artifact-detail'),
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
    renderReportEmptyState();
    renderMetadataHydrationContext();
    renderAssessmentContext();
    await Promise.all([
      loadReadiness(),
      loadScopeDefaults(),
      loadQueueSelection(),
      loadWatchSchedule(),
      loadWatchExecutorStatus(),
      loadTasks(),
      loadAssessmentArtifacts(),
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
  els.preflightManualExpansion.addEventListener('click', preflightManualExpansion);
  els.runManualExpansion.addEventListener('click', runManualExpansion);
  els.refreshWatchStatus.addEventListener('click', loadWatchSchedule);
  els.armWatchSession.addEventListener('click', armWatchSession);
  els.disarmWatchSession.addEventListener('click', disarmWatchSession);
  els.preflightManualDiscovery.addEventListener('click', preflightManualDiscovery);
  els.runManualDiscovery.addEventListener('click', runManualDiscovery);
  els.loadActorReport.addEventListener('click', loadActorReport);
  els.preflightMetadataHydration.addEventListener('click', preflightMetadataHydration);
  els.runMetadataHydration.addEventListener('click', runMetadataHydration);
  els.saveAssessmentArtifact.addEventListener('click', saveAssessmentArtifact);
  els.refreshAssessmentArtifacts.addEventListener('click', loadAssessmentArtifacts);
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

function manualExpansionInput() {
  return cleanObject({
    discoveredByType: textOrUndefined(els.queueDiscoveredByType.value),
    discoveredById: textOrUndefined(els.queueDiscoveredById.value),
    mode: els.queueSelectionMode.value,
    maxExpansions: numberOrUndefined(els.queueMaxExpansions.value) || 2,
    killmailIds: parseIdList(els.queueKillmailIds.value)
  });
}

async function manualExpansionPreflight() {
  const validation = await service.invoke('scope.validate', {
    kind: 'manual_expansion',
    input: manualExpansionInput()
  });
  const selection = await service.invoke('queue.selection', {
    ...manualExpansionInput(),
    ...validation.normalized
  });
  const gate = await service.invoke('live.gate', {
    action: 'manual.expansion',
    input: {
      ...validation.normalized,
      maxExpansions: selection.counts?.selected_for_expansion ?? validation.normalized.maxExpansions
    }
  });
  return { validation, selection, gate };
}

async function preflightManualExpansion() {
  setBusy(els.preflightManualExpansion, true);
  try {
    const result = await manualExpansionPreflight();
    state.queueSelection = result.selection;
    renderQueueSelection(result.selection);
    renderManualExpansionPreflight(result);
  } catch (error) {
    renderError(els.manualExpansionPreflight, error);
    els.manualExpansionNormalized.textContent = `Manual expansion preflight failed: ${error.message}`;
  } finally {
    setBusy(els.preflightManualExpansion, false);
  }
}

function renderManualExpansionPreflight(result) {
  const { validation, selection, gate } = result;
  const counts = selection.counts || {};
  renderRows(els.manualExpansionPreflight, [
    ['Scope Valid', validation.valid ? 'yes' : 'no'],
    ['Live Gate', gate.display?.label || gate.state || 'unknown'],
    ['Allowed', gate.allowed ? 'yes' : 'no'],
    ['Providers', gate.providers?.join(', ') || 'none'],
    ['Selected Killmail IDs', selectedKillmailIds(selection).join(', ') || 'none'],
    ['Expansion Cap', validation.normalized.maxExpansions ?? 0],
    ['Selected For Expansion', counts.selected_for_expansion ?? 0],
    ['Expected ESI Calls', counts.expected_esi_calls ?? gate.estimated_api_calls?.esi ?? 0],
    ['Pending Refs', counts.pending ?? 0],
    ['Cached Refs', counts.cached ?? 0],
    ['Evidence Boundary', 'ESI expansion creates stored killmail evidence from queued refs']
  ]);
  els.manualExpansionNormalized.textContent = JSON.stringify({
    normalized: validation.normalized,
    selected_killmail_ids: selectedKillmailIds(selection),
    live_gate: {
      state: gate.state,
      allowed: gate.allowed,
      blockers: gate.blockers || [],
      warnings: gate.warnings || []
    }
  }, null, 2);
}

function selectedKillmailIds(selection) {
  return (selection.refs || [])
    .filter((ref) => ref.selected_for_expansion)
    .map((ref) => ref.killmail_id);
}

async function runManualExpansion() {
  setBusy(els.runManualExpansion, true);
  try {
    if (!els.queueConfirmExpansion.checked) {
      throw new Error('Manual expansion requires the live ESI confirmation checkbox');
    }
    const preflight = await manualExpansionPreflight();
    state.queueSelection = preflight.selection;
    renderQueueSelection(preflight.selection);
    renderManualExpansionPreflight(preflight);
    if (!preflight.gate.allowed) {
      throw new Error(preflight.gate.blockers?.[0]?.message || 'Manual expansion is blocked by live API gate');
    }
    if (!selectedKillmailIds(preflight.selection).length) {
      throw new Error('Manual expansion requires at least one selected queued ref');
    }
    const task = await service.invoke('manual.expansion', {
      ...preflight.validation.normalized,
      killmailIds: selectedKillmailIds(preflight.selection)
    }, {
      asTask: true,
      detachedTask: true
    });
    renderRows(els.manualExpansionTask, [
      ['Task ID', task.task_id],
      ['Status', task.status],
      ['Classification', task.classification],
      ['Scope', task.scope_key || 'manual.expansion']
    ]);
    state.selectedTaskId = task.task_id;
    await loadTasks();
    selectView('tasks');
  } catch (error) {
    renderError(els.manualExpansionTask, error);
  } finally {
    setBusy(els.runManualExpansion, false);
  }
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

async function loadWatchExecutorStatus() {
  try {
    const status = await service.invoke('watch.executor.status');
    renderWatchExecutor(status);
  } catch (error) {
    renderError(els.watchExecutorState, error);
  }
}

async function armWatchSession() {
  setBusy(els.armWatchSession, true);
  try {
    const status = await service.invoke('watch.executor.arm', {
      liveApiEnabled: els.watchLiveApiEnabled.checked
    });
    els.watchSessionArmed.checked = status.session_armed === true;
    renderWatchExecutor(status);
    renderWatchSchedule(status.schedule);
    await loadTasks();
  } catch (error) {
    renderError(els.watchExecutorState, error);
  } finally {
    setBusy(els.armWatchSession, false);
  }
}

async function disarmWatchSession() {
  setBusy(els.disarmWatchSession, true);
  try {
    const status = await service.invoke('watch.executor.disarm', {
      reason: 'User disarmed watch session from renderer'
    });
    els.watchSessionArmed.checked = false;
    renderWatchExecutor(status);
    renderWatchSchedule(status.schedule);
  } catch (error) {
    renderError(els.watchExecutorState, error);
  } finally {
    setBusy(els.disarmWatchSession, false);
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

function renderWatchExecutor(status) {
  const tick = status.tick || null;
  renderRows(els.watchExecutorState, [
    ['Session Armed', status.session_armed ? 'yes' : 'no'],
    ['Active Task', status.active_task_id || 'none'],
    ['Poll Interval', status.poll_interval_ms ? `${status.poll_interval_ms} ms` : 'unknown'],
    ['Last Tick', status.last_tick || 'none'],
    ['Last Dispatch', status.last_dispatch?.task_id || 'none'],
    ['Last Blocked Reason', status.last_blocked_reason || 'none'],
    ['Latest Tick Status', tick?.status || 'none'],
    ['Latest Tick Reason', tick?.reason || 'none']
  ]);
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
    const request = actorReportRequest();
    const report = await service.invoke('report.actor', request);
    state.actorReportRequest = request;
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
  state.actorReport = report;
  renderReportStatus(report);
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
  renderMetadataHydrationContext();
  renderAssessmentContext();
}

function renderReportEmptyState() {
  els.reportStatus.className = 'callout report-status warning';
  els.reportStatus.innerHTML = [
    '<strong>No report loaded</strong>',
    '<span>Load an actor report to inspect stored evidence, observations, provenance, warnings, and raw IDs. Queue previews are not evidence.</span>'
  ].join('');
  renderRows(els.actorEvidence, [
    ['Evidence Basis', 'No actor report loaded.'],
    ['Boundary', 'Stored expanded ESI killmails become evidence; zKill refs are discovery context only.']
  ]);
  renderRows(els.actorProvenance, [
    ['Collection Provenance', 'No loaded report context.']
  ]);
  els.actorObservations.textContent = 'Load a report to view observation sections derived from stored activity events.';
  els.actorWarnings.textContent = 'No report warnings loaded.';
  renderRows(els.actorRawIds, [
    ['Raw IDs', 'No report loaded.']
  ]);
  els.reportOutput.textContent = 'No report loaded.';
}

function renderReportStatus(report) {
  const counts = report.evidence_basis?.evidence_range || {};
  const status = String(report.evidence_basis?.sample_status || 'unknown');
  const kind = status.includes('PARTIAL') || status.includes('NO ') ? 'warning' : 'ready';
  els.reportStatus.className = `callout report-status ${kind}`;
  els.reportStatus.innerHTML = [
    `<strong>${escapeHtml(status)}</strong>`,
    `<span>${escapeHtml(actorLabel(report))} - ${escapeHtml(report.scope?.evidence_window?.label || 'unknown window')} - ${escapeHtml(counts.killmail_count ?? 0)} killmails / ${escapeHtml(counts.activity_event_count ?? 0)} activity events. Observations are scoped presentations of stored evidence, not assessment.</span>`
  ].join('');
}

function renderAssessmentContext() {
  const report = state.actorReport;
  if (!report) {
    renderRows(els.assessmentContext, [
      ['Context', 'Load an actor report before saving assessment memory.'],
      ['Boundary', 'Assessment artifacts are memory, not raw evidence.']
    ]);
    return;
  }
  const actor = report.scope?.actor || {};
  const counts = report.evidence_basis?.evidence_range || {};
  renderRows(els.assessmentContext, [
    ['Actor', actorLabel(report)],
    ['Evidence Window', report.scope?.evidence_window?.label || 'unknown'],
    ['Sample Status', report.evidence_basis?.sample_status || 'unknown'],
    ['Killmails', counts.killmail_count ?? 0],
    ['Activity Events', counts.activity_event_count ?? 0],
    ['Boundary', 'This records assessment memory over the loaded report context; it does not change evidence.']
  ]);
}

function renderMetadataHydrationContext() {
  const ids = metadataHydrationCandidateIds();
  if (!state.actorReport) {
    renderRows(els.metadataHydrationCandidates, [
      ['Context', 'Load an actor report before previewing hydration.'],
      ['Boundary', 'Hydration patches cached labels only.']
    ]);
    els.metadataHydrationNormalized.textContent = 'Load an actor report to preview hydration candidates.';
    return;
  }
  renderRows(els.metadataHydrationCandidates, [
    ['Actor', actorLabel(state.actorReport)],
    ['Candidate Entity IDs', ids.length ? ids.join(', ') : 'none'],
    ['Expected ESI Name Calls', ids.length ? '1' : '0'],
    ['Static Type IDs', (state.actorReport.raw_ids?.type_ids || []).length ? 'Use local SDE metadata, not live ESI.' : 'none in report'],
    ['Boundary', 'Metadata hydration improves readability only; evidence IDs and raw killmails are unchanged.']
  ]);
  els.metadataHydrationNormalized.textContent = JSON.stringify({
    target: 'actor',
    actor: state.actorReport.scope?.actor || null,
    candidate_entity_ids: ids,
    excluded_type_ids: state.actorReport.raw_ids?.type_ids || [],
    expected_esi_name_calls: ids.length ? 1 : 0
  }, null, 2);
}

function metadataHydrationCandidateIds() {
  const rawIds = state.actorReport?.raw_ids || {};
  return [...new Set([
    ...(rawIds.character_ids || []),
    ...(rawIds.corporation_ids || []),
    ...(rawIds.alliance_ids || [])
  ].map(Number).filter((value) => Number.isInteger(value) && value > 0))]
    .sort((a, b) => a - b);
}

async function metadataHydrationPreflight() {
  if (!state.actorReport) {
    throw new Error('Load an actor report before metadata hydration');
  }
  const ids = metadataHydrationCandidateIds();
  const gate = await service.invoke('live.gate', {
    action: 'metadata.hydration',
    input: {
      idsToRequest: ids.length
    }
  });
  return { ids, gate, payload: metadataHydrationPayload() };
}

async function preflightMetadataHydration() {
  setBusy(els.preflightMetadataHydration, true);
  try {
    const result = await metadataHydrationPreflight();
    renderMetadataHydrationPreflight(result);
  } catch (error) {
    renderError(els.metadataHydrationStatus, error);
  } finally {
    setBusy(els.preflightMetadataHydration, false);
  }
}

function renderMetadataHydrationPreflight(result) {
  renderRows(els.metadataHydrationStatus, [
    ['Live Gate', result.gate.display?.label || result.gate.state || 'unknown'],
    ['Allowed', result.gate.allowed ? 'yes' : 'no'],
    ['Providers', result.gate.providers?.join(', ') || 'none'],
    ['Candidate Entity IDs', result.ids.length],
    ['Expected ESI Name Calls', result.gate.estimated_api_calls?.esi ?? 0],
    ['Evidence Effect', 'none; labels/readability only']
  ]);
  els.metadataHydrationNormalized.textContent = JSON.stringify({
    payload: result.payload,
    candidate_entity_ids: result.ids,
    live_gate: {
      state: result.gate.state,
      allowed: result.gate.allowed,
      blockers: result.gate.blockers || [],
      warnings: result.gate.warnings || []
    },
    excluded_type_ids: state.actorReport?.raw_ids?.type_ids || []
  }, null, 2);
}

async function runMetadataHydration() {
  setBusy(els.runMetadataHydration, true);
  try {
    if (!els.metadataHydrationConfirm.checked) {
      throw new Error('Metadata hydration requires the readability-only confirmation checkbox');
    }
    const preflight = await metadataHydrationPreflight();
    renderMetadataHydrationPreflight(preflight);
    if (!preflight.gate.allowed) {
      throw new Error(preflight.gate.blockers?.[0]?.message || 'Metadata hydration is blocked by live API gate');
    }
    const task = await service.invoke('metadata.hydration', preflight.payload, {
      asTask: true
    });
    renderRows(els.metadataHydrationStatus, [
      ['Task ID', task.task_id],
      ['Status', task.status],
      ['Classification', task.classification],
      ['Evidence Effect', 'none; metadata labels only']
    ]);
    state.selectedTaskId = task.task_id;
    await loadTasks();
    await loadActorReport();
    els.metadataHydrationConfirm.checked = false;
  } catch (error) {
    renderError(els.metadataHydrationStatus, error);
  } finally {
    setBusy(els.runMetadataHydration, false);
  }
}

function metadataHydrationPayload() {
  const actor = state.actorReport?.scope?.actor || {};
  return cleanObject({
    target: 'actor',
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
}

async function saveAssessmentArtifact() {
  setBusy(els.saveAssessmentArtifact, true);
  try {
    if (!state.actorReport) {
      throw new Error('Load an actor report before saving assessment memory');
    }
    if (!els.assessmentConfirm.checked) {
      throw new Error('Assessment save requires the boundary confirmation checkbox');
    }
    const payload = assessmentArtifactPayload();
    const artifact = await service.invoke('assessment.create', payload);
    renderRows(els.assessmentStatus, [
      ['Saved Artifact', artifact.artifact_id],
      ['Entity', artifact.entity_name ? `${artifact.entity_name} [${artifact.entity_type}: ${artifact.entity_id}]` : `${artifact.entity_type}:${artifact.entity_id}`],
      ['Boundary', artifact.boundary || 'assessment artifacts are assessment memory, not evidence']
    ]);
    clearAssessmentInputs();
    await loadAssessmentArtifacts();
    await loadAssessmentArtifactDetail(artifact.artifact_id);
  } catch (error) {
    renderError(els.assessmentStatus, error);
  } finally {
    setBusy(els.saveAssessmentArtifact, false);
  }
}

function assessmentArtifactPayload() {
  const report = state.actorReport;
  const actor = report.scope?.actor || {};
  const assessmentReason = els.assessmentReason.value.trim();
  const assessmentSummary = els.assessmentSummary.value.trim();
  const scores = {
    interestScore: numberOrUndefined(els.assessmentInterestScore.value),
    priorityScore: numberOrUndefined(els.assessmentPriorityScore.value),
    impactScore: numberOrUndefined(els.assessmentImpactScore.value),
    confidence: numberOrUndefined(els.assessmentConfidence.value)
  };
  const hasScore = Object.values(scores).some((value) => value !== undefined);
  if (!assessmentReason && !assessmentSummary) {
    throw new Error('Assessment requires a reason or summary');
  }
  if (hasScore && !assessmentReason) {
    throw new Error('Score fields require an assessment reason');
  }
  return cleanObject({
    artifactType: 'entity_interest',
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name,
    interestScore: scores.interestScore,
    priorityScore: scores.priorityScore,
    impactScore: scores.impactScore,
    confidence: scores.confidence,
    assessmentReason,
    assessmentSummary,
    evidenceWindowStart: report.scope?.evidence_window?.start || report.evidence_basis?.evidence_range?.earliest,
    evidenceWindowEnd: report.scope?.evidence_window?.end || report.evidence_basis?.evidence_range?.latest,
    evidenceScopeType: 'actor',
    evidenceScope: report.scope,
    sourceReportType: 'actor',
    sourceReportParameters: state.actorReportRequest,
    sourceRunIds: report.collection_provenance?.collection?.run_ids || [],
    sampleKillmailIds: report.raw_ids?.killmail_ids || [],
    appearanceCount: report.evidence_basis?.evidence_range?.activity_event_count ?? 0,
    attackerAppearanceCount: roleCount(report, 'attacker'),
    victimAppearanceCount: roleCount(report, 'victim'),
    systemsObserved: observedRows(report, 'Observed Systems'),
    regionsObserved: uniqueObservedValues(observedRows(report, 'Observed Systems'), 'Region'),
    shipsObserved: observedRows(report, 'Observed Ships'),
    assessedBy: 'local-operator'
  });
}

function roleCount(report, role) {
  const section = observationSectionByTitle(report, 'Actor Role Split');
  const row = (section?.rows || []).find((entry) => String(entry.values?.Role || '').toLowerCase() === role);
  return Number(row?.values?.Events) || 0;
}

function observedRows(report, title) {
  const section = observationSectionByTitle(report, title);
  return (section?.rows || []).slice(0, 12).map((row) => row.values || row.raw || row);
}

function uniqueObservedValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))];
}

function observationSectionByTitle(report, title) {
  return (report.observations?.sections || []).find((section) => section.title === title || section.name === title);
}

function clearAssessmentInputs() {
  els.assessmentReason.value = '';
  els.assessmentSummary.value = '';
  els.assessmentInterestScore.value = '';
  els.assessmentPriorityScore.value = '';
  els.assessmentImpactScore.value = '';
  els.assessmentConfidence.value = '';
  els.assessmentConfirm.checked = false;
}

async function loadAssessmentArtifacts() {
  setBusy(els.refreshAssessmentArtifacts, true);
  try {
    const filter = state.actorReport?.scope?.actor
      ? {
        entityType: state.actorReport.scope.actor.entity_type,
        entityId: state.actorReport.scope.actor.entity_id,
        limit: 12
      }
      : { limit: 12 };
    const result = await service.invoke('assessment.list', filter);
    state.assessmentArtifacts = result.artifacts || [];
    renderAssessmentArtifacts();
  } catch (error) {
    renderError(els.assessmentArtifactList, error);
  } finally {
    setBusy(els.refreshAssessmentArtifacts, false);
  }
}

function renderAssessmentArtifacts() {
  els.assessmentArtifactList.innerHTML = '';
  if (!state.assessmentArtifacts.length) {
    els.assessmentArtifactList.textContent = 'No assessment artifacts saved for the current view.';
    renderRows(els.assessmentArtifactDetail, [
      ['Detail', 'Select a saved assessment artifact to inspect it.'],
      ['Boundary', 'Assessment memory is separate from evidence.']
    ]);
    return;
  }
  state.assessmentArtifacts.forEach((artifact) => {
    const item = document.createElement('button');
    item.className = `task-item ${artifact.status || 'active'}`;
    item.type = 'button';
    item.innerHTML = [
      `<strong>${escapeHtml(artifactLabel(artifact))}</strong>`,
      `<span>${escapeHtml(artifact.artifact_type)} - ${escapeHtml(artifact.status)}</span>`,
      `<small>${escapeHtml(artifact.updated_at || artifact.created_at || 'unknown time')}</small>`
    ].join('');
    item.addEventListener('click', () => loadAssessmentArtifactDetail(artifact.artifact_id));
    els.assessmentArtifactList.appendChild(item);
  });
}

async function loadAssessmentArtifactDetail(artifactId) {
  try {
    const artifact = await service.invoke('assessment.get', { artifactId });
    state.selectedAssessmentArtifact = artifact;
    renderRows(els.assessmentArtifactDetail, [
      ['Artifact ID', artifact.artifact_id],
      ['Entity', artifactLabel(artifact)],
      ['Status', artifact.status],
      ['Reason', artifact.assessment_reason || 'none'],
      ['Summary', artifact.assessment_summary || 'none'],
      ['Scores', scoreSummary(artifact.scores)],
      ['Evidence Window', `${artifact.evidence_window?.start || 'unknown'} -> ${artifact.evidence_window?.end || 'unknown'}`],
      ['Sample Killmails', artifact.sample_killmail_ids?.length ?? 0],
      ['Appearances', artifact.counts?.appearances ?? 0],
      ['Boundary', artifact.boundary || 'assessment artifacts are assessment memory, not evidence'],
      ['Updated', artifact.updated_at || 'unknown']
    ]);
  } catch (error) {
    renderError(els.assessmentArtifactDetail, error);
  }
}

function artifactLabel(artifact) {
  const label = artifact.entity_name || '[Resolve with ESI]';
  return `${label} [${artifact.entity_type}: ${artifact.entity_id}]`;
}

function scoreSummary(scores = {}) {
  return [
    ['interest', scores.interest],
    ['priority', scores.priority],
    ['impact', scores.impact],
    ['confidence', scores.confidence]
  ].filter(([, value]) => value !== null && value !== undefined)
    .map(([label, value]) => `${label}: ${value}`)
    .join('; ') || 'none';
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
    const rowCount = section.rows?.length || 0;
    article.innerHTML = `<h5>${escapeHtml(section.title || section.name)} <span>${escapeHtml(rowCount)} rows</span></h5>`;
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
