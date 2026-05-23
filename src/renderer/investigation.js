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
  els.investigationReviewQueue.addEventListener('click', routeInvestigationLeadToQueue);
  els.investigationOpenReports.addEventListener('click', async () => {
    await routeInvestigationLead('reports');
  });
  els.investigationOpenDetailReport.addEventListener('click', openInvestigationDetailReport);
  els.investigationOpenReadiness.addEventListener('click', () => selectView('readiness'));
  els.investigationOpenTasks.addEventListener('click', () => selectView('tasks'));
  els.investigationOpenActions.addEventListener('click', () => selectView('actions'));
  els.investigationOpenQueueDetail.addEventListener('click', () => selectView('queue-watch'));
  renderInvestigationLeadDraft();
  renderInvestigationQueueContextEmptyState();
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
    els.investigationOpenReports,
    els.investigationReviewQueue
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

function renderInvestigationQueueContextEmptyState(message = 'Validate a durable lead, then review Queue / Enrich to see stored possible refs for that discovery scope.') {
  els.investigationQueueContextStatus.className = 'callout warning';
  els.investigationQueueContextStatus.innerHTML = [
    '<strong>No queue context loaded</strong>',
    `<span>${escapeHtml(message)}</span>`
  ].join('');
  renderRows(els.investigationQueueContextSummary, [
    ['Queue Selection', 'Read-only preview; no discovery or ESI expansion.'],
    ['Evidence Boundary', 'Queued refs are possible leads. Enrich selected is explicit ESI expansion into stored killmail evidence.']
  ]);
}

function renderInvestigationQueueContext(selection, lead, filter) {
  const counts = selection.counts || {};
  const candidates = counts.candidates_considered ?? 0;
  const selected = counts.selected_for_expansion ?? 0;
  const hasQueuedRefs = candidates > 0;
  els.investigationQueueContextStatus.className = `callout ${hasQueuedRefs ? 'ready' : 'warning'}`;
  els.investigationQueueContextStatus.innerHTML = [
    `<strong>${escapeHtml(hasQueuedRefs ? 'Queued possible refs available' : 'No queued possible refs for this lead')}</strong>`,
    `<span>${escapeHtml(investigationQueueContextStatusText(lead, hasQueuedRefs, selected))}</span>`
  ].join('');
  renderRows(els.investigationQueueContextSummary, [
    ['Discovery Filter', `${filter.discoveredByType} / ${filter.discoveredById}`],
    ['Filter Source', 'stored discovery-scope provenance from existing queue selection behavior'],
    ['Queued Possible Refs', candidates],
    ['Selectable For Enrich Selected', counts.selectable ?? 0],
    ['Selected For Enrich Selected', selected],
    ['Expected ESI Calls', counts.expected_esi_calls ?? selected],
    ['Already Stored/Cached', `${counts.expanded ?? 0} expanded; ${counts.cached ?? 0} cached`],
    ['Next Step', hasQueuedRefs ? 'Open Queue / Enrich, preflight Enrich selected, then confirm before ESI expansion.' : 'Use Discover Possible Leads first to queue zKill refs; absence of refs here is not an evidence conclusion.'],
    ['Evidence Effect', 'Only successful Enrich selected writes expanded ESI killmail evidence and activity events.']
  ]);
}

function investigationQueueContextStatusText(lead, hasQueuedRefs, selected) {
  if (hasQueuedRefs) {
    return `${leadLabel(lead)} has queued zKill refs stored as possible leads. ${selected} selected ref(s) would be offered to Enrich selected before any ESI call.`;
  }
  return `${leadLabel(lead)} can prefill the stored queue filter, but Atlas has no queued possible refs for that filter yet. Discover Possible Leads is the explicit zKill queueing step.`;
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

async function routeInvestigationLeadToQueue() {
  setBusy(els.investigationReviewQueue, true);
  try {
    const checked = await checkInvestigationLead('queue');
    renderInvestigationLeadMessages(checked.messages);
    if (!checked.ok) {
      renderInvestigationQueueContextEmptyState(checked.messages[0]?.body);
      return;
    }
    const filter = investigationQueueFilter(checked.lead);
    if (!filter) {
      const message = checked.lead.type === 'actor'
        ? 'Actor names can fill discovery preflight, but stored queue filters need a durable actor ID after explicit discovery. Use Discover Possible Leads first.'
        : 'System names must resolve to a local SDE solar system ID before Queue / Enrich can use stored discovery-scope filters.';
      renderInvestigationLeadMessages([
        feedbackMessage('warning', 'Queue Filter Needs Durable Scope', message),
        ...investigationLeadDraftMessages(checked.lead)
      ]);
      renderInvestigationQueueContextEmptyState(message);
      return;
    }
    applyInvestigationLeadQueueFilter(filter);
    const selection = await service.invoke('queue.selection', {
      ...filter,
      mode: els.queueSelectionMode.value,
      maxExpansions: numberOrUndefined(els.queueMaxExpansions.value) || 2,
      killmailIds: parseIdList(els.queueKillmailIds.value)
    });
    state.queueSelection = selection;
    renderQueueSelection(selection);
    renderInvestigationQueueContext(selection, checked.lead, filter);
    renderInvestigationLeadMessages([
      feedbackMessage('ready', 'Queue Scope Previewed', 'Queue / Enrich is filtered to this stored discovery scope. Queued refs remain possible leads until Enrich selected calls ESI.'),
      ...checked.messages
    ]);
    selectView('queue-watch');
  } catch (error) {
    renderInvestigationQueueContextError(error);
  } finally {
    setBusy(els.investigationReviewQueue, false);
  }
}

function investigationQueueFilter(lead) {
  if (lead.type === 'actor' && Number.isInteger(lead.numericValue)) {
    return {
      discoveredByType: 'manual_actor',
      discoveredById: `${lead.actorType}:${lead.numericValue}`
    };
  }
  const systemId = lead.normalized?.centerSystemId || lead.numericValue;
  if (lead.type !== 'actor' && Number.isInteger(systemId)) {
    return {
      discoveredByType: lead.type === 'radius' ? 'manual_radius' : 'manual_system',
      discoveredById: `system:${systemId}:radius:${lead.type === 'radius' ? lead.radius : 0}`
    };
  }
  return null;
}

function applyInvestigationLeadQueueFilter(filter) {
  clearInvestigationRouteInputs('queue');
  els.queueDiscoveredByType.value = filter.discoveredByType;
  els.queueDiscoveredById.value = filter.discoveredById;
}

function renderInvestigationQueueContextError(error) {
  els.investigationQueueContextStatus.className = 'callout blocked';
  els.investigationQueueContextStatus.innerHTML = [
    '<strong>Queue context unavailable</strong>',
    `<span>${escapeHtml(error.message || String(error))}</span>`
  ].join('');
  renderRows(els.investigationQueueContextSummary, [
    ['Queue Selection', 'Existing read-only queue selection could not be previewed.'],
    ['Evidence Effect', 'No discovery, enrichment, hydration, assessment, or watch execution was started.']
  ]);
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
  if (target === 'queue') {
    return 'Queue / Enrich preview uses stored discovery-scope filters and existing queue selection only; it does not discover refs or call ESI.';
  }
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

function leadLabel(lead) {
  if (lead.type === 'actor') {
    return `${lead.actorType} ${lead.numericValue || lead.value}`;
  }
  return `system/radius ${lead.normalized?.centerSystemId || lead.numericValue || lead.value}`;
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
