---
tracker:
  kind: github
  repo: lalalasyun/fes-route
  project_number: 8
  status_field: Status
  active_states:
    - Todo
    - Pending
    - In Progress
  terminal_states:
    - Done
workspace:
  root: /home/openclaw/code/fes-route-symphony
hooks:
  after_create: |
    git clone https://github.com/lalalasyun/fes-route.git .
    git checkout -b symphony/issue-$SYMPHONY_ISSUE_NUMBER
polling:
  interval_ms: 30000
agent:
  max_concurrent_agents: 1
codex:
  model: gpt-5.4
  approval_policy: never
  thread_sandbox: danger-full-access
---
You are working in the Fes Route repo for GitHub Issue {{issue.identifier}}.

Issue: {{issue.title}}
URL: {{issue.url}}
Labels: {{issue.labels}}

Use the repository-local instructions and skills. Keep the change scoped to this
issue, run the smallest meaningful validation gate, and leave a clear commit or
PR-ready state when finished.

Issue body:

{{issue.description}}
