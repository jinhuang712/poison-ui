import {
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const STATE_STATUSES = new Set(["created", "captured", "reviewed", "gated", "completed", "blocked"]);
const REQUIRED_STATE_FIELDS = [
  "schemaVersion",
  "runId",
  "mode",
  "status",
  "previousStatus",
  "blockedReason",
  "nextRecommendedAction",
  "artifacts",
  "updatedAt",
];
const REQUIRED_FINDING_FIELDS = [
  "findingId",
  "priorityRank",
  "fixOrder",
  "severity",
  "category",
  "evidence source",
  "evidenceRefs",
  "affectedScreens",
  "issue",
  "why it feels poisoned",
  "firstRepairRecommendation",
];

function now() {
  return new Date().toISOString();
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeBuffer(path, bytes) {
  writeFileSync(path, Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || ""));
}

function writeFileIfMissing(path, content) {
  if (!existsSync(path)) {
    writeFileSync(path, content);
  }
}

function slugifyName(name) {
  return String(name || "review-run")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "review-run";
}

function parseRunId(runPath) {
  return basename(resolve(runPath));
}

function normalizeRunPath(projectRoot, runPath) {
  if (!runPath) {
    throw new Error("--run is required");
  }

  const absolutePath = resolve(projectRoot, runPath);
  return {
    absolutePath,
    relativePath: relative(projectRoot, absolutePath),
    runId: parseRunId(absolutePath),
  };
}

function statePath(runDir) {
  return join(runDir, "run-state.json");
}

function readState(runDir) {
  return JSON.parse(readFileSync(statePath(runDir), "utf8"));
}

function writeState(runDir, nextState) {
  const state = {
    ...nextState,
    updatedAt: now(),
  };
  writeFileSync(statePath(runDir), `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

function addArtifact(state, artifact) {
  return {
    ...state,
    artifacts: Array.from(new Set([...(state.artifacts || []), artifact])),
  };
}

function addArtifacts(state, artifacts) {
  return artifacts.reduce((nextState, artifact) => addArtifact(nextState, artifact), state);
}

function removeArtifacts(state, artifacts) {
  const removeSet = new Set(artifacts);
  return {
    ...state,
    artifacts: (state.artifacts || []).filter((artifact) => !removeSet.has(artifact)),
  };
}

function removeGeneratedEvidence(runDir) {
  rmSync(join(runDir, "screenshot-manifest.json"), { force: true });
  rmSync(join(runDir, "console.log"), { force: true });
  rmSync(join(runDir, "pageerrors.log"), { force: true });
  rmSync(join(runDir, "screenshots"), { recursive: true, force: true });
}

function clearGeneratedEvidenceArtifacts(state) {
  return {
    ...state,
    artifacts: (state.artifacts || []).filter((artifact) => (
      artifact !== "screenshot-manifest.json"
      && artifact !== "console.log"
      && artifact !== "pageerrors.log"
      && !artifact.startsWith("screenshots/")
    )),
  };
}

function frontMatter({ runId, artifact, status = "READY", source }) {
  return [
    "---",
    "schemaVersion: 1",
    `runId: ${runId}`,
    `artifact: ${artifact}`,
    `status: ${status}`,
    `source: ${source}`,
    `updatedAt: ${now()}`,
    "---",
    "",
  ].join("\n");
}

function writeMarkdown(runDir, runId, artifact, status, source, body) {
  writeFileSync(join(runDir, artifact), `${frontMatter({ runId, artifact, status, source })}${body}`);
}

function requireMarkdownSections(runDir, artifact, sections, errors) {
  const path = join(runDir, artifact);
  if (!existsSync(path)) {
    errors.push(`${artifact} is missing`);
    return;
  }

  const content = readFileSync(path, "utf8");
  if (!content.startsWith("---\n")) {
    errors.push(`${artifact} is missing metadata`);
  }
  for (const section of sections) {
    if (!content.includes(`## ${section}`)) {
      errors.push(`${artifact} is missing ## ${section}`);
    }
  }
}

function findReviewFindings(summary) {
  const findingsSection = summary.split(/^## Findings\s*$/m)[1]?.split(/^## /m)[0] || "";
  return findingsSection
    .split(/^### Finding /m)
    .slice(1)
    .map((finding, index) => ({
      label: `Finding ${String(finding.match(/^([^\n]+)/)?.[1] || index + 1).trim()}`,
      content: finding,
    }));
}

function validateReviewFindings(summary, errors) {
  const findings = findReviewFindings(summary);
  if (findings.length === 0) {
    errors.push("review-summary.md findings must include at least one finding");
    return;
  }

  for (const finding of findings) {
    for (const field of REQUIRED_FINDING_FIELDS) {
      if (!finding.content.includes(`- ${field}:`)) {
        errors.push(`review-summary.md ${finding.label} is missing ${field}`);
      }
    }
  }
}

function readTextIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function severeRuntimeErrors(runDir) {
  const errors = [];
  const consoleLog = readTextIfExists(join(runDir, "console.log"));
  if (/(^|\n)\s*(\[error\]|error:|console\.error\b)/i.test(consoleLog)) {
    errors.push("severe-runtime-error: console evidence contains level error");
  }

  const pageErrors = readTextIfExists(join(runDir, "pageerrors.log"));
  if (pageErrors.trim()) {
    errors.push("severe-runtime-error: browser pageerror evidence is present");
  }

  return errors;
}

function formatConsoleEntries(entries = []) {
  return entries
    .map((entry) => {
      const timestamp = entry.timestamp ? `${entry.timestamp} ` : "";
      const level = entry.level || "log";
      const text = entry.text || "";
      return `${timestamp}[${level}] ${text}`;
    })
    .join("\n");
}

export function initPoisonProject(projectRoot = process.cwd()) {
  const poisonRoot = join(projectRoot, ".poison");
  const contextDir = join(poisonRoot, "context");
  const runsDir = join(poisonRoot, "runs");

  ensureDir(contextDir);
  ensureDir(runsDir);
  writeFileIfMissing(
    join(contextDir, "poison-core.current.md"),
    "# Poison Core\n\n## Summary\n\nV1 review-first runtime context placeholder. Replace with project facts before review.\n",
  );
  writeFileIfMissing(
    join(contextDir, "open-questions.md"),
    "# Open Questions\n\n- none\n",
  );

  return { contextDir, runsDir };
}

export function createReviewRun(projectRoot = process.cwd(), { mode = "review", name } = {}) {
  if (mode !== "review") {
    throw new Error("V1 only supports --mode review");
  }

  initPoisonProject(projectRoot);

  const runsDir = join(projectRoot, ".poison", "runs");
  const existingRuns = existsSync(runsDir)
    ? readdirSync(runsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
    : 0;
  const sequence = String(existingRuns + 1).padStart(3, "0");
  const runId = `${sequence}-${slugifyName(name)}`;
  const absolutePath = join(runsDir, runId);
  ensureDir(absolutePath);

  const initialState = {
    schemaVersion: 1,
    runId,
    mode,
    status: "created",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "capture",
    artifacts: ["run-state.json", "run-contract.md", "context-health.md"],
    updatedAt: now(),
  };

  writeState(absolutePath, initialState);
  writeMarkdown(
    absolutePath,
    runId,
    "run-contract.md",
    "READY",
    "new-run",
    [
      "# Run Contract",
      "",
      "## Summary",
      "Review-first V1 dry-run contract.",
      "",
      "## Inputs",
      "- mode: review",
      `- name: ${name || "review-run"}`,
      "",
      "## Evidence",
      "none",
      "",
      "## Decisions",
      "none",
      "",
      "## Open Questions",
      "none",
      "",
      "## Next Actions",
      "- capture evidence or record an explicit evidence gap",
      "",
    ].join("\n"),
  );
  writeMarkdown(
    absolutePath,
    runId,
    "context-health.md",
    "READY",
    "new-run",
    [
      "# Context Health",
      "",
      "## Summary",
      "Required V1 context files are present or can be completed by the user.",
      "",
      "## Inputs",
      "- .poison/context/poison-core.current.md",
      "- .poison/context/open-questions.md",
      "",
      "## Evidence",
      "none",
      "",
      "## Decisions",
      "none",
      "",
      "## Open Questions",
      "none",
      "",
      "## Next Actions",
      "- capture",
      "",
    ].join("\n"),
  );

  return {
    runId,
    absolutePath,
    relativePath: relative(projectRoot, absolutePath),
  };
}

export function recordDegradedCapture(projectRoot = process.cwd(), { runPath, url, reason } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (!["created", "blocked", "captured"].includes(state.status)) {
    throw new Error(`capture cannot run from status ${state.status}`);
  }

  removeGeneratedEvidence(run.absolutePath);
  writeMarkdown(
    run.absolutePath,
    run.runId,
    "degraded-evidence.md",
    "READY",
    "capture",
    [
      "# Degraded Evidence",
      "",
      "## Summary",
      "Automated browser capture was not performed by the V1 local runtime.",
      "",
      "## Inputs",
      `- url: ${url || "not provided"}`,
      "",
      "## Evidence",
      `- evidence level: E2`,
      `- evidence source: ${reason || "automated capture unavailable"}`,
      "- limitation: no screenshot or live console evidence was collected",
      "",
      "## Decisions",
      "- Continue with a degraded review packet that does not claim visual observations.",
      "",
      "## Open Questions",
      "- Can a human or browser adapter provide screenshots and console evidence?",
      "",
      "## Next Actions",
      "- review",
      "",
    ].join("\n"),
  );

  const nextState = addArtifact(
    {
      ...clearGeneratedEvidenceArtifacts(state),
      status: "captured",
      previousStatus: null,
      blockedReason: null,
      nextRecommendedAction: "review",
    },
    "degraded-evidence.md",
  );
  return writeState(run.absolutePath, nextState);
}

export async function recordBrowserCapture(projectRoot = process.cwd(), { runPath, url, adapter } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (!["created", "blocked", "captured"].includes(state.status)) {
    throw new Error(`capture cannot run from status ${state.status}`);
  }
  if (typeof adapter !== "function") {
    throw new Error("browser capture adapter is required");
  }

  const screenshotsDir = join(run.absolutePath, "screenshots");
  ensureDir(screenshotsDir);

  const result = await adapter({
    url,
    runDir: run.absolutePath,
    outputDir: screenshotsDir,
  });
  const screenshot = result?.screenshot;
  if (!screenshot?.fileName || !screenshot.bytes) {
    throw new Error("browser capture adapter must return screenshot fileName and bytes");
  }

  const screenshotPath = join("screenshots", screenshot.fileName);
  writeBuffer(join(run.absolutePath, screenshotPath), screenshot.bytes);

  const consoleEntries = result.consoleEntries || [];
  writeFileSync(join(run.absolutePath, "console.log"), `${formatConsoleEntries(consoleEntries)}\n`);

  const pageErrors = result.pageErrors || [];
  rmSync(join(run.absolutePath, "pageerrors.log"), { force: true });
  if (pageErrors.length > 0) {
    writeFileSync(join(run.absolutePath, "pageerrors.log"), `${pageErrors.map((error) => error.text || String(error)).join("\n")}\n`);
  }

  const manifest = {
    schemaVersion: 1,
    kind: "browser",
    runId: run.runId,
    url: url || null,
    capturedAt: now(),
    screenshots: [
      {
        path: screenshotPath,
        width: screenshot.width || null,
        height: screenshot.height || null,
      },
    ],
    console: {
      path: "console.log",
      entries: consoleEntries.length,
    },
    pageErrors: {
      path: pageErrors.length > 0 ? "pageerrors.log" : null,
      entries: pageErrors.length,
    },
    metadata: result.metadata || {},
  };
  writeFileSync(join(run.absolutePath, "screenshot-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const artifacts = ["screenshot-manifest.json", "console.log", screenshotPath];
  if (pageErrors.length > 0) {
    artifacts.push("pageerrors.log");
  }

  return writeState(run.absolutePath, {
    ...addArtifacts(removeArtifacts(state, ["pageerrors.log"]), artifacts),
    status: "captured",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "review",
  });
}

export function writeReviewArtifacts(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "captured") {
    throw new Error(`review requires status captured, got ${state.status}`);
  }

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "review-packet.md",
    "READY",
    "review",
    [
      "# Review Packet",
      "",
      "## Summary",
      "V1 review packet assembled from run contract, context health, and degraded evidence.",
      "",
      "## Inputs",
      "- run-contract.md",
      "- context-health.md",
      "- degraded-evidence.md",
      "",
      "## Evidence",
      "- degraded-evidence.md",
      "",
      "## Decisions",
      "none",
      "",
      "## Open Questions",
      "none",
      "",
      "## Next Actions",
      "- schema-check",
      "",
    ].join("\n"),
  );
  writeMarkdown(
    run.absolutePath,
    run.runId,
    "review-summary.md",
    "READY",
    "review",
    [
      "# Review Summary",
      "",
      "## Target",
      "Local prototype review with degraded evidence.",
      "",
      "## Vote tally",
      "PASS_WITH_FIXES: 1",
      "",
      "## Majority position",
      "Proceed only with mechanical readiness conclusions until runtime evidence is available.",
      "",
      "## Minority concerns",
      "none",
      "",
      "## Evidence-backed blockers",
      "none",
      "",
      "## Designer discretion items",
      "none",
      "",
      "## Findings",
      "### Finding 1",
      "- findingId: V1-F001",
      "- priorityRank: 1",
      "- fixOrder: 65",
      "- severity: minor",
      "- category: evidence",
      "- evidence source: degraded-evidence.md",
      "- evidenceRefs: degraded-evidence.md",
      "- affectedScreens: unknown",
      "- evidence level: E2",
      "- issue: automated visual evidence is unavailable",
      "- why it feels poisoned: UI quality cannot be assessed from runtime screenshots in this run",
      "- firstRepairRecommendation: provide screenshots or enable a browser adapter before making visual claims",
      "",
      "## Backlog items",
      "- Capture real screenshot and console evidence before making visual findings.",
      "",
      "## Rejected personal-taste findings",
      "none",
      "",
    ].join("\n"),
  );

  let nextState = addArtifact(state, "review-packet.md");
  nextState = addArtifact(nextState, "review-summary.md");
  return writeState(run.absolutePath, {
    ...nextState,
    status: "reviewed",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "gate",
  });
}

export function schemaCheckRun(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const errors = [];
  let state;

  try {
    state = readState(run.absolutePath);
  } catch (error) {
    errors.push(`run-state.json failed to parse: ${error.message}`);
  }

  if (state) {
    for (const field of REQUIRED_STATE_FIELDS) {
      if (!(field in state)) {
        errors.push(`run-state.json is missing ${field}`);
      }
    }
    if (state.schemaVersion !== 1) {
      errors.push("run-state.json schemaVersion must be 1");
    }
    if (!STATE_STATUSES.has(state.status)) {
      errors.push(`run-state.json has illegal status ${state.status}`);
    }
    if (!Array.isArray(state.artifacts)) {
      errors.push("run-state.json artifacts must be an array");
    }
  }

  requireMarkdownSections(run.absolutePath, "run-contract.md", ["Summary", "Inputs", "Evidence", "Decisions", "Open Questions", "Next Actions"], errors);
  requireMarkdownSections(run.absolutePath, "context-health.md", ["Summary", "Inputs", "Evidence", "Decisions", "Open Questions", "Next Actions"], errors);

  if (state?.status === "captured" || state?.status === "reviewed" || state?.status === "gated") {
    if (!existsSync(join(run.absolutePath, "degraded-evidence.md")) && !existsSync(join(run.absolutePath, "screenshot-manifest.json"))) {
      errors.push("capture evidence or degraded evidence is required");
    }
  }

  if (state?.status === "reviewed" || state?.status === "gated") {
    requireMarkdownSections(run.absolutePath, "review-packet.md", ["Summary", "Inputs", "Evidence", "Decisions", "Open Questions", "Next Actions"], errors);
    requireMarkdownSections(run.absolutePath, "review-summary.md", ["Findings"], errors);
    const summary = existsSync(join(run.absolutePath, "review-summary.md"))
      ? readFileSync(join(run.absolutePath, "review-summary.md"), "utf8")
      : "";
    validateReviewFindings(summary, errors);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function gateRun(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "reviewed" && state.status !== "gated") {
    if (!existsSync(join(run.absolutePath, "review-summary.md"))) {
      throw new Error("review-summary.md is required before gate");
    }
    throw new Error(`gate requires status reviewed, got ${state.status}`);
  }

  const schema = schemaCheckRun(projectRoot, { runPath });
  const hardErrors = [...schema.errors, ...severeRuntimeErrors(run.absolutePath)];
  const verdict = hardErrors.length === 0 ? "PASS" : "FAIL";
  writeMarkdown(
    run.absolutePath,
    run.runId,
    "gate-report.md",
    verdict,
    "gate",
    [
      "# Gate Report",
      "",
      "## Verdict",
      verdict,
      "",
      "## Hard checks",
      hardErrors.length === 0 ? "- PASS: V1 required artifacts and schemas are present." : hardErrors.map((error) => `- FAIL: ${error}`).join("\n"),
      "",
      "## Warnings",
      "- Degraded evidence limits visual and UX conclusions.",
      "",
      "## Required fixes",
      hardErrors.length === 0 ? "none" : "- resolve V1 hard-check failures",
      "",
      "## Next action",
      hardErrors.length === 0 ? "complete-or-review-warnings" : "schema-check",
      "",
    ].join("\n"),
  );

  if (hardErrors.length > 0) {
    writeState(run.absolutePath, {
      ...addArtifact(state, "gate-report.md"),
      status: "blocked",
      previousStatus: state.status,
      blockedReason: hardErrors.join("; "),
      nextRecommendedAction: "schema-check",
    });
    return { verdict, errors: hardErrors };
  }

  writeState(run.absolutePath, {
    ...addArtifact(state, "gate-report.md"),
    status: "gated",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "complete-or-review-warnings",
  });
  return { verdict, errors: [] };
}
