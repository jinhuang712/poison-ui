#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import {
  buildRunBrief,
  createReviewRun,
  gateRun,
  hardenRun,
  initializeProtectedFeatures,
  initPoisonProject,
  publishDesignSnapshot,
  publishHandoffPackage,
  recordBrowserCapture,
  recordCaptureFailure,
  recordDegradedCapture,
  routeRepairs,
  schemaCheckRun,
  writeRegressionResults,
  writeVisualDriftReport,
  writeCompletionAudit,
  writeRepairPlan,
  writeReviewArtifacts,
} from "../src/core/v1-runtime.mjs";
import { createPlaywrightCaptureAdapter } from "../src/tools/playwright-capture.mjs";

const help = `poison-ui

Evidence-backed UI prototype review, hardening, design handoff, and contract validation CLI.

Usage:
  poison --help
  poison doctor [--capture] [--url <url>]
  poison brief --run <run-path>
  poison init
  poison new-run --mode review --name <name>
  poison capture --url <url> --run <run-path> [--allow-degraded]
  poison review --run <run-path>
  poison schema-check --run <run-path>
  poison gate --run <run-path>
  poison init-protected-features --run <run-path>
  poison repair-plan --run <run-path>
  poison arbiter-route --run <run-path>
  poison harden --run <run-path>
  poison regression-check --run <run-path>
  poison visual-drift --run <run-path>
  poison publish-design --run <run-path>
  poison publish-handoff --run <run-path>
  poison audit-completion --run <run-path>

See:
  docs/delivery/v1-acceptance.md
`;

const args = process.argv.slice(2);

function readJsonIfPresent(path) {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return { parseError: error.message };
  }
}

async function inspectCaptureCapability({ url, launchBrowser = false } = {}) {
  const capability = {
    forcedDegradedMode: process.env.POISON_CAPTURE_MODE === "degraded" || process.env.POISON_DISABLE_BROWSER_CAPTURE === "1",
    playwrightImport: "unknown",
    playwrightImportError: null,
    chromiumLaunch: launchBrowser ? "unknown" : "skipped",
    chromiumLaunchError: null,
    targetUrlReachable: url ? "unknown" : "not-checked",
    targetUrlError: null,
    recommendedAction: "capture",
  };

  let playwright = null;
  if (capability.forcedDegradedMode) {
    capability.recommendedAction = "unset forced degraded mode or use --allow-degraded";
  }

  try {
    playwright = await import("playwright");
    capability.playwrightImport = "ok";
  } catch (error) {
    capability.playwrightImport = "failed";
    capability.playwrightImportError = error.message;
    capability.recommendedAction = "install playwright where the active poison CLI can import it";
  }

  if (launchBrowser && playwright?.chromium) {
    try {
      const browser = await playwright.chromium.launch({ headless: true });
      await browser.close();
      capability.chromiumLaunch = "ok";
    } catch (error) {
      capability.chromiumLaunch = "failed";
      capability.chromiumLaunchError = error.message;
      capability.recommendedAction = "install or repair the Chromium browser used by Playwright";
    }
  }

  if (url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(url, { method: "GET", signal: controller.signal });
      capability.targetUrlReachable = response.ok ? "ok" : `http-${response.status}`;
      if (!response.ok) {
        capability.recommendedAction = "start or fix the target prototype server";
      }
    } catch (error) {
      capability.targetUrlReachable = "failed";
      capability.targetUrlError = error.message;
      capability.recommendedAction = "start or fix the target prototype server";
    } finally {
      clearTimeout(timeout);
    }
  }

  return capability;
}

async function projectDoctor(projectRoot, { capture = false, url } = {}) {
  const contextDir = join(projectRoot, ".poison", "context");
  const runsDir = join(projectRoot, ".poison", "runs");
  const runs = existsSync(runsDir)
    ? readdirSync(runsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const state = readJsonIfPresent(join(runsDir, entry.name, "run-state.json"));
        return {
          runId: entry.name,
          runPath: `.poison/runs/${entry.name}`,
          status: state?.status || "unknown",
          nextRecommendedAction: state?.nextRecommendedAction || null,
          stateParseError: state?.parseError || null,
        };
      })
      .sort((left, right) => left.runId.localeCompare(right.runId))
    : [];

  return {
    schemaVersion: 1,
    cliPath: new URL(import.meta.url).pathname,
    projectRoot,
    contextReady: existsSync(contextDir),
    runsReady: existsSync(runsDir),
    runCount: runs.length,
    latestRun: runs.at(-1) || null,
    designManifestReady: existsSync(join(projectRoot, "design", "manifest.json")),
    captureCapability: await inspectCaptureCapability({
      url,
      launchBrowser: Boolean(capture),
    }),
  };
}

function parseOptions(values) {
  const options = {};
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return options;
}

function fail(error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}

async function createOptionalPlaywrightAdapter() {
  if (process.env.POISON_CAPTURE_MODE === "degraded" || process.env.POISON_DISABLE_BROWSER_CAPTURE === "1") {
    return {
      unavailableReason: "Browser capture disabled by POISON_CAPTURE_MODE=degraded",
    };
  }

  try {
    const playwright = await import("playwright");
    return createPlaywrightCaptureAdapter({ playwright });
  } catch (error) {
    return {
      unavailableReason: `Playwright browser capture unavailable: ${error.message}`,
    };
  }
}

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  process.stdout.write(help);
  process.exit(0);
}

const [command, ...rest] = args;
const options = parseOptions(rest);
const cwd = process.cwd();

try {
  switch (command) {
    case "doctor":
      process.stdout.write(`${JSON.stringify(await projectDoctor(cwd, {
        capture: Boolean(options.capture),
        url: options.url,
      }), null, 2)}\n`);
      break;
    case "brief":
      process.stdout.write(buildRunBrief(cwd, { runPath: options.run }));
      break;
    case "init":
      initPoisonProject(cwd);
      process.stdout.write("init: created .poison/context and .poison/runs\n");
      break;
    case "new-run": {
      const run = createReviewRun(cwd, { mode: options.mode, name: options.name });
      process.stdout.write(`new-run: ${run.relativePath}\n`);
      break;
    }
    case "capture": {
      const adapter = await createOptionalPlaywrightAdapter();
      if (typeof adapter === "function") {
        try {
          await recordBrowserCapture(cwd, {
            runPath: options.run,
            url: options.url,
            adapter,
          });
          process.stdout.write("capture: browser evidence recorded\n");
          break;
        } catch (error) {
          if (!options["allow-degraded"]) {
            recordCaptureFailure(cwd, {
              runPath: options.run,
              url: options.url,
              reason: `Browser capture failed: ${error.message}`,
            });
            throw new Error(
              [
                `Browser capture failed: ${error.message}`,
                "Capture is blocked because no live screenshot and console evidence was recorded.",
                `Run: poison doctor --capture${options.url ? ` --url ${options.url}` : ""}`,
                "Re-run capture with --allow-degraded only after explicit user acceptance.",
              ].join("\n"),
            );
          }
          recordDegradedCapture(cwd, {
            runPath: options.run,
            url: options.url,
            reason: `Browser capture failed: ${error.message}`,
          });
          process.stdout.write("capture: degraded evidence recorded\n");
          break;
        }
      }

      if (!options["allow-degraded"]) {
        recordCaptureFailure(cwd, {
          runPath: options.run,
          url: options.url,
          reason: adapter.unavailableReason,
        });
        throw new Error(
          [
            adapter.unavailableReason,
            "Capture is blocked because no live screenshot and console evidence was recorded.",
            `Run: poison doctor --capture${options.url ? ` --url ${options.url}` : ""}`,
            "Re-run capture with --allow-degraded only after explicit user acceptance.",
          ].join("\n"),
        );
      }
      recordDegradedCapture(cwd, {
        runPath: options.run,
        url: options.url,
        reason: adapter.unavailableReason,
      });
      process.stdout.write("capture: degraded evidence recorded\n");
      break;
    }
    case "review":
      writeReviewArtifacts(cwd, { runPath: options.run });
      process.stdout.write("review: artifacts written\n");
      break;
    case "schema-check": {
      const result = schemaCheckRun(cwd, { runPath: options.run });
      if (!result.ok) {
        process.stdout.write(`schema-check: FAIL\n${result.errors.map((error) => `- ${error}`).join("\n")}\n`);
        process.exit(1);
      }
      process.stdout.write("schema-check: PASS\n");
      break;
    }
    case "gate": {
      const result = gateRun(cwd, { runPath: options.run });
      process.stdout.write(`gate: ${result.verdict}\n`);
      if (result.verdict !== "PASS") {
        process.exit(1);
      }
      break;
    }
    case "init-protected-features":
      initializeProtectedFeatures(cwd, { runPath: options.run });
      process.stdout.write("init-protected-features: protected baseline written\n");
      break;
    case "repair-plan":
      writeRepairPlan(cwd, { runPath: options.run });
      process.stdout.write("repair-plan: artifacts written\n");
      break;
    case "arbiter-route":
      routeRepairs(cwd, { runPath: options.run });
      process.stdout.write("arbiter-route: artifacts written\n");
      break;
    case "harden":
      hardenRun(cwd, { runPath: options.run });
      process.stdout.write("harden: repair round artifacts written\n");
      break;
    case "regression-check":
      writeRegressionResults(cwd, { runPath: options.run });
      process.stdout.write("regression-check: protected feature checks written\n");
      break;
    case "visual-drift":
      writeVisualDriftReport(cwd, { runPath: options.run });
      process.stdout.write("visual-drift: report written\n");
      break;
    case "publish-design":
      publishDesignSnapshot(cwd, { runPath: options.run });
      process.stdout.write("publish-design: minimal design handoff written\n");
      break;
    case "publish-handoff":
      publishHandoffPackage(cwd, { runPath: options.run });
      process.stdout.write("publish-handoff: handoff package written\n");
      break;
    case "audit-completion":
      writeCompletionAudit(cwd, { runPath: options.run });
      process.stdout.write("audit-completion: report written\n");
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  fail(error);
}
