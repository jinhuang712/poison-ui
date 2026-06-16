#!/usr/bin/env node

import {
  createReviewRun,
  gateRun,
  initPoisonProject,
  recordDegradedCapture,
  schemaCheckRun,
  writeReviewArtifacts,
} from "../src/core/v1-runtime.mjs";

const help = `poison-ui

V1 review-first CLI for the poison UI prototype workflow.

Usage:
  poison --help
  poison init
  poison new-run --mode review --name <name>
  poison capture --url <url> --run <run-path>
  poison review --run <run-path>
  poison schema-check --run <run-path>
  poison gate --run <run-path>

See:
  docs/delivery/v1-acceptance.md
`;

const args = process.argv.slice(2);

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

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  process.stdout.write(help);
  process.exit(0);
}

const [command, ...rest] = args;
const options = parseOptions(rest);
const cwd = process.cwd();

try {
  switch (command) {
    case "init":
      initPoisonProject(cwd);
      process.stdout.write("init: created .poison/context and .poison/runs\n");
      break;
    case "new-run": {
      const run = createReviewRun(cwd, { mode: options.mode, name: options.name });
      process.stdout.write(`new-run: ${run.relativePath}\n`);
      break;
    }
    case "capture":
      recordDegradedCapture(cwd, {
        runPath: options.run,
        url: options.url,
        reason: "Automated browser capture is unavailable in the V1 dependency-free runtime.",
      });
      process.stdout.write("capture: degraded evidence recorded\n");
      break;
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
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  fail(error);
}
