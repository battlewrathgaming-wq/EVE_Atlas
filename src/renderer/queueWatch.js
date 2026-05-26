// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


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
    els.manualExpansionNormalized.textContent = `Enrich selected preflight failed: ${error.message}`;
  } finally {
    setBusy(els.preflightManualExpansion, false);
  }
}

function renderManualExpansionPreflight(result) {
  const { validation, selection, gate } = result;
  const counts = selection.counts || {};
  const selectedIds = selectedKillmailIds(selection);
  renderRows(els.manualExpansionPreflight, [
    ['Scope Valid', validation.valid ? 'yes' : 'no'],
    ['Provider', 'ESI killmail expansion through the manual.expansion service'],
    ['Live Gate', gate.display?.label || gate.state || 'unknown'],
    ['Allowed', gate.allowed ? 'yes' : 'no'],
    ['Providers', gate.providers?.join(', ') || 'none'],
    ['Selected Refs', selectedIds.join(', ') || 'none'],
    ['Expansion Cap', validation.normalized.maxExpansions ?? 0],
    ['Selected For Enrich Selected', counts.selected_for_expansion ?? 0],
    ['Expected ESI Calls', counts.expected_esi_calls ?? gate.estimated_api_calls?.esi ?? 0],
    ['Expected Writes', `${counts.selected_for_expansion ?? 0} expanded killmail evidence row(s) plus normalized activity events when ESI succeeds`],
    ['Pending Refs', counts.pending ?? 0],
    ['Cached Refs', counts.cached ?? 0],
    ['Discovery Boundary', 'Queued refs are possible leads, not evidence or observations'],
    ['Evidence Effect', 'Enrich selected explicitly calls ESI and stores expanded killmail evidence from selected queued refs'],
    ['Metadata Hydration', 'Readability-only label hydration is separate from evidence enrichment']
  ]);
  els.manualExpansionNormalized.textContent = JSON.stringify({
    normalized: validation.normalized,
    selected_killmail_ids: selectedIds,
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
      throw new Error('Enrich selected requires the live ESI confirmation checkbox');
    }
    const preflight = await manualExpansionPreflight();
    state.queueSelection = preflight.selection;
    renderQueueSelection(preflight.selection);
    renderManualExpansionPreflight(preflight);
    if (!preflight.gate.allowed) {
      throw new Error(preflight.gate.blockers?.[0]?.message || 'Manual expansion is blocked by live API gate');
    }
    if (!selectedKillmailIds(preflight.selection).length) {
      throw new Error('Enrich selected requires at least one selected queued ref');
    }
    const task = await service.invoke('manual.expansion', {
      ...preflight.validation.normalized,
      killmailIds: selectedKillmailIds(preflight.selection),
      confirmation: 'confirm:manual.expansion'
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
  renderOverviewStatus(state.readiness, externalApiStatus(state.readiness));
  if (els.overviewPossibleLeadsStatus) {
    els.overviewPossibleLeadsStatus.textContent = `${counts.candidates_considered ?? 0} queued possible lead(s) in the current queue preview. Discovery output is not Evidence.`;
  }
  renderRows(els.queueSelectionSummary, [
    ['Classification', selection.classification || 'queue-selection-preview'],
    ['Boundary', selection.evidence_boundary || 'Queued refs are not evidence.'],
    ['Mode', selection.selection?.mode || 'next'],
    ['Candidates', counts.candidates_considered ?? 0],
    ['Selectable', counts.selectable ?? 0],
    ['Selected For Enrich Selected', counts.selected_for_expansion ?? 0],
    ['Expected ESI Calls', counts.expected_esi_calls ?? 0],
    ['Evidence Effect', 'none yet; Enrich selected must be confirmed before ESI expansion writes evidence'],
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
  try {
    await service.invoke('watch.list');
    state.watchSchedule = await service.invoke('watch.schedule', {
      sessionArmed: els.watchSessionArmed.checked,
      liveApiEnabled: els.watchLiveApiEnabled.checked
    });
    renderWatchSchedule(state.watchSchedule);
  } catch (error) {
    renderError(els.watchSummary, error);
    els.watchList.textContent = 'Watch schedule unavailable.';
  }
}

async function loadWatchOfflineReadout() {
  try {
    state.watchOfflineReadout = await service.invoke('watch.offline_readout');
    renderRScanner(state.watchOfflineReadout);
  } catch (error) {
    renderError(els.rScannerWatchOfflineDetail, error);
    els.rScannerState.textContent = 'R-Scanner readout unavailable';
    els.rScannerSummary.textContent = 'The renderer could not read Watch_offline. No provider work was started.';
  }
}

async function loadWatchStatus() {
  setBusy(els.refreshWatchStatus, true);
  try {
    await Promise.all([
      loadWatchSchedule(),
      loadWatchOfflineReadout(),
      loadWatchExecutorStatus()
    ]);
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
      confirmation: 'confirm:watch.executor.arm',
      liveApiEnabled: els.watchLiveApiEnabled.checked
    });
    els.watchSessionArmed.checked = status.session_armed === true;
    renderWatchExecutor(status);
    renderWatchSchedule(status.schedule);
    await loadWatchOfflineReadout();
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
    await loadWatchOfflineReadout();
  } catch (error) {
    renderError(els.watchExecutorState, error);
  } finally {
    setBusy(els.disarmWatchSession, false);
  }
}

async function saveActorWatch() {
  setBusy(els.saveActorWatch, true);
  try {
    const validation = await service.invoke('scope.validate', {
      kind: 'actor_watch',
      input: actorWatchAuthoringInput()
    });
    const result = await service.invoke('watch.create', {
      ...validation.normalized,
      confirmation: 'confirm:watch.create',
      pollIntervalMinutes: numberOrUndefined(els.watchAuthorActorPoll.value),
      notes: textOrUndefined(els.watchAuthorActorNotes.value)
    }, {
      asTask: true
    });
    renderRows(els.watchAuthoringStatus, [
      ['Action', 'actor watch saved'],
      ['Task ID', result.task_id],
      ['Classification', result.classification],
      ['Evidence Effect', 'none; watch authoring is metadata-only']
    ]);
    await loadTasks();
    await loadWatchStatus();
  } catch (error) {
    renderError(els.watchAuthoringStatus, error);
  } finally {
    setBusy(els.saveActorWatch, false);
  }
}

async function saveSystemWatch() {
  setBusy(els.saveSystemWatch, true);
  try {
    const validation = await service.invoke('scope.validate', {
      kind: 'system_radius_watch',
      input: systemWatchAuthoringInput()
    });
    const result = await service.invoke('watch.create', {
      watchType: 'system_radius',
      ...validation.normalized,
      confirmation: 'confirm:watch.create',
      pollIntervalMinutes: numberOrUndefined(els.watchAuthorSystemPoll.value),
      notes: textOrUndefined(els.watchAuthorSystemNotes.value)
    }, {
      asTask: true
    });
    renderRows(els.watchAuthoringStatus, [
      ['Action', 'system/radius watch saved'],
      ['Task ID', result.task_id],
      ['Classification', result.classification],
      ['Evidence Effect', 'none; watch authoring is metadata-only']
    ]);
    await loadTasks();
    await loadWatchStatus();
  } catch (error) {
    renderError(els.watchAuthoringStatus, error);
  } finally {
    setBusy(els.saveSystemWatch, false);
  }
}

function actorWatchAuthoringInput() {
  return cleanObject({
    entityType: els.watchAuthorActorType.value,
    entityId: numberOrUndefined(els.watchAuthorActorId.value),
    entityName: textOrUndefined(els.watchAuthorActorName.value),
    lookbackSeconds: numberOrUndefined(els.watchAuthorActorLookback.value),
    maxRefs: numberOrUndefined(els.watchAuthorActorExpansions.value),
    maxExpansions: numberOrUndefined(els.watchAuthorActorExpansions.value)
  });
}

function systemWatchAuthoringInput() {
  return cleanObject({
    centerSystemId: numberOrUndefined(els.watchAuthorSystemId.value),
    radiusJumps: numberOrUndefined(els.watchAuthorRadius.value),
    lookbackSeconds: numberOrUndefined(els.watchAuthorSystemLookback.value),
    maxSystems: numberOrUndefined(els.watchAuthorMaxSystems.value),
    maxRefsPerSystem: 1,
    maxExpansions: numberOrUndefined(els.watchAuthorSystemExpansions.value)
  });
}

function renderWatchSchedule(schedule) {
  renderOverviewStatus(state.readiness, externalApiStatus(state.readiness));
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

function renderRScanner(readout) {
  const watches = readout?.watches || [];
  const summary = rScannerSummaryForReadout(readout);
  els.rScannerFaceState.textContent = summary.faceState;
  els.rScannerState.textContent = summary.title;
  els.rScannerSummary.textContent = summary.message;
  els.rScannerSignals.innerHTML = '';
  summary.signals.forEach((signal) => {
    const item = document.createElement('div');
    item.className = `r-scanner-signal ${signal.tone}`;
    item.innerHTML = `<strong>${escapeHtml(signal.label)}</strong><span>${escapeHtml(signal.value)}</span>`;
    els.rScannerSignals.appendChild(item);
  });
  renderRows(els.rScannerWatchOfflineDetail, [
    ['Source Model', readout?.model || 'Watch_offline'],
    ['Presentation', 'R-Scanner / R-scan labels only; not source or bridge terms'],
    ['Session', readout?.session_armed ? 'armed' : 'disarmed/offline'],
    ['Collection', readout?.collection_active ? 'active task reported' : 'no active collection'],
    ['Configured Watches', readout?.summary?.configured_watches ?? watches.length],
    ['Eligible If Armed', readout?.summary?.eligible_if_armed ?? 0],
    ['Next Safe Action', summary.primaryActionLabel],
    ['Boundary', 'Reading this panel does not discover, enrich, hydrate, assess, mutate Discovery refs, write Evidence/EVEidence, or run Watch execution']
  ]);
}

function rScannerSummaryForReadout(readout = {}) {
  const watches = readout.watches || [];
  const actions = watches.map((watch) => watch.next_safe_action || watch.recovery?.next_safe_action).filter(Boolean);
  const pendingRefs = sumWatches(watches, (watch) => watch.recovery?.pending_refs_count || 0);
  const providerDeferred = countWatches(watches, (watch) => watch.recovery?.provider_deferral?.present === true);
  const missedSlots = countWatches(watches, (watch) => watch.recovery?.missed_slot?.present === true);
  const orphanedRuns = countWatches(watches, (watch) => watch.recovery?.orphaned_run?.present === true);
  const missingScope = countWatches(watches, (watch) => watch.recovery?.reconstructed_scope?.scope_status === 'not_stored');
  const malformedScope = countWatches(watches, (watch) => watch.recovery?.reconstructed_scope?.scope_status === 'malformed');
  const primaryAction = priorityAction(actions);
  const signals = [
    {
      label: 'Discovery refs',
      value: pendingRefs ? `${pendingRefs} local possible lead(s) waiting before fresh Discovery` : 'No pending local Discovery refs in readout',
      tone: pendingRefs ? 'attention' : 'quiet'
    },
    {
      label: 'Provider state',
      value: providerDeferred ? `${providerDeferred} Watch readout(s) waiting on provider capacity` : 'No provider deferral reported',
      tone: providerDeferred ? 'waiting' : 'quiet'
    },
    {
      label: 'Timer recovery',
      value: missedSlots ? `${missedSlots} missed slot signal(s) recoverable when capacity allows` : 'No missed-slot recovery signal',
      tone: missedSlots ? 'attention' : 'quiet'
    },
    {
      label: 'Review signal',
      value: orphanedRuns ? `${orphanedRuns} orphaned run(s) need review` : 'No orphaned run signal',
      tone: orphanedRuns ? 'review' : 'quiet'
    },
    {
      label: 'Radius scope',
      value: scopeSignalText(missingScope, malformedScope),
      tone: missingScope || malformedScope ? 'limited' : 'quiet'
    }
  ];
  if (!watches.length) {
    signals.unshift({
      label: 'Configured Watch',
      value: 'No Watch_offline rows are configured yet',
      tone: 'quiet'
    });
  }
  const active = readout.collection_active === true;
  const armed = readout.session_armed === true;
  return {
    title: active ? 'R-Scanner reports active collection' : armed ? 'R-Scanner armed state visible' : 'R-Scanner powered down / offline',
    faceState: active ? 'Active' : armed ? 'Armed' : 'Powered down',
    message: active
      ? 'A Watch executor task is active. This display is still read-only and does not start additional work.'
      : armed
        ? 'Atlas has an armed Watch session. R-Scanner remains a presentation layer over Watch_offline state.'
        : 'Atlas is intentionally disarmed/offline after restart. The scanner face is static: no background surveillance, active checking, or live coverage is implied.',
    primaryAction,
    primaryActionLabel: rScannerActionLabel(primaryAction),
    signals
  };
}

function priorityAction(actions) {
  const priority = [
    'review_orphan',
    'wait',
    'drain_pending_refs',
    'recover_missed_slot_when_capacity_allows',
    'arm_required',
    'ready_for_discovery',
    'complete_enough_alpha'
  ];
  return priority.find((action) => actions.includes(action)) || 'complete_enough_alpha';
}

function rScannerActionLabel(action) {
  return {
    arm_required: 'R-scan unavailable: arm Watch session before routine checking',
    wait: 'Wait: schedule, gate, or provider capacity is holding safely',
    drain_pending_refs: 'Review local Discovery refs before fresh zKill Discovery',
    ready_for_discovery: 'Ready only after explicit operator-controlled Watch action',
    review_orphan: 'Review orphaned run before moving on',
    recover_missed_slot_when_capacity_allows: 'Recover missed slot when capacity allows',
    complete_enough_alpha: 'No immediate recovery action from this readout'
  }[action] || 'No immediate recovery action from this readout';
}

function scopeSignalText(missingScope, malformedScope) {
  if (malformedScope) {
    return `${malformedScope} malformed radius scope(s); do not draw exact coverage`;
  }
  if (missingScope) {
    return `${missingScope} radius scope(s) missing stored included systems; center-system fallback only`;
  }
  return 'Stored radius scope is valid where radius watches appear';
}

function countWatches(watches, predicate) {
  return watches.filter(predicate).length;
}

function sumWatches(watches, getter) {
  return watches.reduce((sum, watch) => sum + Number(getter(watch) || 0), 0);
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
