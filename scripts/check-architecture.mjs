#!/usr/bin/env node
/**
 * Permanent architecture quality gate (Phase 9A, Section M).
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

const CROSS_MODULE_FEATURES = ['family', 'properties', 'vehicles', 'staff', 'contracts'];

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
// 2. Tasks cannot import family/properties/vehicles/staff/contracts.
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

if (violations.length > 0) {
  console.error(`\nArchitecture check FAILED with ${violations.length} violation(s):\n`);
  for (const v of violations) console.error(`  - ${v}`);
  console.error('');
  process.exit(1);
} else {
  console.log(`Architecture check passed (${allFiles.length} source files scanned, ${sourceFiles.size} in import graph, 8 rule categories).`);
}
