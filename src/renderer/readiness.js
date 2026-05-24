// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


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

async function loadCorpusHealth() {
  setBusy(els.loadCorpusHealth, true);
  try {
    const report = await service.invoke('report.corpus_health');
    renderCorpusHealth(report);
  } catch (error) {
    renderError(els.corpusHealthIntegrity, error);
  } finally {
    setBusy(els.loadCorpusHealth, false);
  }
}

async function preflightRuntimeSnapshot() {
  setBusy(els.preflightRuntimeSnapshot, true);
  try {
    const preflight = await service.invoke('runtime.db_snapshot.preflight');
    state.runtimeSnapshotPreflight = preflight;
    renderRuntimeSnapshotPreflight(preflight);
  } catch (error) {
    renderError(els.runtimeSnapshotPreflight, error);
  } finally {
    setBusy(els.preflightRuntimeSnapshot, false);
  }
}

async function createRuntimeSnapshot() {
  setBusy(els.createRuntimeSnapshot, true);
  try {
    if (!els.runtimeSnapshotConfirm.checked) {
      throw new Error('Runtime snapshot creation requires visible confirmation');
    }
    const result = await service.invoke('runtime.db_snapshot.create', {
      confirmation: 'confirm:runtime.db_snapshot.create'
    });
    renderRuntimeSnapshotResult(result);
    els.runtimeSnapshotConfirm.checked = false;
    await preflightRuntimeSnapshot();
  } catch (error) {
    renderError(els.runtimeSnapshotResult, error);
  } finally {
    setBusy(els.createRuntimeSnapshot, false);
  }
}

async function createDebugTracePack() {
  setBusy(els.createDebugTracePack, true);
  try {
    const result = await service.invoke('support.debug_trace_pack', {
      confirmation: 'confirm:support.debug_trace_pack'
    });
    renderDebugTracePackResult(result);
  } catch (error) {
    renderError(els.debugTracePackResult, error);
  } finally {
    setBusy(els.createDebugTracePack, false);
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
  renderInvestigationContext(readiness);
}

function renderDebugTracePackResult(result) {
  const pack = result.pack || {};
  renderRows(els.debugTracePackResult, [
    ['Status', 'support/debug trace pack written'],
    ['Output Path', result.output_path || 'unknown'],
    ['Generated At', pack.generated_at || 'unknown'],
    ['Classification', pack.classification || 'support/debug artifact; not evidence, not observation, not assessment'],
    ['Included', 'fetch runs, API request logs, task history, warnings, queue status, corpus health, readiness, smoke artifact paths'],
    ['Excluded', (pack.exclusions || ['raw_esi_payload']).join(', ')],
    ['Boundary', 'No zKill/ESI calls; no evidence, observation, or assessment creation; raw expanded ESI payloads excluded.']
  ]);
}

function renderCorpusHealth(report) {
  const health = report.health || {};
  const counts = health.counts || [];
  const freshness = health.freshness || {};
  renderRows(els.corpusHealthCounts, [
    ['Classification', health.classification || 'read-only local corpus health; not observation and not assessment'],
    ['Killmails', countValue(counts, 'killmails')],
    ['Activity Events', countValue(counts, 'activity_events')],
    ['Discovery Refs', countValue(counts, 'discovered_killmail_refs')],
    ['Assessment Artifacts', countValue(counts, 'assessment_artifacts')],
    ['API Logs', countValue(counts, 'api_request_logs')]
  ]);
  renderRows(els.corpusHealthFreshness, [
    ['Latest Fetch Run', freshness.latest_fetch_run?.run_id || 'none'],
    ['Fetch Status', freshness.latest_fetch_run?.status || 'none'],
    ['Latest Evidence', freshness.latest_evidence_time || 'none'],
    ['Latest Metadata Run', freshness.latest_metadata_run?.run_id || 'none'],
    ['Topology Build', freshness.latest_sde_topology?.build_number || 'none'],
    ['Inventory Build', freshness.latest_sde_inventory?.build_number || 'none'],
    ['Boundary', 'Local SQLite only; no zKill, ESI, SDE zip parsing, observation, or assessment.']
  ]);
  renderCorpusIntegrity(health.integrity || []);
  renderCorpusWarnings(health.warnings_by_type || []);
}

function renderRuntimeSnapshotPreflight(preflight) {
  renderRows(els.runtimeSnapshotPreflight, [
    ['Source DB', preflight.database_path || 'unknown'],
    ['Destination', preflight.destination_path || 'unknown'],
    ['DB Size', `${preflight.database?.size_bytes ?? 0} bytes`],
    ['WAL', preflight.journal_files?.wal?.exists ? `${preflight.journal_files.wal.size_bytes} bytes` : 'none'],
    ['SHM', preflight.journal_files?.shm?.exists ? `${preflight.journal_files.shm.size_bytes} bytes` : 'none'],
    ['Killmails', preflight.table_counts?.killmails ?? 0],
    ['Activity Events', preflight.table_counts?.activity_events ?? 0],
    ['Latest Fetch Run', preflight.latest_fetch_run?.run_id || 'none'],
    ['Latest Evidence', preflight.latest_evidence_timestamp || 'none'],
    ['Assessment Artifacts', assessmentCountSummary(preflight.assessment_artifacts || [])],
    ['Boundary', preflight.boundary || 'Preflight is read-only and does not write files.']
  ]);
}

function renderRuntimeSnapshotResult(result) {
  renderRows(els.runtimeSnapshotResult, [
    ['Status', result.status || 'unknown'],
    ['Snapshot Path', result.snapshot_path || 'unknown'],
    ['Snapshot Size', `${result.snapshot?.size_bytes ?? 0} bytes`],
    ['Created At', result.created_at || 'unknown'],
    ['Killmails', result.table_counts?.killmails ?? 0],
    ['Activity Events', result.table_counts?.activity_events ?? 0],
    ['Boundary', result.boundary || 'Snapshot creation does not prune, compact, or delete evidence.']
  ]);
}

function assessmentCountSummary(rows) {
  return rows.length
    ? rows.map((row) => `${row.status}: ${row.count}`).join('; ')
    : 'none';
}

function renderCorpusIntegrity(rows) {
  els.corpusHealthIntegrity.innerHTML = '';
  if (!rows.length) {
    els.corpusHealthIntegrity.textContent = 'No integrity checks returned.';
    return;
  }
  rows.forEach((entry) => {
    const row = document.createElement('div');
    row.className = `message ${entry.status === 'attention' ? 'warning' : 'ready'}`;
    row.innerHTML = `<span>${escapeHtml(entry.check)}</span><span>${escapeHtml(entry.count)} - ${escapeHtml(entry.status)}</span>`;
    els.corpusHealthIntegrity.appendChild(row);
  });
}

function renderCorpusWarnings(rows) {
  els.corpusHealthWarnings.innerHTML = '';
  if (!rows.length) {
    els.corpusHealthWarnings.textContent = 'No data quality warnings grouped in the local corpus.';
    return;
  }
  rows.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'message warning';
    row.innerHTML = `<span>${escapeHtml(entry.warning_type)}</span><span>${escapeHtml(entry.count)} warnings; latest ${escapeHtml(entry.latest || 'unknown')}</span>`;
    els.corpusHealthWarnings.appendChild(row);
  });
}

function countValue(counts, area) {
  return counts.find((row) => row.area === area)?.rows ?? 0;
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
  if (readiness.warnings?.some((entry) => entry.code === 'SDE_LOOKUP_MISSING')) {
    return {
      kind: 'warning',
      title: 'Build Local Lookup Tables',
      body: 'Downloads the official EVE Static Data Export, imports the system topology and inventory type metadata Atlas needs, records source provenance, then removes the downloaded source files. Reports use the resulting local SQLite lookup tables only.'
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
