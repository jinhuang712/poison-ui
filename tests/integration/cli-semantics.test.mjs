import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const repoRoot = new URL("../..", import.meta.url).pathname;
const cliPath = join(repoRoot, "bin", "poison.mjs");

function runPoison(cwd, args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, POISON_CAPTURE_MODE: "degraded" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function execPoison(cwd, args) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, POISON_CAPTURE_MODE: "degraded" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function makeProject() {
  return mkdtempSync(join(tmpdir(), "poison-cli-semantics-"));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("CLI semantics freeze success, usage error, and unknown command output channels", () => {
  const project = makeProject();

  const help = runPoison(project, ["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  assert.equal(help.stderr, "");

  const unknown = runPoison(project, ["not-a-command"]);
  assert.equal(unknown.status, 1);
  assert.equal(unknown.stdout, "");
  assert.match(unknown.stderr, /Unknown command: not-a-command/);

  const doctor = runPoison(project, ["doctor"]);
  assert.equal(doctor.status, 0);
  assert.equal(doctor.stderr, "");
  const doctorJson = JSON.parse(doctor.stdout);
  assert.equal(doctorJson.schemaVersion, 1);
  assert.equal(doctorJson.contextReady, false);
  assert.equal(doctorJson.runCount, 0);
  assert.equal(doctorJson.latestRun, null);

  const missingRun = runPoison(project, ["schema-check"]);
  assert.equal(missingRun.status, 1);
  assert.equal(missingRun.stdout, "");
  assert.match(missingRun.stderr, /--run is required/);
});

test("CLI semantics freeze schema failure output and blocked recovery metadata", () => {
  const project = makeProject();
  execPoison(project, ["init"]);
  const initializedDoctor = JSON.parse(execPoison(project, ["doctor"]));
  assert.equal(initializedDoctor.contextReady, true);
  assert.equal(initializedDoctor.runsReady, true);

  execPoison(project, ["new-run", "--mode", "review", "--name", "semantics"]);
  const runPath = ".poison/runs/001-semantics";
  const runDir = join(project, runPath);
  const runDoctor = JSON.parse(execPoison(project, ["doctor"]));
  assert.equal(runDoctor.runCount, 1);
  assert.equal(runDoctor.latestRun.runPath, runPath);
  assert.equal(runDoctor.latestRun.status, "created");

  const earlyGate = runPoison(project, ["gate", "--run", runPath]);
  assert.equal(earlyGate.status, 1);
  assert.equal(earlyGate.stdout, "");
  assert.match(earlyGate.stderr, /review-summary\.md is required before gate/);
  assert.equal(readJson(join(runDir, "run-state.json")).status, "created");

  execPoison(project, ["capture", "--url", "http://localhost:5173", "--run", runPath]);
  const reviewedStateBeforeGate = readJson(join(runDir, "run-state.json"));
  execPoison(project, ["review", "--run", runPath]);
  const summaryPath = join(runDir, "review-summary.md");
  const brokenSummary = readFileSync(summaryPath, "utf8").replace(/^- issue: .*\n/m, "");
  writeFileSync(summaryPath, brokenSummary);

  const schema = runPoison(project, ["schema-check", "--run", runPath]);
  assert.equal(schema.status, 1);
  assert.match(schema.stdout, /^schema-check: FAIL/m);
  assert.match(schema.stdout, /review-summary\.md Finding 1 is missing issue/);
  assert.equal(schema.stderr, "");
  assert.equal(readJson(join(runDir, "run-state.json")).status, "reviewed");

  const gate = runPoison(project, ["gate", "--run", runPath]);
  assert.equal(gate.status, 1);
  assert.match(gate.stdout, /gate: FAIL/);
  assert.equal(gate.stderr, "");
  const blocked = readJson(join(runDir, "run-state.json"));
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.previousStatus, "reviewed");
  assert.match(blocked.blockedReason, /review-summary\.md Finding 1 is missing issue/);
  assert.equal(blocked.nextRecommendedAction, "schema-check");
  assert.ok(existsSync(join(runDir, "gate-report.md")));
  assert.equal(reviewedStateBeforeGate.status, "captured");
});
