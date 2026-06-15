#!/usr/bin/env node

const help = `poison-ui

Early-stage scaffold for the poison UI prototype workflow.

Usage:
  poison --help

Planned command:
  poison [action-or-mode] [options]

See:
  poison_execution_plan_zh.md
`;

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  process.stdout.write(help);
  process.exit(0);
}

process.stderr.write(
  "poison-ui is not implemented yet. See poison_execution_plan_zh.md for the V1 plan.\n"
);
process.exit(1);

