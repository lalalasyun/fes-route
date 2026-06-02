---
tracker:
  kind: linear
  endpoint: https://api.linear.app/graphql
  api_key: $LINEAR_API_KEY
  project_slug: main
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    git clone https://github.com/lalalasyun/fes-route.git .
polling:
  interval_ms: 10000
agent:
  max_concurrent_agents: 2
  max_turns: 20
codex:
  command: "CODEX_HOME=/home/openclaw/.codex codex app-server"
  approval_policy: never
  thread_sandbox: danger-full-access
---
You are working on a Linear issue in the project for `lalalasyun/fes-route`.

Repository rules:
- Read `AGENTS.md` if present, then `docs/brief.md`, `docs/scope.md`, and `docs/technology-selection.md` before coding.
- Keep each change scoped to the Linear issue.
- Add or update tests when behavior changes.
- Run `./scripts/symphony-validate.sh` before opening or updating a PR.
- Do not commit secrets, local DB files, raw private data, `.env`, `.symphony/`, or `.symphony-run/`.

Tracker rules:
- Linear Project `main` + Linear Issues are the control plane.
- Keep progress in the Linear issue comments when possible.
- Link PRs to Linear issues using the Linear issue ID in branch names, PR titles, or PR bodies.
- If scope expands, create a follow-up Linear issue instead of silently adding it.

Issue context:
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- State: {{ issue.state }}
- Labels: {{ issue.labels }}
- URL: {{ issue.url }}

Description:
{{issue.description}}
