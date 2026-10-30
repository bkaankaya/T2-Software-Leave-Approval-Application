#!/usr/bin/env python3
"""Start both services in a fresh clone with a private, persistent local JWT key.

Requires Python 3.9+, Java 21, Maven 3.9+, and Node.js 22.12+.
No third-party Python packages, global npm install, or checked-in secrets.
"""
from __future__ import annotations

import argparse
import base64
import os
from pathlib import Path
import re
import secrets
import signal
import shutil
import socket
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "1.giris"
LOCAL_ENV = BACKEND / ".env.local"


def tool(name: str) -> str:
    """Resolve .cmd shims on Windows instead of assuming POSIX executables."""
    path = shutil.which(name)
    if path is None:
        raise RuntimeError(f"Missing executable: {name}")
    return path


def command_output(command: list[str]) -> str:
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=15, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError(f"Unable to run {command[0]}: {exc}") from exc
    if result.returncode != 0:
        raise RuntimeError(f"{command[0]} failed: {result.stderr.strip() or result.stdout.strip()}")
    return (result.stdout + result.stderr).strip()


def prerequisites() -> None:
    missing = [name for name in ("java", "mvn", "node", "npm") if shutil.which(name) is None]
    if missing:
        raise RuntimeError("Missing prerequisites: " + ", ".join(missing) +
                           ". Install Java 21, Maven 3.9+ and Node.js 22.12+ first.")
    java = command_output([tool("java"), "-version"])
    match = re.search(r'version "(\d+)', java)
    if not match or int(match.group(1)) < 21:
        raise RuntimeError("Java 21+ is required. Detected: " + java.splitlines()[0])
    maven = command_output([tool("mvn"), "-version"])
    match = re.search(r"Apache Maven (\d+)\.(\d+)", maven)
    if not match or (int(match.group(1)), int(match.group(2))) < (3, 9):
        raise RuntimeError("Maven 3.9+ is required. Detected: " + maven.splitlines()[0])
    node = command_output([tool("node"), "--version"])
    match = re.fullmatch(r"v(\d+)\.(\d+)\.(\d+)", node)
    if not match:
        raise RuntimeError("Unrecognized Node.js version: " + node)
    major, minor = int(match.group(1)), int(match.group(2))
    if major < 22 or (major == 22 and minor < 12):
        raise RuntimeError("This project requires Node.js 22.12+ (prefer Node 22 LTS). Detected: " + node)


def local_environment() -> dict[str, str]:
    env = os.environ.copy()
    if not env.get("JWT_SECRET"):
        secret = None
        if LOCAL_ENV.exists():
            for line in LOCAL_ENV.read_text(encoding="utf-8").splitlines():
                if line.startswith("JWT_SECRET="):
                    secret = line.partition("=")[2].strip()
                    break
        if secret is None:
            secret = base64.b64encode(secrets.token_bytes(32)).decode("ascii")
            LOCAL_ENV.write_text("JWT_SECRET=" + secret + "\n", encoding="utf-8")
            try:
                LOCAL_ENV.chmod(0o600)
            except OSError:
                pass  # Windows uses ACLs instead of POSIX file modes.
            print("Generated private development JWT key in backend/.env.local (git-ignored).")
        if len(base64.b64decode(secret, validate=True)) < 32:
            raise RuntimeError("The local JWT key must contain >=32 random bytes (Base64).")
        env["JWT_SECRET"] = secret
    # Prevent a previously configured production profile from accidentally being used.
    if env.get("SPRING_PROFILES_ACTIVE") not in (None, "", "local"):
        raise RuntimeError("Refusing to start local development with a non-local Spring profile.")
    env["SPRING_PROFILES_ACTIVE"] = "local"
    return env


def assert_free(port: int) -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        if sock.connect_ex(("127.0.0.1", port)) == 0:
            raise RuntimeError(f"Port {port} is in use. Stop the existing service first.")


def stop(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    if os.name == "nt":
        # Stopping a .cmd wrapper alone does not terminate its Java/Node child.
        subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                       capture_output=True, check=False, timeout=10)
    else:
        # Maven can launch a child JVM; kill the isolated process group.
        os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=7)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def run() -> int:
    parser = argparse.ArgumentParser(description="Run the T2 leave application locally.")
    parser.add_argument("--check", action="store_true", help="Verify dependencies, tests, and frontend build without running servers.")
    parser.add_argument("--clean", action="store_true", help="Reinstall frontend dependencies from package-lock.json.")
    args = parser.parse_args()

    prerequisites()
    env = local_environment()
    if args.clean or not (FRONTEND / "node_modules").is_dir():
        print("Installing locked frontend dependencies (npm ci)...", flush=True)
        subprocess.run([tool("npm"), "ci"], cwd=FRONTEND, check=True, env=env)
    if args.check:
        print("Running backend tests, frontend tests, lint, build and audit...", flush=True)
        for cmd, directory in (
            ([tool("mvn"), "-B", "verify"], BACKEND),
            ([tool("npm"), "run", "test"], FRONTEND),
            ([tool("npm"), "run", "lint"], FRONTEND),
            ([tool("npm"), "run", "build"], FRONTEND),
            ([tool("npm"), "audit", "--audit-level=high"], FRONTEND),
        ):
            subprocess.run(cmd, cwd=directory, env=env, check=True)
        print("All checks passed.")
        return 0

    assert_free(8080)
    assert_free(3000)
    backend = frontend = None
    try:
        print("Starting API at http://localhost:8080 and UI at http://localhost:3000", flush=True)
        print("Ctrl+C stops both services. Registration creates employee accounts.", flush=True)
        backend = subprocess.Popen([tool("mvn"), "spring-boot:run"], cwd=BACKEND, env=env,
                                   start_new_session=(os.name != "nt"))
        frontend = subprocess.Popen(
            [tool("npm"), "run", "start", "--", "--host", "127.0.0.1", "--strictPort"],
            cwd=FRONTEND, env=env, start_new_session=(os.name != "nt"),
        )
        while True:
            if backend.poll() is not None:
                raise RuntimeError(f"Backend stopped unexpectedly (exit {backend.returncode}).")
            if frontend.poll() is not None:
                raise RuntimeError(f"Frontend stopped unexpectedly (exit {frontend.returncode}).")
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping local services...", flush=True)
        return 0
    finally:
        stop(frontend)
        stop(backend)


if __name__ == "__main__":
    try:
        sys.exit(run())
    except (RuntimeError, OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"\nLocal development error: {error}", file=sys.stderr)
        sys.exit(1)
