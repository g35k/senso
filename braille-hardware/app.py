"""
Flask API for Senso: GPIO Braille input → React app over Wi-Fi.

Quiz + lesson snapshot live in user_state.json (same file as braille.py) — no database.

Run on the Pi:  python app.py
Default port 5001 (macOS AirPlay often uses 5000). Override: PORT=5000 python app.py
Dependencies:  pip install flask flask-cors RPi.GPIO
"""

from __future__ import annotations

import json
import os
import random
import threading
from typing import Any

from flask import Flask, jsonify
from flask_cors import CORS

BRAILLE_MAP: dict[tuple[int, ...], str] = {
    (1, 0, 0, 0, 0, 0): "A",
    (1, 1, 0, 0, 0, 0): "B",
    (1, 0, 0, 1, 0, 0): "C",
    (1, 0, 0, 1, 1, 0): "D",
    (1, 0, 0, 0, 1, 0): "E",
    (1, 1, 0, 1, 0, 0): "F",
    (1, 1, 0, 1, 1, 0): "G",
    (1, 1, 0, 0, 1, 0): "H",
    (0, 1, 0, 1, 0, 0): "I",
    (0, 1, 0, 1, 1, 0): "J",
    (1, 0, 1, 0, 0, 0): "K",
    (1, 1, 1, 0, 0, 0): "L",
    (1, 0, 1, 1, 0, 0): "M",
    (1, 0, 1, 1, 1, 0): "N",
    (1, 0, 1, 0, 1, 0): "O",
    (1, 1, 1, 1, 0, 0): "P",
    (1, 1, 1, 1, 1, 0): "Q",
    (1, 1, 1, 0, 1, 0): "R",
    (0, 1, 1, 1, 0, 0): "S",
    (0, 1, 1, 1, 1, 0): "T",
    (1, 0, 1, 0, 0, 1): "U",
    (1, 1, 1, 0, 0, 1): "V",
    (0, 1, 0, 1, 1, 1): "W",
    (1, 0, 1, 1, 0, 1): "X",
    (1, 0, 1, 1, 1, 1): "Y",
    (1, 0, 1, 0, 1, 1): "Z",
}

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_state.json")

LESSONS: list[dict[str, str]] = [
    {"id": "intro", "name": "Intro Chapter: Getting to know your tool"},
    {"id": "alpha_aj", "name": "Chapter 1, Lesson 1: Letters A to J"},
    {"id": "alpha_kt", "name": "Chapter 1, Lesson 2: Letters K to T"},
    {"id": "alpha_uz", "name": "Chapter 1, Lesson 3: Letters U to Z"},
    {"id": "practice_alpha", "name": "Chapter 1, Lesson 4: Practicing all the letters"},
    {"id": "numbers", "name": "Chapter 1, Lesson 5: Numbers 0 to 4"},
    {"id": "numbers", "name": "Chapter 1, Lesson 5: Numbers 5 to 9"},
    {"id": "practice_numbers", "name": "Chapter 1, Lesson 6: Practicing all the numbers"},
]


def _lesson_title(lesson_id: str) -> str:
    for row in LESSONS:
        if row["id"] == lesson_id:
            return row["name"]
    return lesson_id


DOT_GPIO: dict[int, int] = {1: 17, 2: 27, 3: 22, 4: 5, 5: 6, 6: 13}
ENTER_GPIO = 19

_GPIO_LOCK = threading.Lock()
_STATE_LOCK = threading.Lock()
_GPIO_READY = False


def _default_user_state() -> dict[str, Any]:
    return {
        "first_time": True,
        "current_lesson": "intro",
        "completed_lessons": [],
        "letters_completed": [],
        "numbers_completed": [],
        "total_attempts": 0,
        "total_correct": 0,
        "practice_results": [],
        "api_target": "A",
        "api_quiz_score": 0,
        "api_quiz_attempts": 0,
        "api_last_result": None,
        "api_last_decoded": None,
        "api_last_pattern": None,
    }


def _ensure_api_keys(s: dict[str, Any]) -> None:
    for k, v in _default_user_state().items():
        if k.startswith("api_") and k not in s:
            s[k] = v


def load_user_state() -> dict[str, Any]:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as f:
            s = json.load(f)
        _ensure_api_keys(s)
        return s
    return _default_user_state()


def save_user_state(s: dict[str, Any]) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)


def _setup_gpio() -> None:
    global _GPIO_READY
    try:
        import RPi.GPIO as GPIO  # type: ignore[import-untyped]

        GPIO.setmode(GPIO.BCM)
        for pin in DOT_GPIO.values():
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(ENTER_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        _GPIO_READY = True
    except Exception as e:
        print(f"[GPIO] Not available ({e}); using no-hardware mode.")


def read_dot_pattern() -> tuple[int, int, int, int, int, int]:
    if not _GPIO_READY:
        return (0, 0, 0, 0, 0, 0)
    import RPi.GPIO as GPIO  # type: ignore[import-untyped]

    with _GPIO_LOCK:
        out: list[int] = []
        for d in range(1, 7):
            pin = DOT_GPIO[d]
            pressed = GPIO.input(pin) == GPIO.LOW
            out.append(1 if pressed else 0)
    return (out[0], out[1], out[2], out[3], out[4], out[5])


def _pick_target() -> str:
    return random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def _progress_payload(s: dict[str, Any]) -> dict[str, Any]:
    current_id = s.get("current_lesson", "intro")
    completed_ids = s.get("completed_lessons") or []
    return {
        "current_lesson_id": current_id,
        "current_lesson_name": _lesson_title(current_id),
        "completed_lesson_ids": list(completed_ids),
        "completed_lessons": [
            {"id": lid, "name": _lesson_title(lid)} for lid in completed_ids
        ],
        "letters_completed": list(s.get("letters_completed") or []),
        "numbers_completed": list(s.get("numbers_completed") or []),
    }


def _state_payload(s: dict[str, Any]) -> dict[str, Any]:
    return {
        "target": s.get("api_target", "A"),
        "score": s.get("api_quiz_score", 0),
        "attempts": s.get("api_quiz_attempts", 0),
        "last_result": s.get("api_last_result"),
        "last_decoded": s.get("api_last_decoded"),
        "last_pattern": s.get("api_last_pattern"),
        "total_attempts": s.get("total_attempts", 0),
        "total_correct": s.get("total_correct", 0),
        "gpio_ok": _GPIO_READY,
        "progress": _progress_payload(s),
    }


app = Flask(__name__)
CORS(app)


@app.get("/state")
def get_state():
    with _STATE_LOCK:
        s = load_user_state()
        return jsonify(_state_payload(s))


@app.post("/press")
def post_press():
    with _STATE_LOCK:
        s = load_user_state()
        pattern = read_dot_pattern()
        s["api_last_pattern"] = list(pattern)

        letter = BRAILLE_MAP.get(tuple(pattern))
        s["api_last_decoded"] = letter

        s["api_quiz_attempts"] = int(s.get("api_quiz_attempts", 0)) + 1
        s["total_attempts"] = int(s.get("total_attempts", 0)) + 1

        target = s.get("api_target", "A")
        if letter is None:
            s["api_last_result"] = "incorrect"
            correct = False
        else:
            correct = letter == target
            s["api_last_result"] = "correct" if correct else "incorrect"
            if correct:
                s["api_quiz_score"] = int(s.get("api_quiz_score", 0)) + 1
                s["total_correct"] = int(s.get("total_correct", 0)) + 1

        if "practice_results" not in s:
            s["practice_results"] = []
        s["practice_results"].append({"symbol": target, "correct": correct})

        save_user_state(s)
        return jsonify(_state_payload(s))


@app.post("/next")
def post_next():
    with _STATE_LOCK:
        s = load_user_state()
        s["api_target"] = _pick_target()
        s["api_last_result"] = None
        s["api_last_decoded"] = None
        s["api_last_pattern"] = None
        save_user_state(s)
        return jsonify(_state_payload(s))


@app.get("/")
def root():
    return jsonify(
        {
            "service": "senso-braille-api",
            "state_file": STATE_FILE,
            "endpoints": ["GET /state", "POST /press", "POST /next"],
        }
    )


def main():
    _setup_gpio()
    with _STATE_LOCK:
        if not os.path.exists(STATE_FILE):
            save_user_state(_default_user_state())
    port = int(os.environ.get("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, threaded=True)


if __name__ == "__main__":
    main()
