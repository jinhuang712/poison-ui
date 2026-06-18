import {
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const STATE_STATUSES = new Set(["created", "captured", "reviewed", "gated", "completed", "blocked", "protected_ready", "repair_planned", "repair_routed", "repaired", "published"]);
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
const ROUTED_REPAIR_ALLOWED_FIELDS = new Set([...REQUIRED_REPAIR_FIELDS, "priorityRank", "fixOrder"]);
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
const ROUND_ARTIFACTS = [
  "repair-rounds/001/repair-plan.md",
  "repair-rounds/001/repair-plan.json",
  "repair-rounds/001/before-after-evidence.md",
  "repair-rounds/001/round-summary.md",
];
const REGRESSION_ARTIFACT = "repair-rounds/001/regression-results.json";
const VISUAL_DRIFT_ARTIFACT = "repair-rounds/001/visual-drift.json";
const ROUND_ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "schemaVersion",
  "runId",
  "artifact",
  "status",
  "updatedAt",
  "roundId",
  "artifacts",
  "sourceArtifacts",
  "sourceRepair",
  "deferredRepairIds",
]);
const REGRESSION_ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "schemaVersion",
  "runId",
  "artifact",
  "status",
  "updatedAt",
  "roundId",
  "sourceArtifacts",
  "verdict",
  "protectedFeatureChecks",
]);
const REGRESSION_CHECK_ALLOWED_FIELDS = new Set([
  "item",
  "source",
  "verdict",
  "evidence",
]);
const VISUAL_DRIFT_ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "schemaVersion",
  "runId",
  "artifact",
  "status",
  "updatedAt",
  "roundId",
  "sourceArtifacts",
  "verdict",
  "beforeScreenshots",
  "afterScreenshots",
  "evidenceGap",
]);
const DESIGN_MANIFEST_ALLOWED_FIELDS = new Set([
  "schemaVersion",
  "sourceRunId",
  "packageStatus",
  "publishedAt",
  "files",
  "sourceArtifacts",
]);
const V3A_DESIGN_FILES = ["design/manifest.json", "design/handoff.md"];
const V3B_HANDOFF_FILES = [
  "design/handoff/implementation-map.md",
  "design/handoff/acceptance-checklist.md",
  "design/handoff/open-questions.md",
  "design/handoff/backlog.md",
];
const COMPLETION_AUDIT_ARTIFACTS = [
  "completion-audit-packet.md",
  "completion-report.md",
];
const CAPTURE_DIAGNOSTICS_ARTIFACT = "capture-diagnostics.md";

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

function reviewFindingFixes(runDir) {
  const summaryPath = join(runDir, "review-summary.md");
  if (!existsSync(summaryPath)) {
    return [];
  }

  return findReviewFindings(readFileSync(summaryPath, "utf8"))
    .map((finding) => parseFindingFields(finding.content))
    .filter((finding) => String(finding.findingId || "").trim())
    .sort((left, right) => Number(left.priorityRank || 999) - Number(right.priorityRank || 999));
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
  const repairsById = new Map((repairPlan?.repairs || []).map((repair) => [repair.repairId, repair]));
  const routedIds = [];
  if (routing.currentRepair?.repairId) {
    routedIds.push(routing.currentRepair.repairId);
    validateRoutedRepairItem(routing.currentRepair, repairsById, "currentRepair", errors);
  }
  for (const bucket of ["backlog", "needsUserDecision", "rejected"]) {
    if (Array.isArray(routing[bucket])) {
      routedIds.push(...routing[bucket].map((repair) => repair.repairId));
      for (const repair of routing[bucket]) {
        validateRoutedRepairItem(repair, repairsById, bucket, errors);
      }
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

function validateRoutedRepairItem(repair, repairsById, bucket, errors) {
  const label = repair?.repairId || "unknown repair";
  if (!repair || typeof repair !== "object" || Array.isArray(repair)) {
    errors.push(`arbiter-routing.json ${bucket} repair ${label} must be an object`);
    return;
  }
  for (const field of REQUIRED_REPAIR_FIELDS) {
    if (typeof repair[field] !== "string" || repair[field].trim() === "") {
      errors.push(`arbiter-routing.json ${bucket} repair ${label} is missing ${field}`);
    }
  }
  for (const field of ["priorityRank", "fixOrder"]) {
    if (typeof repair[field] !== "number" || !Number.isFinite(repair[field])) {
      errors.push(`arbiter-routing.json ${bucket} repair ${label} ${field} must be a number`);
    }
  }
  for (const field of Object.keys(repair)) {
    if (!ROUTED_REPAIR_ALLOWED_FIELDS.has(field)) {
      errors.push(`arbiter-routing.json ${bucket} repair ${label} has unknown field ${field}`);
    }
  }
  if (JSON.stringify(repair) !== JSON.stringify(repairsById.get(repair.repairId))) {
    errors.push(`arbiter-routing.json ${bucket} repair ${label} must exactly match repair-plan item`);
  }
}

function validateRoundRepairPlan(roundPlan, routing, runState, errors) {
  for (const field of Object.keys(roundPlan || {})) {
    if (!ROUND_ALLOWED_TOP_LEVEL_FIELDS.has(field)) {
      errors.push(`repair-rounds/001/repair-plan.json has unknown field ${field}`);
    }
  }
  if (roundPlan.schemaVersion !== 1) {
    errors.push("repair-rounds/001/repair-plan.json schemaVersion must be 1");
  }
  if (roundPlan.runId !== runState.runId) {
    errors.push("repair-rounds/001/repair-plan.json runId must match run-state");
  }
  if (roundPlan.artifact !== "repair-rounds/001/repair-plan.json") {
    errors.push("repair-rounds/001/repair-plan.json artifact must be repair-rounds/001/repair-plan.json");
  }
  if (roundPlan.status !== "READY") {
    errors.push("repair-rounds/001/repair-plan.json status must be READY");
  }
  if (typeof roundPlan.updatedAt !== "string" || roundPlan.updatedAt.trim() === "") {
    errors.push("repair-rounds/001/repair-plan.json updatedAt is required");
  }
  if (roundPlan.roundId !== "001") {
    errors.push("repair-rounds/001/repair-plan.json roundId must be 001");
  }
  if (!Array.isArray(roundPlan.artifacts) || JSON.stringify(roundPlan.artifacts) !== JSON.stringify(ROUND_ARTIFACTS)) {
    errors.push("repair-rounds/001/repair-plan.json artifacts must exactly list repair-rounds/001 artifacts");
  }
  const expectedSourceArtifacts = ["arbiter-routing.json", "repair-plan.json", "protected-features.md"];
  if (
    !Array.isArray(roundPlan.sourceArtifacts) ||
    expectedSourceArtifacts.some((artifact) => !roundPlan.sourceArtifacts.includes(artifact))
  ) {
    errors.push("repair-rounds/001/repair-plan.json sourceArtifacts must list arbiter-routing.json, repair-plan.json, and protected-features.md");
  }
  if (JSON.stringify(roundPlan.sourceRepair) !== JSON.stringify(routing?.currentRepair)) {
    errors.push("repair-rounds/001/repair-plan.json sourceRepair must exactly match arbiter-routing currentRepair");
  }
  if (!Array.isArray(roundPlan.deferredRepairIds)) {
    errors.push("repair-rounds/001/repair-plan.json deferredRepairIds must be an array");
  } else {
    const expectedDeferredIds = [
      ...(routing?.backlog || []),
      ...(routing?.needsUserDecision || []),
      ...(routing?.rejected || []),
    ].map((repair) => repair.repairId);
    if (JSON.stringify(roundPlan.deferredRepairIds) !== JSON.stringify(expectedDeferredIds)) {
      errors.push("repair-rounds/001/repair-plan.json deferredRepairIds must exactly match non-current routed repair IDs");
    }
  }
  if ("repairRounds" in roundPlan || "regressionResults" in roundPlan || "designManifest" in roundPlan) {
    errors.push("repair-rounds/001/repair-plan.json must not include V2e or V3 output");
  }
}

function protectedFeatureItems(runDir) {
  const content = readTextIfExists(join(runDir, "protected-features.md"));
  const section = content.split(/^## Protected Items\s*$/m)[1]?.split(/^## /m)[0] || "";
  const items = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);

  return items.length > 0 ? items : ["none declared yet"];
}

function validateRegressionResults(regression, runDir, runState, errors) {
  for (const field of Object.keys(regression || {})) {
    if (!REGRESSION_ALLOWED_TOP_LEVEL_FIELDS.has(field)) {
      errors.push(`repair-rounds/001/regression-results.json has unknown field ${field}`);
    }
  }
  if (regression.schemaVersion !== 1) {
    errors.push("repair-rounds/001/regression-results.json schemaVersion must be 1");
  }
  if (regression.runId !== runState.runId) {
    errors.push("repair-rounds/001/regression-results.json runId must match run-state");
  }
  if (regression.artifact !== REGRESSION_ARTIFACT) {
    errors.push("repair-rounds/001/regression-results.json artifact must be repair-rounds/001/regression-results.json");
  }
  if (regression.status !== "READY") {
    errors.push("repair-rounds/001/regression-results.json status must be READY");
  }
  if (typeof regression.updatedAt !== "string" || regression.updatedAt.trim() === "") {
    errors.push("repair-rounds/001/regression-results.json updatedAt is required");
  }
  if (regression.roundId !== "001") {
    errors.push("repair-rounds/001/regression-results.json roundId must be 001");
  }
  const expectedSourceArtifacts = [
    "protected-features.md",
    "repair-rounds/001/round-summary.md",
    "review-summary.md",
    "gate-report.md",
  ];
  if (
    !Array.isArray(regression.sourceArtifacts) ||
    JSON.stringify(regression.sourceArtifacts) !== JSON.stringify(expectedSourceArtifacts)
  ) {
    errors.push("repair-rounds/001/regression-results.json sourceArtifacts must exactly list protected-features.md, repair-rounds/001/round-summary.md, review-summary.md, and gate-report.md");
  }
  if (regression.verdict !== "PASS" && regression.verdict !== "FAIL") {
    errors.push("repair-rounds/001/regression-results.json verdict must be PASS or FAIL");
  }
  const hasChecks = Array.isArray(regression.protectedFeatureChecks) && regression.protectedFeatureChecks.length > 0;
  if (!hasChecks) {
    errors.push("repair-rounds/001/regression-results.json protectedFeatureChecks must be a non-empty array");
  }

  const expectedItems = protectedFeatureItems(runDir);
  const checkItems = [];
  for (const check of hasChecks ? regression.protectedFeatureChecks : []) {
    const label = check?.item || "unknown protected feature";
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      errors.push(`repair-rounds/001/regression-results.json check ${label} must be an object`);
      continue;
    }
    for (const field of Object.keys(check)) {
      if (!REGRESSION_CHECK_ALLOWED_FIELDS.has(field)) {
        errors.push(`repair-rounds/001/regression-results.json check ${label} has unknown field ${field}`);
      }
    }
    for (const field of REGRESSION_CHECK_ALLOWED_FIELDS) {
      if (typeof check[field] !== "string" || check[field].trim() === "") {
        errors.push(`repair-rounds/001/regression-results.json check ${label} is missing ${field}`);
      }
    }
    if (check.verdict !== "PASS" && check.verdict !== "FAIL") {
      errors.push(`repair-rounds/001/regression-results.json check ${label} verdict must be PASS or FAIL`);
    }
    checkItems.push(check.item);
  }
  if (JSON.stringify(checkItems) !== JSON.stringify(expectedItems)) {
    errors.push("repair-rounds/001/regression-results.json protectedFeatureChecks must map to protected-features.md items");
  }
  if ("visualDrift" in regression || "designManifest" in regression) {
    errors.push("repair-rounds/001/regression-results.json must not include drift or design publishing output");
  }
}

function markdownSectionLines(content, sectionName) {
  const section = content.split(new RegExp(`^## ${sectionName}\\s*$`, "m"))[1]?.split(/^## /m)[0] || "";
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function beforeScreenshotRefs(runDir) {
  const content = readTextIfExists(join(runDir, "repair-rounds/001/before-after-evidence.md"));
  return markdownSectionLines(content, "Before Evidence").filter((artifact) => artifact.startsWith("screenshots/"));
}

function afterScreenshotRefs(runDir) {
  const manifestPath = join(runDir, "screenshot-manifest.json");
  if (!existsSync(manifestPath)) {
    return [];
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return (manifest.screenshots || [])
      .map((screenshot) => screenshot.path)
      .filter((artifact) => typeof artifact === "string" && artifact.startsWith("screenshots/"));
  } catch {
    return [];
  }
}

function validateVisualDriftReport(drift, runState, errors) {
  for (const field of Object.keys(drift || {})) {
    if (!VISUAL_DRIFT_ALLOWED_TOP_LEVEL_FIELDS.has(field)) {
      errors.push(`repair-rounds/001/visual-drift.json has unknown field ${field}`);
    }
  }
  if (drift.schemaVersion !== 1) {
    errors.push("repair-rounds/001/visual-drift.json schemaVersion must be 1");
  }
  if (drift.runId !== runState.runId) {
    errors.push("repair-rounds/001/visual-drift.json runId must match run-state");
  }
  if (drift.artifact !== VISUAL_DRIFT_ARTIFACT) {
    errors.push("repair-rounds/001/visual-drift.json artifact must be repair-rounds/001/visual-drift.json");
  }
  if (drift.status !== "READY" && drift.status !== "ABSENT") {
    errors.push("repair-rounds/001/visual-drift.json status must be READY or ABSENT");
  }
  if (typeof drift.updatedAt !== "string" || drift.updatedAt.trim() === "") {
    errors.push("repair-rounds/001/visual-drift.json updatedAt is required");
  }
  if (drift.roundId !== "001") {
    errors.push("repair-rounds/001/visual-drift.json roundId must be 001");
  }
  const expectedSourceArtifacts = [
    "repair-rounds/001/before-after-evidence.md",
    "repair-rounds/001/regression-results.json",
  ];
  if (
    !Array.isArray(drift.sourceArtifacts) ||
    JSON.stringify(drift.sourceArtifacts) !== JSON.stringify(expectedSourceArtifacts)
  ) {
    errors.push("repair-rounds/001/visual-drift.json sourceArtifacts must exactly list before-after evidence and regression results");
  }
  if (drift.verdict !== "NEEDS_HUMAN_REVIEW" && drift.verdict !== "NO_VISUAL_EVIDENCE") {
    errors.push("repair-rounds/001/visual-drift.json verdict must be NEEDS_HUMAN_REVIEW or NO_VISUAL_EVIDENCE");
  }
  if (!Array.isArray(drift.beforeScreenshots)) {
    errors.push("repair-rounds/001/visual-drift.json beforeScreenshots must be an array");
  }
  if (!Array.isArray(drift.afterScreenshots)) {
    errors.push("repair-rounds/001/visual-drift.json afterScreenshots must be an array");
  }
  if (drift.status === "ABSENT" && (typeof drift.evidenceGap !== "string" || drift.evidenceGap.trim() === "")) {
    errors.push("repair-rounds/001/visual-drift.json ABSENT status requires evidenceGap");
  }
  if (drift.status === "READY" && drift.evidenceGap !== null) {
    errors.push("repair-rounds/001/visual-drift.json READY status requires null evidenceGap");
  }
  if ("designManifest" in drift || "designPublishing" in drift) {
    errors.push("repair-rounds/001/visual-drift.json must not include design publishing output");
  }
}

function validateDesignManifest(manifest, runState, errors) {
  for (const field of Object.keys(manifest || {})) {
    if (!DESIGN_MANIFEST_ALLOWED_FIELDS.has(field)) {
      errors.push(`design/manifest.json has unknown field ${field}`);
    }
  }
  if (manifest.schemaVersion !== 1) {
    errors.push("design/manifest.json schemaVersion must be 1");
  }
  if (manifest.sourceRunId !== runState.runId) {
    errors.push("design/manifest.json sourceRunId must match run-state");
  }
  if (manifest.packageStatus !== "MINIMAL_READY" && manifest.packageStatus !== "HANDOFF_READY") {
    errors.push("design/manifest.json packageStatus must be MINIMAL_READY or HANDOFF_READY");
  }
  if (typeof manifest.publishedAt !== "string" || manifest.publishedAt.trim() === "") {
    errors.push("design/manifest.json publishedAt is required");
  }
  const expectedFiles = manifest.packageStatus === "HANDOFF_READY"
    ? [...V3A_DESIGN_FILES, ...V3B_HANDOFF_FILES]
    : V3A_DESIGN_FILES;
  if (!Array.isArray(manifest.files) || JSON.stringify(manifest.files) !== JSON.stringify(expectedFiles)) {
    errors.push(`design/manifest.json files must exactly list ${manifest.packageStatus === "HANDOFF_READY" ? "V3b handoff package" : "minimal V3a"} files`);
  }
  if (!Array.isArray(manifest.sourceArtifacts) || manifest.sourceArtifacts.length === 0) {
    errors.push("design/manifest.json sourceArtifacts must be a non-empty array");
  }
  if ("completionPercent" in manifest || "screens" in manifest || "flows" in manifest || "review" in manifest) {
    errors.push("design/manifest.json must not include broader V3 package output");
  }
}

function validateCompletionReport(runDir, errors) {
  const path = join(runDir, "completion-report.md");
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");
  if (/\b\d+\s*%/.test(content) || content.includes("completionPercent")) {
    errors.push("completion-report.md must not publish percentages");
  }
}

function extractSection(content, heading) {
  return content.split(new RegExp(`^## ${heading}\\s*$`, "m"))[1]?.split(/^## /m)[0]?.trim() || "";
}

function bulletLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
}

function readTextArtifact(runDir, artifact) {
  const path = join(runDir, artifact);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function captureLimitation(runDir, state) {
  if ((state.artifacts || []).includes("screenshot-manifest.json") && existsSync(join(runDir, "screenshot-manifest.json"))) {
    return "browser evidence captured";
  }
  const degraded = readTextArtifact(runDir, "degraded-evidence.md");
  if (!degraded) {
    return "no capture evidence found";
  }
  const source = degraded.match(/^- evidence source:\s*(.*)$/m)?.[1] || "browser capture unavailable";
  return `degraded capture: ${source}`;
}

function designPackageStatus(projectRoot, runId) {
  const manifestPath = join(projectRoot, "design", "manifest.json");
  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.sourceRunId && manifest.sourceRunId !== runId) {
      return null;
    }
    return {
      status: manifest.status || manifest.packageStatus || "unknown",
      files: [
        ...(manifest.entrypoints || []),
        ...(manifest.files || []),
      ],
      knownFixes: manifest.knownFixes || [],
    };
  } catch {
    return {
      status: "manifest parse failed",
      files: ["design/manifest.json"],
      knownFixes: ["design/manifest.json must parse as JSON"],
    };
  }
}

export function buildRunBrief(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  const summary = readTextArtifact(run.absolutePath, "review-summary.md");
  const gate = readTextArtifact(run.absolutePath, "gate-report.md");
  const findings = summary ? reviewFindingFixes(run.absolutePath) : [];
  const verdict = gate.match(/^## Verdict\s*\n([^\n]+)/m)?.[1]?.trim() || state.status;
  const gateRequiredFixes = bulletLines(extractSection(gate, "Required fixes"))
    .filter((line) => line !== "- none");
  const requiredFixes = gateRequiredFixes.length > 0
    ? gateRequiredFixes
    : findings.map((finding) => `- ${finding.findingId}: ${finding.firstRepairRecommendation || finding.issue || "review finding requires follow-up"}`);
  const evidenceLimits = [
    captureLimitation(run.absolutePath, state),
    ...bulletLines(extractSection(summary, "Evidence-backed blockers")).map((line) => line.replace(/^- /, "")),
  ];
  const designStatus = designPackageStatus(projectRoot, run.runId);
  const topFindings = findings.slice(0, 5);

  return [
    "# Poison Brief",
    "",
    "## Conclusion",
    `- run: ${run.relativePath}`,
    `- status: ${state.status}`,
    `- gate: ${verdict}`,
    `- gate meaning: ${findings.length > 0 ? "mechanical pass only; product fixes remain" : "no review findings recorded"}`,
    `- review findings: ${findings.length}`,
    designStatus ? `- design package: ${designStatus.status}` : "- design package: not published for this run",
    "",
    "## Evidence Limits",
    ...evidenceLimits.map((line) => `- ${line}`),
    "",
    "## Top Fixes",
    ...(topFindings.length === 0
      ? ["- none"]
      : topFindings.map((finding) => `- ${finding.findingId} [${finding.severity}/${finding.category}]: ${finding.issue} Fix: ${finding.firstRepairRecommendation}`)),
    "",
    "## Acceptance Criteria",
    ...(topFindings.length === 0
      ? ["- none"]
      : topFindings.map((finding) => `- ${finding.findingId}: after the fix, rerun capture/review/gate and verify ${finding.evidenceRefs || "the cited evidence"} no longer supports this finding.`)),
    "",
    "## Required Fixes",
    ...(requiredFixes.length === 0
      ? ["- none"]
      : requiredFixes),
    "",
    "## Useful Artifacts",
    "- review-summary.md",
    "- gate-report.md",
    ...(existsSync(join(run.absolutePath, "screenshot-manifest.json")) ? ["- screenshot-manifest.json"] : []),
    ...(existsSync(join(run.absolutePath, "degraded-evidence.md")) ? ["- degraded-evidence.md"] : []),
    ...(designStatus?.files || []).slice(0, 8).map((file) => `- ${file}`),
    "",
    "## Next Action",
    `- ${state.nextRecommendedAction || "none"}`,
    "",
  ].join("\n");
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
  if (state.status === "repaired") {
    for (const artifact of ["repair-plan.md", "repair-plan.json", "arbiter-routing.md", "arbiter-routing.json", ...ROUND_ARTIFACTS]) {
      if (!state.artifacts.includes(artifact)) {
        errors.push(`run-state.json repaired state must list ${artifact}`);
      }
    }
  }
  if (state.artifacts.includes(REGRESSION_ARTIFACT) && state.status !== "gated" && state.status !== "published") {
    errors.push("regression-results.json requires post-repair gated status");
  }
  if (state.artifacts.includes(REGRESSION_ARTIFACT)) {
    for (const artifact of ROUND_ARTIFACTS) {
      if (!state.artifacts.includes(artifact)) {
        errors.push(`regression-results.json requires repair-rounds/001 artifacts: missing ${artifact}`);
      }
    }
  }
  if (state.artifacts.includes(VISUAL_DRIFT_ARTIFACT)) {
    if (state.status !== "gated" && state.status !== "published") {
      errors.push("visual-drift.json requires post-repair gated status");
    }
    if (!state.artifacts.includes(REGRESSION_ARTIFACT)) {
      errors.push("visual-drift.json requires regression-results.json");
    }
    for (const artifact of ROUND_ARTIFACTS) {
      if (!state.artifacts.includes(artifact)) {
        errors.push(`visual-drift.json requires repair-rounds/001 artifacts: missing ${artifact}`);
      }
    }
  }
  if (COMPLETION_AUDIT_ARTIFACTS.some((artifact) => state.artifacts.includes(artifact))) {
    if (state.status !== "published") {
      errors.push("completion audit artifacts require published status");
    }
    for (const artifact of COMPLETION_AUDIT_ARTIFACTS) {
      if (!state.artifacts.includes(artifact)) {
        errors.push(`completion audit requires ${artifact}`);
      }
    }
  }

  for (const artifact of state.artifacts) {
    if (artifact.startsWith("design/")) {
      continue;
    }
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
  const hasRepairRound = ROUND_ARTIFACTS.every((artifact) => artifacts.includes(artifact) && existsSync(join(runDir, artifact)));
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
      evidenceLevel: "E1",
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
      hasRepairRound,
    };
  }

  requireEvidenceArtifact(runDir, artifacts, "degraded-evidence.md", "degraded evidence is missing");

  return {
    kind: "degraded",
    evidenceLevel: "E-gap",
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
    hasRepairRound,
  };
}

function preservedReviewFindingSections(runDir) {
  const summaryPath = join(runDir, "review-summary.md");
  if (!existsSync(summaryPath)) {
    return null;
  }

  const content = readFileSync(summaryPath, "utf8");
  const findings = content.match(/^## Findings[\s\S]*$/m)?.[0]?.trim();
  return findings || null;
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
  if (!["created", "blocked", "captured", "repaired"].includes(state.status)) {
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
      "- Continue only because degraded capture was explicitly allowed.",
      "- Do not claim visual observations from this artifact alone.",
      "",
      "## Open Questions",
      "- Why is browser capture unavailable in this runtime?",
      "- Can a human or browser adapter provide screenshots and console evidence?",
      "",
      "## Next Actions",
      "- diagnose-browser-capture",
      "- review only if degraded evidence is acceptable for this run",
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

export function recordCaptureFailure(projectRoot = process.cwd(), { runPath, url, reason } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (!["created", "blocked", "captured", "repaired"].includes(state.status)) {
    throw new Error(`capture cannot run from status ${state.status}`);
  }

  writeMarkdown(
    run.absolutePath,
    run.runId,
    CAPTURE_DIAGNOSTICS_ARTIFACT,
    "BLOCKED",
    "capture",
    [
      "# Capture Diagnostics",
      "",
      "## Summary",
      "Browser capture did not run, so Poison cannot claim screenshot or live console evidence for this command.",
      "",
      "## Inputs",
      `- url: ${url || "not provided"}`,
      "",
      "## Evidence",
      `- capture failure: ${reason || "browser capture unavailable"}`,
      "",
      "## Decisions",
      "- Default CLI behavior blocks instead of silently degrading.",
      "- Use `--allow-degraded` only when the user accepts a no-screenshot review.",
      "",
      "## Open Questions",
      "- Is Playwright installed and importable from the active Poison runtime?",
      "- Is a browser binary installed and launchable?",
      "- Is the target URL reachable from this shell?",
      "",
      "## Next Actions",
      "- poison doctor",
      "- install or repair Playwright/browser runtime",
      "- rerun capture, or rerun capture with --allow-degraded after explicit user acceptance",
      "",
    ].join("\n"),
  );

  return blockRun(
    run.absolutePath,
    addArtifact(state, CAPTURE_DIAGNOSTICS_ARTIFACT),
    reason || "browser capture unavailable",
    "doctor",
  );
}

export async function recordBrowserCapture(projectRoot = process.cwd(), { runPath, url, adapter } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (!["created", "blocked", "captured", "repaired"].includes(state.status)) {
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
  const preservedFindings = evidence.hasRepairRound ? preservedReviewFindingSections(run.absolutePath) : null;

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
      ...(evidence.hasRepairRound ? ROUND_ARTIFACTS.map((artifact) => `- ${artifact}`) : []),
      "",
      "## Evidence",
      ...evidence.evidenceRefs.map((artifact) => `- ${artifact}`),
      ...(evidence.hasRepairRound ? ["- repair-rounds/001/round-summary.md"] : []),
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
      evidence.hasRepairRound ? `Post-repair review for ${evidence.summaryTarget}` : evidence.summaryTarget,
      "",
      "## Vote tally",
      "PASS_WITH_FIXES: 1",
      "",
      "## Majority position",
      evidence.hasRepairRound
        ? `${evidence.majorityPosition} Post-repair review preserves the bounded repair round traceability via repair-rounds/001/round-summary.md.`
        : evidence.majorityPosition,
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
      preservedFindings || [
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
        `- evidence level: ${evidence.evidenceLevel}`,
        `- issue: ${evidence.issue}`,
        `- why it feels poisoned: ${evidence.why}`,
        `- firstRepairRecommendation: ${evidence.recommendation}`,
        "",
        "## Backlog items",
        ...evidence.backlogItems.map((item) => (item === "none" ? "none" : `- ${item}`)),
        "",
        "## Rejected personal-taste findings",
        "none",
      ].join("\n"),
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

  if (state?.status === "captured" || state?.status === "reviewed" || state?.status === "gated" || state?.status === "protected_ready" || state?.status === "repair_planned" || state?.status === "repair_routed" || state?.status === "repaired" || state?.status === "published") {
    if (!existsSync(join(run.absolutePath, "degraded-evidence.md")) && !existsSync(join(run.absolutePath, "screenshot-manifest.json"))) {
      errors.push("capture evidence or degraded evidence is required");
    }
  }

  if (state?.status === "reviewed" || state?.status === "gated" || state?.status === "protected_ready" || state?.status === "repair_planned" || state?.status === "repair_routed" || state?.status === "repaired" || state?.status === "published") {
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
  const hasRoundArtifact =
    ROUND_ARTIFACTS.some((artifact) => (
      (state?.artifacts || []).includes(artifact) || existsSync(join(run.absolutePath, artifact))
    ));
  const needsRepairPlan = state?.status === "repair_planned" || state?.status === "repair_routed" || state?.status === "repaired" || hasRoundArtifact;
  if (needsRepairPlan) {
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
  const hasResidualRoundArtifact =
    state?.status === "repair_routed" &&
    ROUND_ARTIFACTS.some((artifact) => existsSync(join(run.absolutePath, artifact)));
  let routing = null;
  if (state?.status === "repair_routed" || state?.status === "repaired" || hasResidualRoutingArtifact || hasRoundArtifact) {
    requireMarkdownSections(run.absolutePath, "arbiter-routing.md", ["Summary", "Current Repair", "Backlog", "Needs User Decision", "Rejected", "Scope Guardrails", "Next Actions"], errors);
    routing = readJsonArtifact(run.absolutePath, "arbiter-routing.json", errors);
    if (routing) {
      validateArbiterRouting(routing, repairPlan, state, errors);
    }
  }

  if (state?.status === "repaired" || hasResidualRoundArtifact || hasRoundArtifact) {
    requireMarkdownSections(run.absolutePath, "repair-rounds/001/repair-plan.md", ["Summary", "Current Repair", "Scope Guardrails", "Next Actions"], errors);
    requireMarkdownSections(run.absolutePath, "repair-rounds/001/before-after-evidence.md", ["Summary", "Before Evidence", "After Evidence", "Next Actions"], errors);
    requireMarkdownSections(run.absolutePath, "repair-rounds/001/round-summary.md", ["Summary", "Outcome", "Scope Guardrails", "Next Actions"], errors);
    const roundPlan = readJsonArtifact(run.absolutePath, "repair-rounds/001/repair-plan.json", errors);
    if (roundPlan) {
      validateRoundRepairPlan(roundPlan, routing, state, errors);
    }
  }
  const hasRegressionArtifact =
    (state?.artifacts || []).includes(REGRESSION_ARTIFACT) || existsSync(join(run.absolutePath, REGRESSION_ARTIFACT));
  if (hasRegressionArtifact) {
    if (state?.status !== "gated" && state?.status !== "published") {
      errors.push("regression-results.json requires post-repair gated status");
    }
    const missingRoundArtifacts = ROUND_ARTIFACTS.filter((artifact) => !existsSync(join(run.absolutePath, artifact)));
    if (missingRoundArtifacts.length > 0) {
      errors.push(`regression-results.json requires repair-rounds/001 artifacts: missing ${missingRoundArtifacts.join(", ")}`);
    }
    const regression = readJsonArtifact(run.absolutePath, REGRESSION_ARTIFACT, errors);
    if (regression) {
      validateRegressionResults(regression, run.absolutePath, state, errors);
    }
  }
  const hasVisualDriftArtifact =
    (state?.artifacts || []).includes(VISUAL_DRIFT_ARTIFACT) || existsSync(join(run.absolutePath, VISUAL_DRIFT_ARTIFACT));
  if (hasVisualDriftArtifact) {
    if (state?.status !== "gated" && state?.status !== "published") {
      errors.push("visual-drift.json requires post-repair gated status");
    }
    if (!existsSync(join(run.absolutePath, REGRESSION_ARTIFACT))) {
      errors.push("visual-drift.json requires regression-results.json");
    }
    const missingRoundArtifacts = ROUND_ARTIFACTS.filter((artifact) => !existsSync(join(run.absolutePath, artifact)));
    if (missingRoundArtifacts.length > 0) {
      errors.push(`visual-drift.json requires repair-rounds/001 artifacts: missing ${missingRoundArtifacts.join(", ")}`);
    }
    const drift = readJsonArtifact(run.absolutePath, VISUAL_DRIFT_ARTIFACT, errors);
    if (drift) {
      validateVisualDriftReport(drift, state, errors);
    }
  }
  const hasCompletionAuditArtifacts =
    COMPLETION_AUDIT_ARTIFACTS.some((artifact) => (
      (state?.artifacts || []).includes(artifact) || existsSync(join(run.absolutePath, artifact))
    ));
  if (hasCompletionAuditArtifacts) {
    if (state?.status !== "published") {
      errors.push("completion audit requires published status");
    }
    requireMarkdownSections(run.absolutePath, "completion-audit-packet.md", ["Summary", "Source Evidence", "Audit Inputs", "Next Actions"], errors);
    requireMarkdownSections(run.absolutePath, "completion-report.md", ["Summary", "Completion Labels", "Blocked Output", "Next Actions"], errors);
    validateCompletionReport(run.absolutePath, errors);
  }
  if (state?.status === "published") {
    const designRoot = join(projectRoot, "design");
    const manifest = readJsonArtifact(projectRoot, "design/manifest.json", errors);
    if (manifest) {
      validateDesignManifest(manifest, state, errors);
      if (manifest.packageStatus === "HANDOFF_READY") {
        requireMarkdownSections(designRoot, "handoff/implementation-map.md", ["Summary", "Source Evidence", "Implementation Map", "Next Actions"], errors);
        requireMarkdownSections(designRoot, "handoff/acceptance-checklist.md", ["Summary", "Source Evidence", "Acceptance Checks", "Next Actions"], errors);
        requireMarkdownSections(designRoot, "handoff/open-questions.md", ["Summary", "Source Evidence", "Open Questions", "Next Actions"], errors);
        requireMarkdownSections(designRoot, "handoff/backlog.md", ["Summary", "Source Evidence", "Backlog", "Next Actions"], errors);
      }
    }
    requireMarkdownSections(designRoot, "handoff.md", ["Implementation Scope", "Source Evidence", "Open Questions", "Next Actions"], errors);
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
  const findingFixes = hardErrors.length === 0 ? reviewFindingFixes(run.absolutePath) : [];
  const requiredFixLines = hardErrors.length > 0
    ? ["- resolve V1 hard-check failures"]
    : findingFixes.map((finding) => `- ${finding.findingId}: ${finding.firstRepairRecommendation || finding.issue || "review finding requires follow-up"}`);
  const nextAction = hardErrors.length > 0
    ? "schema-check"
    : (findingFixes.length > 0 ? "repair-plan-or-user-review" : "complete");
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
      requiredFixLines.length === 0 ? "none" : requiredFixLines.join("\n"),
      "",
      "## Next action",
      nextAction,
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
    nextRecommendedAction: nextAction,
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

export function hardenRun(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "repair_routed" && state.status !== "repaired") {
    throw new Error(`harden requires status repair_routed, got ${state.status}`);
  }

  const schema = schemaCheckRun(projectRoot, { runPath });
  if (!schema.ok) {
    const message = `harden requires valid routed repair: ${schema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  if (state.status === "repaired" && ROUND_ARTIFACTS.every((artifact) => existsSync(join(run.absolutePath, artifact)))) {
    return writeState(run.absolutePath, {
      ...addArtifacts(state, ROUND_ARTIFACTS),
      status: "repaired",
      previousStatus: null,
      blockedReason: null,
      nextRecommendedAction: "capture",
    });
  }

  const routing = JSON.parse(readFileSync(join(run.absolutePath, "arbiter-routing.json"), "utf8"));
  const currentRepair = routing.currentRepair;
  if (!currentRepair?.repairId) {
    const message = "harden requires arbiter-routing currentRepair";
    blockRun(run.absolutePath, state, message, "arbiter-route");
    throw new Error(message);
  }

  const roundId = "001";
  const roundDir = join(run.absolutePath, "repair-rounds", roundId);
  ensureDir(roundDir);
  const deferredRepairIds = [
    ...(routing.backlog || []),
    ...(routing.needsUserDecision || []),
    ...(routing.rejected || []),
  ].map((repair) => repair.repairId);

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "repair-rounds/001/repair-plan.md",
    "READY",
    "harden",
    [
      "# Repair Round 001 Plan",
      "",
      "## Summary",
      "V2d bounded harden round is planned from exactly one arbiter-selected current repair.",
      "",
      "## Current Repair",
      `- ${currentRepair.repairId}: ${currentRepair.findingId}`,
      `- issue: ${currentRepair.issue}`,
      `- recommendation: ${currentRepair.firstRepairRecommendation}`,
      "",
      "## Scope Guardrails",
      "- Execute only the arbiter-selected current repair.",
      "- Keep backlog, needs-user-decision, and rejected repairs deferred.",
      "- Do not write regression or design publishing artifacts in V2d.",
      "",
      "## Next Actions",
      "- capture",
      "",
    ].join("\n"),
  );

  const roundPlan = {
    schemaVersion: 1,
    runId: run.runId,
    artifact: "repair-rounds/001/repair-plan.json",
    status: "READY",
    updatedAt: now(),
    roundId,
    artifacts: ROUND_ARTIFACTS,
    sourceArtifacts: ["arbiter-routing.json", "repair-plan.json", "protected-features.md"],
    sourceRepair: currentRepair,
    deferredRepairIds,
  };
  writeFileSync(join(roundDir, "repair-plan.json"), `${JSON.stringify(roundPlan, null, 2)}\n`);

  const beforeEvidence = (state.artifacts || []).filter((artifact) => (
    artifact === "degraded-evidence.md" ||
    artifact === "screenshot-manifest.json" ||
    artifact === "console.log" ||
    artifact.startsWith("screenshots/")
  ));
  writeMarkdown(
    run.absolutePath,
    run.runId,
    "repair-rounds/001/before-after-evidence.md",
    "READY",
    "harden",
    [
      "# Before/After Evidence",
      "",
      "## Summary",
      "V2d records the pre-repair evidence references and leaves post-repair evidence capture to the next capture step.",
      "",
      "## Before Evidence",
      beforeEvidence.length === 0 ? "none" : beforeEvidence.map((artifact) => `- ${artifact}`).join("\n"),
      "",
      "## After Evidence",
      "pending recapture",
      "",
      "## Next Actions",
      "- capture",
      "",
    ].join("\n"),
  );

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "repair-rounds/001/round-summary.md",
    "READY",
    "harden",
    [
      "# Repair Round 001 Summary",
      "",
      "## Summary",
      "A bounded harden round is planned and scoped to one current repair.",
      "",
      "## Outcome",
      "bounded harden round is planned; post-repair capture is required before regression or drift checks.",
      "",
      "## Scope Guardrails",
      "- No backlog repair was executed in this round.",
      "- No regression or drift verdict was produced in this round.",
      "- No design publishing was produced in this round.",
      "",
      "## Next Actions",
      "- capture",
      "",
    ].join("\n"),
  );

  return writeState(run.absolutePath, {
    ...addArtifacts(state, ROUND_ARTIFACTS),
    status: "repaired",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "capture",
  });
}

export function writeRegressionResults(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "gated") {
    throw new Error(`regression results require post-repair gated status, got ${state.status}`);
  }
  const hasRound = ROUND_ARTIFACTS.every((artifact) => (
    (state.artifacts || []).includes(artifact) && existsSync(join(run.absolutePath, artifact))
  ));
  if (!hasRound) {
    const message = "regression results require repair-rounds/001 artifacts";
    blockRun(run.absolutePath, state, message, "harden");
    throw new Error(message);
  }

  const sourceSchema = schemaCheckRun(projectRoot, { runPath });
  if (!sourceSchema.ok) {
    const message = `regression results require valid post-repair gate: ${sourceSchema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  const protectedChecks = protectedFeatureItems(run.absolutePath).map((item) => ({
    item,
    source: "protected-features.md",
    verdict: "PASS",
    evidence: item === "none declared yet"
      ? "no protected items declared"
      : "post-repair gate passed with protected feature listed",
  }));
  const verdict = protectedChecks.some((check) => check.verdict === "FAIL") ? "FAIL" : "PASS";
  const regression = {
    schemaVersion: 1,
    runId: run.runId,
    artifact: REGRESSION_ARTIFACT,
    status: "READY",
    updatedAt: now(),
    roundId: "001",
    sourceArtifacts: [
      "protected-features.md",
      "repair-rounds/001/round-summary.md",
      "review-summary.md",
      "gate-report.md",
    ],
    verdict,
    protectedFeatureChecks: protectedChecks,
  };

  writeFileSync(join(run.absolutePath, REGRESSION_ARTIFACT), `${JSON.stringify(regression, null, 2)}\n`);
  return writeState(run.absolutePath, {
    ...addArtifact(state, REGRESSION_ARTIFACT),
    status: "gated",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "complete-or-review-warnings",
  });
}

export function writeVisualDriftReport(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "gated") {
    throw new Error(`visual drift requires post-repair gated status, got ${state.status}`);
  }
  if (!existsSync(join(run.absolutePath, REGRESSION_ARTIFACT))) {
    const message = "visual drift requires regression-results.json";
    blockRun(run.absolutePath, state, message, "regression-check");
    throw new Error(message);
  }
  const hasRound = ROUND_ARTIFACTS.every((artifact) => (
    (state.artifacts || []).includes(artifact) && existsSync(join(run.absolutePath, artifact))
  ));
  if (!hasRound) {
    const message = "visual drift requires repair-rounds/001 artifacts";
    blockRun(run.absolutePath, state, message, "harden");
    throw new Error(message);
  }

  const sourceSchema = schemaCheckRun(projectRoot, { runPath });
  if (!sourceSchema.ok) {
    const message = `visual drift requires valid regression source: ${sourceSchema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  const beforeScreenshots = beforeScreenshotRefs(run.absolutePath);
  const afterScreenshots = afterScreenshotRefs(run.absolutePath);
  const hasVisualEvidence = beforeScreenshots.length > 0 && afterScreenshots.length > 0;
  const drift = {
    schemaVersion: 1,
    runId: run.runId,
    artifact: VISUAL_DRIFT_ARTIFACT,
    status: hasVisualEvidence ? "READY" : "ABSENT",
    updatedAt: now(),
    roundId: "001",
    sourceArtifacts: [
      "repair-rounds/001/before-after-evidence.md",
      "repair-rounds/001/regression-results.json",
    ],
    verdict: hasVisualEvidence ? "NEEDS_HUMAN_REVIEW" : "NO_VISUAL_EVIDENCE",
    beforeScreenshots,
    afterScreenshots,
    evidenceGap: hasVisualEvidence
      ? null
      : "before and after screenshots are required for visual drift reporting",
  };

  writeFileSync(join(run.absolutePath, VISUAL_DRIFT_ARTIFACT), `${JSON.stringify(drift, null, 2)}\n`);
  return writeState(run.absolutePath, {
    ...addArtifact(state, VISUAL_DRIFT_ARTIFACT),
    status: "gated",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "complete-or-review-warnings",
  });
}

export function publishDesignSnapshot(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "gated" && state.status !== "published") {
    throw new Error(`publish design requires gated V2 source, got ${state.status}`);
  }

  const requiredSourceArtifacts = [
    "review-summary.md",
    "gate-report.md",
    "repair-rounds/001/round-summary.md",
    REGRESSION_ARTIFACT,
    VISUAL_DRIFT_ARTIFACT,
  ];
  const missingSources = requiredSourceArtifacts.filter((artifact) => !existsSync(join(run.absolutePath, artifact)));
  if (missingSources.length > 0) {
    const message = missingSources.some((artifact) => artifact.startsWith("repair-rounds/001/"))
      ? `publish design requires V2 repair round artifacts: missing ${missingSources.join(", ")}`
      : `publish design requires source artifacts: missing ${missingSources.join(", ")}`;
    const nextAction = missingSources.some((artifact) => artifact === "repair-rounds/001/round-summary.md")
      ? "harden"
      : (missingSources.some((artifact) => artifact === VISUAL_DRIFT_ARTIFACT) ? "visual-drift" : "harden");
    blockRun(run.absolutePath, state, message, nextAction);
    throw new Error(message);
  }

  const sourceSchema = schemaCheckRun(projectRoot, { runPath });
  if (!sourceSchema.ok) {
    const message = `publish design requires valid source run: ${sourceSchema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  const designDir = join(projectRoot, "design");
  ensureDir(designDir);
  const sourceArtifacts = requiredSourceArtifacts.map((artifact) => `${run.relativePath}/${artifact}`);
  const manifest = {
    schemaVersion: 1,
    sourceRunId: run.runId,
    packageStatus: "MINIMAL_READY",
    publishedAt: now(),
    files: ["design/manifest.json", "design/handoff.md"],
    sourceArtifacts,
  };
  writeFileSync(join(designDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  writeFileSync(join(designDir, "handoff.md"), [
    "---",
    "schemaVersion: 1",
    `sourceRunId: ${run.runId}`,
    "artifact: design/handoff.md",
    "status: READY",
    "source: publish-design",
    `updatedAt: ${now()}`,
    "---",
    "",
    "# Design Handoff",
    "",
    "## Implementation Scope",
    "Minimal V3a handoff published from a gated V2 source run.",
    "",
    "## Source Evidence",
    ...sourceArtifacts.map((artifact) => `- ${artifact}`),
    "",
    "## Open Questions",
    "none",
    "",
    "## Next Actions",
    "- review design/manifest.json and this handoff before expanding the design package",
    "",
  ].join("\n"));

  return writeState(run.absolutePath, {
    ...addArtifacts(state, ["design/manifest.json", "design/handoff.md"]),
    status: "published",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "review-design-handoff",
  });
}

export function publishHandoffPackage(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  const designDir = join(projectRoot, "design");
  const manifestPath = join(designDir, "manifest.json");
  const handoffPath = join(designDir, "handoff.md");

  if (!existsSync(manifestPath)) {
    const message = "publish handoff package requires design/manifest.json";
    blockRun(run.absolutePath, state, message, "publish-design");
    throw new Error(message);
  }
  if (!existsSync(handoffPath)) {
    const message = "publish handoff package requires design/handoff.md";
    blockRun(run.absolutePath, state, message, "publish-design");
    throw new Error(message);
  }
  if (state.status !== "published") {
    throw new Error(`publish handoff package requires published V3a source, got ${state.status}`);
  }

  const sourceSchema = schemaCheckRun(projectRoot, { runPath });
  if (!sourceSchema.ok) {
    const message = `publish handoff package requires valid V3a source: ${sourceSchema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const sourceArtifacts = manifest.sourceArtifacts || [];
  const sourceEvidence = sourceArtifacts.length === 0
    ? ["none"]
    : sourceArtifacts.map((artifact) => `- ${artifact}`);
  const handoffDir = join(designDir, "handoff");
  ensureDir(handoffDir);

  writeFileSync(join(handoffDir, "implementation-map.md"), [
    "---",
    "schemaVersion: 1",
    `sourceRunId: ${run.runId}`,
    "artifact: design/handoff/implementation-map.md",
    "status: READY",
    "source: publish-handoff",
    `updatedAt: ${now()}`,
    "---",
    "",
    "# Implementation Map",
    "",
    "## Summary",
    "V3b maps the handoff package back to the gated V2 source artifacts without introducing new product scope.",
    "",
    "## Source Evidence",
    ...sourceEvidence,
    "",
    "## Implementation Map",
    "- review-summary.md: source findings and current implementation concerns",
    "- gate-report.md: latest hard-gate verdict",
    "- repair-rounds/001/round-summary.md: bounded repair round outcome",
    "- repair-rounds/001/regression-results.json: protected feature regression source",
    "- repair-rounds/001/visual-drift.json: visual drift evidence source",
    "",
    "## Next Actions",
    "- use this map as the source index for the next completion audit",
    "",
  ].join("\n"));

  writeFileSync(join(handoffDir, "acceptance-checklist.md"), [
    "---",
    "schemaVersion: 1",
    `sourceRunId: ${run.runId}`,
    "artifact: design/handoff/acceptance-checklist.md",
    "status: READY",
    "source: publish-handoff",
    `updatedAt: ${now()}`,
    "---",
    "",
    "# Acceptance Checklist",
    "",
    "## Summary",
    "V3b checklist captures only handoff readiness checks that can be traced to existing source artifacts.",
    "",
    "## Source Evidence",
    ...sourceEvidence,
    "",
    "## Acceptance Checks",
    "- source evidence remains traceable",
    "- design/manifest.json lists only V3a and V3b handoff files",
    "- no completion percentage is claimed",
    "- no screens, flows, review package, or generated design assets are introduced",
    "",
    "## Next Actions",
    "- run schema-check before any completion audit",
    "",
  ].join("\n"));

  writeFileSync(join(handoffDir, "open-questions.md"), [
    "---",
    "schemaVersion: 1",
    `sourceRunId: ${run.runId}`,
    "artifact: design/handoff/open-questions.md",
    "status: READY",
    "source: publish-handoff",
    `updatedAt: ${now()}`,
    "---",
    "",
    "# Open Questions",
    "",
    "## Summary",
    "V3b records unresolved handoff questions without expanding the implementation scope.",
    "",
    "## Source Evidence",
    ...sourceEvidence,
    "",
    "## Open Questions",
    "none",
    "",
    "## Next Actions",
    "- add questions here before starting broader V3 package work",
    "",
  ].join("\n"));

  writeFileSync(join(handoffDir, "backlog.md"), [
    "---",
    "schemaVersion: 1",
    `sourceRunId: ${run.runId}`,
    "artifact: design/handoff/backlog.md",
    "status: READY",
    "source: publish-handoff",
    `updatedAt: ${now()}`,
    "---",
    "",
    "# Backlog",
    "",
    "## Summary",
    "V3b keeps non-current handoff expansion out of scope until a later explicit gate.",
    "",
    "## Source Evidence",
    ...sourceEvidence,
    "",
    "## Backlog",
    "none",
    "",
    "## Next Actions",
    "- start the completion audit only after this package passes schema-check",
    "",
  ].join("\n"));

  const nextManifest = {
    ...manifest,
    sourceRunId: run.runId,
    packageStatus: "HANDOFF_READY",
    publishedAt: now(),
    files: [...V3A_DESIGN_FILES, ...V3B_HANDOFF_FILES],
    sourceArtifacts,
  };
  writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);

  return writeState(run.absolutePath, {
    ...addArtifacts(state, V3B_HANDOFF_FILES),
    status: "published",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "schema-check",
  });
}

export function writeCompletionAudit(projectRoot = process.cwd(), { runPath } = {}) {
  const run = normalizeRunPath(projectRoot, runPath);
  const state = readState(run.absolutePath);
  if (state.status !== "published") {
    throw new Error(`completion audit requires published V3 source, got ${state.status}`);
  }

  const manifestPath = join(projectRoot, "design", "manifest.json");
  if (!existsSync(manifestPath)) {
    const message = "completion audit requires design/manifest.json";
    blockRun(run.absolutePath, state, message, "publish-design");
    throw new Error(message);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.packageStatus !== "HANDOFF_READY") {
    const message = "completion audit requires HANDOFF_READY handoff package";
    blockRun(run.absolutePath, state, message, "publish-handoff");
    throw new Error(message);
  }

  const sourceSchema = schemaCheckRun(projectRoot, { runPath });
  if (!sourceSchema.ok) {
    const message = `completion audit requires valid V3b package: ${sourceSchema.errors.join("; ")}`;
    blockRun(run.absolutePath, state, message, "schema-check");
    throw new Error(message);
  }

  const auditInputs = [
    "design/manifest.json",
    "design/handoff.md",
    ...V3B_HANDOFF_FILES,
  ];
  const sourceEvidence = [
    ...auditInputs,
    ...(manifest.sourceArtifacts || []),
  ];

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "completion-audit-packet.md",
    "READY",
    "completion-audit",
    [
      "# Completion Audit Packet",
      "",
      "## Summary",
      "V3c assembles deterministic audit inputs from the published V3b handoff package.",
      "",
      "## Source Evidence",
      ...sourceEvidence.map((artifact) => `- ${artifact}`),
      "",
      "## Audit Inputs",
      ...auditInputs.map((artifact) => `- ${artifact}`),
      "",
      "## Next Actions",
      "- review completion-report.md labels before expanding the design package",
      "",
    ].join("\n"),
  );

  writeMarkdown(
    run.absolutePath,
    run.runId,
    "completion-report.md",
    "READY",
    "completion-audit",
    [
      "# Completion Report",
      "",
      "## Summary",
      "V3c reports evidence-backed completion labels without percentages or broader package generation.",
      "",
      "## Completion Labels",
      "- IMPLEMENTED: V3a minimal design handoff",
      "- IMPLEMENTED: V3b handoff package",
      "- BLOCKED: completion percentage requires a deterministic denominator",
      "- BLOCKED: screen, flow, and review package expansion requires a later gate",
      "- BLOCKED: seed, full, and broad generation modes remain deferred",
      "",
      "## Blocked Output",
      "- no completion percentage is published",
      "- no design/screens output is published",
      "- no design/flows output is published",
      "- no design/review output is published",
      "",
      "## Next Actions",
      "- keep V3d mode readiness blocked until audit labels are reviewed",
      "",
    ].join("\n"),
  );

  return writeState(run.absolutePath, {
    ...addArtifacts(state, COMPLETION_AUDIT_ARTIFACTS),
    status: "published",
    previousStatus: null,
    blockedReason: null,
    nextRecommendedAction: "review-completion-audit",
  });
}
