// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


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
