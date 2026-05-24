// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


async function loadQueueReport() {
  setBusy(els.loadQueueReport, true);
  try {
    const report = await service.invoke('report.queue', { limit: 8 });
    els.reportOutput.textContent = reportTextExport(report, 'No queue report returned.');
  } catch (error) {
    els.reportOutput.textContent = `Report unavailable: ${error.message}`;
  } finally {
    setBusy(els.loadQueueReport, false);
  }
}

function reportTextExport(report, emptyMessage) {
  if (!report) {
    return emptyMessage;
  }
  if (typeof report === 'string') {
    return report;
  }
  if (typeof report.text === 'string' && report.text.trim()) {
    return report.text;
  }
  return JSON.stringify(report, null, 2);
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

async function loadRadiusReport() {
  setBusy(els.loadRadiusReport, true);
  try {
    const request = radiusReportRequest();
    const report = await service.invoke('report.radius', request);
    state.actorReport = null;
    state.actorReportRequest = null;
    state.radiusReportRequest = request;
    renderRadiusReport(report);
  } catch (error) {
    renderError(els.actorEvidence, error);
    els.reportOutput.textContent = `Radius report unavailable: ${error.message}`;
  } finally {
    setBusy(els.loadRadiusReport, false);
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

function radiusReportRequest() {
  const center = els.radiusReportCenter.value.trim();
  if (!center) {
    throw new Error('Radius report requires a center system ID or name');
  }
  const radiusJumps = Number(els.radiusReportJumps.value);
  if (!Number.isInteger(radiusJumps) || radiusJumps < 0) {
    throw new Error('Radius report requires a non-negative radius');
  }
  const lookbackSeconds = Number(els.radiusReportLookback.value);
  const maxSystems = Number(els.radiusReportMaxSystems.value);
  return {
    params: cleanObject({
      center,
      radiusJumps,
      maxSystems: Number.isInteger(maxSystems) && maxSystems > 0 ? maxSystems : undefined
    }),
    options: cleanObject({
      lookbackSeconds: Number.isInteger(lookbackSeconds) && lookbackSeconds > 0 ? lookbackSeconds : undefined
    })
  };
}

function renderActorReport(report) {
  state.actorReport = report;
  state.radiusReport = null;
  state.loadedReportType = 'actor';
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

function renderRadiusReport(report) {
  state.radiusReport = report;
  state.loadedReportType = 'radius';
  renderReportStatus(report);
  els.reportOutput.textContent = report.text || 'No text export returned.';
  renderRows(els.actorEvidence, [
    ['Report Type', report.report_type || 'radius'],
    ['Mode', report.response_mode || 'unknown'],
    ['Sample Status', report.evidence_basis?.sample_status || 'unknown'],
    ['Evidence Window', report.scope?.evidence_window?.label || 'unknown'],
    ['Center', radiusLabel(report)],
    ['Radius', `${report.scope?.radius_jumps ?? 0} jumps`],
    ['Included Systems', report.scope?.included_systems?.length ?? 0],
    ['Killmails', report.evidence_basis?.evidence_range?.killmail_count ?? 0],
    ['Activity Events', report.evidence_basis?.evidence_range?.activity_event_count ?? 0],
    ['Source', report.evidence_basis?.source || 'unknown']
  ]);
  renderRows(els.actorProvenance, linesAsRows(report.collection_provenance?.lines || []));
  renderObservationSections([
    ...(report.observations?.scope ? [report.observations.scope] : []),
    ...(report.observations?.sections || [])
  ]);
  renderWarnings(report.warnings || []);
  renderRawIds(report.raw_ids || {});
  renderAssessmentReadiness('warning', 'Radius report is context-only for Assessment Memory', 'Area-context assessment memory remains deferred; save assessment memory from a loaded actor report in this slice.');
  renderRows(els.assessmentContext, [
    ['Context', 'Radius report loaded. Area-context assessment memory is still a later design task.'],
    ['Boundary', report.interpretation_warning || 'Area observations are not proof of staging, ownership, affiliation, or intent.']
  ]);
  renderMetadataHydrationContext();
}

function renderReportEmptyState() {
  els.reportStatus.className = 'callout report-status warning';
  els.reportStatus.innerHTML = [
    '<strong>No report loaded</strong>',
    '<span>Load an actor or radius report to inspect stored evidence, observations, provenance, warnings, and raw IDs. Queue previews are not evidence.</span>'
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
    `<span>${escapeHtml(reportLabel(report))} - ${escapeHtml(report.scope?.evidence_window?.label || 'unknown window')} - ${escapeHtml(counts.killmail_count ?? 0)} killmails / ${escapeHtml(counts.activity_event_count ?? 0)} activity events. Observations are scoped presentations of stored evidence, not assessment.</span>`
  ].join('');
}

function renderAssessmentContext() {
  const report = state.actorReport;
  if (!report) {
    renderAssessmentReadiness('warning', 'Assessment memory not ready', 'Load an actor report before saving assessment memory. Radius reports remain context-only in this slice.');
    renderRows(els.assessmentContext, [
      ['Context', 'Load an actor report before saving assessment memory.'],
      ['Source Report', 'none'],
      ['Cited Killmail IDs', 'none'],
      ['Citation Basis', 'No local killmail sample loaded.'],
      ['Local Verification', 'Not available until save because no actor report is loaded.'],
      ['Score Rule', 'Scores are optional; any score requires an assessment reason.'],
      ['Boundary', 'Assessment artifacts are memory, not raw evidence.']
    ]);
    return;
  }
  const actor = report.scope?.actor || {};
  const counts = report.evidence_basis?.evidence_range || {};
  const citedKillmailIds = report.raw_ids?.killmail_ids || [];
  const hasEvidence = (counts.killmail_count ?? 0) > 0 || citedKillmailIds.length > 0;
  renderAssessmentReadiness(
    hasEvidence ? 'ready' : 'warning',
    hasEvidence ? 'Actor report eligible for Assessment Memory' : 'Actor report loaded without local killmail citations',
    hasEvidence
      ? 'Review the cited stored evidence sample, enter an operator reason or summary, confirm the boundary, then save deliberately.'
      : 'You can inspect the report, but assessment memory should cite stored killmail evidence when possible.'
  );
  renderRows(els.assessmentContext, [
    ['Actor', actorLabel(report)],
    ['Source Report', report.report_type || 'actor'],
    ['Evidence Window', report.scope?.evidence_window?.label || 'unknown'],
    ['Sample Status', report.evidence_basis?.sample_status || 'unknown'],
    ['Killmails', counts.killmail_count ?? 0],
    ['Activity Events', counts.activity_event_count ?? 0],
    ['Cited Killmail IDs', citedKillmailIds.length ? citedKillmailIds.join(', ') : 'none'],
    ['Citation Basis', citedKillmailIds.length ? 'stored expanded ESI killmail IDs from this actor report sample' : 'no local killmail IDs available in this report sample'],
    ['Local Verification', citedKillmailIds.length ? 'will verify cited killmail IDs and actor-scope activity locally on save' : 'not applicable until a cited local killmail sample exists'],
    ['Citation Status', 'validated locally on save'],
    ['Assessment Write', 'operator reason/summary plus confirmation required before assessment.create'],
    ['Score Rule', 'Scores are optional; any score requires an assessment reason.'],
    ['Boundary', 'This saves assessment memory over reviewed stored evidence; it does not change raw evidence, observations, discovery refs, metadata hydration, or watches.']
  ]);
}

function renderAssessmentReadiness(kind, title, body) {
  els.assessmentReadinessStatus.className = `callout ${kind}`;
  els.assessmentReadinessStatus.innerHTML = [
    `<strong>${escapeHtml(title)}</strong>`,
    `<span>${escapeHtml(body)}</span>`
  ].join('');
}

function renderMetadataHydrationContext() {
  const ids = metadataHydrationCandidateIds();
  const report = currentLoadedReport();
  if (!report) {
    renderRows(els.metadataHydrationCandidates, [
      ['Context', 'Load an actor or radius report before previewing hydration.'],
      ['Boundary', 'Hydration patches cached labels only.']
    ]);
    els.metadataHydrationNormalized.textContent = 'Load a report to preview hydration candidates.';
    return;
  }
  renderRows(els.metadataHydrationCandidates, [
    ['Report', reportLabel(report)],
    ['Candidate Entity IDs', ids.length ? ids.join(', ') : 'none'],
    ['Expected ESI Name Calls', ids.length ? '1' : '0'],
    ['Static Type IDs', (report.raw_ids?.type_ids || []).length ? 'Use local SDE metadata, not live ESI.' : 'none in report'],
    ['Boundary', 'Metadata hydration improves readability only; evidence IDs and raw killmails are unchanged.']
  ]);
  els.metadataHydrationNormalized.textContent = JSON.stringify({
    target: state.loadedReportType || report.report_type,
    scope: report.scope || null,
    candidate_entity_ids: ids,
    excluded_type_ids: report.raw_ids?.type_ids || [],
    expected_esi_name_calls: ids.length ? 1 : 0
  }, null, 2);
}

function metadataHydrationCandidateIds() {
  const rawIds = currentLoadedReport()?.raw_ids || {};
  return [...new Set([
    ...(rawIds.character_ids || []),
    ...(rawIds.corporation_ids || []),
    ...(rawIds.alliance_ids || [])
  ].map(Number).filter((value) => Number.isInteger(value) && value > 0))]
    .sort((a, b) => a - b);
}

async function metadataHydrationPreflight() {
  if (!currentLoadedReport()) {
    throw new Error('Load an actor or radius report before metadata hydration');
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
    excluded_type_ids: currentLoadedReport()?.raw_ids?.type_ids || []
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
    const task = await service.invoke('metadata.hydration', {
      ...preflight.payload,
      confirmation: 'confirm:metadata.hydration'
    }, {
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
    if (state.loadedReportType === 'radius') {
      await loadRadiusReport();
    } else {
      await loadActorReport();
    }
    els.metadataHydrationConfirm.checked = false;
  } catch (error) {
    renderError(els.metadataHydrationStatus, error);
  } finally {
    setBusy(els.runMetadataHydration, false);
  }
}

function metadataHydrationPayload() {
  const report = currentLoadedReport();
  if (state.loadedReportType === 'radius') {
    return cleanObject({
      target: 'radius',
      targetId: report?.scope?.center?.solar_system_id,
      centerSystemId: report?.scope?.center?.solar_system_id,
      entityIds: metadataHydrationCandidateIds()
    });
  }
  const actor = state.actorReport?.scope?.actor || {};
  return cleanObject({
    target: 'actor',
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
}

function currentLoadedReport() {
  return state.loadedReportType === 'radius' ? state.radiusReport : state.actorReport;
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
    const artifact = await service.invoke('assessment.create', {
      ...payload,
      confirmation: 'confirm:assessment.create'
    });
    renderRows(els.assessmentStatus, [
      ['Saved Artifact', artifact.artifact_id],
      ['Entity', artifact.entity_name ? `${artifact.entity_name} [${artifact.entity_type}: ${artifact.entity_id}]` : `${artifact.entity_type}:${artifact.entity_id}`],
      ['Citation Status', artifact.citation?.status || 'not_applicable'],
      ['Cited Killmail IDs', artifact.sample_killmail_ids?.length ? artifact.sample_killmail_ids.join(', ') : 'none'],
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
  renderOverviewStatus(state.readiness, externalApiStatus(state.readiness));
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
      ['Artifact Type', artifact.artifact_type],
      ['Entity', artifactLabel(artifact)],
      ['Status', artifact.status],
      ['Reason', artifact.assessment_reason || 'none'],
      ['Summary', artifact.assessment_summary || 'none'],
      ['Scores', scoreSummary(artifact.scores)],
      ['Evidence Window', `${artifact.evidence_window?.start || 'unknown'} -> ${artifact.evidence_window?.end || 'unknown'}`],
      ['Source Report', artifact.source_report_type || 'none'],
      ['Source Runs', artifact.source_run_ids?.length ? artifact.source_run_ids.join(', ') : 'none'],
      ['Citation Status', artifact.citation?.status || 'not_applicable'],
      ['Sample Killmails', artifact.sample_killmail_ids?.length ?? 0],
      ['Cited Killmail IDs', artifact.sample_killmail_ids?.length ? artifact.sample_killmail_ids.join(', ') : 'none'],
      ['Citation Basis', citationBasisLabel(artifact)],
      ['Appearances', artifact.counts?.appearances ?? 0],
      ['Boundary', artifact.boundary || 'assessment artifacts are assessment memory, not evidence'],
      ['Created', artifact.created_at || 'unknown'],
      ['Updated', artifact.updated_at || 'unknown']
    ]);
  } catch (error) {
    renderError(els.assessmentArtifactDetail, error);
  }
}

function citationBasisLabel(artifact) {
  const details = artifact.citation?.details || {};
  const cited = details.cited_killmail_ids?.length ?? artifact.sample_killmail_ids?.length ?? 0;
  const verified = details.verified_killmail_ids?.length ?? 0;
  const missing = details.missing_killmail_ids?.length ?? 0;
  if (!cited) {
    return 'No sample killmail IDs cited.';
  }
  return `${verified}/${cited} cited killmails verified locally; ${missing} missing.`;
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

function radiusLabel(report) {
  const center = report.scope?.center;
  if (!center) {
    return 'unknown radius scope';
  }
  const label = center.solar_system_name || '[Resolve with ESI]';
  return `${label} [solarSystemID: ${center.solar_system_id}]`;
}

function reportLabel(report) {
  if (report.report_type === 'radius') {
    return radiusLabel(report);
  }
  return actorLabel(report);
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
