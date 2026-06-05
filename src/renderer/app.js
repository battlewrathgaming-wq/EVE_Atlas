const service = window.atlasServices;
const windowBridge = window.atlasWindow;

const state = {
  commands: [],
  readiness: null,
  scopeDefaults: null,
  queueSelection: null,
  watchSchedule: null,
  watchOfflineReadout: null,
  systemWatchConfirmation: null,
  tasks: [],
  selectedTaskId: null,
  selectedTask: null,
  actorReport: null,
  actorReportRequest: null,
  radiusReport: null,
  radiusReportRequest: null,
  loadedReportType: null,
  assessmentArtifacts: [],
  selectedAssessmentArtifact: null,
  window: {
    alwaysOnTop: false
  }
};

const els = {
  serviceState: document.querySelector('#service-state'),
  externalApiState: document.querySelector('#external-api-state'),
  viewTitle: document.querySelector('#view-title'),
  sideLeadSummary: document.querySelector('#side-lead-summary'),
  navItems: [...document.querySelectorAll('.nav-item')],
  modeButtons: [...document.querySelectorAll('.mode-button')],
  views: [...document.querySelectorAll('.view')],
  investigationLeadType: document.querySelector('#investigation-lead-type'),
  investigationActorType: document.querySelector('#investigation-actor-type'),
  investigationLeadValue: document.querySelector('#investigation-lead-value'),
  investigationRadius: document.querySelector('#investigation-radius'),
  investigationCheckScope: document.querySelector('#investigation-check-scope'),
  investigationLoadDetail: document.querySelector('#investigation-load-detail'),
  investigationDiscoverLeads: document.querySelector('#investigation-discover-leads'),
  investigationReviewQueue: document.querySelector('#investigation-review-queue'),
  investigationOpenReports: document.querySelector('#investigation-open-reports'),
  investigationOpenDetailReport: document.querySelector('#investigation-open-detail-report'),
  investigationOpenReadiness: document.querySelector('#investigation-open-readiness'),
  investigationOpenTasks: document.querySelector('#investigation-open-tasks'),
  investigationOpenActions: document.querySelector('#investigation-open-actions'),
  investigationOpenQueueDetail: document.querySelector('#investigation-open-queue-detail'),
  investigationLiveContext: document.querySelector('#investigation-live-context'),
  investigationLeadFeedback: document.querySelector('#investigation-lead-feedback'),
  investigationQueueContextStatus: document.querySelector('#investigation-queue-context-status'),
  investigationQueueContextSummary: document.querySelector('#investigation-queue-context-summary'),
  investigationQueuePanel: document.querySelector('#investigation-queue-panel'),
  investigationDetailPanel: document.querySelector('#investigation-detail-panel'),
  investigationDetailStatus: document.querySelector('#investigation-detail-status'),
  investigationEvidenceSummary: document.querySelector('#investigation-evidence-summary'),
  investigationObservationPreview: document.querySelector('#investigation-observation-preview'),
  investigationStoredContext: document.querySelector('#investigation-stored-context'),
  investigationObservationPanel: document.querySelector('#investigation-observation-panel'),
  investigationObservationTimeline: document.querySelector('#investigation-observation-timeline'),
  investigationAssessmentDrawer: document.querySelector('#investigation-assessment-drawer'),
  investigationAssessmentDrawerText: document.querySelector('#investigation-assessment-drawer-text'),
  investigationOpenAssessmentDrawer: document.querySelector('#investigation-open-assessment-drawer'),
  investigationTopRecordsPanel: document.querySelector('#investigation-top-records-panel'),
  investigationTopRecords: document.querySelector('#investigation-top-records'),
  investigationSourceStrip: document.querySelector('#investigation-source-strip'),
  overviewStoredEvidenceStatus: document.querySelector('#overview-stored-evidence-status'),
  overviewPossibleLeadsStatus: document.querySelector('#overview-possible-leads-status'),
  overviewWatchStatus: document.querySelector('#overview-watch-status'),
  overviewAssessmentStatus: document.querySelector('#overview-assessment-status'),
  overviewOpenStoredEvidence: document.querySelector('#overview-open-stored-evidence'),
  overviewOpenPossibleLeads: document.querySelector('#overview-open-possible-leads'),
  overviewOpenWatchStatus: document.querySelector('#overview-open-watch-status'),
  overviewOpenAssessmentMemory: document.querySelector('#overview-open-assessment-memory'),
  readinessSummary: document.querySelector('#readiness-summary'),
  nextAction: document.querySelector('#next-action'),
  apiState: document.querySelector('#api-state'),
  pathState: document.querySelector('#path-state'),
  topologyState: document.querySelector('#topology-state'),
  inventoryState: document.querySelector('#inventory-state'),
  readinessMessages: document.querySelector('#readiness-messages'),
  preflightRuntimeSnapshot: document.querySelector('#preflight-runtime-snapshot'),
  createRuntimeSnapshot: document.querySelector('#create-runtime-snapshot'),
  runtimeSnapshotConfirm: document.querySelector('#runtime-snapshot-confirm'),
  runtimeSnapshotPreflight: document.querySelector('#runtime-snapshot-preflight'),
  runtimeSnapshotResult: document.querySelector('#runtime-snapshot-result'),
  loadCorpusHealth: document.querySelector('#load-corpus-health'),
  corpusHealthCounts: document.querySelector('#corpus-health-counts'),
  corpusHealthFreshness: document.querySelector('#corpus-health-freshness'),
  corpusHealthIntegrity: document.querySelector('#corpus-health-integrity'),
  corpusHealthWarnings: document.querySelector('#corpus-health-warnings'),
  createDebugTracePack: document.querySelector('#create-debug-trace-pack'),
  debugTracePackResult: document.querySelector('#debug-trace-pack-result'),
  prepareApp: document.querySelector('#prepare-app'),
  refreshReadiness: document.querySelector('#refresh-readiness'),
  validateScope: document.querySelector('#validate-scope'),
  scopeKind: document.querySelector('#scope-kind'),
  scopeDiscoveryType: document.querySelector('#scope-discovery-type'),
  scopeActorType: document.querySelector('#scope-actor-type'),
  scopeActorId: document.querySelector('#scope-actor-id'),
  scopeActorName: document.querySelector('#scope-actor-name'),
  scopeSystemId: document.querySelector('#scope-system-id'),
  scopeSystemName: document.querySelector('#scope-system-name'),
  scopeRadius: document.querySelector('#scope-radius'),
  scopeLookback: document.querySelector('#scope-lookback'),
  scopeMaxRefs: document.querySelector('#scope-max-refs'),
  scopeMaxSystems: document.querySelector('#scope-max-systems'),
  scopeMaxExpansions: document.querySelector('#scope-max-expansions'),
  scopeDiscoveredByType: document.querySelector('#scope-discovered-by-type'),
  scopeDiscoveredById: document.querySelector('#scope-discovered-by-id'),
  scopeKillmailIds: document.querySelector('#scope-killmail-ids'),
  scopeDefaults: document.querySelector('#scope-defaults'),
  scopeValidation: document.querySelector('#scope-validation'),
  scopeNormalized: document.querySelector('#scope-normalized'),
  refreshTasks: document.querySelector('#refresh-tasks'),
  taskList: document.querySelector('#task-list'),
  taskDetail: document.querySelector('#task-detail'),
  taskProgress: document.querySelector('#task-progress'),
  taskOutput: document.querySelector('#task-output'),
  cancelTask: document.querySelector('#cancel-task'),
  previewQueueSelection: document.querySelector('#preview-queue-selection'),
  queueDiscoveredByType: document.querySelector('#queue-discovered-by-type'),
  queueDiscoveredById: document.querySelector('#queue-discovered-by-id'),
  queueSelectionMode: document.querySelector('#queue-selection-mode'),
  queueMaxExpansions: document.querySelector('#queue-max-expansions'),
  queueKillmailIds: document.querySelector('#queue-killmail-ids'),
  queueConfirmExpansion: document.querySelector('#queue-confirm-expansion'),
  preflightManualExpansion: document.querySelector('#preflight-manual-expansion'),
  runManualExpansion: document.querySelector('#run-manual-expansion'),
  queueSelectionSummary: document.querySelector('#queue-selection-summary'),
  manualExpansionPreflight: document.querySelector('#manual-expansion-preflight'),
  manualExpansionNormalized: document.querySelector('#manual-expansion-normalized'),
  manualExpansionTask: document.querySelector('#manual-expansion-task'),
  queueRefList: document.querySelector('#queue-ref-list'),
  refreshWatchStatus: document.querySelector('#refresh-watch-status'),
  rScannerState: document.querySelector('#r-scanner-state'),
  rScannerFaceState: document.querySelector('#r-scanner-face-state'),
  rScannerSummary: document.querySelector('#r-scanner-summary'),
  rScannerSignals: document.querySelector('#r-scanner-signals'),
  rScannerBoundary: document.querySelector('#r-scanner-boundary'),
  rScannerWatchOfflineDetail: document.querySelector('#r-scanner-watch-offline-detail'),
  watchSessionArmed: document.querySelector('#watch-session-armed'),
  watchLiveApiEnabled: document.querySelector('#watch-live-api-enabled'),
  armWatchSession: document.querySelector('#arm-watch-session'),
  disarmWatchSession: document.querySelector('#disarm-watch-session'),
  watchSummary: document.querySelector('#watch-summary'),
  watchExecutorState: document.querySelector('#watch-executor-state'),
  watchAuthorActorType: document.querySelector('#watch-author-actor-type'),
  watchAuthorActorId: document.querySelector('#watch-author-actor-id'),
  watchAuthorActorName: document.querySelector('#watch-author-actor-name'),
  watchAuthorActorLookback: document.querySelector('#watch-author-actor-lookback'),
  watchAuthorActorExpansions: document.querySelector('#watch-author-actor-expansions'),
  watchAuthorActorPoll: document.querySelector('#watch-author-actor-poll'),
  watchAuthorActorNotes: document.querySelector('#watch-author-actor-notes'),
  saveActorWatch: document.querySelector('#save-actor-watch'),
  watchAuthorSystemId: document.querySelector('#watch-author-system-id'),
  watchAuthorRadius: document.querySelector('#watch-author-radius'),
  watchAuthorSystemLookback: document.querySelector('#watch-author-system-lookback'),
  watchAuthorMaxSystems: document.querySelector('#watch-author-max-systems'),
  watchAuthorSystemExpansions: document.querySelector('#watch-author-system-expansions'),
  watchAuthorSystemPoll: document.querySelector('#watch-author-system-poll'),
  watchAuthorSystemNotes: document.querySelector('#watch-author-system-notes'),
  previewSystemWatchScope: document.querySelector('#preview-system-watch-scope'),
  confirmSystemWatchScope: document.querySelector('#confirm-system-watch-scope'),
  systemWatchScopePreview: document.querySelector('#system-watch-scope-preview'),
  saveSystemWatch: document.querySelector('#save-system-watch'),
  watchAuthoringStatus: document.querySelector('#watch-authoring-status'),
  watchList: document.querySelector('#watch-list'),
  preflightManualDiscovery: document.querySelector('#preflight-manual-discovery'),
  runManualDiscovery: document.querySelector('#run-manual-discovery'),
  actionDiscoveryScope: document.querySelector('#action-discovery-scope'),
  actionActorType: document.querySelector('#action-actor-type'),
  actionActorId: document.querySelector('#action-actor-id'),
  actionActorName: document.querySelector('#action-actor-name'),
  actionSystemId: document.querySelector('#action-system-id'),
  actionSystemName: document.querySelector('#action-system-name'),
  actionRadius: document.querySelector('#action-radius'),
  actionLookback: document.querySelector('#action-lookback'),
  actionMaxRefs: document.querySelector('#action-max-refs'),
  actionMaxSystems: document.querySelector('#action-max-systems'),
  actionMaxRefsPerSystem: document.querySelector('#action-max-refs-per-system'),
  actionConfirmLive: document.querySelector('#action-confirm-live'),
  manualDiscoveryPreflight: document.querySelector('#manual-discovery-preflight'),
  manualDiscoveryTask: document.querySelector('#manual-discovery-task'),
  manualDiscoveryNormalized: document.querySelector('#manual-discovery-normalized'),
  loadActorReport: document.querySelector('#load-actor-report'),
  actorReportType: document.querySelector('#actor-report-type'),
  actorReportId: document.querySelector('#actor-report-id'),
  actorReportName: document.querySelector('#actor-report-name'),
  actorReportLookback: document.querySelector('#actor-report-lookback'),
  loadRadiusReport: document.querySelector('#load-radius-report'),
  radiusReportCenter: document.querySelector('#radius-report-center'),
  radiusReportJumps: document.querySelector('#radius-report-jumps'),
  radiusReportLookback: document.querySelector('#radius-report-lookback'),
  radiusReportMaxSystems: document.querySelector('#radius-report-max-systems'),
  reportStatus: document.querySelector('#report-status'),
  actorEvidence: document.querySelector('#actor-evidence'),
  actorProvenance: document.querySelector('#actor-provenance'),
  actorObservations: document.querySelector('#actor-observations'),
  actorWarnings: document.querySelector('#actor-warnings'),
  actorRawIds: document.querySelector('#actor-raw-ids'),
  metadataHydrationCandidates: document.querySelector('#metadata-hydration-candidates'),
  metadataHydrationConfirm: document.querySelector('#metadata-hydration-confirm'),
  preflightMetadataHydration: document.querySelector('#preflight-metadata-hydration'),
  runMetadataHydration: document.querySelector('#run-metadata-hydration'),
  metadataHydrationStatus: document.querySelector('#metadata-hydration-status'),
  metadataHydrationNormalized: document.querySelector('#metadata-hydration-normalized'),
  assessmentBoundary: document.querySelector('#assessment-boundary'),
  assessmentReason: document.querySelector('#assessment-reason'),
  assessmentSummary: document.querySelector('#assessment-summary'),
  assessmentInterestScore: document.querySelector('#assessment-interest-score'),
  assessmentPriorityScore: document.querySelector('#assessment-priority-score'),
  assessmentImpactScore: document.querySelector('#assessment-impact-score'),
  assessmentConfidence: document.querySelector('#assessment-confidence'),
  assessmentConfirm: document.querySelector('#assessment-confirm'),
  saveAssessmentArtifact: document.querySelector('#save-assessment-artifact'),
  refreshAssessmentArtifacts: document.querySelector('#refresh-assessment-artifacts'),
  assessmentReadinessStatus: document.querySelector('#assessment-readiness-status'),
  assessmentContext: document.querySelector('#assessment-context'),
  assessmentStatus: document.querySelector('#assessment-status'),
  assessmentArtifactList: document.querySelector('#assessment-artifact-list'),
  assessmentArtifactDetail: document.querySelector('#assessment-artifact-detail'),
  loadQueueReport: document.querySelector('#load-queue-report'),
  reportOutput: document.querySelector('#report-output'),
  pinWindow: document.querySelector('#pin-window'),
  minimizeWindow: document.querySelector('#minimize-window'),
  closeWindow: document.querySelector('#close-window')
};

function assertServiceBridge() {
  if (!service?.list || !service?.invoke) {
    throw new Error('Atlas service bridge is unavailable');
  }
  if (!windowBridge?.getState || !windowBridge?.setAlwaysOnTop) {
    throw new Error('Atlas window bridge is unavailable');
  }
}

async function init() {
  try {
    assertServiceBridge();
    setServiceState('External API: checking');
    state.commands = await service.list();
    state.window = await windowBridge.getState();
    renderWindowState();
    setServiceState('External API: checking');
    bindEvents();
    renderReportEmptyState();
    renderMetadataHydrationContext();
    renderAssessmentContext();
    await Promise.all([
      loadReadiness(),
      loadScopeDefaults(),
      loadQueueSelection(),
      loadWatchStatus(),
      loadWatchExecutorStatus(),
      loadTasks(),
      loadAssessmentArtifacts(),
      loadQueueReport()
    ]);
  } catch (error) {
    setServiceState('Unavailable');
    renderError(els.readinessMessages, error);
  }
}

function bindEvents() {
  els.navItems.forEach((item) => {
    item.addEventListener('click', () => selectView(item.dataset.view));
  });
  els.modeButtons.forEach((item) => {
    item.addEventListener('click', () => selectView(item.dataset.primaryView));
  });
  bindInvestigationEvents();
  els.refreshReadiness.addEventListener('click', loadReadiness);
  els.preflightRuntimeSnapshot.addEventListener('click', preflightRuntimeSnapshot);
  els.createRuntimeSnapshot.addEventListener('click', createRuntimeSnapshot);
  els.loadCorpusHealth.addEventListener('click', loadCorpusHealth);
  els.createDebugTracePack.addEventListener('click', createDebugTracePack);
  els.prepareApp.addEventListener('click', prepareApp);
  els.validateScope.addEventListener('click', validateScopeInput);
  els.refreshTasks.addEventListener('click', loadTasks);
  els.cancelTask.addEventListener('click', cancelSelectedTask);
  els.previewQueueSelection.addEventListener('click', loadQueueSelection);
  els.preflightManualExpansion.addEventListener('click', preflightManualExpansion);
  els.runManualExpansion.addEventListener('click', runManualExpansion);
  els.refreshWatchStatus.addEventListener('click', loadWatchStatus);
  els.armWatchSession.addEventListener('click', armWatchSession);
  els.disarmWatchSession.addEventListener('click', disarmWatchSession);
  els.saveActorWatch.addEventListener('click', saveActorWatch);
  els.previewSystemWatchScope.addEventListener('click', previewSystemWatchScope);
  [
    els.watchAuthorSystemId,
    els.watchAuthorRadius,
    els.watchAuthorSystemLookback,
    els.watchAuthorMaxSystems,
    els.watchAuthorSystemExpansions,
    els.watchAuthorSystemPoll,
    els.watchAuthorSystemNotes
  ].forEach((input) => {
    input.addEventListener('input', resetSystemWatchConfirmation);
  });
  els.saveSystemWatch.addEventListener('click', saveSystemWatch);
  els.preflightManualDiscovery.addEventListener('click', preflightManualDiscovery);
  els.runManualDiscovery.addEventListener('click', runManualDiscovery);
  els.loadActorReport.addEventListener('click', loadActorReport);
  els.loadRadiusReport.addEventListener('click', loadRadiusReport);
  els.preflightMetadataHydration.addEventListener('click', preflightMetadataHydration);
  els.runMetadataHydration.addEventListener('click', runMetadataHydration);
  els.saveAssessmentArtifact.addEventListener('click', saveAssessmentArtifact);
  els.refreshAssessmentArtifacts.addEventListener('click', loadAssessmentArtifacts);
  els.loadQueueReport.addEventListener('click', loadQueueReport);
  els.pinWindow.addEventListener('click', toggleAlwaysOnTop);
  els.minimizeWindow.addEventListener('click', () => windowBridge.minimize());
  els.closeWindow.addEventListener('click', () => windowBridge.close());
}

function selectView(name) {
  els.navItems.forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  els.modeButtons.forEach((item) => item.classList.toggle('active', item.dataset.primaryView === name));
  els.views.forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  els.viewTitle.textContent = titleForView(name);
}

init();
