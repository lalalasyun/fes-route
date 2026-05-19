#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
import re
import shlex
import subprocess
import sys
import time
from pathlib import Path

FRONT_MATTER_RE = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.DOTALL)
PLACEHOLDER_RE = re.compile(r"\{\{\s*issue\.([a-zA-Z0-9_]+)\s*\}\}")


def parse_scalar(value: str) -> object:
    lowered = value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def line_indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def next_content_index(lines: list[str], start: int) -> int | None:
    for index in range(start, len(lines)):
        stripped = lines[index].strip()
        if stripped and not stripped.startswith("#"):
            return index
    return None


def parse_block_scalar(lines: list[str], start: int, parent_indent: int) -> tuple[str, int]:
    index = start
    collected: list[str] = []
    min_indent: int | None = None
    while index < len(lines):
        raw = lines[index]
        stripped = raw.strip()
        indent = line_indent(raw)
        if stripped and indent <= parent_indent:
            break
        if stripped:
            min_indent = indent if min_indent is None else min(min_indent, indent)
        collected.append(raw)
        index += 1

    if min_indent is None:
        return "", index

    normalized: list[str] = []
    for raw in collected:
        if raw.strip():
            normalized.append(raw[min_indent:])
        else:
            normalized.append("")
    return "\n".join(normalized).rstrip(), index


def parse_block(lines: list[str], start: int, indent: int) -> tuple[object, int]:
    index = next_content_index(lines, start)
    if index is None:
        return {}, len(lines)
    if line_indent(lines[index]) != indent:
        raise ValueError("WORKFLOW.md front matter のインデントが不正です")
    if lines[index][indent:].startswith("- "):
        items: list[object] = []
        while index < len(lines):
            raw = lines[index]
            stripped = raw.strip()
            if not stripped or stripped.startswith("#"):
                index += 1
                continue
            current_indent = line_indent(raw)
            if current_indent < indent:
                break
            if current_indent != indent or not raw[indent:].startswith("- "):
                raise ValueError("WORKFLOW.md front matter の list インデントが不正です")
            payload = raw[indent + 2 :].strip()
            if payload:
                items.append(parse_scalar(payload))
                index += 1
                continue
            child_index = next_content_index(lines, index + 1)
            if child_index is None:
                items.append({})
                index += 1
                continue
            child_indent = line_indent(lines[child_index])
            if child_indent <= indent:
                items.append({})
                index += 1
                continue
            value, index = parse_block(lines, child_index, child_indent)
            items.append(value)
        return items, index

    mapping: dict[str, object] = {}
    while index < len(lines):
        raw = lines[index]
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            index += 1
            continue
        current_indent = line_indent(raw)
        if current_indent < indent:
            break
        if current_indent != indent:
            raise ValueError("WORKFLOW.md front matter の map インデントが不正です")
        content = raw[indent:]
        key, sep, remainder = content.partition(":")
        if not sep:
            raise ValueError(f"WORKFLOW.md front matter を解釈できません: {content}")
        key = key.strip()
        remainder = remainder.lstrip()
        if remainder in {"|", "|-", "|+"}:
            value, index = parse_block_scalar(lines, index + 1, current_indent)
            mapping[key] = value
            continue
        if remainder:
            mapping[key] = parse_scalar(remainder)
            index += 1
            continue
        child_index = next_content_index(lines, index + 1)
        if child_index is None:
            mapping[key] = {}
            index += 1
            continue
        child_indent = line_indent(lines[child_index])
        if child_indent <= current_indent:
            mapping[key] = {}
            index += 1
            continue
        value, index = parse_block(lines, child_index, child_indent)
        mapping[key] = value
    return mapping, index


def parse_front_matter(raw_config: str) -> dict:
    parsed, _ = parse_block(raw_config.splitlines(), 0, 0)
    if not isinstance(parsed, dict):
        raise ValueError("WORKFLOW.md front matter は map である必要があります")
    return parsed


def load_workflow(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return {}, text.strip()
    raw_config, body = match.groups()
    config = parse_front_matter(raw_config)
    return config, body.strip()


def run_json(command: list[str], cwd: Path | None = None) -> dict:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"command failed: {' '.join(command)}")
    return json.loads(result.stdout)


def run_text(command: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"command failed: {' '.join(command)}")
    return result.stdout.strip()


def gh_graphql(query: str, variables: dict[str, object] | None = None) -> dict:
    command = ["gh", "api", "graphql", "-f", f"query={query}"]
    for key, value in (variables or {}).items():
        command.extend(["-F", f"{key}={value}"])
    return run_json(command)


def fetch_project_items(project_number: int) -> list[dict]:
    query = """
query($number: Int!, $after: String) {
  viewer {
    login
    projectV2(number: $number) {
      id
      title
      fields(first: 20) {
        nodes {
          ... on ProjectV2FieldCommon {
            id
            name
            dataType
          }
          ... on ProjectV2SingleSelectField {
            options {
              id
              name
            }
          }
        }
      }
      items(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          content {
            __typename
            ... on Issue {
              id
              number
              title
              body
              url
              state
              repository {
                nameWithOwner
              }
              labels(first: 20) {
                nodes {
                  name
                }
              }
            }
          }
          fieldValues(first: 20) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                optionId
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
""".strip()
    items: list[dict] = []
    after: str | None = None
    while True:
        variables: dict[str, object] = {"number": project_number}
        if after:
            variables["after"] = after
        data = gh_graphql(query, variables)
        project = data["data"]["viewer"]["projectV2"]
        if not project:
            raise RuntimeError(f"GitHub Project #{project_number} が見つかりません")
        page = project["items"]
        items.extend(page["nodes"])
        page_info = page["pageInfo"]
        if not page_info["hasNextPage"]:
            return items
        after = page_info["endCursor"]


def extract_status(item: dict, field_name: str) -> str | None:
    for node in item.get("fieldValues", {}).get("nodes", []):
        if node.get("__typename") != "ProjectV2ItemFieldSingleSelectValue":
            continue
        field = node.get("field") or {}
        if field.get("name") == field_name:
            return node.get("name")
    return None


def normalize_issue(item: dict, repo: str, status_field: str) -> dict | None:
    content = item.get("content") or {}
    if content.get("__typename") != "Issue":
        return None
    if content.get("repository", {}).get("nameWithOwner") != repo:
        return None
    labels = [node["name"] for node in content.get("labels", {}).get("nodes", [])]
    status = extract_status(item, status_field)
    return {
        "item_id": item["id"],
        "identifier": f"#{content['number']}",
        "number": content["number"],
        "title": content["title"],
        "description": content.get("body") or "",
        "url": content.get("url") or "",
        "state": status or content.get("state") or "Unknown",
        "labels": ", ".join(labels),
        "github_state": content.get("state") or "OPEN",
    }


def render_prompt(template: str, issue: dict) -> str:
    def replace(match: re.Match) -> str:
        key = match.group(1)
        return str(issue.get(key, ""))

    return PLACEHOLDER_RE.sub(replace, template)


def ensure_workspace(workspace_root: Path, issue: dict, after_create: str | None) -> Path:
    workspace = workspace_root / f"issue-{issue['number']}"
    created = not workspace.exists()
    workspace.mkdir(parents=True, exist_ok=True)
    if created and after_create:
        env = os.environ.copy()
        env.update(
            {
                "SYMPHONY_ISSUE_NUMBER": str(issue["number"]),
                "SYMPHONY_ISSUE_IDENTIFIER": str(issue["identifier"]),
                "SYMPHONY_ISSUE_TITLE": str(issue["title"]),
                "SYMPHONY_ISSUE_URL": str(issue["url"]),
            }
        )
        subprocess.run(
            render_prompt(after_create, issue),
            cwd=workspace,
            shell=True,
            check=True,
            env=env,
        )
    return workspace


def build_codex_command(
    workspace: Path,
    model: str,
    sandbox: str,
    approval: str,
    output_file: Path,
    prompt: str,
) -> list[str]:
    command = [
        "codex",
        "exec",
        "--json",
        "--cd",
        str(workspace),
        "--model",
        model,
        "--output-last-message",
        str(output_file),
    ]

    if approval == "never":
        if sandbox == "danger-full-access":
            command.append("--dangerously-bypass-approvals-and-sandbox")
        else:
            command.append("--full-auto")
    else:
        command.extend(["--sandbox", sandbox])

    command.append(prompt)
    return command


async def stream_to_file(stream: asyncio.StreamReader | None, destination: Path) -> None:
    if stream is None:
        return
    with destination.open("wb") as handle:
        while True:
            chunk = await stream.read(4096)
            if not chunk:
                break
            handle.write(chunk)
            handle.flush()


async def run_issue(issue: dict, config: dict, prompt_template: str, args: argparse.Namespace) -> None:
    workspace_root = Path(os.path.expanduser(os.path.expandvars(config["workspace"]["root"])))
    workspace = workspace_root / f"issue-{issue['number']}"

    if args.dry_run:
        print(f"[dry-run] {issue['identifier']} {issue['title']} @ {issue['state']} -> {workspace}")
        return

    workspace = ensure_workspace(workspace_root, issue, (config.get("hooks") or {}).get("after_create"))
    prompt = render_prompt(prompt_template, issue)

    logs_dir = workspace / ".symphony-run"
    logs_dir.mkdir(exist_ok=True)
    prompt_file = logs_dir / "prompt.md"
    prompt_file.write_text(prompt)

    codex = config.get("codex") or {}
    model = codex.get("model", "gpt-5.4")
    sandbox = codex.get("thread_sandbox", "workspace-write")
    approval = codex.get("approval_policy", "never")
    started_at = int(time.time())
    output_file = logs_dir / f"last-message-{started_at}.txt"
    stdout_file = logs_dir / f"stdout-{started_at}.jsonl"
    stderr_file = logs_dir / f"stderr-{started_at}.log"
    metadata_file = logs_dir / f"run-{started_at}.json"

    command = build_codex_command(
        workspace=workspace,
        model=model,
        sandbox=sandbox,
        approval=approval,
        output_file=output_file,
        prompt=prompt,
    )

    print(f"[run] {issue['identifier']} {issue['title']} @ {issue['state']}")
    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(workspace),
    )
    metadata = {
        "issue": issue["identifier"],
        "title": issue["title"],
        "workspace": str(workspace),
        "started_at": started_at,
        "pid": process.pid,
        "command": command,
        "prompt_file": str(prompt_file),
        "output_file": str(output_file),
        "stdout_file": str(stdout_file),
        "stderr_file": str(stderr_file),
        "status": "running",
    }
    metadata_file.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    await asyncio.gather(
        stream_to_file(process.stdout, stdout_file),
        stream_to_file(process.stderr, stderr_file),
    )
    returncode = await process.wait()
    metadata["completed_at"] = int(time.time())
    metadata["returncode"] = returncode
    metadata["status"] = "succeeded" if returncode == 0 else "failed"
    metadata_file.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    stdout = stdout_file.read_text(encoding="utf-8", errors="ignore") if stdout_file.exists() else ""
    stderr = stderr_file.read_text(encoding="utf-8", errors="ignore") if stderr_file.exists() else ""
    if returncode != 0:
        raise RuntimeError(f"{issue['identifier']} failed: {stderr or stdout}")


async def run_cycle(config: dict, prompt_template: str, args: argparse.Namespace) -> None:
    tracker = config.get("tracker") or {}
    if tracker.get("kind") != "github":
        raise RuntimeError("この実装は tracker.kind=github のみ対応")

    items = fetch_project_items(int(tracker["project_number"]))
    issues = []
    for item in items:
        issue = normalize_issue(item, tracker["repo"], tracker.get("status_field", "Status"))
        if not issue:
            continue
        issues.append(issue)

    active_states = set(tracker.get("active_states") or [])
    candidates = [issue for issue in issues if issue["state"] in active_states and issue["github_state"] == "OPEN"]
    if args.issue:
        candidates = [issue for issue in candidates if str(issue["number"]) == str(args.issue).lstrip("#")]

    if not candidates:
        print("candidate issue はありません")
        return

    max_concurrent = int((config.get("agent") or {}).get("max_concurrent_agents", 2))
    semaphore = asyncio.Semaphore(max_concurrent)

    async def bounded(issue: dict) -> None:
        async with semaphore:
            await run_issue(issue, config, prompt_template, args)

    await asyncio.gather(*(bounded(issue) for issue in candidates))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="GitHub Projects-native Symphony runner for Fes Route")
    parser.add_argument("workflow", nargs="?", default="WORKFLOW.md")
    parser.add_argument("--once", action="store_true", help="1回だけ poll して終了")
    parser.add_argument("--dry-run", action="store_true", help="issue を列挙するだけで codex を起動しない")
    parser.add_argument("--issue", help="特定 issue 番号だけ処理する (例: 90 or #90)")
    return parser


async def main() -> int:
    args = build_parser().parse_args()
    workflow_path = Path(args.workflow).resolve()
    config, prompt_template = load_workflow(workflow_path)
    polling = (config.get("polling") or {}).get("interval_ms", 10000)

    if args.once:
        await run_cycle(config, prompt_template, args)
        return 0

    while True:
        try:
            await run_cycle(config, prompt_template, args)
        except Exception as exc:
            print(f"[error] {exc}", file=sys.stderr)
        await asyncio.sleep(polling / 1000)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
