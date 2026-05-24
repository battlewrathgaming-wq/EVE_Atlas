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
  els.investigationOpenAssessmentDrawer.addEventListener('click', () => selectView('reports'));
  els.overviewOpenStoredEvidence.addEventListener('click', loadInvestigationEvidenceDetail);
  els.overviewOpenPossibleLeads.addEventListener('click', routeInvestigationLeadToQueue);
  els.overviewOpenWatchStatus.addEventListener('click', () => selectView('queue-watch'));
  els.overviewOpenAssessmentMemory.addEventListener('click', () => selectView('reports'));
  renderInvestigationLeadDraft();
  renderInvestigationQueueContextEmptyState();
  renderInvestigationDetailEmptyState();
  renderStoredContextEmptyState();
  renderObservationTimelineEmptyState();
  renderTopRelevantRecordsEmptyState();
  renderAssessmentDrawerEmptyState();
}

function renderInvestigationContext(readiness) {
  if (!els.investigationLiveContext) {
    return;
  }
  const apiState = externalApiStatus(readiness);
  setExternalApiState(apiState);
  renderRows(els.investigationLiveContext, [
    ['External API', `${apiState.state}; ${apiState.rule}`],
    ['zKill Discovery', readiness?.live_api?.enabled ? 'available after explicit action confirmation' : 'blocked until live API is enabled'],
    ['ESI Enrichment', readiness?.live_api?.enabled ? 'available after explicit selected expansion confirmation' : 'blocked until live API is enabled'],
    ['Queue Review -> Enrich', 'staged inside Discovery; queue preview is read-only, Enrich selected is the explicit ESI evidence step'],
    ['Startup Effect', 'passive inspection only; no discovery, evidence, hydration, assessment, or watch execution']
  ]);
  renderOverviewStatus(readiness, apiState);
}

function externalApiStatus(readiness) {
  const live = readiness?.live_api || {};
  const state = live.enabled ? 'enabled' : (live.state || 'local-only');
  return {
    state,
    rule: live.rule || 'explicit gate required'
  };
}

function setExternalApiState(status) {
  const text = `External API: ${status.state}`;
  if (els.externalApiState) {
    els.externalApiState.textContent = text;
  }
  setServiceState(text);
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
  renderStoredContextPane(report, lead);
  renderObservationTimeline(report);
  renderTopRelevantRecords(report);
  if (report.report_type === 'radius') {
    state.radiusReport = report;
    state.loadedReportType = 'radius';
    renderRadiusReport(report);
  } else {
    state.actorReport = report;
    state.loadedReportType = 'actor';
    renderActorReport(report);
  }
}

function renderInvestigationObservationPreview(report) {
  const timelineRows = reportTimelineRows(report);
  const rows = timelineRows.length
    ? timelineRows.slice(0, 4).map((entry) => ({
      label: entry.time || 'Observed event',
      value: timelineRecordSummary(entry)
    }))
    : investigationObservationRows(report);
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

function renderStoredContextPane(report, lead) {
  const counts = report.evidence_basis?.evidence_range || {};
  const timelineRows = reportTimelineRows(report);
  const hasEvidence = (counts.killmail_count ?? 0) > 0 || (counts.activity_event_count ?? 0) > 0;
  revealPanel(els.investigationDetailPanel, true);
  renderRows(els.investigationStoredContext, [
    ['Lead', leadLabel(lead)],
    ['Stored Evidence', `${counts.killmail_count ?? 0} killmails / ${counts.activity_event_count ?? 0} activity events`],
    ['Evidence Window', report.scope?.evidence_window?.label || 'unknown'],
    ['Sample Status', report.evidence_basis?.sample_status || 'unknown'],
    ['Latest Stored Event', timelineRows[0]?.time || counts.latest || 'none loaded'],
    ['Marked', 'attention/tag state is separate; no mark is changed from this pane'],
    ['Watch', 'shown only for active routine checks; loading context does not create or run watches'],
    ['Boundary', 'Stored context is read-only and does not prove threat, ownership, affiliation, staging, intent, or current presence.']
  ]);
  renderOverviewStoredEvidence(report);
  revealPanel(els.investigationObservationPanel, hasEvidence);
  revealPanel(els.investigationTopRecordsPanel, hasEvidence);
  renderAssessmentDrawer(report, hasEvidence);
}

function renderStoredContextEmptyState() {
  revealPanel(els.investigationDetailPanel, false);
  renderRows(els.investigationStoredContext, [
    ['Stored Context', 'No stored evidence report loaded.'],
    ['Next Step', 'Enter a Pilot, System, Corp, or Alliance lead, then Load Stored Context.'],
    ['Boundary', 'An empty local context is neutral; it is not proof of safety, absence, affiliation, or intent.']
  ]);
  if (els.overviewStoredEvidenceStatus) {
    els.overviewStoredEvidenceStatus.textContent = 'Read-only stored evidence and provenance. No local report loaded.';
  }
}

function renderObservationTimeline(report) {
  const rows = reportTimelineRows(report);
  els.investigationObservationTimeline.innerHTML = '';
  if (!rows.length) {
    renderObservationTimelineEmptyState('No Recent Timeline rows are available for this stored evidence scope.');
    return;
  }
  rows.slice(0, 5).forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'timeline-row story-row';
    row.innerHTML = [
      `<strong>${escapeHtml(entry.time || 'unknown time')}</strong>`,
      `<span>${escapeHtml(entry.killmail ? `Killmail ${entry.killmail}` : 'stored evidence')}</span>`,
      `<p>${escapeHtml(timelineRecordSummary(entry))}</p>`
    ].join('');
    els.investigationObservationTimeline.appendChild(row);
  });
}

function renderObservationTimelineEmptyState(message = 'Load stored context to render a fight timeline from existing report rows.') {
  revealPanel(els.investigationObservationPanel, false);
  els.investigationObservationTimeline.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'timeline-row story-row';
  row.innerHTML = [
    '<strong>No timeline loaded</strong>',
    '<span>Observation</span>',
    `<p>${escapeHtml(message)} Observations are grounded in stored expanded ESI evidence only.</p>`
  ].join('');
  els.investigationObservationTimeline.appendChild(row);
}

function renderTopRelevantRecords(report) {
  const rows = reportTimelineRows(report);
  els.investigationTopRecords.innerHTML = '';
  if (!rows.length) {
    renderTopRelevantRecordsEmptyState('No stored timeline rows are loaded for the current lead.');
    return;
  }
  rows.slice(0, 5).forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = [
      `<strong>${escapeHtml(entry.time || 'unknown time')}</strong>`,
      `<span>${escapeHtml(entry.killmail ? `Killmail ${entry.killmail}` : 'Stored evidence row')}</span>`,
      `<small>${escapeHtml(timelineRecordSummary(entry))}</small>`
    ].join('');
    els.investigationTopRecords.appendChild(item);
  });
}

function renderTopRelevantRecordsEmptyState(message = 'Load stored context to see recent stored records.') {
  revealPanel(els.investigationTopRecordsPanel, false);
  els.investigationTopRecords.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'record-item empty-note';
  item.innerHTML = [
    '<strong>No records loaded</strong>',
    '<span>Recent stored records</span>',
    `<small>${escapeHtml(message)} Relevance ranking is not implemented in HS43.</small>`
  ].join('');
  els.investigationTopRecords.appendChild(item);
}

function renderAssessmentDrawer(report, hasEvidence) {
  const eligible = hasEvidence && report.report_type === 'actor';
  revealPanel(els.investigationAssessmentDrawer, hasEvidence);
  els.investigationAssessmentDrawer.classList.toggle('is-ready', eligible);
  els.investigationAssessmentDrawerText.textContent = eligible
    ? 'Actor evidence context is loaded. Open the Assessment surface to save deliberate Assessment Memory with citation checks.'
    : 'Stored context is available. Assessment Memory remains ready only from eligible actor evidence context; radius/system context stays observational in this slice.';
  if (els.overviewAssessmentStatus) {
    els.overviewAssessmentStatus.textContent = eligible
      ? 'Eligible actor evidence context is loaded for deliberate Assessment Memory.'
      : 'Stored context is loaded. Assessment Memory stays deliberate and actor-evidence gated in this slice.';
  }
}

function renderAssessmentDrawerEmptyState() {
  revealPanel(els.investigationAssessmentDrawer, false);
  els.investigationAssessmentDrawer.classList.remove('is-ready');
  els.investigationAssessmentDrawerText.textContent = 'Assessment appears after stored actor evidence or an eligible report context exists. It is deliberate operator memory, not evidence.';
  if (els.overviewAssessmentStatus) {
    els.overviewAssessmentStatus.textContent = 'Deliberate saved operator judgment only. It is not evidence or Discovery output.';
  }
}

function revealPanel(panel, revealed) {
  if (!panel) {
    return;
  }
  panel.classList.toggle('is-deferred', !revealed);
  panel.classList.toggle('is-revealed', revealed);
}

function reportTimelineRows(report) {
  const sections = report.report_type === 'radius'
    ? [
      ...(report.observations?.scope ? [report.observations.scope] : []),
      ...(report.observations?.sections || [])
    ]
    : (report.observations?.sections || []);
  const timeline = sections.find((section) => /recent timeline/i.test(section.title || section.name || ''));
  const rows = (timeline?.rows || []).map((row) => row.values || row.raw || row);
  return rows
    .map(timelineRecord)
    .sort((left, right) => Date.parse(right.time || '') - Date.parse(left.time || ''));
}

function timelineRecord(values) {
  return {
    time: values.Time || values.killmail_time,
    killmail: values.Killmail || values.killmail_id,
    role: values.Role,
    system: values.System || values.solar_system_name,
    region: values.Region || values.region_name,
    ship: values.Ship || values['Victim Ship'] || values.ship_name || values.victim_ship_name,
    victim: values.Victim || values.victim_label,
    attacker: values['Observed Attacker'] || values.attacker_label,
    attackerShip: values['Attacker Ship'] || values.attacker_ship_name,
    aggressor: values['Aggressor Detail'] || values.aggressor_detail
  };
}

function timelineRecordSummary(entry) {
  const pieces = [];
  if (entry.victim) {
    pieces.push(`victim ${entry.victim}`);
  }
  if (entry.ship) {
    pieces.push(`ship ${entry.ship}`);
  }
  if (entry.role) {
    pieces.push(`role ${entry.role}`);
  }
  if (entry.system) {
    pieces.push(`in ${entry.system}`);
  }
  if (entry.region) {
    pieces.push(`region ${entry.region}`);
  }
  if (entry.attacker) {
    pieces.push(`observed attacker ${entry.attacker}`);
  }
  if (entry.attackerShip) {
    pieces.push(`attacker ship ${entry.attackerShip}`);
  }
  if (entry.aggressor) {
    pieces.push(entry.aggressor);
  }
  return pieces.join('; ') || 'Stored evidence row returned without display values.';
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
  renderStoredContextEmptyState();
  renderObservationTimelineEmptyState();
  renderTopRelevantRecordsEmptyState();
  renderAssessmentDrawerEmptyState();
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
  revealPanel(els.investigationQueuePanel, false);
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
  revealPanel(els.investigationQueuePanel, true);
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
  if (els.overviewPossibleLeadsStatus) {
    els.overviewPossibleLeadsStatus.textContent = hasQueuedRefs
      ? `${candidates} queued possible lead(s) for ${leadLabel(lead)}; ${selected} selected for Enrich selected preflight.`
      : `No queued possible refs loaded for ${leadLabel(lead)}. Discover Possible Leads is the explicit zKill queueing step.`;
  }
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
  revealPanel(els.investigationQueuePanel, true);
  els.investigationQueueContextStatus.className = 'callout blocked';
  els.investigationQueueContextStatus.innerHTML = [
    '<strong>Queue context unavailable</strong>',
    `<span>${escapeHtml(error.message || String(error))}</span>`
  ].join('');
  renderRows(els.investigationQueueContextSummary, [
    ['Queue Selection', 'Existing read-only queue selection could not be previewed.'],
    ['Evidence Effect', 'No discovery, enrichment, hydration, assessment, or watch execution was started.']
  ]);
  if (els.overviewPossibleLeadsStatus) {
    els.overviewPossibleLeadsStatus.textContent = 'Possible Leads context could not be previewed. No discovery, ESI, evidence write, hydration, assessment, or watch execution started.';
  }
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
  const lead = investigationLead();
  renderInvestigationLeadMessages(investigationLeadDraftMessages(lead));
  renderSideLeadSummary(lead);
  renderOverviewLeadDraft(lead);
}

function renderSideLeadSummary(lead) {
  if (!els.sideLeadSummary) {
    return;
  }
  if (!lead.value) {
    els.sideLeadSummary.textContent = 'No lead entered. Discovery starts with a Pilot, System, Corp, or Alliance search.';
    return;
  }
  els.sideLeadSummary.textContent = `${leadLabel(lead)} drafted. Check Lead is local; Discovery and Enrich remain explicit actions.`;
}

function renderOverviewLeadDraft(lead) {
  if (!els.investigationSourceStrip) {
    return;
  }
  const apiState = externalApiStatus(state.readiness);
  const localBasis = lead.value
    ? `${leadLabel(lead)} is drafted locally. Check Lead uses scope validation and local lookup where available.`
    : 'No lead drafted. Typing remains local and passive.';
  els.investigationSourceStrip.textContent = `${localBasis} External API is ${apiState.state}; live provider use requires an explicit action and the existing gate.`;
}

function renderOverviewStatus(readiness, apiState) {
  if (els.investigationSourceStrip) {
    renderOverviewLeadDraft(investigationLead());
  }
  if (els.overviewWatchStatus) {
    const schedule = state.watchSchedule || {};
    const due = schedule.due_count ?? schedule.dueCount ?? schedule.due?.length;
    const total = schedule.watch_count ?? schedule.watchCount ?? schedule.watches?.length;
    els.overviewWatchStatus.textContent = Number.isInteger(total)
      ? `Watch schedule loaded: ${total} watch item(s), ${due ?? 0} due. Watch is active routine checking; Marked remains attention only.`
      : 'Watch is active routine checking. Marked attention alone does not run checks.';
  }
  if (els.overviewPossibleLeadsStatus && state.queueSelection?.counts) {
    const counts = state.queueSelection.counts;
    els.overviewPossibleLeadsStatus.textContent = `${counts.candidates_considered ?? 0} queued possible lead(s) in the current queue preview. Discovery output is not Evidence.`;
  }
  if (els.overviewAssessmentStatus && Array.isArray(state.assessmentArtifacts) && state.assessmentArtifacts.length) {
    els.overviewAssessmentStatus.textContent = `${state.assessmentArtifacts.length} saved Assessment Memory item(s). Deliberate operator memory remains separate from evidence.`;
  }
  if (els.overviewStoredEvidenceStatus && readiness?.lookup_counts) {
    const killmails = readiness.lookup_counts.killmails ?? 0;
    const activityEvents = readiness.lookup_counts.activity_events ?? 0;
    els.overviewStoredEvidenceStatus.textContent = `Local corpus: ${killmails} killmail evidence row(s), ${activityEvents} activity event(s). Open Stored Evidence to read report context.`;
  }
}

function renderOverviewStoredEvidence(report) {
  if (!els.overviewStoredEvidenceStatus) {
    return;
  }
  const counts = report.evidence_basis?.evidence_range || {};
  els.overviewStoredEvidenceStatus.textContent = `Loaded report context: ${counts.killmail_count ?? 0} killmail evidence row(s), ${counts.activity_event_count ?? 0} activity event(s), provenance/report context only.`;
}

function investigationLeadDraftMessages(lead) {
  if (!lead.value) {
    return [
      feedbackMessage('warning', 'No Lead Yet', 'Enter a Pilot, System, Corp, or Alliance lead. Startup remains passive while you type.')
    ];
  }
  if (lead.type === 'actor') {
    const leadKind = lead.actorType === 'character'
      ? 'Pilot'
      : (lead.actorType === 'corporation' ? 'Corp' : 'Alliance');
    return [
      feedbackMessage('ready', `${leadKind} Lead`, Number.isInteger(lead.numericValue)
        ? `Using ${leadKind} ID ${lead.numericValue} as the durable fact. Names remain labels unless resolved by an existing backend workflow.`
        : `Using "${lead.value}" as ${leadKind} resolver input or display label. Reports need a durable actor ID.`),
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
