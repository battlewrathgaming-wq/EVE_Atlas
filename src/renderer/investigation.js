// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


function bindInvestigationEvents() {
  els.investigationLeadType.addEventListener('change', renderInvestigationLeadDraft);
  els.investigationActorType.addEventListener('change', renderInvestigationLeadDraft);
  els.investigationLeadValue.addEventListener('input', renderInvestigationLeadDraft);
  els.investigationRadius.addEventListener('input', renderInvestigationLeadDraft);
  els.investigationCheckScope.addEventListener('click', async () => {
    await routeInvestigationLead('scopes');
  });
  els.investigationLoadDetail.addEventListener('click', loadInvestigationEvidenceDetail);
  els.investigationDiscoverLeads.addEventListener('click', async () => {
    await routeInvestigationLead('actions');
  });
  els.investigationReviewQueue.addEventListener('click', () => {
    if (applyInvestigationLeadToQueue()) {
      selectView('queue-watch');
    }
  });
  els.investigationOpenReports.addEventListener('click', async () => {
    await routeInvestigationLead('reports');
  });
  els.investigationOpenDetailReport.addEventListener('click', openInvestigationDetailReport);
  els.investigationOpenReadiness.addEventListener('click', () => selectView('readiness'));
  els.investigationOpenTasks.addEventListener('click', () => selectView('tasks'));
  els.investigationOpenActions.addEventListener('click', () => selectView('actions'));
  els.investigationOpenQueueDetail.addEventListener('click', () => selectView('queue-watch'));
  renderInvestigationLeadDraft();
  renderInvestigationDetailEmptyState();
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

async function routeInvestigationLead(target) {
  const buttons = [
    els.investigationCheckScope,
    els.investigationLoadDetail,
    els.investigationDiscoverLeads,
    els.investigationOpenReports
  ];
  buttons.forEach((button) => setBusy(button, true));
  try {
    const checked = await checkInvestigationLead(target);
    if (!checked.ok) {
      renderInvestigationLeadMessages(checked.messages);
      return;
    }
    if (target === 'scopes') {
      applyInvestigationLeadToScopes(checked.lead);
      renderInvestigationLeadMessages(checked.messages);
      selectView('scopes');
      return;
    }
    if (target === 'actions') {
      applyInvestigationLeadToActions(checked.lead);
      renderInvestigationLeadMessages(checked.messages);
      selectView('actions');
      return;
    }
    applyInvestigationLeadToReports(checked.lead);
    renderInvestigationLeadMessages(checked.messages);
    selectView('reports');
  } finally {
    buttons.forEach((button) => setBusy(button, false));
  }
}

async function loadInvestigationEvidenceDetail() {
  setBusy(els.investigationLoadDetail, true);
  try {
    const checked = await checkInvestigationLead('detail');
    renderInvestigationLeadMessages(checked.messages);
    if (!checked.ok) {
      renderInvestigationDetailEmptyState(checked.messages[0]?.body);
      return;
    }
    const report = await investigationDetailReport(checked.lead);
    renderInvestigationEvidenceDetail(report, checked.lead);
  } catch (error) {
    renderInvestigationDetailError(error);
  } finally {
    setBusy(els.investigationLoadDetail, false);
  }
}

async function investigationDetailReport(lead) {
  if (lead.type === 'actor') {
    return service.invoke('report.actor', {
      params: cleanObject({
        entityType: lead.actorType,
        entityId: lead.numericValue,
        entityName: Number.isInteger(lead.numericValue) ? undefined : lead.value
      }),
      options: {}
    });
  }
  return service.invoke('report.radius', {
    params: cleanObject({
      center: lead.normalized?.centerSystemId || lead.numericValue || lead.value,
      radiusJumps: lead.type === 'radius' ? lead.radius : 0
    }),
    options: {}
  });
}

function renderInvestigationEvidenceDetail(report, lead) {
  const counts = report.evidence_basis?.evidence_range || {};
  const killmails = counts.killmail_count ?? 0;
  const activityEvents = counts.activity_event_count ?? 0;
  const hasEvidence = killmails > 0 || activityEvents > 0;
  els.investigationDetailStatus.className = `callout ${hasEvidence ? 'ready' : 'warning'}`;
  els.investigationDetailStatus.innerHTML = [
    `<strong>${escapeHtml(hasEvidence ? 'Stored evidence found' : 'No stored evidence for this lead')}</strong>`,
    `<span>${escapeHtml(investigationDetailStatusText(lead, hasEvidence))}</span>`
  ].join('');
  renderRows(els.investigationEvidenceSummary, [
    ['Lead', reportLabel(report)],
    ['Report Type', report.report_type || lead.type],
    ['Evidence Basis', report.evidence_basis?.source || 'stored expanded ESI killmails and activity events'],
    ['Sample Status', report.evidence_basis?.sample_status || 'unknown'],
    ['Evidence Window', report.scope?.evidence_window?.label || 'unknown'],
    ['Killmails', killmails],
    ['Activity Events', activityEvents],
    ['Boundary', 'This is a read-only stored-evidence summary. Discovery queue refs remain possible leads until Enrich selected calls ESI.']
  ]);
  renderInvestigationObservationPreview(report);
  if (report.report_type === 'radius') {
    state.radiusReport = report;
    state.loadedReportType = 'radius';
  } else {
    state.actorReport = report;
    state.loadedReportType = 'actor';
  }
}

function renderInvestigationObservationPreview(report) {
  const rows = investigationObservationRows(report);
  els.investigationObservationPreview.innerHTML = '';
  if (!rows.length) {
    const row = document.createElement('div');
    row.className = 'message warning';
    row.innerHTML = '<span>Observation Preview</span><span>No observation rows are available for this stored evidence scope.</span>';
    els.investigationObservationPreview.appendChild(row);
    return;
  }
  rows.slice(0, 4).forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'message ready';
    row.innerHTML = `<span>${escapeHtml(entry.label)}</span><span>${escapeHtml(entry.value)}</span>`;
    els.investigationObservationPreview.appendChild(row);
  });
}

function investigationObservationRows(report) {
  const sections = report.report_type === 'radius'
    ? [
      ...(report.observations?.scope ? [report.observations.scope] : []),
      ...(report.observations?.sections || [])
    ]
    : (report.observations?.sections || []);
  return sections.flatMap((section) => {
    const title = section.title || section.name || 'Observation';
    return (section.rows || []).slice(0, 2).map((row) => ({
      label: title,
      value: observationRowSummary(row.values || row.raw || row)
    }));
  });
}

function observationRowSummary(values) {
  const entries = Object.entries(values || {}).slice(0, 4);
  return entries.length
    ? entries.map(([key, value]) => `${key}: ${value}`).join('; ')
    : 'Observation row returned without display values.';
}

function investigationDetailStatusText(lead, hasEvidence) {
  if (hasEvidence) {
    return 'Counts and preview rows are observations derived from stored expanded ESI killmail evidence.';
  }
  if (lead.type === 'actor') {
    return 'Atlas has no stored expanded ESI killmail evidence for this actor scope. Discover Possible Leads can queue zKill refs only; Enrich selected is required before evidence appears.';
  }
  return 'Atlas has no stored expanded ESI killmail evidence for this system scope. Discover Possible Leads can queue zKill refs only; Enrich selected is required before evidence appears.';
}

function renderInvestigationDetailEmptyState(message = 'Validate a lead, then load stored evidence detail to see what Atlas already knows.') {
  els.investigationDetailStatus.className = 'callout warning';
  els.investigationDetailStatus.innerHTML = [
    '<strong>No stored evidence detail loaded</strong>',
    `<span>${escapeHtml(message)} This panel is read-only and never starts discovery, enrichment, hydration, assessment, or watches.</span>`
  ].join('');
  renderRows(els.investigationEvidenceSummary, [
    ['Evidence Basis', 'No stored evidence report loaded.'],
    ['Boundary', 'Expanded ESI killmails are evidence. Discovery refs are possible leads until explicit ESI expansion.']
  ]);
  els.investigationObservationPreview.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'message warning';
  row.innerHTML = '<span>Observation Preview</span><span>No observations loaded. Observations derive from stored evidence only.</span>';
  els.investigationObservationPreview.appendChild(row);
}

function renderInvestigationDetailError(error) {
  els.investigationDetailStatus.className = 'callout blocked';
  els.investigationDetailStatus.innerHTML = [
    '<strong>Stored detail unavailable</strong>',
    `<span>${escapeHtml(error.message || String(error))}</span>`
  ].join('');
}

function openInvestigationDetailReport() {
  if (investigationLead().value) {
    routeInvestigationLead('reports');
    return;
  }
  selectView('reports');
}

async function checkInvestigationLead(target) {
  const lead = investigationLead();
  const draftMessages = investigationLeadDraftMessages(lead);
  if (!lead.value) {
    return {
      ok: false,
      lead,
      messages: [
        feedbackMessage('blocked', 'Lead Required', 'Enter an actor name/ID or system name/ID before routing this investigation.')
      ]
    };
  }
  if (lead.invalidReason) {
    return {
      ok: false,
      lead,
      messages: [
        feedbackMessage('blocked', 'Lead Invalid', lead.invalidReason),
        ...draftMessages
      ]
    };
  }
  if ((target === 'reports' || target === 'detail') && lead.type === 'actor' && !Number.isInteger(lead.numericValue)) {
    return {
      ok: false,
      lead,
      messages: [
        feedbackMessage('warning', 'Durable Actor ID Needed', 'Actor reports require a durable ID. Names can be used for scope checks or manual discovery resolver input first.'),
        ...draftMessages
      ]
    };
  }
  if ((target === 'reports' || target === 'detail') && lead.type !== 'actor') {
    const result = await validateInvestigationLeadScope(lead);
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      lead: {
        ...lead,
        normalized: result.normalized
      },
      messages: [
        feedbackMessage('ready', 'System Resolved', systemResolutionSummary(result.normalized)),
        ...draftMessages
      ]
    };
  }
  const result = await validateInvestigationLeadScope(lead);
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    lead: {
      ...lead,
      normalized: result.normalized
    },
    messages: [
      feedbackMessage('ready', 'Lead Routed', leadRouteSummary(lead, target, result.normalized)),
      ...draftMessages
    ]
  };
}

async function validateInvestigationLeadScope(lead) {
  try {
    const payload = investigationScopeValidationPayload(lead);
    const result = await service.invoke('scope.validate', payload);
    return {
      ok: true,
      lead,
      normalized: result.normalized,
      messages: []
    };
  } catch (error) {
    return {
      ok: false,
      lead,
      messages: [
        feedbackMessage('blocked', 'Validation Failed', validationFailureMessage(lead, error)),
        ...investigationLeadDraftMessages(lead)
      ]
    };
  }
}

function investigationScopeValidationPayload(lead) {
  if (lead.type === 'actor') {
    return {
      kind: 'manual_discovery',
      input: cleanObject({
        scope: 'actor',
        entityType: lead.actorType,
        entityId: lead.numericValue,
        entityName: Number.isInteger(lead.numericValue) ? undefined : lead.value
      })
    };
  }
  return {
    kind: 'manual_discovery',
    input: cleanObject({
      scope: lead.type,
      centerSystemId: lead.numericValue,
      centerSystemName: Number.isInteger(lead.numericValue) ? undefined : lead.value,
      radiusJumps: lead.type === 'radius' ? lead.radius : 0
    })
  };
}

function applyInvestigationLeadToScopes() {
  const lead = arguments[0] || investigationLead();
  clearInvestigationRouteInputs('scopes');
  if (lead.type === 'actor') {
    els.scopeKind.value = 'manual_discovery';
    els.scopeDiscoveryType.value = 'actor';
    els.scopeActorType.value = lead.actorType;
    if (Number.isInteger(lead.numericValue)) {
      els.scopeActorId.value = String(lead.numericValue);
    } else {
      els.scopeActorName.value = lead.value;
    }
    return;
  }
  els.scopeKind.value = 'manual_discovery';
  els.scopeDiscoveryType.value = lead.type;
  els.scopeSystemId.value = String(lead.normalized?.centerSystemId || lead.numericValue || '');
  els.scopeSystemName.value = lead.normalized?.centerSystemName || (Number.isInteger(lead.numericValue) ? '' : lead.value);
  els.scopeRadius.value = String(lead.type === 'radius' ? lead.radius : 0);
}

function applyInvestigationLeadToActions() {
  const lead = arguments[0] || investigationLead();
  clearInvestigationRouteInputs('actions');
  els.actionDiscoveryScope.value = lead.type;
  if (lead.type === 'actor') {
    els.actionActorType.value = lead.actorType;
    if (Number.isInteger(lead.numericValue)) {
      els.actionActorId.value = String(lead.numericValue);
    } else {
      els.actionActorName.value = lead.value;
    }
    return;
  }
  els.actionSystemId.value = String(lead.normalized?.centerSystemId || lead.numericValue || '');
  els.actionSystemName.value = lead.normalized?.centerSystemName || (Number.isInteger(lead.numericValue) ? '' : lead.value);
  els.actionRadius.value = String(lead.type === 'radius' ? lead.radius : 0);
}

function applyInvestigationLeadToReports() {
  const lead = arguments[0] || investigationLead();
  clearInvestigationRouteInputs('reports');
  if (lead.type === 'actor') {
    els.actorReportType.value = lead.actorType;
    if (Number.isInteger(lead.numericValue)) {
      els.actorReportId.value = String(lead.numericValue);
    }
    els.actorReportName.value = Number.isInteger(lead.numericValue) ? '' : lead.value;
    return;
  }
  els.radiusReportCenter.value = String(lead.normalized?.centerSystemId || lead.numericValue || lead.value);
  els.radiusReportJumps.value = String(lead.type === 'radius' ? lead.radius : 0);
}

function applyInvestigationLeadToQueue() {
  const lead = investigationLead();
  if (!lead.value) {
    renderInvestigationLeadMessages([
      feedbackMessage('blocked', 'Lead Required', 'Queue review needs a routed discovery scope or selected queued refs. Enter a durable ID to prefill a queue scope, or open Queue / Enrich directly from secondary routes.')
    ]);
    return false;
  }
  if (lead.type === 'actor' && Number.isInteger(lead.numericValue)) {
    clearInvestigationRouteInputs('queue');
    els.queueDiscoveredByType.value = 'manual_actor';
    els.queueDiscoveredById.value = `${lead.actorType}:${lead.numericValue}`;
    renderInvestigationLeadMessages([
      feedbackMessage('ready', 'Queue Scope Filled', 'Queue / Enrich is filtered to this actor discovery scope. Queued refs remain possible evidence until Enrich selected calls ESI.')
    ]);
    return true;
  }
  if (lead.type !== 'actor' && Number.isInteger(lead.numericValue)) {
    clearInvestigationRouteInputs('queue');
    els.queueDiscoveredByType.value = lead.type === 'radius' ? 'manual_radius' : 'manual_system';
    els.queueDiscoveredById.value = `system:${lead.numericValue}:radius:${lead.type === 'radius' ? lead.radius : 0}`;
    renderInvestigationLeadMessages([
      feedbackMessage('ready', 'Queue Scope Filled', 'Queue / Enrich is filtered to this system discovery scope. Queued refs remain possible evidence until Enrich selected calls ESI.')
    ]);
    return true;
  }
  renderInvestigationLeadMessages([
    feedbackMessage('warning', 'Durable ID Useful', 'Queue filters use stored discovery scope IDs. Exact system names can be resolved through Check Scope or Discover Possible Leads first; actor names are labels/resolver input, not queue facts.'),
    ...investigationLeadDraftMessages(lead)
  ]);
  return false;
}

function investigationLead() {
  const value = textOrUndefined(els.investigationLeadValue.value) || '';
  const numericValue = Number(value);
  const radius = numberOrUndefined(els.investigationRadius.value) ?? 1;
  const invalidReason = invalidInvestigationLeadReason(value, radius);
  return {
    type: els.investigationLeadType.value,
    actorType: els.investigationActorType.value,
    value,
    numericValue: Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined,
    radius,
    invalidReason
  };
}

function invalidInvestigationLeadReason(value, radius) {
  if (value && /^[a-z]+:\/\/|zkillboard\.com|killmail/i.test(value)) {
    return 'Paste support for zKill links and killmail IDs is intentionally deferred. Use an actor or system name/ID in this slice.';
  }
  if (value && Number(value) <= 0) {
    return 'Numeric lead IDs must be positive integers. Names are allowed when the selected route supports resolver input.';
  }
  if (!Number.isInteger(radius) || radius < 0 || radius > 5) {
    return 'Radius must be a whole number from 0 to 5.';
  }
  return null;
}

function renderInvestigationLeadDraft() {
  renderInvestigationLeadMessages(investigationLeadDraftMessages(investigationLead()));
}

function investigationLeadDraftMessages(lead) {
  if (!lead.value) {
    return [
      feedbackMessage('warning', 'No Lead Yet', 'Enter an actor name/ID or exact system name/ID. Startup remains passive while you type.')
    ];
  }
  if (lead.type === 'actor') {
    return [
      feedbackMessage('ready', 'Actor Lead', Number.isInteger(lead.numericValue)
        ? `Using ${lead.actorType} ID ${lead.numericValue} as the durable fact. Names remain labels unless resolved by an existing backend workflow.`
        : `Using "${lead.value}" as ${lead.actorType} resolver input or display label. Reports need a durable actor ID.`),
      feedbackMessage('warning', 'Marked / Watch Boundary', 'Marked is attention only. Watch is active routine checking and still requires explicit watch configuration.')
    ];
  }
  return [
    feedbackMessage('ready', lead.type === 'radius' ? 'System Radius Lead' : 'System Lead', Number.isInteger(lead.numericValue)
      ? `Using solar system ID ${lead.numericValue} as the durable fact.`
      : `Using "${lead.value}" as an exact local-SDE system name for existing scope validation.`),
    feedbackMessage('warning', 'Resolution Boundary', 'System names resolve through local SDE lookup tables. This does not call zKill or ESI.')
  ];
}

function renderInvestigationLeadMessages(messages) {
  els.investigationLeadFeedback.innerHTML = '';
  messages.forEach((entry) => {
    const row = document.createElement('div');
    row.className = `message ${entry.kind}`;
    row.innerHTML = `<span>${escapeHtml(entry.title)}</span><span>${escapeHtml(entry.body)}</span>`;
    els.investigationLeadFeedback.appendChild(row);
  });
}

function feedbackMessage(kind, title, body) {
  return { kind, title, body };
}

function validationFailureMessage(lead, error) {
  if (lead.type === 'actor') {
    return `${error.message}. Actor names are resolver inputs or labels here; durable IDs are facts for reports and queue filters.`;
  }
  return `${error.message}. System names must match local SDE topology exactly, or use a durable solar system ID.`;
}

function leadRouteSummary(lead, target, normalized) {
  if (target === 'actions') {
    return 'Manual discovery preflight was filled. Discovery queues possible zKill refs only; it does not create evidence until selected ESI expansion succeeds.';
  }
  if (lead.type === 'actor') {
    return Number.isInteger(lead.numericValue)
      ? `${lead.actorType} ID ${lead.numericValue} is ready for existing scope controls.`
      : `${lead.actorType} name "${lead.value}" is ready as existing resolver/label input.`;
  }
  return systemResolutionSummary(normalized);
}

function systemResolutionSummary(normalized) {
  return `Local SDE resolved ${normalized.centerSystemName || 'system'} [solarSystemID: ${normalized.centerSystemId}] for ${normalized.scope || 'radius'} scope.`;
}

function clearInvestigationRouteInputs(target) {
  const groups = {
    scopes: [
      els.scopeActorId,
      els.scopeActorName,
      els.scopeSystemId,
      els.scopeSystemName,
      els.scopeRadius
    ],
    actions: [
      els.actionActorId,
      els.actionActorName,
      els.actionSystemId,
      els.actionSystemName,
      els.actionRadius
    ],
    reports: [
      els.actorReportId,
      els.actorReportName,
      els.radiusReportCenter
    ],
    queue: [
      els.queueDiscoveredByType,
      els.queueDiscoveredById,
      els.queueKillmailIds
    ]
  };
  (groups[target] || []).forEach((input) => {
    input.value = '';
  });
}
