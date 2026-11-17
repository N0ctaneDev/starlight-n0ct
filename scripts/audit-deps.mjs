#!/usr/bin/env node

/**
 * Runs npm audit for the package and demo, allowing only explicitly reviewed
 * advisories that do not have an upstream fix yet.
 *
 * Do not add broad package-name or severity-based ignores here. Allowlist one
 * upstream advisory ID, verify its affected package, and set a short review date.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const KNOWN_UNFIXED_ADVISORIES = {
  'GHSA-fc5q-39xc-vjpf': {
    packageName: 'picomatch',
    reviewBy: '2026-12-17',
    reason:
      'The upstream advisory currently has no patched release; npm latest is still 4.0.7. ReDoS via single-branch repeated extglobs.',
    url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
  },
};

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const auditTargets = [
  { label: 'package', cwd: process.cwd() },
  { label: 'documentation demo', cwd: path.join(process.cwd(), 'docs') },
];

function parseAuditReport(stdout) {
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('npm audit did not return a JSON report.');
  }

  const report = JSON.parse(stdout.slice(start, end + 1));
  if (!report || typeof report.vulnerabilities !== 'object' || report.vulnerabilities === null) {
    throw new Error('npm audit returned an unexpected report format.');
  }
  return report;
}

function advisoryId(via) {
  const candidates = [via.url, via.title, via.source]
    .filter((value) => typeof value === 'string')
    .join(' ');
  return candidates.match(/GHSA-[a-z0-9-]+/i)?.[0]?.toUpperCase();
}

/**
 * npm audit marks transitive dependents as vulnerable too. Resolve their
 * string entries in "via" back to the root advisory, so the same advisory is
 * counted once instead of treating every dependent package as a new issue.
 */
function collectAdvisories(packageName, vulnerabilities, visited = new Set()) {
  if (visited.has(packageName)) {
    return { ids: new Set(), errors: [`Cyclic advisory reference at ${packageName}`] };
  }

  const vulnerability = vulnerabilities[packageName];
  if (!vulnerability) {
    return { ids: new Set(), errors: [`Missing referenced vulnerability record: ${packageName}`] };
  }

  const nextVisited = new Set(visited);
  nextVisited.add(packageName);
  const ids = new Set();
  const errors = [];
  const viaEntries = Array.isArray(vulnerability.via) ? vulnerability.via : [];

  if (viaEntries.length === 0) {
    errors.push(`No advisory details for vulnerable package: ${packageName}`);
  }

  for (const via of viaEntries) {
    if (typeof via === 'string') {
      const nested = collectAdvisories(via, vulnerabilities, nextVisited);
      for (const id of nested.ids) ids.add(id);
      errors.push(...nested.errors);
      continue;
    }

    if (!via || typeof via !== 'object') {
      errors.push(`Unrecognized advisory entry for ${packageName}`);
      continue;
    }

    const id = advisoryId(via);
    if (!id) {
      errors.push(`Advisory ID missing for ${packageName}: ${via.title ?? 'unknown advisory'}`);
      continue;
    }

    const rule = KNOWN_UNFIXED_ADVISORIES[id];
    if (!rule || via.name !== rule.packageName) {
      errors.push(`Unallowlisted advisory ${id} affects ${via.name ?? packageName}`);
      continue;
    }

    if (new Date().toISOString().slice(0, 10) > rule.reviewBy) {
      errors.push(`Allowlist review date expired for ${id} (review by ${rule.reviewBy})`);
      continue;
    }

    ids.add(id);
  }

  return { ids, errors };
}

function runAudit(target) {
  const result = spawnSync(npmCommand, ['audit', '--json'], {
    cwd: target.cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Could not run npm audit for ${target.label}: ${result.error.message}`);
  }

  let report;
  try {
    report = parseAuditReport(result.stdout ?? '');
  } catch (error) {
    const detail = (result.stderr ?? '').trim();
    throw new Error(
      `Could not read npm audit report for ${target.label}: ${error.message}${detail ? `\\n${detail}` : ''}`,
    );
  }

  const vulnerabilities = report.vulnerabilities;
  const packageNames = Object.keys(vulnerabilities);
  if (packageNames.length === 0) {
    if (result.status !== 0) {
      throw new Error(`npm audit failed for ${target.label} without reporting any vulnerability details.`);
    }
    console.log(`[audit] ${target.label}: clean`);
    return;
  }

  const foundAdvisories = new Set();
  const errors = [];
  const affectedPackages = new Set();

  for (const packageName of packageNames) {
    const resolved = collectAdvisories(packageName, vulnerabilities);
    for (const id of resolved.ids) {
      foundAdvisories.add(id);
      affectedPackages.add(packageName);
    }
    errors.push(...resolved.errors);
  }

  if (errors.length > 0 || foundAdvisories.size === 0) {
    console.error(`[audit] ${target.label}: unapproved vulnerability findings`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  for (const id of foundAdvisories) {
    const rule = KNOWN_UNFIXED_ADVISORIES[id];
    console.warn(`[audit] ${target.label}: TEMPORARILY ALLOWING ${id}`);
    console.warn(`  Package: ${rule.packageName}`);
    console.warn(`  Reason: ${rule.reason}`);
    console.warn(`  Review by: ${rule.reviewBy}`);
    console.warn(`  Advisory: ${rule.url}`);
  }

  console.warn(
    `[audit] ${target.label}: ${packageNames.length} affected package records trace to ${foundAdvisories.size} allowlisted advisory; all other advisories remain blocking.`,
  );
}

for (const target of auditTargets) {
  runAudit(target);
}

