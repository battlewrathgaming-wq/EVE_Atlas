// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


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
    centerSystemName: textOrUndefined(els.actionSystemName.value),
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
    ['Discovery Boundary', 'Queued refs and preview values are not observations until ESI expansion succeeds'],
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
    const task = await service.invoke('manual.discovery', {
      ...preflight.validation.normalized,
      confirmation: 'confirm:manual.discovery'
    }, {
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
