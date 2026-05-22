const { buildActorReport, buildActorReportModel, renderActorReport } = require('../reports/actorReport');
const { buildCorporationObservationReport } = require('../reports/corporationObservationReport');
const { buildQueueReport } = require('../reports/queueReport');
const { buildRadiusReport } = require('../reports/radiusReport');
const { buildRunReport } = require('../reports/runReport');
const { buildSystemReport } = require('../reports/systemReport');
const { buildEvidenceWindow, formatEvidenceWindow } = require('../reports/reportUtils');

function buildReportResponse(db, request = {}) {
  const reportType = normalizeReportType(request.reportType || request.type);
  const params = request.params || {};
  const options = request.options || {};
  if (reportType === 'actor') {
    return buildNativeActorReportResponse(db, params, options);
  }
  const text = buildReportText(db, reportType, params, options);
  const parsed = parseReportText(text);
  const evidenceWindow = buildEvidenceWindow(options);

  return {
    report_type: reportType,
    generated_at: new Date().toISOString(),
    scope: {
      report_type: reportType,
      parameters: params,
      evidence_window: {
        ...evidenceWindow,
        label: formatEvidenceWindow(evidenceWindow)
      }
    },
    evidence_basis: {
      text: parsed.sections['Evidence Basis'] || parsed.sections['Run Evidence Basis'] || null,
      sample_status: parsed.sample_status,
      source: evidenceSource(parsed.sections)
    },
    observations: {
      sections: observationSections(parsed.sections)
    },
    collection_provenance: {
      text: parsed.sections['Collection Provenance'] || null,
      diagnostic_text: parsed.sections['Diagnostics Summary'] || null
    },
    warnings: warningRows(parsed.sections.Warnings),
    labels: labelsFromText(text),
    raw_ids: rawIdsFromText(text),
    text
  };
}

function buildNativeActorReportResponse(db, params, options) {
  const model = buildActorReportModel(db, params, options);
  const text = renderActorReport(model);
  return {
    report_type: 'actor',
    generated_at: model.generated_at,
    response_mode: 'native-structured',
    scope: {
      report_type: 'actor',
      parameters: params,
      evidence_window: model.evidence_window,
      actor: model.actor
    },
    evidence_basis: {
      lines: model.sections.evidenceBasis.lines,
      text: model.sections.evidenceBasis.lines.join('\n'),
      sample_status: model.sample_status,
      source: 'zKill discovery + ESI expanded killmails',
      evidence_range: model.evidence_range
    },
    observations: {
      sections: model.observations.map(serializeObservationSection)
    },
    collection_provenance: {
      lines: model.sections.collectionProvenance.lines,
      text: model.sections.collectionProvenance.lines.join('\n'),
      collection: model.collection
    },
    warnings: model.warnings,
    labels: labelsFromText(text),
    raw_ids: model.raw_ids,
    text
  };
}

function buildReportText(db, reportType, params, options) {
  if (reportType === 'actor') {
    return buildActorReport(db, params, options);
  }
  if (reportType === 'corporation') {
    return buildCorporationObservationReport(db, params, options);
  }
  if (reportType === 'queue') {
    return buildQueueReport(db, params);
  }
  if (reportType === 'radius') {
    return buildRadiusReport(db, params.center || params.centerNameOrId || params.system || params.systemId, {
      ...options,
      radiusJumps: params.radiusJumps ?? options.radiusJumps,
      maxRadius: params.maxRadius ?? options.maxRadius,
      maxSystems: params.maxSystems ?? options.maxSystems
    });
  }
  if (reportType === 'run') {
    return buildRunReport(db, params.runId || params.run_id);
  }
  if (reportType === 'system') {
    return buildSystemReport(db, params.system || params.systemId || params.systemNameOrId, options);
  }
  throw new Error(`Unsupported report type: ${reportType}`);
}

function serializeObservationSection(section) {
  return {
    name: section.title,
    title: section.title,
    columns: section.columns.map((column) => column.label),
    rows: section.rows.map((row) => {
      const values = {};
      for (const column of section.columns) {
        values[column.label] = column.value(row);
      }
      return {
        values,
        raw: row
      };
    }),
    text: tableText(section)
  };
}

function tableText(section) {
  if (!section.rows.length) {
    return '(none)';
  }
  const lines = section.rows.map((row) => section.columns
    .map((column) => `${column.label}: ${column.value(row)}`)
    .join(' | '));
  return lines.join('\n');
}

function parseReportText(text) {
  const lines = String(text || '').split(/\r?\n/);
  const title = lines[0] || '';
  const sampleStatusMatch = title.match(/\s-\s([A-Z][A-Z\s]+)$/);
  const sections = {};

  for (let index = 0; index < lines.length - 1; index += 1) {
    const titleLine = lines[index];
    const underline = lines[index + 1];
    if (!titleLine || !/^=+$/.test(underline) || underline.length !== titleLine.length) {
      continue;
    }
    const body = [];
    index += 2;
    while (index < lines.length) {
      const maybeTitle = lines[index];
      const maybeUnderline = lines[index + 1];
      if (maybeTitle && /^=+$/.test(maybeUnderline || '') && maybeUnderline.length === maybeTitle.length) {
        index -= 1;
        break;
      }
      body.push(lines[index]);
      index += 1;
    }
    sections[titleLine] = body.join('\n').trim();
  }

  return {
    title,
    sample_status: sampleStatusMatch ? sampleStatusMatch[1] : null,
    sections
  };
}

function observationSections(sections) {
  const excluded = new Set([
    'Evidence Basis',
    'Run Evidence Basis',
    'Collection Provenance',
    'Diagnostics Summary',
    'Warnings',
    'Evidence Boundary',
    'API Calls',
    'zKill Requests',
    'ESI Requests'
  ]);
  return Object.entries(sections)
    .filter(([name]) => !excluded.has(name))
    .map(([name, text]) => ({ name, text }));
}

function evidenceSource(sections) {
  const basis = sections['Evidence Basis'] || sections['Run Evidence Basis'] || '';
  const match = basis.match(/Source:\s*(.+)/);
  return match ? match[1].trim() : null;
}

function warningRows(text) {
  if (!text || text === '(none)') {
    return [];
  }
  return text.split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [code, ...rest] = line.split(':');
      return {
        code: rest.length ? code.trim() : 'WARNING',
        message: rest.length ? rest.join(':').trim() : line.trim()
      };
    });
}

function labelsFromText(text) {
  const labels = [];
  const pattern = /([^\n\[]+?)\s+\[((?:character|corporation|alliance|solarSystem|type)ID):\s*(\d+)\]/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    labels.push({
      label: match[1].trim(),
      id_label: match[2],
      id: Number(match[3])
    });
  }
  return dedupe(labels, (entry) => `${entry.id_label}:${entry.id}:${entry.label}`);
}

function rawIdsFromText(text) {
  const ids = {
    character_ids: idsFor(text, /characterID:\s*(\d+)/g),
    corporation_ids: idsFor(text, /corporationID:\s*(\d+)/g),
    alliance_ids: idsFor(text, /allianceID:\s*(\d+)/g),
    solar_system_ids: idsFor(text, /solarSystemID:\s*(\d+)/g),
    type_ids: idsFor(text, /typeID:\s*(\d+)/g),
    killmail_ids: idsFor(text, /(?:Killmail\s+|Killmail:\s*)(\d+)/g)
  };
  return ids;
}

function idsFor(text, pattern) {
  const ids = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    ids.push(Number(match[1]));
  }
  return [...new Set(ids)].sort((a, b) => a - b);
}

function dedupe(rows, keyFn) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyFn(row);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeReportType(reportType) {
  const value = String(reportType || '').toLowerCase();
  if (!value) {
    throw new Error('Report type is required');
  }
  return value;
}

module.exports = {
  buildReportResponse,
  parseReportText
};
