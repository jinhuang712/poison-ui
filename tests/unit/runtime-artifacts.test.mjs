import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  initPoisonProject,
  createReviewRun,
  recordDegradedCapture,
  writeReviewArtifacts,
  schemaCheckRun,
  gateRun,
} from "../../src/core/v1-runtime.mjs";

function makeProject() {
  return mkdtempSync(join(tmpdir(), "poison-core-"));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("run-state transitions preserve recoverable blocked metadata for degraded capture", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "blocked demo" });

  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "captured");
  assert.equal(state.previousStatus, null);
  assert.equal(state.blockedReason, null);
  assert.equal(state.nextRecommendedAction, "review");
  assert.ok(state.artifacts.includes("degraded-evidence.md"));
});

test("schema check reports missing review evidence before gate can pass", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "schema demo" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });

  const result = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(result.ok, true);

  assert.throws(
    () => gateRun(project, { runPath: run.relativePath }),
    /review-summary.md is required before gate/,
  );
});

test("review artifacts satisfy schema check and gate rules", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "gate demo" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "PASS");
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "gated");
});

test("schema check requires every V1 finding to carry the full minimum field set", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "finding fields" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const summaryPath = join(run.absolutePath, "review-summary.md");
  const summary = readFileSync(summaryPath, "utf8").replace(
    "## Backlog items",
    `
### Finding 2
- findingId: V1-F002
- severity: minor
- issue: incomplete second finding
 
## Backlog items`,
  );
  writeFileSync(summaryPath, summary);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /Finding 2.*priorityRank/);
  assert.match(schema.errors.join("\n"), /Finding 2.*why it feels poisoned/);
});

test("schema check requires issue and why-it-feels-poisoned fields", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing issue" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const summaryPath = join(run.absolutePath, "review-summary.md");
  const summary = readFileSync(summaryPath, "utf8")
    .replace("- issue: automated visual evidence is unavailable\n", "")
    .replace("- why it feels poisoned: UI quality cannot be assessed from runtime screenshots in this run\n", "");
  writeFileSync(summaryPath, summary);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /issue/);
  assert.match(schema.errors.join("\n"), /why it feels poisoned/);
});

test("gate fails when captured console evidence contains a severe runtime error", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "runtime error" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  writeFileSync(join(run.absolutePath, "console.log"), "[error] TypeError: Cannot read properties of undefined\n");

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "FAIL");
  assert.match(gate.errors.join("\n"), /severe-runtime-error/);
  assert.match(readFileSync(join(run.absolutePath, "gate-report.md"), "utf8"), /FAIL: severe-runtime-error/);
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
});
