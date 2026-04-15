"""
Vibration motor: BCM GPIO 25 — brown control wire, physical pin 22.

Wiring (Senso harness as built):
  • Power: 3V3 (e.g. physical pin 17).
  • Ground: physical pin 34 (or any GND).
  • Control: brown → BCM GPIO 25 (physical pin 22) — drives the transistor; HIGH = motor on.

Override if your build differs (e.g. older docs used GPIO 12 / pin 32):
  export SENSO_VIBRATE_GPIO=12
  export SENSO_VIBRATE_ACTIVE_HIGH=0   # if your driver turns the motor on when GPIO is LOW
  export SENSO_VIBRATE_DEBUG=1           # print each ON/OFF
  export SENSO_VIBRATE_STRENGTH=1.2      # softer (default is stronger; try up to ~3)
  export SENSO_VIBRATE_USE_PWM=1        # PWM drive (200 Hz); some boards behave better
  export SENSO_VIBRATE_PWM_HZ=250        # optional; only with USE_PWM
  export GPIOZERO_PIN_FACTORY=lgpio      # often required on Raspberry Pi 5

Safe to import off-Pi: if GPIO is missing, vibrate_wrong() is a no-op.
"""

import os
import sys
import time
from typing import Optional

VIBRATE_GPIO = int(os.environ.get("SENSO_VIBRATE_GPIO", "25"))

try:
    _st = float(os.environ.get("SENSO_VIBRATE_STRENGTH", "1.75"))
except ValueError:
    _st = 1.75
VIBRATE_STRENGTH = max(0.5, min(_st, 3.0))

_ah = os.environ.get("SENSO_VIBRATE_ACTIVE_HIGH")
if _ah is None or not str(_ah).strip():
    VIBRATE_ACTIVE_HIGH = True
else:
    VIBRATE_ACTIVE_HIGH = str(_ah).strip().lower() not in ("0", "false", "no", "off")

_db = os.environ.get("SENSO_VIBRATE_DEBUG", "")
VIBRATE_DEBUG = str(_db).strip().lower() in ("1", "true", "yes", "on")

_use_pwm_raw = os.environ.get("SENSO_VIBRATE_USE_PWM", "")
VIBRATE_USE_PWM = str(_use_pwm_raw).strip().lower() in ("1", "true", "yes", "on")

try:
    _pwm_hz = int(os.environ.get("SENSO_VIBRATE_PWM_HZ", "200"))
except ValueError:
    _pwm_hz = 200
VIBRATE_PWM_HZ = max(50, min(_pwm_hz, 2000))

_dev = None
_init_failed = False


def _log(msg: str) -> None:
    if VIBRATE_DEBUG:
        print(f"[VIBRATION] {msg}", flush=True)


def _get_device():
    global _dev, _init_failed
    if _init_failed:
        return None
    if _dev is None:
        try:
            if VIBRATE_USE_PWM:
                from gpiozero import PWMOutputDevice

                _dev = PWMOutputDevice(
                    VIBRATE_GPIO,
                    frequency=VIBRATE_PWM_HZ,
                    active_high=VIBRATE_ACTIVE_HIGH,
                    initial_value=0,
                )
                _log(
                    f"ready: PWM BCM {VIBRATE_GPIO} @ {VIBRATE_PWM_HZ} Hz, "
                    f"active_high={VIBRATE_ACTIVE_HIGH}"
                )
            else:
                from gpiozero import OutputDevice

                _dev = OutputDevice(
                    VIBRATE_GPIO,
                    active_high=VIBRATE_ACTIVE_HIGH,
                    initial_value=False,
                )
                _log(
                    f"ready: BCM {VIBRATE_GPIO}, active_high={VIBRATE_ACTIVE_HIGH}"
                )
        except Exception as e:
            print(f"[VIBRATION] disabled: {e}")
            _init_failed = True
            return None
    return _dev


def hardware_check(hold_s: float = 5.0) -> None:
    """Hold the motor line steady for multimeter / wiring checks (run on the Pi)."""
    print("--- Vibration hardware check ---")
    print(f"Python: {sys.version.split()[0]}, platform: {sys.platform}")
    print(
        f"BCM GPIO {VIBRATE_GPIO}, active_high={VIBRATE_ACTIVE_HIGH}, "
        f"pwm={VIBRATE_USE_PWM} ({VIBRATE_PWM_HZ} Hz if pwm)"
    )
    try:
        from gpiozero import Device

        print(f"gpiozero pin factory: {Device.pin_factory!r}")
    except Exception as e:
        print(f"(pin factory: {e})")
    print(
        "\nWiring: 3V3 (e.g. pin 17), brown → GPIO25 (pin 22), GND pin 34."
    )
    print(
        "If the square button (GPIO 23) works in this demo but the motor does not:\n"
        "  the Pi + gpiozero are fine — focus on the motor driver, brown/GPIO25 (pin 22), and voltage.\n"
        "  Coin motors often need 5 V on the motor + rail (still switched by a transistor); "
        "3.3 V from pin 17 is often too weak to feel.\n"
    )
    print(
        "Try next (one at a time or combined):\n"
        "  SENSO_VIBRATE_ACTIVE_HIGH=0   # if the transistor turns on when GPIO is LOW\n"
        "  SENSO_VIBRATE_USE_PWM=1       # PWM instead of steady HIGH\n"
        "  Pi 5:  sudo apt install python3-lgpio && export GPIOZERO_PIN_FACTORY=lgpio\n"
    )
    d = _get_device()
    if d is None:
        print("GPIO did not initialize — fix the error above (permissions, factory, pin in use).")
        return
    print(f"Line goes ON for {hold_s:.0f} s starting in 2 s… (meter DC: physical pin 22 / BCM25 vs GND)\n")
    time.sleep(2.0)
    _log("ON (hardware check)")
    d.on()
    time.sleep(0.05)
    try:
        v_on = d.value
        print(f"While ON: gpiozero .value = {v_on!r} (motor driver should see a change vs idle)\n")
    except Exception as e:
        print(f"(could not read .value: {e})\n")
    time.sleep(max(0.0, hold_s - 0.05))
    _log("OFF")
    d.off()
    time.sleep(0.02)
    try:
        print(f"After OFF: gpiozero .value = {d.value!r}\n")
    except Exception:
        pass
    print(
        "Done. Interpretation:\n"
        "  • Meter on pin 22 (GPIO25) vs GND changes during ON → Pi is driving; no buzz → motor/supply/driver.\n"
        "  • Meter does not change but .value shows ON → probe pin 22 / BCM25 or check overlay/alt mode.\n"
        "  • .value stays 0 while ON → try SENSO_VIBRATE_ACTIVE_HIGH=0 or USE_PWM=1.\n"
    )


def vibrate_wrong(pulses=2, on_s=None, off_s=None):
    """Two short buzzes for incorrect feedback (default).

    Longer ON times feel stronger (same peak voltage, more energy per buzz).
    Override with on_s/off_s, or tune globally with SENSO_VIBRATE_STRENGTH.
    """
    if on_s is None:
        on_s = 0.22 * VIBRATE_STRENGTH
    if off_s is None:
        off_s = max(0.05, 0.10 - 0.02 * (VIBRATE_STRENGTH - 1.0))
    d = _get_device()
    if d is None:
        return
    for _ in range(pulses):
        _log("ON")
        d.on()
        time.sleep(on_s)
        _log("OFF")
        d.off()
        time.sleep(off_s)


def vibrate_test(hold_s: Optional[float] = None):
    """Single test pulse (for demo_vibrate.py)."""
    if hold_s is None:
        hold_s = 0.65 * VIBRATE_STRENGTH
    d = _get_device()
    if d is None:
        print("Motor not available (not on Pi or GPIO busy).")
        return
    _log(f"ON for {hold_s}s")
    d.on()
    time.sleep(hold_s)
    _log("OFF")
    d.off()


def vibrate_long(hold_s: Optional[float] = None):
    """Longer buzz so a weak motor or 3.3 V supply is easier to notice."""
    if hold_s is None:
        hold_s = 2.0 * VIBRATE_STRENGTH
    vibrate_test(hold_s=hold_s)
