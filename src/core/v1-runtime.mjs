import {
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const STATE_STATUSES = new Set(["created", "captured", "reviewed", "gated", "completed", "blocked", "protected_ready", "repair_planned", "repair_routed"]);
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
const REQUIRED_REPAIR_FIELDS = [
  "repairId",
  "findingId",
  "severity",
  "category",
  "evidenceRefs",
  "affectedScreens",
  "issue",
  "firstRepairRecommendation",
  "status",
];
const ROUTING_REPAIR_FIELDS = new Set(["currentRepair", "backlog", "needsUserDecision", "rejected"]);
const ROUTING_BUCKETS = ["currentRepair", "backlog", "needsUserDecision", "rejected"];
const ROUTING_ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "schemaVersion",
  "runId",
  "artifact",
  "status",
  "updatedAt",
  "artifacts",
  "sourceArtifacts",
  "buckets",
  "currentRepair",
  "backlog",
  "needsUserDecision",
  "rejected",
]);

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

function readJsonArtifact(runDir, artifact, errors) {
  const path = join(runDir, artifact);
  if (!existsSync(path)) {
    errors.push(`${artifact} is missing`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${artifact} failed to parse: ${error.message}`);
    return null;
  }
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

function blockRun(runDir, state, blockedReason, nextRecommendedAction) {
  return writeState(runDir, {
    ...state,
    status: "blocked",
    previousStatus: state.status,
    blockedReason,
    nextRecommendedAction,
  });
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

function parseFindingFields(content) {
  const fields = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^- ([^:]+):\s*(.*)$/);
    if (match) {
      fields[match[1]] = match[2];
    }
  }
  return fields;
}

function readReviewFindings(runDir) {
  const summary = readFileSync(join(runDir, "review-summary.md"), "utf8");
  return findReviewFindings(summary).map((finding) => parseFindingFields(finding.content));
}

function validateRepairFindings(findings, errors) {
  for (const finding of findings) {
    const priorityRank = String(finding.priorityRank || "").trim();
    const fixOrder = String(finding.fixOrder || "").trim();
    if (
      priorityRank === "" ||
      fixOrder === "" ||
      !Number.isFinite(Number(priorityRank)) ||
      !Number.isFinite(Number(fixOrder))
    ) {
      errors.push(`${finding.findingId || "unknown finding"} has non-numeric priorityRank or fixOrder`);
    }
  }
}

function validateRepairPlan(repairPlan, reviewFindings, runState, errors) {
  if (repairPlan.schemaVersion !== 1) {
    errors.push("repair-plan.json schemaVersion must be 1");
  }
  if (repairPlan.runId !== runState.runId) {
    errors.push("repair-plan.json runId must match run-state");
  }
  if (repairPlan.artifact !== "repair-plan.json") {
    errors.push("repair-plan.json artifact must be repair-plan.json");
  }
  if (repairPlan.status !== "READY") {
    errors.push("repair-plan.json status must be READY");
  }
  if (typeof repairPlan.updatedAt !== "string" || repairPlan.updatedAt.trim() === "") {
    errors.push("repair-plan.json updatedAt is required");
  }
  if (
    !Array.isArray(repairPlan.artifacts) ||
    !repairPlan.artifacts.includes("repair-plan.md") ||
    !repairPlan.artifacts.includes("repair-plan.json")
  ) {
    errors.push("repair-plan.json artifacts must list repair-plan.md and repair-plan.json");
  }
  if (
    !Array.isArray(repairPlan.sourceArtifacts) ||
    !repairPlan.sourceArtifacts.includes("review-summary.md") ||
    !repairPlan.sourceArtifacts.includes("protected-features.md")
  ) {
    errors.push("repair-plan.json sourceArtifacts must list review-summary.md and protected-features.md");
  }
  for (const field of Object.keys(repairPlan)) {
    if (ROUTING_REPAIR_FIELDS.has(field)) {
      errors.push(`repair-plan.json must not include ${field}`);
    }
  }
  if (!Array.isArray(repairPlan.repairs)) {
    errors.push("repair-plan.json repairs must be an array");
    return;
  }

  const expectedFindingIds = reviewFindings.map((finding) => finding.findingId);
  const repairIds = new Set();
  const findingIds = new Set();
  for (const repair of repairPlan.repairs) {
    const label = repair.repairId || "unknown repair";
    if (repairIds.has(repair.repairId)) {
      errors.push(`repair-plan.json repairId ${repair.repairId} is duplicated`);
    }
    repairIds.add(repair.repairId);
    if (findingIds.has(repair.findingId)) {
      errors.push(`repair-plan.json findingId ${repair.findingId} is duplicated`);
    }
    findingIds.add(repair.findingId);

    for (const field of REQUIRED_REPAIR_FIELDS) {
      if (typeof repair[field] !== "string" || repair[field].trim() === "") {
        errors.push(`repair-plan.json repair ${label} is missing ${field}`);
      }
    }
    for (const field of ["priorityRank", "fixOrder"]) {
      if (typeof repair[field] !== "number" || !Number.isFinite(repair[field])) {
        errors.push(`repair-plan.json repair ${label} ${field} must be a number`);
      }
    }
    if (repair.status !== "planned") {
      errors.push(`repair-plan.json repair ${label} status must be planned`);
    }
    for (const field of Object.keys(repair)) {
      if (ROUTING_REPAIR_FIELDS.has(field)) {
        errors.push(`repair-plan.json repair ${label} must not include ${field}`);
      }
    }
  }

  const mappedFindingIds = repairPlan.repairs.map((repair) => repair.findingId);
  if (
    mappedFindingIds.length !== expectedFindingIds.length ||
    expectedFindingIds.some((findingId) => !findingIds.has(findingId))
  ) {
    errors.push("repair-plan.json must map one-to-one to review-summary findings");
  }
}

function validateArbiterRouting(routing, repairPlan, runState, errors) {
  for (const field of Object.keys(routing || {})) {
    if (!ROUTING_ALLOWED_TOP_LEVEL_FIELDS.has(field)) {
      errors.push(`arbiter-routing.json has unknown field ${field}`);
    }
  }
  if (routing.schemaVersion !== 1) {
    errors.push("arbiter-routing.json schemaVersion must be 1");
  }
  if (routing.runId !== runState.runId) {
    errors.push("arbiter-routing.json runId must match run-state");
  }
  if (routing.artifact !== "arbiter-routing.json") {
    errors.push("arbiter-routing.json artifact must be arbiter-routing.json");
  }
  if (routing.status !== "READY") {
    errors.push("arbiter-routing.json status must be READY");
  }
  if (typeof routing.updatedAt !== "string" || routing.updatedAt.trim() === "") {
    errors.push("arbiter-routing.json updatedAt is required");
  }
  if (
    !Array.isArray(routing.artifacts) ||
    !routing.artifacts.includes("arbiter-routing.md") ||
    !routing.artifacts.includes("arbiter-routing.json")
  ) {
    errors.push("arbiter-routing.json artifacts must list arbiter-routing.md and arbiter-routing.json");
  }
  if (
    !Array.isArray(routing.sourceArtifacts) ||
    !routing.sourceArtifacts.includes("repair-plan.json") ||
    !routing.sourceArtifacts.includes("protected-features.md")
  ) {
    errors.push("arbiter-routing.json sourceArtifacts must list repair-plan.json and protected-features.md");
  }
  if (!Array.isArray(routing.buckets) || JSON.stringify(routing.buckets) !== JSON.stringify(ROUTING_BUCKETS)) {
    errors.push("arbiter-routing.json buckets must exactly list currentRepair, backlog, needsUserDecision, rejected");
  }
  for (const bucket of ["backlog", "needsUserDecision", "rejected"]) {
    if (!Array.isArray(routing[bucket])) {
      errors.push(`arbiter-routing.json ${bucket} must be an array`);
    }
  }
  if (!routing.currentRepair || typeof routing.currentRepair !== "object" || Array.isArray(routing.currentRepair)) {
    errors.push("arbiter-routing.json currentRepair must be an object");
  }
  if ("repairRound" in routing || "repairRounds" in routing) {
    errors.push("arbiter-routing.json must not include repair round output before V2d");
  }

  const repairIds = new Set((repairPlan?.repairs || []).map((repair) => repair.repairId));
  const routedIds = [];
  if (routing.currentRepair?.repairId) {
    routedIds.push(routing.currentRepair.repairId);
  }
  for (const bucket of ["backlog", "needsUserDecision", "rejected"]) {
    if (Array.isArray(routing[bucket])) {
      routedIds.push(...routing[bucket].map((repair) => repair.repairId));
    }
  }
  for (const repairId of routedIds) {
    if (!repairIds.has(repairId)) {
      errors.push(`arbiter-routing.json routes unknown repair ${repairId}`);
    }
  }
  if (routedIds.length !== repairIds.size || routedIds.some((repairId, index) => routedIds.indexOf(repairId) !== index)) {
    errors.push("arbiter-routing.json must route each repair-plan item exactly once");
  }
}

function validateStateArtifacts(runDir, state, errors) {
  if (!Array.isArray(state.artifacts)) {
    return;
  }

  if (state.status === "repair_planned") {
    for (const artifact of ["repair-plan.md", "repair-plan.json"]) {
      if (!state.artifacts.includes(artifact)) {
        errors.push(`run-state.json repair_planned state must list ${artifact}`);
      }
    }
  }
  if (state.status === "repair_routed") {
    for (const artifact of ["repair-plan.md", "repair-plan.json", "arbiter-routing.md", "arbiter-routing.json"]) {
      if (!state.artifacts.includes(artifact)) {
        errors.push(`run-state.json repair_routed state must list ${artifact}`);
      }
    }
  }

  for (const artifact of state.artifacts) {
    if (!existsSync(join(runDir, artifact))) {
      errors.push(`missing artifact: ${artifact}`);
    }
  }

  if (state.artifacts.includes("screenshot-manifest.json")) {
    const manifest = readJsonArtifact(runDir, "screenshot-manifest.json", errors);
    if (!manifest) {
      return;
    }
    const screenshotPath = manifest?.screenshots?.[0]?.path;
    if (!screenshotPath) {
      errors.push("screenshot-manifest.json is missing screenshots[0].path");
    } else if (!existsSync(join(runDir, screenshotPath))) {
      errors.push(`missing artifact: ${screenshotPath}`);
    }
    if (manifest?.console?.path && !existsSync(join(runDir, manifest.console.path))) {
      errors.push(`missing artifact: ${manifest.console.path}`);
    }
    if (manifest?.pageErrors?.path && !existsSync(join(runDir, manifest.pageErrors.path))) {
      errors.push(`missing artifact: ${manifest.pageErrors.path}`);
    }
  }
}

function uniqueErrors(errors) {
  return Array.from(new Set(errors));
}

function readTextIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function lineHasConsoleErrorLevel(line) {
  return /^\s*(?:\S+\s+)?\[error\](?=\s|$)/i.test(line);
}

function severeRuntimeErrors(runDir) {
  const errors = [];
  const consoleLog = readTextIfExists(join(runDir, "console.log"));
  if (consoleLog.split("\n").some((line) => lineHasConsoleErrorLevel(line))) {
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

function requireEvidenceArtifact(runDir, artifacts, artifact, message) {
  if (!artifacts.includes(artifact) || !existsSync(join(runDir, artifact))) {
    throw new Error(message);
  }
}

function evidenceContext(runDir, state) {
  const artifacts = state.artifacts || [];
  if (artifacts.includes("screenshot-manifest.json") && existsSync(join(runDir, "screenshot-manifest.json"))) {
    const manifest = JSON.parse(readFileSync(join(runDir, "screenshot-manifest.json"), "utf8"));
    const screenshotPath = manifest.screenshots?.[0]?.path;
    requireEvidenceArtifact(runDir, artifacts, "console.log", "browser evidence is incomplete: console.log is missing");
    if (!screenshotPath) {
      throw new Error("browser evidence is incomplete: screenshot path is missing");
    }
    requireEvidenceArtifact(runDir, artifacts, screenshotPath, `browser evidence is incomplete: ${screenshotPath} is missing`);

    return {
      kind: "browser",
      inputs: ["run-contract.md", "context-health.md", "screenshot-manifest.json", "console.log", screenshotPath],
      evidenceRefs: ["screenshot-manifest.json", "console.log", screenshotPath],
      affectedScreens: screenshotPath,
      packetSummary: "V1 review packet assembled from run contract, context health, screenshot manifest, and console evidence.",
      summaryTarget: "Local prototype review with browser evidence.",
      majorityPosition: "Proceed with review conclusions that are tied to the referenced browser evidence artifacts.",
      issue: "browser evidence captured for review",
      why: "UI observations can now be tied to screenshot and console artifacts",
      recommendation: "use the referenced screenshot and console evidence for review findings",
      backlogItems: ["none"],
    };
  }

  requireEvidenceArtifact(runDir, artifacts, "degraded-evidence.md", "degraded evidence is missing");

  return {
    kind: "degraded",
    inputs: ["run-contract.md", "context-health.md", "degraded-evidence.md"],
    evidenceRefs: ["degraded-evidence.md"],
    affectedScreens: "unknown",
    packetSummary: "V1 review packet assembled from run contract, context health, and degraded evidence.",
    summaryTarget: "Local prototype review with degraded evidence.",
    majorityPosition: "Proceed only with mechanical readiness conclusions until runtime evidence is available.",
    issue: "automated visual evidence is unavailable",
    why: "UI quality cannot be assessed from runtime screenshots in this run",
    recommendation: "provide screenshots or enable a browser adapter before making visual claims",
    backlogItems: ["Capture real screenshot and console evidence before making visual findings."],
  };
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
  const evidence = evidenceContext(run.absolutePath, state);

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
      evidence.packetSummary,
      "",
      "## Inputs",
      ...evidence.inputs.map((input) => `- ${input}`),
      "",
      "## Evidence",
      ...evidence.evidenceRefs.map((artifact) => `- ${artifact}`),
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
      evidence.summaryTarget,
      "",
      "## Vote tally",
      "PASS_WITH_FIXES: 1",
      "",
      "## Majority position",
      evidence.majorityPosition,
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
      `- evidence source: ${evidence.evidenceRefs[0]}`,
      `- evidenceRefs: ${evidence.evidenceRefs.join(", ")}`,
      `- affectedScreens: ${evidence.affectedScreens}`,
      "- evidence level: E2",
      `- issue: ${evidence.issue}`,
      `- why it feels poisoned: ${evidence.why}`,
      `- firstRepairRecommendation: ${evidence.recommendation}`,
      "",
      "## Backlog items",
      ...evidence.backlogItems.map((item) => (item === "none" ? "none" : `- ${item}`)),
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
  const state = readJsonArtifact(run.absolutePath, "run-state.json", errors);

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
    validateStateArtifacts(run.absolutePath, state, errors);
  }

  requireMarkdownSections(run.absolutePath, "run-contract.md", ["Summary", "Inputs", "Evidence", "Decisions", "Open Questions", "Next Actions"], errors);
  requireMarkdownSections(run.absolutePath, "context-health.md", ["Summary", "Inputs", "Evidence", "Decisions", "Open Questions", "Next Actions"], errors);

  if (state?.status === "captured" || state?.status === "reviewed" || state?.status === "gated" || state?.status === "protected_ready" || state?.status === "repair_planned" || state?.status === "repair_routed") {
    if (!existsSync(join(run.absolutePath, "degraded-evidence.md")) && !existsSync(join(run.absolutePath, "screenshot-manifest.json"))) {
      errors.push("capture evidence or degraded evidence is required");
    }
  }

  if (state?.status === "reviewed" || state?.status === "gated" || state?.status === "protected_ready" || state?.status === "repair_planned" || state?.status === "repair_routed") {
    requireMarkdownSections(run.absolutePath, "review-packet.md", ["Summary", "Inputs", "Evidence", "Decisions", "Open Questions", "Next Actions"], errors);
    requireMarkdownSections(run.absolutePath, "review-summary.md", ["Findings"], errors);
    const summary = existsSync(join(run.absolutePath, "review-summary.md"))
      ? readFileSync(join(run.absolutePath, "review-summary.md"), "utf8")
      : "";
    validateReviewFindings(summary, errors);
  }

  if (state?.status === "protected_ready") {
    requireMarkdownSections(run.absolutePath, "gate-report.md", ["Verdict", "Hard checks", "Warnings", "Required fixes", "Next action"], errors);
    requireMarkdownSections(run.absolutePath, "protected-features.md", ["Summary", "Source Evidence", "Protected Items", "Update Rules", "Next Actions"], errors);
  }

  let repairPlan = null;
  if (state?.status === "repair_planned" || state?.status === "repair_routed") {
    requireMarkdownSections(run.absolutePath, "gate-report.md", ["Verdict", "Hard checks", "Warnings", "Required fixes", "Next action"], errors);
    requireMarkdownSections(run.absolutePath, "protected-features.md", ["Summary", "Source Evidence", "Protected Items", "Update Rules", "Next Actions"], errors);
    requireMarkdownSections(run.absolutePath, "repair-plan.md", ["Summary", "Source Findings", "Repair Items", "Scope Guardrails", "Next Actions"], errors);
    repairPlan = readJsonArtifact(run.absolutePath, "repair-plan.json", errors);
    if (repairPlan) {
      const reviewFindings = existsSync(join(run.absolutePath, "review-summary.md"))
        ? readReviewFindings(run.absolutePath)
        : [];
      validateRepairPlan(repairPlan, reviewFindings, state, errors);
    }
  }

  const hasResidualRoutingArtifact =
    state?.status === "repair_planned" &&
    (existsSync(join(run.absolutePath, "arbiter-routing.md")) || existsSync(join(run.absolutePath, "arbiter-routing.json")));
  if (state?.status === "repair_routed" || hasResidualRoutingArtifact) {
    requireMarkdownSections(run.absolutePath, "arbiter-routing.md", ["Summary", "Current Repair", "Backlog", "Needs User Decision", "Rejected", "Scope Guardrails", "Next Actions"], errors);
    const routing = readJsonArtifact(run.absolutePath, "arbiter-routing.json", errors);
    if (routing) {
      validateArbiterRouting(routing, repairPlan, state, errors);
    }
  }

  const unique = uniqueErrors(errors);
  return {
    ok: unique.length === 0,
    errors: unique,
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
  const hardErrors = uniqueErrors([...schema.errors, ...severeRuntimeErrors(run.absolutePath)]);
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

export function initializeProtectedFeatures(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (!["gated", "protected_ready"].includes(state.status)) {
    throw new Error(`protected baseline requires status gated, got ${state.status}`);
  }

  if (state.status === "protected_ready" && existsSync(join(run.absolutePath, "protected-features.md"))) {
    return writeState(run.absolutePath, {
      ...addArtifact(state, "protected-features.md"),
      previousStatus: null,
      blockedReason: null,
      nextRecommendedAction: "repair-plan",
    });
  }

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "protected-features.md",
    "READY",
    "init-protected-features",
    [
      "# Protected Features",
      "",
      "## Summary",
      "V2a protected baseline initialized from the current evidence-backed review run.",
      "",
      "## Source Evidence",
      "- run-contract.md",
      "- review-summary.md",
      "- gate-report.md",
      "",
      "## Protected Items",
      "- none declared yet",
      "",
      "## Update Rules",
      "- Do not remove or weaken a protected item without explicit user decision.",
      "- New protected items must name source evidence and owner.",
      "- Repair planning must not start until protected items have ownership and evidence.",
      "",
      "## Next Actions",
      "- repair-plan",
      "",
    ].join("\n"),
  );

  return writeState(run.absolutePath, {
    ...addArtifact(state, "protected-features.md"),
    status: "protected_ready",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "repair-plan",
  });
}

export function writeRepairPlan(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "protected_ready" && state.status !== "repair_planned") {
    throw new Error(`repair planning requires status protected_ready, got ${state.status}`);
  }

  if (state.status === "repair_planned") {
    const schema = schemaCheckRun(projectRoot, { runPath });
    if (!schema.ok) {
      const message = `existing repair plan failed schema-check: ${schema.errors.join("; ")}`;
      blockRun(run.absolutePath, state, message, "schema-check");
      throw new Error(message);
    }
    return writeState(run.absolutePath, {
      ...addArtifacts(state, ["repair-plan.md", "repair-plan.json"]),
      status: "repair_planned",
      previousStatus: null,
      blockedReason: null,
      nextRecommendedAction: "arbiter-route",
    });
  }

  if (!existsSync(join(run.absolutePath, "protected-features.md"))) {
    const message = "protected-features.md is required before repair planning";
    blockRun(run.absolutePath, state, message, "init-protected-features");
    throw new Error(message);
  }

  const sourceSchema = schemaCheckRun(projectRoot, { runPath });
  if (!sourceSchema.ok) {
    const message = `protected baseline failed schema-check: ${sourceSchema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  const findings = readReviewFindings(run.absolutePath);
  if (findings.length === 0) {
    const message = "repair planning requires at least one review finding";
    blockRun(run.absolutePath, state, message, "review");
    throw new Error(message);
  }
  const findingErrors = [];
  validateRepairFindings(findings, findingErrors);
  if (findingErrors.length > 0) {
    const message = `repair planning requires numeric priorityRank and fixOrder: ${findingErrors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "review");
    throw new Error(message);
  }

  const repairs = findings.map((finding, index) => ({
    repairId: `RP-${String(index + 1).padStart(3, "0")}`,
    findingId: finding.findingId,
    priorityRank: Number(finding.priorityRank),
    fixOrder: Number(finding.fixOrder),
    severity: finding.severity,
    category: finding.category,
    evidenceRefs: finding.evidenceRefs,
    affectedScreens: finding.affectedScreens,
    issue: finding.issue,
    firstRepairRecommendation: finding.firstRepairRecommendation,
    status: "planned",
  }));

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "repair-plan.md",
    "READY",
    "repair-plan",
    [
      "# Repair Plan",
      "",
      "## Summary",
      "V2b repair plan generated from V1 findings and protected baseline.",
      "",
      "## Source Findings",
      ...repairs.map((repair) => `- ${repair.findingId}`),
      "",
      "## Repair Items",
      ...repairs.flatMap((repair) => [
        `### ${repair.repairId}`,
        `- repairId: ${repair.repairId}`,
        `- findingId: ${repair.findingId}`,
        `- status: ${repair.status}`,
        `- fixOrder: ${repair.fixOrder}`,
        `- firstRepairRecommendation: ${repair.firstRepairRecommendation}`,
        "",
      ]),
      "## Scope Guardrails",
      "- Do not start arbiter routing in V2b.",
      "- Do not execute repairs in V2b.",
      "- Do not write design/ publishing artifacts in V2b.",
      "",
      "## Next Actions",
      "- arbiter-route",
      "",
    ].join("\n"),
  );

  const repairPlan = {
    schemaVersion: 1,
    runId: run.runId,
    artifact: "repair-plan.json",
    status: "READY",
    updatedAt: now(),
    artifacts: ["repair-plan.md", "repair-plan.json"],
    sourceArtifacts: ["review-summary.md", "protected-features.md"],
    repairs,
  };
  writeFileSync(join(run.absolutePath, "repair-plan.json"), `${JSON.stringify(repairPlan, null, 2)}\n`);

  return writeState(run.absolutePath, {
    ...addArtifacts(state, ["repair-plan.md", "repair-plan.json"]),
    status: "repair_planned",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "arbiter-route",
  });
}

export function routeRepairs(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "repair_planned" && state.status !== "repair_routed") {
    throw new Error(`arbiter routing requires status repair_planned, got ${state.status}`);
  }

  const schema = schemaCheckRun(projectRoot, { runPath });
  if (!schema.ok) {
    const message = `arbiter routing requires valid repair plan: ${schema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  if (
    state.status === "repair_routed" &&
    existsSync(join(run.absolutePath, "arbiter-routing.md")) &&
    existsSync(join(run.absolutePath, "arbiter-routing.json"))
  ) {
    return writeState(run.absolutePath, {
      ...addArtifacts(state, ["arbiter-routing.md", "arbiter-routing.json"]),
      status: "repair_routed",
      previousStatus: null,
      blockedReason: null,
      nextRecommendedAction: "harden",
    });
  }

  const repairPlan = JSON.parse(readFileSync(join(run.absolutePath, "repair-plan.json"), "utf8"));
  const sortedRepairs = [...repairPlan.repairs].sort((left, right) => left.fixOrder - right.fixOrder);
  const currentRepair = sortedRepairs[0] || null;
  if (!currentRepair) {
    const message = "arbiter routing requires at least one planned repair";
    blockRun(run.absolutePath, state, message, "repair-plan");
    throw new Error(message);
  }
  const backlog = sortedRepairs.slice(1);
  const needsUserDecision = [];
  const rejected = [];

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "arbiter-routing.md",
    "READY",
    "arbiter-route",
    [
      "# Arbiter Routing",
      "",
      "## Summary",
      "V2c arbiter routing selected one current repair from the V2b repair plan and parked remaining repairs.",
      "",
      "## Current Repair",
      `- ${currentRepair.repairId}: ${currentRepair.findingId}`,
      "",
      "## Backlog",
      backlog.length === 0 ? "none" : backlog.map((repair) => `- ${repair.repairId}: ${repair.findingId}`).join("\n"),
      "",
      "## Needs User Decision",
      "none",
      "",
      "## Rejected",
      "none",
      "",
      "## Scope Guardrails",
      "- Do not start harden execution in V2c.",
      "- Do not write later repair-round artifacts in V2c.",
      "- Do not write design publishing artifacts in V2c.",
      "",
      "## Next Actions",
      "- harden",
      "",
    ].join("\n"),
  );

  const routing = {
    schemaVersion: 1,
    runId: run.runId,
    artifact: "arbiter-routing.json",
    status: "READY",
    updatedAt: now(),
    artifacts: ["arbiter-routing.md", "arbiter-routing.json"],
    sourceArtifacts: ["repair-plan.json", "protected-features.md"],
    buckets: ROUTING_BUCKETS,
    currentRepair,
    backlog,
    needsUserDecision,
    rejected,
  };
  writeFileSync(join(run.absolutePath, "arbiter-routing.json"), `${JSON.stringify(routing, null, 2)}\n`);

  return writeState(run.absolutePath, {
    ...addArtifacts(state, ["arbiter-routing.md", "arbiter-routing.json"]),
    status: "repair_routed",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "harden",
  });
}
