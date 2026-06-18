import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { runFixtureTranscript } from "../utils/fixture-transcript-runner.mjs";

const repoRoot = new URL("../..", import.meta.url).pathname;

test("V4b fixture transcript locks the V1-V3c happy path", () => {
  const fixturePath = join(repoRoot, "tests", "fixtures", "transcripts", "v1-v3c-happy-path.json");
  assert.ok(existsSync(fixturePath));

  const result = runFixtureTranscript({ repoRoot, fixturePath });

  assert.equal(result.steps.length, 20);
  assert.equal(result.steps[0].command, "init");
  assert.equal(result.steps.at(-1).command, "brief");
  assert.deepEqual(result.steps.map((step) => step.status), Array(20).fill(0));
  assert.match(result.steps.find((step) => step.command === "audit-completion").stdout, /audit-completion: report written/);
  assert.match(result.steps.at(-1).stdout, /## 先修什么/);
  assert.doesNotMatch(result.steps.at(-1).stdout, /V1-F001/);
  assert.equal(result.finalState.status, "published");
  assert.ok(result.finalState.artifacts.includes("completion-report.md"));
  assert.equal(existsSync(join(result.projectRoot, "design", "review")), false);

  const report = readFileSync(join(result.runDir, "completion-report.md"), "utf8");
  assert.match(report, /IMPLEMENTED: V3a minimal design handoff/);
  assert.doesNotMatch(report, /\d+\s*%/);
});
