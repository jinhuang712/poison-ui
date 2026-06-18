import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const repoRoot = new URL("../..", import.meta.url).pathname;
const cliPath = join(repoRoot, "bin", "poison.mjs");
const manifestPath = join(repoRoot, "docs", "contracts", "adapter-command-manifest.json");

test("V4c adapter command manifest maps implemented commands to shared CLI", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const help = execFileSync(process.execPath, [cliPath, "--help"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.behaviorOwner, "poison-cli-shared-core");
  assert.equal(manifest.adaptersMayDefinePrivateSchemas, false);
  assert.deepEqual(
    manifest.commands.map((command) => command.name),
    [
      "doctor",
      "init",
      "new-run",
      "capture",
      "review",
      "schema-check",
      "gate",
      "init-protected-features",
      "repair-plan",
      "arbiter-route",
      "harden",
      "regression-check",
      "visual-drift",
      "publish-design",
      "publish-handoff",
      "audit-completion",
    ],
  );

  for (const command of manifest.commands) {
    assert.equal(command.adapterEntry, "poison");
    assert.equal(command.privateBehaviorAllowed, false);
    assert.match(help, new RegExp(`poison ${escapeRegExp(command.name)}`));
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
