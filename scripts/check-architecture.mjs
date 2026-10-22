#!/usr/bin/env node
/**
 * Permanent architecture quality gate (Phase 9A Section M; extended in
 * Phase 9B Section V for the Notifications aggregator's boundaries; in
 * Phase 10 Section AD for the Archive aggregator's boundaries; again for
 * the General Calendar aggregator's identical boundaries; and again for
 * the Dashboard's Quick To-Do List/Quick Notes widgets' stricter, total
 * isolation from every other feature).
 *
 * A small AST/import-graph implementation (using the TypeScript compiler
 * API already in this project's own devDependencies) rather than fragile
 * text-grepping, so renamed identifiers, multi-line imports, and string
 * literals that merely *mention* a banned pattern don't produce false
 * positives or false negatives.
 *
 * Run via `npm run test:architecture` (also part of `npm run quality`).
 * Exits non-zero on any violation, printing every one found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'src');

const CROSS_MODULE_FEATURES = ['family', 'properties', 'vehicles', 'staff', 'contracts', 'health', 'education'];

/** @type {string[]} */
const violations = [];

function listSourceFiles(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if ((extname(entry) === '.ts' || extname(entry) === '.tsx') && !entry.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = listSourceFiles(SRC);

/** @type {Map<string, ts.SourceFile>} */
const sourceFiles = new Map();
for (const file of allFiles) {
  const text = readFileSync(file, 'utf-8');
  sourceFiles.set(file, ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS));
}

/** Resolves a relative/absolute-from-src import specifier to an actual file on disk, or null for a package import / non-source asset (css, svg, ...). */
function resolveImportSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null; // package import (react, idb, ...) -- not part of our own graph
  const baseDir = dirname(fromFile);
  const candidate = resolvePath(baseDir, specifier);
  const candidates = [candidate, `${candidate}.ts`, `${candidate}.tsx`, join(candidate, 'index.ts'), join(candidate, 'index.tsx')];
  for (const c of candidates) {
    if (sourceFiles.has(c)) return c;
  }
  return null; // a non-source asset import (e.g. './index.css') -- not a graph edge
}

/** @type {Map<string, Set<string>>} */
const importGraph = new Map();
/** @type {Map<string, string[]>} */
const rawImportSpecifiers = new Map();

for (const [file, sf] of sourceFiles) {
  const targets = new Set();
  const raw = [];
  ts.forEachChild(sf, function visit(node) {
    let specifier;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifier = node.moduleSpecifier.text;
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      specifier = node.arguments[0].text;
    }
    if (specifier) {
      raw.push(specifier);
      const resolved = resolveImportSpecifier(file, specifier);
      if (resolved) targets.add(resolved);
    }
    ts.forEachChild(node, visit);
  });
  importGraph.set(file, targets);
  rawImportSpecifiers.set(file, raw);
}

function relPath(file) {
  return relative(ROOT, file).split('\\').join('/');
}

// ---------------------------------------------------------------------------
// 1. No circular imports.
// ---------------------------------------------------------------------------
{
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  /** @type {Map<string, number>} */
  const color = new Map();
  const reportedCycles = new Set();

  function dfs(file, stack) {
    color.set(file, GRAY);
    stack.push(file);
    for (const next of importGraph.get(file) ?? []) {
      const state = color.get(next) ?? WHITE;
      if (state === WHITE) {
        dfs(next, stack);
      } else if (state === GRAY) {
        const cycleStart = stack.indexOf(next);
        const cycle = [...stack.slice(cycleStart), next].map(relPath).join(' -> ');
        if (!reportedCycles.has(cycle)) {
          reportedCycles.add(cycle);
          violations.push(`Circular import: ${cycle}`);
        }
      }
    }
    stack.pop();
    color.set(file, BLACK);
  }

  for (const file of allFiles) {
    if ((color.get(file) ?? WHITE) === WHITE) dfs(file, []);
  }
}

// ---------------------------------------------------------------------------
// 2. Tasks cannot import family/properties/vehicles/staff/contracts/health/
//    education.
// ---------------------------------------------------------------------------
{
  const tasksDir = join(SRC, 'features', 'tasks') + '/';
  for (const file of allFiles) {
    if (!file.startsWith(tasksDir)) continue;
    for (const target of importGraph.get(file) ?? []) {
      for (const feature of CROSS_MODULE_FEATURES) {
        const featureDir = join(SRC, 'features', feature) + '/';
        if (target.startsWith(featureDir)) {
          violations.push(`Tasks independence violated: ${relPath(file)} imports ${relPath(target)}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. UI (components/pages/feature-components/feature-hooks) never touches
//    IndexedDB directly (no raw 'idb' import, no global `indexedDB` use).
// ---------------------------------------------------------------------------
{
  function isUiLayerFile(file) {
    const rel = relPath(file);
    if (rel.startsWith('src/components/') || rel.startsWith('src/pages/')) return true;
    // feature-scoped UI: .../features/<name>/components/**, .../features/<name>/hooks/**
    return /^src\/features\/[^/]+\/(components|hooks)\//.test(rel);
  }

  for (const file of allFiles) {
    if (!isUiLayerFile(file)) continue;
    const raw = rawImportSpecifiers.get(file) ?? [];
    if (raw.includes('idb')) {
      violations.push(`UI layer imports 'idb' directly: ${relPath(file)}`);
    }
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, function visit(node) {
      const isPropertyNamePosition = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
      if (ts.isIdentifier(node) && node.text === 'indexedDB' && !isPropertyNamePosition) {
        violations.push(`UI layer references the global 'indexedDB' directly: ${relPath(file)}`);
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 4. getDB() confined to storage/repository layers.
// ---------------------------------------------------------------------------
{
  function isAllowedGetDbCaller(file) {
    const rel = relPath(file);
    return rel === 'src/storage/db.ts' || /Repository\.ts$/.test(rel);
  }

  for (const file of allFiles) {
    if (isAllowedGetDbCaller(file)) continue;
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, (node) => {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const resolved = resolveImportSpecifier(file, node.moduleSpecifier.text);
        if (resolved && resolved.endsWith(join('storage', 'db.ts')) && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const el of node.importClause.namedBindings.elements) {
            if (el.name.text === 'getDB') {
              violations.push(`getDB() used outside storage/repository layer: ${relPath(file)}`);
            }
          }
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 5. No destructive DB operations (deleteDatabase / store .clear()).
// ---------------------------------------------------------------------------
{
  for (const file of allFiles) {
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, function visit(node) {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'deleteDatabase') {
          violations.push(`Destructive deleteDatabase() call: ${relPath(file)}`);
        }
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'clear') {
          violations.push(`Destructive .clear() call (verify this isn't an IndexedDB object store): ${relPath(file)}`);
        }
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 6. No @ts-ignore / @ts-expect-error suppression comments.
// ---------------------------------------------------------------------------
{
  for (const file of allFiles) {
    const text = readFileSync(file, 'utf-8');
    if (text.includes('@ts-ignore') || text.includes('@ts-expect-error')) {
      violations.push(`Type-error suppression comment found: ${relPath(file)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. No production runtime network calls (fetch/axios/XMLHttpRequest/WebSocket).
// ---------------------------------------------------------------------------
{
  const BANNED_GLOBALS = new Set(['fetch', 'XMLHttpRequest', 'WebSocket']);
  for (const file of allFiles) {
    const raw = rawImportSpecifiers.get(file) ?? [];
    if (raw.includes('axios')) {
      violations.push(`Network library 'axios' imported: ${relPath(file)}`);
    }
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && BANNED_GLOBALS.has(node.expression.text)) {
        violations.push(`Network call '${node.expression.text}(...)': ${relPath(file)}`);
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && BANNED_GLOBALS.has(node.expression.text)) {
        violations.push(`Network usage 'new ${node.expression.text}(...)': ${relPath(file)}`);
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 8. No unreachable feature files (reachable from src/main.tsx via the
//    static + dynamic import graph), excluding vite-env.d.ts and the like.
// ---------------------------------------------------------------------------
{
  const entry = join(SRC, 'main.tsx');
  const reached = new Set();
  const stack = [entry];
  while (stack.length > 0) {
    const file = stack.pop();
    if (reached.has(file)) continue;
    reached.add(file);
    for (const next of importGraph.get(file) ?? []) {
      if (!reached.has(next)) stack.push(next);
    }
  }
  for (const file of allFiles) {
    if (reached.has(file)) continue;
    violations.push(`Unreachable file (never imported, directly or transitively, from src/main.tsx): ${relPath(file)}`);
  }
}

// ---------------------------------------------------------------------------
// 9. Notifications is a derived aggregator, never a domain owner (Phase
//    9B): every domain module (family/properties/vehicles/staff/
//    contracts/tasks) must NOT import from features/notifications --
//    source adapters may import domain utilities/types, never the other
//    way around.
// ---------------------------------------------------------------------------
{
  const domainFeatures = [...CROSS_MODULE_FEATURES, 'tasks'];
  const notificationsDir = join(SRC, 'features', 'notifications') + '/';
  for (const feature of domainFeatures) {
    const featureDir = join(SRC, 'features', feature) + '/';
    for (const file of allFiles) {
      if (!file.startsWith(featureDir)) continue;
      for (const target of importGraph.get(file) ?? []) {
        if (target.startsWith(notificationsDir)) {
          violations.push(`Domain module imports Notifications (inverted dependency): ${relPath(file)} imports ${relPath(target)}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 10. No explicit `any` type anywhere in application source.
// ---------------------------------------------------------------------------
{
  for (const file of allFiles) {
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, function visit(node) {
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        violations.push(`Explicit 'any' type: ${relPath(file)}`);
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 11. No Notification persistence store (Phase 9B is a derived-only
//     aggregation layer -- no schema change), and DB_VERSION must equal the
//     HIGHEST `oldVersion < N` migration guard actually present in the
//     upgrade() callback -- never a number hardcoded in this script. That
//     makes the check self-maintaining: a legitimate new migration (add a
//     guard, bump DB_VERSION to match) never requires editing this file,
//     while a DB_VERSION bump with no corresponding migration step (or a
//     migration step nothing bumped DB_VERSION for) still fails the gate.
// ---------------------------------------------------------------------------
{
  const dbFile = join(SRC, 'storage', 'db.ts');
  const dbSource = readFileSync(dbFile, 'utf-8');
  if (/\bnotification/i.test(dbSource)) {
    violations.push(`storage/db.ts appears to reference a notification store -- Notifications must never be persisted (Phase 9B Section B)`);
  }

  const versionMatch = dbSource.match(/DB_VERSION\s*=\s*(\d+)/);
  const declaredVersion = versionMatch ? Number(versionMatch[1]) : undefined;

  let highestMigrationGuard = 0;
  const dbSf = sourceFiles.get(dbFile);
  if (dbSf) {
    ts.forEachChild(dbSf, function visit(node) {
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.LessThanToken &&
        ts.isIdentifier(node.left) &&
        node.left.text === 'oldVersion' &&
        ts.isNumericLiteral(node.right)
      ) {
        highestMigrationGuard = Math.max(highestMigrationGuard, Number(node.right.text));
      }
      ts.forEachChild(node, visit);
    });
  }

  if (declaredVersion === undefined) {
    violations.push('storage/db.ts: DB_VERSION constant not found');
  } else if (highestMigrationGuard === 0) {
    violations.push('storage/db.ts: no `if (oldVersion < N)` migration guard found to verify DB_VERSION against');
  } else if (declaredVersion !== highestMigrationGuard) {
    violations.push(
      `DB_VERSION (${declaredVersion}) does not match the highest 'if (oldVersion < ${highestMigrationGuard})' migration guard in storage/db.ts -- every DB_VERSION bump must be paired with its own migration step, and vice versa`,
    );
  }
}

// ---------------------------------------------------------------------------
// 12. Phase 10 (Archive): no Archive persistence store -- Archive is a
//     display/organization state of an existing card (`archivedAt` on the
//     entity itself), never a second database or a copied-record store.
//     Checked precisely against actual `createObjectStore(...)` call
//     arguments (not a blunt whole-file text scan) since db.ts's own doc
//     comments legitimately mention "Archive" by name.
// ---------------------------------------------------------------------------
{
  const dbFile = join(SRC, 'storage', 'db.ts');
  const dbSf = sourceFiles.get(dbFile);
  if (dbSf) {
    ts.forEachChild(dbSf, function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'createObjectStore' &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0]) &&
        /archiv/i.test(node.arguments[0].text)
      ) {
        violations.push(`storage/db.ts creates an Archive-named object store ('${node.arguments[0].text}') -- Archive must never be its own store (Phase 10 Section B/C)`);
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 13. Archive is a derived aggregator, never a domain owner (Phase 10,
//     mirrors rule 9 for Notifications): every domain module (family/
//     properties/vehicles/staff/contracts/tasks) must NOT import from
//     features/archive -- source adapters may import domain
//     utilities/types, never the other way around.
// ---------------------------------------------------------------------------
{
  const domainFeatures = [...CROSS_MODULE_FEATURES, 'tasks'];
  const archiveDir = join(SRC, 'features', 'archive') + '/';
  for (const feature of domainFeatures) {
    const featureDir = join(SRC, 'features', feature) + '/';
    for (const file of allFiles) {
      if (!file.startsWith(featureDir)) continue;
      for (const target of importGraph.get(file) ?? []) {
        if (target.startsWith(archiveDir)) {
          violations.push(`Domain module imports Archive (inverted dependency): ${relPath(file)} imports ${relPath(target)}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 14. Phase 11 product decision: Trash was cancelled (lifecycle is now
//     ACTIVE <-> ARCHIVED -> PERMANENT DELETE, with no Trash state -- so
//     Archive's "Delete" action is now REQUIRED to call the same real,
//     permanent cascade-delete function every profile page uses) and
//     Global Search was removed entirely. Scan every source file's actual
//     IDENTIFIERS (declarations, references, property/JSX-tag names -- not
//     a raw substring match over the whole file text) for the retired
//     names, so a stray reintroduction of either feature fails the gate
//     immediately without also tripping on an unrelated comment or string
//     that merely mentions one of these words.
// ---------------------------------------------------------------------------
{
  const BANNED_IDENTIFIERS = new Set(['deletedAt', 'softDelete', 'TrashPage', 'onSearchClick', 'searchPlaceholderMessage']);
  // storage/db.ts is the one legitimate exception for 'deletedAt'/
  // 'softDelete': the v12->v13 migration must reference the retired field
  // name by that exact identifier to find and clean up any legacy record
  // that still carries it (see this file's own top-level doc comment) --
  // that is cleanup of the past, not a live reintroduction of the feature.
  const dbFile = join(SRC, 'storage', 'db.ts');
  for (const file of allFiles) {
    if (file === dbFile) continue;
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, function visit(node) {
      if (ts.isIdentifier(node) && BANNED_IDENTIFIERS.has(node.text)) {
        violations.push(`Stale Trash/Global-Search identifier '${node.text}' found: ${relPath(file)}`);
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 15. Notifications/Calendar must keep seeing archived entities (Phase 10
//     Section K, critical regression; extended for the General Calendar,
//     which has the identical requirement -- an archived record's dates
//     must still appear on the Calendar): neither aggregator may import
//     any active-only `listActiveX`/(active-only `listTaskGroups`)
//     repository function -- only the excludes-deleted-only variant, so
//     normal active-list filtering can never silently leak into either
//     aggregator's loader.
// ---------------------------------------------------------------------------
{
  const aggregatorDirs = [join(SRC, 'features', 'notifications') + '/', join(SRC, 'features', 'calendar') + '/'];
  for (const file of allFiles) {
    if (!aggregatorDirs.some((dir) => file.startsWith(dir))) continue;
    const sf = sourceFiles.get(file);
    ts.forEachChild(sf, function visit(node) {
      if ((ts.isImportSpecifier(node) || ts.isBindingElement(node)) && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        if (name.startsWith('listActive') || name === 'listTaskGroups') {
          violations.push(`Aggregator imports an active-only list function '${name}' -- archived entities must still produce events: ${relPath(file)}`);
        }
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 16. The General Calendar is a derived aggregator, never a domain owner
//     (mirrors rule 9 for Notifications / rule 13 for Archive): every
//     domain module (family/properties/vehicles/staff/contracts) must NOT
//     import from features/calendar -- source adapters may import domain
//     utilities/types, never the other way around. Tasks is excluded from
//     this particular check because taskGroupColor.ts deliberately lives
//     in features/tasks (so Calendar depends on Tasks, not the reverse) --
//     the real direction is enforced by rule 2 (Tasks independence), which
//     already forbids Tasks from importing any other feature, Calendar
//     included.
// ---------------------------------------------------------------------------
{
  const calendarDir = join(SRC, 'features', 'calendar') + '/';
  for (const feature of CROSS_MODULE_FEATURES) {
    const featureDir = join(SRC, 'features', feature) + '/';
    for (const file of allFiles) {
      if (!file.startsWith(featureDir)) continue;
      for (const target of importGraph.get(file) ?? []) {
        if (target.startsWith(calendarDir)) {
          violations.push(`Domain module imports Calendar (inverted dependency): ${relPath(file)} imports ${relPath(target)}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 17. No Calendar persistence store (same reasoning as rule 11/12): the
//     General Calendar is a derived-only aggregation layer -- no schema
//     change, no object store of its own. Checked against actual
//     `createObjectStore(...)` call arguments, not a blunt text scan,
//     since this file's own doc comments legitimately mention "Calendar"
//     by name (the TaskGroup.color migration doc comment).
// ---------------------------------------------------------------------------
{
  const dbFile = join(SRC, 'storage', 'db.ts');
  const dbSf = sourceFiles.get(dbFile);
  if (dbSf) {
    ts.forEachChild(dbSf, function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'createObjectStore' &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0]) &&
        /calendar/i.test(node.arguments[0].text)
      ) {
        violations.push(`storage/db.ts creates a Calendar-named object store ('${node.arguments[0].text}') -- the General Calendar must never be its own store`);
      }
      ts.forEachChild(node, visit);
    });
  }
}

// ---------------------------------------------------------------------------
// 19. Quick To-Do / Quick Notes (Dashboard widgets) are fully isolated --
//     stricter than Tasks' own independence rule (rule 2): no file under
//     features/quickTodo or features/quickNotes may import from ANY other
//     features/* directory at all. This is what permanently enforces "no
//     automatic synchronization or duplication with the Tasks & Reminders
//     module" and "neither widget should modify existing Tasks or Task
//     Groups" -- these two widgets have zero business relationship to
//     anything else in the app.
// ---------------------------------------------------------------------------
{
  const isolatedFeatures = ['quickTodo', 'quickNotes'];
  for (const feature of isolatedFeatures) {
    const featureDir = join(SRC, 'features', feature) + '/';
    for (const file of allFiles) {
      if (!file.startsWith(featureDir)) continue;
      for (const target of importGraph.get(file) ?? []) {
        const featuresRoot = join(SRC, 'features') + '/';
        if (target.startsWith(featuresRoot) && !target.startsWith(featureDir)) {
          violations.push(`${feature} must be fully independent of every other feature: ${relPath(file)} imports ${relPath(target)}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 20. Quick To-Do items/Quick Notes must never appear in the General
//     Calendar or generate Notifications (explicit spec requirement): no
//     file under features/calendar or features/notifications may import
//     from features/quickTodo or features/quickNotes. Archive and Tasks
//     are checked too, for the same reason -- neither widget is archived
//     or Task-related, so neither aggregator/module should ever reach
//     into them either.
// ---------------------------------------------------------------------------
{
  const isolatedFeatures = ['quickTodo', 'quickNotes'];
  const mustNeverImportThese = ['calendar', 'notifications', 'archive', 'tasks'];
  for (const consumer of mustNeverImportThese) {
    const consumerDir = join(SRC, 'features', consumer) + '/';
    for (const file of allFiles) {
      if (!file.startsWith(consumerDir)) continue;
      for (const target of importGraph.get(file) ?? []) {
        for (const isolated of isolatedFeatures) {
          const isolatedDir = join(SRC, 'features', isolated) + '/';
          if (target.startsWith(isolatedDir)) {
            violations.push(`${consumer} must never import ${isolated} (independence rule): ${relPath(file)} imports ${relPath(target)}`);
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------

if (violations.length > 0) {
  console.error(`\nArchitecture check FAILED with ${violations.length} violation(s):\n`);
  for (const v of violations) console.error(`  - ${v}`);
  console.error('');
  process.exit(1);
} else {
  console.log(`Architecture check passed (${allFiles.length} source files scanned, ${sourceFiles.size} in import graph, 20 rule categories).`);
}
