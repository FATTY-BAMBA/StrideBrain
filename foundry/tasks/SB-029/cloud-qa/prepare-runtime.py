#!/usr/bin/env python3
"""Verify the pinned application; optionally create a fresh private QA runtime.

--check is read-only. --initialize writes only /tmp/sb029-cloud-qa and refuses
an existing directory. It never starts a database, app, browser, or deployment.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import shlex
import socket
import subprocess

CHECKPOINT = "2a23d31f46e0b6c7b465b3774ad765c81a3417eb"
APPLICATION = "4c13f726bb75f4a31d263eb6e54622224807d019"
MANIFEST_SHA256 = "7fe5157f84f9c88023462ec1e958b62a53bcdb5aef30eb0dc4ac95dfdac85920"
TASK_PATH = "foundry/tasks/SB-029/"
RUNTIME = Path("/tmp/sb029-cloud-qa")
PACKAGE = Path(__file__).resolve().parent
WORKSPACE = PACKAGE.parents[3]


def git(*args):
    return subprocess.check_output(["git", *args], cwd=WORKSPACE)


def verify():
    head = git("rev-parse", "HEAD").decode().strip()
    subprocess.run(["git", "merge-base", "--is-ancestor", CHECKPOINT, head],
                   cwd=WORKSPACE, check=True)
    changed = git("diff", "--name-only", CHECKPOINT, head).decode().splitlines()
    if any(not path.startswith(TASK_PATH) for path in changed):
        raise SystemExit("STOP: product changed after the evidence checkpoint")
    validation = json.loads((WORKSPACE / TASK_PATH / "validation-final.json").read_text())
    paths = validation["sourceTreePaths"]
    manifest = git("ls-tree", "-r", head, "--", *paths)
    if hashlib.sha256(manifest).hexdigest() != MANIFEST_SHA256:
        raise SystemExit("STOP: application source manifest differs from tested commit")
    if manifest != git("ls-tree", "-r", APPLICATION, "--", *paths):
        raise SystemExit("STOP: source tree differs from application candidate")
    dirty = git("diff", "--name-only", "HEAD").decode().splitlines()
    untracked = git("ls-files", "--others", "--exclude-standard").decode().splitlines()
    if any(not path.startswith(TASK_PATH) for path in dirty + untracked):
        raise SystemExit("STOP: uncommitted files outside task artifacts")
    migrations = list((WORKSPACE / "prisma/migrations").glob("*/migration.sql"))
    if len(migrations) != 8:
        raise SystemExit("STOP: expected exactly eight reviewed migrations")
    return {"head": head, "applicationHead": APPLICATION,
            "evidenceCheckpoint": CHECKPOINT,
            "sourceTreeFingerprintSha256": MANIFEST_SHA256,
            "migrations": len(migrations), "browserQa": "NOT_RUN"}


def private_write(name, content, mode=0o600):
    target = RUNTIME / name
    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
    with os.fdopen(descriptor, "w") as stream:
        stream.write(content)


def initialize(evidence):
    helpers = [str(path.relative_to(WORKSPACE)) for path in PACKAGE.iterdir()
               if path.suffix in (".py", ".mjs", ".sh")]
    tracked = set(git("ls-files", "--", *helpers).decode().splitlines())
    changed = git("diff", "--name-only", "HEAD", "--", *helpers).decode().splitlines()
    if set(helpers) != tracked or changed:
        raise SystemExit("STOP: executable QA helpers must match the recorded committed HEAD")
    if RUNTIME.exists():
        raise SystemExit("STOP: runtime already exists; do not overwrite or reuse credentials")
    if any(character in str(WORKSPACE) for character in ('\n', '\r', '"')):
        raise SystemExit("STOP: unsupported workspace path for private environment file")
    if subprocess.check_output(["node", "-p", "process.versions.node.split('.')[0]"]).strip() != b"24":
        raise SystemExit("STOP: Node.js 24 is required")
    for port in (3000, 3001, 54329):
        with socket.socket() as probe:
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                raise SystemExit(f"STOP: loopback port {port} is occupied; do not stop an unrelated process")
    os.umask(0o077)
    RUNTIME.mkdir(mode=0o700)
    password = secrets.token_hex(32)
    secret = secrets.token_hex(48)
    private_write("postgres.env", "POSTGRES_USER=stridebrain\n"
                  f"POSTGRES_PASSWORD={password}\nPOSTGRES_DB=stridebrain_stage8_preview\n")
    private_write("preview.env", "\n".join([
        f"DATABASE_URL=postgresql://stridebrain:{password}@localhost:54329/stridebrain_stage8_preview?schema=public",
        f"STRIDEBRAIN_DEMO_SESSION_SECRET={secret}",
        "STRIDEBRAIN_APP_ORIGIN=http://localhost:3000",
        "STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC",
        "NEXT_PUBLIC_STRIDEBRAIN_ENV=preview", "NEXT_TELEMETRY_DISABLED=1",
        f'SB029_PREVIEW_WORKSPACE="{WORKSPACE}"',
        "SB029_PREVIEW_OPERATOR_PORT=3001",
        "npm_config_cache=/tmp/sb029-cloud-qa/npm-cache", "",
    ]))
    for filename in ("operator.mjs", "source-loader.mjs", "with-preview-env.mjs"):
        private_write(filename, (PACKAGE / filename).read_text())
    # Node --env-file otherwise lets inherited values override the private file.
    # Never let a host DATABASE_URL silently redirect migrations or app writes.
    cleared_keys = (
        "DATABASE_URL", "STRIDEBRAIN_DEMO_SESSION_SECRET", "STRIDEBRAIN_APP_ORIGIN",
        "STRIDEBRAIN_DATA_MODE", "NEXT_PUBLIC_STRIDEBRAIN_ENV", "NEXT_TELEMETRY_DISABLED",
        "SB029_PREVIEW_WORKSPACE", "SB029_PREVIEW_OPERATOR_PORT", "npm_config_cache",
    )
    node_command = "env " + " ".join(f"-u {key}" for key in cleared_keys) + " node"
    private_write("run-operator.sh", "#!/usr/bin/env bash\nset -euo pipefail\n"
                  f"exec {node_command} --env-file=/tmp/sb029-cloud-qa/preview.env "
                  "--import /tmp/sb029-cloud-qa/source-loader.mjs "
                  '/tmp/sb029-cloud-qa/operator.mjs "$@"\n', 0o700)
    private_write("run.sh", "#!/usr/bin/env bash\nset -euo pipefail\n"
                  f"cd {shlex.quote(str(WORKSPACE))}\n"
                  f"exec {node_command} --env-file=/tmp/sb029-cloud-qa/preview.env "
                  '/tmp/sb029-cloud-qa/with-preview-env.mjs "$@"\n', 0o700)
    private_write("source-verification.json", json.dumps(evidence, indent=2) + "\n")
    print(json.dumps({"runtime": str(RUNTIME), "credentialsPrinted": False,
                      "databaseStarted": False, "browserQa": "NOT_RUN"}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--initialize", action="store_true")
    args = parser.parse_args()
    evidence = verify()
    if args.initialize:
        initialize(evidence)
    else:
        print(json.dumps(evidence, indent=2))
