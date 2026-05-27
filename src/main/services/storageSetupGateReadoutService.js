const { buildStorageAuthorityPreflight } = require('./storageAuthorityPreflightService');

const BUDGET_WARNING_RATIO = 0.7;
const BUDGET_STRONG_WARNING_RATIO = 0.95;
const BUDGET_HARD_LOCK_RATIO = 1;

function buildStorageSetupGateReadout(input = {}, context = {}) {
  const preflight = storagePreflightFor(input, context);
  const budgetBytes = budgetBytesFor(input, context);
  const usageBytes = usageBytesFor(preflight);
  const storagePosture = classifyStoragePosture(preflight);
  const budgetPosture = classifyBudgetPosture({ budgetBytes, usageBytes });
  const locked = storagePosture.blocks_real_collection === true || budgetPosture.blocks_writes === true;

  return {
    action: 'storage.setup_gate_readout',
    classification: 'read-only storage setup gate posture',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    enforcement_state: 'not_implemented_readout_only',
    storage: storagePosture,
    budget: budgetPosture,
    work_classes: workClasses({ locked, storagePosture, budgetPosture }),
    source: {
      preflight_action: preflight.action || 'fixture.storage_authority_preflight',
      database_mode: preflight.database?.mode || null,
      database_source: preflight.database?.source || null,
      byte_usage_source: 'storage.authority_preflight byte_usage; main Atlas storage budget is readout-only in HS115',
      renderer_payload_storage_facts_ignored: context.source === 'renderer'
    },
    boundary: [
      'Read-only setup gate readout only; it does not enforce storage lockout.',
      'It does not write storage config, choose a final storage config path, or persist a budget.',
      'It does not move, copy, migrate, create, relocate, restore, or delete active DB files.',
      'It does not call providers, create Evidence/EVEidence, hydrate metadata, prune/delete records, change schema, or redesign renderer UI.',
      'Budget means Atlas-controlled disk usage under storage authority, not provider/API request pacing.'
    ]
  };
}

function storagePreflightFor(input = {}, context = {}) {
  if (context.allowStorageSetupGateFixtureInput === true && input.storagePreflight) {
    return input.storagePreflight;
  }
  if (context.storagePreflight) {
    return context.storagePreflight;
  }
  return buildStorageAuthorityPreflight({}, {
    ...context,
    allowStorageAuthorityPathOverrides: false
  });
}

function budgetBytesFor(input = {}, context = {}) {
  if (Number.isFinite(Number(context.storageBudgetBytes))) {
    return Number(context.storageBudgetBytes);
  }
  if (context.allowStorageSetupGateFixtureInput === true && Number.isFinite(Number(input.storageBudgetBytes))) {
    return Number(input.storageBudgetBytes);
  }
  return null;
}

function usageBytesFor(preflight = {}) {
  const byteUsage = preflight.byte_usage || {};
  return Number(byteUsage.known_controlled_locations_bytes || 0) + Number(byteUsage.database_bytes || 0);
}

function classifyStoragePosture(preflight = {}) {
  const database = preflight.database || {};
  const mode = database.mode || 'missing';
  const exists = database.exists === true;
  const parentAvailable = database.parent?.exists === true && database.parent?.is_directory !== false;
  const outsidePolicy = database.mode_flags?.outside_policy === true || mode === 'outside_policy';
  const demoFixture = mode === 'demo_fixture';
  const snapshotStatus = preflight.snapshot?.settings?.status || null;
  const degradedSettings = snapshotStatus === 'degraded';

  if (demoFixture) {
    return posture({
      state: 'demo_fixture_only',
      setup_gate: 'demo_fixture_only',
      real_alpha_collection: 'blocked_until_explicit_storage',
      blocks_real_collection: true,
      reason: 'Demo/fixture posture is allowed only for separated demo or fixture work.',
      database
    });
  }
  if (!exists || mode === 'missing' || !parentAvailable) {
    return posture({
      state: 'missing_unavailable_blocked',
      setup_gate: 'setup_required',
      real_alpha_collection: 'blocked',
      blocks_real_collection: true,
      reason: 'Configured or expected storage is missing or unavailable; Atlas should not silently relocate.',
      database
    });
  }
  if (outsidePolicy || degradedSettings) {
    return posture({
      state: 'invalid_degraded_setup_required',
      setup_gate: 'setup_required',
      real_alpha_collection: 'blocked',
      blocks_real_collection: true,
      reason: outsidePolicy
        ? 'Storage is outside current policy without accepted authority.'
        : 'Storage support settings are degraded and need operator attention.',
      database
    });
  }
  if (mode === 'configured') {
    return posture({
      state: 'configured_ready',
      setup_gate: 'ready',
      real_alpha_collection: 'ready_subject_to_budget_and_other_gates',
      blocks_real_collection: false,
      reason: 'Explicit configured storage is present.',
      database
    });
  }
  if (mode === 'fallback') {
    return posture({
      state: 'fallback_ack_required',
      setup_gate: 'operator_ack_required',
      real_alpha_collection: 'blocked_until_explicit_acknowledgement',
      blocks_real_collection: true,
      reason: 'Project/current-file fallback exists but real/alpha collection should wait for explicit operator acknowledgement.',
      database
    });
  }
  return posture({
    state: 'invalid_degraded_setup_required',
    setup_gate: 'setup_required',
    real_alpha_collection: 'blocked',
    blocks_real_collection: true,
    reason: `Unhandled storage mode ${mode}; setup review required.`,
    database
  });
}

function posture({ state, setup_gate, real_alpha_collection, blocks_real_collection, reason, database }) {
  return {
    state,
    setup_gate,
    real_alpha_collection,
    blocks_real_collection,
    reason,
    database: {
      mode: database.mode || null,
      source: database.source || null,
      path: database.path || null,
      exists: database.exists === true,
      parent_exists: database.parent?.exists === true,
      outside_policy: database.mode_flags?.outside_policy === true,
      demo_fixture: database.mode_flags?.demo_fixture === true
    }
  };
}

function classifyBudgetPosture({ budgetBytes, usageBytes }) {
  if (!Number.isFinite(Number(budgetBytes)) || Number(budgetBytes) <= 0) {
    return {
      state: 'budget_unconfigured',
      budget_bytes: null,
      usage_bytes: usageBytes,
      usage_ratio: null,
      warning_level: 'unconfigured',
      blocks_writes: false,
      reason: 'No main Atlas storage budget is configured for this readout.'
    };
  }
  const normalizedBudget = Number(budgetBytes);
  const ratio = normalizedBudget > 0 ? usageBytes / normalizedBudget : 0;
  if (ratio >= BUDGET_HARD_LOCK_RATIO) {
    return budgetState('budget_hard_lock', normalizedBudget, usageBytes, ratio, 'hard_lock', true);
  }
  if (ratio >= BUDGET_STRONG_WARNING_RATIO) {
    return budgetState('budget_strong_warning', normalizedBudget, usageBytes, ratio, 'strong_warning', false);
  }
  if (ratio >= BUDGET_WARNING_RATIO) {
    return budgetState('budget_warning', normalizedBudget, usageBytes, ratio, 'warning', false);
  }
  return budgetState('within_budget', normalizedBudget, usageBytes, ratio, 'none', false);
}

function budgetState(state, budgetBytes, usageBytes, ratio, warningLevel, blocksWrites) {
  return {
    state,
    budget_bytes: budgetBytes,
    usage_bytes: usageBytes,
    usage_ratio: Number(ratio.toFixed(4)),
    warning_level: warningLevel,
    blocks_writes: blocksWrites,
    thresholds: {
      warning_at_ratio: BUDGET_WARNING_RATIO,
      strong_warning_at_ratio: BUDGET_STRONG_WARNING_RATIO,
      hard_lock_at_ratio: BUDGET_HARD_LOCK_RATIO
    }
  };
}

function workClasses({ locked, storagePosture, budgetPosture }) {
  const localRecordsAvailable = storagePosture.database.exists === true;
  return {
    locked,
    allowed_while_locked: [
      'storage setup/re-establish',
      'settings needed to fix storage',
      'read-only help/status',
      'clearly separated demo/fixture mode'
    ],
    blocked_while_locked: [
      'provider-backed acquisition',
      'Evidence/EVEidence writes',
      'hydration writes',
      'snapshots/support artifacts when over budget or path invalid',
      'destructive pruning/deletion execution'
    ],
    local_read_report: {
      state: localRecordsAvailable ? 'available_if_records_accessible' : 'blocked_storage_unavailable',
      blocked: !localRecordsAvailable,
      reason: localRecordsAvailable
        ? 'Local read/report behavior is separate from provider-backed acquisition and writes.'
        : 'Local records cannot be read when required storage is unavailable.'
    },
    blocked_reasons: [
      storagePosture.blocks_real_collection ? storagePosture.state : null,
      budgetPosture.blocks_writes ? budgetPosture.state : null
    ].filter(Boolean)
  };
}

module.exports = {
  buildStorageSetupGateReadout
};
