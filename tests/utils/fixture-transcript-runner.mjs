import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function runFixtureTranscript({ repoRoot, fixturePath }) {
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  assert.equal(fixture.schemaVersion, 1);
  assert.ok(Array.isArray(fixture.steps));

  const projectRoot = mkdtempSync(join(tmpdir(), `${fixture.name}-`));
  const cliPath = join(repoRoot, "bin", "poison.mjs");
  const steps = fixture.steps.map((step) => {
    const result = spawnSync(process.execPath, [cliPath, ...step.args], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    assert.equal(result.status, step.exitCode ?? 0, `${step.command} exit code`);
    if (step.stdoutIncludes) {
      assert.match(result.stdout, new RegExp(escapeRegExp(step.stdoutIncludes)), `${step.command} stdout`);
    }
    if (step.stderrIncludes) {
      assert.match(result.stderr, new RegExp(escapeRegExp(step.stderrIncludes)), `${step.command} stderr`);
    } else {
      assert.equal(result.stderr, "", `${step.command} stderr`);
    }

    return {
      command: step.command,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  });

  const runDir = join(projectRoot, fixture.runPath);
  const finalState = JSON.parse(readFileSync(join(runDir, "run-state.json"), "utf8"));
  return {
    projectRoot,
    runDir,
    steps,
    finalState,
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
