const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const protectedWordsRoot = 'F:\\Projects\\Docs\\Aura-Project-Orchestration\\terminology\\protected-words';

const SCAN_ROOTS = [
  'workspace/current.md',
  'workspace/critical',
  'docs/index.md',
  'docs/current-state',
  'docs/contracts',
  'docs/terms',
  'src/main/services',
  'src/main/reports',
  'src/main/watchlist',
  'src/renderer',
  'scripts/verify-renderer-shell.js',
  'scripts/verify-evidence-rule-regressions.js'
];

const EXTENSIONS = new Set(['.md', '.js', '.html', '.sql']);
const DEFAULT_MAX_REPORT = 40;
const SKIP_PATHS = new Set([
  'scripts\\verify-protected-terms.js'
]);

function main() {
  const options = parseArgs(process.argv.slice(2));
  const lookup = loadProtectedLookups();

  const { files, mode, source } = collectScanFiles(options);
  const warnings = [
    ...findBorrowingWarnings(files, lookup),
    ...findBoundaryWarnings(files),
    ...(options.includeAtlasCandidates ? discoverCandidates(files, lookup) : [])
  ].sort(compareWarnings);

  console.log('Atlas protected-term discovery');
  console.log(`mode: ${mode}`);
  console.log(`source: ${source}`);
  console.log('authority: advisory evidence only; shared spelling does not imply shared meaning');
  console.log('protected-word files: lookup inputs, not a universal glossary or rename mandate');
  console.log(`atlas-owned candidate discovery: ${options.includeAtlasCandidates ? 'included by --include-atlas-candidates' : 'filtered by default'}`);
  console.log(`files scanned: ${files.length}`);
  for (const file of files) {
    console.log(`- scanned: ${rel(file)}`);
  }

  if (lookup.failures.length > 0) {
    console.log(`lookup warning count: ${lookup.failures.length}`);
    for (const failure of lookup.failures) {
      console.log(`- lookup-warning: ${failure}`);
    }
  }

  console.log(`warning count: ${warnings.length}`);
  for (const [classification, count] of Object.entries(countByClassification(warnings))) {
    console.log(`- warning-class: ${classification}=${count}`);
  }

  for (const warning of warnings.slice(0, options.maxWarnings)) {
    console.log(`- warning: ${warning.classification} | term=${warning.term} | owner=${warning.owner} | layer=${warning.layer} | file=${warning.file}:${warning.line} | reason=${warning.reason} | disposition=${warning.disposition}`);
  }

  if (warnings.length > options.maxWarnings) {
    console.log(`- ${warnings.length - options.maxWarnings} additional warning-only item(s) omitted from console output`);
  }

  console.log('confirmation: warning-only; no renames performed; no protected-word JSON updates performed');
  console.log('atlas protected-term discovery completed with exit code 0');
}

function parseArgs(args) {
  const options = {
    baseline: false,
    maxWarnings: DEFAULT_MAX_REPORT,
    includeAtlasCandidates: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--baseline') {
      options.baseline = true;
      continue;
    }
    if (arg === '--include-atlas-candidates') {
      options.includeAtlasCandidates = true;
      continue;
    }
    if (arg === '--max-warnings') {
      const value = Number(args[index + 1]);
      if (Number.isInteger(value) && value >= 0) {
        options.maxWarnings = value;
        index += 1;
      }
    }
  }

  return options;
}

function loadProtectedLookups() {
  const failures = [];
  const lookup = {
    failures,
    own: [],
    external: [],
    quarantine: [],
    collisions: [],
    pending: []
  };

  const files = {
    own: 'atlas-protected.json',
    sense: 'sense-protected.json',
    lab: 'lab-protected.json',
    quarantine: 'lab-quarantine.json',
    collisions: 'shared-collisions.json',
    pending: 'pending-candidates.json'
  };

  for (const [key, filename] of Object.entries(files)) {
    const fullPath = path.join(protectedWordsRoot, filename);
    if (!fs.existsSync(fullPath)) {
      failures.push(`missing shared lookup file: ${fullPath}`);
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      failures.push(`could not parse shared lookup file ${fullPath}: ${error.message}`);
      continue;
    }

    const terms = parsed.terms || parsed.candidates || [];
    if (key === 'own') lookup.own.push(...terms);
    if (key === 'sense' || key === 'lab') lookup.external.push(...terms);
    if (key === 'quarantine') lookup.quarantine.push(...terms);
    if (key === 'collisions') lookup.collisions.push(...terms);
    if (key === 'pending') lookup.pending.push(...terms);
  }

  return lookup;
}

function collectScanFiles(options) {
  const changedFiles = collectGitChangedFiles();
  if (changedFiles.length > 0) {
    return {
      files: changedFiles,
      mode: 'working-set',
      source: 'git status --short changed files'
    };
  }

  if (!options.baseline) {
    return {
      files: [],
      mode: 'working-set',
      source: 'working set clean; no changed files scanned; use --baseline for a broad advisory pass'
    };
  }

  const files = [];
  for (const relativeTarget of SCAN_ROOTS) {
    const absoluteTarget = path.join(root, relativeTarget);
    if (!fs.existsSync(absoluteTarget)) continue;
    const stat = fs.statSync(absoluteTarget);
    if (stat.isFile()) {
      if (EXTENSIONS.has(path.extname(absoluteTarget))) files.push(absoluteTarget);
      continue;
    }
    walk(absoluteTarget, files);
  }
  return {
    files: [...new Set(files)].filter(shouldScanFile).sort(),
    mode: 'broad-baseline',
    source: 'explicit --baseline over selected Atlas roots'
  };
}

function collectGitChangedFiles() {
  let output = '';
  try {
    output = execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' });
  } catch (_error) {
    return [];
  }

  const files = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let relative = line.slice(3).trim();
    if (relative.includes(' -> ')) {
      relative = relative.split(' -> ').pop().trim();
    }
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.statSync(absolute);
    if (stat.isFile() && shouldScanFile(absolute)) {
      files.push(absolute);
    }
  }
  return [...new Set(files)].sort();
}

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.tmp') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && shouldScanFile(fullPath)) {
      files.push(fullPath);
    }
  }
}

function shouldScanFile(file) {
  const relative = rel(file);
  if (SKIP_PATHS.has(relative)) return false;
  if (relative.startsWith('docs\\archive\\')) return false;
  if (relative.startsWith('workspace\\archive\\')) return false;
  return EXTENSIONS.has(path.extname(file));
}

function findBorrowingWarnings(files, lookup) {
  const warnings = [];
  const externalTerms = [...lookup.external, ...lookup.quarantine];
  const atlasOwnedTerms = new Set(lookup.own.map((entry) => entry.term.toLowerCase()));
  forEachLine(files, (line, file, lineNumber) => {
    if (isProtectiveOrReferenceLine(line)) return;
    for (const entry of externalTerms) {
      if (atlasOwnedTerms.has(entry.term.toLowerCase())) continue;
      if (!includesTerm(line, entry.term)) continue;
      const owner = entry.owner || (lookup.quarantine.includes(entry) ? 'Lab quarantine' : 'external protected term');
      warnings.push({
        classification: lookup.quarantine.includes(entry) ? 'lab-quarantine-borrowing' : 'cross-project-borrowing',
        term: entry.term,
        owner,
        layer: inferLayer(file, line),
        file: rel(file),
        line: lineNumber,
        reason: `possible borrowed protected term from ${owner}`,
        disposition: 'qualify owner/layer or route to Atlas Overseer'
      });
    }
  });
  return dedupe(warnings);
}

function findBoundaryWarnings(files) {
  const patterns = [
    {
      regex: /\bDiscovery refs are evidence\b/i,
      term: 'Discovery/Evidence',
      reason: 'Discovery appears collapsed into Evidence'
    },
    {
      regex: /\bRefresh labels enriches evidence\b/i,
      term: 'Refresh labels',
      reason: 'metadata label refresh appears described as evidence enrichment'
    },
    {
      regex: /\bMarked and Watch are interchangeable\b/i,
      term: 'Marked/Watch',
      reason: 'Marked attention and Watch active-check behavior appear collapsed'
    },
    {
      regex: /\bEvidence means source-backed information\b/i,
      term: 'Evidence',
      reason: 'Evidence appears generalized beyond Atlas durable evidence'
    }
  ];

  const warnings = [];
  forEachLine(files, (line, file, lineNumber) => {
    if (isProtectiveOrReferenceLine(line)) return;
    for (const pattern of patterns) {
      if (!pattern.regex.test(line)) continue;
      warnings.push({
        classification: 'atlas-boundary-collapse',
        term: pattern.term,
        owner: 'Atlas',
        layer: inferLayer(file, line),
        file: rel(file),
        line: lineNumber,
        reason: pattern.reason,
        disposition: 'review before acceptance'
      });
    }
  });
  return dedupe(warnings);
}

function discoverCandidates(files, lookup) {
  const known = new Set([
    ...lookup.own,
    ...lookup.external,
    ...lookup.quarantine,
    ...lookup.collisions,
    ...lookup.pending
  ].map((entry) => entry.term.toLowerCase()));

  const candidates = [];
  forEachLine(files, (line, file, lineNumber) => {
    if (isProtectiveOrReferenceLine(line)) return;
    for (const term of extractCandidateTerms(line)) {
      if (known.has(term.toLowerCase())) continue;
      candidates.push({
        classification: 'atlas-candidate',
        term,
        owner: 'Atlas candidate',
        layer: inferLayer(file, line),
        file: rel(file),
        line: lineNumber,
        reason: 'new likely Atlas-owned or bridge-facing term candidate',
        disposition: 'Overseer review: protect, allow/common, collision, or internal/support'
      });
    }
  });
  return dedupeByTerm(candidates).sort(compareWarnings);
}

function countByClassification(warnings) {
  return warnings.reduce((counts, warning) => {
    counts[warning.classification] = (counts[warning.classification] || 0) + 1;
    return counts;
  }, {});
}

function forEachLine(files, callback) {
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => callback(line, file, index + 1));
  }
}

function extractCandidateTerms(line) {
  const terms = new Set();
  const codeTicks = line.match(/`([^`]{3,80})`/g) || [];
  for (const tick of codeTicks) {
    const value = tick.slice(1, -1).trim();
    if (isCandidate(value)) terms.add(value);
  }

  const quoted = line.match(/['"]([^'"]{3,80})['"]/g) || [];
  for (const quote of quoted) {
    const value = quote.slice(1, -1).trim();
    if (isCandidate(value)) terms.add(value);
  }

  return [...terms];
}

function isCandidate(value) {
  if (value.length < 4 || value.length > 80) return false;
  if (/^F:\\/.test(value)) return false;
  if (/[\\/]/.test(value)) return false;
  if (/\.(md|js|json|sql|html|css|ps1|txt)$/i.test(value)) return false;
  if (/^[A-Z0-9_\-./:]+$/.test(value)) return false;
  if (/^\d/.test(value)) return false;
  if (/^(Status|Date|Role|Scope|Purpose|Notes|Files|Expected|Current|Project|Human|Overseer|Dev|README|TODO)$/i.test(value)) return false;
  if (value.split(/\s+/).length > 5) return false;
  if (/^(Required|Accepted|Recommended|Source|Target|Summary|Implementation|Verification|Open Questions)$/i.test(value)) return false;
  if (/^(true|false|null|undefined)$/i.test(value)) return false;
  return /[A-Za-z]/.test(value);
}

function inferLayer(file, line) {
  const relative = rel(file);
  if (relative.startsWith('src\\main\\services') || relative.startsWith('src\\main\\reports')) return 'Project -> Bridge';
  if (relative.startsWith('src\\renderer')) return 'Bridge -> Interface';
  if (relative.startsWith('docs\\contracts') || relative.startsWith('docs\\current-state')) return 'durable docs';
  if (relative.startsWith('workspace\\critical')) return 'critical reference';
  if (/\bservice|command|payload|ipc|bridge/i.test(line)) return 'Project -> Bridge';
  return 'unresolved';
}

function isProtectiveOrReferenceLine(line) {
  const lower = line.toLowerCase();
  return lower.includes('do not') ||
    lower.includes('must not') ||
    lower.includes('not evidence') ||
    lower.includes('preserve') ||
    lower.includes('collision') ||
    lower.includes('risk') ||
    lower.includes('caution') ||
    lower.includes('open question') ||
    lower.includes('owner');
}

function includesTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function dedupe(warnings) {
  const seen = new Set();
  const result = [];
  for (const warning of warnings) {
    const key = `${warning.term}|${warning.file}|${warning.line}|${warning.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(warning);
  }
  return result;
}

function dedupeByTerm(warnings) {
  const seen = new Set();
  const result = [];
  for (const warning of warnings) {
    const key = `${warning.term.toLowerCase()}|${warning.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(warning);
  }
  return result;
}

function compareWarnings(left, right) {
  return left.file.localeCompare(right.file) || left.line - right.line || left.term.localeCompare(right.term);
}

function rel(file) {
  return path.relative(root, file);
}

main();
