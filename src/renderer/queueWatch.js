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
