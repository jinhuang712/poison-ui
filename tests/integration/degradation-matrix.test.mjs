import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const repoRoot = new URL("../..", import.meta.url).pathname;
const matrixPath = join(repoRoot, "docs", "contracts", "harness-degradation-matrix.json");

test("V4d harness degradation matrix documents current local fallback behavior", () => {
  const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));

  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.scope, "local-cli-current-harness");
  assert.equal(matrix.crossHarnessSupportClaimed, false);
  assert.deepEqual(
    matrix.degradations.map((item) => item.capability),
    [
      "browser-automation",
      "console-evidence",
      "referenced-artifact",
      "completion-percentage-denominator",
      "external-subagent",
    ],
  );

  const browser = matrix.degradations.find((item) => item.capability === "browser-automation");
  assert.equal(browser.command, "capture");
  assert.equal(browser.behavior, "write degraded-evidence.md and continue as captured");
  assert.equal(browser.exitCode, 0);

  const artifact = matrix.degradations.find((item) => item.capability === "referenced-artifact");
  assert.equal(artifact.command, "gate");
  assert.equal(artifact.behavior, "write gate-report.md and move run to blocked");
  assert.equal(artifact.nextRecommendedAction, "schema-check");

  const percentage = matrix.degradations.find((item) => item.capability === "completion-percentage-denominator");
  assert.equal(percentage.command, "audit-completion");
  assert.equal(percentage.behavior, "label percentage as blocked and publish no percentage");
});
