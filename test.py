"""
Minimal Flask API test server for Raspberry Pi 4.

Usage:
  1) Install deps:
     pip install flask requests
  2) Start API (binds on all interfaces so other devices can reach it):
     python test.py
  3) Run a quick connectivity test from same machine:
     python test.py --self-test
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)


@app.get("/health")
def health() -> tuple[dict, int]:
    return {
        "ok": True,
        "service": "pi-test-api",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }, 200


@app.post("/echo")
def echo() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    return {"received": payload}, 200


def run_self_test(host: str, port: int) -> None:
    base_url = f"http://{host}:{port}"

    health_resp = requests.get(f"{base_url}/health", timeout=5)
    print("GET /health ->", health_resp.status_code, health_resp.json())

    echo_resp = requests.post(
        f"{base_url}/echo",
        json={"message": "hello from self-test"},
        timeout=5,
    )
    print("POST /echo ->", echo_resp.status_code, echo_resp.json())


def main() -> None:
    parser = argparse.ArgumentParser(description="Run or test a tiny Flask API.")
    parser.add_argument("--host", default="0.0.0.0", help="Server host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=5000, help="Server port (default: 5000)")
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Call the running API endpoints instead of starting the server.",
    )
    args = parser.parse_args()

    if args.self_test:
        # For local self-test, default to localhost unless user overrides host.
        test_host = "127.0.0.1" if args.host == "0.0.0.0" else args.host
        run_self_test(test_host, args.port)
        return

    app.run(host=args.host, port=args.port, debug=False)


if __name__ == "__main__":
    main()
