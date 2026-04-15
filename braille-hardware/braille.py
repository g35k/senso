from gpiozero import Button
import os
import json
import random
import pygame
import time
from elevenlabs.client import ElevenLabs
from elevenlabs import stream

VOICES = {
    "jessica": "cgSgspJ2msm6clMCkdW9",
    "george":   "JBFqnCBsd6RMkjVDRZzb",
    "sen": "qpABpf73fEJ7NvAPydSY"
}

el_client = ElevenLabs(api_key=os.environ.get("ELEVENLABS_API_KEY"))
CURRENT_VOICE = "sen"
#─── GPIO Button Setup ────────────────────────────────────────
DOT1   = Button(17, pull_up=True)
DOT2   = Button(27, pull_up=True)
DOT3   = Button(22, pull_up=True)
DOT4   = Button(5,  pull_up=True)
DOT5   = Button(6,  pull_up=True)
DOT6   = Button(26, pull_up=True)
SUBMIT = Button(23, pull_up=True)
ARROW  = Button(24, pull_up=True)

DOT_BUTTONS = [DOT1, DOT2, DOT3, DOT4, DOT5, DOT6]

# Playback volume: 0.0 (silent) to 1.0 (max). Lower this if the speaker is too loud.
AUDIO_VOLUME = 1.0

# ─── TTS  ─
def speak(text):
    print(f"[SPEAK] {text}")
    audio = el_client.text_to_speech.convert(
        voice_id=VOICES[CURRENT_VOICE],
        text=text,
        model_id="eleven_turbo_v2",
    )
    # Save to file then play instead of streaming
    with open("_tts_out.mp3", "wb") as f:
        for chunk in audio:
            f.write(chunk)
    play_mp3("_tts_out.mp3")

def play_mp3(filename):
    pygame.mixer.init()
    pygame.mixer.music.set_volume(AUDIO_VOLUME)
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        time.sleep(0.02)

def play_wav(filename):
    try:
        pygame.mixer.init()
        pygame.mixer.music.set_volume(AUDIO_VOLUME)
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.01)
    except Exception as e:
        print(f"[AUDIO ERROR] {filename}: {e}")

SOUND_WELCOME   = "loading_sfx1_cut1.wav"
SOUND_LESSON    = "loading_sfx3_cut1.wav"
SOUND_CORRECT   = "correct_simple_sfx1.wav"
SOUND_INCORRECT = "incorrect_simple_sfx5.wav"


def play_incorrect_feedback():
    """Wrong-answer sound only (vibration disabled)."""
    play_wav(SOUND_INCORRECT)


# Menu — spoken when returning to the menu
SPEAK_MENU_SHORT = (
    "If you want to keep looking through the chapters use the triangle button. When you find a chapter you like use the square to start the chapter."
)

# ─── Lesson List ──────────────────────────────────────────────
LESSONS = [
    {"id": "intro",            "name": "Intro Chapter: Getting to know your tool"},
    {"id": "alpha_ac",         "name": "Chapter 1, Lesson 1: Letters A, B, and C"},
    {"id": "alpha_df",         "name": "Chapter 1, Lesson 2: Letters D, E, and F"},
    {"id": "alpha_gi",         "name": "Chapter 1, Lesson 3: Letters G, H, and I"},
    {"id": "alpha_aj",         "name": "Chapter 1, Lesson 4: Letters A to J"},
    {"id": "alpha_kt",         "name": "Chapter 1, Lesson 5: Letters K to T"},
    {"id": "alpha_uz",         "name": "Chapter 1, Lesson 6: Letters U to Z"},
    {"id": "practice_alpha",   "name": "Chapter 1, Lesson 7: Practicing all the letters"},
    {"id": "numbers_04",       "name": "Chapter 1, Lesson 8: Numbers 1 to 5"},
    {"id": "numbers_59",       "name": "Chapter 1, Lesson 9: Numbers 6 to 0"},
    {"id": "practice_numbers", "name": "Chapter 1, Lesson 10: Practicing all the numbers"},
]

def lesson_name(idx):
    return LESSONS[idx]["name"] if 0 <= idx < len(LESSONS) else ""

def lesson_index_by_id(lesson_id):
    for i, l in enumerate(LESSONS):
        if l["id"] == lesson_id:
            return i
    return 0

# ─── State ────────────────────────────────────────────────────
STATE_FILE = "user_state.json"

def load_state():
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
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

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)
    attempts = state['total_attempts']
    correct  = state['total_correct']
    acc = 0 if attempts == 0 else round(100 * correct / attempts)
    done_names = [lesson_name(lesson_index_by_id(lid)) for lid in state['completed_lessons']]
    print(f"\n[SAVED]")
    print(f"  Current lesson : {lesson_name(lesson_index_by_id(state['current_lesson']))}")
    print(f"  Completed      : {done_names}")
    print(f"  Accuracy       : {acc}% ({correct}/{attempts})\n")

def log_practice_result(symbol, correct, state):
    result = {"symbol": symbol, "correct": correct}
    if "practice_results" not in state:
        state["practice_results"] = []
    state["practice_results"].append(result)
    status = "CORRECT" if correct else "INCORRECT"
    print(f"[PRACTICE] {symbol} → {status}")

# ─── Braille Data ─────────────────────────────────────────────
BRAILLE_MAP = {
    (1,0,0,0,0,0):'A', (1,1,0,0,0,0):'B', (1,0,0,1,0,0):'C',
    (1,0,0,1,1,0):'D', (1,0,0,0,1,0):'E', (1,1,0,1,0,0):'F',
    (1,1,0,1,1,0):'G', (1,1,0,0,1,0):'H', (0,1,0,1,0,0):'I',
    (0,1,0,1,1,0):'J', (1,0,1,0,0,0):'K', (1,1,1,0,0,0):'L',
    (1,0,1,1,0,0):'M', (1,0,1,1,1,0):'N', (1,0,1,0,1,0):'O',
    (1,1,1,1,0,0):'P', (1,1,1,1,1,0):'Q', (1,1,1,0,1,0):'R',
    (0,1,1,1,0,0):'S', (0,1,1,1,1,0):'T', (1,0,1,0,0,1):'U',
    (1,1,1,0,0,1):'V', (0,1,0,1,1,1):'W', (1,0,1,1,0,1):'X',
    (1,0,1,1,1,1):'Y', (1,0,1,0,1,1):'Z',
}

DOT_INSTRUCTIONS = {
    'A':'dot 1',               'B':'dots 1 and 2',            'C':'dots 1 and 4',
    'D':'dots 1, 4, and 5',    'E':'dots 1 and 5',            'F':'dots 1, 2, and 4',
    'G':'dots 1, 2, 4, and 5', 'H':'dots 1, 2, and 5',        'I':'dots 2 and 4',
    'J':'dots 2, 4, and 5',    'K':'dots 1 and 3',            'L':'dots 1, 2, and 3',
    'M':'dots 1, 3, and 4',    'N':'dots 1, 3, 4, and 5',     'O':'dots 1, 3, and 5',
    'P':'dots 1, 2, 3, and 4', 'Q':'dots 1, 2, 3, 4, and 5',  'R':'dots 1, 2, 3, and 5',
    'S':'dots 2, 3, and 4',    'T':'dots 2, 3, 4, and 5',     'U':'dots 1, 3, and 6',
    'V':'dots 1, 2, 3, and 6', 'W':'dots 2, 4, 5, and 6',     'X':'dots 1, 3, 4, and 6',
    'Y':'dots 1, 3, 4, 5, and 6', 'Z':'dots 1, 3, 5, and 6',
}

NUMBER_SIGN             = (0,0,1,1,1,1)
NUMBER_SIGN_INSTRUCTION = "dots 3, 4, 5, and 6"

NUMBER_MAP = {
    (1,0,0,0,0,0):'1', (1,1,0,0,0,0):'2', (1,0,0,1,0,0):'3',
    (1,0,0,1,1,0):'4', (1,0,0,0,1,0):'5', (1,1,0,1,0,0):'6',
    (1,1,0,1,1,0):'7', (1,1,0,0,1,0):'8', (0,1,0,1,0,0):'9',
    (0,1,0,1,1,0):'0',
}

NUMBER_INSTRUCTIONS = {
    '1':'dot 1',               '2':'dots 1 and 2',        '3':'dots 1 and 4',
    '4':'dots 1, 4, and 5',    '5':'dots 1 and 5',        '6':'dots 1, 2, and 4',
    '7':'dots 1, 2, 4, and 5', '8':'dots 1, 2, and 5',    '9':'dots 2 and 4',
    '0':'dots 2, 4, and 5',
}

# ─── GPIO Input Helpers ───────────────────────────────────────
# Braille cell reading order for presses: 1, 4, 2, 5, 3, 6 (must match this order in the sequence).
BRAILLE_DOT_ORDER = "142536"


def _dot_tuple_for_symbol(symbol, symbol_map):
    for tup, ch in symbol_map.items():
        if ch == symbol:
            return tup
    return None


def _order_phrase_from_tuple(dot_tuple):
    present = {str(i + 1) for i, v in enumerate(dot_tuple) if v}
    return ", ".join(d for d in BRAILLE_DOT_ORDER if d in present)


def read_dot_input():
    """Record each dot on first press (rising edge), in order. Square submits."""
    print("  [dots in reading order, then square]")
    prev_dot = [False] * 6
    sequence: list[str] = []

    while not SUBMIT.is_pressed:
        for i, btn in enumerate(DOT_BUTTONS):
            pressed = btn.is_pressed
            if pressed and not prev_dot[i]:
                sequence.append(str(i + 1))
            prev_dot[i] = pressed
        time.sleep(0.01)

    SUBMIT.wait_for_release()

    seq_str = "".join(sequence)
    present = set(seq_str)
    dot_tuple = tuple(1 if str(i + 1) in present else 0 for i in range(6))
    print(f"  [order: {seq_str!r} → {dot_tuple}]")
    return seq_str, dot_tuple


def validate_dot_order(raw: str, expected_dot_tuple=None, order_context: str | None = None):
    """If expected_dot_tuple and order_context are set, errors name the lesson (e.g. letter B)."""
    digits = [ch for ch in raw if ch in "123456"]
    ctx = order_context or "pattern"
    if not digits:
        return False, "No dots yet. Press your dots in order, then the square button."
    if len(digits) != len(set(digits)):
        play_incorrect_feedback()
        return False, "Oops! It looks like you used the same dot twice. Please try again."
    present_set = set(digits)
    correct_sequence = [d for d in BRAILLE_DOT_ORDER if d in present_set]
    if expected_dot_tuple is not None:
        exp_set = {str(i + 1) for i, v in enumerate(expected_dot_tuple) if v}
        want = _order_phrase_from_tuple(expected_dot_tuple)
        if present_set != exp_set:
            play_incorrect_feedback()
            return False, f"That was not quite right. For this {ctx}, press in this order: {want}. Try again!"
        if digits != correct_sequence:
            play_incorrect_feedback()
            return False, f"That order was not quite right. For this {ctx}, press in this order: {want}. Try again!"
        return True, ""
    if digits != correct_sequence:
        play_incorrect_feedback()
        want = ", ".join(correct_sequence)
        return False, f"That order was not quite right. For this pattern, press in this order: {want}. Try again!"
    return True, ""

def wait_for_submit():
    """Wait for square press. Returns 'submit'."""
    print("  [press square to continue]")
    SUBMIT.wait_for_press()
    SUBMIT.wait_for_release()
    return 'submit'

def get_dot_input(
    prompt,
    valid_commands=("ee",),
    reminder_when_empty=None,
    expected_dot_tuple=None,
    order_context_for_message=None,
):
    """Wait for dot input in correct reading order. Returns dot string like '142' for the pattern."""
    print(prompt)
    while True:
        raw, dot_tuple = read_dot_input()
        if all(v == 0 for v in dot_tuple):
            play_incorrect_feedback()
            if reminder_when_empty:
                speak(reminder_when_empty)
            else:
                speak(
                    "I did not get any dots. Press each dot in order, then the square button when you want to submit."
                )
            continue
        ok, err = validate_dot_order(
            raw,
            expected_dot_tuple=expected_dot_tuple,
            order_context=order_context_for_message,
        )
        if not ok:
            speak(err)
            continue
        return raw

def get_menu_input():
    """Arrow press = next. Square press = select. Returns 'n' or 'e'."""
    print("  [arrow=next  square=select]")
    while True:
        while not ARROW.is_pressed and not SUBMIT.is_pressed:
            time.sleep(0.02)
        if ARROW.is_pressed:
            ARROW.wait_for_release()
            return 'n'
        if SUBMIT.is_pressed:
            SUBMIT.wait_for_release()
            return 'e'


def _wait_for_any_dot_press():
    """Intro: first press on any dot button, then release."""
    print("  [intro: waiting for any dot]")
    while True:
        if any(b.is_pressed for b in DOT_BUTTONS):
            while any(b.is_pressed for b in DOT_BUTTONS):
                time.sleep(0.02)
            return
        time.sleep(0.02)


def _wait_for_square_press():
    print("  [intro: waiting for square]")
    while True:
        if SUBMIT.is_pressed:
            SUBMIT.wait_for_release()
            return
        time.sleep(0.02)


def _wait_for_triangle_press():
    print("  [intro: waiting for triangle]")
    while True:
        if ARROW.is_pressed:
            ARROW.wait_for_release()
            return
        time.sleep(0.02)


def run_intro_lesson(state):
    """Kid-friendly intro: try a dot, then square, then triangle — each with praise."""
    state["current_lesson"] = "intro"
    save_state(state)

    speak(
        "Before we learn letters, we will try each kind of button once. "
        "Press one button at a time when I ask."
    )
    time.sleep(0.4)

    speak("Step one. Can you press any dot button? Pick one of the little circle buttons and give it a press.")
    _wait_for_any_dot_press()
    play_wav(SOUND_CORRECT)
    time.sleep(0.2)
    speak("Good. That was a dot button.")

    speak("Step two. Now can you find the square button? Press it one time for me.")
    _wait_for_square_press()
    play_wav(SOUND_CORRECT)
    time.sleep(0.2)
    speak("That is the square button.")

    speak("Step three. Last one for this game. Can you find the triangle button? Press it once.")
    _wait_for_triangle_press()
    play_wav(SOUND_CORRECT)
    time.sleep(0.2)
    speak("That is the triangle button. You have tried a dot, the square, and the triangle.")

    speak(
        "Soon we will use the dot buttons for letters, and you will press the square button to submit your answer."
    )

    if "intro" not in state["completed_lessons"]:
        state["completed_lessons"].append("intro")
    save_state(state)
    return "done"


# ─── Menu ─────────────────────────────────────────────────────
def show_menu(state, interrupted=False):
    if interrupted:
        speak("We are back at the menu." + SPEAK_MENU_SHORT)
    else:
        speak("Let's pick a chapter you want to try." + SPEAK_MENU_SHORT)

    idx = 0
    speak("Right now you are on: " + lesson_name(idx))

    while True:
        raw = get_menu_input()

        if raw == 'n':
            idx = (idx + 1) % len(LESSONS)
            speak("Next chapter: " + lesson_name(idx))

        elif raw == 'e':
            play_wav(SOUND_LESSON)
            speak(lesson_name(idx))
            speak("Let's Begin!")
            return idx

# ─── After lesson: announce next + wait ───────────────────────
def lesson_end_prompt(current_idx, state):
    next_idx = current_idx + 1
    if next_idx >= len(LESSONS):
        speak("You finished every chapter.")
        return 'menu'
    speak(
        f"Your next chapter is: {lesson_name(next_idx)}. "
        "When you feel ready for the next one, press the square button."
    )
    while True:
        result = wait_for_submit()
        if result == 'submit':
            return next_idx

# ─── Teach one symbol (learn mode — loops until correct) ──────
def teach_symbol(symbol, symbol_map, instruction_map, state, is_number=False):
    instruction = instruction_map[symbol]
    submit_hint = "Press each dot in order, then the square button when you want to submit."
    letter_reminder = (
        f"Let's learn the letter {symbol}. It is {instruction}. {submit_hint}"
    )

    if is_number:
        speak(
            f"Let's learn the number {symbol}. First, the number sign: {NUMBER_SIGN_INSTRUCTION}. {submit_hint}"
        )
    else:
        speak(letter_reminder)

    while True:
        if is_number:
            raw = get_dot_input(
                "  [# sign]",
                reminder_when_empty=(
                    f"The number sign is {NUMBER_SIGN_INSTRUCTION}. {submit_hint}"
                ),
                expected_dot_tuple=NUMBER_SIGN,
                order_context_for_message="number sign",
            )
            if raw == "ee":
                return "menu"

            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))

            if dot_tuple != NUMBER_SIGN:
                play_incorrect_feedback()
                state["total_attempts"] += 1
                speak(
                    f"The number sign is {NUMBER_SIGN_INSTRUCTION}. {submit_hint}"
                )
                continue

            play_wav(SOUND_CORRECT)
            speak(f"Now the number {symbol}. It is {instruction}. {submit_hint}")

            raw = get_dot_input(
                f"  [number {symbol}]",
                reminder_when_empty=(
                    f"The number {symbol} is {instruction}. {submit_hint}"
                ),
                expected_dot_tuple=_dot_tuple_for_symbol(symbol, symbol_map),
                order_context_for_message=f"number {symbol}",
            )
            if raw == "ee":
                return "menu"

            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
            result = symbol_map.get(dot_tuple)

        else:
            raw = get_dot_input(
                f"  [{symbol}]",
                reminder_when_empty=letter_reminder,
                expected_dot_tuple=_dot_tuple_for_symbol(symbol, symbol_map),
                order_context_for_message=f"letter {symbol}",
            )
            if raw == "ee":
                return "menu"

            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
            result = symbol_map.get(dot_tuple)

        state["total_attempts"] += 1

        if result == symbol:
            play_wav(SOUND_CORRECT)
            speak("Correct. Let's continue.")
            state["total_correct"] += 1
            save_state(state)
            return "correct"
        else:
            play_incorrect_feedback()
            if is_number:
                speak(f"The number {symbol} is {instruction}. {submit_hint}")
            else:
                speak(f"The letter {symbol} is {instruction}. {submit_hint}")

# ─── Quiz one symbol (practice mode — always moves on) ────────
def quiz_symbol(symbol, symbol_map, instruction_map, state, is_number=False):
    instruction = instruction_map[symbol]
    submit_hint = "Press each dot in order, then the square button when you want to submit."

    if is_number:
        speak(
            f"Quiz: number {symbol}. First, the number sign: {NUMBER_SIGN_INSTRUCTION}. {submit_hint}"
        )
    else:
        speak(f"Quiz: letter {symbol}. It is {instruction}. {submit_hint}")

    if is_number:
        raw = get_dot_input(
            "  [# sign]",
            reminder_when_empty=(
                f"The number sign is {NUMBER_SIGN_INSTRUCTION}. {submit_hint}"
            ),
            expected_dot_tuple=NUMBER_SIGN,
            order_context_for_message="number sign",
        )
        if raw == "ee":
            return "menu"

        sign_correct = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6)) == NUMBER_SIGN
        if sign_correct:
            play_wav(SOUND_CORRECT)
            speak(f"Now the number {symbol}. It is {instruction}. {submit_hint}")
            raw = get_dot_input(
                f"  [number {symbol}]",
                reminder_when_empty=(
                    f"The number {symbol} is {instruction}. {submit_hint}"
                ),
                expected_dot_tuple=_dot_tuple_for_symbol(symbol, symbol_map),
                order_context_for_message=f"number {symbol}",
            )
            if raw == "ee":
                return "menu"
            dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
            result = symbol_map.get(dot_tuple)
            correct = result == symbol
        else:
            correct = False
    else:
        raw = get_dot_input(
            f"  [{symbol}]",
            reminder_when_empty=(
                f"Quiz: letter {symbol}. It is {instruction}. {submit_hint}"
            ),
            expected_dot_tuple=_dot_tuple_for_symbol(symbol, symbol_map),
            order_context_for_message=f"letter {symbol}",
        )
        if raw == "ee":
            return "menu"
        dot_tuple = tuple(1 if str(i + 1) in set(raw) else 0 for i in range(6))
        result = symbol_map.get(dot_tuple)
        correct = result == symbol

    state['total_attempts'] += 1

    if correct:
        play_wav(SOUND_CORRECT)
        speak("Correct.")
        state['total_correct'] += 1
    else:
        play_incorrect_feedback()
        speak(f"The answer was {symbol}. It is {instruction}. {submit_hint}")

    log_practice_result(symbol, correct, state)
    save_state(state)
    return 'done'

# ─── Lessons ──────────────────────────────────────────────────
def run_letter_lesson(lesson_id, letters, state):
    state['current_lesson'] = lesson_id
    save_state(state)
    i = 0
    while i < len(letters):
        result = teach_symbol(letters[i], BRAILLE_MAP, DOT_INSTRUCTIONS, state)
        if result == 'menu':
            return 'menu'
        if result == 'correct':
            if letters[i] not in state['letters_completed']:
                state['letters_completed'].append(letters[i])
            i += 1
    if lesson_id not in state['completed_lessons']:
        state['completed_lessons'].append(lesson_id)
    save_state(state)
    return 'done'

def run_practice_alpha(state):
    state['current_lesson'] = 'practice_alpha'
    save_state(state)
    done = state['letters_completed']
    if not done:
        speak("Learn some letters in an earlier chapter first. Then you can come back here to practice.")
        return 'menu'
    speak("Practice. I will say letters you already know.")
    pool = done.copy()
    random.shuffle(pool)
    print("\n[PRACTICE LOG]")
    for letter in pool:
        result = quiz_symbol(letter, BRAILLE_MAP, DOT_INSTRUCTIONS, state)
        if result == 'menu':
            return 'menu'
    results = state.get("practice_results", [])
    session = results[-len(pool):]
    correct_count = sum(1 for r in session if r["correct"])
    print(f"[PRACTICE SUMMARY] {correct_count}/{len(pool)} correct")
    speak(f"Practice is done. You got {correct_count} right out of {len(pool)}.")
    if 'practice_alpha' not in state['completed_lessons']:
        state['completed_lessons'].append('practice_alpha')
    save_state(state)
    return 'done'

def run_number_lesson(lesson_id, numbers, state):
    state['current_lesson'] = lesson_id
    save_state(state)
    if lesson_id == 'numbers_04':
        speak(
            "In Braille, every number starts with a number sign: dots 3, 4, 5, and 6. "
            "You press that number sign, then the number. Each time, press each dot in order, then the square button when you want to submit."
        )
    i = 0
    while i < len(numbers):
        result = teach_symbol(numbers[i], NUMBER_MAP, NUMBER_INSTRUCTIONS, state, is_number=True)
        if result == 'menu':
            return 'menu'
        if result == 'correct':
            if numbers[i] not in state['numbers_completed']:
                state['numbers_completed'].append(numbers[i])
            i += 1
    if lesson_id not in state['completed_lessons']:
        state['completed_lessons'].append(lesson_id)
    save_state(state)
    return 'done'

def run_practice_numbers(state):
    state['current_lesson'] = 'practice_numbers'
    save_state(state)
    done = state['numbers_completed']
    if not done:
        speak("Learn numbers in an earlier chapter first. Then you can come back here to practice.")
        return 'menu'
    speak("Number practice. I will quiz you on numbers you already know.")
    pool = done.copy()
    random.shuffle(pool)
    print("\n[PRACTICE LOG]")
    for number in pool:
        result = quiz_symbol(number, NUMBER_MAP, NUMBER_INSTRUCTIONS, state, is_number=True)
        if result == 'menu':
            return 'menu'
    results = state.get("practice_results", [])
    session = results[-len(pool):]
    correct_count = sum(1 for r in session if r["correct"])
    print(f"[PRACTICE SUMMARY] {correct_count}/{len(pool)} correct")
    speak(f"Practice is done. You got {correct_count} right out of {len(pool)}.")
    if 'practice_numbers' not in state['completed_lessons']:
        state['completed_lessons'].append('practice_numbers')
    save_state(state)
    return 'done'

def run_lesson(idx, state):
    lesson_id = LESSONS[idx]["id"]
    if lesson_id == "intro":
        return run_intro_lesson(state)
    elif lesson_id == "alpha_ac":
        return run_letter_lesson("alpha_ac", list("ABC"), state)
    elif lesson_id == "alpha_df":
        return run_letter_lesson("alpha_df", list("DEF"), state)
    elif lesson_id == "alpha_gi":
        return run_letter_lesson("alpha_gi", list("GHI"), state)
    elif lesson_id == "alpha_aj":
        return run_letter_lesson("alpha_aj", list("ABCDEFGHIJ"), state)
    elif lesson_id == "alpha_kt":
        return run_letter_lesson("alpha_kt", list("KLMNOPQRST"), state)
    elif lesson_id == "alpha_uz":
        return run_letter_lesson("alpha_uz", list("UVWXYZ"), state)
    elif lesson_id == "practice_alpha":
        return run_practice_alpha(state)
    elif lesson_id == "numbers_04":
        return run_number_lesson("numbers_04", list("12345"), state)
    elif lesson_id == "numbers_59":
        return run_number_lesson("numbers_59", list("67890"), state)
    elif lesson_id == "practice_numbers":
        return run_practice_numbers(state)

# ─── Main ─────────────────────────────────────────────────────
def main():
    state = load_state()
    play_wav(SOUND_WELCOME)

    if state["first_time"]:
        speak(
            "Hello and Welcome to Senso. My name is Sen and I will be your teacher."
            " We will be learning Braille together, one step at a time!"
        )
        state["first_time"] = False
        save_state(state)
    else:
        speak("Welcome back. " + SPEAK_MENU_SHORT)

    interrupted = False

    while True:
        current_idx = show_menu(state, interrupted=interrupted)
        interrupted = False
        result = run_lesson(current_idx, state)

        if result == 'menu':
            interrupted = True
            continue

        if result == 'done':
            outcome = lesson_end_prompt(current_idx, state)
            if outcome == 'menu':
                interrupted = False
                continue
            else:
                next_idx = outcome
                result2 = run_lesson(next_idx, state)
                if result2 == 'menu':
                    interrupted = True
                    continue
                if result2 == 'done':
                    outcome2 = lesson_end_prompt(next_idx, state)
                    if outcome2 == 'menu':
                        interrupted = False
                    else:
                        current_idx = outcome2

if __name__ == "__main__":
    main()