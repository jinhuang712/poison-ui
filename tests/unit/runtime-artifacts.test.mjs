import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  initPoisonProject,
  createReviewRun,
  recordBrowserCapture,
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

test("browser capture writes screenshot manifest and console evidence", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "browser demo" });

  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async ({ outputDir }) => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("fake-png"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [
        { level: "info", text: "ready", timestamp: "2026-06-16T00:00:00.000Z" },
        { level: "warn", text: "slow resource", timestamp: "2026-06-16T00:00:01.000Z" },
      ],
      pageErrors: [],
      metadata: {
        adapter: "test-adapter",
        outputDir,
      },
    }),
  });

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "captured");
  assert.equal(state.nextRecommendedAction, "review");
  assert.ok(state.artifacts.includes("screenshot-manifest.json"));
  assert.ok(state.artifacts.includes("console.log"));
  assert.ok(state.artifacts.includes("screenshots/home.png"));
  assert.equal(readFileSync(join(run.absolutePath, "screenshots/home.png"), "utf8"), "fake-png");

  const manifest = readJson(join(run.absolutePath, "screenshot-manifest.json"));
  assert.equal(manifest.kind, "browser");
  assert.equal(manifest.url, "http://localhost:5173");
  assert.equal(manifest.screenshots[0].path, "screenshots/home.png");
  assert.equal(manifest.screenshots[0].width, 1280);
  assert.equal(manifest.screenshots[0].height, 720);
  assert.equal(manifest.console.path, "console.log");

  const consoleLog = readFileSync(join(run.absolutePath, "console.log"), "utf8");
  assert.match(consoleLog, /\[info\] ready/);
  assert.match(consoleLog, /\[warn\] slow resource/);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("browser recapture clears stale pageerror evidence when the new capture is clean", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "recapture demo" });

  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("first"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [],
      pageErrors: [{ text: "first failure" }],
    }),
  });
  assert.match(readFileSync(join(run.absolutePath, "pageerrors.log"), "utf8"), /first failure/);

  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("second"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [],
      pageErrors: [],
    }),
  });

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.artifacts.includes("pageerrors.log"), false);
  assert.throws(() => readFileSync(join(run.absolutePath, "pageerrors.log"), "utf8"), /ENOENT/);
  const manifest = readJson(join(run.absolutePath, "screenshot-manifest.json"));
  assert.equal(manifest.pageErrors.path, null);
  assert.equal(manifest.pageErrors.entries, 0);
});

test("degraded recapture clears stale browser evidence artifacts", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "degraded recapture" });

  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "error", text: "old failure" }],
      pageErrors: [{ text: "old page error" }],
    }),
  });

  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "browser unavailable on recapture",
  });

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.ok(state.artifacts.includes("degraded-evidence.md"));
  assert.equal(state.artifacts.includes("screenshot-manifest.json"), false);
  assert.equal(state.artifacts.includes("console.log"), false);
  assert.equal(state.artifacts.includes("pageerrors.log"), false);
  assert.equal(state.artifacts.includes("screenshots/home.png"), false);
  assert.throws(() => readFileSync(join(run.absolutePath, "screenshot-manifest.json"), "utf8"), /ENOENT/);
  assert.throws(() => readFileSync(join(run.absolutePath, "console.log"), "utf8"), /ENOENT/);
  assert.throws(() => readFileSync(join(run.absolutePath, "pageerrors.log"), "utf8"), /ENOENT/);
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

test("review artifacts reference only degraded evidence when capture degraded", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "degraded review" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });

  writeReviewArtifacts(project, { runPath: run.relativePath });

  const packet = readFileSync(join(run.absolutePath, "review-packet.md"), "utf8");
  assert.match(packet, /degraded-evidence\.md/);
  assert.doesNotMatch(packet, /screenshot-manifest\.json/);
  assert.doesNotMatch(packet, /console\.log/);
  assert.doesNotMatch(packet, /screenshots\//);

  const summary = readFileSync(join(run.absolutePath, "review-summary.md"), "utf8");
  assert.match(summary, /Local prototype review with degraded evidence/);
  assert.match(summary, /evidence source: degraded-evidence\.md/);
  assert.match(summary, /evidenceRefs: degraded-evidence\.md/);
  assert.doesNotMatch(summary, /screenshot-manifest\.json/);
  assert.doesNotMatch(summary, /console\.log/);
  assert.doesNotMatch(summary, /screenshots\//);
});

test("review artifacts refuse to cite missing degraded evidence file", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing degraded evidence" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeFileSync(join(run.absolutePath, "degraded-evidence.md"), "");
  const state = readJson(join(run.absolutePath, "run-state.json"));
  state.artifacts = state.artifacts.filter((artifact) => artifact !== "degraded-evidence.md");
  writeFileSync(join(run.absolutePath, "run-state.json"), `${JSON.stringify(state, null, 2)}\n`);

  assert.throws(
    () => writeReviewArtifacts(project, { runPath: run.relativePath }),
    /degraded evidence is missing/,
  );
});

test("review artifacts reference browser evidence when browser capture exists", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "browser review" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "info", text: "ready" }],
      pageErrors: [],
    }),
  });

  writeReviewArtifacts(project, { runPath: run.relativePath });

  const packet = readFileSync(join(run.absolutePath, "review-packet.md"), "utf8");
  assert.match(packet, /screenshot-manifest\.json/);
  assert.match(packet, /console\.log/);
  assert.match(packet, /screenshots\/home\.png/);
  assert.doesNotMatch(packet, /degraded-evidence\.md/);

  const summary = readFileSync(join(run.absolutePath, "review-summary.md"), "utf8");
  assert.match(summary, /Local prototype review with browser evidence/);
  assert.match(summary, /evidence source: screenshot-manifest\.json/);
  assert.match(summary, /evidenceRefs: screenshot-manifest\.json, console\.log, screenshots\/home\.png/);
  assert.match(summary, /affectedScreens: screenshots\/home\.png/);
  assert.doesNotMatch(summary, /automated visual evidence is unavailable/);
  assert.doesNotMatch(summary, /degraded evidence/i);
  assert.doesNotMatch(summary, /until runtime evidence is available/i);
  assert.doesNotMatch(summary, /Capture real screenshot and console evidence/i);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("review artifacts refuse to cite missing browser evidence files", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing browser evidence" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "info", text: "ready" }],
      pageErrors: [],
    }),
  });
  writeFileSync(join(run.absolutePath, "console.log"), "");
  const state = readJson(join(run.absolutePath, "run-state.json"));
  state.artifacts = state.artifacts.filter((artifact) => artifact !== "console.log");
  writeFileSync(join(run.absolutePath, "run-state.json"), `${JSON.stringify(state, null, 2)}\n`);

  assert.throws(
    () => writeReviewArtifacts(project, { runPath: run.relativePath }),
    /browser evidence is incomplete/,
  );
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

test("gate fails when a referenced browser evidence artifact is missing", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing browser artifact" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "info", text: "ready" }],
      pageErrors: [],
    }),
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  rmSync(join(run.absolutePath, "screenshots", "home.png"));

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "FAIL");
  assert.match(gate.errors.join("\n"), /missing artifact: screenshots\/home\.png/);
  assert.equal(gate.errors.filter((error) => error === "missing artifact: screenshots/home.png").length, 1);
  assert.match(readFileSync(join(run.absolutePath, "gate-report.md"), "utf8"), /FAIL: missing artifact: screenshots\/home\.png/);
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "reviewed");
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("gate fails when a required V1 JSON artifact no longer parses", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "broken manifest" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "info", text: "ready" }],
      pageErrors: [],
    }),
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  writeFileSync(join(run.absolutePath, "screenshot-manifest.json"), "{");

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "FAIL");
  assert.match(gate.errors.join("\n"), /screenshot-manifest\.json failed to parse/);
  assert.doesNotMatch(gate.errors.join("\n"), /screenshots\[0\]\.path/);
  assert.match(readFileSync(join(run.absolutePath, "gate-report.md"), "utf8"), /FAIL: screenshot-manifest\.json failed to parse/);
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
});

test("gate fails when captured browser pageerror evidence is present", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "pageerror" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "info", text: "ready" }],
      pageErrors: [{ text: "ReferenceError: missingWidget is not defined" }],
    }),
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "FAIL");
  assert.match(gate.errors.join("\n"), /severe-runtime-error: browser pageerror evidence is present/);
  assert.match(readFileSync(join(run.absolutePath, "gate-report.md"), "utf8"), /FAIL: severe-runtime-error: browser pageerror evidence is present/);
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
});

test("gate does not fail on warning-level console evidence", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "console warning" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "warn", text: "slow resource" }],
      pageErrors: [],
    }),
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "PASS");
  assert.deepEqual(gate.errors, []);
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "gated");
});

test("gate does not fail when non-error console text contains the word error", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "console text error" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [{ level: "warn", text: "console.error documentation mention [error]" }],
      pageErrors: [],
    }),
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "PASS");
  assert.deepEqual(gate.errors, []);
});

test("gate fails when captured console evidence contains a timestamped severe runtime error", async () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "runtime error" });
  await recordBrowserCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    adapter: async () => ({
      screenshot: {
        fileName: "home.png",
        bytes: Buffer.from("browser"),
        width: 1280,
        height: 720,
      },
      consoleEntries: [
        {
          level: "error",
          text: "TypeError: Cannot read properties of undefined",
          timestamp: "2026-06-16T00:00:00.000Z",
        },
      ],
      pageErrors: [],
    }),
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  const gate = gateRun(project, { runPath: run.relativePath });
  assert.equal(gate.verdict, "FAIL");
  assert.match(gate.errors.join("\n"), /severe-runtime-error/);
  assert.match(readFileSync(join(run.absolutePath, "gate-report.md"), "utf8"), /FAIL: severe-runtime-error/);
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
});
