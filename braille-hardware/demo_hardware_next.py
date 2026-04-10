"""
Senso — hardware roadmap prototype (starts from demo.py, adds planned I/O).

Adds (incremental / TBD wiring):
  • Second arrow: scroll lessons backward as well as forward
  • Volume up / down (system amixer on Pi + pygame mixer fallback)
  • Power sense: exit main loop when switch goes off (or use for graceful shutdown)
  • Vibration motor: two pulses on wrong answer (with incorrect SFX + TTS)
  • Return to menu: hold SUBMIT (square) ~2.5s — no extra menu button

Assign real BCM pins in HARDWARE below. Run on Pi:
  cd braille-hardware && python3 demo_hardware_next.py

Optional: SENSO_MOCK_GPIO=1 to use noop GPIO (for import testing only; input won't work).
"""

from __future__ import annotations

import json
import os
import random
import subprocess
import threading
import time

import pygame
from gtts import gTTS

# ─── Hardware pins (BCM) — update when PCB is wired ─────────────
# Dots + submit + arrow next match existing demo / braille.py layout where possible.
HARDWARE = {
    "DOT1": 17,
    "DOT2": 27,
    "DOT3": 22,
    "DOT4": 5,
    "DOT5": 6,
    "DOT6": 26,
    "SUBMIT": 23,
    "ARROW_NEXT": 24,
    "ARROW_BACK": 25,  # second triangle — scroll to previous lesson
    "VOL_UP": 12,
    "VOL_DOWN": 13,
    "POWER_OK": 19,  # HIGH = device allowed to run (tie to your power switch logic)
    "VIBRATE": 20,  # vibration pad(s) via transistor — DigitalOutput
}

LONG_PRESS_SUBMIT_SEC = 2.5
INPUT_POLL_SEC = 0.02
STATE_FILE = "demo_hardware_next_state.json"
TTS_SPEED = 1.35

SOUND_WELCOME = "loading_sfx1_cut1.wav"
SOUND_LESSON = "loading_sfx3_cut1.wav"
SOUND_CORRECT = "correct_simple_sfx1.wav"
SOUND_INCORRECT = "incorrect_simple_sfx5.wav"

MOCK_GPIO = os.environ.get("SENSO_MOCK_GPIO", "").strip() in ("1", "true", "yes")

# gpiozero loaded after mock check
if MOCK_GPIO:

    class _Mock:
        def __init__(self, *a, **k):
            pass

        def is_pressed(self) -> bool:
            return False

        def wait_for_press(self) -> None:
            time.sleep(999999)

        def wait_for_release(self) -> None:
            pass

    Button = _Mock  # type: ignore[misc, assignment]

    class DigitalOutputDevice(_Mock):  # type: ignore[misc, no-redef]
        def on(self) -> None:
            pass

        def off(self) -> None:
            pass

else:
    from gpiozero import Button, DigitalOutputDevice  # type: ignore[assignment]


def _btn(pin: int, **kw):
    if MOCK_GPIO:
        return Button()
    return Button(pin, pull_up=True, **kw)


def _out(pin: int):
    if MOCK_GPIO:
        return DigitalOutputDevice()
    return DigitalOutputDevice(pin, active_high=True, initial_value=False)


# ─── GPIO instances ─────────────────────────────────────────────
DOT1 = _btn(HARDWARE["DOT1"])
DOT2 = _btn(HARDWARE["DOT2"])
DOT3 = _btn(HARDWARE["DOT3"])
DOT4 = _btn(HARDWARE["DOT4"])
DOT5 = _btn(HARDWARE["DOT5"])
DOT6 = _btn(HARDWARE["DOT6"])
SUBMIT = _btn(HARDWARE["SUBMIT"])
ARROW_NEXT = _btn(HARDWARE["ARROW_NEXT"])
ARROW_BACK = _btn(HARDWARE["ARROW_BACK"])
VOL_UP = _btn(HARDWARE["VOL_UP"])
VOL_DOWN = _btn(HARDWARE["VOL_DOWN"])
POWER_OK = _btn(HARDWARE["POWER_OK"])
VIBRATE = _out(HARDWARE["VIBRATE"])

DOT_BUTTONS = [DOT1, DOT2, DOT3, DOT4, DOT5, DOT6]

# Volume: percent for amixer; pygame uses same / 100.0
_volume_percent = 80


def _amixer_set_percent(pct: int) -> None:
    pct = max(0, min(100, pct))
    try:
        subprocess.run(
            ["amixer", "-q", "sset", "PCM", f"{pct}%"],
            check=False,
            timeout=2,
            capture_output=True,
        )
    except (FileNotFoundError, subprocess.SubprocessError):
        pass


def volume_apply() -> None:
    """Apply stored volume to pygame and best-effort system mixer (Pi)."""
    pygame.mixer.init()
    pygame.mixer.music.set_volume(_volume_percent / 100.0)
    _amixer_set_percent(_volume_percent)


def poll_volume_buttons() -> None:
    """Non-blocking: call from tight loops if you want live volume adjust everywhere."""
    global _volume_percent
    if VOL_UP.is_pressed:
        VOL_UP.wait_for_release()
        _volume_percent = min(100, _volume_percent + 10)
        volume_apply()
        print(f"[VOL] {_volume_percent}%")
    if VOL_DOWN.is_pressed:
        VOL_DOWN.wait_for_release()
        _volume_percent = max(0, _volume_percent - 10)
        volume_apply()
        print(f"[VOL] {_volume_percent}%")


def power_device_running() -> bool:
    """
    Return False when the device should stop (power switch off).
    Wire POWER_OK so the pin reads as *pressed* (active LOW) while the Pi should run.
    Change logic here if your switch is active-high instead.
    """
    if MOCK_GPIO:
        return True
    return bool(POWER_OK.is_pressed)


def vibrate_wrong_twice() -> None:
    """Two short pulses — call when answer is wrong (with incorrect audio)."""
    def _run() -> None:
        for _ in range(2):
            VIBRATE.on()
            time.sleep(0.12)
            VIBRATE.off()
            time.sleep(0.08)

    threading.Thread(target=_run, daemon=True).start()


def speak(text: str) -> None:
    print(f"[SPEAK] {text}")
    tts = gTTS(text=text, lang="en", tld="co.uk")
    tts.save("_tts_out.mp3")
    os.system(
        f'ffmpeg -y -i _tts_out.mp3 -filter:a "atempo={TTS_SPEED}" _tts_fast.mp3 -loglevel quiet'
    )
    play_mp3("_tts_fast.mp3")


def play_mp3(filename: str) -> None:
    volume_apply()
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        time.sleep(0.02)
        poll_volume_buttons()


def play_wav(filename: str) -> None:
    try:
        volume_apply()
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.01)
            poll_volume_buttons()
    except Exception as e:
        print(f"[AUDIO ERROR] {filename}: {e}")


LESSONS = [
    {"id": "intro", "name": "Intro — device overview"},
    {"id": "demo_abc", "name": "Letters A, B, and C"},
    {"id": "demo_practice", "name": "Quick practice — A, B, C"},
]


def lesson_name(idx: int) -> str:
    return LESSONS[idx]["name"] if 0 <= idx < len(LESSONS) else ""


def lesson_index_by_id(lesson_id: str) -> int:
    for i, l in enumerate(LESSONS):
        if l["id"] == lesson_id:
            return i
    return 0


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {
        "first_time": True,
        "current_lesson": "intro",
        "completed_lessons": [],
        "letters_completed": [],
        "numbers_completed": [],
        "total_attempts": 0,
        "total_correct": 0,
        "practice_results": [],
    }


def save_state(state: dict) -> None:
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def log_practice_result(symbol: str, correct: bool, state: dict) -> None:
    if "practice_results" not in state:
        state["practice_results"] = []
    state["practice_results"].append({"symbol": symbol, "correct": correct})


BRAILLE_MAP = {
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

DOT_INSTRUCTIONS = {
    "A": "dot 1",
    "B": "dots 1 and 2",
    "C": "dots 1 and 4",
    "D": "dots 1, 4, and 5",
    "E": "dots 1 and 5",
    "F": "dots 1, 2, and 4",
    "G": "dots 1, 2, 4, and 5",
    "H": "dots 1, 2, and 5",
    "I": "dots 2 and 4",
    "J": "dots 2, 4, and 5",
    "K": "dots 1 and 3",
    "L": "dots 1, 2, and 3",
    "M": "dots 1, 3, and 4",
    "N": "dots 1, 3, 4, and 5",
    "O": "dots 1, 3, and 5",
    "P": "dots 1, 2, 3, and 4",
    "Q": "dots 1, 2, 3, 4, and 5",
    "R": "dots 1, 2, 3, and 5",
    "S": "dots 2, 3, and 4",
    "T": "dots 2, 3, 4, and 5",
    "U": "dots 1, 3, and 6",
    "V": "dots 1, 2, 3, and 6",
    "W": "dots 2, 4, 5, and 6",
    "X": "dots 1, 3, 4, and 6",
    "Y": "dots 1, 3, 4, 5, and 6",
    "Z": "dots 1, 3, 5, and 6",
}

NUMBER_SIGN = (0, 0, 1, 1, 1, 1)
NUMBER_SIGN_INSTRUCTION = "dots 3, 4, 5, and 6"

NUMBER_MAP = {
    (1, 0, 0, 0, 0, 0): "1",
    (1, 1, 0, 0, 0, 0): "2",
    (1, 0, 0, 1, 0, 0): "3",
    (1, 0, 0, 1, 1, 0): "4",
    (1, 0, 0, 0, 1, 0): "5",
    (1, 1, 0, 1, 0, 0): "6",
    (1, 1, 0, 1, 1, 0): "7",
    (1, 1, 0, 0, 1, 0): "8",
    (0, 1, 0, 1, 0, 0): "9",
    (0, 1, 0, 1, 1, 0): "0",
}

NUMBER_INSTRUCTIONS = {
    "1": "dot 1",
    "2": "dots 1 and 2",
    "3": "dots 1 and 4",
    "4": "dots 1, 4, and 5",
    "5": "dots 1 and 5",
    "6": "dots 1, 2, and 4",
    "7": "dots 1, 2, 4, and 5",
    "8": "dots 1, 2, and 5",
    "9": "dots 2 and 4",
    "0": "dots 2, 4, and 5",
}

BRAILLE_DOT_ORDER = "142536"


def read_dot_input():
    """
    Accumulate dots until SUBMIT is pressed and released.
    Short release = submit pattern. Hold SUBMIT >= LONG_PRESS_SUBMIT_SEC = return to menu.
    """
    print("  [dots; short square = submit | hold square ~2.5s = menu]")
    prev_dot = [False] * 6
    sequence: list[str] = []

    while True:
        poll_volume_buttons()

        for i, btn in enumerate(DOT_BUTTONS):
            pressed = btn.is_pressed
            if pressed and not prev_dot[i]:
                sequence.append(str(i + 1))
            prev_dot[i] = pressed

        if SUBMIT.is_pressed:
            t_down = time.time()
            while SUBMIT.is_pressed:
                poll_volume_buttons()
                if time.time() - t_down >= LONG_PRESS_SUBMIT_SEC:
                    SUBMIT.wait_for_release()
                    return "menu", None
                time.sleep(0.02)
            break

        time.sleep(INPUT_POLL_SEC)

    seq_str = "".join(sequence)
    present = set(seq_str)
    dot_tuple = tuple(1 if str(i + 1) in present else 0 for i in range(6))
    print(f"  [order: {seq_str!r} → {dot_tuple}]")
    return seq_str, dot_tuple


def wait_for_submit():
    print("  [square to continue | hold square ~2.5s = menu]")
    while True:
        poll_volume_buttons()
        if SUBMIT.is_pressed:
            t0 = time.time()
            while SUBMIT.is_pressed:
                poll_volume_buttons()
                if time.time() - t0 >= LONG_PRESS_SUBMIT_SEC:
                    SUBMIT.wait_for_release()
                    return "menu"
                time.sleep(0.02)
            return "submit"
        time.sleep(INPUT_POLL_SEC)


def validate_dot_order(raw: str):
    digits = [ch for ch in raw if ch in "123456"]
    if not digits:
        return False, "No dots. Press dots in order, then square."
    if len(digits) != len(set(digits)):
        play_wav(SOUND_INCORRECT)
        vibrate_wrong_twice()
        return False, "Same dot twice. Try again."
    present = set(digits)
    correct_sequence = [d for d in BRAILLE_DOT_ORDER if d in present]
    if digits != correct_sequence:
        play_wav(SOUND_INCORRECT)
        vibrate_wrong_twice()
        want = ", ".join(correct_sequence)
        got = ", ".join(digits)
        return False, f"Wrong order. Use {want}. You typed {got}."
    return True, ""


def get_dot_input(prompt: str):
    print(prompt)
    while True:
        raw, dot_tuple = read_dot_input()
        if raw == "menu":
            return "menu"
        if all(v == 0 for v in dot_tuple):
            play_wav(SOUND_INCORRECT)
            vibrate_wrong_twice()
            speak("No input. Dots in reading order, then square.")
            continue
        valid, err = validate_dot_order(raw)
        if not valid:
            speak(err)
            continue
        return raw


def get_menu_input():
    print("  [triangle next | triangle back | square = start]")
    while True:
        poll_volume_buttons()
        while not ARROW_NEXT.is_pressed and not ARROW_BACK.is_pressed and not SUBMIT.is_pressed:
            poll_volume_buttons()
            time.sleep(0.02)
        if ARROW_NEXT.is_pressed:
            ARROW_NEXT.wait_for_release()
            return "n"
        if ARROW_BACK.is_pressed:
            ARROW_BACK.wait_for_release()
            return "b"
        if SUBMIT.is_pressed:
            SUBMIT.wait_for_release()
            return "e"


def show_menu(state, interrupted=False):
    if interrupted:
        speak("Menu. Next and back triangles, square to start.")
    else:
        speak("Choose a lesson. Triangles scroll, square selects.")

    idx = 0
    speak(lesson_name(idx))

    while True:
        raw = get_menu_input()
        if raw == "n":
            idx = (idx + 1) % len(LESSONS)
            speak(lesson_name(idx))
        elif raw == "b":
            idx = (idx - 1) % len(LESSONS)
            speak(lesson_name(idx))
        elif raw == "e":
            play_wav(SOUND_LESSON)
            speak(lesson_name(idx))
            speak("Starting.")
            return idx


def lesson_end_prompt(current_idx: int, state: dict):
    next_idx = current_idx + 1
    if next_idx >= len(LESSONS):
        speak("Demo finished. Thanks!")
        return "menu"
    speak(f"Next: {lesson_name(next_idx)}. Square to continue.")
    while True:
        r = wait_for_submit()
        if r == "menu":
            return "menu"
        return next_idx


def teach_symbol(symbol, symbol_map, instruction_map, state, is_number=False):
    instruction = instruction_map[symbol]

    if is_number:
        speak(f"Number {symbol}. Number sign first: {NUMBER_SIGN_INSTRUCTION}.")
    else:
        speak(f"Letter {symbol}: {instruction}.")

    while True:
        if is_number:
            raw = get_dot_input("  [# sign]")
            if raw == "menu":
                return "menu"

            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))

            if dot_tuple != NUMBER_SIGN:
                play_wav(SOUND_INCORRECT)
                vibrate_wrong_twice()
                state["total_attempts"] += 1
                speak("Not the number sign. Try again.")
                continue

            play_wav(SOUND_CORRECT)
            speak(f"Now the digit {symbol}.")

            raw = get_dot_input(f"  [{symbol}]")
            if raw == "menu":
                return "menu"

            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
            result = symbol_map.get(dot_tuple)

        else:
            raw = get_dot_input(f"  [{symbol}]")
            if raw == "menu":
                return "menu"

            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
            result = symbol_map.get(dot_tuple)

        state["total_attempts"] += 1

        if result == symbol:
            play_wav(SOUND_CORRECT)
            speak("Correct.")
            state["total_correct"] += 1
            save_state(state)
            return "correct"
        else:
            play_wav(SOUND_INCORRECT)
            vibrate_wrong_twice()
            speak(f"Not quite. {symbol} is {instruction}.")


def quiz_symbol(symbol, symbol_map, instruction_map, state, is_number=False):
    instruction = instruction_map[symbol]

    if is_number:
        speak(f"Number {symbol}.")
    else:
        speak(f"Letter {symbol}.")

    if is_number:
        raw = get_dot_input("  [# sign]")
        if raw == "menu":
            return "menu"

        sign_correct = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6)) == NUMBER_SIGN
        if sign_correct:
            play_wav(SOUND_CORRECT)
            speak("Now the digit.")
            raw = get_dot_input(f"  [{symbol}]")
            if raw == "menu":
                return "menu"
            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
            result = symbol_map.get(dot_tuple)
            correct = result == symbol
        else:
            correct = False
    else:
        raw = get_dot_input(f"  [{symbol}]")
        if raw == "menu":
            return "menu"
        dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
        result = symbol_map.get(dot_tuple)
        correct = result == symbol

    state["total_attempts"] += 1

    if correct:
        play_wav(SOUND_CORRECT)
        speak("Yes.")
        state["total_correct"] += 1
    else:
        play_wav(SOUND_INCORRECT)
        vibrate_wrong_twice()
        speak(f"It was {symbol}. {instruction}.")

    log_practice_result(symbol, correct, state)
    save_state(state)
    return "done"


def run_letter_lesson(lesson_id: str, letters: list, state: dict):
    state["current_lesson"] = lesson_id
    save_state(state)
    i = 0
    while i < len(letters):
        result = teach_symbol(letters[i], BRAILLE_MAP, DOT_INSTRUCTIONS, state)
        if result == "menu":
            return "menu"
        if result == "correct":
            if letters[i] not in state["letters_completed"]:
                state["letters_completed"].append(letters[i])
            i += 1
    if lesson_id not in state["completed_lessons"]:
        state["completed_lessons"].append(lesson_id)
    save_state(state)
    return "done"


def run_practice_demo(state: dict):
    state["current_lesson"] = "demo_practice"
    save_state(state)
    done = [x for x in state["letters_completed"] if x in "ABC"]
    if not done:
        speak("Do the A–C lesson first.")
        return "menu"
    speak("Practice: mixed A, B, C.")
    pool = done.copy()
    random.shuffle(pool)
    for letter in pool:
        result = quiz_symbol(letter, BRAILLE_MAP, DOT_INSTRUCTIONS, state)
        if result == "menu":
            return "menu"
    results = state.get("practice_results", [])
    session = results[-len(pool) :]
    correct_count = sum(1 for r in session if r["correct"])
    speak(f"{correct_count} of {len(pool)} correct.")
    if "demo_practice" not in state["completed_lessons"]:
        state["completed_lessons"].append("demo_practice")
    save_state(state)
    return "done"


def run_lesson(idx: int, state: dict):
    lesson_id = LESSONS[idx]["id"]
    if lesson_id == "intro":
        state["current_lesson"] = "intro"
        if "intro" not in state["completed_lessons"]:
            state["completed_lessons"].append("intro")
        save_state(state)
        speak(
            "Six dot keys. Triangles scroll the menu; square starts a lesson. "
            "Hold square about two seconds to return to the menu from a lesson. "
            "Dots in reading order one four two five three six, then short press square to submit."
        )
        return "done"
    if lesson_id == "demo_abc":
        return run_letter_lesson("demo_abc", list("ABC"), state)
    if lesson_id == "demo_practice":
        return run_practice_demo(state)
    return "done"


def main():
    global _volume_percent
    volume_apply()

    state = load_state()
    play_wav(SOUND_WELCOME)

    if state["first_time"]:
        speak("Senso hardware demo. I'm Sen.")
        state["first_time"] = False
        save_state(state)
    else:
        speak("Resuming.")

    interrupted = False

    while power_device_running():
        current_idx = show_menu(state, interrupted=interrupted)
        interrupted = False
        result = run_lesson(current_idx, state)

        if result == "menu":
            interrupted = True
            continue

        if result == "done":
            outcome = lesson_end_prompt(current_idx, state)
            if outcome == "menu":
                interrupted = True
                continue
            next_idx = outcome
            result2 = run_lesson(next_idx, state)
            if result2 == "menu":
                interrupted = True
                continue
            if result2 == "done":
                outcome2 = lesson_end_prompt(next_idx, state)
                if outcome2 == "menu":
                    interrupted = True
                else:
                    current_idx = outcome2

    speak("Power off. Goodbye.")
    print("[POWER] POWER_OK went low — exiting.")


if __name__ == "__main__":
    main()
