import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const repoRoot = new URL("../..", import.meta.url).pathname;
const reportPath = join(repoRoot, "docs", "delivery", "package-validation-report.json");

test("V4e package validation report records package readiness without publishing", () => {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.releasePublished, false);
  assert.equal(report.packageName, pkg.name);
  assert.equal(report.bin.poison, pkg.bin.poison);
  assert.equal(report.bin.poison, "bin/poison.mjs");
  assert.deepEqual(report.requiredFiles, ["bin", "src", "docs", "skills", "README.md", "LICENSE"]);
  assert.deepEqual(report.missingRequiredFiles, []);
  assert.equal(report.verdict, "READY_FOR_MANUAL_RELEASE_REVIEW");

  for (const file of report.requiredFiles) {
    assert.ok(existsSync(join(repoRoot, file)), `${file} should exist`);
    assert.ok(pkg.files.includes(file), `${file} should be included in package files`);
  }
});
