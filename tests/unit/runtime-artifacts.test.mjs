import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  initPoisonProject,
  createReviewRun,
  recordBrowserCapture,
  recordDegradedCapture,
  hardenRun,
  initializeProtectedFeatures,
  routeRepairs,
  writeRepairPlan,
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

test("protected baseline requires a gated source run", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "protected too early" });

  assert.throws(
    () => initializeProtectedFeatures(project, { runPath: run.relativePath }),
    /protected baseline requires status gated/,
  );
});

test("protected baseline rejects reviewed runs before gate passes", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "protected before gate" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });

  assert.throws(
    () => initializeProtectedFeatures(project, { runPath: run.relativePath }),
    /protected baseline requires status gated/,
  );
});

test("protected baseline initializes V2a protected features from a gated run", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "protected baseline" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });

  initializeProtectedFeatures(project, { runPath: run.relativePath });

  const protectedFeatures = readFileSync(join(run.absolutePath, "protected-features.md"), "utf8");
  assert.match(protectedFeatures, /# Protected Features/);
  assert.match(protectedFeatures, /## Source Evidence/);
  assert.match(protectedFeatures, /review-summary\.md/);
  assert.match(protectedFeatures, /gate-report\.md/);
  assert.match(protectedFeatures, /## Protected Items/);
  assert.match(protectedFeatures, /none declared yet/);
  assert.match(protectedFeatures, /## Update Rules/);
  assert.match(protectedFeatures, /Do not remove or weaken a protected item without explicit user decision/);
  assert.doesNotMatch(protectedFeatures, /repair-plan\.md/);
  assert.doesNotMatch(protectedFeatures, /repair-plan\.json/);
  assert.doesNotMatch(protectedFeatures, /design\/manifest/);

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "protected_ready");
  assert.equal(state.previousStatus, null);
  assert.equal(state.blockedReason, null);
  assert.equal(state.nextRecommendedAction, "repair-plan");
  assert.ok(state.artifacts.includes("protected-features.md"));

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("protected baseline rerun preserves existing protected items", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "protected rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });

  const protectedPath = join(run.absolutePath, "protected-features.md");
  const edited = readFileSync(protectedPath, "utf8").replace(
    "- none declared yet",
    "- checkout search input must remain visible; owner: user; source evidence: review-summary.md",
  );
  writeFileSync(protectedPath, edited);

  initializeProtectedFeatures(project, { runPath: run.relativePath });

  const protectedFeatures = readFileSync(protectedPath, "utf8");
  assert.match(protectedFeatures, /checkout search input must remain visible/);
});

test("schema check fails when protected-ready run loses protected baseline artifact", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing protected baseline" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  rmSync(join(run.absolutePath, "protected-features.md"));

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /protected-features\.md/);
});

test("repair planning requires protected-ready baseline", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair too early" });

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /repair planning requires status protected_ready/,
  );
});

test("repair planning blocks protected-ready run when findings are missing", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing repair findings" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeFileSync(join(run.absolutePath, "review-summary.md"), [
    "---",
    "schemaVersion: 1",
    `runId: ${run.runId}`,
    "artifact: review-summary.md",
    "status: READY",
    "source: test",
    "updatedAt: 2026-06-17T00:00:00.000Z",
    "---",
    "# Review Summary",
    "",
    "## Findings",
    "none",
    "",
  ].join("\n"));

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /protected baseline failed schema-check/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "protected_ready");
  assert.match(state.blockedReason, /review-summary\.md findings must include at least one finding/);
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("repair planning blocks protected-ready run when protected baseline artifact is missing", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing repair baseline" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  rmSync(join(run.absolutePath, "protected-features.md"));

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /protected-features\.md is required before repair planning/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "protected_ready");
  assert.match(state.blockedReason, /protected-features\.md is required before repair planning/);
  assert.equal(state.nextRecommendedAction, "init-protected-features");
});

test("repair planning blocks protected-ready run when protected baseline artifact is invalid", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "invalid repair baseline" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeFileSync(join(run.absolutePath, "protected-features.md"), "# Broken Protected Features\n");

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /protected baseline failed schema-check/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "protected_ready");
  assert.match(state.blockedReason, /protected-features\.md is missing metadata/);
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("repair planning writes ordered artifacts mapped to V1 finding IDs", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair plan" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });

  writeRepairPlan(project, { runPath: run.relativePath });

  const repairPlan = readFileSync(join(run.absolutePath, "repair-plan.md"), "utf8");
  assert.match(repairPlan, /# Repair Plan/);
  assert.match(repairPlan, /## Source Findings/);
  assert.match(repairPlan, /V1-F001/);
  assert.match(repairPlan, /## Repair Items/);
  assert.match(repairPlan, /repairId: RP-001/);
  assert.match(repairPlan, /findingId: V1-F001/);
  assert.match(repairPlan, /## Scope Guardrails/);
  assert.match(repairPlan, /Do not start arbiter routing in V2b/);
  assert.doesNotMatch(repairPlan, /currentRepair/);
  assert.doesNotMatch(repairPlan, /needsUserDecision/);
  assert.doesNotMatch(repairPlan, /design\/manifest/);

  const repairJson = readJson(join(run.absolutePath, "repair-plan.json"));
  assert.equal(repairJson.schemaVersion, 1);
  assert.equal(repairJson.runId, run.runId);
  assert.equal(repairJson.artifact, "repair-plan.json");
  assert.equal(repairJson.status, "READY");
  assert.match(repairJson.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(repairJson.artifacts, ["repair-plan.md", "repair-plan.json"]);
  assert.deepEqual(repairJson.sourceArtifacts, ["review-summary.md", "protected-features.md"]);
  assert.equal(repairJson.repairs.length, 1);
  assert.equal(repairJson.repairs[0].repairId, "RP-001");
  assert.equal(repairJson.repairs[0].findingId, "V1-F001");
  assert.equal(repairJson.repairs[0].status, "planned");
  assert.equal("currentRepair" in repairJson.repairs[0], false);
  assert.equal("needsUserDecision" in repairJson.repairs[0], false);

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "repair_planned");
  assert.equal(state.nextRecommendedAction, "arbiter-route");
  assert.ok(state.artifacts.includes("repair-plan.md"));
  assert.ok(state.artifacts.includes("repair-plan.json"));

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("repair planning rerun preserves existing repair plan artifacts", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const repairMarkdownPath = join(run.absolutePath, "repair-plan.md");
  const repairJsonPath = join(run.absolutePath, "repair-plan.json");
  const editedMarkdown = readFileSync(repairMarkdownPath, "utf8").replace(
    "- Do not execute repairs in V2b.",
    "- Manual note: preserve reviewer-approved repair ordering.",
  );
  const editedJson = readJson(repairJsonPath);
  editedJson.note = "preserve schema-valid reviewer note";
  writeFileSync(repairMarkdownPath, editedMarkdown);
  writeFileSync(repairJsonPath, `${JSON.stringify(editedJson, null, 2)}\n`);

  writeRepairPlan(project, { runPath: run.relativePath });

  assert.match(readFileSync(repairMarkdownPath, "utf8"), /preserve reviewer-approved repair ordering/);
  assert.equal(readJson(repairJsonPath).note, "preserve schema-valid reviewer note");
});

test("repair planning rerun blocks when existing repair plan artifacts fail schema", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair invalid rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const repairJsonPath = join(run.absolutePath, "repair-plan.json");
  const editedJson = readJson(repairJsonPath);
  editedJson.repairs[0].status = "routed";
  writeFileSync(repairJsonPath, `${JSON.stringify(editedJson, null, 2)}\n`);

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /existing repair plan failed schema-check/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "repair_planned");
  assert.match(state.blockedReason, /repair-plan\.json repair RP-001 status must be planned/);
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("repair planning rerun blocks when existing repair plan artifact is missing", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair missing artifact rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  rmSync(join(run.absolutePath, "repair-plan.json"));

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /existing repair plan failed schema-check/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "repair_planned");
  assert.match(state.blockedReason, /missing artifact: repair-plan\.json/);
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("repair planning rerun blocks when repair-planned state omits repair artifacts", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair missing state artifact rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const statePath = join(run.absolutePath, "run-state.json");
  const state = readJson(statePath);
  state.artifacts = state.artifacts.filter((artifact) => artifact !== "repair-plan.md");
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /existing repair plan failed schema-check/,
  );
  const blockedState = readJson(statePath);
  assert.equal(blockedState.status, "blocked");
  assert.equal(blockedState.previousStatus, "repair_planned");
  assert.match(blockedState.blockedReason, /run-state\.json repair_planned state must list repair-plan\.md/);
  assert.equal(blockedState.nextRecommendedAction, "schema-check");
});

test("repair planning rerun uses schema-check when protected baseline is missing", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair missing baseline rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  rmSync(join(run.absolutePath, "protected-features.md"));

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /existing repair plan failed schema-check/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "repair_planned");
  assert.match(state.blockedReason, /protected-features\.md is missing/);
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("repair planning blocks when review finding ordering is not numeric", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair nonnumeric ordering" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  const summaryPath = join(run.absolutePath, "review-summary.md");
  const brokenSummary = readFileSync(summaryPath, "utf8")
    .replace("- priorityRank: 65", "- priorityRank: high")
    .replace("- fixOrder: 65", "- fixOrder: first");
  writeFileSync(summaryPath, brokenSummary);
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /repair planning requires numeric priorityRank and fixOrder/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "protected_ready");
  assert.match(state.blockedReason, /V1-F001 has non-numeric priorityRank or fixOrder/);
  assert.equal(state.nextRecommendedAction, "review");
});

test("repair planning blocks when review finding ordering is blank", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "repair blank ordering" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  const summaryPath = join(run.absolutePath, "review-summary.md");
  const brokenSummary = readFileSync(summaryPath, "utf8")
    .replace("- priorityRank: 65", "- priorityRank: ")
    .replace("- fixOrder: 65", "- fixOrder: ");
  writeFileSync(summaryPath, brokenSummary);
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });

  assert.throws(
    () => writeRepairPlan(project, { runPath: run.relativePath }),
    /repair planning requires numeric priorityRank and fixOrder/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "protected_ready");
  assert.match(state.blockedReason, /V1-F001 has non-numeric priorityRank or fixOrder/);
  assert.equal(state.nextRecommendedAction, "review");
});

test("schema check fails when repair-plan json loses repairs array", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "broken repair plan" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const brokenPlan = readJson(join(run.absolutePath, "repair-plan.json"));
  delete brokenPlan.repairs;
  writeFileSync(join(run.absolutePath, "repair-plan.json"), `${JSON.stringify(brokenPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-plan\.json repairs must be an array/);
});

test("schema check fails when repair-plan json loses required metadata", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "broken repair metadata" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const brokenPlan = readJson(join(run.absolutePath, "repair-plan.json"));
  delete brokenPlan.runId;
  delete brokenPlan.updatedAt;
  delete brokenPlan.artifacts;
  delete brokenPlan.sourceArtifacts;
  writeFileSync(join(run.absolutePath, "repair-plan.json"), `${JSON.stringify(brokenPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-plan\.json runId must match run-state/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json updatedAt is required/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json artifacts must list repair-plan\.md and repair-plan\.json/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json sourceArtifacts must list review-summary\.md and protected-features\.md/);
});

test("schema check fails when repair-plan json repair item loses finding ID", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "broken repair item" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const brokenPlan = readJson(join(run.absolutePath, "repair-plan.json"));
  delete brokenPlan.repairs[0].findingId;
  writeFileSync(join(run.absolutePath, "repair-plan.json"), `${JSON.stringify(brokenPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-plan\.json repair RP-001 is missing findingId/);
});

test("schema check fails when repair-plan json repair item has invalid planning fields", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "invalid repair item fields" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const brokenPlan = readJson(join(run.absolutePath, "repair-plan.json"));
  brokenPlan.repairs[0].status = "routed";
  brokenPlan.repairs[0].priorityRank = "high";
  brokenPlan.repairs[0].currentRepair = true;
  brokenPlan.backlog = [];
  writeFileSync(join(run.absolutePath, "repair-plan.json"), `${JSON.stringify(brokenPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-plan\.json must not include backlog/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json repair RP-001 status must be planned/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json repair RP-001 priorityRank must be a number/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json repair RP-001 must not include currentRepair/);
});

test("schema check fails when repair-plan json does not map one-to-one to findings", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "invalid repair mapping" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const brokenPlan = readJson(join(run.absolutePath, "repair-plan.json"));
  brokenPlan.repairs.push({ ...brokenPlan.repairs[0] });
  writeFileSync(join(run.absolutePath, "repair-plan.json"), `${JSON.stringify(brokenPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-plan\.json repairId RP-001 is duplicated/);
  assert.match(schema.errors.join("\n"), /repair-plan\.json must map one-to-one to review-summary findings/);
});

test("schema check fails when repair-planned state omits repair artifacts", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing repair state artifacts" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  const statePath = join(run.absolutePath, "run-state.json");
  const state = readJson(statePath);
  state.artifacts = state.artifacts.filter((artifact) => artifact !== "repair-plan.md" && artifact !== "repair-plan.json");
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /run-state.json repair_planned state must list repair-plan.md/);
  assert.match(schema.errors.join("\n"), /run-state.json repair_planned state must list repair-plan.json/);
});

test("arbiter routing blocks instead of overwriting residual invalid routing artifacts", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "residual invalid routing" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  writeFileSync(join(run.absolutePath, "arbiter-routing.md"), "# Arbiter Routing\n\n## Summary\nstale\n");
  writeFileSync(join(run.absolutePath, "arbiter-routing.json"), '{"schemaVersion":1,"currentRepair":null}\n');

  assert.throws(
    () => routeRepairs(project, { runPath: run.relativePath }),
    /arbiter routing requires valid repair plan/,
  );

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "repair_planned");
  assert.match(state.blockedReason, /arbiter-routing\.json currentRepair must be an object/);
  assert.equal(state.nextRecommendedAction, "schema-check");
  assert.equal(readFileSync(join(run.absolutePath, "arbiter-routing.json"), "utf8"), '{"schemaVersion":1,"currentRepair":null}\n');
});

test("arbiter routing requires a completed repair plan", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "route too early" });

  assert.throws(
    () => routeRepairs(project, { runPath: run.relativePath }),
    /arbiter routing requires status repair_planned/,
  );
});

test("arbiter routing writes routing artifacts without starting harden", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "route repairs" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  routeRepairs(project, { runPath: run.relativePath });

  const routingMarkdown = readFileSync(join(run.absolutePath, "arbiter-routing.md"), "utf8");
  assert.match(routingMarkdown, /# Arbiter Routing/);
  assert.match(routingMarkdown, /## Current Repair/);
  assert.match(routingMarkdown, /RP-001/);
  assert.match(routingMarkdown, /## Backlog/);
  assert.match(routingMarkdown, /## Needs User Decision/);
  assert.match(routingMarkdown, /## Rejected/);
  assert.match(routingMarkdown, /Do not start harden execution in V2c/);
  assert.doesNotMatch(routingMarkdown, /repair-rounds/);
  assert.doesNotMatch(routingMarkdown, /design\/manifest/);

  const routingJson = readJson(join(run.absolutePath, "arbiter-routing.json"));
  assert.equal(routingJson.schemaVersion, 1);
  assert.equal(routingJson.runId, run.runId);
  assert.equal(routingJson.artifact, "arbiter-routing.json");
  assert.equal(routingJson.status, "READY");
  assert.deepEqual(routingJson.sourceArtifacts, ["repair-plan.json", "protected-features.md"]);
  assert.equal(routingJson.currentRepair.repairId, "RP-001");
  assert.equal(routingJson.currentRepair.findingId, "V1-F001");
  assert.deepEqual(routingJson.backlog, []);
  assert.deepEqual(routingJson.needsUserDecision, []);
  assert.deepEqual(routingJson.rejected, []);
  assert.equal("repairRound" in routingJson, false);

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "repair_routed");
  assert.equal(state.nextRecommendedAction, "harden");
  assert.ok(state.artifacts.includes("arbiter-routing.md"));
  assert.ok(state.artifacts.includes("arbiter-routing.json"));
  assert.equal(existsSync(join(run.absolutePath, "repair-rounds")), false);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("schema check rejects unknown arbiter routing fields", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "unknown routing field" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const routingPath = join(run.absolutePath, "arbiter-routing.json");
  const routing = readJson(routingPath);
  routing.deferred = [routing.currentRepair];
  writeFileSync(routingPath, `${JSON.stringify(routing, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /arbiter-routing\.json has unknown field deferred/);
});

test("schema check rejects non-exact arbiter routing bucket lists", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "wrong routing buckets" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const routingPath = join(run.absolutePath, "arbiter-routing.json");
  const routing = readJson(routingPath);
  routing.buckets = ["currentRepair", "backlog", "deferred"];
  writeFileSync(routingPath, `${JSON.stringify(routing, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /arbiter-routing\.json buckets must exactly list currentRepair, backlog, needsUserDecision, rejected/);
});

test("schema check rejects unknown nested arbiter routing repair fields", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "unknown nested routing field" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const routingPath = join(run.absolutePath, "arbiter-routing.json");
  const routing = readJson(routingPath);
  routing.currentRepair.visualDrift = { status: "PASS" };
  routing.currentRepair.designPublishing = { manifest: "design/manifest.json" };
  writeFileSync(routingPath, `${JSON.stringify(routing, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /arbiter-routing\.json currentRepair repair RP-001 has unknown field visualDrift/);
  assert.match(schema.errors.join("\n"), /arbiter-routing\.json currentRepair repair RP-001 has unknown field designPublishing/);
});

test("schema check rejects incomplete or mutated arbiter routing repair items", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "mutated routing repair" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const routingPath = join(run.absolutePath, "arbiter-routing.json");
  const routing = readJson(routingPath);
  routing.currentRepair = {
    repairId: "RP-001",
    findingId: "V1-F999",
  };
  writeFileSync(routingPath, `${JSON.stringify(routing, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /arbiter-routing\.json currentRepair repair RP-001 is missing severity/);
  assert.match(schema.errors.join("\n"), /arbiter-routing\.json currentRepair repair RP-001 must exactly match repair-plan item/);
});

test("schema check fails when routed run loses arbiter routing artifact", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "broken routing" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });
  rmSync(join(run.absolutePath, "arbiter-routing.json"));

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /missing artifact: arbiter-routing\.json/);
});

test("arbiter routing rerun blocks when existing routing artifact fails schema", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "invalid routing rerun" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const routingPath = join(run.absolutePath, "arbiter-routing.json");
  const routing = readJson(routingPath);
  routing.currentRepair = null;
  writeFileSync(routingPath, `${JSON.stringify(routing, null, 2)}\n`);

  assert.throws(
    () => routeRepairs(project, { runPath: run.relativePath }),
    /arbiter routing requires valid repair plan/,
  );
  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "repair_routed");
  assert.match(state.blockedReason, /arbiter-routing\.json currentRepair must be an object/);
  assert.equal(state.nextRecommendedAction, "schema-check");
});

test("arbiter routing rerun blocks when routed state omits routing artifacts", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "missing routed state artifact" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const statePath = join(run.absolutePath, "run-state.json");
  const state = readJson(statePath);
  state.artifacts = state.artifacts.filter((artifact) => artifact !== "arbiter-routing.md");
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  assert.throws(
    () => routeRepairs(project, { runPath: run.relativePath }),
    /arbiter routing requires valid repair plan/,
  );
  const blockedState = readJson(statePath);
  assert.equal(blockedState.status, "blocked");
  assert.equal(blockedState.previousStatus, "repair_routed");
  assert.match(blockedState.blockedReason, /run-state\.json repair_routed state must list arbiter-routing\.md/);
  assert.equal(blockedState.nextRecommendedAction, "schema-check");
});

test("harden requires routed repairs", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "harden too early" });

  assert.throws(
    () => hardenRun(project, { runPath: run.relativePath }),
    /harden requires status repair_routed/,
  );
});

test("harden writes one bounded repair round from current repair only", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "bounded harden" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  const reviewSummaryPath = join(run.absolutePath, "review-summary.md");
  const reviewSummary = readFileSync(reviewSummaryPath, "utf8");
  writeFileSync(
    reviewSummaryPath,
    reviewSummary.replace(
      "\n## Backlog items",
      [
        "",
        "### Finding 2",
        "- findingId: V1-F002",
        "- priorityRank: 2",
        "- fixOrder: 66",
        "- severity: minor",
        "- category: evidence",
        "- evidence source: degraded-evidence.md",
        "- evidenceRefs: degraded-evidence.md",
        "- affectedScreens: unknown",
        "- evidence level: E2",
        "- issue: second bounded repair input",
        "- why it feels poisoned: it verifies backlog routing remains deferred",
        "- firstRepairRecommendation: keep this item out of the current harden round",
        "",
        "## Backlog items",
      ].join("\n"),
    ),
  );
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });

  routeRepairs(project, { runPath: run.relativePath });
  hardenRun(project, { runPath: run.relativePath });

  const roundDir = join(run.absolutePath, "repair-rounds", "001");
  const roundPlan = readJson(join(roundDir, "repair-plan.json"));
  assert.equal(roundPlan.roundId, "001");
  assert.equal(roundPlan.sourceRepair.repairId, "RP-001");
  assert.equal(roundPlan.sourceRepair.findingId, "V1-F001");
  assert.equal(roundPlan.sourceRepair.status, "planned");
  assert.deepEqual(roundPlan.deferredRepairIds, ["RP-002"]);
  assert.equal("repairRounds" in roundPlan, false);

  const roundMarkdown = readFileSync(join(roundDir, "repair-plan.md"), "utf8");
  assert.match(roundMarkdown, /## Current Repair/);
  assert.match(roundMarkdown, /RP-001/);
  assert.doesNotMatch(roundMarkdown, /RP-002/);

  const evidence = readFileSync(join(roundDir, "before-after-evidence.md"), "utf8");
  assert.match(evidence, /## Before Evidence/);
  assert.match(evidence, /## After Evidence/);
  assert.match(evidence, /degraded-evidence\.md/);

  const summary = readFileSync(join(roundDir, "round-summary.md"), "utf8");
  assert.match(summary, /## Outcome/);
  assert.match(summary, /bounded harden round is planned/);
  assert.doesNotMatch(summary, /design\/manifest/);

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "repaired");
  assert.equal(state.nextRecommendedAction, "capture");
  assert.ok(state.artifacts.includes("repair-rounds/001/repair-plan.md"));
  assert.ok(state.artifacts.includes("repair-rounds/001/repair-plan.json"));
  assert.ok(state.artifacts.includes("repair-rounds/001/before-after-evidence.md"));
  assert.ok(state.artifacts.includes("repair-rounds/001/round-summary.md"));
  assert.equal(existsSync(join(run.absolutePath, "design")), false);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("harden blocks instead of overwriting residual invalid repair round artifacts", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "residual invalid harden" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });

  const roundDir = join(run.absolutePath, "repair-rounds", "001");
  mkdirSync(roundDir, { recursive: true });
  writeFileSync(join(roundDir, "repair-plan.md"), "# Repair Round 001 Plan\n\n## Summary\nstale\n");
  writeFileSync(join(roundDir, "repair-plan.json"), '{"schemaVersion":1,"sourceRepair":{"repairId":"RP-999"}}\n');

  assert.throws(
    () => hardenRun(project, { runPath: run.relativePath }),
    /harden requires valid routed repair/,
  );

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "blocked");
  assert.equal(state.previousStatus, "repair_routed");
  assert.equal(state.nextRecommendedAction, "schema-check");
  assert.match(state.blockedReason, /repair-rounds\/001\/repair-plan\.json sourceRepair must exactly match/);
  assert.equal(
    readFileSync(join(roundDir, "repair-plan.json"), "utf8"),
    '{"schemaVersion":1,"sourceRepair":{"repairId":"RP-999"}}\n',
  );
});

test("schema check rejects malformed repair round plan fields", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "malformed round plan" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });
  hardenRun(project, { runPath: run.relativePath });

  const roundPlanPath = join(run.absolutePath, "repair-rounds", "001", "repair-plan.json");
  const roundPlan = readJson(roundPlanPath);
  roundPlan.sourceRepair.findingId = "V1-F999";
  roundPlan.deferredRepairIds = ["RP-999"];
  delete roundPlan.updatedAt;
  roundPlan.sourceArtifacts = ["arbiter-routing.json"];
  roundPlan.visualDrift = { status: "PASS" };
  roundPlan.designPublishing = { manifest: "design/manifest.json" };
  writeFileSync(roundPlanPath, `${JSON.stringify(roundPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json updatedAt is required/);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json sourceArtifacts must list arbiter-routing\.json, repair-plan\.json, and protected-features\.md/);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json sourceRepair must exactly match arbiter-routing currentRepair/);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json deferredRepairIds must exactly match non-current routed repair IDs/);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json has unknown field visualDrift/);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json has unknown field designPublishing/);
});

test("capture can recapture after a bounded repair round", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "post repair recapture" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });
  hardenRun(project, { runPath: run.relativePath });

  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Post-repair automated browser capture is unavailable in this runtime.",
  });

  const state = readJson(join(run.absolutePath, "run-state.json"));
  assert.equal(state.status, "captured");
  assert.equal(state.nextRecommendedAction, "review");
  assert.ok(state.artifacts.includes("repair-rounds/001/repair-plan.md"));
  assert.ok(state.artifacts.includes("repair-rounds/001/repair-plan.json"));
  assert.ok(state.artifacts.includes("repair-rounds/001/before-after-evidence.md"));
  assert.ok(state.artifacts.includes("repair-rounds/001/round-summary.md"));

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.deepEqual(schema.errors, []);
});

test("schema check still validates repair round artifacts after post-repair capture", () => {
  const project = makeProject();
  initPoisonProject(project);
  const run = createReviewRun(project, { mode: "review", name: "captured malformed round" });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Automated browser capture is unavailable in this runtime.",
  });
  writeReviewArtifacts(project, { runPath: run.relativePath });
  gateRun(project, { runPath: run.relativePath });
  initializeProtectedFeatures(project, { runPath: run.relativePath });
  writeRepairPlan(project, { runPath: run.relativePath });
  routeRepairs(project, { runPath: run.relativePath });
  hardenRun(project, { runPath: run.relativePath });
  recordDegradedCapture(project, {
    runPath: run.relativePath,
    url: "http://localhost:5173",
    reason: "Post-repair automated browser capture is unavailable in this runtime.",
  });

  const roundPlanPath = join(run.absolutePath, "repair-rounds", "001", "repair-plan.json");
  const roundPlan = readJson(roundPlanPath);
  roundPlan.sourceRepair.findingId = "V1-F999";
  roundPlan.designPublishing = { manifest: "design/manifest.json" };
  writeFileSync(roundPlanPath, `${JSON.stringify(roundPlan, null, 2)}\n`);

  const schema = schemaCheckRun(project, { runPath: run.relativePath });
  assert.equal(schema.ok, false);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json sourceRepair must exactly match arbiter-routing currentRepair/);
  assert.match(schema.errors.join("\n"), /repair-rounds\/001\/repair-plan\.json has unknown field designPublishing/);
});
