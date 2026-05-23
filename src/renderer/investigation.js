// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


function bindInvestigationEvents() {
  els.investigationCheckScope.addEventListener('click', () => {
    applyInvestigationLeadToScopes();
    selectView('scopes');
  });
  els.investigationDiscoverLeads.addEventListener('click', () => {
    applyInvestigationLeadToActions();
    selectView('actions');
  });
  els.investigationReviewQueue.addEventListener('click', () => selectView('queue-watch'));
  els.investigationOpenReports.addEventListener('click', () => {
    applyInvestigationLeadToReports();
    selectView('reports');
  });
  els.investigationOpenReadiness.addEventListener('click', () => selectView('readiness'));
  els.investigationOpenTasks.addEventListener('click', () => selectView('tasks'));
  els.investigationOpenActions.addEventListener('click', () => selectView('actions'));
  els.investigationOpenQueueDetail.addEventListener('click', () => selectView('queue-watch'));
}

function renderInvestigationContext(readiness) {
  if (!els.investigationLiveContext) {
    return;
  }
  renderRows(els.investigationLiveContext, [
    ['Live API', `${readiness?.live_api?.state || 'unknown'}; ${readiness?.live_api?.rule || 'explicit gate required'}`],
    ['zKill Discovery', readiness?.live_api?.enabled ? 'available after explicit action confirmation' : 'blocked until live API is enabled'],
    ['ESI Enrichment', readiness?.live_api?.enabled ? 'available after explicit selected expansion confirmation' : 'blocked until live API is enabled'],
    ['Startup Effect', 'passive inspection only; no discovery, evidence, hydration, assessment, or watch execution']
  ]);
}

function applyInvestigationLeadToScopes() {
  const lead = investigationLead();
  if (lead.type === 'actor') {
    els.scopeKind.value = 'manual_discovery';
    els.scopeDiscoveryType.value = 'actor';
    if (Number.isInteger(lead.numericValue)) {
      els.scopeActorId.value = String(lead.numericValue);
    } else {
      els.scopeActorName.value = lead.value;
    }
    return;
  }
  els.scopeKind.value = lead.type === 'radius' ? 'system_radius_watch' : 'manual_discovery';
  els.scopeDiscoveryType.value = lead.type;
  if (Number.isInteger(lead.numericValue)) {
    els.scopeSystemId.value = String(lead.numericValue);
  } else {
    els.scopeSystemName.value = lead.value;
  }
  els.scopeRadius.value = String(lead.radius);
}

function applyInvestigationLeadToActions() {
  const lead = investigationLead();
  els.actionDiscoveryScope.value = lead.type;
  if (lead.type === 'actor') {
    if (Number.isInteger(lead.numericValue)) {
      els.actionActorId.value = String(lead.numericValue);
    } else {
      els.actionActorName.value = lead.value;
    }
    return;
  }
  if (Number.isInteger(lead.numericValue)) {
    els.actionSystemId.value = String(lead.numericValue);
  } else {
    els.actionSystemName.value = lead.value;
  }
  els.actionRadius.value = String(lead.radius);
}

function applyInvestigationLeadToReports() {
  const lead = investigationLead();
  if (lead.type === 'actor') {
    if (Number.isInteger(lead.numericValue)) {
      els.actorReportId.value = String(lead.numericValue);
    } else {
      els.actorReportName.value = lead.value;
    }
    return;
  }
  els.radiusReportCenter.value = lead.value;
  els.radiusReportJumps.value = String(lead.radius);
}

function investigationLead() {
  const value = textOrUndefined(els.investigationLeadValue.value) || '';
  const numericValue = Number(value);
  return {
    type: els.investigationLeadType.value,
    value,
    numericValue: Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined,
    radius: numberOrUndefined(els.investigationRadius.value) ?? 1
  };
}
