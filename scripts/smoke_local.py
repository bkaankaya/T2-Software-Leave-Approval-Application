#!/usr/bin/env python3
"""Smoke-test the real clean-clone developer launcher via loopback HTTP.

Run from the repository root: python scripts/smoke_local.py
Requires the same Java/Maven/Node/Python prerequisites as scripts/dev.py.
"""
from __future__ import annotations

import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
DEADLINE_SECONDS = 150


def status(url: str) -> int | None:
    try:
        with urlopen(url, timeout=2) as response:
            return response.status
    except HTTPError as error:
        return error.code
    except (URLError, TimeoutError, OSError):
        return None


def main() -> int:
    with tempfile.TemporaryFile(mode="w+b") as log:
        proc = subprocess.Popen(
            [sys.executable, "-u", str(ROOT / "scripts/dev.py")],
            cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
        )
        result = 1
        try:
            deadline = time.monotonic() + DEADLINE_SECONDS
            while time.monotonic() < deadline:
                if proc.poll() is not None:
                    print(f"Local launcher exited early with status {proc.returncode}.", file=sys.stderr)
                    break
                ui = status("http://127.0.0.1:3000/")
                api = status("http://127.0.0.1:3000/api/auth/verify-token")
                if ui == 200 and api == 401:
                    print("Clean clone startup verified: UI=200 and proxied unauthenticated API=401.")
                    result = 0
                    break
                time.sleep(2)
            else:
                print("Local services did not become ready before timeout.", file=sys.stderr)
        finally:
            if proc.poll() is None:
                try:
                    proc.send_signal(signal.SIGINT if os.name != "nt" else signal.SIGTERM)
                    proc.wait(timeout=12)
                except (OSError, subprocess.TimeoutExpired):
                    proc.kill()
                    proc.wait()
            if result:
                log.seek(0)
                print(log.read().decode("utf-8", errors="replace")[-12000:], file=sys.stderr)
        return result


if __name__ == "__main__":
    sys.exit(main())
