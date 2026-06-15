# Repository Architecture

> Source split from `poison_execution_plan_zh.md`.

## 1. 目标目录结构

在仓库中创建以下平台中立源码结构：

```text
WORKFLOW.md
CLAUDE.md
AGENTS.md
package.json
bin/
  poison.mjs
skills/
  poison/
    SKILL.md
    references/
      workflow.md
      output-contract.md
      readiness-rubric.md
      completion-rubric.md
      visual-rubric.md
      ux-rubric.md
      frontend-rubric.md
      poison-taxonomy.md
      visual-quality-pluses.md
      review-schema.md
      review-ensemble.md
      gate-rules.md
      adapter-contract.md
      harness-claude.md
      harness-codex.md
    reviewers/
      product-realist.md
      ux-operator.md
      visual-craft.md
      frontend-pragmatist.md
      contrarian-taste.md
    roles/
      orchestrator.md
      librarian.md
      designer.md
      reviewer.md
      review-arbiter.md
src/
  cli/
  core/
  tools/
    schema-check.mjs
.claude-plugin/
  plugin.json
.codex-plugin/
  plugin.json
docs/
tests/
```

如果需要兼容 Claude Code 的 `.claude/skills` / `.claude/agents` 形态，应该通过 adapter 或同步脚本生成，不能让 `.claude/` 成为唯一源码。

运行时产物写入：

```text
.poison/
  context/
    poison-core.v1.md
    poison-core.current.md
    design-decisions.md
    constraints.md
    guidelines.md
    open-questions.md
    prototype-map.md
    interaction-backlog.md
    visual-system.md
    visual-memory.md
    user-design-taste.md
    design-source.md
    changelog.md
  runs/
    001-seed/
      run-state.json
      decisions/
        001-layout-choice.html
        001-layout-choice.md
      design-rationale.md
      user-ambiguity-check.md
    002-evolve-review-detail/
    003-full-spec/
```

更新 `.gitignore`：

```text
.poison/runs/*/screenshots/
.poison/runs/*/console.log
.poison/runs/*/tmp/
```

默认不要忽略 `.poison/context/`。这些上下文文件应该可以被 git 追踪，除非仓库 owner 后续决定不追踪。

---

