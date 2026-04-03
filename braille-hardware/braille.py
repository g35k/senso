import os
import json
import random
import pygame
import time
from gtts import gTTS

# ─── TTS ─────────────────────────────────────────────────────
def speak(text):
    print(f"[SPEAK] {text}")
    tts = gTTS(text=text, lang='en', tld='co.uk')
    tts.save("_tts_out.mp3")
    speed = 1.25  
    os.system(f'ffmpeg -y -i _tts_out.mp3 -filter:a "atempo={speed}" _tts_fast.mp3 -loglevel quiet')
    play_mp3("_tts_fast.mp3")

def play_mp3(filename):
    pygame.mixer.init()
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        time.sleep(0.02)
# ─── Audio ────────────────────────────────────────────────────
def play_wav(filename):
    try:
        pygame.mixer.init()
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

# ─── Lesson List ──────────────────────────────────────────────
LESSONS = [
    {"id": "intro",            "name": "Intro Chapter: Getting to know your tool"},
    {"id": "alpha_aj",         "name": "Chapter 1, Lesson 1: Letters A to J"},
    {"id": "alpha_kt",         "name": "Chapter 1, Lesson 2: Letters K to T"},
    {"id": "alpha_uz",         "name": "Chapter 1, Lesson 3: Letters U to Z"},
    {"id": "practice_alpha",   "name": "Chapter 1, Lesson 4: Practicing all the letters"},
    {"id": "numbers",          "name": "Chapter 1, Lesson 5: Numbers 0 to 4"},
    {"id": "numbers",          "name": "Chapter 1, Lesson 5: Numbers 5 to 9"},
    {"id": "practice_numbers", "name": "Chapter 1, Lesson 6: Practicing all the numbers"},
]

def lesson_name(idx):
    return LESSONS[idx]["name"] if 0 <= idx < len(LESSONS) else ""

def lesson_index_by_id(lesson_id):
    for i, l in enumerate(LESSONS):
        if l["id"] == lesson_id:
            return i
    return 0

# ─── State ────────────────────────────────────────────────────
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_state.json")

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            s = json.load(f)
        for k, v in (
            ("api_target", "A"),
            ("api_quiz_score", 0),
            ("api_quiz_attempts", 0),
            ("api_last_result", None),
            ("api_last_decoded", None),
            ("api_last_pattern", None),
        ):
            if k not in s:
                s[k] = v
        return s
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
    'A': 'dot 1',
    'B': 'dots 1 and 2',
    'C': 'dots 1 and 4',
    'D': 'dots 1, 4, and 5',
    'E': 'dots 1 and 5',
    'F': 'dots 1, 4, and 2',
    'G': 'dots 1, 4, 2, and 5',
    'H': 'dots 1, 2, and 5',
    'I': 'dots 4 and 2',
    'J': 'dots 4, 2, and 5',
    'K': 'dots 1 and 3',
    'L': 'dots 1, 2, and 3',
    'M': 'dots 1, 4, and 3',
    'N': 'dots 1, 4, 5, and 3',
    'O': 'dots 1, 5, and 3',
    'P': 'dots 1, 4, 2, and 3',
    'Q': 'dots 1, 4, 2, 5, and 3',
    'R': 'dots 1, 2, 5, and 3',
    'S': 'dots 4, 2, and 3',
    'T': 'dots 4, 2, 5, and 3',
    'U': 'dots 1 and 3 and 6',
    'V': 'dots 1, 2, 3, and 6',
    'W': 'dots 4, 2, 5, and 6',
    'X': 'dots 1, 4, 3, and 6',
    'Y': 'dots 1, 4, 5, 3, and 6',
    'Z': 'dots 1, 5, 3, and 6',
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
    '1': 'dot 1',
    '2': 'dots 1 and 2',
    '3': 'dots 1 and 4',
    '4': 'dots 1, 4, and 5',
    '5': 'dots 1 and 5',
    '6': 'dots 1, 4, and 2',
    '7': 'dots 1, 4, 2, and 5',
    '8': 'dots 1, 2, and 5',
    '9': 'dots 4 and 2',
    '0': 'dots 4, 2, and 5',
}

# ─── Input Helpers ────────────────────────────────────────────
def parse_dots(raw):
    dots = [0,0,0,0,0,0]
    for ch in raw:
        if ch in '123456':
            dots[int(ch)-1] = 1
    return tuple(dots)

def validate_dot_order(raw):
    CORRECT_ORDER = '142536'
    digits = [ch for ch in raw if ch in '123456']
    if not digits:
        return False, "No braille buttons entered. Press the buttons on the circle buttons then the square button to submit."
    correct_sequence = [d for d in CORRECT_ORDER if d in digits]
    if digits != correct_sequence:
        play_wav(SOUND_INCORRECT)
        return False, f"Your answer is close, but the buttons were pressed out of order. Try to press the buttons starting left to right. You pressed {', '.join(digits)}, try pressing them as {', '.join(correct_sequence)}."
    if len(digits) != len(set(digits)):
        play_wav(SOUND_INCORRECT)
        return False, "You pressed the same button more than once. Try again."
    return True, ""

def get_dot_input(prompt, valid_commands=('ee',)):
    while True:
        raw = input(prompt).strip().lower()
        if raw in valid_commands:
            return raw
        if all(ch in '123456' for ch in raw) and len(raw) > 0:
            valid, err = validate_dot_order(raw)
            if not valid:
                speak(err)
                continue
            return raw
        play_wav(SOUND_INCORRECT)
        speak("Invalid input. Press your circle braille buttons to enter an answer. Press the square button once to submit, or double press to return to the menu.")

def get_menu_input(prompt):
    while True:
        raw = input(prompt).strip().lower()
        if raw in ('n', 'b', 'e', ''):
            return raw if raw != '' else 'e'
        play_wav(SOUND_INCORRECT)
        speak("Use the arrow button to scroll through lessons, or press the square button to select.")

# ─── Menu ─────────────────────────────────────────────────────
def show_menu(state, interrupted=False):
    if interrupted:
        speak("You are on the menu. Please select a lesson to start.")
    else:
        speak("Please select a lesson to start.")

    idx = 0
    speak(lesson_name(idx))

    while True:
        raw = get_menu_input("  [n=next  b=back  e=select]: ")

        if raw == 'n':
            idx = (idx + 1) % len(LESSONS)
            speak(lesson_name(idx))

        elif raw == 'b':
            if idx == 0:
                speak("You are already at the first lesson.")
            else:
                idx -= 1
                speak(lesson_name(idx))

        elif raw == 'e':
            play_wav(SOUND_LESSON)
            speak("Let's begin!")
            return idx

# ─── After lesson: announce next + wait ───────────────────────
def lesson_end_prompt(current_idx, state):
    next_idx = current_idx + 1
    if next_idx >= len(LESSONS):
        speak("You have completed all lessons. Amazing work!")
        return 'menu'
    speak(f"Great job! Up next: {lesson_name(next_idx)}. Press the square button to start, or double press the square to go back to the menu.")
    while True:
        raw = input("  [e=start next  ee=menu]: ").strip().lower()
        if raw in ('e', ''):
            return next_idx
        elif raw == 'ee':
            return 'menu'
        else:
            play_wav(SOUND_INCORRECT)
            speak("Press the square button to start the next lesson, or double press the square to return to the menu.")

# ─── Teach one symbol (learn mode — loops until correct) ──────
def teach_symbol(symbol, symbol_map, instruction_map, state, is_number=False):
    instruction = instruction_map[symbol]

    if is_number:
        speak(f"The number {symbol}. Step 1 is the number sign: {NUMBER_SIGN_INSTRUCTION}. Give it a try!")
    else:
        speak(f"The letter {symbol} is {instruction}. Give it a try!")

    while True:
        if is_number:
            raw = get_dot_input("  [# sign - press dots, square to submit, ee=menu]: ")
            if raw == 'ee':
                return 'menu'

            if parse_dots(raw) != NUMBER_SIGN:
                play_wav(SOUND_INCORRECT)
                state['total_attempts'] += 1
                speak(f"Not quite. The number sign is {NUMBER_SIGN_INSTRUCTION}. Try again.")
                continue

            play_wav(SOUND_CORRECT)
            speak(f"Good! Now Step 2: the number {symbol}. {instruction}. Give it a try!")

            raw = get_dot_input(f"  [number {symbol} - press dots, square to submit, ee=menu]: ")
            if raw == 'ee':
                return 'menu'

            dot_tuple = parse_dots(raw)
            result = symbol_map.get(dot_tuple)

        else:
            raw = get_dot_input(f"  [{symbol}] press dots, square to submit, ee=menu: ")
            if raw == 'ee':
                return 'menu'

            dot_tuple = parse_dots(raw)
            result = symbol_map.get(dot_tuple)

        state['total_attempts'] += 1

        if result == symbol:
            play_wav(SOUND_CORRECT)
            speak("Correct! Moving on.")
            state['total_correct'] += 1
            save_state(state)
            return 'correct'
        else:
            play_wav(SOUND_INCORRECT)
            if is_number:
                speak(f"Not quite. The number {symbol}. Step 1: number sign, {NUMBER_SIGN_INSTRUCTION}. Step 2: {instruction}. Give it a try!")
            else:
                speak(f"Not quite. The letter {symbol} is {instruction}. Give it a try!")

# ─── Quiz one symbol (practice mode — always moves on) ────────
def quiz_symbol(symbol, symbol_map, instruction_map, state, is_number=False):
    instruction = instruction_map[symbol]

    if is_number:
        speak(f"Try the number {symbol}.")
    else:
        speak(f"Try the letter {symbol}.")

    if is_number:
        raw = get_dot_input("  [# sign - press dots, square to submit, ee=menu]: ")
        if raw == 'ee':
            return 'menu'

        sign_correct = parse_dots(raw) == NUMBER_SIGN
        if sign_correct:
            play_wav(SOUND_CORRECT)
            speak("Good! Now the number.")
            raw = get_dot_input(f"  [number {symbol} - press dots, square to submit, ee=menu]: ")
            if raw == 'ee':
                return 'menu'
            dot_tuple = parse_dots(raw)
            result = symbol_map.get(dot_tuple)
            correct = result == symbol
        else:
            correct = False
    else:
        raw = get_dot_input(f"  [{symbol}] press dots, square to submit, ee=menu: ")
        if raw == 'ee':
            return 'menu'
        dot_tuple = parse_dots(raw)
        result = symbol_map.get(dot_tuple)
        correct = result == symbol

    state['total_attempts'] += 1

    if correct:
        play_wav(SOUND_CORRECT)
        speak("Correct!")
        state['total_correct'] += 1
    else:
        play_wav(SOUND_INCORRECT)
        speak(f"The answer was {symbol}. {instruction}.")

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
        speak("You haven't learned any letters yet. Please complete a lesson first.")
        return 'menu'
    speak("Practice time! I will go through the letters you have learned.")
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
    speak(f"Practice complete! You got {correct_count} out of {len(pool)} correct.")
    if 'practice_alpha' not in state['completed_lessons']:
        state['completed_lessons'].append('practice_alpha')
    save_state(state)
    return 'done'

def run_number_lesson(state):
    state['current_lesson'] = 'numbers'
    save_state(state)
    speak("In braille, every number starts with the number sign: dots 3, 4, 5, and 6. You will press it before every number.")
    numbers = list(NUMBER_MAP.values())
    i = 0
    while i < len(numbers):
        result = teach_symbol(numbers[i], NUMBER_MAP, NUMBER_INSTRUCTIONS, state, is_number=True)
        if result == 'menu':
            return 'menu'
        if result == 'correct':
            if numbers[i] not in state['numbers_completed']:
                state['numbers_completed'].append(numbers[i])
            i += 1
    if 'numbers' not in state['completed_lessons']:
        state['completed_lessons'].append('numbers')
    save_state(state)
    return 'done'

def run_practice_numbers(state):
    state['current_lesson'] = 'practice_numbers'
    save_state(state)
    done = state['numbers_completed']
    if not done:
        speak("You haven't learned any numbers yet. Please complete the numbers lesson first.")
        return 'menu'
    speak("Number practice! I will go through the numbers you have learned.")
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
    speak(f"Practice complete! You got {correct_count} out of {len(pool)} correct.")
    if 'practice_numbers' not in state['completed_lessons']:
        state['completed_lessons'].append('practice_numbers')
    save_state(state)
    return 'done'

def run_lesson(idx, state):
    lesson_id = LESSONS[idx]["id"]
    if lesson_id == "intro":
        state['current_lesson'] = 'intro'
        if 'intro' not in state['completed_lessons']:
            state['completed_lessons'].append('intro')
        save_state(state)
        speak("Introduction: Learning the 6-cell grid.")
        return 'done'
    elif lesson_id == "alpha_aj":
        return run_letter_lesson("alpha_aj", list("ABCDEFGHIJ"), state)
    elif lesson_id == "alpha_kt":
        return run_letter_lesson("alpha_kt", list("KLMNOPQRST"), state)
    elif lesson_id == "alpha_uz":
        return run_letter_lesson("alpha_uz", list("UVWXYZ"), state)
    elif lesson_id == "practice_alpha":
        return run_practice_alpha(state)
    elif lesson_id == "numbers":
        return run_number_lesson(state)
    elif lesson_id == "practice_numbers":
        return run_practice_numbers(state)

# ─── Main ─────────────────────────────────────────────────────
def main():
    state = load_state()
    play_wav(SOUND_WELCOME)

    if state["first_time"]:
        speak("Welcome to Senso! I'm your teacher, Sen . I will be guiding you through all your lessons. Let's get started.")
        state["first_time"] = False
        save_state(state)
    else:
        speak("Welcome back to Senso!")

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