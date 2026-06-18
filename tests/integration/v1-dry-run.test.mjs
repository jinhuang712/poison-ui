import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const repoRoot = new URL("../..", import.meta.url).pathname;
const cliPath = join(repoRoot, "bin", "poison.mjs");

function runPoison(cwd, args) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, POISON_DISABLE_BROWSER_CAPTURE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function makeProject() {
  return mkdtempSync(join(tmpdir(), "poison-v1-"));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("V1 review-first dry-run can initialize V2 protected baseline and repair plan after gate", () => {
  const project = makeProject();

  runPoison(project, ["init"]);
  assert.match(readFileSync(join(project, ".poison/context/poison-core.current.md"), "utf8"), /# Poison Core/);
  assert.match(readFileSync(join(project, ".poison/context/open-questions.md"), "utf8"), /# Open Questions/);

  const newRunOutput = runPoison(project, ["new-run", "--mode", "review", "--name", "poisoned-demo"]);
  assert.match(newRunOutput, /001-poisoned-demo/);
  const runDir = join(project, ".poison/runs/001-poisoned-demo");

  let state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "created");
  assert.equal(state.nextRecommendedAction, "capture");

  runPoison(project, ["capture", "--url", "http://localhost:5173", "--run", ".poison/runs/001-poisoned-demo", "--allow-degraded"]);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "captured");
  assert.equal(state.nextRecommendedAction, "review");
  assert.ok(
    existsSync(join(runDir, "degraded-evidence.md")) ||
      existsSync(join(runDir, "screenshot-manifest.json")),
    "capture should record degraded or browser evidence",
  );

  runPoison(project, ["review", "--run", ".poison/runs/001-poisoned-demo"]);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "reviewed");
  assert.equal(state.nextRecommendedAction, "gate");
  const summary = readFileSync(join(runDir, "review-summary.md"), "utf8");
  assert.match(summary, /## Findings/);
  assert.match(summary, /findingId:/);
  assert.match(summary, /priorityRank:/);
  assert.match(summary, /fixOrder:/);
  assert.match(summary, /severity:/);
  assert.match(summary, /category:/);
  assert.match(summary, /evidence source:/);
  assert.match(summary, /evidenceRefs:/);
  assert.match(summary, /affectedScreens:/);
  assert.match(summary, /issue:/);
  assert.match(summary, /why it feels poisoned:/);
  assert.match(summary, /firstRepairRecommendation:/);
  assert.doesNotMatch(summary, /protected behavior/i);

  const schemaOutput = runPoison(project, ["schema-check", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(schemaOutput, /schema-check: PASS/);

  const gateOutput = runPoison(project, ["gate", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(gateOutput, /gate: PASS/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "gated");
  assert.equal(state.nextRecommendedAction, "repair-plan-or-user-review");
  assert.match(readFileSync(join(runDir, "gate-report.md"), "utf8"), /## Verdict\nPASS/);
  assert.match(readFileSync(join(runDir, "gate-report.md"), "utf8"), /V1-F001:/);

  const brief = runPoison(project, ["brief", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(brief, /# Poison 结果/);
  assert.match(brief, /## 结论/);
  assert.match(brief, /流程检查通过，不代表界面已经没问题/);
  assert.match(brief, /## 先修什么/);
  assert.match(brief, /## 怎么验收/);
  assert.doesNotMatch(brief, /\.poison\/runs/);

  const verboseBrief = runPoison(project, ["brief", "--run", ".poison/runs/001-poisoned-demo", "--verbose"]);
  assert.match(verboseBrief, /# Poison Brief/);
  assert.match(verboseBrief, /V1-F001/);

  const protectedOutput = runPoison(project, ["init-protected-features", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(protectedOutput, /init-protected-features: protected baseline written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "protected_ready");
  assert.equal(state.nextRecommendedAction, "repair-plan");
  assert.match(readFileSync(join(runDir, "protected-features.md"), "utf8"), /# Protected Features/);
  assert.doesNotMatch(readFileSync(join(runDir, "protected-features.md"), "utf8"), /design\/manifest/);

  const repairOutput = runPoison(project, ["repair-plan", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(repairOutput, /repair-plan: artifacts written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "repair_planned");
  assert.equal(state.nextRecommendedAction, "arbiter-route");
  assert.match(readFileSync(join(runDir, "repair-plan.md"), "utf8"), /findingId: V1-F001/);
  assert.equal(readJson(join(runDir, "repair-plan.json")).repairs[0].findingId, "V1-F001");

  const routingOutput = runPoison(project, ["arbiter-route", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(routingOutput, /arbiter-route: artifacts written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "repair_routed");
  assert.equal(state.nextRecommendedAction, "harden");
  assert.match(readFileSync(join(runDir, "arbiter-routing.md"), "utf8"), /RP-001/);
  assert.equal(readJson(join(runDir, "arbiter-routing.json")).currentRepair.repairId, "RP-001");

  const hardenOutput = runPoison(project, ["harden", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(hardenOutput, /harden: repair round artifacts written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "repaired");
  assert.equal(state.nextRecommendedAction, "capture");
  assert.match(readFileSync(join(runDir, "repair-rounds/001/repair-plan.md"), "utf8"), /RP-001/);
  assert.equal(readJson(join(runDir, "repair-rounds/001/repair-plan.json")).sourceRepair.repairId, "RP-001");
  assert.match(readFileSync(join(runDir, "repair-rounds/001/before-after-evidence.md"), "utf8"), /pending recapture/);
  assert.match(readFileSync(join(runDir, "repair-rounds/001/round-summary.md"), "utf8"), /bounded harden round is planned/);

  runPoison(project, ["capture", "--url", "http://localhost:5173", "--run", ".poison/runs/001-poisoned-demo", "--allow-degraded"]);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "captured");
  assert.equal(state.nextRecommendedAction, "review");
  assert.ok(state.artifacts.includes("repair-rounds/001/round-summary.md"));

  runPoison(project, ["review", "--run", ".poison/runs/001-poisoned-demo"]);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "reviewed");
  assert.match(readFileSync(join(runDir, "review-summary.md"), "utf8"), /Post-repair review/);
  assert.match(readFileSync(join(runDir, "review-summary.md"), "utf8"), /repair-rounds\/001\/round-summary\.md/);

  const postRepairSchemaOutput = runPoison(project, ["schema-check", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(postRepairSchemaOutput, /schema-check: PASS/);

  const postRepairGateOutput = runPoison(project, ["gate", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(postRepairGateOutput, /gate: PASS/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "gated");
  assert.ok(state.artifacts.includes("repair-rounds/001/repair-plan.json"));

  const regressionOutput = runPoison(project, ["regression-check", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(regressionOutput, /regression-check: protected feature checks written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "gated");
  assert.ok(state.artifacts.includes("repair-rounds/001/regression-results.json"));
  const regression = readJson(join(runDir, "repair-rounds/001/regression-results.json"));
  assert.equal(regression.verdict, "PASS");
  assert.equal(regression.protectedFeatureChecks[0].item, "none declared yet");
  assert.equal(existsSync(join(runDir, "design")), false);

  const driftOutput = runPoison(project, ["visual-drift", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(driftOutput, /visual-drift: report written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "gated");
  assert.ok(state.artifacts.includes("repair-rounds/001/visual-drift.json"));
  const drift = readJson(join(runDir, "repair-rounds/001/visual-drift.json"));
  assert.equal(drift.status, "ABSENT");
  assert.equal(drift.verdict, "NO_VISUAL_EVIDENCE");
  assert.equal(existsSync(join(runDir, "design")), false);

  const publishOutput = runPoison(project, ["publish-design", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(publishOutput, /publish-design: minimal design handoff written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "published");
  assert.ok(state.artifacts.includes("design/manifest.json"));
  assert.ok(state.artifacts.includes("design/handoff.md"));
  const designManifest = readJson(join(project, "design", "manifest.json"));
  assert.equal(designManifest.sourceRunId, "001-poisoned-demo");
  assert.deepEqual(designManifest.files, ["design/manifest.json", "design/handoff.md"]);
  assert.match(readFileSync(join(project, "design", "handoff.md"), "utf8"), /## Source Evidence/);
  assert.equal(existsSync(join(project, "design", "screens")), false);

  const handoffOutput = runPoison(project, ["publish-handoff", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(handoffOutput, /publish-handoff: handoff package written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "published");
  assert.ok(state.artifacts.includes("design/handoff/implementation-map.md"));
  const handoffManifest = readJson(join(project, "design", "manifest.json"));
  assert.equal(handoffManifest.packageStatus, "HANDOFF_READY");
  assert.deepEqual(handoffManifest.files, [
    "design/manifest.json",
    "design/handoff.md",
    "design/handoff/implementation-map.md",
    "design/handoff/acceptance-checklist.md",
    "design/handoff/open-questions.md",
    "design/handoff/backlog.md",
  ]);
  assert.match(readFileSync(join(project, "design", "handoff", "implementation-map.md"), "utf8"), /## Implementation Map/);
  assert.equal(existsSync(join(project, "design", "screens")), false);

  const auditOutput = runPoison(project, ["audit-completion", "--run", ".poison/runs/001-poisoned-demo"]);
  assert.match(auditOutput, /audit-completion: report written/);
  state = readJson(join(runDir, "run-state.json"));
  assert.equal(state.status, "published");
  assert.ok(state.artifacts.includes("completion-audit-packet.md"));
  assert.ok(state.artifacts.includes("completion-report.md"));
  assert.match(readFileSync(join(runDir, "completion-report.md"), "utf8"), /## Completion Labels/);
  assert.equal(existsSync(join(project, "design", "review")), false);
});
