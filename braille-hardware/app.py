"""
Flask API for Senso: GPIO Braille input → React app over Wi-Fi.

Run on the Pi:  python app.py
Default port is 5001 (5000 is often taken by macOS AirPlay). Override: PORT=5000 python app.py
Dependencies:  pip install flask flask-cors RPi.GPIO

If RPi.GPIO is missing (e.g. dev laptop), GPIO reads return all unpressed.
"""

from __future__ import annotations

import os
import random
import threading
from typing import Any

from flask import Flask, jsonify
from flask_cors import CORS

# Keep in sync with braille.py BRAILLE_MAP (tuple = dots 1..6 raised)
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

# Dot index 1–6 → BCM pin (matches wiring diagram)
DOT_GPIO: dict[int, int] = {1: 17, 2: 27, 3: 22, 4: 5, 5: 6, 6: 13}
ENTER_GPIO = 19

_GPIO_LOCK = threading.Lock()
_GPIO_READY = False


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
    """Return 6-tuple: 1 = dot raised (button pressed / pin LOW with pull-up)."""
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


# --- Game state (quiz: match Braille pattern to target letter) ---

_state: dict[str, Any] = {
    "target": "A",
    "score": 0,
    "attempts": 0,
    "last_result": None,  # "correct" | "incorrect" | None
    "last_decoded": None,  # letter from last pattern, or None if invalid
    "last_pattern": None,  # list of six 0/1 for the client
}


def _pick_target() -> str:
    return random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")


def _state_payload() -> dict[str, Any]:
    return {
        "target": _state["target"],
        "score": _state["score"],
        "attempts": _state["attempts"],
        "last_result": _state["last_result"],
        "last_decoded": _state["last_decoded"],
        "last_pattern": _state["last_pattern"],
        "gpio_ok": _GPIO_READY,
    }


app = Flask(__name__)
CORS(app)


@app.get("/state")
def get_state():
    return jsonify(_state_payload())


@app.post("/press")
def post_press():
    """
    Sample GPIO: read which dots are pressed, decode to a letter,
    compare to target, update score/attempts.
    """
    pattern = read_dot_pattern()
    _state["last_pattern"] = list(pattern)

    letter = BRAILLE_MAP.get(pattern)
    _state["last_decoded"] = letter

    _state["attempts"] = int(_state["attempts"]) + 1

    if letter is None:
        _state["last_result"] = "incorrect"
    else:
        ok = letter == _state["target"]
        _state["last_result"] = "correct" if ok else "incorrect"
        if ok:
            _state["score"] = int(_state["score"]) + 1

    return jsonify(_state_payload())


@app.post("/next")
def post_next():
    """Advance to a new random target letter."""
    _state["target"] = _pick_target()
    _state["last_result"] = None
    _state["last_decoded"] = None
    _state["last_pattern"] = None
    return jsonify(_state_payload())


@app.get("/")
def root():
    return jsonify(
        {
            "service": "senso-braille-api",
            "endpoints": ["GET /state", "POST /press", "POST /next"],
        }
    )


def main():
    _setup_gpio()
    port = int(os.environ.get("PORT", "5001"))
    # 0.0.0.0 so phones / laptops on the same Wi-Fi can reach the Pi
    app.run(host="0.0.0.0", port=port, threaded=True)


if __name__ == "__main__":
    main()
